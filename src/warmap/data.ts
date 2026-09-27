import europe from "./europe.json";

type Geom = { type: string; coordinates: unknown };
type Pt = [number, number];

// Natural Earth 50m with internationally recognised borders: Crimea moved into Ukraine
// and India replaced by the official outline (built by pipeline/make_europe.mjs).
const ALL = (europe as { countries: { iso: string; geometry: Geom }[] }).countries;
const byIso = (iso: string) => ALL.find((c) => c.iso === iso)!.geometry;
export const UKR = byIso("UKR");
export const RUS = byIso("RUS");
export const BLR = byIso("BLR");
export const OTHERS: { iso: string; geom: Geom }[] = ALL.filter((c) => c.iso !== "UKR" && c.iso !== "RUS").map((c) => ({ iso: c.iso, geom: c.geometry }));

const poly = (ring: Pt[]): Geom => ({ type: "Polygon", coordinates: [ring] });

export const CRIMEA = poly((europe as unknown as { crimea: Pt[] }).crimea);

// Approximate areas only (schematic), labelled as such on screen.
export const DONBAS_2014 = poly([
  [39.5, 48.65], [38.4, 48.62], [38.05, 48.3], [37.6, 48.02], [37.5, 47.9], [37.8, 47.12], [38.25, 47.1],
  [38.8, 47.6], [39.8, 47.85], [40.1, 48.3], [39.9, 48.8], [39.5, 48.65],
]);

export const ADVANCE = {
  north: poly([
    [29.3, 51.5], [30.5, 51.45], [31.8, 52.1], [33.4, 52.35], [34.4, 51.7], [35.3, 50.9], [34.9, 50.6], [33.2, 50.8],
    [31.6, 50.6], [30.8, 50.45], [30.2, 50.55], [29.6, 50.9], [29.3, 51.5],
  ]),
  northeast: poly([[35.5, 50.4], [37.5, 50.4], [38.2, 49.9], [37.6, 49.3], [36.9, 49.3], [36.4, 49.8], [35.9, 50.1], [35.5, 50.4]]),
  east: poly([[37.9, 49.3], [38.8, 49.9], [40.1, 49.6], [40.2, 48.8], [39.5, 48.65], [38.4, 48.62], [38.0, 48.9], [37.9, 49.3]]),
  south: poly([
    [32.5, 46.4], [32.8, 46.7], [33.4, 46.85], [34.3, 47.4], [35.3, 47.7], [36.5, 47.6], [37.3, 47.2], [37.8, 47.12],
    [36.8, 46.7], [35.3, 46.35], [34.2, 46.15], [33.6, 46.15], [32.5, 46.4],
  ]),
};

export type Route = { id: string; from: "russia" | "belarus" | "crimea"; pts: Pt[]; delay: number; flag?: boolean; zone: keyof typeof ADVANCE };

export const ROUTES: Route[] = [
  { id: "ru-ne", from: "russia", pts: [[37.2, 50.75], [36.7, 50.3], [36.25, 49.99]], delay: 0, flag: true, zone: "northeast" },
  { id: "ru-n", from: "russia", pts: [[34.9, 51.9], [33.4, 51.3], [31.9, 50.9], [31.0, 50.55]], delay: 0.3, zone: "north" },
  { id: "ru-e", from: "russia", pts: [[40.3, 49.6], [39.3, 49.3], [38.4, 48.95]], delay: 0.6, zone: "east" },
  { id: "by", from: "belarus", pts: [[29.4, 52.0], [29.9, 51.3], [30.25, 50.6]], delay: 0, flag: true, zone: "north" },
  { id: "cr-w", from: "crimea", pts: [[33.9, 45.95], [33.3, 46.35], [32.65, 46.63]], delay: 0.3, zone: "south" },
  { id: "cr-e", from: "crimea", pts: [[34.8, 45.95], [35.35, 46.85], [36.4, 47.05], [37.5, 47.1]], delay: 0, flag: true, zone: "south" },
];

// 2014 moves: across the Kerch Strait into Crimea; separatist marker into Donbas.
export const CRIMEA_2014: Pt[] = [[37.6, 45.1], [36.7, 45.25], [35.6, 45.2], [34.1, 44.95]];
export const DONBAS_MOVE: Pt[] = [[40.0, 48.1], [38.9, 48.05], [37.8, 48.0]];

export const PLACES: { name: string; lon: number; lat: number; kind: "country" | "city" | "region" }[] = [
  { name: "RUSSIA", lon: 39.6, lat: 52.9, kind: "country" },
  { name: "UKRAINE", lon: 31.2, lat: 49.3, kind: "country" },
  { name: "BELARUS", lon: 27.6, lat: 54.1, kind: "country" },
  { name: "POLAND", lon: 19.4, lat: 52.1, kind: "country" },
  { name: "ROMANIA", lon: 24.9, lat: 45.9, kind: "country" },
  { name: "KYIV", lon: 30.52, lat: 50.45, kind: "city" },
  { name: "KHARKIV", lon: 36.23, lat: 49.99, kind: "city" },
  { name: "KHERSON", lon: 32.62, lat: 46.64, kind: "city" },
  { name: "MARIUPOL", lon: 37.55, lat: 47.1, kind: "city" },
];
