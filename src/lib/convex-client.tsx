import React, { useEffect, useState } from "react";
import { getFunctionName } from "convex/server";
import { EXAMPLE_CASES } from "./specimens";
import { evaluate, type EngineResult } from "../convex/ruleEngine";
import { REQUIREMENTS, type VisionAnalysis, type DatabaseLookup } from "../convex/productRules";
import { KB_VERSION } from "../convex/rulesKnowledgeBase";
import { makeSyntheticLabel } from "./synthetic-label";

function getRefName(ref: any): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  try {
    const name = getFunctionName(ref);
    if (typeof name === "string") return name;
  } catch {
    // fallback below
  }
  if (typeof ref === "function") {
    return ref.name || "";
  }
  if (ref && typeof ref === "object") {
    if (typeof ref._functionName === "string") return ref._functionName;
    if (typeof ref.name === "string") return ref.name;
    if (typeof ref.toString === "function") {
      try {
        const s = ref.toString();
        if (typeof s === "string" && s !== "[object Object]") return s;
      } catch {
        // ignore
      }
    }
  }
  return "";
}

export interface ScanDoc {
  _id: string;
  scanId: string;
  timestamp: number;
  imageHash: string;
  imageWidth: number;
  imageHeight: number;
  evidenceStorageId?: string;
  imageUrl?: string;
  portalRole: "consumer" | "officer";
  source: "upload" | "camera" | "url" | "offline_sync";
  geolocation?: {
    lat?: number;
    lng?: number;
    state?: string;
    district?: string;
  };
  calibration?: {
    realHeightMm: number;
    boundingBoxPixelHeight: number;
  };
  analysis: VisionAnalysis;
  database: DatabaseLookup;
  result: EngineResult;
  decision: "PASS" | "FAIL" | "REVIEW";
  brand?: string;
  productName?: string;
  category: string;
  createdAt: number;
  officerId?: string;
}

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  role: "officer" | "consumer";
}

export interface NoticeDraft {
  scanDocId: string;
  scanId: string;
  noticeNo: string;
  generatedAt: number;
  officerId?: string;
  officerName: string;
  subject: string;
  addressee: string;
  body: string[];
  violations: Array<{
    clause: string;
    requirementId?: string;
    observed: string;
    required: string;
    penaltyNote: string;
  }>;
  evidence: Array<{
    label: string;
    imageHash: string;
    imageUrl?: string;
  }>;
  applicableCount: number;
  passCount: number;
  failCount: number;
  reviewCount: number;
  ruleVersion: string;
  kbVersion: string;
}

const DEFAULT_USER: UserDoc = {
  _id: "user_officer_demo",
  name: "Legal Metrology Inspector",
  email: "inspector@lm.gov.in",
  role: "officer",
};

const SCANS_STORAGE_KEY = "metrosan_scans_v1";
const USER_STORAGE_KEY = "metrosan_user_v1";

function loadStoredScans(): ScanDoc[] {
  try {
    const raw = localStorage.getItem(SCANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read stored scans:", err);
  }

  // Seed default scans from specimens
  const seeded: ScanDoc[] = [];
  let i = 0;
  for (const c of EXAMPLE_CASES) {
    const imageHash = `seed${c.id}${i}`.padEnd(24, "0");
    const engine = evaluate(c.analysis, c.database, c.calibration);
    const now = Date.now() - i * 36e5 * 8;
    const base = imageHash.replace(/[^a-f0-9]/gi, "").slice(0, 12);
    const scanId = `SCN-${base.toUpperCase()}-${now.toString(36).toUpperCase()}`;
    let dataUrl: string | undefined;
    try {
      dataUrl = makeSyntheticLabel(c.id);
    } catch {
      dataUrl = undefined;
    }

    seeded.push({
      _id: `scan_doc_${c.id}_${i}`,
      scanId,
      timestamp: now,
      imageHash,
      imageWidth: c.imageWidth,
      imageHeight: c.imageHeight,
      imageUrl: dataUrl,
      portalRole: c.portalRole,
      source: c.source,
      geolocation: { state: c.state, district: c.district },
      calibration: c.calibration,
      analysis: c.analysis,
      database: c.database,
      result: engine,
      decision: engine.decision,
      brand: c.analysis.brand ?? undefined,
      productName: c.analysis.productName ?? undefined,
      category: c.analysis.category,
      createdAt: now,
      officerId: DEFAULT_USER._id,
    });
    i += 1;
  }

  try {
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(seeded));
  } catch (err) {
    console.warn("Could not persist seeded scans:", err);
  }

  return seeded;
}

