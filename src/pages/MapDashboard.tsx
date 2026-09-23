import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, ArrowLeft, Map as MapIcon, Filter } from "lucide-react";
import { useNavigate } from "react-router";

// Fix leaflet icon issue in react
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const passIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const failIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const reviewIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MOCK_PINS = [
  { id: 1, lat: 28.6139, lng: 77.2090, product: "Tata Salt 1kg", vendor: "Reliance Fresh, CP", inspector: "Insp. Sharma", status: "PASS", date: "2026-09-20 10:45 AM", note: "Compliant" },
  { id: 2, lat: 28.6200, lng: 77.2150, product: "Maggi Noodles", vendor: "Gupta Store", inspector: "Insp. Verma", status: "FAIL", date: "2026-09-21 02:15 PM", note: "Missing MRP declaration" },
  { id: 3, lat: 28.5800, lng: 77.2300, product: "Aashirvaad Atta", vendor: "Big Bazaar, South Ex", inspector: "Insp. Singh", status: "PASS", date: "2026-09-19 09:30 AM", note: "Compliant" },
  { id: 4, lat: 28.6400, lng: 77.2200, product: "Local Honey", vendor: "Jain Traders", inspector: "Insp. Sharma", status: "REVIEW", date: "2026-09-21 11:10 AM", note: "Net quantity font size illegible" },
];

export default function MapDashboard() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredPins = MOCK_PINS.filter(pin => 
    (filter === "ALL" || pin.status === filter) &&
    (pin.product.toLowerCase().includes(search.toLowerCase()) || pin.vendor.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen bg-background relative z-0">
      <header className="h-16 flex items-center justify-between px-6 border-b bg-background/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-serif text-xl font-bold flex items-center gap-2">
            <MapIcon className="text-[var(--pastel-lavender-fg)] size-5" />
            Geospatial Enforcement Map
          </h1>
        </div>
        
        <div className="flex w-full md:w-auto gap-3 items-center">
          <div className="relative w-full md:w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendor or product..." 
              className="pl-9 h-9 rounded-full bg-muted/50 border-transparent focus:bg-background shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative flex items-center">
            <Filter className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
            <select 
              className="pl-8 pr-8 py-1.5 h-9 rounded-full bg-card border border-border shadow-sm text-sm font-medium outline-none cursor-pointer appearance-none"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PASS">Compliant</option>
              <option value="FAIL">Non-Compliant</option>
              <option value="REVIEW">Under Review</option>
            </select>
          </div>
        </div>
      </header>

      <div className="flex-1 relative z-0">
        <MapContainer center={[28.6139, 77.2090]} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {filteredPins.map(pin => (
            <Marker 
              key={pin.id} 
              position={[pin.lat, pin.lng]} 
              icon={pin.status === 'PASS' ? passIcon : pin.status === 'FAIL' ? failIcon : reviewIcon}
            >
              <Popup className="rounded-xl overflow-hidden p-0 border-0 shadow-lg min-w-[240px]">
                <div className="p-3">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-sm text-foreground leading-tight">{pin.vendor}</h3>
                    <Badge className={`ml-2 text-[9px] uppercase px-1.5 py-0 shrink-0 ${
                      pin.status === 'PASS' ? 'badge-pass' : pin.status === 'FAIL' ? 'badge-fail' : 'badge-review'
                    }`}>
                      {pin.status}
                    </Badge>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-2 mb-3 border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Product</p>
                    <p className="text-xs font-semibold text-foreground">{pin.product}</p>
                  </div>

                  <div className="text-[10px] text-muted-foreground space-y-1.5 pt-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Inspector:</span>
                      <span className="text-foreground">{pin.inspector}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date/Time:</span>
                      <span className="text-foreground">{pin.date}</span>
                    </div>
                    {pin.note && (
                      <div className="pt-2 mt-2 border-t border-border/50">
                        <span className="block font-medium mb-0.5">Violation Status:</span>
                        <span className={pin.status === 'FAIL' ? 'text-[var(--pastel-pink-fg)] font-medium' : 'text-foreground'}>
                          {pin.note}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
