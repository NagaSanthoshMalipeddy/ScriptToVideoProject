import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Timing } from "../types";
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { BODY } from "../airace/fonts";
import { Billboard, cut, HudBlock, Legend, MapLabel } from "../warmap/WarMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Flag, type FlagKind } from "../korea/KoreaWar";
import { IQ_MAIN, IQ_ROUTES, IR_COUNTER, IRANIAN_HELD, IRAQI_HELD, IRN, IRQ, OTHERS, PLACES, SWING_IRAN, SWING_IRAQ, type Pt } from "./data";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpPt = (a: Pt, b: Pt, p: number): Pt => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const ease = Easing.inOut(Easing.cubic);
const win = (T: number, a: number, b: number, f = 0.5) => clamp(Math.min((T - a) / f, (b - T) / f));

const REF_LAT = 32;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const TILT = 30;
const PW = 1900;
const PH = 3300;
const FOCUS_Y = 1000;

// Timeline is keyed to the user's recorded voiceover (seconds).
export const CTA_T = 84.8;
export const END_PAD = 5;

const C = {
  ocean: "#05080f",
  land: "#111722",
  landEdge: "#27324a",
  side: "#020306",
  irn: "#0f2a1c",
  irnEdge: "#34c77b",
  irq: "#2a1216",
  irqEdge: "#ff4d5e",
  red: "#ff3b4a",
  green: "#34c77b",
  hud: "#9fd8ff",
  gold: "#ffd23f",
  blue: "#4da3ff",
};

type View = { lon: number; lat: number; span: number };
const V = {
  open: { lon: 47.5, lat: 33.0, span: 62 },
  both: { lon: 48.5, lat: 32.5, span: 38 },
  title: { lon: 48.0, lat: 32.8, span: 34 },
  tehran: { lon: 51.4, lat: 35.2, span: 16 },
  baghdad: { lon: 44.6, lat: 33.0, span: 16 },
  border: { lon: 47.2, lat: 32.2, span: 18 },
  cross: { lon: 47.9, lat: 30.7, span: 9 },
  khuz: { lon: 47.9, lat: 31.5, span: 14 },
  counter: { lon: 48.3, lat: 31.1, span: 12 },
  swing: { lon: 47.6, lat: 31.6, span: 17 },
  years: { lon: 47.5, lat: 32.5, span: 26 },
  halabja: { lon: 46.3, lat: 34.2, span: 14 },
  un: { lon: 48.0, lat: 32.6, span: 40 },
  end: { lon: 48.3, lat: 32.4, span: 46 },
} satisfies Record<string, View>;

const KEYS: [number, View][] = [
  [0, V.open],
  [8.9, V.title],
  [13.7, V.tehran],
  [19.0, V.baghdad],
  [28.0, V.border],
  [35.1, V.border],
  [38.4, V.cross],
  [39.8, V.khuz],
  [41.1, V.counter],
  [51.8, V.swing],
  [59.9, V.years],
  [66.0, V.halabja],
  [70.4, V.un],
  [76.0, V.both],
  [80.1, V.title],
  [CTA_T + END_PAD, V.end],
];

