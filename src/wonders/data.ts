import world from "./world.json";
import ind from "../india/geo/IND.json";

type Geom = { type: string; coordinates: unknown };

export type Wonder = {
  num: number;
  id: string;
  name: string;
  country: string;
  iso: string;
  lon: number;
  lat: number;
  color: string;
  span: number;
  facts: string[];
};

// Coordinates are the monuments' real positions (WGS84).
export const WONDERS: Wonder[] = [
  { num: 7, id: "chichen", name: "Chichen Itza", country: "Mexico", iso: "MEX", lon: -88.5678, lat: 20.6843, color: "#2e9e5b", span: 42, facts: ["Built by the Maya", "Maths + astronomy"] },
  { num: 6, id: "machu", name: "Machu Picchu", country: "Peru", iso: "PER", lon: -72.545, lat: -13.1631, color: "#d62839", span: 36, facts: ["City in the mountains", "Amazing engineering"] },
  { num: 5, id: "christ", name: "Christ the Redeemer", country: "Brazil", iso: "BRA", lon: -43.2105, lat: -22.9519, color: "#12a150", span: 60, facts: ["98 ft tall", "Symbol of peace & faith"] },
  { num: 4, id: "colosseum", name: "Colosseum", country: "Italy", iso: "ITA", lon: 12.4922, lat: 41.8902, color: "#009246", span: 26, facts: ["~2,000 years old", "Gladiator battles"] },
  { num: 3, id: "petra", name: "Petra", country: "Jordan", iso: "JOR", lon: 35.4444, lat: 30.3285, color: "#c8553d", span: 22, facts: ["Carved into rock", "Desert trade hub"] },
  { num: 2, id: "taj", name: "Taj Mahal", country: "India", iso: "IND", lon: 78.0421, lat: 27.1751, color: "#ff9933", span: 44, facts: ["White marble", "Symbol of love"] },
  { num: 1, id: "wall", name: "Great Wall of China", country: "China", iso: "CHN", lon: 116.5704, lat: 40.4319, color: "#de2910", span: 62, facts: ["Thousands of km", "Built over centuries"] },
];

export const WORLD_VIEW = { lon: 12, lat: 15, span: 250 };

// India uses the official boundary (incl. PoK & Aksai Chin) and is drawn last so it sits on top.
const INDIA_GEOM = (ind as any).features[0].geometry as Geom;
export const COUNTRIES: { iso: string; geom: Geom }[] = [
  ...(world as { iso: string; geometry: Geom }[]).filter((c) => c.iso !== "IND" && c.iso !== "ATA").map((c) => ({ iso: c.iso, geom: c.geometry })),
  { iso: "IND", geom: INDIA_GEOM },
];

export const REF_LAT = 20;
