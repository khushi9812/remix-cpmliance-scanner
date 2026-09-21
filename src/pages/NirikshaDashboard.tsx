import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { NirikshaLayout } from "@/components/NirikshaLayout";
import { useInspector } from "@/lib/inspector-store";
import { InspectionDetail } from "@/types/inspection";
import { RegionalComplianceMap } from "@/components/RegionalComplianceMap";
import { SuperdryInspectionConsole } from "@/components/SuperdryInspectionConsole";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Gavel,
  PlusCircle,
  ScanLine,
  ArrowRight,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NirikshaDashboard() {
  const { profile } = useInspector();
  const navigate = useNavigate();

  const [inspections, setInspections] = useState<InspectionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bento" | "map" | "actions" | "registry">("bento");
  const [dbStatus, setDbStatus] = useState<{ databaseName?: string; connected?: boolean } | null>(null);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inspections");
      const data = await res.json();
      if (Array.isArray(data.inspections)) {
        setInspections(data.inspections);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspections();
    fetch("/api/database/status")
      .then((r) => r.json())
      .then((d) => setDbStatus(d))
      .catch(() => {});
  }, [fetchInspections]);

  // Calculate metrics
  const total = inspections.length;

  const actionableInspections = inspections.filter(
    (i) => i.compliance.status === "NON_COMPLIANT" || i.compliance.status === "NEEDS_REVIEW"
  );
  const actionRequiredCount = actionableInspections.length;

  return (
    <NirikshaLayout
      activeNav="home"
      title="NiriKsha"
      variant="neo-industrial"
      hideTopBar={true}
    >
      <main className="w-full">
        {/* Main Superdry-Style Neo-Industrial Specification Console */}
        <SuperdryInspectionConsole
          inspections={inspections}
          onOpenMap={() => setActiveTab("map")}
          onOpenActions={() => setActiveTab("actions")}
          onOpenRegistry={() => setActiveTab("registry")}
        />

        {/* View Switcher Tabs Bar */}
        <div className="max-w-[1440px] mx-auto px-2.5 sm:px-4 md:px-6 pb-6 pt-2">
          <div className="bg-black/70 backdrop-blur-md rounded-[20px] border-2 border-zinc-800 p-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("bento")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                  activeTab === "bento"
                    ? "bg-[#FF4800] text-white shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>Bento Specification</span>
              </button>

              <button
                type="button"
                id="tab-regional-map"
                onClick={() => setActiveTab("map")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                  activeTab === "map"
                    ? "bg-white text-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <MapPin className="size-3.5 text-[#FF4800]" />
                <span>Regional Compliance Map</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {total}
                </span>
              </button>

              <button
                type="button"
                id="tab-actions"
                onClick={() => setActiveTab("actions")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                  activeTab === "actions"
                    ? "bg-white text-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <ClipboardList className="size-3.5" />
                <span>Actionable Queue</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF4800] text-white">
                  {actionRequiredCount}
                </span>
              </button>

              <button
                type="button"
                id="tab-registry"
                onClick={() => setActiveTab("registry")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
                  activeTab === "registry"
                    ? "bg-white text-black shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <FileText className="size-3.5" />
                <span>Registry Database</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {total}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-mono pr-2">
              <span>ACTIVE PROFILE: {profile.id}</span>
              {dbStatus?.connected && (
                <span className="text-emerald-400 font-bold">● DB ONLINE</span>
              )}
            </div>
          </div>

          {/* Tab Content 1: Regional Map */}
          {activeTab === "map" && (
            <div className="mt-4 bg-white rounded-[24px] border-2 border-black p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-base font-black text-black uppercase tracking-tight">
                    Pan-India Legal Metrology Regional Enforcement Map
                  </h3>
                  <p className="text-xs text-zinc-600 font-medium">
                    Geospatial tracking of inspection points, market compliance densities, and jurisdictional divisions.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/scan")}
                  className="bg-black text-white hover:bg-zinc-800 rounded-full text-xs font-bold"
                >
                  <PlusCircle className="size-3.5 mr-1 text-[#FF4800]" />
                  Add Field Scan
                </Button>
              </div>
              <RegionalComplianceMap inspections={inspections} />
            </div>
          )}

          {/* Tab Content 2: Actions Queue */}
          {activeTab === "actions" && (
            <div className="mt-4 bg-white rounded-[24px] border-2 border-black p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    Actionable Inspection Tasks ({actionRequiredCount})
                  </h3>
                  <p className="text-xs text-zinc-600 font-medium">
                    Commodities requiring statutory verification, section 36 compounding notices, or manufacturer adjudication.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-800 border-rose-300 font-bold uppercase text-[10px]"
                >
                  Priority Enforcement
                </Badge>
              </div>

              {loading && inspections.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                  Querying Legal Metrology inspection records...
                </div>
              ) : actionRequiredCount === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h4 className="text-base font-bold text-black">
                    All inspections verified and compliant!
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    No pending adjudication, font height violations, or missing mandatory declarations.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionableInspections.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] border-2 border-black bg-zinc-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition-colors shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-500">
                            {item.id}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              item.compliance.status === "NON_COMPLIANT"
                                ? "bg-[#FF4800] text-white"
                                : "bg-[#FBE2A7] text-black border border-black/30"
                            }`}
                          >
                            {item.compliance.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-black">
                          {item.extractedData.productName || "Packaged Commodity"}
                        </h4>
                        <p className="text-xs text-zinc-600">
                          Brand: {item.extractedData.brand || "Unspecified"} • MRP:{" "}
                          {item.extractedData.mrp || "N/A"} • Net Qty:{" "}
                          {item.extractedData.netQuantity || "N/A"}
                        </p>
                        {item.compliance.criticalViolations &&
                          item.compliance.criticalViolations.length > 0 && (
                            <p className="text-xs text-rose-700 font-semibold pt-0.5">
                              Violations: {item.compliance.criticalViolations.join(", ")}
                            </p>
                          )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/notice/${item.id}`)}
                          className="px-3 py-1.5 rounded-full border-2 border-black bg-white hover:bg-zinc-100 text-xs font-black text-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Gavel className="size-3.5 text-[#FF4800]" />
                          <span>Draft Notice</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/scan/${item.id}`)}
                          className="px-4 py-1.5 rounded-full border-2 border-black bg-black text-white hover:bg-zinc-800 text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span>Review</span>
                          <ChevronRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 3: Full Registry Database */}
          {activeTab === "registry" && (
            <div className="mt-4 bg-white rounded-[24px] border-2 border-black p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black/10 pb-3">
                <div>
                  <h3 className="text-lg font-black text-black uppercase tracking-tight">
                    Inspection Registry Database ({total})
                  </h3>
                  <p className="text-xs text-zinc-600 font-medium">
                    Permanent repository of examined pre-packaged commodities under Legal Metrology Act, 2009.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/scan")}
                  className="px-4 py-1.5 rounded-full border-2 border-black bg-black text-white hover:bg-zinc-800 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="size-3.5 text-[#FF4800]" />
                  <span>New Scan</span>
                </button>
              </div>

              <div className="rounded-[18px] border-2 border-black overflow-hidden divide-y-2 divide-black/10">
                {inspections.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/scan/${item.id}`)}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-[#FBE2A7]/20 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500 font-bold">
                          {item.id}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            item.compliance.status === "COMPLIANT"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : item.compliance.status === "NON_COMPLIANT"
                              ? "bg-[#FF4800] text-white"
                              : "bg-[#FBE2A7] text-black border border-black/30"
                          }`}
                        >
                          {item.compliance.status}
                        </span>
                        <span className="text-xs text-zinc-600 font-mono font-semibold">
                          Score: {item.compliance.score}/100
                        </span>
                      </div>
                      <p className="text-sm font-black text-black truncate">
                        {item.extractedData.productName || "Packaged Product"}
                      </p>
                      <p className="text-xs text-zinc-600 truncate">
                        {item.extractedData.mfgName || "Manufacturer"} • Net:{" "}
                        {item.extractedData.netQuantity || "N/A"} • MRP:{" "}
                        {item.extractedData.mrp || "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronRight className="size-5 text-black" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Launchpad Footer Cards */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => navigate("/reports")}
              className="rounded-[22px] border-2 border-black bg-white p-5 cursor-pointer hover:border-[#FF4800] transition-all shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-black" />
                  <span className="text-xs font-black text-black uppercase tracking-wider">
                    Reports & Dossiers
                  </span>
                </div>
                <ArrowRight className="size-4 text-black group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-base font-black text-black">
                Statutory Inspection Archive
              </h4>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Access completed Legal Metrology compliance reports, draft inspection queues, and exportable findings.
              </p>
            </div>

            <div
              onClick={() => navigate("/scan")}
              className="rounded-[22px] border-2 border-black bg-white p-5 cursor-pointer hover:border-[#FF4800] transition-all shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ScanLine className="size-4 text-black" />
                  <span className="text-xs font-black text-black uppercase tracking-wider">
                    Multimodal Vision Scanner
                  </span>
                </div>
                <ArrowRight className="size-4 text-black group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="text-base font-black text-black">
                New Packaging Statutory Scan
              </h4>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Capture or upload package front/back labels for real-time extraction under Legal Metrology Rules, 2011.
              </p>
            </div>
          </div>
        </div>
      </main>
    </NirikshaLayout>
  );
}
