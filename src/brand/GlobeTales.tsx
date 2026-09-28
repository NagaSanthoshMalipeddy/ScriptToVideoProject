import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { BODY } from "../airace/fonts";
import { COUNTRIES } from "../wonders/data";

const BRAND = loadFredoka("normal", { weights: ["600", "700"] }).fontFamily;
const rad = (d: number) => (d * Math.PI) / 180;
type Pt = [number, number];
type Geom = { type: string; coordinates: unknown };
const rings = (g: Geom): Pt[][] => (g.type === "Polygon" ? (g.coordinates as Pt[][]) : (g.coordinates as Pt[][][]).flat());

// Orthographic projection with horizon clipping: hidden parts of a ring are replaced by an arc along the limb.
const makeOrtho = (lon0: number, lat0: number, R: number, cx: number, cy: number) => {
  const p0 = rad(lat0);
  const raw = (lon: number, lat: number) => {
    const l = rad(lon - lon0);
    const p = rad(lat);
    return {
      x: Math.cos(p) * Math.sin(l),
      y: Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l),
      c: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l),
    };
  };
  const scr = (x: number, y: number): Pt => [cx + R * x, cy - R * y];
  const limbPt = (lonA: number, latA: number, lonB: number, latB: number, cA: number, cB: number) => {
    const t = cA / (cA - cB);
    const q = raw(lonA + (lonB - lonA) * t, latA + (latB - latA) * t);
    return Math.atan2(q.y, q.x);
  };
  const arc = (a0: number, a1: number): Pt[] => {
    let d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    const n = Math.max(1, Math.ceil(Math.abs(d) / rad(4)));
    return Array.from({ length: n + 1 }, (_, i) => scr(Math.cos(a0 + (d * i) / n), Math.sin(a0 + (d * i) / n)));
  };
  const ringPath = (ring: Pt[]) => {
    const q = ring.map(([lo, la]) => raw(lo, la));
    if (q.every((p) => p.c < 0)) return "";
    const n = ring.length;
    const s = q.findIndex((p) => p.c >= 0);
    const out: Pt[] = [];
    let exitA = 0;
    for (let k = 0; k < n; k++) {
      const i = (s + k) % n;
      const j = (i + 1) % n;
      const a = q[i];
      const b = q[j];
      if (a.c >= 0) out.push(scr(a.x, a.y));
      if (a.c >= 0 && b.c < 0) exitA = limbPt(ring[i][0], ring[i][1], ring[j][0], ring[j][1], a.c, b.c);
      if (a.c < 0 && b.c >= 0) out.push(...arc(exitA, limbPt(ring[i][0], ring[i][1], ring[j][0], ring[j][1], a.c, b.c)));
    }
    return out.length > 2 ? `M${out.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z` : "";
  };
  const linePath = (pts: Pt[]) => {
    let d = "";
    let pen = false;
    for (const [lo, la] of pts) {
      const p = raw(lo, la);
      if (p.c < 0) {
        pen = false;
        continue;
      }
      const [x, y] = scr(p.x, p.y);
      d += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  return { ringPath, linePath };
};

const GRATICULE: Pt[][] = [
  ...Array.from({ length: 12 }, (_, i) => Array.from({ length: 37 }, (_, k): Pt => [i * 30 - 180, k * 5 - 90])),
  ...[-60, -30, 0, 30, 60].map((la) => Array.from({ length: 73 }, (_, k): Pt => [k * 5 - 180, la])),
];

export const Globe: React.FC<{ r: number; cx: number; cy: number; lon0?: number; lat0?: number; id: string; outline?: number }> = ({ r, cx, cy, lon0 = 60, lat0 = 18, id, outline = 10 }) => {
  const o = makeOrtho(lon0, lat0, r, cx, cy);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-sea`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#7fd6ff" />
          <stop offset="0.55" stopColor="#2c95f0" />
          <stop offset="1" stopColor="#1659c4" />
        </radialGradient>
        <radialGradient id={`${id}-shade`} cx="30%" cy="25%" r="85%">
          <stop offset="0.6" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(8,30,90,0.35)" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-sea)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {GRATICULE.map((l, i) => (
          <path key={i} d={o.linePath(l)} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={r / 160} />
        ))}
        {COUNTRIES.map((c) => (
          <path key={c.iso} d={rings(c.geom).map(o.ringPath).join("")} fill="#7be38e" stroke="#2f9e57" strokeWidth={r / 110} strokeLinejoin="round" />
        ))}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-shade)`} />
        <ellipse cx={cx - r * 0.38} cy={cy - r * 0.45} rx={r * 0.34} ry={r * 0.16} fill="rgba(255,255,255,0.38)" transform={`rotate(-32 ${cx - r * 0.38} ${cy - r * 0.45})`} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f2747" strokeWidth={outline} />
    </g>
  );
};

