import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  MapPin,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  ExternalLink,
  Layers,
  Compass,
  Building2,
  TrendingUp,
  Map as MapIcon,
} from "lucide-react";
import { InspectionDetail } from "@/types/inspection";
import { Badge } from "@/components/ui/badge";

interface RegionalComplianceMapProps {
  inspections: InspectionDetail[];
  onSelectInspection?: (inspection: InspectionDetail) => void;
  className?: string;
}

// Controller component to pan & zoom the map programmatically
function MapPanController({
  target,
}: {
  target: { lat: number; lng: number; zoom?: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (map && target) {
      map.panTo({ lat: target.lat, lng: target.lng });
      if (target.zoom) {
        map.setZoom(target.zoom);
      }
    }
  }, [map, target]);
  return null;
}

const PAN_INDIA_CENTER = { lat: 21.7679, lng: 78.8718 };
const DEFAULT_ZOOM = 4.8;

// Regional zoning helper
function getZoneFromState(state?: string): "North" | "South" | "West" | "East" | "Central" | "Other" {
  if (!state) return "Central";
  const s = state.toLowerCase();
  if (s.includes("delhi") || s.includes("punjab") || s.includes("haryana") || s.includes("uttar pradesh") || s.includes("uttarakhand") || s.includes("himachal") || s.includes("jammu")) {
    return "North";
  }
  if (s.includes("karnataka") || s.includes("tamil nadu") || s.includes("telangana") || s.includes("andhra") || s.includes("kerala")) {
    return "South";
  }
  if (s.includes("maharashtra") || s.includes("gujarat") || s.includes("goa") || s.includes("rajasthan")) {
    return "West";
  }
  if (s.includes("bengal") || s.includes("odisha") || s.includes("bihar") || s.includes("jharkhand") || s.includes("assam")) {
    return "East";
  }
  return "Central";
}

