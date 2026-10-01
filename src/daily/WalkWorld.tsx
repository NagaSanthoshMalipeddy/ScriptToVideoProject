import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { cut } from "../warmap/WarMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { CoverTitle } from "../cartoon/CoverTitle";
import { COUNTRIES } from "../wonders/data";
import { TE_DISPLAY } from "../story/fonts";
import { BODY } from "../airace/fonts";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const win = (T: number, a: number, b: number, f = 0.4) => (Number.isFinite(a) && Number.isFinite(b) ? clamp(Math.min((T - a) / f, (b - T) / f)) : 0);
const COS = Math.cos((25 * Math.PI) / 180);
const INK = "#20232a";
const OCEAN = "#bfe3ff";
const LAND = "#f6ecd9";
const GOLD = "#ffc93c";
const ORANGE = "#ff7a1a";
const RED = "#e63946";

// Longitudes are "unwrapped" so each route is continuous across the date line (Asia/Europe on Bushby's route are lon − 360).
const w = (lon: number) => lon - 360;
const ROUTE_A: Pt[] = [
  [18.42, -33.92], [28.05, -26.2], [28.3, -15.4], [32.6, -8.9], [36.8, -1.3], [38.7, 9.0], [32.5, 15.6], [31.2, 30.0], [35.9, 31.95],
  [36.3, 33.5], [37.2, 37.1], [44.8, 41.7], [48.0, 46.3], [61.4, 54.9], [73.4, 55.0], [82.9, 55.0], [104.3, 52.3], [113.5, 52.0], [129.7, 62.0], [150.8, 59.56],
];
const PUNTA: Pt = [-70.92, -53.16];
const DARIEN: Pt = [-77.6, 8.2];
const CAPE_PW: Pt = [-168.1, 65.6];
const UELEN: Pt = [-169.8, 66.16];
const HULL: Pt = [w(-0.33), 53.74];
const ROUTE_B: Pt[] = [
  PUNTA, [-72.1, -45.6], [-70.65, -33.45], [-70.3, -18.5], [-77.04, -12.05], [-78.5, -0.2], [-74.07, 4.71], DARIEN, [-79.5, 8.98], [-86.3, 12.1],
  [-99.1, 19.4], [-110.9, 31.3], [-118.2, 34.05], [-123.1, 49.3], [-135.05, 60.72], [-147.7, 64.8], [-163.0, 64.6], CAPE_PW,
  UELEN, [w(177.5), 64.7], [w(166.4), 68.05], [w(129.7), 62.0], [w(104.3), 52.3], [w(76.9), 43.2], [w(51.2), 43.65], [w(49.9), 40.4],
  [w(29.0), 41.0], [w(16.4), 48.2], [w(2.35), 48.86], [w(1.86), 50.95], HULL,
];
const K2K: Pt[] = [[74.8, 34.08], [76.0, 28.0], [77.4, 23.2], [78.5, 17.4], [77.6, 12.97], [77.54, 8.08]];
const segLen = (pts: Pt[]) => pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
const fracAt = (pts: Pt[], idx: number) => {
  const s = segLen(pts);
  const total = s.reduce((a, b) => a + b, 0);
  return s.slice(0, idx).reduce((a, b) => a + b, 0) / total;
};
const F_DARIEN = fracAt(ROUTE_B, ROUTE_B.indexOf(DARIEN));
const F_ALASKA = fracAt(ROUTE_B, ROUTE_B.indexOf(CAPE_PW));
const F_UELEN = fracAt(ROUTE_B, ROUTE_B.indexOf(UELEN));

const V = {
  world: { lon: w(145), lat: 12, span: 340 },
  atlantic: { lon: 40, lat: 12, span: 300 },
  cape: { lon: 22, lat: -28, span: 42 },
  india: { lon: 79, lat: 22, span: 34 },
  routeA: { lon: 82, lat: 16, span: 160 },
  punta: { lon: -70, lat: -48, span: 36 },
  darien: { lon: -77.8, lat: 8.3, span: 12 },
  bering: { lon: -169.2, lat: 65.9, span: 16 },
  end: { lon: w(145), lat: 12, span: 360 },
} satisfies Record<string, View>;