// Film strip orbiting the globe like a ring; `half` draws only the back or the front half.
const FilmRing: React.FC<{ cx: number; cy: number; rx: number; ry: number; band: number; tilt: number; half: "back" | "front"; id: string }> = ({ cx, cy, rx, ry, band, tilt, half, id }) => (
  <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
    <clipPath id={`${id}-${half}`}>
      <rect x={-rx * 2} y={half === "front" ? 0 : -ry * 3} width={rx * 4} height={ry * 3} />
    </clipPath>
    <g clipPath={`url(#${id}-${half})`} opacity={half === "back" ? 0.9 : 1}>
      <ellipse rx={rx} ry={ry} fill="none" stroke="#0f2747" strokeWidth={band + 10} />
      <ellipse rx={rx} ry={ry} fill="none" stroke="#272c46" strokeWidth={band} />
      {["#ffd23f", "#ff6b8b", "#3fd5c9"].map((c, i) => (
        <ellipse key={c} rx={rx} ry={ry} fill="none" stroke={c} strokeWidth={band * 0.42} strokeDasharray={`${band * 0.62} ${band * 1.62}`} strokeDashoffset={-i * band * 0.76} />
      ))}
      {[-1, 1].map((s) => (
        <ellipse key={s} rx={rx + s * band * 0.36} ry={ry + s * band * 0.36} fill="none" stroke="#ffffff" strokeWidth={band * 0.13} strokeDasharray={`${band * 0.16} ${band * 0.2}`} />
      ))}
    </g>
  </g>
);