export function RegionalComplianceMap({
  inspections,
  onSelectInspection,
  className = "",
}: RegionalComplianceMapProps) {
  const navigate = useNavigate();
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyCDpWw-hXHDsJkMZasxiOcgeyhX5BaQUVI";

  const [selectedScan, setSelectedScan] = useState<InspectionDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW">("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [panTarget, setPanTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter valid scans that have coordinates
  const validScans = useMemo(() => {
    return inspections.filter(
      (i) =>
        i.location &&
        typeof i.location.latitude === "number" &&
        typeof i.location.longitude === "number" &&
        !isNaN(i.location.latitude) &&
        !isNaN(i.location.longitude)
    );
  }, [inspections]);

  // Apply filters
  const filteredScans = useMemo(() => {
    return validScans.filter((scan) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "COMPLIANT" && scan.compliance.status !== "COMPLIANT") return false;
        if (statusFilter === "NON_COMPLIANT" && scan.compliance.status !== "NON_COMPLIANT") return false;
        if (statusFilter === "NEEDS_REVIEW" && scan.compliance.status !== "NEEDS_REVIEW" && scan.compliance.status !== "PARTIAL_COMPLIANT") return false;
      }

      // Zone filter
      if (zoneFilter !== "ALL") {
        const zone = getZoneFromState(scan.location?.state);
        if (zone !== zoneFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const prod = (scan.extractedData.productName || "").toLowerCase();
        const brand = (scan.extractedData.brand || "").toLowerCase();
        const market = (scan.location?.marketName || "").toLowerCase();
        const city = (scan.location?.city || "").toLowerCase();
        const state = (scan.location?.state || "").toLowerCase();
        if (!prod.includes(q) && !brand.includes(q) && !market.includes(q) && !city.includes(q) && !state.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [validScans, statusFilter, zoneFilter, searchQuery]);

  // Compute Regional Compliance Stats
  const regionalStats = useMemo(() => {
    const total = filteredScans.length;
    const compliant = filteredScans.filter((s) => s.compliance.status === "COMPLIANT").length;
    const nonCompliant = filteredScans.filter((s) => s.compliance.status === "NON_COMPLIANT").length;
    const review = filteredScans.filter((s) => s.compliance.status === "NEEDS_REVIEW" || s.compliance.status === "PARTIAL_COMPLIANT").length;
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

    // Zone counts
    const zoneCounts: Record<string, { total: number; compliant: number; violations: number }> = {
      North: { total: 0, compliant: 0, violations: 0 },
      South: { total: 0, compliant: 0, violations: 0 },
      West: { total: 0, compliant: 0, violations: 0 },
      East: { total: 0, compliant: 0, violations: 0 },
    };

    filteredScans.forEach((scan) => {
      const z = getZoneFromState(scan.location?.state);
      if (zoneCounts[z]) {
        zoneCounts[z].total++;
        if (scan.compliance.status === "COMPLIANT") {
          zoneCounts[z].compliant++;
        } else {
          zoneCounts[z].violations++;
        }
      }
    });

    return {
      total,
      compliant,
      nonCompliant,
      review,
      complianceRate,
      zoneCounts,
    };
  }, [filteredScans]);

  const handleResetView = () => {
    setPanTarget({ lat: PAN_INDIA_CENTER.lat, lng: PAN_INDIA_CENTER.lng, zoom: DEFAULT_ZOOM });
    setSelectedScan(null);
  };

  const handleSelectScanItem = (scan: InspectionDetail) => {
    setSelectedScan(scan);
    if (scan.location) {
      setPanTarget({
        lat: scan.location.latitude,
        lng: scan.location.longitude,
        zoom: 12,
      });
    }
    if (onSelectInspection) {
      onSelectInspection(scan);
    }
  };

  return (
    <div
      ref={containerRef}
      id="regional-compliance-map-container"
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-all ${
        isFullscreen ? "fixed inset-4 z-50 rounded-2xl shadow-2xl flex flex-col" : ""
      } ${className}`}
    >
      {/* Top Header & Interactive Filter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <MapIcon className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Regional Compliance Map & Geotagged Scans
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Live GPS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Visualizing packaging declarations & legal metrology trends across Indian retail zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="reset-pan-india-btn"
              onClick={handleResetView}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Reset to Pan-India view"
            >
              <RotateCcw className="size-3.5 text-slate-500" />
              <span>Pan-India</span>
            </button>

            <button
              type="button"
              id="fullscreen-map-toggle-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              title={isFullscreen ? "Exit Fullscreen" : "Expand Map"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="size-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Contract</span>
                </>
              ) : (
                <>
                  <Maximize2 className="size-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search box */}
          <div className="sm:col-span-4 relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
            <input
              type="text"
              id="map-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search market, city, brand, product…"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Status Filter Segment */}
          <div className="sm:col-span-5 flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              id="filter-status-all"
              onClick={() => setStatusFilter("ALL")}
              className={`flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({validScans.length})
            </button>
            <button
              type="button"
              id="filter-status-compliant"
              onClick={() => setStatusFilter("COMPLIANT")}
              className={`flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors cursor-pointer ${
                statusFilter === "COMPLIANT"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Compliant
            </button>
            <button
              type="button"
              id="filter-status-noncompliant"
              onClick={() => setStatusFilter("NON_COMPLIANT")}
              className={`flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors cursor-pointer ${
                statusFilter === "NON_COMPLIANT"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-rose-700"
              }`}
            >
              Violations
            </button>
            <button
              type="button"
              id="filter-status-review"
              onClick={() => setStatusFilter("NEEDS_REVIEW")}
              className={`flex-1 py-1 text-[11px] font-semibold rounded text-center transition-colors cursor-pointer ${
                statusFilter === "NEEDS_REVIEW"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              Review
            </button>
          </div>

          {/* Regional Zone Selector */}
          <div className="sm:col-span-3">
            <select
              id="zone-select-filter"
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Regional Zones</option>
              <option value="North">Northern Zone (NCR/UP)</option>
              <option value="South">Southern Zone (KA/TN/TS)</option>
              <option value="West">Western Zone (MH/GJ)</option>
              <option value="East">Eastern Zone (WB/OD)</option>
            </select>
          </div>
        </div>

        {/* Quick Regional Metric Ticker */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Scans Mapped</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {filteredScans.length}
            </span>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">Compliance Rate</span>
            </div>
            <span className="text-sm font-bold text-emerald-600 font-mono">
              {regionalStats.complianceRate}%
            </span>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-rose-500" />
              <span className="text-xs font-semibold text-slate-600">Violations Found</span>
            </div>
            <span className="text-sm font-bold text-rose-600 font-mono">
              {regionalStats.nonCompliant}
            </span>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-600">Active Markets</span>
            </div>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {new Set(filteredScans.map((s) => s.location?.city || "Unknown")).size} Cities
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Stage and Scan List Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 ${isFullscreen ? "flex-1 min-h-0" : ""}`}>
        {/* Map View Area */}
        <div className={`lg:col-span-8 relative bg-slate-100 ${isFullscreen ? "h-full" : "h-[450px] sm:h-[500px]"}`}>
          <APIProvider apiKey={apiKey}>
            <Map
              id="niriksha-regional-map"
              defaultCenter={PAN_INDIA_CENTER}
              defaultZoom={DEFAULT_ZOOM}
              gestureHandling={"greedy"}
              disableDefaultUI={false}
              mapId={"DEMO_MAP_ID"}
              internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
              className="w-full h-full"
            >
              <MapPanController target={panTarget} />

              {/* Markers for all filtered scans */}
              {filteredScans.map((scan) => {
                if (!scan.location) return null;
                const isCompliant = scan.compliance.status === "COMPLIANT";
                const isNonCompliant = scan.compliance.status === "NON_COMPLIANT";
                const isSelected = selectedScan?.id === scan.id;

                const pinBg = isCompliant ? "#10b981" : isNonCompliant ? "#ef4444" : "#f59e0b";
                const pinBorder = isCompliant ? "#047857" : isNonCompliant ? "#b91c1c" : "#b45309";
                const pinGlyph = isSelected ? "#ffffff" : isCompliant ? "#ffffff" : "#ffffff";

                return (
                  <AdvancedMarker
                    key={scan.id}
                    position={{
                      lat: scan.location.latitude,
                      lng: scan.location.longitude,
                    }}
                    title={`${scan.extractedData.productName || "Product"} - ${scan.location.city || "Field Scan"}`}
                    onClick={() => handleSelectScanItem(scan)}
                  >
                    <Pin
                      background={pinBg}
                      borderColor={pinBorder}
                      glyphColor={pinGlyph}
                      scale={isSelected ? 1.4 : 1.15}
                    >
                      {isCompliant ? "✓" : isNonCompliant ? "!" : "•"}
                    </Pin>
                  </AdvancedMarker>
                );
              })}

              {/* InfoWindow for selected scan */}
              {selectedScan && selectedScan.location && (
                <InfoWindow
                  position={{
                    lat: selectedScan.location.latitude,
                    lng: selectedScan.location.longitude,
                  }}
                  onCloseClick={() => setSelectedScan(null)}
                  maxWidth={320}
                  headerDisabled={false}
                >
                  <div className="p-1 text-slate-900 space-y-2 font-sans">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {selectedScan.id}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {selectedScan.extractedData.productName || "Packaged Commodity"}
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {selectedScan.extractedData.brand || "Brand Unspecified"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 border ${
                          selectedScan.compliance.status === "COMPLIANT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : selectedScan.compliance.status === "NON_COMPLIANT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {selectedScan.compliance.status}
                      </Badge>
                    </div>

                    {/* Geotagged Location Stamp */}
                    <div className="bg-slate-50 rounded p-2 border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <MapPin className="size-3 text-blue-600 shrink-0" />
                        <span className="truncate">{selectedScan.location.marketName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 pl-4.5">
                        {[selectedScan.location.city, selectedScan.location.state]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4.5 font-mono">
                        GPS: {selectedScan.location.latitude.toFixed(4)}° N,{" "}
                        {selectedScan.location.longitude.toFixed(4)}° E
                      </div>
                    </div>

                    {/* Violations pill if any */}
                    {selectedScan.compliance.criticalViolations.length > 0 && (
                      <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-1.5 font-medium">
                        ⚠️ {selectedScan.compliance.criticalViolations.length} Critical Rule Infraction(s)
                      </div>
                    )}

                    {/* Action button */}
                    <button
                      type="button"
                      id={`view-dossier-btn-${selectedScan.id}`}
                      onClick={() => navigate(`/result/${selectedScan.id}`)}
                      className="w-full mt-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span>View Full Inspection Dossier</span>
                      <ExternalLink className="size-3" />
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg p-2.5 shadow-md text-xs space-y-1.5 pointer-events-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Regional Compliance Pins
            </span>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 text-[11px] font-medium">Compliant Label</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-700 text-[11px] font-medium">Rule Violation Flagged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-700 text-[11px] font-medium">Needs Verification</span>
            </div>
          </div>
        </div>

        {/* Sidebar Scan Feeds & Regional List */}
        <div
          className={`lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col ${
            isFullscreen ? "h-full overflow-hidden" : "h-[450px] sm:h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Layers className="size-3.5 text-blue-600" />
              <span>Geotagged Inspection Records ({filteredScans.length})</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Click to locate
            </span>
          </div>

          {/* Scan Cards Scroll List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 divide-y divide-slate-100">
            {filteredScans.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400">
                <MapPin className="size-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-medium">No geolocated scans match the selected filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setZoneFilter("ALL");
                    setSearchQuery("");
                  }}
                  className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredScans.map((scan) => {
                const isSelected = selectedScan?.id === scan.id;
                const isCompliant = scan.compliance.status === "COMPLIANT";
                const isNonCompliant = scan.compliance.status === "NON_COMPLIANT";

                return (
                  <div
                    key={scan.id}
                    id={`scan-list-item-${scan.id}`}
                    onClick={() => handleSelectScanItem(scan)}
                    className={`pt-2 first:pt-0 cursor-pointer rounded-lg p-2.5 transition-all ${
                      isSelected
                        ? "bg-blue-50/80 border border-blue-200 shadow-2xs"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              isCompliant
                                ? "bg-emerald-500"
                                : isNonCompliant
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                            {scan.extractedData.productName || "Packaged Item"}
                          </h5>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-3.5">
                          {scan.extractedData.brand || "Brand unassigned"} • {scan.extractedData.category || "General"}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold px-1.5 py-0.5 border shrink-0 ${
                          isCompliant
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isNonCompliant
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {scan.compliance.score}%
                      </Badge>
                    </div>

                    {/* Location detail */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/80 px-2 py-1 rounded border border-slate-100">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="size-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {scan.location?.marketName || scan.location?.city || "Field Location"}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                        {scan.location?.city}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Regional Zone Summary Bars */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Zonal Compliance Ratios
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {(["North", "South", "West", "East"] as const).map((z) => {
                const zStat = regionalStats.zoneCounts[z];
                const rate = zStat && zStat.total > 0 ? Math.round((zStat.compliant / zStat.total) * 100) : 0;
                return (
                  <div key={z} className="bg-white rounded border border-slate-200 p-1.5">
                    <div className="text-[10px] font-bold text-slate-600">{z}</div>
                    <div
                      className={`text-xs font-bold font-mono ${
                        rate >= 70 ? "text-emerald-600" : rate > 0 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {zStat?.total ? `${rate}%` : "—"}
                    </div>
                    <div className="text-[9px] text-slate-400">{zStat?.total || 0} scans</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