// ---- cues -------------------------------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const makeCues = (secs: Section[]) => {
  const missing: string[] = [];
  const idx = (phrase: string) => {
    const i = secs.findIndex((s) => s.text.toLowerCase().includes(phrase.toLowerCase()));
    if (i < 0) missing.push(phrase);
    return i;
  };
  const at = (phrase: string, off = 0) => {
    const i = idx(phrase);
    return i < 0 ? NaN : secs[i].start + off;
  };
  const end = (phrase: string, off = 0) => {
    const i = idx(phrase);
    return i < 0 ? NaN : (i + 1 < secs.length ? secs[i + 1].start : secs[i].end) + off;
  };
  const word = (phrase: string, wd: string) => {
    const i = idx(phrase);
    if (i < 0) return NaN;
    const x = secs[i].words.find((z) => norm(z.word) === norm(wd)) ?? secs[i].words.find((z) => norm(z.word).startsWith(norm(wd)));
    return x ? x.start : secs[i].start;
  };
  return { at, end, word, missing };
};

type Pop = { t: number; big: string | ((T: number) => string); sub?: string; color?: string; size?: number };
type Draw = { a: number; b: number; f0: number; f1: number };
type Plan = ReturnType<typeof buildPlan>;

const buildPlan = (secs: Section[], total: number) => {
  const { at, end, word, missing } = makeCues(secs);
  const aA = word("one epic path", "Cape") + 0.2;
  const bA = end("22,387", -0.4);
  const b1 = at("His rule was simple", 1.2);
  const b2 = at("walked through the Dari", -0.2);
  const b3 = at("walked through the Dari", 3.2);
  const b4 = at("hit a wall", -0.1);
  const b5 = word("waited for winter", "walked");
  const b6 = at("Floating ice", 2.6);
  const b7 = at("visa bans", 0.2);
  const b8 = end("visa bans", -0.2);
  const drawsB: Draw[] = [
    { a: b1, b: b2, f0: 0, f1: F_DARIEN },
    { a: b3, b: b4, f0: F_DARIEN, f1: F_ALASKA },
    { a: b5, b: b6, f0: F_ALASKA, f1: F_UELEN },
    { a: b7, b: b8, f0: F_UELEN, f1: 1 },
  ];
  const keys: [number, View][] = [
    [0, V.world],
    [at("Can you even walk"), V.atlantic],
    [at("one epic path"), V.cape],
    [end("22,387", -0.2), V.routeA],
    [at("Kashmir to Kanyakumari"), V.india],
    [at("Walk non-stop"), V.routeA],
    [at("even bigger"), V.punta],
    [at("In 1998"), V.world],
    [at("His rule was simple"), V.punta],
    [b2, V.darien],
    [b4, V.bering],
    [at("how long does it take"), V.end],
    [at("sounds crazy"), { ...V.darien, span: 30 }],
    [at("like, share"), { ...V.darien, span: 60 }],
    [total + 1, { ...V.darien, span: 60 }],
  ].filter(([t]) => Number.isFinite(t as number)) as [number, View][];
  const follows = [
    { a: aA, b: bA, pts: ROUTE_A, f0: 0, f1: 1, s0: 42, s1: 120 },
    ...drawsB.map((d, i) => ({ a: d.a, b: d.b, pts: ROUTE_B, f0: d.f0, f1: d.f1, s0: [36, 44, 16, 70][i], s1: [44, 60, 16, 110][i] })),
  ];
  const ctaT = at("like, share");
  const pops = ([
    { t: 0, big: "27 YEARS", sub: "of walking", color: GOLD, size: 190 },
    { t: at("No planes"), big: "JUST FEET", sub: "no planes · no cars · no boats", color: "#ffffff" },
    { t: at("Can you even walk"), big: "WALK THE WORLD?", color: "#ffffff", size: 120 },
    { t: at("Oceans cover"), big: "71% WATER", sub: "you can't walk in a circle", color: "#4db3ff" },
    { t: at("one epic path"), big: "LONGEST WALK", sub: "Cape Town → Magadan", color: ORANGE },
    { t: at("22,387"), big: (T) => `${Math.round(22387 * ease(clamp((T - aA) / Math.max(0.5, bA - aA)))).toLocaleString("en-US")} KM`, sub: "all on land · no boats", color: ORANGE },
    { t: at("Kashmir to Kanyakumari"), big: "× 6", sub: "Kashmir → Kanyakumari", color: ORANGE, size: 200 },
    { t: at("Walk non-stop"), big: "187 DAYS", sub: "non-stop · day and night", color: GOLD },
    { t: at("8 hours a day"), big: "1.5 YEARS", sub: "walking 8 hours a day", color: GOLD },
    { t: at("even bigger"), big: "BUT…", color: "#ffffff", size: 190 },
    { t: at("Karl Bushby"), big: "KARL BUSHBY", sub: "former British soldier", color: "#ffffff", size: 130 },
    { t: at("In 1998"), big: "1998", sub: "goal: walk home to England", color: GOLD, size: 190 },
    { t: at("His rule was simple"), big: "NO TRANSPORT", sub: "if he can't walk it, he can't go", color: RED, size: 130 },
    { t: at("walked through the Dari"), big: "DARIÉN GAP", sub: "a jungle with no roads", color: "#2fbf71", size: 140 },
    { t: at("hit a wall"), big: "BERING STRAIT", sub: "82 km of sea: America ↔ Russia", color: "#4db3ff", size: 120 },
    { t: at("waited for winter"), big: "2006", sub: "walking on the frozen sea", color: "#ffffff", size: 190 },
    { t: at("Floating ice"), big: "RUSSIA ✓", sub: "floating ice · freezing water", color: "#2fbf71", size: 150 },
    { t: at("visa bans"), big: (T) => `${Math.round(lerp(2006, 2025, ease(clamp((T - b7) / Math.max(0.5, b8 - b7)))))}`, sub: "visa bans · deserts · endless roads", color: GOLD, size: 190 },
    { t: at("how long does it take"), big: "27 YEARS", sub: "≈ 58,000 km · one step at a time", color: GOLD, size: 190 },
    { t: at("sounds crazy"), big: "NEXT:", sub: "the jungle roads can't cross", color: "#2fbf71", size: 150 },
    { t: ctaT, big: "SUBSCRIBE", sub: "a new map story every day", color: RED, size: 150 },
  ] as Pop[]).filter((p) => Number.isFinite(p.t));
  const pins = [
    { p: [18.42, -33.92] as Pt, label: "CAPE TOWN", t: word("one epic path", "Cape"), until: at("even bigger") },
    { p: [150.8, 59.56] as Pt, label: "MAGADAN", t: word("one epic path", "Magadan"), until: at("even bigger") },
    { p: PUNTA, label: "PUNTA ARENAS", t: at("even bigger", 1.2), until: ctaT },
    { p: HULL, label: "HULL · GOAL", t: word("In 1998", "England"), until: ctaT },
    { p: UELEN, label: "RUSSIA ✓", t: at("Floating ice", 2.4), until: ctaT },
  ];
  return {
    missing,
    keys,
    follows,
    pops,
    pins,
    routeA: { a: aA, b: bA, dim: at("even bigger") },
    labels: [
      { text: "RUSSIA", p: [-173.2, 66.9] as Pt, a: b4, b: at("visa bans", 0.5) },
      { text: "USA", p: [-163.4, 65.2] as Pt, a: b4, b: at("visa bans", 0.5) },
      { text: "PANAMA", p: [-80.2, 8.6] as Pt, a: b2, b: at("hit a wall", 0.4) },
      { text: "COLOMBIA", p: [-75.4, 6.3] as Pt, a: b2, b: at("hit a wall", 0.4) },
    ],
    drawsB,
    k2k: { a: at("Kashmir to Kanyakumari", 0.3), b: at("Kashmir to Kanyakumari", 2.4), until: at("Walk non-stop") },
    oceanPulse: [at("Oceans cover"), at("one epic path")],
    icons: [word("No planes", "planes"), word("No planes", "cars"), word("No planes", "boats")],
    iconsUntil: at("Can you even walk"),
    icons2: [at("His rule was simple"), end("His rule was simple")],
    clock: [at("Walk non-stop"), end("8 hours a day")],
    nameCard: [at("Karl Bushby"), at("In 1998")],
    jungle: [at("walked through the Dari"), at("hit a wall", 0.6), at("sounds crazy"), total + 1],
    ice: [at("waited for winter"), at("visa bans", 0.6)],
    glowB: at("how long does it take"),
    ctaT,
    likeT: word("like, share", "like"),
    shareT: word("like, share", "share"),
    subT: word("like, share", "subscribe"),
    sfx: [
      [0.1, "riser", 0.18, 50], [0.4, "boom", 0.25, 60],
      ...[word("No planes", "planes"), word("No planes", "cars"), word("No planes", "boats")].map((t) => [t, "pop", 0.3, 20]),
      [at("Can you even walk"), "whoosh", 0.25, 40], [at("one epic path"), "whoosh", 0.25, 40], [bA, "ding", 0.3, 40],
      [at("Kashmir to Kanyakumari"), "whoosh", 0.22, 40], [at("even bigger"), "whoosh", 0.25, 40], [at("In 1998"), "whoosh", 0.2, 40],
      [word("In 1998", "England"), "pop", 0.3, 20], [b2, "whoosh", 0.22, 40], [b4, "whoosh", 0.25, 40], [at("Floating ice", 2.4), "ding", 0.3, 40],
      [at("how long does it take"), "riser", 0.18, 50], [word("how long does it take", "27"), "boom", 0.28, 60], [at("sounds crazy"), "whoosh", 0.22, 40],
    ] as [number, string, number, number][],
  };
};

