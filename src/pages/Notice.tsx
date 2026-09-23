// Notice page — renders the server-generated inspection notice draft for a
// scan, with print (PDF) and Word export. Violations come from the vision
// rule engine's mandatory FAIL results with their exact rule citations.

import { useState } from "react";
import { useMutation, useQuery } from "@/lib/convex-client";
import { useParams, useNavigate } from "react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileDown, Gavel, Printer, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { downloadDocx, printNotice } from "@/lib/notice-doc";
import { requirementLabel } from "@/lib/scan-client";
import { StatusChip } from "@/components/report-view";
import { GroundingPanel } from "@/components/grounding-panel";

export default function Notice() {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  // Resolve the human scanId to the internal document id first.
  const scan = useQuery(
    api.scans.getScanByScanId,
    scanId ? { scanId } : "skip",
  );
  const draft = useQuery(
    api.reports.buildNotice,
    scan ? { scanDocId: scan._id } : "skip",
  );
  const saveReport = useMutation(api.reports.saveReport);

  const [officerName, setOfficerName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);

  if (!scanId || (scan && !draft)) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }
  if (!scan) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading scan {scanId}…
          </CardContent>
        </Card>
      </main>
    );
  }

  const onSave = async () => {
    if (!draft) return;
    try {
      const id = await saveReport({
        scanDocId: draft.scanDocId as never,
        noticeNo: draft.noticeNo,
        officerName: officerName || draft.officerName,
        violationCount: draft.violations.length,
      });
      setSavedId(id);
      toast.success(`Report saved (${id}).`);
    } catch {
      toast.error("Could not save the report.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      {/* Top back navigation */}
      <div className="mb-8 flex items-center justify-between">
        <Button
          id="notice-back-btn"
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/dashboard");
            }
          }}
          className="rounded-full hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <Badge variant="outline" className="mb-3 rounded-full border-[var(--pastel-lavender-fg)] bg-[var(--pastel-lavender)]/10 text-[var(--pastel-lavender-fg)]">
            Official Compliance Report
          </Badge>
          <h1 className="font-serif text-4xl font-bold tracking-tight">
            Inspection Notice
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Record Reference: <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{scanId}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-full shadow-sm" onClick={() => draft && printNotice(draft)} disabled={!draft}>
            <Printer className="mr-2 h-4 w-4 text-muted-foreground" /> Print / PDF
          </Button>
          <Button variant="outline" className="rounded-full shadow-sm" onClick={() => draft && downloadDocx(draft)} disabled={!draft}>
            <FileDown className="mr-2 h-4 w-4 text-muted-foreground" /> Export Word
          </Button>
          <Button className="rounded-full bg-foreground text-background shadow-soft hover:bg-foreground/90" onClick={() => void onSave()} disabled={!draft}>
            <Save className="mr-2 h-4 w-4" /> Save Report
          </Button>
        </div>
      </header>

      {draft && (
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-soft overflow-hidden bg-card">
            <CardHeader className="bg-muted/10 border-b pb-6 px-8 pt-8">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <CardTitle className="font-serif text-2xl mb-1">{draft.noticeNo}</CardTitle>
                  <CardDescription className="text-base">
                    Issued: {new Date(draft.generatedAt).toLocaleString("en-IN")}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider mb-1">To</p>
                  <p className="font-medium text-lg max-w-[250px] truncate">{draft.addressee}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8 text-base">
              <div>
                <p className="font-serif font-bold text-xl mb-4">{draft.subject}</p>
                <ol className="list-decimal space-y-3 pl-5 text-muted-foreground leading-relaxed">
                  {draft.body.map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold mb-4">Rule Evaluation Summary</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="px-4 py-2 text-sm rounded-full">{draft.applicableCount} Evaluated</Badge>
                  <Badge className="badge-pass px-4 py-2 text-sm rounded-full">
                    ✓ {draft.passCount} Compliant
                  </Badge>
                  <Badge className="badge-fail px-4 py-2 text-sm rounded-full">
                    ✕ {draft.failCount} Violations
                  </Badge>
                  <Badge className="badge-review px-4 py-2 text-sm rounded-full">
                    ⚠ {draft.reviewCount} Need Review
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold mb-4">Particulars of Violations</h3>
                {draft.violations.length === 0 ? (
                  <div className="rounded-2xl bg-muted/20 px-6 py-12 text-center border shadow-sm">
                    <CheckCircle2 className="size-8 mx-auto text-[var(--pastel-green-fg)] mb-3" />
                    <p className="text-lg font-medium">Fully Compliant</p>
                    <p className="text-muted-foreground mt-1">No mandatory violations were detected.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {draft.violations.map((v: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl border-2 border-[var(--pastel-red)] bg-[var(--pastel-red)]/5 p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="text-lg font-serif font-bold text-[var(--pastel-red-fg)]">
                            {requirementLabel(v.requirementId ?? "")}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs bg-background">
                            {v.clause}
                          </Badge>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="bg-background rounded-xl p-3 border border-border/50">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Observed</span>
                            <span className="font-medium text-sm">{v.observed}</span>
                          </div>
                          <div className="bg-background rounded-xl p-3 border border-border/50">
                            <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">Requirement</span>
                            <span className="font-medium text-sm">{v.required}</span>
                          </div>
                        </div>
                        <p className="mt-4 text-sm font-medium text-[var(--pastel-red-fg)] flex items-start gap-2">
                          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                          {v.penaltyNote}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-muted/10 p-5 border shadow-sm flex flex-wrap justify-between items-center gap-4">
                <div>
                  <p className="font-serif text-lg font-bold mb-1">Evidence Hash Record</p>
                  <p className="text-sm font-mono text-muted-foreground bg-background px-3 py-1.5 rounded-lg border inline-block">
                    {draft.evidence[0]?.imageHash || "N/A"}
                  </p>
                </div>
                {draft.evidence[0]?.imageUrl && (
                  <Button variant="outline" asChild className="rounded-full bg-background shadow-soft hover:bg-muted">
                    <a href={draft.evidence[0].imageUrl} target="_blank" rel="noreferrer">
                      View Raw Image
                    </a>
                  </Button>
                )}
              </div>

              <div className="border-t pt-8 mt-8">
                <div className="max-w-xs">
                  <label className="block text-sm font-semibold mb-2">Officer Sign-Off</label>
                  <Input
                    placeholder={draft.officerName}
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="rounded-xl bg-muted/20 border-border/50"
                  />
                  {savedId && <p className="text-xs text-[var(--pastel-green-fg)] mt-2 font-medium">✓ Saved successfully</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
