import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  RefreshCcw,
  Scale,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { optimizeImageForScan, OptimizeResult } from "@/lib/image-optimizer";
import { downloadOfficialPdfReport } from "@/lib/pdf-generator";
import {
  InspectionDetail,
  LEGAL_METROLOGY_DECLARATIONS,
} from "@/types/inspection";
import { LABEL_SAMPLES } from "@/lib/label-samples";
import { ConnectivityStatus } from "@/components/ConnectivityStatus";
import { makeSyntheticLabel } from "@/lib/synthetic-label";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";

const STAGES = [
  "Validating package format & securing encrypted storage…",
  "AI Multimodal Vision transcribing 12 declaration fields…",
  "Rule Engine executing 15 statutory Legal Metrology & FSSAI checks…",
  "Generating 80-word plain English summary for inspection proceedings…",
  "Finalizing digital evidence record & statutory compliance certificate…",
] as const;

export default function Scan() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();

  const [activeTab, setActiveTab] = useState<"declarations" | "rules" | "evidence">("declarations");
  const [busy, setBusy] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [optimizationInfo, setOptimizationInfo] = useState<OptimizeResult | null>(null);
  const [currentInspection, setCurrentInspection] = useState<InspectionDetail | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [selectedEngine, setSelectedEngine] = useState<"auto" | "openai" | "ollama" | "gemini">("auto");
  const [customOpenAiKey, setCustomOpenAiKey] = useState<string>(() => localStorage.getItem("metroscan_openai_key") || "");
  const [customOllamaUrl, setCustomOllamaUrl] = useState<string>(() => localStorage.getItem("metroscan_ollama_url") || "http://127.0.0.1:11434");
  const [showEngineConfig, setShowEngineConfig] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchInspectionById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/inspections/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data: InspectionDetail = await res.json();
        setCurrentInspection(data);
      } else {
        toast.error(`Inspection record ${id} not found.`);
      }
    } catch {
      toast.error("Failed to load inspection record.");
    }
  }, []);

  // Load inspection if paramId is present
  useEffect(() => {
    if (paramId) {
      fetchInspectionById(paramId);
    }
  }, [paramId, fetchInspectionById]);

  const processAndUploadFile = async (rawFile: File) => {
    setBusy(true);
    setStageIndex(0);
    setOptimizationInfo(null);
    setSelectedFieldKey(null);

    const stageTimer = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
    }, 1400);

    try {
      // Step 1: Canvas resize if > 2MB (reduces 10MB to ~400KB in ~50ms)
      const opt = await optimizeImageForScan(rawFile);
      setOptimizationInfo(opt);

      if (opt.resized) {
        toast.info(
          `Auto-optimized for HD Vision: ${(opt.originalSizeKb / 1024).toFixed(1)} MB → ${opt.optimizedSizeKb} KB in ${opt.durationMs}ms`,
          { duration: 4000 }
        );
      }

      // Step 2: Send multipart/form-data to /api/scan
      const formData = new FormData();
      formData.append("image", opt.file);
      formData.append("preferredEngine", selectedEngine);
      if (customOpenAiKey.trim()) {
        formData.append("openaiApiKey", customOpenAiKey.trim());
      }
      if (customOllamaUrl.trim()) {
        formData.append("ollamaBaseUrl", customOllamaUrl.trim());
      }

      // Geolocation capture if available
      try {
        if ("geolocation" in navigator) {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 60000 });
          }).catch(() => null);
          if (pos?.coords) {
            formData.append("latitude", String(pos.coords.latitude));
            formData.append("longitude", String(pos.coords.longitude));
          }
        }
      } catch {
        // Geolocation optional, proceed without blocking
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Server responded with status ${res.status}`);
      }

      const inspection: InspectionDetail = await res.json();
      setCurrentInspection(inspection);
      toast.success("Package analysis and statutory compliance verification complete!");

      // Update URL to /result/:id
      navigate(`/result/${inspection.id}`, { replace: false });

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Visual inspection failed. Please try another angle or photo.");
    } finally {
      clearInterval(stageTimer);
      setBusy(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
    // reset input
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Run a sample test case directly
  const handleRunSpecimen = async (specimenId: string) => {
    try {
      const dataUrl = makeSyntheticLabel(specimenId);
      // convert dataUrl to File
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${specimenId}.png`, { type: "image/png" });
      await processAndUploadFile(file);
    } catch {
      toast.error("Failed to render specimen image");
    }
  };

  const handleDownloadPdf = () => {
    if (!currentInspection) return;
    try {
      downloadOfficialPdfReport(currentInspection);
      toast.success("Official A4 Inspection Certificate PDF generated and downloaded.");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/60 pb-16 text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              id="back-home-btn"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Portal
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold tracking-tight text-slate-900">
                NiriKsha Vision
              </span>
              <Badge variant="outline" className="hidden border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700 sm:inline-flex">
                Legal Metrology Rules, 2011
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectivityStatus compact />
            <Button
              id="header-camera-btn"
              variant="outline"
              size="sm"
              onClick={() => setIsCameraOpen(true)}
              className="h-8 gap-1.5 border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Camera className="h-3.5 w-3.5 text-blue-600" />
              Live Camera
            </Button>
            {currentInspection && (
              <Button
                id="new-scan-top-btn"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentInspection(null);
                  setOptimizationInfo(null);
                  navigate("/scan", { replace: true });
                }}
                className="h-8 gap-1.5 text-xs font-medium"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                New Inspection
              </Button>
            )}
            <Button
              id="dashboard-link-btn"
              variant="ghost"
              size="sm"
              asChild
              className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <Link to="/dashboard">Enforcement Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* If no inspection result yet, show the upload zone */}
        {!currentInspection && !busy && (
          <div className="space-y-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="mb-2 border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800">
                Statutory Compliance Scanner
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Legal Metrology Packaging Inspection
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Upload or capture any packaged product label (JPEG, PNG, WEBP).
                High-resolution images &gt; 2 MB are automatically scaled in 50ms for instant multimodal transcription.
              </p>
            </div>

            {/* AI Vision Model Engine Selector Bar */}
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Vision Model Engine:</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedEngine("auto")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedEngine === "auto"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Auto Cascade
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEngine("openai")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedEngine === "openai"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    OpenAI (GPT-4o)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEngine("ollama")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedEngine === "ollama"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Ollama (llama3.2-vision)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEngine("gemini")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedEngine === "gemini"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Gemini Vision
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEngineConfig(!showEngineConfig)}
                    title="Configure model parameters & keys"
                    className="ml-1 rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Optional Config Accordion */}
              {showEngineConfig && (
                <div className="mt-3.5 space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">
                        OpenAI API Key (Optional Override)
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={customOpenAiKey}
                        onChange={(e) => {
                          setCustomOpenAiKey(e.target.value);
                          localStorage.setItem("metroscan_openai_key", e.target.value);
                        }}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Ollama Base URL (Default: http://127.0.0.1:11434)
                      </label>
                      <input
                        type="text"
                        placeholder="http://127.0.0.1:11434"
                        value={customOllamaUrl}
                        onChange={(e) => {
                          setCustomOllamaUrl(e.target.value);
                          localStorage.setItem("metroscan_ollama_url", e.target.value);
                        }}
                        className="mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 font-mono text-xs focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Keys and endpoints are stored locally in your browser. Server environment variables (OPENAI_API_KEY, OLLAMA_BASE_URL) will be used automatically when available.
                  </p>
                </div>
              )}
            </div>

            {/* Dropzone Card */}
            <Card
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="mx-auto max-w-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center transition-all hover:border-blue-500 hover:shadow-md"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                  <Upload className="h-7 w-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Drag and drop your product packaging photo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supports high-resolution camera photos, box panels, or pouch labels (JPEG, PNG, WEBP)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    id="choose-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 gap-2 bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4" />
                    Select Image File
                  </Button>

                  <Button
                    id="open-camera-btn"
                    variant="outline"
                    onClick={() => setIsCameraOpen(true)}
                    className="h-9 gap-2 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Camera className="h-4 w-4 text-blue-600" />
                    Open Live Camera
                  </Button>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>Images &gt; 2 MB automatically resized to crisp 1920px HD in ~50ms via HTML5 Canvas</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </Card>

            {/* Specimen Presets */}
            <div className="mx-auto max-w-4xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-slate-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Instant Test Library (1-Click Test Scenarios)
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500">Curated legal compliance test cases</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {LABEL_SAMPLES.map((sample) => {
                  const expectedVerdict =
                    sample.id === "muesli" ? "PASS" : sample.id === "chips" ? "REVIEW" : "FAIL";
                  return (
                    <button
                      key={sample.id}
                      id={`specimen-card-${sample.id}`}
                      onClick={() => handleRunSpecimen(sample.id)}
                      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                            {sample.emoji} {sample.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold ${
                              expectedVerdict === "PASS"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : expectedVerdict === "FAIL"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {expectedVerdict}
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-500">
                          {sample.verdictHint}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-blue-600">
                        <span>Run Test Scan</span>
                        <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Processing State with Multi-Stage Progress */}
        {busy && (
          <Card className="mx-auto max-w-xl border-slate-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Analyzing Product Packaging
                </h3>
                <p className="text-xs font-medium text-blue-600">
                  {STAGES[stageIndex]}
                </p>
              </div>

              <div className="w-full space-y-2">
                <Progress value={((stageIndex + 1) / STAGES.length) * 100} className="h-2" />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Stage {stageIndex + 1} of {STAGES.length}</span>
                  <span>{Math.round(((stageIndex + 1) / STAGES.length) * 100)}%</span>
                </div>
              </div>

              {optimizationInfo && optimizationInfo.resized && (
                <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-left text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Zap className="h-3.5 w-3.5 text-emerald-600" />
                    HTML5 Canvas HD Optimization Active
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-700">
                    Reduced from {(optimizationInfo.originalSizeKb / 1024).toFixed(1)} MB to {optimizationInfo.optimizedSizeKb} KB in {optimizationInfo.durationMs}ms ({optimizationInfo.width}×{optimizationInfo.height}px)
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Inspection Result View (Side-by-side Photo beside Extracted Table) */}
        {currentInspection && !busy && (
          <div ref={resultRef} className="space-y-6">
            {/* Top Action & Status Bar */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl font-black ${
                    currentInspection.compliance.status === "COMPLIANT"
                      ? "bg-emerald-100 text-emerald-700"
                      : currentInspection.compliance.status === "PARTIAL_COMPLIANT"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {currentInspection.compliance.status === "COMPLIANT" ? (
                    <ShieldCheck className="h-7 w-7" />
                  ) : currentInspection.compliance.status === "PARTIAL_COMPLIANT" ? (
                    <AlertTriangle className="h-7 w-7" />
                  ) : (
                    <ShieldAlert className="h-7 w-7" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-900">
                      {currentInspection.extractedData.productName || "Inspected Commodity"}
                    </h1>
                    <Badge
                      className={`text-xs font-bold ${
                        currentInspection.compliance.status === "COMPLIANT"
                          ? "bg-emerald-600 text-white"
                          : currentInspection.compliance.status === "PARTIAL_COMPLIANT"
                          ? "bg-amber-500 text-white"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {currentInspection.compliance.status.replace("_", " ")} ({currentInspection.compliance.score}/100)
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                    <span>ID: <strong className="text-slate-700">{currentInspection.id}</strong></span>
                    <span>•</span>
                    <span>Brand: {currentInspection.extractedData.brand || "—"}</span>
                    <span>•</span>
                    <span>{new Date(currentInspection.timestamp).toLocaleString("en-IN")}</span>
                    <span>•</span>
                    <span className="text-blue-600">{currentInspection.aiEngineUsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  id="download-pdf-btn"
                  onClick={handleDownloadPdf}
                  className="h-9 gap-2 bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </Button>

                <Button
                  id="view-printable-report-btn"
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 text-xs text-slate-700"
                >
                  <a href={`/api/inspections/${currentInspection.id}/pdf`} target="_blank" rel="noreferrer">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Print Certificate
                  </a>
                </Button>

                <Button
                  id="notice-action-btn"
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 text-xs text-slate-700"
                >
                  <Link to={`/notice/${currentInspection.id}`}>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                    Compounding Notice
                  </Link>
                </Button>
              </div>
            </div>

            {/* Inspector's 80-Word Summary Card */}
            <Card className="border-l-4 border-l-blue-600 border-slate-200 bg-blue-50/40 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-blue-600 shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                      Inspector's Statutory Findings (Official 80-Word Summary)
                    </h3>
                    <Badge variant="outline" className="border-blue-300 bg-white text-[10px] text-blue-700">
                      Official Statutory Findings
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-700">
                    {currentInspection.inspectorSummary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Critical Violations Callout if non-compliant */}
            {currentInspection.compliance.criticalViolations.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 text-rose-600 shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Critical Statutory Violations Detected ({currentInspection.compliance.criticalViolations.length})
                    </h4>
                    <p className="text-xs text-rose-700">
                      The package fails mandatory Legal Metrology declarations under Section 36(1) of the Act:
                    </p>
                    <ul className="mt-1 list-disc pl-5 text-xs font-semibold text-rose-800">
                      {currentInspection.compliance.criticalViolations.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* SIDE-BY-SIDE GRID: Photo beside Extracted Table */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* LEFT COLUMN: Photo and Visual Inspection (5 cols, sticky on desktop) */}
              <div className="space-y-4 lg:col-span-5">
                <div className="space-y-4 lg:sticky lg:top-20">
                  <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-slate-600" />
                          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Packaging Evidence Photo
                          </CardTitle>
                        </div>
                        <Button
                          id="toggle-zoom-btn"
                          variant="ghost"
                          size="sm"
                          onClick={() => setImageZoom(!imageZoom)}
                          className="h-7 gap-1 px-2 text-[11px] text-slate-500 hover:text-slate-900"
                        >
                          <Maximize2 className="h-3 w-3" />
                          {imageZoom ? "Fit" : "Zoom"}
                        </Button>
                      </div>
                    </CardHeader>

                    <div className="relative flex min-h-[340px] items-center justify-center bg-slate-900/5 p-2">
                      <img
                        src={currentInspection.imageUrl}
                        alt="Scanned Package"
                        className={`rounded-lg object-contain transition-all ${
                          imageZoom ? "max-h-[600px] w-full scale-105" : "max-h-[420px] w-full"
                        }`}
                      />

                      {/* Bounding box / Focused Field Highlight */}
                      {selectedFieldKey && (
                        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-center">
                          <div className="rounded-md border border-blue-400/80 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm">
                            Focusing:{" "}
                            <span className="text-blue-300">
                              {LEGAL_METROLOGY_DECLARATIONS.find((d) => d.id === selectedFieldKey)?.name ||
                                selectedFieldKey}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <CardContent className="border-t border-slate-100 bg-slate-50/30 p-3.5">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[11px] text-slate-400">File Name:</span>
                          <div className="truncate font-mono text-[11px] text-slate-700">
                            {currentInspection.imageFileName}
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400">File Size:</span>
                          <div className="font-mono text-[11px] text-slate-700">
                            {currentInspection.imageSizeKb} KB
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Packaging Image Quality Assessment */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="p-3.5 pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Optical Quality &amp; Legibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5 p-3.5 pt-0 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Readability Score:</span>
                        <span className="font-bold text-slate-800">
                          {currentInspection.extractedData.imageQuality.readabilityScore} / 100
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Lighting:</span>
                        <span className="capitalize font-medium text-slate-700">
                          {currentInspection.extractedData.imageQuality.lighting}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Focus / Blur:</span>
                        <span className="capitalize font-medium text-slate-700">
                          {currentInspection.extractedData.imageQuality.blur}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Specular Glare:</span>
                        <span className="capitalize font-medium text-slate-700">
                          {currentInspection.extractedData.imageQuality.glare}
                        </span>
                      </div>
                      <div className="rounded bg-slate-100 p-2 text-[11px] text-slate-600">
                        {currentInspection.extractedData.imageQuality.overallAssessment}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* RIGHT COLUMN: Extracted Data Table & 15 Rules Audit (7 cols) */}
              <div className="space-y-4 lg:col-span-7">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <TabsList className="bg-slate-100 p-1">
                      <TabsTrigger
                        id="tab-declarations"
                        value="declarations"
                        className="text-xs font-bold data-[state=active]:bg-white"
                      >
                        12 Statutory Declarations (
                        {
                          LEGAL_METROLOGY_DECLARATIONS.filter((field) => {
                            const val = field.getValue(currentInspection.extractedData);
                            const inArray = currentInspection.extractedData.fields?.find(
                              (f) => f.key === field.id || f.key === field.key
                            );
                            return Boolean(
                              (val && val.trim() && val !== "null" && val !== "undefined") ||
                                inArray?.state === "present"
                            );
                          }).length
                        }
                        /12)
                      </TabsTrigger>
                      <TabsTrigger
                        id="tab-rules"
                        value="rules"
                        className="text-xs font-bold data-[state=active]:bg-white"
                      >
                        15 Rules Audit ({currentInspection.compliance.passCount} PASS)
                      </TabsTrigger>
                      <TabsTrigger
                        id="tab-evidence"
                        value="evidence"
                        className="text-xs font-bold data-[state=active]:bg-white"
                      >
                        Digital Audit Snapshot
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {/* TAB 1: 12 STATUTORY DECLARATIONS STRUCTURED TABLE */}
                  <TabsContent value="declarations" className="mt-4 space-y-3">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                      <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Legal Metrology (Packaged Commodities) Rules, 2011 — Mandatory Disclosures
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Verified against Rule 6 statutory declaration requirements. Click any row to focus on the evidence image.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              {
                                LEGAL_METROLOGY_DECLARATIONS.filter((field) => {
                                  const val = field.getValue(currentInspection.extractedData);
                                  const inArray = currentInspection.extractedData.fields?.find(
                                    (f) => f.key === field.id || f.key === field.key
                                  );
                                  return Boolean(
                                    (val && val.trim() && val !== "null" && val !== "undefined") ||
                                      inArray?.state === "present"
                                  );
                                }).length
                              }{" "}
                              Present
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3" />
                              {
                                12 -
                                LEGAL_METROLOGY_DECLARATIONS.filter((field) => {
                                  const val = field.getValue(currentInspection.extractedData);
                                  const inArray = currentInspection.extractedData.fields?.find(
                                    (f) => f.key === field.id || f.key === field.key
                                  );
                                  return Boolean(
                                    (val && val.trim() && val !== "null" && val !== "undefined") ||
                                      inArray?.state === "present"
                                  );
                                }).length
                              }{" "}
                              Missing
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-200 bg-slate-100/75 text-[11px] uppercase tracking-wider text-slate-600">
                            <tr>
                              <th className="px-4 py-2.5 font-bold">Mandatory Declaration</th>
                              <th className="px-4 py-2.5 font-bold">Transcribed Value</th>
                              <th className="px-4 py-2.5 text-center font-bold">Compliance Status</th>
                              <th className="px-3 py-2.5 text-right font-bold">Inspect</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {LEGAL_METROLOGY_DECLARATIONS.map((declaration, index) => {
                              const transcribedValue = declaration.getValue(currentInspection.extractedData);
                              const fieldInArray = currentInspection.extractedData.fields?.find(
                                (f) => f.key === declaration.id || f.key === declaration.key
                              );

                              const hasValue = Boolean(
                                transcribedValue &&
                                  transcribedValue.trim() &&
                                  transcribedValue !== "null" &&
                                  transcribedValue !== "undefined"
                              );
                              const isPresent = hasValue || fieldInArray?.state === "present";
                              const isUnreadable = fieldInArray?.state === "unreadable";
                              const status: "PRESENT" | "MISSING" | "UNREADABLE" = isUnreadable
                                ? "UNREADABLE"
                                : isPresent
                                ? "PRESENT"
                                : "MISSING";
                              const isSelected = selectedFieldKey === declaration.id;

                              return (
                                <tr
                                  key={declaration.id}
                                  id={`declaration-row-${declaration.id}`}
                                  onClick={() => setSelectedFieldKey(isSelected ? null : declaration.id)}
                                  className={`cursor-pointer transition-colors hover:bg-slate-50/90 ${
                                    isSelected ? "bg-blue-50/80" : ""
                                  }`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                        <span>
                                          {index + 1}. {declaration.name}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-medium text-slate-500">
                                        {declaration.statute} • {declaration.description}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {isPresent ? (
                                      <span className="font-mono text-xs font-semibold text-slate-900">
                                        {transcribedValue || fieldInArray?.value}
                                      </span>
                                    ) : isUnreadable ? (
                                      <span className="text-xs italic text-amber-700">
                                        Unreadable / Blurred on packaging
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium italic text-rose-600">
                                        Not declared / Missing
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {status === "PRESENT" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                        <CheckCircle2 className="h-3 w-3" /> PRESENT
                                      </span>
                                    ) : status === "UNREADABLE" ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                        <AlertTriangle className="h-3 w-3" /> UNREADABLE
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                                        <XCircle className="h-3 w-3" /> MISSING
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <Button
                                      id={`inspect-btn-${declaration.id}`}
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFieldKey(isSelected ? null : declaration.id);
                                      }}
                                      className={`h-6 px-2 text-[10px] ${
                                        isSelected
                                          ? "bg-blue-600 text-white hover:bg-blue-700"
                                          : "text-slate-500 hover:text-slate-900"
                                      }`}
                                    >
                                      <Eye className="mr-1 h-3 w-3" />
                                      {isSelected ? "Active" : "Inspect"}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </TabsContent>

                  {/* TAB 2: 15 LEGAL RULES AUDIT */}
                  <TabsContent value="rules" className="mt-4 space-y-3">
                    <div className="space-y-2.5">
                      {currentInspection.compliance.rules.map((rule) => (
                        <Card
                          key={rule.ruleId}
                          className={`border p-3.5 transition-all ${
                            rule.status === "PASS"
                              ? "border-emerald-200 bg-white"
                              : rule.status === "FAIL"
                              ? "border-rose-300 bg-rose-50/40"
                              : rule.status === "REVIEW"
                              ? "border-amber-300 bg-amber-50/40"
                              : "border-slate-200 bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">
                                  {rule.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] font-mono text-slate-600">
                                  {rule.section}
                                </Badge>
                                {rule.critical && (
                                  <Badge className="bg-rose-600 text-[9px] font-bold text-white">
                                    CRITICAL
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {rule.statute} • Weight: {rule.weight} pts
                              </p>
                            </div>

                            <Badge
                              className={`text-[10px] font-bold ${
                                rule.status === "PASS"
                                  ? "bg-emerald-600 text-white"
                                  : rule.status === "FAIL"
                                  ? "bg-rose-600 text-white"
                                  : rule.status === "REVIEW"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-400 text-white"
                              }`}
                            >
                              {rule.status}
                            </Badge>
                          </div>

                          <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-2 text-[11px] sm:grid-cols-2">
                            <div>
                              <span className="font-semibold text-slate-500">Observed On Package:</span>
                              <div className="font-medium text-slate-900 truncate">
                                {rule.observed || "—"}
                              </div>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Statutory Requirement:</span>
                              <div className="font-medium text-slate-700">
                                {rule.required}
                              </div>
                            </div>
                          </div>

                          {rule.penaltyNote && (
                            <div className="mt-2 text-[11px] font-medium text-rose-700">
                              ⚖️ Statutory Note: {rule.penaltyNote}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* TAB 3: DIGITAL AUDIT SNAPSHOT */}
                  <TabsContent value="evidence" className="mt-4 space-y-3">
                    <Card className="border-slate-200 p-4 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Record Metadata &amp; Raw JSON Snapshot
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Immutable record snapshot stored in persistent inspections database.
                      </p>
                      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
                        {JSON.stringify(currentInspection, null, 2)}
                      </pre>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* In-Browser MediaDevices Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(file) => {
          setIsCameraOpen(false);
          processAndUploadFile(file);
        }}
      />
    </main>
  );
}
