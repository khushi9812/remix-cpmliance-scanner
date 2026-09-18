export interface WebSource {
  uri: string;
  title: string;
}

export interface MapSource {
  uri: string;
  title: string;
  placeAnswerSources?: any;
}

export interface SearchGroundingResult {
  text: string;
  webSources: WebSource[];
  searchQueries?: string[];
  error?: string;
  message?: string;
}

export interface MapsGroundingResult {
  text: string;
  mapSources: MapSource[];
  error?: string;
  message?: string;
}

export async function runSearchGrounding(params: {
  query?: string;
  commodity?: string;
  brand?: string;
  ruleCited?: string;
}): Promise<SearchGroundingResult> {
  const res = await fetch("/api/grounding/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      text: "",
      webSources: [],
      error: data.error || "ERROR",
      message: data.message || "Failed to retrieve search grounded data",
    };
  }

  return {
    text: data.text || "",
    webSources: data.webSources || [],
    searchQueries: data.searchQueries || [],
  };
}

export async function runMapsGrounding(params: {
  query?: string;
  address?: string;
  brand?: string;
  latitude?: number;
  longitude?: number;
}): Promise<MapsGroundingResult> {
  const res = await fetch("/api/grounding/maps", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    return {
      text: "",
      mapSources: [],
      error: data.error || "ERROR",
      message: data.message || "Failed to retrieve maps grounded data",
    };
  }

  return {
    text: data.text || "",
    mapSources: data.mapSources || [],
  };
}