// ---- camera -------------------------------------------------------------------------
const cameraAt = (plan: Plan, T: number): View => {
  for (const f of plan.follows) {
    if (Number.isFinite(f.a) && T > f.a && T < f.b) {
      const p = ease(clamp((T - f.a) / Math.max(0.5, f.b - f.a)));
      const tip = cut(f.pts, lerp(f.f0, f.f1, p)).tip;
      return { lon: tip[0], lat: tip[1], span: f.s0 * Math.pow(f.s1 / f.s0, p) };
    }
  }
  const keys = plan.keys;
  let k = 0;
  while (k < keys.length - 1 && T >= keys[k + 1][0]) k++;
  if (k === 0 && T < keys[0][0]) return keys[0][1];
  const prevFollow = plan.follows.filter((f) => Number.isFinite(f.b) && f.b <= T).sort((x, y) => y.b - x.b)[0];
  const [t0, b] = keys[k];
  let a = k > 0 ? keys[k - 1][1] : b;
  let start = t0;
  if (prevFollow && prevFollow.b > t0) {
    const tip = cut(prevFollow.pts, prevFollow.f1).tip;
    a = { lon: tip[0], lat: tip[1], span: prevFollow.s1 };
    start = prevFollow.b;
  }
  const next = k + 1 < keys.length ? keys[k + 1][0] : start + 2.2;
  const p = ease(clamp((T - start) / Math.max(0.01, Math.min(2.2, next - start))));
  const bump = Math.min(1.8, 1 + Math.abs(b.lon - a.lon) / 120);
  const spanMid = Math.max(a.span, b.span) * bump;
  const span = p < 0.5 ? a.span * Math.pow(spanMid / a.span, p * 2) : spanMid * Math.pow(b.span / spanMid, (p - 0.5) * 2);
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: Math.min(span, 380) };
};

