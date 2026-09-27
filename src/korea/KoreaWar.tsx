import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { BODY } from "../airace/fonts";
import { Billboard, cut, HudBlock, Legend, MapLabel } from "../warmap/WarMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import {
  CN_EAST, CN_WEST, FRONTS, KOR, LONS, MDL, NK_EAST, NK_MAIN, OTHERS, PLACES, PRK, UN_ARRIVE, UN_EAST, UN_INCHEON, UN_NORTH, USSR_LINK, type Pt,
} from "./data";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const REF_LAT = 38;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const TILT = 30;
const PW = 1900;
const PH = 3300;
const FOCUS_Y = 980;

const C = {
  ocean: "#05080f",
  land: "#111722",
  landEdge: "#27324a",
  side: "#020306",
  korea: "#18202e",
  koreaEdge: "#d7e3f5",
  north: "rgba(255,59,74,0.30)",
  south: "rgba(77,163,255,0.30)",
  red: "#ff3b4a",
  blue: "#4da3ff",
  china: "#ff8a3d",
  hud: "#9fd8ff",
  gold: "#ffd23f",
};

// ---- word-synced timeline -----------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
type View = { lon: number; lat: number; span: number };
const V: Record<string, View> = {
  open: { lon: 127.6, lat: 38.4, span: 22 },
  p38: { lon: 127.0, lat: 38.1, span: 9 },
  cross: { lon: 125.9, lat: 38.9, span: 6 },
  seoul: { lon: 126.98, lat: 37.6, span: 4.6 },
  south: { lon: 128.2, lat: 36.3, span: 8.5 },
  peninsula: { lon: 127.3, lat: 38.4, span: 11 },
  wide: { lon: 126.4, lat: 39.9, span: 18 },
  arm: { lon: 127.5, lat: 38.1, span: 8.5 },
  mdl: { lon: 127.3, lat: 38.15, span: 5.5 },
  end: { lon: 128.3, lat: 38.0, span: 26 },
};

const buildTimeline = (secs: Section[], total: number) => {
  const S = (i: number) => secs[Math.min(i, secs.length - 1)];
  const at = (i: number, word: string, fallback = 0.5) => {
    const s = S(i);
    const w = s.words.find((x) => norm(x.word) === norm(word)) ?? s.words.find((x) => norm(x.word).startsWith(norm(word)));
    return w ? w.start : s.start + fallback;
  };
  const t = {
    S,
    at,
    crossT: at(2, "crossed", 1),
    sovietT: at(2, "soviet", 5),
    seoulT: at(3, "seoul", 3),
    unitedT: at(4, "united", 2),
    deepT: at(5, "deep", 3),
    chinaT: at(6, "china", 0.5),
    pushT: at(6, "pushing", 2),
    stabT: at(7, "stabilized", 2),
    armT: at(8, "armistice", 1),
  };
  const raw: [number, View][] = [
    [0, V.open],
    [S(1).end, V.p38],
    [S(2).start + 0.2, V.p38],
    [t.crossT, V.cross],
    [t.seoulT + 0.3, V.seoul],
    [S(4).start + 0.2, V.seoul],
    [S(4).start + 1.8, V.south],
    [S(5).start + 0.2, V.south],
    [S(5).start + 2.0, V.peninsula],
    [S(6).start + 0.2, V.peninsula],
    [t.chinaT + 0.8, V.wide],
    [S(7).start + 0.3, V.wide],
    [S(7).start + 2.2, V.arm],
    [S(9).start, V.arm],
    [S(10).start + 0.5, V.mdl],
    [S(11).start + 0.3, V.mdl],
    [total + 1, V.end],
  ];
  const keys: [number, View][] = [];
  for (const [k, v] of raw) keys.push([keys.length ? Math.max(k, keys[keys.length - 1][0] + 0.05) : k, v]);
  return { ...t, keys };
};
type TL = ReturnType<typeof buildTimeline>;

// NK flag progress: crosses the 38th parallel during "crossed…invaded", reaches Seoul on "Seoul".
const nkProgress = (tl: TL, T: number) =>
  T < tl.S(3).start
    ? 0.68 * ease(clamp((T - tl.crossT) / Math.max(0.5, tl.S(2).end - tl.crossT - 0.5)))
    : 0.68 + 0.32 * ease(clamp((T - tl.S(3).start) / Math.max(0.5, tl.seoulT + 0.3 - tl.S(3).start)));

