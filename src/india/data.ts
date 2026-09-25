import ind from "./geo/IND.json";
import pak from "./geo/PAK.json";
import npl from "./geo/NPL.json";
import btn from "./geo/BTN.json";
import bgd from "./geo/BGD.json";
import chn from "./geo/CHN.json";
import afg from "./geo/AFG.json";
import mmr from "./geo/MMR.json";
import type { Region } from "../ukraine/GeoMap";

type Geom = { type: string; coordinates: unknown };
const g = (j: any): Geom => j.features[0].geometry;

export const GEO: Record<string, Geom> = {
  india: g(ind),
  pakistan: g(pak),
  nepal: g(npl),
  bhutan: g(btn),
  bangladesh: g(bgd),
  china: g(chn),
  afghanistan: g(afg),
  myanmar: g(mmr),
};

export const SOUTH_ASIA: Region = { lonMin: 60, lonMax: 100, latMin: 5, latMax: 40 };

export const INDIA_FILL = "#ff9933";
export const NEUTRAL_FILL = "#e6e1d5";

export type Neighbour = { key: string; name: string; color: string; km: number; lon: number; lat: number };

export const NEIGHBOURS: Record<string, Neighbour> = {
  pakistan: { key: "pakistan", name: "PAKISTAN", color: "#0a7c3a", km: 3323, lon: 68, lat: 30 },
  nepal: { key: "nepal", name: "NEPAL", color: "#DC143C", km: 1751, lon: 84, lat: 28.4 },
  bhutan: { key: "bhutan", name: "BHUTAN", color: "#f4a11a", km: 699, lon: 90.4, lat: 27.5 },
  bangladesh: { key: "bangladesh", name: "BANGLADESH", color: "#006a4e", km: 4096, lon: 90.3, lat: 23.8 },
  china: { key: "china", name: "CHINA", color: "#de2910", km: 3488, lon: 86, lat: 33 },
  afghanistan: { key: "afghanistan", name: "AFGHANISTAN", color: "#555555", km: 106, lon: 66, lat: 34 },
  myanmar: { key: "myanmar", name: "MYANMAR", color: "#34B233", km: 1643, lon: 96, lat: 21 },
};

// Border lengths (+ coastline) for the 3D bar chart, longest first.
export const BORDER_DATA = [
  { label: "Coast", value: 7516, color: "#1e88e5" },
  { label: "B'desh", value: 4096, color: "#006a4e" },
  { label: "China", value: 3488, color: "#de2910" },
  { label: "Pak", value: 3323, color: "#0a7c3a" },
  { label: "Nepal", value: 1751, color: "#DC143C" },
  { label: "Myanmar", value: 1643, color: "#34B233" },
  { label: "Bhutan", value: 699, color: "#f4a11a" },
  { label: "Afghan", value: 106, color: "#888888" },
];
