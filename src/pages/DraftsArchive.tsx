import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { NirikshaLayout } from "@/components/NirikshaLayout";
import { InspectionDetail } from "@/types/inspection";
import {
  Inbox,
  FileText,
  Clock,
  ChevronRight,
  Download,
  Trash2,
  PlusCircle,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function DraftsArchive() {
  const location = useLocation();
  const navigate = useNavigate();

  const isArchive = location.pathname.includes("reports");
  const [inspections, setInspections] = useState<InspectionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Drafts stored locally or in memory
  const [drafts, setDrafts] = useState([
    {
      id: "DRAFT-2026-092",
      productName: "Sunflower Refined Oil 1L",
      brand: "SunChoice",
      marketLocation: "INA Super Bazaar, New Delhi",
      savedAt: "Today, 18:20 IST",
      imagesAttached: 2,
      notes: "Awaiting clear back-label image to verify consumer care email format.",
    },
    {
      id: "DRAFT-2026-089",
      productName: "Basmati Classic 10kg",
      brand: "Heritage",
      marketLocation: "Khari Baoli Wholesale Market",
      savedAt: "Yesterday, 14:15 IST",
      imagesAttached: 1,
      notes: "Principal Display Panel letter height measurement needed for Rule 9 check.",
    },
  ]);

  useEffect(() => {
    fetch("/api/inspections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.inspections)) {
          setInspections(data.inspections);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    toast.success("Draft inspection removed");
  };

  return (
    <NirikshaLayout
      activeNav={isArchive ? "reports" : "drafts"}
      title="NiriKsha"
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {isArchive ? (
                <>
                  <FileText className="size-5 text-slate-700" />
                  Reports Archive
                </>
              ) : (
                <>
                  <Inbox className="size-5 text-slate-700" />
                  Draft Inspections
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isArchive
                ? "Official statutory inspection certificates, compounding sheets, and verification reports."
                : "Saved partial captures awaiting statutory adjudication or re-calibration."}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/scan")}
            className="bg-[#0c1b33] text-white hover:bg-[#152a4e] text-xs h-8"
          >
            <PlusCircle className="size-3.5 mr-1.5" />
            New Inspection
          </Button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => navigate("/reports")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              isArchive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Generated Reports ({inspections.length})
          </button>
          <button
            type="button"
            onClick={() => navigate("/drafts")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              !isArchive
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            Draft Queue ({drafts.length})
          </button>
        </div>

        {isArchive ? (
          /* Reports Archive List */
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {loading && inspections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading official statutory reports archive...
              </div>
            ) : inspections.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No inspection reports generated yet.
              </div>
            ) : (
              inspections.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/scan/${item.id}`)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        {item.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase ${
                          item.compliance.status === "COMPLIANT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.compliance.status === "NON_COMPLIANT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {item.compliance.status}
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Score: {item.compliance.score}/100
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {item.extractedData.productName || "Packaged Product"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Manufacturer: {item.extractedData.mfgName || "Declared on pack"} • MFD:{" "}
                      {item.extractedData.mfgDate || "N/A"} • MRP:{" "}
                      {item.extractedData.mrp || "N/A"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/notice/${item.id}`);
                      }}
                      className="h-8 text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <Gavel className="size-3 mr-1" />
                      Notice
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success(`Exporting Inspection Report ${item.id} as PDF/JSON...`);
                      }}
                      className="h-8 text-xs text-slate-600"
                    >
                      <Download className="size-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Drafts List */
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => navigate("/scan")}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      {draft.id}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 border-slate-300">
                      Draft in Progress
                    </Badge>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {draft.savedAt}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {draft.productName} ({draft.brand})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Location: {draft.marketLocation} • {draft.imagesAttached} image(s) attached
                  </p>
                  <p className="text-xs text-amber-700 font-medium">
                    Note: {draft.notes}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="h-8 text-xs text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate("/scan")}
                    className="bg-[#0c1b33] text-white hover:bg-[#152a4e] text-xs h-8"
                  >
                    Resume
                    <ChevronRight className="size-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </NirikshaLayout>
  );
}