const cameraAt = (T: number): View => {
  // Follow the Iraqi flag across the border (35.1–38.4s).
  if (T > 35.1 && T < 38.4) {
    const p = ease(clamp((T - 35.1) / 3.3));
    const tip = cut(IQ_MAIN, p).tip;
    return { lon: lerp(V.border.lon, tip[0], clamp(p * 2)), lat: lerp(V.border.lat, tip[1], clamp(p * 2)), span: V.border.span * Math.pow(V.cross.span / V.border.span, p) };
  }
  let k = 0;
  while (k < KEYS.length - 2 && T >= KEYS[k + 1][0]) k++;
  const [t0, a] = KEYS[k];
  const [t1, b] = KEYS[k + 1];
  const p = ease(clamp((T - t0) / Math.max(0.01, Math.min(2.2, t1 - t0))));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const regionFor = (v: View): Region => {
  const scale = PW / (v.span * COS);
  const latMax = v.lat + (0.5 * PH) / scale;
  return { lonMin: v.lon - v.span / 2, lonMax: v.lon + v.span / 2, latMin: latMax - PH / scale, latMax, refLat: REF_LAT, noWrap: true };
};

type K = { t: number; p: Pt | Pt[]; op?: number };
const endPt = (k: K): Pt => (Array.isArray(k.p[0]) ? (k.p as Pt[])[(k.p as Pt[]).length - 1] : (k.p as Pt));
const trackAt = (keys: K[], T: number) => {
  if (T <= keys[0].t) return { pos: endPt(keys[0]), op: keys[0].op ?? 1 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (T < b.t) {
      const q = ease(clamp((T - a.t) / Math.max(0.01, b.t - a.t)));
      return { pos: Array.isArray(b.p[0]) ? cut(b.p as Pt[], q).tip : lerpPt(endPt(a), b.p as Pt, q), op: lerp(a.op ?? 1, b.op ?? 1, q) };
    }
  }
  const l = keys[keys.length - 1];
  return { pos: endPt(l), op: l.op ?? 1 };
};

const FLAGS: { kind: FlagKind; label?: (T: number) => string | undefined; keys: K[] }[] = [
  {
    kind: "IR",
    label: (T) => (T < 8.9 ? "IRAN" : undefined),
    keys: [
      { t: 0, p: [50.4, 32.2], op: 0 },
      { t: 0.8, p: [50.4, 32.2], op: 1 },
      { t: 41.3, p: IR_COUNTER[0].pts[0], op: 1 },
      { t: 45.5, p: IR_COUNTER[0].pts, op: 1 },
      { t: 57.9, p: [48.18, 30.44], op: 1 },
      { t: 59.8, p: [[48.18, 30.44], [48.45, 30.1], [48.4, 29.98]], op: 1 },
      { t: 76.0, p: [48.4, 29.98], op: 1 },
      { t: 78.0, p: [49.3, 31.6], op: 1 },
    ],
  },
  {
    kind: "IQ",
    label: (T) => (T < 8.9 ? "IRAQ" : undefined),
    keys: [
      { t: 0, p: [45.0, 32.2], op: 0 },
      { t: 0.8, p: [45.0, 32.2], op: 1 },
      { t: 33.4, p: IQ_MAIN[0], op: 1 },
      { t: 35.1, p: IQ_MAIN[0], op: 1 },
      { t: 38.4, p: IQ_MAIN, op: 1 },
      { t: 45.5, p: [48.6, 31.25], op: 1 },
      { t: 51.0, p: [47.5, 30.95], op: 1 },
      { t: 55.2, p: [47.5, 30.95], op: 1 },
      { t: 57.4, p: [48.2, 31.4], op: 1 },
      { t: 59.8, p: [47.3, 30.9], op: 1 },
      { t: 76.0, p: [47.3, 30.9], op: 1 },
      { t: 78.0, p: [46.2, 32.5], op: 1 },
    ],
  },
  {
    kind: "UN",
    label: (T) => (T < 76 ? "UN · RES. 598" : undefined),
    keys: [
      { t: 70.4, p: [48.0, 33.4], op: 0 },
      { t: 71.0, p: [48.0, 33.4], op: 1 },
      { t: 79.5, p: [48.0, 33.4], op: 1 },
      { t: 80.3, p: [48.0, 33.4], op: 0 },
    ],
  },
];

const Hazard: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <svg width={70} height={62} viewBox="0 0 70 62">
      <path d="M35 4 L66 58 L4 58 Z" fill="#ffd23f" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
      <rect x={32} y={20} width={6} height={22} rx={2} fill="#111" />
      <circle cx={35} cy={49} r={3.6} fill="#111" />
    </svg>
  </div>
);

