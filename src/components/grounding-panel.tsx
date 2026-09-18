import React, { useState } from "react";
import {
  Search,
  MapPin,
  ExternalLink,
  Globe,
  Loader2,
  Navigation,
  Building2,
  BookOpen,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  runSearchGrounding,
  runMapsGrounding,
  type WebSource,
  type MapSource,
} from "@/lib/grounding";

interface GroundingPanelProps {
  initialBrand?: string;
  initialCommodity?: string;
  initialAddress?: string;
  initialRuleCited?: string;
  initialLatitude?: number;
  initialLongitude?: number;
}

export function GroundingPanel({
  initialBrand = "",
  initialCommodity = "",
  initialAddress = "",
  initialRuleCited = "",
  initialLatitude,
  initialLongitude,
}: GroundingPanelProps) {
  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState(
    initialRuleCited
      ? `Legal Metrology Rule ${initialRuleCited} amendments and exemptions for ${initialCommodity || "packaged goods"}`
      : initialBrand
        ? `Legal Metrology compliance, consumer affairs notices, and packaging declarations for ${initialBrand}`
        : "Legal Metrology Packaged Commodities Rules 2024 2025 amendments circulars",
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResultText, setSearchResultText] = useState<string | null>(null);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Maps Grounding State
  const [addressQuery, setAddressQuery] = useState(
    initialAddress
      ? initialAddress
      : initialBrand
        ? `${initialBrand} manufacturing facility or corporate office India`
        : "Controller of Legal Metrology office near me",
  );
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResultText, setMapsResultText] = useState<string | null>(null);
  const [mapSources, setMapSources] = useState<MapSource[]>([]);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number }>({
    lat: initialLatitude,
    lng: initialLongitude,
  });

  const handleRunSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || searchQuery;
    if (!q.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await runSearchGrounding({
        query: q,
        commodity: initialCommodity,
        brand: initialBrand,
        ruleCited: initialRuleCited,
      });

      if (res.error) {
        setSearchError(res.message || "Failed to execute Search Grounding");
      } else {
        setSearchResultText(res.text);
        setWebSources(res.webSources);
        setSearchQueries(res.searchQueries || []);
      }
    } catch (err: any) {
      setSearchError(err.message || "Network error occurred while fetching grounded search data");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAcquireGps = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setAddressQuery("Nearest Legal Metrology inspectorate and consumer affairs office");
        },
        () => {
          // If blocked, keep current
        },
      );
    }
  };

  const handleRunMaps = async (overrideQuery?: string) => {
    const q = overrideQuery || addressQuery;
    if (!q.trim()) return;

    setMapsLoading(true);
    setMapsError(null);
    try {
      const res = await runMapsGrounding({
        query: q,
        address: initialAddress,
        brand: initialBrand,
        latitude: gpsLocation.lat,
        longitude: gpsLocation.lng,
      });

      if (res.error) {
        setMapsError(res.message || "Failed to execute Maps Grounding");
      } else {
        setMapsResultText(res.text);
        setMapSources(res.mapSources);
      }
    } catch (err: any) {
      setMapsError(err.message || "Network error occurred while fetching grounded maps data");
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <Card id="grounding-intelligence-panel" className="overflow-hidden border shadow-sm">
      <CardHeader className="border-b bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Sparkles className="h-4 w-4 text-primary" />
              Live Grounded Intelligence
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Real-time Google Search and Google Maps Grounding
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[11px] font-normal">
              <Globe className="mr-1 h-3 w-3 text-emerald-600" />
              Google Search
            </Badge>
            <Badge variant="outline" className="text-[11px] font-normal">
              <MapPin className="mr-1 h-3 w-3 text-sky-600" />
              Google Maps
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="gap-1.5 text-xs">
              <Search className="h-3.5 w-3.5" />
              Google Search Grounding
            </TabsTrigger>
            <TabsTrigger value="maps" className="gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5" />
              Google Maps Grounding
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GOOGLE SEARCH GROUNDING */}
          <TabsContent value="search" className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Search Legal Metrology Gazettes, Notifications & Case Law
              </label>
              <div className="flex gap-2">
                <Input
                  id="grounding-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Dual MRP advisory circulars, font size exemptions..."
                  className="h-9 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunSearch();
                  }}
                />
                <Button
                  id="grounding-search-submit"
                  size="sm"
                  onClick={() => handleRunSearch()}
                  disabled={searchLoading}
                  className="h-9 shrink-0 gap-1.5 text-xs"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Grounding...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5" />
                      Verify Web
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Quick queries:</span>
              <button
                type="button"
                onClick={() => {
                  const q = "Rule 6(1)(n) unit sale price declaration exemptions 2024 2025";
                  setSearchQuery(q);
                  handleRunSearch(q);
                }}
                className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Unit sale price exemptions
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = "Rule 18 dual MRP penalty and Supreme Court directions India";
                  setSearchQuery(q);
                  handleRunSearch(q);
                }}
                className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Dual MRP penalties
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = "Fourth Schedule font height requirement packaged commodities table";
                  setSearchQuery(q);
                  handleRunSearch(q);
                }}
                className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Fourth Schedule font heights
              </button>
            </div>

            {searchError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Search Grounding Note</p>
                  <p>{searchError}</p>
                </div>
              </div>
            )}

            {searchResultText && (
              <div className="space-y-3 rounded-lg border bg-card p-3.5">
                <div className="flex items-center gap-2 border-b pb-2 text-xs font-semibold text-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Grounded Regulatory Findings
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {searchResultText}
                </div>

                {/* Sources & Citations */}
                {webSources.length > 0 && (
                  <div className="mt-3 border-t pt-2.5">
                    <p className="mb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Authoritative Sources ({webSources.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {webSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-border/70 bg-muted/50 px-2 py-1 text-[11px] text-primary transition hover:bg-muted hover:underline"
                        >
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="max-w-[240px] truncate">{source.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {searchQueries.length > 0 && (
                  <div className="border-t pt-2 text-[10px] text-muted-foreground">
                    <span>Grounding queries evaluated: </span>
                    <span className="font-mono">{searchQueries.join(" · ")}</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: GOOGLE MAPS GROUNDING */}
          <TabsContent value="maps" className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">
                  Locate Manufacturer Premises or Legal Metrology Office
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAcquireGps}
                  className="h-6 gap-1 px-1.5 text-[11px] text-primary"
                >
                  <Navigation className="h-3 w-3" />
                  Use current GPS
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  id="grounding-maps-input"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  placeholder="e.g., ITC Limited Haridwar plant, or Controller Legal Metrology Delhi..."
                  className="h-9 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunMaps();
                  }}
                />
                <Button
                  id="grounding-maps-submit"
                  size="sm"
                  onClick={() => handleRunMaps()}
                  disabled={mapsLoading}
                  className="h-9 shrink-0 gap-1.5 text-xs"
                >
                  {mapsLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Locating...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3.5 w-3.5" />
                      Find on Maps
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Premises Suggestions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Shortcuts:</span>
              <button
                type="button"
                onClick={() => {
                  const q = "Controller of Legal Metrology state headquarters New Delhi";
                  setAddressQuery(q);
                  handleRunMaps(q);
                }}
                className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                Central Legal Metrology HQ
              </button>
              <button
                type="button"
                onClick={() => {
                  const q = "National Test House legal metrology testing laboratory India";
                  setAddressQuery(q);
                  handleRunMaps(q);
                }}
                className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                National Testing Lab
              </button>
              {initialAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressQuery(initialAddress);
                    handleRunMaps(initialAddress);
                  }}
                  className="rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-800 transition hover:bg-sky-500/20 dark:text-sky-200"
                >
                  Check Declared Address
                </button>
              )}
            </div>

            {mapsError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">Maps Grounding Note</p>
                  <p>{mapsError}</p>
                </div>
              </div>
            )}

            {mapsResultText && (
              <div className="space-y-3 rounded-lg border bg-card p-3.5">
                <div className="flex items-center gap-2 border-b pb-2 text-xs font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-sky-600" />
                  Verified Premises & Geographical Intelligence
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {mapsResultText}
                </div>

                {/* Grounded Google Maps Links (ALWAYS EXTRACTED AND DISPLAYED) */}
                {mapSources.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-2.5">
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Google Maps Verified Locations ({mapSources.length})
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {mapSources.map((map, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col justify-between gap-2 rounded-md border border-border/70 bg-muted/30 p-2.5 text-xs"
                        >
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">{map.title}</p>
                            {map.placeAnswerSources?.reviewSnippets && (
                              <p className="line-clamp-2 text-[11px] text-muted-foreground italic">
                                "{map.placeAnswerSources.reviewSnippets[0]}"
                              </p>
                            )}
                          </div>
                          {map.uri && (
                            <a
                              href={map.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              Open in Google Maps
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
