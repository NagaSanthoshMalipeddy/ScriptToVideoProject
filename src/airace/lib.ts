import { Easing, interpolate } from "remotion";

export const COLORS = {
  bg0: "#05070f",
  bg1: "#0a1020",
  grid: "rgba(80, 130, 220, 0.10)",
  cyan: "#35e0ff",
  blue: "#3b6bff",
  white: "#eaf2ff",
  dim: "#8aa0c0",
};

export type Country = {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  color: string;
};

// Approximate centroid lat/lon per country, plus a signature accent color.
export const COUNTRIES: Record<string, Country> = {
  usa: { id: "usa", code: "USA", name: "United States", lat: 39, lon: -98, color: "#3b82f6" },
  china: { id: "china", code: "CHN", name: "China", lat: 35, lon: 104, color: "#ff3b52" },
  taiwan: { id: "taiwan", code: "TWN", name: "Taiwan", lat: 23.7, lon: 121, color: "#ffd166" },
  korea: { id: "korea", code: "KOR", name: "South Korea", lat: 36.5, lon: 128, color: "#2dd4bf" },
  japan: { id: "japan", code: "JPN", name: "Japan", lat: 36, lon: 138, color: "#ff6b9d" },
  india: { id: "india", code: "IND", name: "India", lat: 22, lon: 79, color: "#22e59a" },
  ukraine: { id: "ukraine", code: "UKR", name: "Ukraine", lat: 49, lon: 31, color: "#4ea3ff" },
  russia: { id: "russia", code: "RUS", name: "Russia", lat: 56, lon: 45, color: "#ff4d5e" },
  belarus: { id: "belarus", code: "BLR", name: "Belarus", lat: 53.7, lon: 28, color: "#f4a261" },
  europe: { id: "europe", code: "EU", name: "Europe", lat: 50, lon: 10, color: "#ffd166" },
};

export const COUNTRY_ORDER = ["usa", "china", "taiwan", "korea", "japan", "india"] as const;

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Vec3 = { x: number; y: number; z: number };

/** Unit vector for a lat/lon (degrees). +z faces the camera at rotation 0. */
export const latLonToVec = (lat: number, lon: number): Vec3 => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return {
    x: Math.cos(la) * Math.sin(lo),
    y: Math.sin(la),
    z: Math.cos(la) * Math.cos(lo),
  };
};

/** Evenly distributed points on a unit sphere (Fibonacci sphere). */
export const fibonacciSphere = (count: number): Vec3[] => {
  const pts: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return pts;
};

/** Rotate a vector around the Y axis (spin the globe) then the X axis (tilt). */
export const rotate = (p: Vec3, rotY: number, tiltX: number): Vec3 => {
  const cy = Math.cos(rotY);
  const sy = Math.sin(rotY);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const cx = Math.cos(tiltX);
  const sx = Math.sin(tiltX);
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  return { x: x1, y: y2, z: z2 };
};

/** The Y rotation that brings a given longitude to face the camera. */
export const lonToFrontRotation = (lon: number) => -(lon * Math.PI) / 180;

/** interpolate wrapper clamped on both sides with smooth easing. */
export const ease = (
  input: number,
  inputRange: [number, number],
  outputRange: [number, number],
  easing: (t: number) => number = Easing.inOut(Easing.cubic)
) =>
  interpolate(input, inputRange, outputRange, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