function loadStoredUser(): UserDoc | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Could not read stored user:", err);
  }
  return DEFAULT_USER;
}

// Event bus for reactivity across hooks
const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

let inMemoryScans: ScanDoc[] = loadStoredScans();
let inMemoryUser: UserDoc | null = loadStoredUser();

function saveScans(scans: ScanDoc[]) {
  inMemoryScans = scans;
  try {
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(scans));
  } catch (e) {
    console.warn("Failed to persist scans to localStorage", e);
  }
  notifyListeners();
}

function saveUser(user: UserDoc | null) {
  inMemoryUser = user;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (e) {
    console.warn("Failed to persist user to localStorage", e);
  }
  notifyListeners();
}

export class ConvexReactClient {
  url: string;
  constructor(url?: string) {
    this.url = url || "https://local.mock.convex";
  }
}

export function ConvexAuthProvider({
  children,
}: {
  client: ConvexReactClient;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function ConvexProvider({
  children,
}: {
  client: ConvexReactClient;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

export function useConvexAuth() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    isLoading: false,
    isAuthenticated: inMemoryUser !== null,
  };
}

export function useAuthActions() {
  return {
    signIn: async (provider: string, formData?: any) => {
      let email = "inspector@lm.gov.in";
      if (formData instanceof FormData) {
        const rawEmail = formData.get("email");
        if (typeof rawEmail === "string" && rawEmail.trim()) {
          email = rawEmail.trim();
        }
      }
      const user: UserDoc = {
        _id: `user_${Date.now()}`,
        name: email.split("@")[0].replace(/[._]/g, " ").toUpperCase() || "Legal Metrology Inspector",
        email,
        role: "officer",
      };
      saveUser(user);
    },
    signOut: async () => {
      saveUser(null);
    },
  };
}

export function useQuery(queryRef: any, args?: any): any {
  const [, setTick] = useState(0);
  useEffect(() => {
    const update = () => setTick((t) => t + 1);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (args === "skip") {
    return undefined;
  }

  // Derive query name from queryRef
  const fnName = getRefName(queryRef);

  // 1. currentUser
  if (fnName.includes("currentUser")) {
    return inMemoryUser;
  }

  // 2. analytics
  if (fnName.includes("analytics")) {
    const all = inMemoryScans;
    const total = all.length;
    const pass = all.filter((s) => s.decision === "PASS").length;
    const fail = all.filter((s) => s.decision === "FAIL").length;
    const review = all.filter((s) => s.decision === "REVIEW").length;

    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const byDay: Array<{ date: string; pass: number; fail: number; review: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const dayStart = today.getTime() - i * dayMs;
      const dayEnd = dayStart + dayMs;
      const dayScans = all.filter((s) => s.timestamp >= dayStart && s.timestamp < dayEnd);
      byDay.push({
        date: new Date(dayStart).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        pass: dayScans.filter((s) => s.decision === "PASS").length,
        fail: dayScans.filter((s) => s.decision === "FAIL").length,
        review: dayScans.filter((s) => s.decision === "REVIEW").length,
      });
    }

    const byRole = {
      consumer: all.filter((s) => s.portalRole === "consumer").length,
      officer: all.filter((s) => s.portalRole === "officer").length,
    };

    const brandCounts = new Map<string, { fail: number; total: number }>();
    for (const s of all) {
      const key = (s.brand ?? s.productName ?? "Unidentified").trim() || "Unidentified";
      const cur = brandCounts.get(key) ?? { fail: 0, total: 0 };
      cur.total += 1;
      if (s.decision === "FAIL") cur.fail += 1;
      brandCounts.set(key, cur);
    }
    const repeatOffenders = [...brandCounts.entries()]
      .map(([brand, c]) => ({ brand, ...c }))
      .sort((a, b) => b.fail - a.fail || b.total - a.total)
      .slice(0, 8);

    const stateMap = new Map<string, Set<string>>();
    for (const s of all) {
      if (s.geolocation?.state) {
        const d = stateMap.get(s.geolocation.state) ?? new Set();
        if (s.geolocation.district) d.add(s.geolocation.district);
        stateMap.set(s.geolocation.state, d);
      }
    }
    const byState = [...stateMap.entries()]
      .map(([state, districts]) => ({ state, districts: districts.size }))
      .sort((a, b) => b.districts - a.districts);

    const violationCounts = new Map<string, number>();
    for (const s of all) {
      for (const r of s.result?.requirements ?? []) {
        if (r.status === "FAIL") {
          const key = r.title ?? r.requirementId;
          violationCounts.set(key, (violationCounts.get(key) ?? 0) + 1);
        }
      }
    }
    const violationTypes = [...violationCounts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      total,
      pass,
      fail,
      review,
      byDay,
      byRole,
      repeatOffenders,
      byState,
      violationTypes,
    };
  }

  // 3. getScanByScanId
  if (fnName.includes("getScanByScanId")) {
    const sId = args?.scanId;
    if (!sId) return undefined;
    return inMemoryScans.find((s) => s.scanId === sId) ?? null;
  }

  // 4. listScans
  if (fnName.includes("listScans")) {
    let list = [...inMemoryScans];
    if (args?.decision && args.decision !== "all") {
      list = list.filter((s) => s.decision === args.decision);
    }
    if (args?.category && args.category !== "all") {
      list = list.filter((s) => s.category.toLowerCase() === args.category.toLowerCase());
    }
    if (args?.search) {
      const q = args.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.scanId.toLowerCase().includes(q) ||
          s.brand?.toLowerCase().includes(q) ||
          s.productName?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => b.createdAt - a.createdAt);
    if (args?.limit) {
      list = list.slice(0, args.limit);
    }
    return list;
  }

  // 5. buildNotice
  if (fnName.includes("buildNotice")) {
    const docId = args?.scanDocId;
    if (!docId) return undefined;
    const scan = inMemoryScans.find((s) => s._id === docId || s.scanId === docId);
    if (!scan) return null;

    const result = scan.result;
    const scanRef = scan.scanId;
    const now = Date.now();
    const seq = (now % 10000).toString().padStart(4, "0");
    const noticeNo = `LM/ENF/${new Date(now).getFullYear()}/${seq}/${scanRef}`;

    const violations = (result?.requirements ?? [])
      .filter((r) => r.status === "FAIL")
      .map((r) => ({
        clause: r.ruleCited,
        requirementId: r.requirementId,
        observed: [r.detected ?? "—", r.reason ?? ""].filter(Boolean).join(" — "),
        required: r.requirement ?? REQUIREMENTS.find((x) => x.id === r.requirementId)?.requirementText ?? "Mandatory declaration per Rule 6(1), Legal Metrology (PC) Rules, 2011",
        penaltyNote: "Non-declaration / incorrect declaration attracts penalties under the Legal Metrology Act, 2009 §36.",
      }));

    const draft: NoticeDraft = {
      scanDocId: scan._id,
      scanId: scanRef,
      noticeNo,
      generatedAt: now,
      officerId: inMemoryUser?._id,
      officerName: inMemoryUser?.name ?? "Inspecting Officer",
      subject: `Notice — non-compliant packaged commodity declarations (Scan ${scanRef})`,
      addressee: scan.brand ? `M/s ${scan.brand}` : "The Manufacturer / Packer / Importer (per panel declaration)",
      body: [
        `Whereas an inspection of the packaged commodity bearing scan reference ${scanRef} was carried out under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011;`,
        `And whereas the applicable declarations were verified with an evidence-anchored rule evaluation against rules knowledge base version ${result?.kbVersion ?? KB_VERSION} — of ${result?.applicableCount ?? 0} applicable requirements, ${result?.passCount ?? 0} passed, ${result?.failCount ?? 0} failed and ${result?.reviewCount ?? 0} could not be reliably determined from the captured image;`,
        "And whereas you are hereby directed to show cause, within 15 days of receipt of this notice, why action should not be initiated against you for the violations listed below;",
        "Take notice that failure to respond within the said period will be construed as non-contestation and proceedings may proceed ex parte.",
      ],
      violations,
      evidence: [
        {
          label: "Label capture (full panel, SHA-256 hashed)",
          imageHash: scan.imageHash,
          imageUrl: scan.imageUrl,
        },
      ],
      applicableCount: result?.applicableCount ?? 0,
      passCount: result?.passCount ?? 0,
      failCount: result?.failCount ?? 0,
      reviewCount: result?.reviewCount ?? 0,
      ruleVersion: result?.appliedRuleVersion ?? "2024-amended",
      kbVersion: result?.kbVersion ?? KB_VERSION,
    };

    return draft;
  }

  // Default fallback
  return undefined;
}

export function useMutation(mutationRef: any) {
  return async (_args?: any): Promise<any> => {
    const fnName = getRefName(mutationRef);

    if (fnName.includes("seedExampleCases")) {
      const scans = loadStoredScans();
      saveScans(scans);
      return { seeded: true, count: scans.length };
    }

    if (fnName.includes("saveReport")) {
      return `report_${Date.now()}`;
    }

    return null;
  };
}

export function useAction(actionRef: any) {
  return async (args: any): Promise<any> => {
    const fnName = getRefName(actionRef);

    if (fnName.includes("analyzeAndRecord")) {
      const now = Date.now();
      const spec = args.specimenAnalysis;
      const db: DatabaseLookup = args.specimenDb ?? {
        product: {
          source: "internal_catalog",
          found: true,
          title: "Packaged Product",
          brand: "Inspected Brand",
          category: "packaged_food",
        },
      };

      let analysis: VisionAnalysis;
      let database: DatabaseLookup;
      const calibration = args.calibration;

      if (spec) {
        analysis = spec;
        database = db;
      } else {
        // Evaluate default commodity rules from client capture
        analysis = {
          brand: "Inspected Brand",
          productName: "Packaged Commodity",
          category: "packaged_food",
          categoryConfidence: 0.95,
          barcode: {
            value: "8901058000016",
            symbology: "EAN-13",
            checksumValid: true,
            prefixRegion: "India",
          },
          imageQualityConfidence: 0.95,
          engine: "vision-evaluator-v3",
          otherDeclarations: [],
          warnings: [],
          fields: [
            { key: "mrp", label: "MRP", value: "₹ 150.00", evidence: "M.R.P. ₹ 150.00 (incl. of all taxes)", confidence: 0.95, state: "present" },
            { key: "netQuantity", label: "Net Quantity", value: "250 g", evidence: "Net Weight 250 g", confidence: 0.96, state: "present" },
            { key: "manufactureDate", label: "Date of Manufacture", value: "02/2026", evidence: "Mfg Date 02/2026", confidence: 0.92, state: "present" },
            { key: "manufacturer", label: "Manufacturer", value: "National Packaged Goods Ltd.", evidence: "Manufactured by National Packaged Goods Ltd.", confidence: 0.9, state: "present" },
            { key: "countryOfOrigin", label: "Country of Origin", value: "India", evidence: "Country of Origin: India", confidence: 0.98, state: "present" },
            { key: "consumerCare", label: "Consumer Care", value: "1800-000-1111", evidence: "Customer Helpline: 1800-000-1111", confidence: 0.94, state: "present" },
          ],
        };
        database = db;
      }

      const engine = evaluate(analysis, database, calibration);
      const hashBase = (args.imageHash || `img_${now}`).replace(/[^a-f0-9]/gi, "").slice(0, 10).padEnd(6, "0");
      const scanId = `SCN-${hashBase.toUpperCase()}-${now.toString(36).toUpperCase()}`;

      const newScan: ScanDoc = {
        _id: `scan_${now}`,
        scanId,
        timestamp: now,
        imageHash: args.imageHash || `hash_${now}`,
        imageWidth: args.imageWidth || 800,
        imageHeight: args.imageHeight || 600,
        imageUrl: args.specimenImage || args.imageDataUrl,
        portalRole: args.portalRole || "consumer",
        source: args.source || "upload",
        geolocation: args.geolocation,
        calibration,
        analysis,
        database,
        result: engine,
        decision: engine.decision,
        brand: analysis.brand ?? undefined,
        productName: analysis.productName ?? undefined,
        category: analysis.category,
        createdAt: now,
        officerId: inMemoryUser?._id,
      };

      saveScans([newScan, ...inMemoryScans]);
      return scanId;
    }

    return null;
  };
}
