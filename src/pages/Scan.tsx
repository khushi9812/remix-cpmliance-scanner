import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router";
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
  ScanLine,
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
import { makeSyntheticLabel } from "@/lib/synthetic-label";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";

const STAGES = [
  "Validating package format & securing encrypted storage…",
  "Multimodal Vision transcribing 12 declaration fields…",
  "Rule Engine executing 15 statutory Legal Metrology & FSSAI checks…",
  "Generating 80-word plain English summary for inspection proceedings…",
  "Finalizing digital evidence record & statutory compliance certificate…",
] as const;

export default function Scan() {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<"declarations" | "rules" | "evidence">("rules");
  const [busy, setBusy] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [optimizationInfo, setOptimizationInfo] = useState<OptimizeResult | null>(null);
  const [currentInspection, setCurrentInspection] = useState<InspectionDetail | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const selectedEngine = "auto";
  const customOpenAiKey = "";
  const customOllamaUrl = "";

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

  useEffect(() => {
    const specimen = searchParams.get("specimen");
    if (specimen && !busy && !currentInspection) {
      // Clear the query param so it doesn't re-trigger on reload randomly
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("specimen");
      navigate({ search: newSearchParams.toString() }, { replace: true });
      
      handleRunSpecimen(specimen);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="rounded-full shadow-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div className="h-5 w-px bg-border" />
            <span 
              onClick={() => navigate("/")}
              className="font-serif text-xl font-bold tracking-tight cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2"
            >
              <ScanLine className="size-5 text-[var(--pastel-lavender-fg)]" />
              ComplyScan
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentInspection && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                className="rounded-full shadow-sm hidden sm:flex border-[var(--pastel-lavender)] text-[var(--pastel-lavender-fg)] hover:bg-[var(--pastel-lavender)]/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCameraOpen(true)}
              className="rounded-full shadow-sm"
            >
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
            {currentInspection && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setCurrentInspection(null);
                  setOptimizationInfo(null);
                  navigate("/scan", { replace: true });
                }}
                className="rounded-full shadow-sm bg-[var(--pastel-green)] text-[var(--pastel-green-fg)] hover:bg-[var(--pastel-green)]/90"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                New Scan
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="rounded-full hidden sm:flex shadow-sm"
            >
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full">
        {!currentInspection && !busy && (
          <div className="mx-auto max-w-4xl w-full px-6 py-12 flex-1 flex flex-col items-center justify-center">
            <div className="text-center mb-10">
              <h1 className="font-serif text-4xl font-bold mb-4">Scan Product</h1>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Upload or capture a product label. The system will instantly verify compliance with Legal Metrology Rules.
              </p>
            </div>

            {/* Engine Settings removed for standard internal branding */}

            {/* Upload Zone */}
            <div 
              onDrop={handleDrop} 
              onDragOver={handleDragOver}
              className="w-full max-w-xl aspect-[16/9] border-2 border-dashed border-border rounded-[2.5rem] bg-muted/20 flex flex-col items-center justify-center hover:bg-muted/30 transition-colors cursor-pointer relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-soft mb-6">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-2">Upload or Drag Image</h3>
              <p className="text-muted-foreground">JPEG, PNG, WEBP</p>
              
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileInputChange}
              />
            </div>
          </div>
        )}

        {busy && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="relative size-32 mb-12">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-[var(--pastel-lavender-fg)] border-t-transparent animate-spin" 
                style={{ animationDuration: '2s' }}
              />
              <ScanLine className="absolute inset-0 m-auto size-12 text-[var(--pastel-lavender-fg)] animate-pulse" />
            </div>
            <h2 className="font-serif text-2xl font-bold mb-4">Processing Package Label</h2>
            <div className="w-full max-w-md bg-muted/30 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="bg-[var(--pastel-lavender)] h-full transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
              />
            </div>
            <p className="text-muted-foreground text-center animate-pulse h-6">
              {STAGES[stageIndex]}
            </p>
          </div>
        )}

        {currentInspection && !busy && (
          <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto py-8 px-6 gap-8" ref={resultRef}>
            {/* Top Section - Scanned Evidence */}
            <div className="w-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl font-bold">Scanned Evidence</h2>
                <Badge variant="outline" className="rounded-full shadow-sm bg-background border-[var(--pastel-lavender)]/30 text-[var(--pastel-lavender-fg)]">
                  <Camera className="mr-2 size-3" /> Source Verified
                </Badge>
              </div>
              
              <div className="relative rounded-[2.5rem] overflow-hidden bg-black/5 dark:bg-white/5 border shadow-inner flex flex-col justify-center max-h-[60vh]">
                {/* Blurred Backdrop Frame */}
                <div 
                  className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none"
                  style={{
                    backgroundImage: `url(${currentInspection.imageUrl})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover'
                  }}
                />
                
                <img 
                  src={currentInspection.imageUrl} 
                  alt="Scanned product"
                  className={`w-full h-auto max-h-[60vh] object-contain transition-transform duration-500 relative z-10 drop-shadow-2xl ${imageZoom ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                  onClick={() => setImageZoom(!imageZoom)}
                />
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4 shrink-0">
                <Card className="rounded-2xl border-none shadow-sm bg-muted/10">
                  <CardContent className="p-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Identified Product</p>
                    <p className="font-serif font-bold text-sm sm:text-base lg:text-lg truncate">
                      {currentInspection.extractedData?.productName || "Unknown Product"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentInspection.extractedData?.brand || "Unknown Brand"}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-sm bg-muted/10">
                  <CardContent className="p-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Barcode</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-sm sm:text-base lg:text-lg">{currentInspection.extractedData?.barcode || "None"}</p>
                      {currentInspection.extractedData?.barcode && <CheckCircle2 className="size-4 text-[var(--pastel-green-fg)]" />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="w-full h-px bg-border/60 my-4" />

            {/* Bottom Section - Analysis Panel */}
            <div className="w-full flex flex-col pb-16">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-2xl font-bold">Analysis Results</h2>
                <div className={`px-4 py-2 rounded-full font-bold text-sm border shadow-sm ${
                  currentInspection.compliance.status === "COMPLIANT" ? "badge-pass" :
                  currentInspection.compliance.status === "NON_COMPLIANT" ? "badge-fail" : "badge-review"
                }`}>
                  {currentInspection.compliance.status.replace("_", " ")}
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/40 p-1 rounded-full shadow-inner">
                  <TabsTrigger value="rules" className="rounded-full font-medium">1. Rule Engine</TabsTrigger>
                  <TabsTrigger value="evidence" className="rounded-full font-medium">2. Executive Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 focus-visible:outline-none">
                  {currentInspection.compliance.rules.map((rule) => {
                    const isFail = rule.status === "FAIL";
                    const isPass = rule.status === "PASS";
                    const isReview = rule.status === "REVIEW";
                    
                    return (
                      <Card
                        key={rule.ruleId}
                        className={`overflow-hidden transition-all border-l-[4px] shadow-sm flex flex-col ${
                          isPass ? "border-l-[var(--pastel-green-fg)] bg-[var(--pastel-green)]/5 border-border" :
                          isFail ? "border-l-[var(--pastel-red-fg)] bg-[var(--pastel-red)]/5 border-[var(--pastel-red)]" :
                          "border-l-[var(--pastel-yellow-fg)] bg-[var(--pastel-yellow)]/5 border-border"
                        }`}
                        onMouseEnter={() => setSelectedFieldKey(rule.ruleId)}
                        onMouseLeave={() => setSelectedFieldKey(null)}
                      >
                        <div className="p-4 flex flex-col h-full">
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <h4 className="font-semibold text-sm text-foreground leading-snug">{rule.name}</h4>
                            <Badge className={`rounded-full capitalize px-2.5 py-0.5 text-[10px] shrink-0 shadow-sm ${
                              isPass ? "badge-pass" : isFail ? "badge-fail" : "badge-review"
                            }`}>
                              {rule.status}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-auto">
                            <p className="line-clamp-2"><span className="font-semibold text-foreground/80 uppercase text-[9px] tracking-wider mr-1.5">Found:</span><span className="font-medium text-foreground">{rule.observed || "Not found"}</span></p>
                            <p className="line-clamp-2"><span className="font-semibold text-foreground/80 uppercase text-[9px] tracking-wider mr-1.5">Rule:</span>{rule.required}</p>
                          </div>

                          {rule.penaltyNote && isFail && (
                            <div className="mt-3 flex gap-2 items-start text-[11px] font-medium text-[var(--pastel-red-fg)] bg-[var(--pastel-red)]/10 p-2.5 rounded-lg border border-[var(--pastel-red)]/20">
                              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                              <span className="leading-snug">{rule.penaltyNote}</span>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </TabsContent>

                <TabsContent value="evidence" className="flex-1 focus-visible:outline-none">
                  <div className="rounded-2xl bg-muted/20 p-6 font-serif text-[15px] leading-relaxed border shadow-soft h-full">
                    <h3 className="font-bold text-lg mb-4 font-sans flex items-center gap-2">
                      <FileText className="size-5 text-[var(--pastel-lavender-fg)]" />
                      Inspector's Assessment Note
                    </h3>
                    {currentInspection.inspectorSummary || "No summary available."}
                    
                    <div className="mt-8 border-t pt-6">
                      <Button onClick={handleDownloadPdf} className="w-full sm:w-auto rounded-full shadow-sm bg-[var(--pastel-lavender)] text-[var(--pastel-lavender-fg)] hover:bg-[var(--pastel-lavender)]/80">
                        <Download className="mr-2 size-4" />
                        Download Official Notice (PDF)
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

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
