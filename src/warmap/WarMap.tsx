import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { BODY, DISPLAY } from "../airace/fonts";
import { ADVANCE, BLR, CRIMEA, CRIMEA_2014, DONBAS_2014, DONBAS_MOVE, OTHERS, PLACES, ROUTES, RUS, UKR, type Route } from "./data";

type Pt = [number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const REF_LAT = 48;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const TILT = 30;
const PW = 1900;
const PH = 3300;
// Screen y where the camera target lands (midway between headline and legend).
const FOCUS_Y = 1000;

const C = {
  ocean: "#05080f",
  land: "#111722",
  landEdge: "#27324a",
  side: "#020306",
  rus: "#2a1217",
  rusEdge: "rgba(255,80,95,0.75)",
  ukr: "#132746",
  ukrEdge: "#ffd23f",
  blr: "#1a1f2b",
  red: "#ff3b4a",
  hud: "#9fd8ff",
};

// ---- word-synced timeline -----------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const makeClock = (secs: Section[]) => {
  const at = (i: number, word: string, fallback = 0.5) => {
    const s = secs[Math.min(i, secs.length - 1)];
    const w = s.words.find((x) => norm(x.word) === norm(word)) ?? s.words.find((x) => norm(x.word).startsWith(norm(word)));
    return w ? w.start : s.start + fallback;
  };
  const S = (i: number) => secs[Math.min(i, secs.length - 1)];
  return { at, S };
};

type View = { lon: number; lat: number; span: number };
const V: Record<string, View> = {
  wide: { lon: 34, lat: 50.5, span: 62 },
  region: { lon: 33, lat: 48.6, span: 27 },
  crimea: { lon: 34.9, lat: 46.2, span: 12 },
  donbas: { lon: 38.7, lat: 48.1, span: 10 },
  ukraine: { lon: 33.4, lat: 49.3, span: 25 },
  ne: { lon: 36.2, lat: 50.2, span: 13 },
  north: { lon: 30.4, lat: 51.2, span: 13 },
  south: { lon: 34.6, lat: 46.5, span: 14 },
  kyiv: { lon: 31.0, lat: 50.3, span: 15 },
  europe: { lon: 28, lat: 50, span: 50 },
  world: { lon: 35, lat: 44, span: 118 },
  back: { lon: 32.4, lat: 48.8, span: 30 },
  end: { lon: 32.4, lat: 48.8, span: 23 },
};

const buildKeys = (secs: Section[], total: number) => {
  const { at, S } = makeClock(secs);
  const whileT = at(1, "while", 5);
  const ruT = at(3, "russia", 2);
  const byT = at(3, "belarus", 3);
  const crT = at(3, "crimea", 4);
  const warT = at(4, "war", 3);
  const raw: [number, View][] = [
    [0, V.wide],
    [S(0).end, V.region],
    [S(1).start + 0.3, V.region],
    [S(1).start + 2.0, V.crimea],
    [whileT, V.crimea],
    [whileT + 1.4, V.donbas],
    [S(2).start + 0.2, V.donbas],
    [S(2).start + 1.6, V.ukraine],
    [ruT, V.ukraine],
    [ruT + 0.8, V.ne],
    [byT, V.ne],
    [byT + 0.8, V.north],
    [crT, V.north],
    [crT + 0.8, V.south],
    [S(3).end, V.south],
    [S(4).start + 1.0, V.kyiv],
    [warT, V.kyiv],
    [warT + 2.2, V.europe],
    [S(5).start + 0.3, V.europe],
    [S(5).start + 2.6, V.world],
    [S(6).start + 0.3, V.world],
    [S(6).start + 2.8, V.back],
    [total + 1, V.end],
  ];
  // Keep keys strictly increasing even if word timings bunch up.
  const keys: [number, View][] = [];
  for (const [t, v] of raw) keys.push([keys.length ? Math.max(t, keys[keys.length - 1][0] + 0.05) : t, v]);
  return { keys, whileT, ruT, byT, crT, warT, at, S };
};

