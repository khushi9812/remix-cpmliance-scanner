import { useState, useEffect } from "react";
import { MapPin, Loader2, WifiOff } from "lucide-react";

type LocationState =
  | { status: "detecting" }
  | { status: "ready"; city: string; region: string }
  | { status: "denied" }
  | { status: "error" };

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; region: string }> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en-IN,en", "User-Agent": "ComplyScan/1.0" },
  });
  if (!res.ok) throw new Error("Geocode failed");
  const data = await res.json();
  const addr = data.address ?? {};

  // Try to get the most specific city-level name
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.county ||
    addr.state_district ||
    "Unknown";

  // Get short state abbreviation (e.g. "Delhi" → "DL")
  const stateMap: Record<string, string> = {
    "Delhi": "DL", "New Delhi": "DL",
    "Maharashtra": "MH", "Karnataka": "KA", "Tamil Nadu": "TN",
    "West Bengal": "WB", "Uttar Pradesh": "UP", "Rajasthan": "RJ",
    "Gujarat": "GJ", "Telangana": "TS", "Andhra Pradesh": "AP",
    "Kerala": "KL", "Punjab": "PB", "Haryana": "HR", "Bihar": "BR",
    "Madhya Pradesh": "MP", "Odisha": "OD", "Assam": "AS",
    "Jharkhand": "JH", "Uttarakhand": "UK", "Himachal Pradesh": "HP",
    "Jammu and Kashmir": "JK", "Goa": "GA", "Chhattisgarh": "CG",
  };

  const stateFull = addr.state ?? "";
  const region = (stateMap[stateFull] ?? stateFull.slice(0, 2).toUpperCase()) || "IN";

  return { city, region };
}

export function LocationSelector() {
  const [loc, setLoc] = useState<LocationState>({ status: "detecting" });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoc({ status: "denied" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { city, region } = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setLoc({ status: "ready", city, region });
        } catch {
          // Fallback: show raw coords
          setLoc({
            status: "ready",
            city: `${pos.coords.latitude.toFixed(3)}°N`,
            region: `${pos.coords.longitude.toFixed(3)}°E`,
          });
        }
      },
      (err) => {
        // code 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          setLoc({ status: "denied" });
        } else {
          setLoc({ status: "error" });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  if (loc.status === "detecting") {
    return (
      <div className="flex flex-col text-left px-3 py-1.5 rounded-2xl">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="size-3 text-[var(--pastel-lavender-fg)] animate-spin" />
          Detecting…
        </div>
        <div className="text-sm font-semibold text-muted-foreground mt-0.5 animate-pulse">
          Locating you
        </div>
      </div>
    );
  }

  if (loc.status === "denied" || loc.status === "error") {
    return (
      <div className="flex flex-col text-left px-3 py-1.5 rounded-2xl">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <WifiOff className="size-3 text-destructive" />
          {loc.status === "denied" ? "Location Denied" : "Location Error"}
        </div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">
          {loc.status === "denied" ? "Enable in browser settings" : "Could not fetch location"}
        </div>
      </div>
    );
  }

  // status === "ready"
  return (
    <div className="flex flex-col text-left px-3 py-1.5 rounded-2xl">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <MapPin className="size-3 text-[var(--pastel-lavender-fg)]" />
        Current Location
      </div>
      <div className="text-sm font-semibold text-foreground mt-0.5">
        {loc.city}, {loc.region}
      </div>
    </div>
  );
}