// ---- small art --------------------------------------------------------------------------
const Walker: React.FC<{ frame: number; size: number }> = ({ frame, size }) => {
  const sw = Math.sin(frame * 0.5) * 24;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 50 70" style={{ overflow: "visible" }}>
      <ellipse cx={25} cy={68} rx={14} ry={3} fill="rgba(0,0,0,0.25)" />
      <rect x={11} y={22} width={12} height={18} rx={4} fill="#e07b39" stroke={INK} strokeWidth={2.5} />
      <g transform={`rotate(${sw} 25 44)`}>
        <line x1={25} y1={44} x2={25} y2={66} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      </g>
      <g transform={`rotate(${-sw} 25 44)`}>
        <line x1={25} y1={44} x2={25} y2={66} stroke="#2b3a67" strokeWidth={6} strokeLinecap="round" />
      </g>
      <rect x={18} y={20} width={14} height={26} rx={6} fill="#2fbf71" stroke={INK} strokeWidth={2.5} />
      <g transform={`rotate(${-sw * 0.8} 25 24)`}>
        <line x1={25} y1={24} x2={25} y2={40} stroke="#f2c29b" strokeWidth={5} strokeLinecap="round" />
      </g>
      <circle cx={25} cy={12} r={8} fill="#f2c29b" stroke={INK} strokeWidth={2.5} />
      <path d="M17 10 Q25 1 33 10 Z" fill={RED} stroke={INK} strokeWidth={2} />
    </svg>
  );
};

const PinIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 40 52" style={{ overflow: "visible" }}>
    <path d="M20 50 C20 50 4 30 4 18 A16 16 0 1 1 36 18 C36 30 20 50 20 50 Z" fill={INK} stroke="#fff" strokeWidth={3} />
    <circle cx={20} cy={18} r={8} fill={color} />
  </svg>
);

const UnionJack: React.FC<{ w: number }> = ({ w: wd }) => (
  <svg width={wd} height={wd / 2} viewBox="0 0 60 30" style={{ border: `3px solid ${INK}`, borderRadius: 4 }}>
    <clipPath id="uj">
      <rect width={60} height={30} />
    </clipPath>
    <g clipPath="url(#uj)">
      <rect width={60} height={30} fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth={6} />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth={2} />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth={10} />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth={6} />
    </g>
  </svg>
);

const outline = (px: number, c = INK) => `${px}px ${c}`;
const pop = (frame: number, fps: number, t: number, delay = 0) => spring({ frame: frame - Math.round((t + delay) * fps), fps, config: { damping: 11, mass: 0.6 } });

// ---- scene ------------------------------------------------------------------------------
export const WalkWorldScene: React.FC<{ plan: Plan; T: number; frame: number; hud?: boolean }> = ({ plan, T, frame, hud = true }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const FY = 1060;
  const cam = cameraAt(plan, T);
  const s = W / (cam.span * COS);
  const P = (lon: number, lat: number): Pt => [W / 2 + (lon - cam.lon) * COS * s, FY - (lat - cam.lat) * s];
  const lw = clamp(40 / cam.span, 0.45, 2.2);
  const rw = clamp(50 / cam.span, 0.9, 2.2);
  const offs = [-720, -360, 0, 360].filter((o) => cam.lon + cam.span * 0.6 > -180 + o && cam.lon - cam.span * 0.6 < 180 + o);
  const path = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${P(p[0], p[1]).map((v) => v.toFixed(1)).join(",")}`).join("");
  const oceanPulse = T > plan.oceanPulse[0] && T < plan.oceanPulse[1] ? 0.5 + 0.5 * Math.sin((T - plan.oceanPulse[0]) * 5) : 0;
  const indiaOn = clamp((T - plan.k2k.a + 0.3) * 3) * clamp((plan.k2k.until - T) * 3);
  const rA = plan.routeA;
  const fA = ease(clamp((T - rA.a) / Math.max(0.5, rA.b - rA.a)));
  const dimA = T > rA.dim ? 0.35 : 1;
  const fB = plan.drawsB.reduce((acc, d) => (T >= d.b ? d.f1 : T > d.a ? lerp(d.f0, d.f1, ease(clamp((T - d.a) / Math.max(0.5, d.b - d.a)))) : acc), 0);
  const drawingB = plan.drawsB.some((d) => T > d.a - 0.6 && T < d.b + 0.8);
  const drawingA = T > rA.a - 0.6 && T < rA.b + 0.8;
  const glowB = T > plan.glowB ? 0.6 + 0.4 * Math.sin(T * 6) : 0;
  const ice = clamp((T - plan.ice[0]) * 1.5) * clamp((plan.ice[1] - T) * 1.5);
  const jungle = Math.max(clamp((T - plan.jungle[0]) * 2) * clamp((plan.jungle[1] - T) * 2), clamp((T - plan.jungle[2]) * 2) * clamp((plan.jungle[3] - T) * 2));

  const routeLayer = (pts: Pt[], f: number, color: string, op: number, glow: number) => {
    if (f <= 0) return null;
    const c = cut(pts, f).pts;
    return [-360, 0, 360].map((o) => {
      const sh = c.map(([x, y]) => [x + o, y] as Pt);
      const d = path(sh);
      return (
        <g key={`${color}${o}`} opacity={op}>
          {glow > 0 && <path d={d} fill="none" stroke={color} strokeWidth={26 * rw} strokeLinecap="round" strokeLinejoin="round" opacity={0.35 * glow} />}
          <path d={d} fill="none" stroke="#ffffff" strokeWidth={11 * rw} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={color} strokeWidth={6 * rw} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={INK} strokeWidth={3.2 * rw} strokeDasharray={`${0.1} ${14 * rw}`} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    });
  };
  const at = (p: Pt) => {
    const o = [-360, 0, 360].reduce((best, x) => (Math.abs(p[0] + x - cam.lon) < Math.abs(p[0] + best - cam.lon) ? x : best), 0);
    return P(p[0] + o, p[1]);
  };
  const tipA = cut(ROUTE_A, fA).tip;
  const tipB = cut(ROUTE_B, Math.max(0.0001, fB)).tip;
  const walker = drawingA ? tipA : T < rA.dim ? (T < plan.keys[1]?.[0] ? PUNTA : null) : T < plan.glowB ? (fB > 0 ? tipB : PUNTA) : null;

  // Visible pop = latest one that started.
  const pops = plan.pops;
  let cur = pops[0];
  for (const p of pops) if (T >= p.t) cur = p;
  const big = typeof cur.big === "function" ? cur.big(T) : cur.big;
  const pv = pop(frame, fps, cur.t);

  return (
    <AbsoluteFill style={{ background: OCEAN, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <rect width={W} height={H} fill={oceanPulse ? `rgba(40,150,255,${0.35 * oceanPulse})` : "none"} />
        {offs.map((o) =>
          COUNTRIES.map((c) => (
            <path
              key={`${c.iso}${o}`}
              d={geomPath(c.geom as never, (lo, la) => P(lo + o, la))}
              fill={c.iso === "IND" && indiaOn > 0 ? `rgba(255,153,51,${0.35 + 0.5 * indiaOn})` : LAND}
              stroke={INK}
              strokeWidth={1.4 * lw}
              strokeLinejoin="round"
            />
          )),
        )}
        {routeLayer(ROUTE_A, fA, ORANGE, dimA, 0)}
        {routeLayer(ROUTE_B, fB, RED, 1, glowB)}
        {indiaOn > 0 && (() => {
          const f = ease(clamp((T - plan.k2k.a) / (plan.k2k.b - plan.k2k.a)));
          return f > 0 ? <path d={path(cut(K2K, f).pts)} fill="none" stroke={RED} strokeWidth={9 * lw} strokeLinecap="round" strokeLinejoin="round" opacity={indiaOn} /> : null;
        })()}
        {ice > 0 &&
          Array.from({ length: 16 }, (_, i) => {
            const lon = -171.2 + ((i * 37) % 16) * 0.28 + Math.sin(T * 0.6 + i) * 0.05;
            const lat = 65.3 + ((i * 11) % 8) * 0.16;
            const [x, y] = P(lon, lat);
            const r = (10 + (i % 4) * 5) * lw * 2;
            return <path key={i} d={`M${x - r},${y} L${x - r * 0.4},${y - r * 0.6} L${x + r * 0.7},${y - r * 0.4} L${x + r},${y + r * 0.2} L${x + r * 0.2},${y + r * 0.6} L${x - r * 0.7},${y + r * 0.4}Z`} fill="#ffffff" stroke="#8fc8ee" strokeWidth={2} opacity={ice * 0.95} />;
          })}
      </svg>

      {jungle > 0 &&
        [[-77.9, 8.6], [-77.3, 8.0], [-78.2, 7.9], [-77.0, 8.5], [-77.7, 7.5], [-78.5, 8.4], [-76.8, 7.8]].map(([lo, la], i) => {
          const [x, y] = P(lo, la);
          return <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) scale(${clamp(20 / cam.span, 0.4, 1.3)})`, transformOrigin: "50% 100%", fontSize: 70, opacity: jungle }}>{i % 2 ? "🌴" : "🌳"}</div>;
        })}
      {plan.labels.map((l) => {
        const o = win(T, l.a, l.b);
        if (o <= 0) return null;
        const [x, y] = at(l.p);
        return <div key={l.text} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", fontFamily: TE_DISPLAY, fontSize: 54, color: "#fff", WebkitTextStroke: outline(10), paintOrder: "stroke fill", opacity: o, whiteSpace: "nowrap" }}>{l.text}</div>;
      })}
      {plan.pins.map((pin) => {
        if (!Number.isFinite(pin.t) || T < pin.t || T > pin.until) return null;
        const [x, y] = at(pin.p);
        const d = pop(frame, fps, pin.t);
        return (
          <div key={pin.label} style={{ position: "absolute", left: x, top: y - (1 - d) * 160, transform: "translate(-50%,-100%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp(d * 2) }}>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: INK, background: "#fff", border: `3px solid ${INK}`, borderRadius: 12, padding: "2px 12px", marginBottom: 4, whiteSpace: "nowrap" }}>{pin.label}</div>
            <PinIcon color={pin.label.startsWith("HULL") ? GOLD : pin.label.includes("✓") ? "#2fbf71" : RED} size={40} />
          </div>
        );
      })}
      {walker && (() => {
        const [x, y] = at(walker);
        return (
          <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-92%)" }}>
            <Walker frame={frame} size={70} />
          </div>
        );
      })()}

      {hud && (
        <>
          <div style={{ position: "absolute", left: 40, right: 40, top: 330, textAlign: "center", transform: `scale(${0.6 + 0.4 * pv})`, opacity: clamp(pv * 1.5) }}>
            <div style={{ fontFamily: TE_DISPLAY, fontSize: cur.size ?? 160, lineHeight: 1.05, color: cur.color ?? "#fff", WebkitTextStroke: outline(14), paintOrder: "stroke fill", letterSpacing: 2, textShadow: `0 10px 0 ${INK}` }}>{big}</div>
            {cur.sub && (
              <div style={{ display: "inline-block", marginTop: 14, background: "#fff", border: `5px solid ${INK}`, borderRadius: 22, boxShadow: `0 8px 0 ${INK}`, padding: "10px 26px 4px", fontFamily: TE_DISPLAY, fontSize: 46, color: INK }}>{cur.sub}</div>
            )}
          </div>
          {T > plan.icons[0] - 0.2 && T < plan.iconsUntil + 0.3 && <TransportRow T={T} times={plan.icons} frame={frame} fps={fps} />}
          {T > plan.icons2[0] && T < plan.icons2[1] && <TransportRow T={T} times={[plan.icons2[0] + 0.3, plan.icons2[0] + 0.6, plan.icons2[0] + 0.9]} frame={frame} fps={fps} />}
          {T > plan.clock[0] && T < plan.clock[1] && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 170, height: 170, borderRadius: "50%", background: "#fff", border: `6px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 96, transform: `rotate(${(T - plan.clock[0]) * 240}deg)` }}>{Math.floor((T - plan.clock[0]) * 1.5) % 2 ? "🌙" : "☀️"}</div>
            </div>
          )}
          {T > plan.nameCard[0] && T < plan.nameCard[1] && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1250, display: "flex", justifyContent: "center", transform: `translateY(${(1 - pop(frame, fps, plan.nameCard[0], 0.2)) * 300}px)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 22, background: "#fff", border: `5px solid ${INK}`, borderRadius: 26, boxShadow: `0 10px 0 ${INK}`, padding: "16px 30px" }}>
                <UnionJack w={120} />
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, color: INK, lineHeight: 1.3 }}>
                  Started 1998 · Punta Arenas, Chile
                  <br />
                  Goal: Hull, England · on foot
                </div>
              </div>
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1575, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 22, color: "rgba(32,35,42,0.7)" }}>Routes simplified and approximate</div>
          <SubscribeNudge T={T} until={plan.ctaT} top={1440} />
          {T >= plan.ctaT && <CtaCard T={T} top={1180} likeT={plan.likeT} shareT={plan.shareT} subT={plan.subT} />}
          {plan.missing.length > 0 && <div style={{ position: "absolute", left: 20, bottom: 20, color: "#f00", background: "#000", fontSize: 24, padding: 8 }}>MISSING CUES: {plan.missing.join(" | ")}</div>}
        </>
      )}
    </AbsoluteFill>
  );
};