const cameraAt = (keys: [number, View][], T: number): View => {
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

// ---- polyline helpers ----------------------------------------------------------------

export const cut = (pts: Pt[], f: number): { pts: Pt[]; tip: Pt; ang: number } => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * clamp(f);
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < segs.length; i++) {
    if (left >= segs[i]) {
      out.push(pts[i + 1]);
      left -= segs[i];
      continue;
    }
    const q = segs[i] ? left / segs[i] : 0;
    out.push([lerp(pts[i][0], pts[i + 1][0], q), lerp(pts[i][1], pts[i + 1][1], q)]);
    break;
  }
  const tip = out[out.length - 1];
  const prev = out.length > 1 ? out[out.length - 2] : pts[0];
  const nxt = out.length > 1 ? tip : pts[1];
  return { pts: out, tip, ang: Math.atan2(nxt[1] - prev[1], nxt[0] - prev[0]) };
};

// ---- billboards (stand upright on the tilted map) -----------------------------------

export const Billboard: React.FC<{ x: number; y: number; children: React.ReactNode; opacity?: number; scale?: number }> = ({ x, y, children, opacity = 1, scale = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) rotateX(${-TILT}deg) scale(${scale})`, transformOrigin: "50% 100%", opacity, pointerEvents: "none" }}>{children}</div>
);

const FlagCloth: React.FC<{ kind: "RU" | "UA" | "BY"; w: number; frame: number }> = ({ kind, w, frame }) => {
  const h = w * 0.66;
  const wave = Math.sin(frame * 0.25) * 4;
  const stripes =
    kind === "RU" ? ["#ffffff", "#0039a6", "#d52b1e"] : kind === "UA" ? ["#0057b7", "#ffd700"] : ["#c8313e", "#c8313e", "#4aa657"];
  return (
    <div style={{ width: w, height: h, transform: `skewY(${wave}deg)`, transformOrigin: "0 50%", border: "2px solid rgba(0,0,0,0.6)", boxShadow: "0 0 18px rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", position: "relative" }}>
      {stripes.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
      {kind === "BY" && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * 0.12, background: "repeating-linear-gradient(0deg, #fff 0 4px, #c8313e 4px 8px)" }} />}
    </div>
  );
};

const FlagMarker: React.FC<{ kind: "RU" | "UA" | "BY"; frame: number; pulse?: number; label?: string }> = ({ kind, frame, pulse = 0, label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    {label && <div style={{ fontFamily: BODY, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: "#fff", background: "rgba(10,14,22,0.85)", border: `1px solid ${C.hud}`, padding: "2px 10px", marginBottom: 8, whiteSpace: "nowrap" }}>{label}</div>}
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div style={{ width: 5, height: 104, background: "linear-gradient(#ddd, #777)" }} />
      <FlagCloth kind={kind} w={76} frame={frame} />
    </div>
    <div style={{ width: 44, height: 20, marginTop: -2, background: "#0b0f17", border: `2px solid ${kind === "UA" ? C.ukrEdge : C.red}`, borderRadius: 4, boxShadow: `0 0 ${14 + pulse * 20}px ${kind === "UA" ? C.ukrEdge : C.red}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={24} height={12} viewBox="0 0 24 12">
        <path d="M2 10 L12 3 L22 10" fill="none" stroke={kind === "UA" ? C.ukrEdge : C.red} strokeWidth={3} />
      </svg>
    </div>
  </div>
);

export const MapLabel: React.FC<{ text: string; kind: "country" | "city" | "region"; color?: string }> = ({ text, kind, color }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <div style={{ fontFamily: kind === "country" ? DISPLAY : BODY, fontSize: kind === "country" ? 46 : 24, fontWeight: 800, letterSpacing: kind === "country" ? 8 : 3, color: color ?? (kind === "country" ? "rgba(225,235,255,0.82)" : "#e8f1ff"), textShadow: "0 0 12px rgba(0,0,0,0.9), 0 2px 4px #000", whiteSpace: "nowrap" }}>{text}</div>
    {kind === "city" && <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: "0 0 12px #9fd8ff" }} />}
  </div>
);

// ---- HUD ----------------------------------------------------------------------------

