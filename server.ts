import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  transcribePackageVision,
  generateInspectorSummary,
  VisionScanOptions,
} from "./backend/ai_service";
import { evaluateCompliance } from "./backend/compliance";
import { saveInspection, getInspectionById, loadInspections, deleteInspection } from "./backend/database";
import { generateHtmlReport } from "./backend/report";
import { InspectionDetail } from "./src/types/inspection";

const PORT = 3000;
let aiClient: GoogleGenAI | null = null;

// Configure uploads directory
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer setup for multipart/form-data
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const unique = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WEBP image formats are supported"));
    }
  },
});

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

function extractCleanErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred";
  const raw = err.message || String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      if (parsed.error.code === 429 || parsed.error.status === "RESOURCE_EXHAUSTED") {
        return "Gemini API quota exceeded or rate limit reached. Please wait a moment before querying.";
      }
      return parsed.error.message;
    }
  } catch {
    // not JSON
  }
  return raw;
}

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));
  app.use("/uploads", express.static(UPLOADS_DIR));

  // 1. Health check & Engine Discovery
  const getEngineConfig = () => ({
    openai: {
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || "gpt-4o",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    },
    ollama: {
      configured: Boolean(process.env.OLLAMA_BASE_URL),
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2-vision",
    },
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-flash-latest / gemini-3.1-flash-lite / gemini-3.8-flash",
    },
    defaultProvider: process.env.AI_PROVIDER || "auto",
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      pipeline: "multi-model-legal-metrology-engine",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      ollamaConfigured: Boolean(process.env.OLLAMA_BASE_URL),
      engines: getEngineConfig(),
      rulesCount: 15,
      version: "3.5.0",
    });
  });

  app.get(["/api/scan/engines", "/scan/engines"], (_req, res) => {
    res.json({
      status: "ok",
      engines: getEngineConfig(),
      supportedEngines: ["auto", "openai", "ollama", "gemini"],
      supportedModels: {
        openai: ["gpt-4o", "gpt-4o-mini"],
        ollama: ["llama3.2-vision", "llama3.2-vision:11b", "llava"],
        gemini: ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"],
      },
    });
  });

  // Multer middleware only for multipart/form-data
  const handleUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.is("multipart/form-data")) {
      return upload.single("image")(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: "UPLOAD_ERROR", message: err.message });
        }
        next();
      });
    }
    next();
  };

  // ---------------------------------------------------------------------------
  // MAIN SCAN PIPELINE: /api/scan & /scan
  // Supports OpenAI (gpt-4o), Ollama (llama3.2-vision), Gemini, or Local Heuristic
  // Accepts multipart/form-data OR JSON payload
  // ---------------------------------------------------------------------------
  const scanHandler = async (req: express.Request, res: express.Response) => {
    try {
      let base64Data = "";
      let mimeType = "image/jpeg";
      let imageFileName = "";
      let imageSizeKb = 0;
      let relativeImageUrl = "";

      if (req.file) {
        // File uploaded via multipart/form-data
        const fileBuffer = fs.readFileSync(req.file.path);
        base64Data = fileBuffer.toString("base64");
        mimeType = req.file.mimetype;
        imageFileName = req.file.filename;
        imageSizeKb = Math.round(req.file.size / 1024);
        relativeImageUrl = `/uploads/${imageFileName}`;
      } else if (req.body?.imageDataUrl || req.body?.imageBase64 || req.body?.image) {
        // Base64 payload provided in JSON body
        const raw = req.body.imageDataUrl || req.body.imageBase64 || req.body.image;
        const match = raw.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          base64Data = raw;
          mimeType = req.body.mimeType || "image/jpeg";
        }
        const ext = mimeType.includes("png") ? ".png" : mimeType.includes("webp") ? ".webp" : ".jpg";
        imageFileName = `scan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        const filePath = path.join(UPLOADS_DIR, imageFileName);
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);
        imageSizeKb = Math.round(buffer.length / 1024);
        relativeImageUrl = `/uploads/${imageFileName}`;
      } else {
        return res.status(400).json({
          error: "INVALID_REQUEST",
          message: "Please upload an image file (multipart/form-data with field 'image') or provide imageDataUrl.",
        });
      }

      // Read scan options (supports OpenAI gpt-4o, Ollama llama3.2-vision, or Gemini)
      const scanOptions: VisionScanOptions = {
        preferredEngine: (req.body?.preferredEngine || req.body?.engine || req.query?.engine) as any,
        openaiApiKey: (req.body?.openaiApiKey || req.headers["x-openai-api-key"]) as string,
        openaiBaseUrl: (req.body?.openaiBaseUrl || req.headers["x-openai-base-url"]) as string,
        openaiModel: (req.body?.openaiModel || req.headers["x-openai-model"]) as string,
        ollamaBaseUrl: (req.body?.ollamaBaseUrl || req.headers["x-ollama-base-url"]) as string,
        ollamaModel: (req.body?.ollamaModel || req.headers["x-ollama-model"]) as string,
      };

      // Step 3: Vision Transcription (OpenAI gpt-4o / Ollama llama3.2-vision / Gemini)
      const visionResult = await transcribePackageVision(base64Data, mimeType, scanOptions);

      // Step 4: Rule Engine Evaluation (15 statutory rules from backend/rules.json)
      const compliance = evaluateCompliance(visionResult.extractedData);

      // Step 5: Plain-Language Explanation (80-word summary for inspectors)
      const inspectorSummary = await generateInspectorSummary(
        visionResult.extractedData,
        compliance,
        scanOptions
      );

      // Step 6: Database Storage (inspections record)
      const now = Date.now();
      const inspectionId = `INSP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const inspectionDetail: InspectionDetail = {
        id: inspectionId,
        timestamp: now,
        createdAt: new Date(now).toISOString(),
        imageFileName,
        imageUrl: relativeImageUrl,
        imageSizeKb,
        extractedData: visionResult.extractedData,
        compliance,
        inspectorSummary,
        aiEngineUsed: visionResult.engineUsed,
      };

      saveInspection(inspectionDetail);

      // Step 7: Response
      return res.status(201).json(inspectionDetail);
    } catch (err: any) {
      console.error("Scan pipeline error:", err);
      return res.status(500).json({
        error: "SCAN_FAILED",
        message: extractCleanErrorMessage(err),
      });
    }
  };

  app.post("/api/scan", handleUpload, scanHandler);
  app.post("/scan", handleUpload, scanHandler);

  // ---------------------------------------------------------------------------
  // INSPECTION RETRIEVAL & LISTING
  // ---------------------------------------------------------------------------
  app.get("/api/inspections", (_req, res) => {
    try {
      const items = loadInspections();
      res.json({
        total: items.length,
        inspections: items,
      });
    } catch (err: any) {
      res.status(500).json({ error: "FAILED_TO_LOAD", message: err.message });
    }
  });

  app.get("/api/inspections/:id", (req, res) => {
    try {
      const item = getInspectionById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "NOT_FOUND", message: "Inspection record not found" });
      }
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: "FAILED_TO_FETCH", message: err.message });
    }
  });

  app.delete("/api/inspections/:id", (req, res) => {
    try {
      const deleted = deleteInspection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "NOT_FOUND" });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "FAILED_TO_DELETE", message: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // OFFICIAL REPORT & PDF GENERATION
  // ---------------------------------------------------------------------------
  app.get("/api/inspections/:id/pdf", (req, res) => {
    try {
      const item = getInspectionById(req.params.id);
      if (!item) {
        return res.status(404).send("Inspection not found");
      }
      const html = generateHtmlReport(item);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch (err: any) {
      res.status(500).send("Report generation failed: " + err.message);
    }
  });

  // ---------------------------------------------------------------------------
  // STAGE 1: AI EXTRACTION (OCR)
  // Powered by Google Gemini Multimodal Vision API (temperature = 0).
  // Sole Responsibility: Answer "WHAT TEXT IS PRINTED ON THIS PACKAGE?"
  // Returns strict JSON matching the ExtractedData schema.
  // Strict Prompt Guardrails: NEVER guess, complete, or infer missing text;
  // return null for anything not clearly visible.
  // The AI is EXPLICITLY FORBIDDEN from judging legal compliance.
  // ---------------------------------------------------------------------------
  app.post("/api/ai/extract", async (req, res) => {
    try {
      const { imageDataUrl, imageBase64, mimeType = "image/jpeg" } = req.body;
      let base64Payload = imageBase64;
      let effectiveMime = mimeType;

      if (!base64Payload && imageDataUrl && typeof imageDataUrl === "string") {
        const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          effectiveMime = match[1];
          base64Payload = match[2];
        } else {
          base64Payload = imageDataUrl;
        }
      }

      if (!base64Payload) {
        return res.status(400).json({ error: "Image data is required for visual extraction" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: "API_KEY_REQUIRED",
          message: "GEMINI_API_KEY is required for Multimodal Vision OCR extraction.",
        });
      }

      const ai = getGeminiClient();
      const prompt = `You are a pure multimodal OCR and visual text extractor.
Your SOLE RESPONSIBILITY is to answer: "WHAT TEXT IS PRINTED ON THIS PACKAGE?"

CRITICAL GUARDRAILS:
1. You are EXPLICITLY FORBIDDEN from judging legal compliance, statutory requirements, pass/fail status, or Legal Metrology rules.
2. NEVER guess, complete, extrapolate, or infer missing text; return null for anything not clearly visible.
3. If text is blurry or partially obscured, set that field's state to "unreadable" and do not guess.
4. Extract only objective facts: brand, product name, variant, category, net quantity, MRP, unit sale price, dates, batch number, manufacturer/packer/importer names and addresses, consumer care contact details, ingredients, FSSAI license, barcode digits.
5. "evidence" must be the exact printed text quoted verbatim as printed on the package.
6. "boundingBox" must be [x, y, w, h] pixel coordinates around that printed declaration when discernible.

Respond with ONLY a JSON object matching this schema:
{
  "brand": string|null,
  "productName": string|null,
  "productVariant": string|null,
  "category": "packaged_food"|"beverage"|"personal_care"|"household_chemical"|"other"|"unknown",
  "categoryConfidence": number,
  "packageType": string|null,
  "productClass": string|null,
  "importedPackage": boolean|null,
  "notForRetailSale": boolean|null,
  "whenPackedDeclaration": boolean|null,
  "innerPackage": boolean|null,
  "manufacturer": string|null,
  "packer": string|null,
  "importer": string|null,
  "manufacturerAddress": string|null,
  "netQuantity": string|null,
  "mrp": string|null,
  "unitSalePrice": string|null,
  "batchNumber": string|null,
  "manufactureDate": string|null,
  "bestBefore": string|null,
  "countryOfOrigin": string|null,
  "consumerCare": string|null,
  "fssaiLicense": string|null,
  "licenseInfo": string|null,
  "ingredients": string|null,
  "barcode": { "value": string|null, "symbology": string|null },
  "fields": [
    {
      "key": string,
      "label": string,
      "value": string,
      "evidence": string,
      "confidence": number,
      "state": "present"|"unreadable",
      "boundingBox": { "x": number, "y": number, "w": number, "h": number }
    }
  ],
  "otherDeclarations": string[],
  "warnings": string[],
  "imageQualityConfidence": number,
  "notes": string|null
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { text: prompt },
          {
            inlineData: {
              data: base64Payload,
              mimeType: effectiveMime,
            },
          },
          { text: "Extract all visible text declarations printed on this package according to the strict ExtractedData schema. Do not judge compliance." },
        ],
        config: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      let extractedData;
      try {
        extractedData = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        extractedData = match ? JSON.parse(match[0]) : { raw: rawText };
      }

      return res.json({
        stage: "STAGE 1: AI EXTRACTION (OCR)",
        engine: "Google Gemini Multimodal Vision API (gemini-3.8-flash, temperature = 0)",
        responsibility: "WHAT TEXT IS PRINTED ON THIS PACKAGE?",
        complianceEvaluatedByAI: false,
        extractedData,
      });
    } catch (err: any) {
      console.error("AI OCR extraction error:", err);
      return res.status(500).json({
        error: "EXTRACTION_FAILED",
        message: extractCleanErrorMessage(err),
      });
    }
  });

  // 2. Google Search Grounding with gemini-3.5-flash
  app.post("/api/grounding/search", async (req, res) => {
    try {
      const { query, commodity, brand, ruleCited } = req.body;
      if (!query && !commodity && !brand) {
        return res.status(400).json({ error: "Search query or commodity details are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: "API_KEY_REQUIRED",
          message:
            "GEMINI_API_KEY is not configured yet. Attach your key in Settings > Secrets to enable live Google Search grounding.",
        });
      }

      const ai = getGeminiClient();
      const prompt = [
        `You are an expert Legal Metrology and consumer protection compliance intelligence assistant in India.`,
        `User query: "${query || `Check latest Legal Metrology rules, MRP circulars, and consumer advisories for ${brand ? `${brand} ` : ""}${commodity || "packaged goods"}`}".`,
        commodity ? `Commodity: ${commodity}` : "",
        brand ? `Brand / Manufacturer: ${brand}` : "",
        ruleCited ? `Specific rule cited: ${ruleCited}` : "",
        `Use Google Search to find current, authoritative information from the Ministry of Consumer Affairs, Legal Metrology divisions, gazette circulars, official manufacturer disclosures, or recent consumer court decisions.`,
        `Provide a concise, practical compliance summary in clean Markdown with key takeaways, statutory references, and any active packaging or labeling exemptions.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "";
      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const searchQueries =
        response.candidates?.[0]?.groundingMetadata?.webSearchQueries ?? [];

      const webSources = rawChunks
        .filter((chunk: any) => chunk.web && chunk.web.uri)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title || chunk.web.uri,
        }));

      return res.json({
        text,
        webSources,
        searchQueries,
      });
    } catch (err: any) {
      console.error("Search Grounding error:", err);
      return res.status(500).json({
        error: "SEARCH_GROUNDING_FAILED",
        message: extractCleanErrorMessage(err),
      });
    }
  });

  // 3. Google Maps Grounding with gemini-3.5-flash
  app.post("/api/grounding/maps", async (req, res) => {
    try {
      const { query, address, brand, latitude, longitude } = req.body;
      if (!query && !address && !brand) {
        return res.status(400).json({ error: "Address, brand or location query is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: "API_KEY_REQUIRED",
          message:
            "GEMINI_API_KEY is not configured yet. Attach your key in Settings > Secrets to enable live Google Maps grounding.",
        });
      }

      const ai = getGeminiClient();
      const prompt = [
        `You are a Legal Metrology field verification assistant locating manufacturing units, corporate packer premises, and regional Legal Metrology / Consumer Affairs offices in India.`,
        `Query / Location request: "${query || `Locate verified address and offices for ${brand ? `${brand} ` : ""}${address || ""}`}".`,
        address ? `Declared label address: ${address}` : "",
        brand ? `Brand / Manufacturer name: ${brand}` : "",
        `Verify whether this manufacturer address corresponds to an active manufacturing plant, registered office, or distribution center. Also identify nearest statutory Legal Metrology inspection offices if relevant.`,
        `Present the results clearly, specifying full addresses, operating status, and landmark indicators.`,
      ]
        .filter(Boolean)
        .join("\n");

      const hasCoordinates =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        !isNaN(latitude) &&
        !isNaN(longitude);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: hasCoordinates
            ? {
                retrievalConfig: {
                  latLng: {
                    latitude,
                    longitude,
                  },
                },
              }
            : undefined,
        },
      });

      const text = response.text || "";
      const rawChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      const mapSources: Array<{
        uri: string;
        title: string;
        placeAnswerSources?: any;
      }> = [];

      for (const chunk of rawChunks as any[]) {
        if (chunk.maps) {
          mapSources.push({
            uri: chunk.maps.uri || "",
            title: chunk.maps.title || "View on Google Maps",
            placeAnswerSources: chunk.maps.placeAnswerSources,
          });
        }
      }

      return res.json({
        text,
        mapSources,
      });
    } catch (err: any) {
      console.error("Maps Grounding error:", err);
      return res.status(500).json({
        error: "MAPS_GROUNDING_FAILED",
        message: extractCleanErrorMessage(err),
      });
    }
  });

  // 4. Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === "GET") {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        next();
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
