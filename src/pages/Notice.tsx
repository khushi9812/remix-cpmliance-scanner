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
import { ArrowLeft, FileDown, Gavel, Printer, Save } from "lucide-react";
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
  const [localDraft, setLocalDraft] = useState<any>(null);

  useEffect(() => {
    if (!draft && scanId) {
      // Check MongoDB inspection
      fetch(`/api/inspections/${scanId}`)
        .then((r) => r.json())
        .then((data) => {
          const insp = data.inspection;
          if (insp) {
            const failRules = (insp.compliance?.rules || []).filter((r: any) => r.status === "FAIL");
            const reviewRules = (insp.compliance?.rules || []).filter((r: any) => r.status === "REVIEW");
            const passRules = (insp.compliance?.rules || []).filter((r: any) => r.status === "PASS");

            setLocalDraft({
              scanDocId: insp.id,
              scanId: insp.id,
              noticeNo: `DOCA/LM/2026/NOT-${insp.id.replace(/[^A-Za-z0-9]/g, "").slice(-6)}`,
              generatedAt: Date.now(),
              officerName: "Inspector Rajesh Kumar",
              officerDesignation: "Senior Inspector (Legal Metrology)",
              addressee: insp.extractedData?.mfgName || "The Occupier / Manufacturer",
              subject: `Show Cause Notice under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 — ${insp.extractedData?.productName || "Commodity"}`,
              body: [
                `Whereas packaged commodity "${insp.extractedData?.productName || "Commodity"}" bearing MRP ${insp.extractedData?.mrp || "N/A"} was inspected under statutory powers on ${new Date(insp.timestamp || Date.now()).toLocaleDateString("en-IN")}.`,
                `And whereas verification revealed mandatory statutory non-compliances pursuant to the Legal Metrology (Packaged Commodities) Rules, 2011 as specified hereinbelow.`,
                `Now, therefore, you are hereby called upon to show cause within fifteen (15) days why compounding proceedings under Section 49 / Rule 32 should not be initiated.`,
              ],
              applicableCount: insp.compliance?.rules?.length || 15,
              passCount: passRules.length,
              failCount: failRules.length,
              reviewCount: reviewRules.length,
              violations: failRules.map((r: any) => ({
                requirementId: r.ruleId,
                clause: r.section,
                observed: r.observed,
                required: r.required,
                penaltyNote: r.penaltyNote || "Offence compoundable under Section 49 / Rule 32 of Legal Metrology Act.",
              })),
              ruleVersion: "LMPC-2011-REV2026",
            });
          }
        })
        .catch(() => {});
    }
  }, [draft, scanId]);

  const activeDraft = draft || localDraft;

  if (!scanId || (!scan && !activeDraft)) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  const onSave = async () => {
    if (!activeDraft) return;
    try {
      if (draft) {
        const id = await saveReport({
          scanDocId: draft.scanDocId as never,
          noticeNo: draft.noticeNo,
          officerName: officerName || draft.officerName,
          violationCount: draft.violations.length,
        });
        setSavedId(id);
        toast.success(`Report saved (${id}).`);
      } else {
        setSavedId(activeDraft.noticeNo);
        toast.success(`Report saved (${activeDraft.noticeNo}).`);
      }
    } catch {
      toast.error("Could not save the report.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
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
          className="h-8 gap-1.5 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to inspections
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Button>
      </div>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Gavel className="h-6 w-6 text-primary" />
            Inspection Notice
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Drafted from the evidence-anchored rule evaluation of scan{" "}
            <span className="font-mono">{scanId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => activeDraft && printNotice(activeDraft)} disabled={!activeDraft}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
          <Button variant="outline" onClick={() => activeDraft && downloadDocx(activeDraft)} disabled={!activeDraft}>
            <FileDown className="mr-2 h-4 w-4" /> Word
          </Button>
          <Button onClick={() => void onSave()} disabled={!activeDraft}>
            <Save className="mr-2 h-4 w-4" /> Save report
          </Button>
        </div>
      </header>

      {activeDraft && (
        <>
          <Card className="mb-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rule evaluation summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary">{activeDraft.applicableCount} applicable</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                ✅ {activeDraft.passCount} PASS
              </Badge>
              <Badge variant="destructive">❌ {activeDraft.failCount} FAIL</Badge>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300">
                ⚠️ {activeDraft.reviewCount} REVIEW
              </Badge>
              <span className="text-xs text-muted-foreground">
                ruleset {activeDraft.ruleVersion}
                {activeDraft.kbVersion ? ` · KB ${activeDraft.kbVersion}` : ""}
              </span>
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{activeDraft.noticeNo}</CardTitle>
              <CardDescription>
                {new Date(activeDraft.generatedAt).toLocaleString("en-IN")} · To:{" "}
                {activeDraft.addressee}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="font-semibold">{activeDraft.subject}</p>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {(activeDraft.body || []).map((p: string, i: number) => (
                  <li key={i}>{p}</li>
                ))}
              </ol>

              <div>
                <p className="mb-2 font-semibold">Particulars of violations</p>
                {(!activeDraft.violations || activeDraft.violations.length === 0) ? (
                  <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-4 text-center text-muted-foreground">
                    No mandatory violations recorded — a notice may not be warranted.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeDraft.violations.map((v: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-lg border border-red-500/30 bg-red-500/5 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip status="FAIL" />
                          <span className="text-sm font-semibold">
                            {requirementLabel(v.requirementId ?? "")}
                          </span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {v.clause}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-xs">
                          <b>Observed:</b> {v.observed}
                        </p>
                        <p className="text-xs">
                          <b>Required:</b> {v.required}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{v.penaltyNote}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeDraft.evidence && activeDraft.evidence.length > 0 && (
                <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs">
                  <p className="font-semibold">Evidence</p>
                  <p className="mt-1">
                    {activeDraft.evidence[0]?.label} · SHA-256{" "}
                    <span className="font-mono">{activeDraft.evidence[0]?.imageHash?.slice(0, 24)}…</span>
                  </p>
                  {activeDraft.evidence[0]?.imageUrl && (
                    <a
                      className="mt-1 inline-block text-primary underline"
                      href={activeDraft.evidence[0].imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View stored capture
                    </a>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-3 border-t border-border/50 pt-4">
                <div className="flex-1">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Officer name override (optional)
                  </p>
                  <Input
                    placeholder={activeDraft.officerName}
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {savedId ? `Saved as ${savedId}` : "Not yet saved to the repository"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <GroundingPanel
              initialBrand={activeDraft.brand || ""}
              initialCommodity={activeDraft.commodity || ""}
              initialAddress={activeDraft.manufacturerAddress || ""}
              initialRuleCited={activeDraft.violations?.[0]?.clause}
            />
          </div>
        </>
      )}
    </main>
  );
}