const TransportRow: React.FC<{ T: number; times: number[]; frame: number; fps: number }> = ({ times, frame, fps }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center", gap: 40 }}>
    {["✈️", "🚗", "⛴️"].map((e, i) => {
      const p = pop(frame, fps, times[i]);
      const x = pop(frame, fps, times[i], 0.25);
      return (
        <div key={e} style={{ position: "relative", width: 170, height: 170, borderRadius: "50%", background: "#fff", border: `6px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90, transform: `scale(${p})` }}>
          {e}
          <svg width={170} height={170} viewBox="0 0 170 170" style={{ position: "absolute", inset: -6, opacity: clamp(x * 1.5) }}>
            <path d="M40 40 L130 130 M130 40 L40 130" stroke={RED} strokeWidth={16} strokeLinecap="round" />
          </svg>
        </div>
      );
    })}
  </div>
);

export const WalkWorld: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const cue = (t: number, sfx: string, vol: number, len = 45) =>
    Number.isFinite(t) ? (
      <Sequence key={`${sfx}${t.toFixed(2)}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
        <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {plan.sfx.map(([t, s, v, l]) => cue(t, s, v, l))}
      {nudgeTimes(plan.ctaT).map((t) => cue(t + 1.1, "ding", 0.22))}
      {cue(plan.subT + 1.2, "ding", 0.3)}
      <WalkWorldScene plan={plan} T={T} frame={frame} />
      <CoverTitle lines={["27 YEARS", "TO WALK THE WORLD?!"]} sub="No planes · no cars · no boats" accent={GOLD} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail: key content inside the Shorts feed crop (y 300–1620).
export const WalkWorldThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const T = plan.glowB + 3;
  return (
    <AbsoluteFill>
      <WalkWorldScene plan={plan} T={T} frame={8} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,30,70,0.82) 0%, rgba(10,30,70,0.2) 36%, rgba(10,30,70,0) 55%, rgba(10,30,70,0.75) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 250, lineHeight: 1, color: GOLD, WebkitTextStroke: outline(18), paintOrder: "stroke fill", textShadow: `0 14px 0 ${INK}` }}>27 YEARS</div>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 92, lineHeight: 1.1, color: "#fff", WebkitTextStroke: outline(12), paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>WALKING THE WORLD?!</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center", gap: 30 }}>
        {["✈️", "🚗", "⛴️"].map((e) => (
          <div key={e} style={{ position: "relative", width: 150, height: 150, borderRadius: "50%", background: "#fff", border: `6px solid ${INK}`, boxShadow: `0 8px 0 ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>
            {e}
            <svg width={150} height={150} viewBox="0 0 170 170" style={{ position: "absolute", inset: -6 }}>
              <path d="M40 40 L130 130 M130 40 L40 130" stroke={RED} strokeWidth={16} strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1515, textAlign: "center" }}>
        <span style={{ background: RED, color: "#fff", border: `5px solid ${INK}`, borderRadius: 20, boxShadow: `0 8px 0 ${INK}`, padding: "10px 28px 2px", fontFamily: TE_DISPLAY, fontSize: 58 }}>NO TRANSPORT. EVER.</span>
      </div>
    </AbsoluteFill>
  );
};
