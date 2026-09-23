import { useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@/lib/convex-client";
import { api } from "@/convex/_generated/api";
import { MapPin, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

// MOCK DATA for demo when no real geo data exists
const MOCK_POINTS = [
  { lat: 28.6139, lng: 77.2090, decision: "FAIL" },
  { lat: 28.6200, lng: 77.2200, decision: "FAIL" },
  { lat: 28.6100, lng: 77.1950, decision: "FAIL" },
  { lat: 28.6080, lng: 77.2300, decision: "FAIL" },
  { lat: 28.6400, lng: 77.2100, decision: "PASS" },
  { lat: 28.5900, lng: 77.2500, decision: "PASS" },
  { lat: 28.6300, lng: 77.1800, decision: "REVIEW" },
  { lat: 28.6500, lng: 77.2400, decision: "FAIL" },
  { lat: 28.6250, lng: 77.2050, decision: "FAIL" },
  { lat: 28.6150, lng: 77.2150, decision: "PASS" },
  { lat: 18.9220, lng: 72.8347, decision: "FAIL" },
  { lat: 18.9300, lng: 72.8400, decision: "FAIL" },
  { lat: 18.9100, lng: 72.8200, decision: "PASS" },
  { lat: 12.9716, lng: 77.5946, decision: "FAIL" },
  { lat: 12.9800, lng: 77.6000, decision: "REVIEW" },
  { lat: 13.0000, lng: 77.5800, decision: "PASS" },
  { lat: 22.5726, lng: 88.3639, decision: "FAIL" },
  { lat: 22.5800, lng: 88.3700, decision: "FAIL" },
  { lat: 17.3850, lng: 78.4867, decision: "PASS" },
  { lat: 26.8467, lng: 80.9462, decision: "FAIL" },
];

interface HeatmapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MapView({ points }: { points: Array<{ lat: number; lng: number; decision: string }> }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapRef.current, {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution: "© OpenStreetMap © CartoDB",
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    // Add points as circles after map is ready
    points.forEach((p) => {
      const color =
        p.decision === "FAIL"
          ? "#ef4444"
          : p.decision === "REVIEW"
          ? "#f59e0b"
          : "#22c55e";

      L.circleMarker([p.lat, p.lng], {
        radius: 12,
        fillColor: color,
        fillOpacity: 0.3,
        color: color,
        weight: 0,
      }).addTo(map);

      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        fillColor: color,
        fillOpacity: 0.9,
        color: "white",
        weight: 1,
      }).addTo(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // intentionally empty - only run on mount/unmount

  // When points change, clear and re-add (for data reload)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing circle layers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    points.forEach((p) => {
      const color =
        p.decision === "FAIL"
          ? "#ef4444"
          : p.decision === "REVIEW"
          ? "#f59e0b"
          : "#22c55e";

      L.circleMarker([p.lat, p.lng], {
        radius: 12,
        fillColor: color,
        fillOpacity: 0.3,
        color: color,
        weight: 0,
      }).addTo(map);

      L.circleMarker([p.lat, p.lng], {
        radius: 4,
        fillColor: color,
        fillOpacity: 0.9,
        color: "white",
        weight: 1,
      }).addTo(map);
    });
  }, [points]);

  return <div ref={mapRef} className="h-[360px] w-full" />;
}

export function ViolationHeatmapModal({ open, onOpenChange }: HeatmapModalProps) {
  const rawPoints = useQuery(api.scans.geoPoints);
  const analytics = useQuery(api.scans.analytics);

  const points = useMemo(() => {
    if (rawPoints && rawPoints.length > 0) return rawPoints;
    return MOCK_POINTS;
  }, [rawPoints]);

  const isUsingMock = !rawPoints || rawPoints.length === 0;

  const total = analytics?.total ?? (isUsingMock ? MOCK_POINTS.length : 0);
  const fail = analytics?.fail ?? (isUsingMock ? MOCK_POINTS.filter((p) => p.decision === "FAIL").length : 0);
  const complianceRate = analytics?.complianceRatio ?? (isUsingMock ? Math.round(((total - fail) / total) * 100) : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-[2rem] p-0 overflow-hidden border-border/50 shadow-2xl gap-0">
        {/* Header */}
        <div className="p-5 border-b bg-background">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <MapPin className="size-5 text-[var(--pastel-lavender-fg)]" />
              Violation Heatmap
              {isUsingMock && (
                <Badge variant="outline" className="text-xs ml-1 font-normal text-muted-foreground">
                  Demo Data
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-muted/50 border border-border/40">
              <div className="p-2 rounded-full bg-foreground/5">
                <Activity className="size-4 text-foreground" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Scans</div>
                <div className="text-xl font-bold tabular-nums">{total}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-100">
              <div className="p-2 rounded-full bg-red-100">
                <AlertTriangle className="size-4 text-red-500" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-red-400">Violations</div>
                <div className="text-xl font-bold tabular-nums text-red-600">{fail}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-green-50 border border-green-100">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="size-4 text-green-500" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-green-400">Compliance</div>
                <div className="text-xl font-bold tabular-nums text-green-600">{complianceRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Map — only mount when open to ensure correct DOM sizing */}
        <div className="relative bg-muted/10">
          {open && <MapView points={points} />}

          {/* Legend */}
          <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-xl p-2.5 border border-border/50 shadow-sm text-xs space-y-1.5">
            <div className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500 opacity-80 inline-block shrink-0" />
              <span className="text-muted-foreground">Violation (FAIL)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-amber-500 opacity-80 inline-block shrink-0" />
              <span className="text-muted-foreground">Under Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-green-500 opacity-80 inline-block shrink-0" />
              <span className="text-muted-foreground">Compliant (PASS)</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