const Sparkle: React.FC<{ x: number; y: number; s: number; color?: string }> = ({ x, y, s, color = "#ffffff" }) => (
  <path d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s}Z`} fill={color} />
);

export const GlobeMark: React.FC<{ cx: number; cy: number; r: number; id: string }> = ({ cx, cy, r, id }) => {
  const ring = { cx, cy, rx: r * 1.42, ry: r * 0.4, band: r * 0.24, tilt: -18, id };
  return (
    <g>
      <FilmRing {...ring} half="back" />
      <Globe r={r} cx={cx} cy={cy} id={id} outline={r * 0.045} />
      <FilmRing {...ring} half="front" />
    </g>
  );
};

// 800×800 profile picture; YouTube crops it to a circle, so everything sits inside r≈360.
export const GlobeTalesLogo: React.FC = () => (
  <AbsoluteFill>
    <svg width={800} height={800} viewBox="0 0 800 800">
      <defs>
        <radialGradient id="lbg" cx="50%" cy="45%" r="62%">
          <stop offset="0" stopColor="#fff6cf" />
          <stop offset="0.55" stopColor="#ffd04a" />
          <stop offset="1" stopColor="#ff9a1f" />
        </radialGradient>
      </defs>
      <rect width={800} height={800} fill="url(#lbg)" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d={`M400 400 L${400 + 700 * Math.cos(rad(i * 22.5 - 4))} ${400 + 700 * Math.sin(rad(i * 22.5 - 4))} L${400 + 700 * Math.cos(rad(i * 22.5 + 4))} ${400 + 700 * Math.sin(rad(i * 22.5 + 4))}Z`} fill="rgba(255,255,255,0.16)" />
      ))}
      <GlobeMark cx={400} cy={405} r={205} id="logo" />
      <Sparkle x={612} y={190} s={34} />
      <Sparkle x={662} y={262} s={16} color="#fff6cf" />
      <Sparkle x={190} y={612} s={24} />
    </svg>
  </AbsoluteFill>
);

// Equirectangular path for the banner's background map.
const flatPath = (g: Geom, P: (lon: number, lat: number) => Pt) =>
  rings(g)
    .map((r) => `M${r.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join("L")}Z`)
    .join("");

const CITIES: { name: string; p: Pt }[] = [
  { name: "New York", p: [-74.0, 40.7] },
  { name: "London", p: [-0.13, 51.5] },
  { name: "Cairo", p: [31.24, 30.04] },
  { name: "New Delhi", p: [77.21, 28.61] },
  { name: "Beijing", p: [116.4, 39.9] },
  { name: "Tokyo", p: [139.7, 35.7] },
];

// 2560×1440 banner. Text and logo stay inside the all-device safe area (1546×423 centred: x 507–2053, y 508–931).
export const GlobeTalesBanner: React.FC = () => {
  const W = 2560;
  const H = 1440;
  const k = W / 360;
  const P = (lon: number, lat: number): Pt => [(lon + 180) * k, H / 2 - (lat - 12) * k];
  const bulge = (a: Pt, b: Pt, h: number) => {
    const [x1, y1] = P(...a);
    const [x2, y2] = P(...b);
    return `M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - h} ${x2},${y2}`;
  };
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="bbg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0b2f7a" />
            <stop offset="0.5" stopColor="#1661d6" />
            <stop offset="1" stopColor="#0b2f7a" />
          </linearGradient>
          <radialGradient id="bglow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="rgba(120,200,255,0.35)" />
            <stop offset="1" stopColor="rgba(120,200,255,0)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#bbg)" />
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`m${i}`} x1={i * 30 * k} y1={0} x2={i * 30 * k} y2={H} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
        ))}
        {Array.from({ length: 9 }, (_, i) => {
          const [, y] = P(0, 90 - i * 30);
          return <line key={`p${i}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />;
        })}
        {COUNTRIES.map((c) => (
          <path key={c.iso} d={flatPath(c.geom, P)} fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} strokeLinejoin="round" />
        ))}
        <ellipse cx={1280} cy={720} rx={1000} ry={330} fill="url(#bglow)" />
        {CITIES.slice(0, -1).map((c, i) => (
          <path key={c.name} d={bulge(c.p, CITIES[i + 1].p, 70)} fill="none" stroke="#ffd23f" strokeWidth={5} strokeDasharray="4 16" strokeLinecap="round" opacity={0.85} />
        ))}
        {CITIES.map((c) => {
          const [x, y] = P(...c.p);
          return (
            <g key={c.name}>
              <circle cx={x} cy={y} r={22} fill="rgba(255,210,63,0.25)" />
              <circle cx={x} cy={y} r={9} fill="#ffd23f" stroke="#0f2747" strokeWidth={3} />
            </g>
          );
        })}
        <g transform={`translate(${P(-37, 50)[0]} ${P(-37, 50)[1] - 34}) rotate(8)`}>
          <path d="M-30 0 L30 -4 L40 0 L30 4 Z M-4 -2 L-16 -26 L-6 -26 L14 -2 Z M-4 2 L-16 26 L-6 26 L14 2 Z M-28 -1 L-36 -12 L-30 -12 L-20 -1 Z M-28 1 L-36 12 L-30 12 L-20 1 Z" fill="#ffffff" stroke="#0f2747" strokeWidth={2.5} strokeLinejoin="round" />
        </g>
        <GlobeMark cx={760} cy={720} r={150} id="banner" />
        <Sparkle x={930} y={560} s={26} />
        <Sparkle x={590} y={880} s={16} color="#ffd23f" />
      </svg>
      <div style={{ position: "absolute", left: 1010, top: 572, width: 1040 }}>
        <div style={{ fontFamily: BRAND, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: 2, color: "#ffffff", textShadow: "0 8px 0 #0f2747, 0 0 40px rgba(0,0,0,0.35)" }}>
          Globe<span style={{ color: "#ffd23f" }}>Tales</span>
        </div>
        <div style={{ marginTop: 22, fontFamily: BRAND, fontWeight: 600, fontSize: 40, whiteSpace: "nowrap", color: "#e6f3ff", textShadow: "0 3px 0 #0f2747" }}>History · Maps · Stories from around the world</div>
        <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 14, background: "#ff3b4a", border: "4px solid #0f2747", borderRadius: 60, padding: "6px 26px 6px 14px", boxShadow: "0 5px 0 #0f2747" }}>
          <svg width={34} height={34} viewBox="0 0 40 40">
            <circle cx={20} cy={20} r={18} fill="#ffffff" />
            <path d="M16 12 L29 20 L16 28 Z" fill="#ff3b4a" />
          </svg>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: "#ffffff" }}>NEW VIDEOS EVERY DAY</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