const Corners: React.FC<{ color?: string }> = ({ color = C.hud }) => (
  <>
    {[
      { left: -2, top: -2, borderLeft: `3px solid ${color}`, borderTop: `3px solid ${color}` },
      { right: -2, top: -2, borderRight: `3px solid ${color}`, borderTop: `3px solid ${color}` },
      { left: -2, bottom: -2, borderLeft: `3px solid ${color}`, borderBottom: `3px solid ${color}` },
      { right: -2, bottom: -2, borderRight: `3px solid ${color}`, borderBottom: `3px solid ${color}` },
    ].map((s, i) => (
      <div key={i} style={{ position: "absolute", width: 26, height: 26, ...s }} />
    ))}
  </>
);

const typed = (text: string, T: number, start: number, cps = 38) => text.slice(0, Math.max(0, Math.floor((T - start) * cps)));

export const HudBlock: React.FC<{ big: string; lines: { text: string; at: number; color?: string }[]; T: number; start: number; accent?: string }> = ({ big, lines, T, start, accent = C.red }) => {
  const a = ease(clamp((T - start) / 0.45));
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 150, opacity: a, transform: `translateY(${(1 - a) * -30}px)` }}>
      <div style={{ position: "relative", display: "inline-block", padding: "14px 26px 10px", background: "rgba(6,10,18,0.72)", backdropFilter: "blur(6px)" }}>
        <Corners />
        <div style={{ fontFamily: DISPLAY, fontSize: 124, color: "#fff", lineHeight: 1, letterSpacing: 4, textShadow: `0 0 30px ${accent}` }}>{typed(big, T, start, 30)}</div>
      </div>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        {lines.map((l) =>
          T >= l.at ? (
            <div key={l.text} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 12, background: "rgba(6,10,18,0.78)", borderLeft: `6px solid ${l.color ?? accent}`, padding: "8px 18px", fontFamily: BODY, fontSize: 36, fontWeight: 700, color: "#eef4ff" }}>
              {typed(l.text, T, l.at)}
              <span style={{ opacity: Math.sin(T * 12) > 0 && typed(l.text, T, l.at).length < l.text.length ? 1 : 0, color: C.hud }}>▌</span>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

export const Legend: React.FC<{ T: number; items: { color: string; hatch?: boolean; text: string; at: number }[]; note?: string }> = ({ T, items, note = "Internationally recognised borders · shaded areas are approximate" }) => (
  <div style={{ position: "absolute", left: 50, right: 50, bottom: 70, display: "flex", flexDirection: "column", gap: 8 }}>
    {items.map((it) => {
      const a = clamp((T - it.at) * 3);
      if (a <= 0) return null;
      return (
        <div key={it.text} style={{ display: "flex", alignItems: "center", gap: 12, opacity: a, fontFamily: BODY, fontSize: 25, fontWeight: 600, color: "rgba(230,238,255,0.9)" }}>
          <div style={{ width: 30, height: 20, border: `2px solid ${it.color}`, background: it.hatch ? `repeating-linear-gradient(45deg, ${it.color} 0 3px, transparent 3px 7px)` : it.color, opacity: 0.95 }} />
          {it.text}
        </div>
      );
    })}
    <div style={{ fontFamily: BODY, fontSize: 19, color: "rgba(160,180,210,0.7)", marginTop: 4 }}>{note}</div>
  </div>
);

// ---- scene --------------------------------------------------------------------------

export const WarScene: React.FC<{ timing: Timing; T: number; hud?: boolean; frame: number }> = ({ timing, T, hud = true, frame }) => {
  const { width, height } = useVideoConfig();
  const secs = timing.sections;
  const tl = React.useMemo(() => buildKeys(secs, timing.durationSec), [secs, timing.durationSec]);
  const { keys, whileT, ruT, byT, crT, warT, at, S } = tl;

  const cam = cameraAt(keys, T);
  const prevCam = cameraAt(keys, T - 1 / 30);
  const proj = makeProjector(regionFor(cam), PW, PH);
  const [cx, cy] = proj(cam.lon, cam.lat);
  const [px, py] = makeProjector(regionFor(prevCam), PW, PH)(cam.lon, cam.lat);
  const motionBlur = Math.min(5, Math.hypot(cx - px, cy - py) / 30 + Math.abs(Math.log(cam.span / prevCam.span)) * 60);

  const P = (lon: number, lat: number) => proj(lon, lat);
  const pts = (list: Pt[]) => list.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join(" ");

  const crimeaT = S(1).start + 2.4;
  const donbasT = whileT + 1.6;
  const invT = S(2).start;
  const originT: Record<Route["from"], number> = { russia: ruT, belarus: byT, crimea: crT };
  const routeP = (r: Route) => ease(clamp((T - originT[r.from] - r.delay) / 1.5));
  const resistT = S(4).start + 1.4;
  const withdraw = clamp((T - resistT - 1.2) / 1.6);
  const zoneA = (z: keyof typeof ADVANCE) => {
    const rs = ROUTES.filter((r) => r.zone === z);
    const on = Math.max(...rs.map((r) => clamp((T - originT[r.from] - r.delay - 0.9) / 1.4)));
    return on * (z === "north" ? 1 - withdraw : 1);
  };
  const citiesOn = cam.span < 30 ? clamp((30 - cam.span) / 6) : 0;
  const bScale = clamp(26 / cam.span, 0.45, 1.1);
  const flagsOn = clamp((42 - cam.span) / 10);
  const minorOn = clamp((58 - cam.span) / 10);

  const flash = clamp(1 - Math.abs(T - invT - 0.05) / 0.35) * (T > invT - 0.3 ? 1 : 0);
  const shake = T > invT && T < invT + 0.6 ? Math.sin(T * 90) * 6 * (1 - (T - invT) / 0.6) : 0;

  // 2014 movers
  const crimeaMove = cut(CRIMEA_2014, ease(clamp((T - S(1).start - 0.6) / 1.8)));
  const donbasMove = cut(DONBAS_MOVE, ease(clamp((T - whileT - 0.2) / 1.5)));

  const planeLeft = (width - PW) / 2;
  const planeTop = FOCUS_Y - PH / 2;

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: `50% ${FOCUS_Y}px`, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ position: "absolute", left: planeLeft, top: planeTop, width: PW, height: PH, transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d", filter: motionBlur > 0.6 ? `blur(${motionBlur.toFixed(1)}px)` : undefined }}>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <pattern id="hatchRed" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="14" height="14" fill="rgba(255,59,74,0.22)" />
                <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,80,95,0.9)" strokeWidth="5" />
              </pattern>
              <pattern id="hatchAmber" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect width="14" height="14" fill="rgba(255,150,40,0.2)" />
                <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,160,60,0.9)" strokeWidth="5" />
              </pattern>
              <radialGradient id="light" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="rgba(120,170,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              {/* Shaded areas are clipped to Ukraine's land so they never cover sea or other countries. */}
              <clipPath id="ukrLand">
                <path d={geomPath(UKR, P)} />
              </clipPath>
            </defs>

            <rect width={PW} height={PH} fill={C.ocean} />
            {Array.from({ length: 40 }, (_, i) => {
              const lo = Math.floor((cam.lon - cam.span) / 5) * 5 + i * 5;
              const [x] = P(lo, cam.lat);
              return <line key={`lo${i}`} x1={x} y1={0} x2={x} y2={PH} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            {Array.from({ length: 40 }, (_, i) => {
              const la = Math.floor((cam.lat - cam.span) / 5) * 5 + i * 5;
              const [, y] = P(cam.lon, la);
              return <line key={`la${i}`} x1={0} y1={y} x2={PW} y2={y} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}

            {/* extruded slabs: dark side first, then the top face */}
            <g transform="translate(0 12)">
              {OTHERS.map((c) => (
                <path key={`s${c.iso}`} d={geomPath(c.geom, P)} fill={C.side} />
              ))}
              <path d={geomPath(RUS, P)} fill={C.side} />
              <path d={geomPath(UKR, P)} fill={C.side} />
            </g>
            {OTHERS.map((c) => (
              <path key={c.iso} d={geomPath(c.geom, P)} fill={c.iso === "BLR" ? C.blr : C.land} stroke={C.landEdge} strokeWidth={1.6} strokeLinejoin="round" />
            ))}
            <path d={geomPath(RUS, P)} fill={C.rus} stroke={C.rusEdge} strokeWidth={2.2} strokeLinejoin="round" />
            <path d={geomPath(UKR, P)} fill={C.ukr} stroke={C.ukrEdge} strokeWidth={3} strokeLinejoin="round" filter="url(#glow)" />
            <path d={geomPath(BLR, P)} fill="none" stroke="rgba(220,225,240,0.45)" strokeWidth={1.8} />

            {/* 2014: Crimea annexed, separatist-held Donbas */}
            <g clipPath="url(#ukrLand)">
              <path d={geomPath(CRIMEA, P)} fill="url(#hatchRed)" stroke={C.red} strokeWidth={2.5} opacity={clamp((T - crimeaT) * 2)} />
              <path d={geomPath(DONBAS_2014, P)} fill="url(#hatchAmber)" stroke="#ff9a3c" strokeWidth={2.5} opacity={clamp((T - donbasT) * 2)} />

              {/* 2022: approximate areas of advance */}
              {(Object.keys(ADVANCE) as (keyof typeof ADVANCE)[]).map((z) => (
                <path key={z} d={geomPath(ADVANCE[z], P)} fill="rgba(255,59,74,0.32)" stroke="rgba(255,90,100,0.8)" strokeWidth={2} strokeDasharray="10 8" opacity={zoneA(z)} />
              ))}
            </g>

            {/* routes */}
            {T > S(1).start && T < S(2).start + 0.5 && crimeaMove.pts.length > 1 && (
              <polyline points={pts(crimeaMove.pts)} fill="none" stroke={C.red} strokeWidth={7} strokeLinecap="round" filter="url(#glow)" opacity={1 - clamp((T - S(2).start) * 2)} />
            )}
            {ROUTES.map((r) => {
              const f = routeP(r);
              if (f <= 0) return null;
              const c = cut(r.pts, f);
              const [tx, ty] = P(c.tip[0], c.tip[1]);
              const [bx, by] = P(c.tip[0] - Math.cos(c.ang) * 0.01, c.tip[1] - Math.sin(c.ang) * 0.01);
              const a = Math.atan2(ty - by, tx - bx);
              const fade = r.zone === "north" ? 1 - withdraw * 0.85 : 1;
              return (
                <g key={r.id} opacity={fade}>
                  <polyline points={pts(c.pts)} fill="none" stroke={C.red} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" opacity={0.55} />
                  <polyline points={pts(c.pts)} fill="none" stroke="#ffd0d4" strokeWidth={4} strokeDasharray="20 14" strokeDashoffset={-frame * 2.5} strokeLinecap="round" />
                  <polygon points={`${tx + Math.cos(a) * 26},${ty + Math.sin(a) * 26} ${tx + Math.cos(a + 2.5) * 20},${ty + Math.sin(a + 2.5) * 20} ${tx + Math.cos(a - 2.5) * 20},${ty + Math.sin(a - 2.5) * 20}`} fill={C.red} filter="url(#glow)" />
                </g>
              );
            })}

            {/* pulse rings from Ukraine in the "global impact" beat */}
            {T > S(5).start &&
              [0, 1, 2].map((k) => {
                const ph = ((T - S(5).start) * 0.55 + k / 3) % 1;
                const [ux, uy] = P(31.2, 49);
                return <circle key={k} cx={ux} cy={uy} r={40 + ph * 900} fill="none" stroke={C.ukrEdge} strokeWidth={4} opacity={(1 - ph) * 0.6 * clamp((S(6).start + 1 - T) * 2)} />;
              })}

            <rect width={PW} height={PH} fill="url(#light)" />
          </svg>

          {/* billboards */}
          {PLACES.map((pl) => {
            const [x, y] = P(pl.lon, pl.lat);
            const minor = pl.name === "POLAND" || pl.name === "ROMANIA" || pl.name === "BELARUS";
            const op = pl.kind === "city" ? citiesOn : clamp((T - 0.6) * 1.5) * (minor ? minorOn * (pl.name === "BELARUS" ? 1 : clamp((cam.span - 18) / 8)) : 1);
            if (op <= 0.01) return null;
            const isKyiv = pl.name === "KYIV";
            return (
              <Billboard key={pl.name} x={x} y={y + (pl.kind === "city" ? 6 : 0)} opacity={op} scale={bScale}>
                <MapLabel text={isKyiv && T > resistT ? "KYIV · HELD" : pl.name} kind={pl.kind} color={isKyiv && T > resistT ? C.ukrEdge : undefined} />
              </Billboard>
            );
          })}
          {T > crimeaT && cam.span < 40 && (
            <Billboard x={P(34.6, 44.75)[0]} y={P(34.6, 44.75)[1]} opacity={clamp((T - crimeaT) * 2)}>
              <MapLabel text="CRIMEA" kind="region" color="#ff9aa3" />
            </Billboard>
          )}
          {T > donbasT && cam.span < 40 && (
            <Billboard x={P(38.9, 48.35)[0]} y={P(38.9, 48.35)[1]} opacity={clamp((T - donbasT) * 2)}>
              <MapLabel text="DONBAS" kind="region" color="#ffc27a" />
            </Billboard>
          )}

          {/* 2014 movers */}
          {T > S(1).start + 0.4 && T < invT && (
            <Billboard x={P(crimeaMove.tip[0], crimeaMove.tip[1])[0]} y={P(crimeaMove.tip[0], crimeaMove.tip[1])[1]}>
              <FlagMarker kind="RU" frame={frame} />
            </Billboard>
          )}
          {T > whileT && T < invT && (
            <Billboard x={P(donbasMove.tip[0], donbasMove.tip[1])[0]} y={P(donbasMove.tip[0], donbasMove.tip[1])[1]}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontFamily: BODY, fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#fff", background: "rgba(10,14,22,0.85)", border: "1px solid #ff9a3c", padding: "2px 10px", marginBottom: 8, whiteSpace: "nowrap" }}>RUSSIA-BACKED SEPARATISTS</div>
                <div style={{ width: 34, height: 34, transform: "rotate(45deg)", background: "#ff9a3c", border: "3px solid #1a0f05", boxShadow: "0 0 22px #ff9a3c" }} />
              </div>
            </Billboard>
          )}

          {/* 2022 flags: pulse at staging points, then ride the lead route of each direction */}
          {T > invT + 1.2 &&
            ROUTES.filter((r) => r.flag).map((r) => {
              const f = routeP(r);
              const c = cut(r.pts, f);
              const [x, y] = P(c.tip[0], c.tip[1]);
              const pulse = 0.5 + 0.5 * Math.sin(frame * 0.3);
              const label = f <= 0 ? `FROM ${r.from.toUpperCase()}` : undefined;
              const fade = r.zone === "north" ? 1 - withdraw : 1;
              return (
                <Billboard key={r.id} x={x} y={y} opacity={clamp((T - invT - 1.2) * 3) * fade * flagsOn} scale={bScale}>
                  <FlagMarker kind="RU" frame={frame} pulse={f <= 0 ? pulse : 0} label={label} />
                </Billboard>
              );
            })}
          {T > resistT && (
            <Billboard x={P(30.52, 50.45)[0] - 130} y={P(30.52, 50.45)[1] + 40} opacity={clamp((T - resistT) * 2) * (cam.span < 30 ? 1 : 0)}>
              <FlagMarker kind="UA" frame={frame} />
            </Billboard>
          )}
        </div>
      </AbsoluteFill>

      {/* atmosphere */}
      {Array.from({ length: 36 }, (_, i) => {
        const x = (i * 197.3) % width;
        const y = (height - ((T * (14 + (i % 5) * 6) + i * 131) % (height + 40))) % height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: "#9fd8ff", opacity: 0.12 + (i % 4) * 0.05 }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.85) 0%, rgba(3,5,10,0) 22%, rgba(3,5,10,0) 72%, rgba(3,5,10,0.9) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.85 }} />

      {hud && <Hud T={T} tl={tl} />}
    </AbsoluteFill>
  );
};

const Hud: React.FC<{ T: number; tl: ReturnType<typeof buildKeys> }> = ({ T, tl }) => {
  const { at, S, whileT, ruT, byT, crT } = tl;
  const top = (
    <div style={{ position: "absolute", left: 60, top: 60, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontSize: 24, fontWeight: 800, letterSpacing: 4, color: C.hud }}>
      <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.red, opacity: Math.sin(T * 6) > 0 ? 1 : 0.3 }} />
      RUSSIA – UKRAINE · EXPLAINED
    </div>
  );
  let block: React.ReactNode = null;
  if (T < S(1).start) block = <HudBlock big="HOW IT BEGAN" lines={[{ text: "The Russia–Ukraine war", at: 1.0, color: C.hud }]} T={T} start={0.3} accent={C.hud} />;
  else if (T < S(2).start)
    block = (
      <HudBlock
        big="2014"
        T={T}
        start={S(1).start}
        lines={[
          { text: "Russia seizes control of Crimea", at: S(1).start + 1.2 },
          { text: "Fighting in eastern Ukraine (Donbas)", at: whileT + 0.3, color: "#ff9a3c" },
        ]}
      />
    );
  else if (T < S(4).start)
    block = (
      <HudBlock
        big="24 FEB 2022"
        T={T}
        start={S(2).start + 0.1}
        lines={[
          { text: "Full-scale invasion", at: at(2, "full", 1.5) },
          ...(T >= S(3).start ? [{ text: "Attacks from Russia · Belarus · Crimea", at: ruT }] : []),
        ]}
      />
    );
  else if (T < S(5).start)
    block = (
      <HudBlock
        big="UKRAINE RESISTS"
        T={T}
        start={S(4).start}
        accent={C.ukrEdge}
        lines={[
          { text: "Apr 2022: Russian forces withdraw from Kyiv region", at: S(4).start + 2.4, color: C.ukrEdge },
          { text: "Largest war in Europe in decades", at: at(4, "largest", 4), color: C.hud },
        ]}
      />
    );
  else if (T < S(6).start)
    block = (
      <HudBlock
        big="TODAY"
        T={T}
        start={S(5).start}
        accent={C.hud}
        lines={[
          { text: "Global politics", at: at(5, "politics", 2), color: C.hud },
          { text: "Energy", at: at(5, "energy", 3), color: C.ukrEdge },
          { text: "Security", at: at(5, "security", 4), color: C.red },
        ]}
      />
    );
  else {
    // Year counter rewinds while the narration says the roots go back years.
    const rew = clamp((T - S(6).start - 0.6) / (S(7).end - S(6).start - 1.2));
    const year = Math.round(lerp(2022, 1991, ease(rew)));
    block = (
      <HudBlock
        big={T < S(7).start ? `${year}` : "THE ROOTS"}
        T={T}
        start={T < S(7).start ? S(6).start : S(7).start}
        accent={C.hud}
        lines={T < S(7).start ? [{ text: "Not a war that appeared overnight", at: S(6).start + 0.8, color: C.hud }] : [{ text: "PART 2 · FOLLOW FOR MORE", at: S(7).start + 0.6, color: C.red }]}
      />
    );
  }
  return (
    <>
      {top}
      {block}
      <Legend
        T={T}
        items={[
          { color: C.red, hatch: true, text: "Crimea: annexed by Russia in 2014 (recognised as Ukraine)", at: S(1).start + 2.6 },
          { color: "#ff9a3c", hatch: true, text: "Russia-backed separatist-held areas, 2014 (approx.)", at: whileT + 1.8 },
          { color: "rgba(255,59,74,0.6)", text: "Areas of Russian advance, 2022 (approx.)", at: Math.min(ruT, byT, crT) + 1.2 },
        ]}
      />
    </>
  );
};

export const WarMap: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const secs = timing.sections;
  const { at, S, whileT, ruT, byT, crT, warT } = React.useMemo(() => buildKeys(secs, timing.durationSec), [secs, timing.durationSec]);
  const cue = (t: number, sfx: string, vol = 0.3, len = 45) => (
    <Sequence key={`${sfx}${t}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
      <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cue(0, "riser", 0.2, 60)}
      {cue(S(1).start + 0.3, "whoosh", 0.25)}
      {cue(whileT, "whoosh", 0.25)}
      {cue(S(2).start, "boom", 0.4, 60)}
      {cue(ruT, "whoosh", 0.25)}
      {cue(byT, "whoosh", 0.25)}
      {cue(crT, "whoosh", 0.25)}
      {cue(warT, "whoosh", 0.2)}
      {cue(S(5).start + 0.3, "riser", 0.2, 60)}
      {cue(at(7, "roots", 1), "boom", 0.3, 60)}
      <WarScene timing={timing} T={T} frame={frame} />
    </AbsoluteFill>
  );
};
