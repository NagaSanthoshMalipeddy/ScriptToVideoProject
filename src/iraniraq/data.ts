import mideast from "./mideast.json";

type Geom = { type: string; coordinates: unknown };
export type Pt = [number, number];

const ALL = (mideast as unknown as { countries: { iso: string; geometry: Geom }[] }).countries;
const byIso = (iso: string) => ALL.find((c) => c.iso === iso)!.geometry;
export const IRN = byIso("IRN");
export const IRQ = byIso("IRQ");
export const OTHERS = ALL.filter((c) => c.iso !== "IRN" && c.iso !== "IRQ").map((c) => ({ iso: c.iso, geom: c.geometry }));

const poly = (ring: Pt[]): Geom => ({ type: "Polygon", coordinates: [ring] });

// Approximate Iraqi-held areas inside Iran at their 1980–81 peak (clipped to Iran's land).
export const IRAQI_HELD = [
  poly([[47.6, 32.4], [48.35, 32.25], [48.55, 31.65], [48.8, 31.2], [48.45, 30.6], [48.15, 30.3], [47.9, 29.95], [47.5, 30.0], [47.6, 31.0], [47.5, 31.8], [47.6, 32.4]]),
  poly([[45.3, 34.9], [46.15, 34.7], [46.05, 34.2], [45.4, 34.15], [45.3, 34.9]]),
  poly([[45.9, 33.5], [46.55, 33.2], [46.35, 32.85], [45.85, 33.05], [45.9, 33.5]]),
];
// Approximate Iranian-held areas inside Iraq (Majnoon islands 1984, al-Faw 1986).
export const IRANIAN_HELD = [
  poly([[47.4, 31.3], [47.75, 31.3], [47.78, 30.95], [47.4, 30.95], [47.4, 31.3]]),
  poly([[48.1, 30.15], [48.65, 30.05], [48.68, 29.85], [48.3, 29.85], [48.1, 30.15]]),
];

export const IQ_MAIN: Pt[] = [[47.3, 30.75], [47.9, 30.55], [48.18, 30.44], [48.45, 31.0], [48.6, 31.25]];
export const IQ_ROUTES: { pts: Pt[]; a: number; b: number }[] = [
  { pts: [[45.1, 34.45], [45.57, 34.52], [45.95, 34.4]], a: 36.0, b: 39.0 },
  { pts: [[45.75, 32.9], [46.17, 33.12], [46.45, 33.2]], a: 36.4, b: 39.4 },
  { pts: [[47.2, 31.8], [47.7, 31.7], [48.1, 31.6]], a: 36.8, b: 39.6 },
];
export const IR_COUNTER: { pts: Pt[]; a: number; b: number }[] = [
  { pts: [[48.95, 31.45], [48.5, 31.0], [48.18, 30.44]], a: 41.3, b: 45.5 },
  { pts: [[48.95, 32.25], [48.3, 31.9], [47.85, 31.8]], a: 41.8, b: 46.0 },
];
export const SWING_IRAN: Pt[][] = [
  [[47.2, 31.3], [47.8, 31.35], [48.3, 31.45]],
  [[45.95, 33.3], [46.5, 33.45]],
];
export const SWING_IRAQ: Pt[][] = [
  [[48.35, 30.9], [47.85, 30.7], [47.6, 30.55]],
  [[48.7, 30.2], [48.45, 29.95]],
];

// Shatt al-Arab: from the Tigris–Euphrates confluence (al-Qurna) to the Gulf.
export const SHATT: Pt[] = [[47.43, 31.0], [47.62, 30.75], [47.8, 30.5], [48.02, 30.45], [48.18, 30.42], [48.3, 30.33], [48.55, 30.1], [48.8, 29.9]];
// Main Gulf tanker lane (Strait of Hormuz → Kharg Island → upper Gulf).
export const GULF_LANE: Pt[] = [[57.2, 26.2], [56.3, 26.55], [54.5, 26.6], [52.5, 27.3], [50.9, 28.6], [50.3, 29.15], [49.3, 29.5], [48.6, 29.4]];
export const OIL_SITES: { name: string; p: Pt }[] = [
  { name: "ABADAN", p: [48.3, 30.35] },
  { name: "KHARG ISLAND", p: [50.32, 29.25] },
  { name: "BASRA OIL", p: [47.95, 30.35] },
  { name: "KIRKUK", p: [44.39, 35.47] },
];
// Documented chemical-attack locations (only Halabja 1988 is labelled).
export const CHEM_SITES: Pt[] = [[45.98, 35.18], [47.6, 31.1], [48.4, 30.0], [47.9, 30.6]];
// Opening Iraqi air strikes on Iranian airfields (22 Sep 1980), shown as dashed arcs.
export const AIR_STRIKES: Pt[][] = [
  [[44.4, 33.3], [47.9, 35.0], [51.3, 35.7]],
  [[44.4, 33.3], [46.4, 34.9], [47.1, 34.3]],
  [[44.4, 33.3], [46.8, 32.6], [48.67, 31.32]],
];

export const PLACES: { name: string; lon: number; lat: number; kind: "country" | "city" | "region"; a?: number; b?: number }[] = [
  { name: "IRAN", lon: 53.5, lat: 32.4, kind: "country" },
  { name: "IRAQ", lon: 43.2, lat: 32.6, kind: "country" },
  { name: "KUWAIT", lon: 47.6, lat: 29.25, kind: "country" },
  { name: "SAUDI ARABIA", lon: 44.5, lat: 27.3, kind: "country" },
  { name: "SYRIA", lon: 38.8, lat: 35.2, kind: "country" },
  { name: "TURKEY", lon: 38.5, lat: 38.9, kind: "country" },
  { name: "TEHRAN", lon: 51.39, lat: 35.69, kind: "city" },
  { name: "BAGHDAD", lon: 44.37, lat: 33.31, kind: "city" },
  { name: "BASRA", lon: 47.78, lat: 30.51, kind: "city" },
  { name: "KHORRAMSHAHR", lon: 48.18, lat: 30.44, kind: "city", a: 35.5, b: 52.5 },
  { name: "AHVAZ", lon: 48.67, lat: 31.32, kind: "city", a: 35.5, b: 52.5 },
  { name: "AL-FAW", lon: 48.47, lat: 29.98, kind: "city", a: 57.9, b: 66.0 },
  { name: "HALABJA 1988", lon: 45.98, lat: 35.18, kind: "city", a: 66.0, b: 72.5 },
];
