// Officer portal — enforcement dashboard for the vision pipeline.
// Analytics overview · new inspection (with calibration + offline queue) ·
// repository of scans with full reports and notice generation.

import { useMemo, useState, useEffect } from "react";
import { useAction, useMutation, useQuery } from "@/lib/convex-client";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Gavel,
  Loader2,
  RefreshCcw,
  ScanLine,
  Upload,
  WifiOff,
  Sparkles,
  Database,
  Trash2,
  LogOut,
  Activity,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { LocationSelector } from "@/components/location-selector";
import { ViolationHeatmapModal } from "@/components/violation-heatmap";
import { GroundingPanel } from "@/components/grounding-panel";
import {
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalysisReport, StatusChip } from "@/components/report-view";
import {
  acquireGeotag,
  decodeBarcode,
  enqueueOfflineScan,
  prepareCapture,
  queueCount,
  syncOfflineQueue,
  type PreparedCapture,
} from "@/lib/scan-client";
import { EXAMPLE_CASES } from "@/lib/specimens";

const DECISION_COLORS: Record<string, string> = {
  PASS: "#10b981",
  FAIL: "#ef4444",
  REVIEW: "#f59e0b",
};

function ConsumerOverview({ onViewRepository }: { onViewRepository?: () => void }) {
  const analytics = useQuery(api.scans.analytics, { portalRole: "consumer" });

  if (!analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "My Total Scans", value: analytics.total },
    { label: "Compliant Products", value: analytics.pass },
    { label: "Non-compliant Found", value: analytics.fail },
    { label: "Needs review", value: analytics.review },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-none shadow-soft rounded-3xl bg-card overflow-hidden relative">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              c.label.includes('Compliant Products') ? 'bg-green-500' :
              c.label.includes('Non-compliant') ? 'bg-red-500' :
              c.label.includes('review') ? 'bg-amber-500' :
              'bg-[var(--pastel-green-fg)]'
            }`} />
            <CardContent className="p-6 pl-7">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{c.label}</p>
              <p className="text-4xl font-serif font-bold tracking-tight">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center py-10 bg-muted/20 rounded-3xl border border-border/50">
        <h3 className="font-serif text-xl font-bold mb-2">Want to see all your scans?</h3>
        <Button onClick={onViewRepository} variant="outline" className="rounded-full mt-2 border-border/60 hover:bg-muted/40">
          View Scan History <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}

function NewConsumerScan() {
  const navigate = useNavigate();

  const runVision = async (prepared: any) => {
    toast.info("Image captured. Initializing vision analysis...");
    navigate("/scan", { state: { preparedCapture: prepared } });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="border-none shadow-soft rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b px-8 py-6">
          <CardTitle className="flex items-center gap-2 font-serif text-xl">
            <ScanLine className="h-5 w-5 text-[var(--pastel-green-fg)]" /> New Scan
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Scan a packaged product to instantly verify its compliance with Legal Metrology rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 p-8">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-4 py-12 text-center transition-colors hover:bg-muted/40 hover:border-border">
            <div className="rounded-full bg-background p-4 shadow-sm">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">Upload Image</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 10MB</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void prepareCapture(f, "upload").then((p) => runVision(p));
              }}
            />
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--pastel-green)]/40 bg-[var(--pastel-green)]/5 px-4 py-12 text-center transition-colors hover:bg-[var(--pastel-green)]/10 hover:border-[var(--pastel-green)]/60">
            <div className="rounded-full bg-background p-4 shadow-sm text-[var(--pastel-green-fg)]">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-[var(--pastel-green-fg)]">Capture with Camera</p>
              <p className="text-xs text-muted-foreground mt-1">Take a clear photo of the label</p>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void prepareCapture(f, "camera").then((p) => runVision(p));
              }}
            />
          </label>
        </CardContent>
      </Card>
    </div>
  );
}


function AnalyticsOverview({ onViewRepository }: { onViewRepository?: () => void }) {
  const analytics = useQuery(api.scans.analytics, {});

  if (!analytics) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total scans", value: analytics.total },
    { label: "Compliant (PASS)", value: analytics.pass },
    { label: "Non-compliant (FAIL)", value: analytics.fail },
    { label: "Needs review", value: analytics.review },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-none shadow-soft rounded-3xl bg-card overflow-hidden relative">
            {/* Colored left border accent */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              c.label.includes('PASS') ? 'bg-green-500' :
              c.label.includes('FAIL') ? 'bg-red-500' :
              c.label.includes('review') ? 'bg-amber-500' :
              'bg-[var(--pastel-lavender-fg)]'
            }`} />
            <CardContent className="p-6 pl-7">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{c.label}</p>
              <p className="text-4xl font-serif font-bold tracking-tight">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Verdicts Area Chart (Takes up 2 columns) */}
        <Card className="border-none shadow-soft rounded-3xl bg-card lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Activity className="size-5 text-[var(--pastel-lavender-fg)]" /> Verdicts (Last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.byDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tickMargin={10} />
                <ChartTooltip 
                  contentStyle={{borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', background: 'var(--card)'}}
                  itemStyle={{fontSize: '13px', fontWeight: 600}}
                />
                <Area type="monotone" dataKey="pass" stackId="1" stroke="#10b981" strokeWidth={3} fill="url(#colorPass)" />
                <Area type="monotone" dataKey="review" stackId="2" stroke="#f59e0b" strokeWidth={3} fill="url(#colorReview)" />
                <Area type="monotone" dataKey="fail" stackId="3" stroke="#ef4444" strokeWidth={3} fill="url(#colorFail)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compliance Health Score Gauge (Takes 1 column) */}
        <Card className="border-none shadow-soft rounded-3xl bg-card flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <ShieldCheck className="size-5 text-[var(--pastel-green-fg)]" /> Health Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Compliant', value: analytics.complianceRatio },
                      { name: 'Non-Compliant', value: 100 - analytics.complianceRatio }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="var(--muted)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold font-serif tabular-nums text-green-600">{analytics.complianceRatio}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Compliant</span>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-4 leading-relaxed">
              Based on the last 14 days of scanning activity across your jurisdiction.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Most Frequent Violations - Rich List */}
      <Card className="border-none shadow-soft rounded-3xl bg-card">
        <CardHeader className="border-b bg-muted/10 px-6 py-4">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Gavel className="size-5 text-[var(--pastel-red-fg)]" /> Most Frequent Violations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {analytics.violationTypes.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No violations recorded yet.</div>
          ) : (
            <div className="divide-y divide-border/50">
              {analytics.violationTypes.map((v: any, index: number) => (
                <div
                  key={v.category}
                  className="flex items-center justify-between gap-4 p-4 px-6 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                      <AlertTriangle className="size-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{v.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-sm">High Severity</span>
                        <span className="text-xs flex items-center text-muted-foreground">
                          <TrendingUp className="size-3 mr-1 text-amber-500" /> Action required
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold font-serif">{v.count}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Flags</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecentScansSection({ onViewAll }: { onViewAll?: () => void }) {
  const navigate = useNavigate();
  const recentScans = useQuery(api.scans.listScans, {
    limit: 8,
  }) as any[] | undefined;

  return (
    <Card id="recent-scans-section" className="overflow-hidden border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Clock className="h-4 w-4 text-primary" />
            Recent Compliance Scans
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Latest packaged commodity assessments with statutory verdicts and time of capture
          </CardDescription>
        </div>
        {onViewAll && (
          <Button
            id="view-all-repository-btn"
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="h-8 text-xs font-medium text-primary hover:text-primary/80"
          >
            All scans
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {!recentScans ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recentScans.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No compliance scans recorded yet. Use the "New inspection" tab to run a scan.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentScans.map((scan: any) => {
              const formattedDate = new Date(scan.timestamp).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              const productName = scan.productName || "Unidentified Product";
              const brand = scan.brand ? `${scan.brand} — ` : "";
              const fullTitle = `${brand}${productName}`;

              return (
                <div
                  key={scan._id || scan.scanId}
                  id={`recent-scan-${scan.scanId}`}
                  className="flex flex-col gap-3 p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3.5"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {fullTitle}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {scan.scanId}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formattedDate}
                      </span>
                      {scan.category && (
                        <span className="capitalize">
                          {scan.category.replace(/_/g, " ")}
                        </span>
                      )}
                      {scan.geolocation?.state && (
                        <span>
                          {scan.geolocation.district ? `${scan.geolocation.district}, ` : ""}
                          {scan.geolocation.state}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <StatusChip status={scan.decision} />
                    <Button
                      id={`notice-btn-${scan.scanId}`}
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => navigate(`/notice/${scan.scanId}`)}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      Notice
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewInspection() {
  const analyzeAndRecord = useAction(api.vision.analyzeAndRecord);
  const [busy, setBusy] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ dataUrl: string; w: number; h: number } | null>(null);
  const [captured, setCaptured] = useState<PreparedCapture | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [realHeightMm, setRealHeightMm] = useState("");
  const [queued, setQueued] = useState(queueCount());

  const detail = useQuery(
    api.scans.getScanByScanId,
    scanId ? { scanId } : "skip",
  );

  const runVision = async (prep: PreparedCapture, specimenId?: string) => {
    setBusy(true);
    setScanId(null);
    try {
      const barcode = await decodeBarcode(prep.dataUrl);
      const geo = await acquireGeotag();
      const spec = specimenId ? EXAMPLE_CASES.find((c) => c.id === specimenId) : undefined;
      const calibration =
        realHeightMm && prep.height
          ? { realHeightMm: Number(realHeightMm), boundingBoxPixelHeight: prep.height }
          : spec?.calibration;
      const id = await analyzeAndRecord({
        imageDataUrl: prep.dataUrl,
        imageHash: prep.imageHash,
        imageWidth: prep.width,
        imageHeight: prep.height,
        portalRole: "officer",
        source: prep.source,
        geolocation: Object.keys(geo).length ? geo : undefined,
        calibration,
        barcodeOverride: barcode ?? undefined,
        ...(spec
          ? {
              specimenAnalysis: spec.analysis,
              specimenDb: spec.database,
              specimenImage: prep.dataUrl,
            }
          : {}),
      });
      setPending({ dataUrl: prep.dataUrl, w: prep.width, h: prep.height });
      setCaptured(prep);
      setScanId(id);
      toast.success("Inspection recorded");
    } catch (e) {
      // Offline field mode: queue for sync.
      if (!navigator.onLine || (e instanceof Error && /fetch|network/i.test(e.message))) {
        enqueueOfflineScan({
          queuedAt: Date.now(),
          payload: {
            imageDataUrl: prep.dataUrl,
            imageHash: prep.imageHash,
            imageWidth: prep.width,
            imageHeight: prep.height,
            portalRole: "officer",
            source: "offline_sync",
            calibration:
              realHeightMm && prep.height
                ? { realHeightMm: Number(realHeightMm), boundingBoxPixelHeight: prep.height }
                : undefined,
            barcodeOverride: (await decodeBarcode(prep.dataUrl)) ?? undefined,
          },
        });
        setQueued(queueCount());
        toast.info("Offline — scan queued for sync.");
      } else {
        toast.error(e instanceof Error ? e.message : "Analysis failed.");
      }
    } finally {
      setBusy(false);
    }
  };

  const onSync = async () => {
    const { synced, failed } = await syncOfflineQueue((args) => analyzeAndRecord(args));
    setQueued(queueCount());
    toast.info(`Synced ${synced} scan(s)${failed ? `, ${failed} failed` : ""}.`);
  };

  const evidenceUrl = pending?.dataUrl ?? captured?.dataUrl;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-primary" /> New inspection
          </CardTitle>
          <CardDescription>
            Lens-style vision analysis + GTIN lookup + rule engine. Optionally
            calibrate with the real package height to measure Fourth-Schedule
            character heights.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm font-medium hover:bg-muted/50">
            <Upload className="h-5 w-5 text-primary" /> Upload image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void prepareCapture(f, "upload").then((p) => runVision(p));
              }}
            />
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm font-medium hover:bg-muted/50">
            <Camera className="h-5 w-5 text-primary" /> Capture with camera
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void prepareCapture(f, "camera").then((p) => runVision(p));
              }}
            />
          </label>
          <div className="flex flex-col justify-center gap-2">
            <Input
              placeholder="Real package height (mm) — optional calibration"
              inputMode="decimal"
              value={realHeightMm}
              onChange={(e) => setRealHeightMm(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="…or paste image URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <Button
                disabled={busy || !urlInput.trim()}
                onClick={() => {
                  void prepareCapture(urlInput.trim(), "url")
                    .then((p) => runVision(p))
                    .catch((e) => toast.error(e instanceof Error ? e.message : "URL failed."));
                }}
              >
                Go
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {busy && (
        <Card>
          <CardContent className="flex items-center gap-2 py-6 text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Running vision analysis, barcode lookup and rule evaluation…
          </CardContent>
        </Card>
      )}

      {queued > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
            <WifiOff className="h-4 w-4" /> {queued} offline scan{queued > 1 ? "s" : ""} queued
          </p>
          <Button size="sm" variant="outline" onClick={() => void onSync()}>
            <RefreshCcw className="mr-2 h-3.5 w-3.5" /> Sync now
          </Button>
        </div>
      )}

      {!busy && detail && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Inspection Result: {detail.productName || detail.database?.product?.title || "Packaged Commodity"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Scan ID: <span className="font-mono font-medium text-foreground">{detail.scanId}</span>
                  {detail.brand ? ` • Brand: ${detail.brand}` : ""}
                </p>
              </div>
            </div>
            <Button
              id="new-officer-inspection-btn"
              variant="outline"
              size="sm"
              onClick={() => {
                setScanId(null);
                setCaptured(null);
                setPending(null);
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              New inspection
            </Button>
          </div>
          <AnalysisReport doc={detail} imageUrl={detail.imageUrl ?? evidenceUrl} showDebug />
        </div>
      )}
    </div>
  );
}

function Repository({ consumerOnly }: { consumerOnly?: boolean }) {
  const navigate = useNavigate();
  const [decision, setDecision] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const scans = useQuery(api.scans.listScans, {
    portalRole: consumerOnly ? "consumer" : undefined,
    decision: decision as "all" | "PASS" | "FAIL" | "REVIEW",
    category: category,
    search: search || undefined,
    limit: 200,
  }) as any[] | undefined;

  const categories = useMemo(() => {
    const set = new Set((scans ?? []).map((s: any) => s.category));
    return ["all", ...[...set].sort()];
  }, [scans]);
  return (
    <Card className="border-none shadow-soft rounded-3xl bg-card overflow-hidden">
      <CardHeader className="bg-muted/10 border-b pb-4 px-6 pt-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Database className="size-5 text-primary" />
            Compliance History
          </CardTitle>
          <div className="flex gap-3">
            <Select value={decision} onValueChange={setDecision}>
              <SelectTrigger className="w-[140px] rounded-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PASS">Compliant</SelectItem>
                <SelectItem value="FAIL">Non-Compliant</SelectItem>
                <SelectItem value="REVIEW">Needs Review</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[200px] rounded-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Scan Ref</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t">
              {!scans && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
                  </td>
                </tr>
              )}
              {scans?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No scans found.
                  </td>
                </tr>
              )}
              {scans?.map((s: any) => (
                <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{s.scanId.slice(0, 12)}...</td>
                  <td className="px-6 py-4 font-medium">
                    {new Date(s.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`rounded-full px-3 py-1 ${
                      s.decision === "PASS" ? "badge-pass" :
                      s.decision === "FAIL" ? "badge-fail" : "badge-review"
                    }`}>
                      {s.decision}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="rounded-full text-[var(--pastel-lavender-fg)] hover:bg-[var(--pastel-lavender)]/20">
                      <a href={`/notice/${s.scanId}`} target="_blank" rel="noreferrer">
                        View Report <ArrowRight className="ml-2 size-3" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const seed = useMutation(api.scans.seedExampleCases);
  
  // Consumers start on consumer-overview, Officers on overview
  const [tab, setTab] = useState(user?.role === "consumer" ? "consumer-overview" : "overview");
  
  // If user role changes (e.g. log in loads), enforce correct tab
  useEffect(() => {
    if (user?.role === "consumer" && !tab.startsWith("consumer-")) {
      setTab("consumer-overview");
    } else if (user?.role === "officer" && tab.startsWith("consumer-")) {
      setTab("overview");
    }
  }, [user?.role, tab]);
  const [heatmapOpen, setHeatmapOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    provider?: string;
    databaseName?: string;
    connected?: boolean;
    uriConfigured?: boolean;
    totalInspections?: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/database/status")
      .then((r) => r.json())
      .then((d) => setDbStatus(d))
      .catch(() => {});
  }, []);

  const onSeed = async () => {
    try {
      const res = await seed({});
      toast.info(
        "seeded" in res && res.seeded
          ? `Seeded ${res.count} specimen scans.`
          : "Repository already has scans — nothing seeded.",
      );
      setTab("repository");
    } catch {
      toast.error("Seeding failed.");
    }
  };

  const onClear = async () => {
    try {
      localStorage.removeItem("metrosan_scans_v1");
      await fetch("/api/database/clear", { method: "POST" }).catch(() => {});
      toast.success("Repository cleared.");
      window.location.reload();
    } catch {
      toast.error("Could not clear repository.");
    }
  };
  return (
    <div className="flex flex-col h-screen bg-[#fafafa] text-foreground overflow-hidden">
      
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="shrink-0 border-b bg-white/80 backdrop-blur-md z-30 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: logo + location */}
          <div className="flex items-center gap-4 shrink-0">
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <ScanLine className="size-5 text-[var(--pastel-lavender-fg)]" />
              <span className="font-serif text-lg font-bold">ComplyScan</span>
            </div>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <div className="hidden sm:block">
              <LocationSelector />
            </div>
          </div>

          {/* Right: underline tabs + actions */}
          <div className="flex items-center gap-6 shrink-0 h-14">
            <nav className="flex items-end gap-1 h-14">
              {[
                { id: "overview", label: "Analytics", icon: <BarChart3 className="size-4" />, roles: ["officer"] },
                { id: "repository", label: "Repository", icon: <Database className="size-4" />, roles: ["officer"] },
                { id: "inspect", label: "New Inspection", icon: <Camera className="size-4" />, roles: ["officer"] },
                
                { id: "consumer-overview", label: "My Dashboard", icon: <BarChart3 className="size-4" />, roles: ["consumer"] },
                { id: "consumer-repository", label: "Scan History", icon: <Database className="size-4" />, roles: ["consumer"] },
                { id: "consumer-inspect", label: "New Scan", icon: <Camera className="size-4" />, roles: ["consumer"] },
              ].filter(item => item.roles.includes(user?.role || "officer")).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 px-4 h-14 text-sm font-semibold border-b-2 transition-all ${
                    tab === item.id
                      ? "border-[var(--pastel-lavender-fg)] text-[var(--pastel-lavender-fg)]"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="h-5 w-px bg-border hidden sm:block" />

            <div className="flex items-center shrink-0 gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => { signOut(); navigate("/auth"); }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <ViolationHeatmapModal open={heatmapOpen} onOpenChange={setHeatmapOpen} />

      {/* ── PERSONALIZED GREETING STRIP ── */}
      {tab === "overview" && (
        <div className="shrink-0 px-6 pt-6 pb-0 max-w-7xl mx-auto w-full">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--pastel-lavender)]/40 to-[var(--pastel-green)]/30 border border-white/60 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--pastel-lavender-fg)] mb-0.5">Officer Portal</p>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}, Inspector 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => navigate("/scan")}
                className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-sm"
              >
                <Camera className="mr-1.5 h-4 w-4" /> Start Scanning
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHeatmapOpen(true)}
                className="rounded-full font-semibold hidden sm:flex"
              >
                <MapPin className="mr-1.5 h-4 w-4" /> View Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "consumer-overview" && (
        <div className="shrink-0 px-6 pt-6 pb-0 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--pastel-green)]/30 to-[var(--pastel-lavender)]/20 border border-white/60 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--pastel-green-fg)] mb-0.5">Consumer Portal</p>
              <h2 className="font-serif text-2xl font-bold text-foreground">
                Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Protect yourself and others. Scan products to verify compliance.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setTab("consumer-inspect")}
                className="rounded-full bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] hover:bg-[var(--pastel-green)]/90 font-semibold shadow-sm"
              >
                <Camera className="mr-1.5 h-4 w-4" /> Start Scanning
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto w-full">
          {tab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalyticsOverview onViewRepository={() => setTab("repository")} />
            </div>
          )}
          {tab === "repository" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Repository />
            </div>
          )}
          {tab === "inspect" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NewInspection />
            </div>
          )}
          
          {/* CONSUMER TABS */}
          {tab === "consumer-overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ConsumerOverview onViewRepository={() => setTab("consumer-repository")} />
            </div>
          )}
          {tab === "consumer-repository" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Repository consumerOnly />
            </div>
          )}
          {tab === "consumer-inspect" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NewConsumerScan />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
