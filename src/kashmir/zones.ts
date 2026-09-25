import type { Region } from "../ukraine/GeoMap";

// Stylised (approximate) polygons for the sub-regions of the greater Jammu & Kashmir
// area. Colours encode who ADMINISTERS each zone; India officially claims the whole
// region. Positions are schematic — meant for an explainer, not survey-accurate.

export type Zone = {
  id: string;
  name: string;
  controller: "India" | "Pakistan" | "China";
  color: string;
  labelLon: number;
  labelLat: number;
  ring: [number, number][];
};

export const IND = "#ff9933"; // India (saffron)
export const PAK = "#1a9850"; // Pakistan-administered (green)
export const CHN = "#d73027"; // China-administered (red)

export const KASHMIR_REGION: Region = { lonMin: 71.8, lonMax: 80.8, latMin: 31.6, latMax: 37.6 };

export const ZONES: Record<string, Zone> = {
  gilgit: {
    id: "gilgit",
    name: "Gilgit-Baltistan",
    controller: "Pakistan",
    color: PAK,
    labelLon: 73.9,
    labelLat: 35.8,
    ring: [[72.6, 34.8], [72.9, 36.0], [74.0, 36.7], [75.4, 36.8], [76.2, 36.2], [76.0, 35.4], [75.0, 34.9], [73.8, 34.7], [72.6, 34.8]],
  },
  ajk: {
    id: "ajk",
    name: "Azad Kashmir",
    controller: "Pakistan",
    color: PAK,
    labelLon: 73.3,
    labelLat: 33.6,
    ring: [[73.0, 32.9], [73.0, 34.2], [74.0, 34.7], [74.4, 34.0], [74.2, 33.2], [73.7, 32.7], [73.0, 32.9]],
  },
  jk: {
    id: "jk",
    name: "J&K (India)",
    controller: "India",
    color: IND,
    labelLon: 74.8,
    labelLat: 33.5,
    ring: [[74.0, 32.6], [74.4, 34.7], [75.4, 34.9], [76.0, 34.0], [75.8, 33.0], [75.0, 32.4], [74.0, 32.6]],
  },
  ladakh: {
    id: "ladakh",
    name: "Ladakh (India)",
    controller: "India",
    color: IND,
    labelLon: 77.3,
    labelLat: 33.8,
    ring: [[75.8, 32.9], [75.6, 34.6], [76.6, 35.3], [78.1, 35.2], [79.0, 34.2], [78.4, 33.0], [76.8, 32.5], [75.8, 32.9]],
  },
  siachen: {
    id: "siachen",
    name: "Siachen",
    controller: "India",
    color: "#ffd27f",
    labelLon: 76.9,
    labelLat: 35.55,
    ring: [[76.4, 35.2], [76.6, 35.8], [77.2, 35.9], [77.4, 35.3], [76.9, 35.0], [76.4, 35.2]],
  },
  aksai: {
    id: "aksai",
    name: "Aksai Chin",
    controller: "China",
    color: CHN,
    labelLon: 79.0,
    labelLat: 35.0,
    ring: [[78.1, 34.4], [78.0, 35.6], [79.4, 35.9], [80.2, 35.0], [79.6, 34.2], [78.1, 34.4]],
  },
  shaksgam: {
    id: "shaksgam",
    name: "Shaksgam",
    controller: "China",
    color: CHN,
    labelLon: 76.6,
    labelLat: 36.7,
    ring: [[75.6, 36.6], [76.2, 37.1], [77.4, 37.0], [77.6, 36.4], [76.6, 36.2], [75.6, 36.6]],
  },
};

export const geomOf = (z: Zone) => ({ type: "Polygon", coordinates: [z.ring] });

export const GROUPS = {
  india: ["jk", "ladakh", "siachen"],
  pakistan: ["gilgit", "ajk"],
  china: ["aksai", "shaksgam"],
  all: ["gilgit", "ajk", "jk", "ladakh", "siachen", "aksai", "shaksgam"],
};

// India–Pakistan Line of Control and India–China Line of Actual Control (approx paths).
export const LOC: [number, number][] = [[74.2, 32.8], [74.1, 33.6], [74.4, 34.4], [75.2, 34.8], [76.0, 35.0], [76.6, 35.3], [76.9, 35.5]];
export const LAC: [number, number][] = [[78.0, 34.2], [78.0, 34.9], [78.4, 35.4], [79.0, 35.7], [79.4, 35.9]];
