import asia from "./asia.json";

type Geom = { type: string; coordinates: unknown };
export type Pt = [number, number];

const ALL = (asia as unknown as { countries: { iso: string; geometry: Geom }[] }).countries;
const byIso = (iso: string) => ALL.find((c) => c.iso === iso)!.geometry;

// North and South Korea are drawn as one peninsula: in 1950 the only division was the 38th parallel.
export const PRK = byIso("PRK");
export const KOR = byIso("KOR");
export const OTHERS = ALL.filter((c) => c.iso !== "PRK" && c.iso !== "KOR").map((c) => ({ iso: c.iso, geom: c.geometry }));

// Front line = latitude at each of these longitudes (extends past the coasts; clipped to land).
export const LONS = [123.5, 125.5, 126.5, 127.5, 128.3, 128.6, 129.0, 129.5, 131.5];

// Approximate, historically dated positions.
export const FRONTS: Record<string, number[]> = {
  p38: [38, 38, 38, 38, 38, 38, 38, 38, 38], // 1945 division
  seoul: [37.3, 37.3, 37.25, 37.35, 37.45, 37.55, 37.6, 37.7, 37.7], // late Jun 1950
  pusan: [34.0, 34.0, 34.3, 34.7, 35.2, 36.0, 36.2, 36.1, 36.1], // Aug–Sep 1950
  north: [39.9, 39.9, 40.4, 40.8, 41.1, 41.2, 41.4, 41.6, 41.8], // Nov 1950
  china: [36.9, 36.9, 37.0, 37.1, 37.2, 37.3, 37.35, 37.4, 37.4], // Jan 1951
  armistice: [37.7, 37.7, 37.85, 38.3, 38.35, 38.6, 38.6, 38.6, 38.6], // Jul 1953
  south1: [35.8, 35.8, 35.9, 36.1, 36.3, 36.5, 36.6, 36.6, 36.6], // Jul 1950
  pyong: [39.4, 39.4, 39.7, 39.9, 40.0, 40.1, 40.2, 40.3, 40.3], // Oct 1950
  retake: [37.6, 37.6, 37.7, 37.9, 38.0, 38.1, 38.2, 38.3, 38.3], // Mar 1951
  retake2: [38.1, 38.1, 38.3, 38.5, 38.6, 38.7, 38.7, 38.8, 38.8],
  china2: [37.3, 37.3, 37.45, 37.6, 37.7, 37.8, 37.9, 38.0, 38.0], // spring 1951 offensives
};

// China–North Korea border rivers (Yalu in the west, Tumen in the east), approx.
export const YALU: Pt[] = [[124.35, 39.95], [125.2, 40.45], [126.0, 40.9], [126.8, 41.7], [127.5, 41.5], [128.2, 41.4], [129.0, 42.0], [129.7, 42.4], [130.6, 42.4]];

// Military Demarcation Line, 1953 (approx.).
export const MDL: Pt[] = [[126.12, 37.73], [126.68, 37.95], [126.97, 38.1], [127.2, 38.3], [127.6, 38.33], [127.95, 38.3], [128.1, 38.33], [128.36, 38.61]];

export const NK_MAIN: Pt[] = [[126.0, 39.3], [126.2, 38.45], [126.55, 37.97], [126.98, 37.6]];
export const NK_EAST: Pt[][] = [
  [[127.3, 38.9], [127.73, 37.88], [128.1, 37.1]],
  [[128.6, 38.7], [128.95, 37.7], [129.3, 36.6]],
];
export const UN_ARRIVE: Pt[] = [[131.4, 34.0], [130.2, 34.6], [129.1, 35.15]];
export const UN_INCHEON: Pt[] = [[124.9, 36.9], [126.0, 37.3], [126.63, 37.47], [126.98, 37.57]];
export const UN_NORTH: Pt[] = [[128.6, 35.9], [127.4, 36.8], [126.95, 37.6], [126.2, 38.4], [125.75, 39.03], [125.5, 39.9]];
export const UN_EAST: Pt[] = [[129.3, 36.2], [128.9, 37.6], [128.3, 38.9], [127.6, 39.9], [128.8, 40.9]];
export const CN_WEST: Pt[] = [[124.2, 41.0], [125.2, 40.2], [125.9, 39.1], [126.4, 38.2], [126.75, 37.6]];
export const CN_EAST: Pt[] = [[126.5, 42.0], [127.3, 40.6], [127.7, 39.3], [128.0, 38.0], [128.3, 37.3]];
export const USSR_LINK: Pt[] = [[131.9, 43.1], [129.8, 41.6], [127.6, 40.2], [125.9, 39.1]];

export const PLACES: { name: string; lon: number; lat: number; kind: "country" | "city" | "region" }[] = [
  { name: "NORTH KOREA", lon: 126.8, lat: 40.25, kind: "country" },
  { name: "SOUTH KOREA", lon: 127.4, lat: 36.1, kind: "country" },
  { name: "CHINA", lon: 123.6, lat: 42.6, kind: "country" },
  { name: "USSR", lon: 133.0, lat: 44.6, kind: "country" },
  { name: "JAPAN", lon: 133.5, lat: 34.6, kind: "country" },
  { name: "SEOUL", lon: 126.98, lat: 37.57, kind: "city" },
  { name: "PYONGYANG", lon: 125.75, lat: 39.03, kind: "city" },
  { name: "BUSAN", lon: 129.08, lat: 35.18, kind: "city" },
  { name: "INCHEON", lon: 126.63, lat: 37.46, kind: "city" },
];