export const IranIraqScene: React.FC<{ T: number; frame: number; hud?: boolean }> = ({ T, frame, hud = true }) => {
  const { width, height } = useVideoConfig();
  const cam = cameraAt(T);
  const prev = cameraAt(T - 1 / 30);
  const proj = makeProjector(regionFor(cam), PW, PH);
  const P = (lon: number, lat: number) => proj(lon, lat);
  const [cx, cy] = P(cam.lon, cam.lat);
  const [px, py] = makeProjector(regionFor(prev), PW, PH)(cam.lon, cam.lat);
  const blur = Math.min(5, Math.hypot(cx - px, cy - py) / 30 + Math.abs(Math.log(cam.span / prev.span)) * 60);
  const pts = (list: Pt[]) => list.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join(" ");

  const bScale = clamp(14 / cam.span, 0.5, 1.15);
  const flagsOn = clamp((55 - cam.span) / 10);
  const citiesOn = clamp((30 - cam.span) / 6);
  const iqHeld = win(T, 38.8, 49.5, 1.2);
  const irHeld = win(T, 58.3, 77.0, 1.0);
  const borderGlow = win(T, 76.3, 80.2, 0.6);
  const flash = T > 30.5 ? clamp(1 - Math.abs(T - 30.75) / 0.3) : 0;
  const shake = T > 30.7 && T < 31.2 ? Math.sin(T * 90) * 5 * (1 - (T - 30.7) / 0.5) : 0;
  const chem = win(T, 66.3, 70.5, 0.4);

  type R = { pts: Pt[]; color: string; a: number; b: number; fade: number };
  const routes: R[] = [
    { pts: IQ_MAIN, color: C.red, a: 35.1, b: 38.4, fade: 46.5 },
    ...IQ_ROUTES.map((r) => ({ ...r, color: C.red, fade: 46.5 })),
    ...IR_COUNTER.map((r) => ({ ...r, color: C.green, fade: 52.5 })),
    ...SWING_IRAN.map((p, i) => ({ pts: p, color: C.red, a: 55.2 + i * 0.3, b: 57.3, fade: 60.0 })),
    ...SWING_IRAQ.map((p, i) => ({ pts: p, color: C.green, a: 58.0 + i * 0.3, b: 59.8, fade: 63.0 })),
  ];
  const pulses: { p: Pt; t: number; color: string }[] = [
    { p: [51.39, 35.69], t: 13.9, color: C.green },
    { p: [44.37, 33.31], t: 21.9, color: C.red },
    { p: [48.18, 30.44], t: 39.6, color: C.red },
    { p: [48.18, 30.44], t: 48.0, color: C.green },
    { p: [45.98, 35.18], t: 68.5, color: C.gold },
  ];

  const glowLine = (id: string, list: Pt[], color: string, w: number, op: number) => (
    <g key={id} opacity={op}>
      <polyline points={pts(list)} fill="none" stroke={color} strokeWidth={w * 2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#iglow)" opacity={0.5} />
      <polyline points={pts(list)} fill="none" stroke="#ffffff" strokeWidth={w * 0.8} strokeDasharray="20 14" strokeDashoffset={-frame * 2.5} strokeLinecap="round" opacity={0.85} />
    </g>
  );
  const bb = (lon: number, lat: number, node: React.ReactNode, op = 1, key?: string) => {
    const [x, y] = P(lon, lat);
    return op > 0.01 ? (
      <Billboard key={key} x={x} y={y} opacity={op} scale={bScale}>
        {node}
      </Billboard>
    ) : null;
  };
  const planeLeft = (width - PW) / 2;
  const planeTop = FOCUS_Y - PH / 2;

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: `50% ${FOCUS_Y}px`, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ position: "absolute", left: planeLeft, top: planeTop, width: PW, height: PH, transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d", filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="iglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="irnLand">
                <path d={geomPath(IRN, P)} />
              </clipPath>
              <clipPath id="irqLand">
                <path d={geomPath(IRQ, P)} />
              </clipPath>
              <radialGradient id="ilight" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="rgba(120,170,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            <rect width={PW} height={PH} fill={C.ocean} />
            {Array.from({ length: 50 }, (_, i) => {
              const lo = Math.floor((cam.lon - cam.span) / 2) * 2 + i * 2;
              const [x] = P(lo, cam.lat);
              return <line key={`lo${i}`} x1={x} y1={0} x2={x} y2={PH} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            {Array.from({ length: 50 }, (_, i) => {
              const la = Math.floor((cam.lat - cam.span) / 2) * 2 + i * 2;
              const [, y] = P(cam.lon, la);
              return <line key={`la${i}`} x1={0} y1={y} x2={PW} y2={y} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            <g transform="translate(0 12)">
              {OTHERS.map((c) => (
                <path key={`s${c.iso}`} d={geomPath(c.geom, P)} fill={C.side} />
              ))}
              <path d={geomPath(IRN, P)} fill={C.side} />
              <path d={geomPath(IRQ, P)} fill={C.side} />
            </g>
            {OTHERS.map((c) => (
              <path key={c.iso} d={geomPath(c.geom, P)} fill={C.land} stroke={C.landEdge} strokeWidth={1.8} strokeLinejoin="round" />
            ))}
            <path d={geomPath(IRN, P)} fill={C.irn} stroke={C.irnEdge} strokeWidth={3 + borderGlow * 4} strokeLinejoin="round" filter="url(#iglow)" />
            <path d={geomPath(IRQ, P)} fill={C.irq} stroke={C.irqEdge} strokeWidth={3 + borderGlow * 4} strokeLinejoin="round" filter="url(#iglow)" />

            <g clipPath="url(#irnLand)" opacity={iqHeld}>
              {IRAQI_HELD.map((g, i) => (
                <path key={`qh${i}`} d={geomPath(g, P)} fill="rgba(255,59,74,0.4)" stroke="rgba(255,90,100,0.9)" strokeWidth={2.5} strokeDasharray="10 8" />
              ))}
            </g>
            <g clipPath="url(#irqLand)" opacity={irHeld}>
              {IRANIAN_HELD.map((g, i) => (
                <path key={`rh${i}`} d={geomPath(g, P)} fill="rgba(52,199,123,0.4)" stroke="rgba(52,199,123,0.95)" strokeWidth={2.5} strokeDasharray="10 8" />
              ))}
            </g>

            {routes.map((r, i) => {
              if (T < r.a) return null;
              const f = ease(clamp((T - r.a) / Math.max(0.1, r.b - r.a)));
              const op = 1 - clamp((T - r.fade) / 1.2);
              if (op <= 0.01) return null;
              const c = cut(r.pts, f);
              const [tx, ty] = P(c.tip[0], c.tip[1]);
              const [bx, by] = P(c.tip[0] - Math.cos(c.ang) * 0.01, c.tip[1] - Math.sin(c.ang) * 0.01);
              const a = Math.atan2(ty - by, tx - bx);
              return (
                <g key={`r${i}`} opacity={op}>
                  {glowLine(`rl${i}`, c.pts, r.color, 4, 1)}
                  <polygon points={`${tx + Math.cos(a) * 26},${ty + Math.sin(a) * 26} ${tx + Math.cos(a + 2.5) * 20},${ty + Math.sin(a + 2.5) * 20} ${tx + Math.cos(a - 2.5) * 20},${ty + Math.sin(a - 2.5) * 20}`} fill={r.color} filter="url(#iglow)" />
                </g>
              );
            })}
            {pulses.map((pu, i) => {
              if (T < pu.t - 0.3 || T > pu.t + 3) return null;
              const [sx, sy] = P(pu.p[0], pu.p[1]);
              return [0, 1, 2].map((k) => {
                const ph = ((T - pu.t) * 0.8 + k / 3 + 3) % 1;
                return <circle key={`p${i}${k}`} cx={sx} cy={sy} r={20 + ph * 180} fill="none" stroke={pu.color} strokeWidth={4} opacity={(1 - ph) * 0.8 * clamp((pu.t + 3 - T) * 2)} />;
              });
            })}
            <rect width={PW} height={PH} fill="url(#ilight)" />
          </svg>

          {PLACES.map((pl) => {
            const timed = pl.a !== undefined ? win(T, pl.a!, pl.b!, 0.5) : 1;
            const op = (pl.kind === "city" ? citiesOn : clamp((cam.span - 10) / 6)) * timed * clamp((T - 0.4) * 2);
            const saddam = pl.name === "BAGHDAD" && T > 21.7 && T < 28.5;
            const rev = pl.name === "TEHRAN" && T > 13.7 && T < 19;
            return bb(pl.lon, pl.lat, <MapLabel text={saddam ? "BAGHDAD · SADDAM HUSSEIN" : rev ? "TEHRAN · 1979 REVOLUTION" : pl.name} kind={pl.kind} color={saddam ? "#ff9aa3" : rev ? "#9ff0c4" : undefined} />, op, pl.name);
          })}
          {chem > 0 && bb(45.98, 35.18, <Hazard />, chem, "hz1")}
          {chem > 0 && bb(47.6, 31.1, <Hazard />, chem * clamp((T - 66.8) * 3), "hz2")}
          {FLAGS.map((f, i) => {
            const { pos, op } = trackAt(f.keys, T);
            return bb(pos[0], pos[1], <Flag kind={f.kind} frame={frame} label={f.label?.(T)} />, op * flagsOn, `f${i}`);
          })}
        </div>
      </AbsoluteFill>

      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 197.3) % width;
        const y = (height - ((T * (14 + (i % 5) * 6) + i * 131) % (height + 40))) % height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: "#9fd8ff", opacity: 0.12 + (i % 4) * 0.05 }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.85) 0%, rgba(3,5,10,0) 22%, rgba(3,5,10,0) 70%, rgba(3,5,10,0.92) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.8 }} />
      {hud && <IranIraqHud T={T} />}
    </AbsoluteFill>
  );
};

type Block = { t: number; big: string | ((T: number) => string); accent?: string; lines?: [string, number, string?][] };

const IranIraqHud: React.FC<{ T: number }> = ({ T }) => {
  const R = C.red, G = C.green, H = C.hud, Y = C.gold, B = C.blue;
  const blocks: Block[] = [
    { t: 0, big: "IMAGINE…", accent: H, lines: [["Two countries at war", 1.8, H]] },
    { t: 3.6, big: (T) => (T < 5.1 ? "1 YEAR?" : T < 7.9 ? "2 YEARS?" : "8 YEARS!"), accent: R },
    { t: 8.9, big: "IRAN – IRAQ WAR", accent: R, lines: [["1980 – 1988", 10.0, H]] },
    { t: 13.7, big: "1979", accent: G, lines: [["Islamic Revolution in Iran", 14.0, G], ["The country is politically unstable", 16.7, G]] },
    { t: 19.0, big: "SADDAM HUSSEIN", accent: R, lines: [["Iraq's leader sees an opportunity", 19.5], ["Decides to attack Iran", 24.0]] },
    { t: 28.0, big: "SEP 22, 1980", accent: R, lines: [["Iraq invades Iran", 30.7]] },
    { t: 33.4, big: "THE INVASION", accent: R, lines: [["Iraqi forces cross the border", 35.1], ["Khuzestan · Qasr-e Shirin · Mehran", 36.5]] },
    { t: 38.4, big: "EARLY GAINS", accent: R, lines: [["Iraq captures border areas", 38.6], ["Oct 1980: Khorramshahr falls", 39.6]] },
    { t: 41.1, big: "IRAN STRIKES BACK", accent: G, lines: [["Iran recovers & counter-attacks", 41.5, G], ["May 1982: Khorramshahr retaken", 48.0, G], ["Most lost territory recovered", 50.3, G]] },
    { t: 51.8, big: "NO END IN SIGHT", accent: Y, lines: [["Toward Iran…", 55.0, R], ["…then toward Iraq", 57.9, G], ["Years of stalemate (1982 – 1988)", 60.0, Y]] },
    { t: 66.0, big: "CHEMICAL WEAPONS", accent: Y, lines: [["Chemical weapons used in the war", 66.6, Y], ["Iraq's use confirmed by UN experts", 67.8, Y], ["Halabja, March 1988", 68.8, Y]] },
    { t: 70.4, big: "1988 · CEASEFIRE", accent: B, lines: [["UN Security Council Resolution 598", 71.3, B], ["Ceasefire: 20 Aug 1988", 73.5, B]] },
    { t: 76.0, big: "8 YEARS", accent: Y, lines: [["No clear winner", 77.8, Y], ["Borders back to pre-war lines", 79.0, H]] },
    { t: 80.1, big: "IRAN – IRAQ WAR", accent: R, lines: [["1980 – 1988", 80.8, H]] },
    { t: CTA_T, big: "SUBSCRIBE", accent: R, lines: [["For more history on the map", CTA_T + 0.4, H]] },
  ];
  let cur = blocks[0];
  for (const b of blocks) if (T >= b.t && b.t >= cur.t) cur = b;
  const big = typeof cur.big === "function" ? cur.big(T) : cur.big;
  const lines = (cur.lines ?? []).map(([text, at, color]) => ({ text, at, color }));
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 60, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontSize: 24, fontWeight: 800, letterSpacing: 4, color: H }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: R, opacity: Math.sin(T * 6) > 0 ? 1 : 0.3 }} />
        IRAN – IRAQ WAR · EXPLAINED
      </div>
      <HudBlock key={cur.t} big={big} lines={lines} T={T} start={cur.t} accent={cur.accent ?? R} />
      <Legend
        T={T}
        note="Internationally recognised borders · held areas approximate"
        items={[
          { color: "rgba(52,199,123,0.7)", text: "Iran", at: 0.8 },
          { color: "rgba(255,59,74,0.7)", text: "Iraq", at: 0.9 },
          { color: "rgba(255,59,74,0.6)", hatch: true, text: "Iraqi-held areas in Iran, 1980–82 (approx.)", at: 38.8 },
          { color: "rgba(52,199,123,0.6)", hatch: true, text: "Iranian-held areas in Iraq (approx.)", at: 58.4 },
        ]}
      />
      <SubscribeNudge T={T} until={CTA_T} top={330} />
      {T >= CTA_T && <CtaCard T={T} top={1380} likeT={CTA_T + 0.3} shareT={CTA_T + 0.9} subT={CTA_T + 1.5} />}
    </>
  );
};

export const IranIraqWar: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const cue = (t: number, sfx: string, vol = 0.25, len = 45) => (
    <Sequence key={`${sfx}${t}`} from={Math.round(t * fps)} durationInFrames={len}>
      <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cue(0.2, "riser", 0.15, 60)}
      {cue(8.9, "boom", 0.25, 60)}
      {cue(30.7, "boom", 0.3, 60)}
      {cue(35.1, "whoosh", 0.2)}
      {cue(41.1, "whoosh", 0.2)}
      {cue(55.0, "whoosh", 0.18)}
      {cue(57.9, "whoosh", 0.18)}
      {cue(70.4, "ding", 0.25)}
      {nudgeTimes(CTA_T).map((t) => cue(t + 1.1, "ding", 0.22))}
      {cue(CTA_T + 2.7, "ding", 0.3)}
      <IranIraqScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};