const cameraAt = (tl: TL, T: number): View => {
  // Follow camera: ride the North Korean flag from Pyongyang across the 38th parallel to Seoul.
  if (T > tl.crossT && T < tl.seoulT + 0.3) {
    const p = nkProgress(tl, T);
    const tip = cut(NK_MAIN, p).tip;
    const c0 = V.cross;
    const c1 = V.seoul;
    return { lon: lerp(lerp(c0.lon, tip[0], clamp(p * 3)), c1.lon, clamp((p - 0.85) / 0.15)), lat: lerp(lerp(c0.lat, tip[1], clamp(p * 3)), c1.lat, clamp((p - 0.85) / 0.15)), span: c0.span * Math.pow(c1.span / c0.span, p) };
  }
  const keys = tl.keys;
  let k = 0;
  while (k < keys.length - 2 && T >= keys[k + 1][0]) k++;
  const [t0, a] = keys[k];
  const [t1, b] = keys[k + 1];
  const p = ease(clamp((T - t0) / Math.max(0.01, t1 - t0)));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const regionFor = (v: View): Region => {
  const scale = PW / (v.span * COS);
  const latMax = v.lat + (0.5 * PH) / scale;
  return { lonMin: v.lon - v.span / 2, lonMax: v.lon + v.span / 2, latMin: latMax - PH / scale, latMax, refLat: REF_LAT, noWrap: true };
};

// Front line position over time (approximate, historically dated).
const frontAt = (tl: TL, T: number): number[] => {
  const { S, chinaT, stabT } = tl;
  // The first move follows the flag: the route crosses 38°N at ~68% of its length.
  const first = clamp((nkProgress(tl, T) - 0.68) / 0.32);
  let cur = FRONTS.p38.map((v, i) => lerp(v, FRONTS.seoul[i], first));
  const segs: [number, number, string, string][] = [
    [S(4).start + 0.4, S(4).start + 3.2, "seoul", "pusan"],
    [S(5).start + 0.5, S(5).end, "pusan", "north"],
    [chinaT + 0.4, S(6).end, "north", "china"],
    [S(7).start + 0.5, stabT + 0.8, "china", "armistice"],
  ];
  for (const [a, b, from, to] of segs) {
    if (T < a) break;
    const p = ease(clamp((T - a) / Math.max(0.1, b - a)));
    cur = FRONTS[from].map((v, i) => lerp(v, FRONTS[to][i], p));
  }
  return cur;
};

// ---- flags --------------------------------------------------------------------------

export type FlagKind = "NK" | "SK" | "UN" | "CN" | "SU" | "US" | "JP" | "IR" | "IQ" | "IR_OLD";
const FLAG_EDGE: Record<FlagKind, string> = { NK: C.red, SK: C.blue, UN: C.blue, CN: C.china, SU: C.red, US: C.blue, JP: C.red, IR: "#34c77b", IQ: C.red, IR_OLD: "#34c77b" };

export const Cloth: React.FC<{ kind: FlagKind; w: number; frame: number }> = ({ kind, w, frame }) => {
  const h = w * 0.66;
  const wave = Math.sin(frame * 0.25) * 4;
  const box: React.CSSProperties = { width: w, height: h, transform: `skewY(${wave}deg)`, transformOrigin: "0 50%", border: "2px solid rgba(0,0,0,0.6)", boxShadow: "0 0 18px rgba(255,255,255,0.2)", position: "relative", overflow: "hidden" };
  if (kind === "NK")
    return (
      <div style={{ ...box, background: "linear-gradient(#024fa2 0 17%, #fff 17% 21%, #ed1c27 21% 79%, #fff 79% 83%, #024fa2 83%)" }}>
        <div style={{ position: "absolute", left: w * 0.18, top: h * 0.3, width: h * 0.4, height: h * 0.4, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#ed1c27", fontSize: h * 0.36, lineHeight: 1 }}>★</div>
      </div>
    );
  if (kind === "SK")
    return (
      <div style={{ ...box, background: "#fff" }}>
        <div style={{ position: "absolute", left: w / 2 - h * 0.2, top: h * 0.3, width: h * 0.4, height: h * 0.4, borderRadius: "50%", background: "linear-gradient(#cd2e3a 50%, #0047a0 50%)" }} />
        {[[0.14, 0.14], [0.76, 0.14], [0.14, 0.7], [0.76, 0.7]].map(([x, y], i) => (
          <div key={i} style={{ position: "absolute", left: w * x, top: h * y, width: w * 0.12, height: h * 0.16, background: "repeating-linear-gradient(#000 0 3px, transparent 3px 5px)" }} />
        ))}
      </div>
    );
  if (kind === "UN")
    return (
      <div style={{ ...box, background: "#4b92db", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: h * 0.5, height: h * 0.5, borderRadius: "50%", border: "3px solid #fff", boxShadow: "inset 0 0 0 5px #4b92db, inset 0 0 0 7px #fff" }} />
      </div>
    );
  if (kind === "CN")
    return (
      <div style={{ ...box, background: "#de2910", color: "#ffde00", fontSize: h * 0.42, lineHeight: 1, paddingLeft: w * 0.08, paddingTop: h * 0.06 }}>★</div>
    );
  if (kind === "US")
    return (
      <div style={{ ...box, background: "repeating-linear-gradient(#b22234 0 7.7%, #fff 7.7% 15.4%)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: w * 0.42, height: h * 0.54, background: "#3c3b6e", backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.6px)", backgroundSize: `${w * 0.07}px ${h * 0.1}px` }} />
      </div>
    );
  if (kind === "JP")
    return (
      <div style={{ ...box, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: h * 0.56, height: h * 0.56, borderRadius: "50%", background: "#bc002d" }} />
      </div>
    );
  // Iran before 1980: tricolour with the gold lion-and-sun emblem.
  if (kind === "IR_OLD")
    return (
      <div style={{ ...box, background: "linear-gradient(#239f40 0 33.3%, #fff 33.3% 66.6%, #da0000 66.6%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: h * 0.3, height: h * 0.3, borderRadius: "50%", background: "radial-gradient(#ffd23f 45%, #c9901a 46% 60%, transparent 61%)" }} />
      </div>
    );
  // Iran after 1980: green/white/red with the red emblem.
  if (kind === "IR")
    return (
      <div style={{ ...box, background: "linear-gradient(#239f40 0 33.3%, #fff 33.3% 66.6%, #da0000 66.6%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={h * 0.3} height={h * 0.3} viewBox="0 0 20 20">
          <path d="M10 2 C4 6 4 14 10 18 C16 14 16 6 10 2 Z" fill="none" stroke="#da0000" strokeWidth={2.4} />
          <rect x={9} y={3} width={2} height={14} fill="#da0000" />
        </svg>
      </div>
    );
  // Iraq 1963–1991: red/white/black with three green stars (no inscription until 1991).
  if (kind === "IQ")
    return (
      <div style={{ ...box, background: "linear-gradient(#ce1126 0 33.3%, #fff 33.3% 66.6%, #000 66.6%)", display: "flex", alignItems: "center", justifyContent: "center", gap: w * 0.08, color: "#007a3d", fontSize: h * 0.28, lineHeight: 1 }}>
        <span>★</span>
        <span>★</span>
        <span>★</span>
      </div>
    );
  return (
    <div style={{ ...box, background: "#cc0000" }}>
      {/* Hammer & sickle so the USSR flag isn't confused with China's. */}
      <svg width={h * 0.5} height={h * 0.5} viewBox="0 0 20 20" style={{ position: "absolute", left: w * 0.06, top: h * 0.08 }}>
        <path d="M14.5 4.5 A7 7 0 1 1 4.5 14.5" stroke="#ffd700" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        <rect x={8.2} y={3} width={2.6} height={12} transform="rotate(45 9.5 9)" fill="#ffd700" />
        <rect x={5.5} y={2.2} width={7} height={3} transform="rotate(45 9.5 9)" fill="#ffd700" />
      </svg>
    </div>
  );
};

export const Flag: React.FC<{ kind: FlagKind; frame: number; label?: string; pulse?: number }> = ({ kind, frame, label, pulse = 0 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    {label && <div style={{ fontFamily: BODY, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: "#fff", background: "rgba(10,14,22,0.88)", border: `1px solid ${FLAG_EDGE[kind]}`, padding: "2px 10px", marginBottom: 8, whiteSpace: "nowrap" }}>{label}</div>}
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ width: 5, height: 104, background: "linear-gradient(#ddd, #777)" }} />
      <Cloth kind={kind} w={78} frame={frame} />
    </div>
    <div style={{ width: 44, height: 20, marginTop: -2, background: "#0b0f17", border: `2px solid ${FLAG_EDGE[kind]}`, borderRadius: 4, boxShadow: `0 0 ${14 + pulse * 20}px ${FLAG_EDGE[kind]}` }} />
  </div>
);

// ---- scene --------------------------------------------------------------------------

export const KoreaScene: React.FC<{ timing: Timing; T: number; frame: number; hud?: boolean }> = ({ timing, T, frame, hud = true }) => {
  const { width, height } = useVideoConfig();
  const tl = React.useMemo(() => buildTimeline(timing.sections, timing.durationSec), [timing]);
  const { S, crossT, sovietT, seoulT, chinaT, armT } = tl;

  const cam = cameraAt(tl, T);
  const prev = cameraAt(tl, T - 1 / 30);
  const proj = makeProjector(regionFor(cam), PW, PH);
  const P = (lon: number, lat: number) => proj(lon, lat);
  const [cx, cy] = P(cam.lon, cam.lat);
  const [px, py] = makeProjector(regionFor(prev), PW, PH)(cam.lon, cam.lat);
  const blur = Math.min(5, Math.hypot(cx - px, cy - py) / 30 + Math.abs(Math.log(cam.span / prev.span)) * 60);
  const pts = (list: Pt[]) => list.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join(" ");

  const front = frontAt(tl, T);
  const frontPts: Pt[] = LONS.map((lo, i) => [lo, front[i]]);
  const northPoly = { type: "Polygon", coordinates: [[[LONS[0], 44], [LONS[LONS.length - 1], 44], ...[...frontPts].reverse()]] };
  const southPoly = { type: "Polygon", coordinates: [[[LONS[0], 32.5], [LONS[LONS.length - 1], 32.5], ...[...frontPts].reverse()]] };

  const bScale = clamp(7 / cam.span, 0.55, 1.15);
  const flagsOn = clamp((21 - cam.span) / 5);
  const citiesOn = clamp((16 - cam.span) / 4);

  const nkP = nkProgress(tl, T);
  const fadeNK = 1 - clamp((T - S(5).start - 0.6) / 1.0);
  const fadeUN = 1 - clamp((T - chinaT - 1.2) / 1.2);
  const fadeCN = 1 - clamp((T - S(7).start - 1.6) / 1.2);
  const draw = (a: number, b: number) => ease(clamp((T - a) / Math.max(0.1, b - a)));

  const routes: { pts: Pt[]; f: number; color: string; op: number; id: string }[] = [
    { id: "nk", pts: NK_MAIN, f: nkP, color: C.red, op: fadeNK },
    ...NK_EAST.map((r, i) => ({ id: `nke${i}`, pts: r, f: clamp(nkP * 1.1 - i * 0.08), color: C.red, op: fadeNK })),
    { id: "una", pts: UN_ARRIVE, f: draw(S(4).start + 0.4, S(4).start + 2.4), color: C.blue, op: fadeUN },
    { id: "uni", pts: UN_INCHEON, f: draw(S(5).start + 0.3, S(5).start + 1.6), color: C.blue, op: fadeUN },
    { id: "unn", pts: UN_NORTH, f: draw(S(5).start + 0.6, S(5).end), color: C.blue, op: fadeUN },
    { id: "une", pts: UN_EAST, f: draw(S(5).start + 1.0, S(5).end), color: C.blue, op: fadeUN },
    { id: "cnw", pts: CN_WEST, f: draw(chinaT + 0.2, S(6).end), color: C.china, op: fadeCN },
    { id: "cne", pts: CN_EAST, f: draw(chinaT + 0.5, S(6).end), color: C.china, op: fadeCN },
  ];

  // Flag positions follow the routes.
  const ukFlag = cut(NK_MAIN, nkP).tip;
  const skPos: Pt = T < S(3).start ? [128.5, 36.9] : T < S(5).start ? (cut([[128.5, 36.9], [128.6, 35.87]], draw(S(3).start, S(4).start + 2)).tip) : cut([[128.6, 35.87], [127.2, 37.2]], draw(S(5).start + 0.5, S(5).end)).tip;
  let unPos: Pt = cut(UN_ARRIVE, draw(S(4).start + 0.4, S(4).start + 2.4)).tip;
  if (T >= S(5).start) unPos = cut(UN_NORTH, draw(S(5).start + 0.6, S(5).end)).tip;
  if (T >= S(6).start) unPos = cut([UN_NORTH[UN_NORTH.length - 1], [127.8, 36.6]], draw(chinaT + 0.3, S(6).end)).tip;
  if (T >= S(7).start) unPos = cut([[127.8, 36.6], [127.7, 37.6]], draw(S(7).start + 0.5, S(7).end)).tip;
  let cnPos: Pt = cut(CN_WEST, draw(chinaT + 0.2, S(6).end)).tip;
  if (T >= S(7).start) cnPos = cut([CN_WEST[CN_WEST.length - 1], [126.6, 38.5]], draw(S(7).start + 0.5, S(7).end)).tip;

  const flash = T > crossT - 0.2 ? clamp(1 - Math.abs(T - crossT - 0.05) / 0.3) : 0;
  const shake = T > crossT && T < crossT + 0.5 ? Math.sin(T * 90) * 5 * (1 - (T - crossT) / 0.5) : 0;
  const sepia = clamp(Math.min((T - S(3).start) * 2, (S(4).start + 0.5 - T) * 2));
  const p38Op = T < S(3).start ? 0.95 : T < S(7).start ? 0.45 : T < S(9).start ? 0.95 : 0.4;

  const planeLeft = (width - PW) / 2;
  const planeTop = FOCUS_Y - PH / 2;
  const glowLine = (id: string, list: Pt[], color: string, w: number, op: number) => (
    <g key={id} opacity={op}>
      <polyline points={pts(list)} fill="none" stroke={color} strokeWidth={w * 2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#kglow)" opacity={0.5} />
      <polyline points={pts(list)} fill="none" stroke="#ffffff" strokeWidth={w * 0.8} strokeDasharray="20 14" strokeDashoffset={-frame * 2.5} strokeLinecap="round" opacity={0.85} />
    </g>
  );

  const bb = (lon: number, lat: number, node: React.ReactNode, op = 1, key?: string, dx = 0) => {
    const [x, y] = P(lon, lat);
    return op > 0.01 ? (
      <Billboard key={key} x={x + dx} y={y} opacity={op} scale={bScale}>
        {node}
      </Billboard>
    ) : null;
  };

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden", filter: sepia > 0 ? `sepia(${(sepia * 0.45).toFixed(2)}) contrast(${1 + sepia * 0.08})` : undefined }}>
      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: `50% ${FOCUS_Y}px`, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ position: "absolute", left: planeLeft, top: planeTop, width: PW, height: PH, transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d", filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="kglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="koreaLand">
                <path d={geomPath(PRK, P)} />
                <path d={geomPath(KOR, P)} />
              </clipPath>
              <radialGradient id="klight" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="rgba(120,170,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            <rect width={PW} height={PH} fill={C.ocean} />
            {Array.from({ length: 40 }, (_, i) => {
              const lo = Math.floor((cam.lon - cam.span) / 2) * 2 + i * 2;
              const [x] = P(lo, cam.lat);
              return <line key={`lo${i}`} x1={x} y1={0} x2={x} y2={PH} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            {Array.from({ length: 40 }, (_, i) => {
              const la = Math.floor((cam.lat - cam.span) / 2) * 2 + i * 2;
              const [, y] = P(cam.lon, la);
              return <line key={`la${i}`} x1={0} y1={y} x2={PW} y2={y} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}

            <g transform="translate(0 12)">
              {OTHERS.map((c) => (
                <path key={`s${c.iso}`} d={geomPath(c.geom, P)} fill={C.side} />
              ))}
              <path d={geomPath(PRK, P)} fill={C.side} />
              <path d={geomPath(KOR, P)} fill={C.side} />
            </g>
            {OTHERS.map((c) => (
              <path key={c.iso} d={geomPath(c.geom, P)} fill={c.iso === "CHN" ? "#1f1618" : c.iso === "RUS" ? "#1a1922" : C.land} stroke={c.iso === "CHN" ? "rgba(255,138,61,0.55)" : C.landEdge} strokeWidth={1.8} strokeLinejoin="round" />
            ))}

            {/* One peninsula, no modern internal border: outline stroke first, then fills cover the shared edge. */}
            <path d={geomPath(PRK, P)} fill="none" stroke={C.koreaEdge} strokeWidth={6} strokeLinejoin="round" filter="url(#kglow)" opacity={0.8} />
            <path d={geomPath(KOR, P)} fill="none" stroke={C.koreaEdge} strokeWidth={6} strokeLinejoin="round" filter="url(#kglow)" opacity={0.8} />
            <path d={geomPath(PRK, P)} fill={C.korea} stroke={C.korea} strokeWidth={2.5} />
            <path d={geomPath(KOR, P)} fill={C.korea} stroke={C.korea} strokeWidth={2.5} />

            <g clipPath="url(#koreaLand)">
              <path d={geomPath(northPoly, P)} fill={C.north} />
              <path d={geomPath(southPoly, P)} fill={C.south} />
              {T > crossT && <polyline points={pts(frontPts)} fill="none" stroke={C.gold} strokeWidth={7} strokeLinejoin="round" filter="url(#kglow)" />}
            </g>

            {/* 38th parallel (1945 division) */}
            <line x1={P(123.3, 38)[0]} y1={P(123.3, 38)[1]} x2={P(131.8, 38)[0]} y2={P(131.8, 38)[1]} stroke="#ffffff" strokeWidth={4} strokeDasharray="16 12" opacity={p38Op} />

            {/* Armistice line, 1953 */}
            {T > armT - 0.2 && glowLine("mdl", cut(MDL, draw(armT - 0.2, armT + 1.4)).pts, C.hud, 4, 1)}

            {T > sovietT && glowLine("su", cut(USSR_LINK, draw(sovietT, sovietT + 1.3)).pts, C.red, 2, 0.55 * (1 - clamp((T - S(4).start) / 1.2)))}

            {routes.map((r) => {
              if (r.f <= 0 || r.op <= 0.01) return null;
              const c = cut(r.pts, r.f);
              const [tx, ty] = P(c.tip[0], c.tip[1]);
              const [bx, by] = P(c.tip[0] - Math.cos(c.ang) * 0.01, c.tip[1] - Math.sin(c.ang) * 0.01);
              const a = Math.atan2(ty - by, tx - bx);
              return (
                <g key={r.id} opacity={r.op}>
                  {glowLine(`${r.id}l`, c.pts, r.color, 4, 1)}
                  <polygon points={`${tx + Math.cos(a) * 26},${ty + Math.sin(a) * 26} ${tx + Math.cos(a + 2.5) * 20},${ty + Math.sin(a + 2.5) * 20} ${tx + Math.cos(a - 2.5) * 20},${ty + Math.sin(a - 2.5) * 20}`} fill={r.color} filter="url(#kglow)" />
                </g>
              );
            })}

            {T > seoulT - 0.6 && T < S(4).start + 1.5 &&
              [0, 1, 2].map((k) => {
                const ph = ((T - seoulT) * 0.8 + k / 3 + 3) % 1;
                const [sx, sy] = P(126.98, 37.57);
                return <circle key={k} cx={sx} cy={sy} r={20 + ph * 180} fill="none" stroke={C.red} strokeWidth={4} opacity={(1 - ph) * 0.8} />;
              })}

            <rect width={PW} height={PH} fill="url(#klight)" />
          </svg>

          {/* labels */}
          {PLACES.map((pl) => {
            const minor = pl.kind === "city";
            let op = minor ? citiesOn : clamp((T - 0.5) * 1.5) * clamp((cam.span - 5.5) / 2.5);
            if (pl.name === "INCHEON") op *= clamp((T - S(5).start) * 2) * (1 - clamp((T - S(6).start) * 2));
            if (pl.name === "USSR" || pl.name === "CHINA" || pl.name === "JAPAN") op *= clamp((cam.span - 8) / 4);
            const seoulCaptured = pl.name === "SEOUL" && T > seoulT && T < S(5).start + 1;
            return bb(pl.lon, pl.lat, <MapLabel text={seoulCaptured ? "SEOUL · CAPTURED" : pl.name} kind={pl.kind} color={seoulCaptured ? "#ff9aa3" : undefined} />, op, pl.name);
          })}
          {bb(123.7, 38.02, <MapLabel text="38TH PARALLEL" kind="region" color="#ffffff" />, p38Op * clamp((T - 0.8) * 2), "p38")}
          {T > armT && bb(129.4, 38.75, <MapLabel text="ARMISTICE LINE · 1953" kind="region" color={C.hud} />, clamp((T - armT - 0.8) * 2), "mdl")}

          {/* flags */}
          {bb(ukFlag[0], ukFlag[1], <Flag kind="NK" frame={frame} pulse={T < crossT ? 0.5 + 0.5 * Math.sin(frame * 0.3) : 0} />, fadeNK * flagsOn, "nkf")}
          {bb(skPos[0], skPos[1], <Flag kind="SK" frame={frame} />, flagsOn * (1 - clamp((T - S(5).start - 1) / 1)), "skf")}
          {T > S(4).start + 0.3 && bb(unPos[0], unPos[1], <Flag kind="UN" frame={frame} label={T < S(6).start ? "UN · LED BY US" : undefined} />, flagsOn * clamp((T - S(4).start - 0.3) * 3), "unf")}
          {T > chinaT && bb(cnPos[0], cnPos[1], <Flag kind="CN" frame={frame} label={T < S(7).start ? "CHINA" : undefined} />, flagsOn * clamp((T - chinaT) * 3), "cnf")}
          {T > sovietT && bb(USSR_LINK[0][0], USSR_LINK[0][1], <Flag kind="SU" frame={frame} label="USSR · BACKED THE NORTH" />, clamp((T - sovietT) * 3) * (1 - clamp((T - S(4).start) / 1.2)), "suf")}
        </div>
      </AbsoluteFill>

      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 197.3) % width;
        const y = (height - ((T * (14 + (i % 5) * 6) + i * 131) % (height + 40))) % height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: "#9fd8ff", opacity: 0.12 + (i % 4) * 0.05 }} />;
      })}
      {sepia > 0 && <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)", opacity: sepia * (0.5 + 0.5 * Math.abs(Math.sin(frame * 1.7))) }} />}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.85) 0%, rgba(3,5,10,0) 22%, rgba(3,5,10,0) 70%, rgba(3,5,10,0.92) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.8 }} />

      {hud && <KoreaHud T={T} tl={tl} />}
    </AbsoluteFill>
  );
};

const KoreaHud: React.FC<{ T: number; tl: TL }> = ({ T, tl }) => {
  const { S, at, crossT, sovietT, seoulT, unitedT, deepT, chinaT, pushT, stabT, armT } = tl;
  const top = (
    <div style={{ position: "absolute", left: 60, top: 60, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontSize: 24, fontWeight: 800, letterSpacing: 4, color: C.hud }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.red, opacity: Math.sin(T * 6) > 0 ? 1 : 0.3 }} />
      THE KOREAN WAR · EXPLAINED
    </div>
  );
  const blocks: { until: number; node: React.ReactNode }[] = [
    { until: S(2).start, node: <HudBlock big="JUNE 25, 1950" T={T} start={0.2} accent={C.hud} lines={[{ text: "The Korean War begins", at: S(1).start, color: C.hud }]} /> },
    { until: S(3).start, node: <HudBlock big="INVASION" T={T} start={S(2).start} lines={[{ text: "North Korean forces cross the 38th parallel", at: crossT }, { text: "Backed by the Soviet Union", at: sovietT }]} /> },
    { until: S(4).start, node: <HudBlock big="SEOUL" T={T} start={S(3).start} lines={[{ text: "Jun 28, 1950: Seoul captured", at: seoulT }]} /> },
    { until: S(5).start, node: <HudBlock big="UN COALITION" T={T} start={S(4).start} accent={C.blue} lines={[{ text: "Led by the United States", at: unitedT, color: C.blue }, { text: "Aug 1950: Pusan Perimeter", at: S(4).start + 2.4, color: C.blue }]} /> },
    { until: S(6).start, node: <HudBlock big="COUNTERATTACK" T={T} start={S(5).start} accent={C.blue} lines={[{ text: "Sep 1950: Incheon landing", at: S(5).start + 0.5, color: C.blue }, { text: "UN forces advance deep into the North", at: deepT, color: C.blue }]} /> },
    { until: S(7).start, node: <HudBlock big="CHINA ENTERS" T={T} start={S(6).start} accent={C.china} lines={[{ text: "Oct 1950: Chinese forces cross into Korea", at: chinaT, color: C.china }, { text: "UN forces pushed back south", at: pushT, color: C.china }]} /> },
    { until: S(8).start, node: <HudBlock big="1951 – 1953" T={T} start={S(7).start} accent={C.gold} lines={[{ text: "Front stabilizes near the 38th parallel", at: stabT, color: C.gold }]} /> },
    { until: S(9).start, node: <HudBlock big="1953 — ARMISTICE" T={T} start={S(8).start} accent={C.hud} lines={[{ text: "Jul 27, 1953: armistice signed", at: armT, color: C.hud }]} /> },
    { until: S(10).start, node: <HudBlock big="BUT…" T={T} start={S(9).start} accent={C.red} lines={[]} /> },
    { until: S(11).start, node: <HudBlock big="NO PEACE TREATY" T={T} start={S(10).start} accent={C.red} lines={[{ text: "North and South Korea never signed one", at: S(10).start + 1.2 }]} /> },
    { until: S(12).start, node: <HudBlock big="NEVER ENDED" T={T} start={S(11).start} accent={C.red} lines={[{ text: "Technically, the war never formally ended", at: S(11).start + 0.6 }]} /> },
    { until: 1e9, node: <HudBlock big="SUBSCRIBE" T={T} start={S(12).start} accent={C.red} lines={[{ text: "For more history on the map", at: S(12).start + 0.4, color: C.hud }]} /> },
  ];
  const block = blocks.find((b) => T < b.until)?.node;
  const ctaT = S(12).start;
  return (
    <>
      {top}
      {block}
      <SubscribeNudge T={T} until={ctaT} top={330} />
      {T >= ctaT && <CtaCard T={T} top={1380} likeT={at(12, "like", 0.5)} shareT={at(12, "share", 0.9)} subT={at(12, "subscribe", 1.4)} />}
      <Legend
        T={T}
        note="Front lines approximate · no post-1953 border shown before the armistice"
        items={[
          { color: "rgba(255,59,74,0.6)", text: "North Korea & allies (approx.)", at: 1.2 },
          { color: "rgba(77,163,255,0.6)", text: "South Korea & UN (approx.)", at: 1.4 },
          { color: "#ffffff", hatch: true, text: "38th parallel: 1945 division line", at: 1.6 },
          { color: C.hud, hatch: true, text: "Armistice line, 1953 (approx.)", at: armT + 0.6 },
        ]}
      />
    </>
  );
};

export const KoreaWar: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const tl = React.useMemo(() => buildTimeline(timing.sections, timing.durationSec), [timing]);
  const cue = (t: number, sfx: string, vol = 0.3, len = 45) => (
    <Sequence key={`${sfx}${t.toFixed(2)}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
      <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
    </Sequence>
  );
  const { S } = tl;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cue(0, "riser", 0.2, 60)}
      {cue(tl.crossT, "boom", 0.35, 60)}
      {cue(tl.seoulT, "whoosh", 0.25)}
      {cue(S(4).start + 0.3, "whoosh", 0.25)}
      {cue(S(5).start + 0.3, "whoosh", 0.25)}
      {cue(tl.chinaT, "whoosh", 0.3)}
      {cue(tl.armT, "ding", 0.3)}
      {cue(S(10).start, "boom", 0.35, 60)}
      {nudgeTimes(S(12).start).map((t) => cue(t + 1.1, "ding", 0.3))}
      {cue(tl.at(12, "subscribe", 1.4) + 1.2, "ding", 0.35)}
      <KoreaScene timing={timing} T={T} frame={frame} />
    </AbsoluteFill>
  );
};
