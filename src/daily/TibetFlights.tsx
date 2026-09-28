import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
type Kind =
  | "hook"
  | "plateau"
  | "cruise"
  | "pressure"
  | "descent"
  | "airports"
  | "weather"
  | "engine"
  | "route"
  | "myth"
  | "aha"
  | "india"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const C = {
  night: "#06111f",
  ocean: "#0b2d46",
  grid: "rgba(112,205,255,.10)",
  land: "#f2ead8",
  edge: "#172235",
  cyan: "#53d8ff",
  gold: "#ffd23f",
  red: "#ff4d5e",
  green: "#35d07f",
  white: "#ffffff",
  plateau: "#d8913d",
};

const DELHI: Pt = [77.209, 28.6139];
const LHASA: Pt = [91.1172, 29.652];
const KATHMANDU: Pt = [85.324, 27.7172];
const CHENGDU: Pt = [104.0665, 30.5728];
const KUNMING: Pt = [102.8329, 24.8801];
const PLATEAU: Pt[] = [
  [77.5, 35.8],
  [82.4, 38.0],
  [91.6, 37.5],
  [100.8, 34.6],
  [102.0, 29.2],
  [96.5, 27.3],
  [87.0, 28.0],
  [80.2, 31.0],
];
const SOUTH_ROUTE: Pt[] = [DELHI, [84, 24.6], KUNMING, CHENGDU];
const DIRECT_ROUTE: Pt[] = [DELHI, [88.5, 31.0], [96.5, 31.2], CHENGDU];

const V: Record<Kind, View> = {
  hook: { lon: 90, lat: 31.5, span: 35 },
  plateau: { lon: 89.5, lat: 32.5, span: 34 },
  cruise: { lon: 88.5, lat: 29.8, span: 22 },
  pressure: { lon: 90.5, lat: 31.5, span: 25 },
  descent: { lon: 91, lat: 31.0, span: 19 },
  airports: { lon: 93, lat: 29.0, span: 42 },
  weather: { lon: 88, lat: 29.0, span: 28 },
  engine: { lon: 94, lat: 31.0, span: 31 },
  route: { lon: 91, lat: 29.5, span: 43 },
  myth: { lon: 91, lat: 31.0, span: 34 },
  aha: { lon: 91, lat: 31.0, span: 25 },
  india: { lon: 83.5, lat: 29.0, span: 34 },
  cta: { lon: 91, lat: 29.5, span: 48 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("real answer") || s.includes("real danger") || s.includes("no easy way down") || s.includes("surprising rule")) return "aha";
  if (s.includes("travellers from india") || s.includes("delhi to leh") || s.includes("aircraft is unsafe") || s.includes("safety margins")) return "india";
  if (s.includes("does not mean") || s.includes("no-fly zone") || s.includes("regional flight") || s.includes("flights operate")) return "myth";
  if (s.includes("straight line") || s.includes("great-circle") || s.includes("economics") || s.includes("winds change") || s.includes("winning route") || s.includes("dispatchers")) return "route";
  if (s.includes("engine") || s.includes("drift-down") || s.includes("weight planning") || s.includes("aircraft weight")) return "engine";
  if (s.includes("wind") || s.includes("turbulence") || s.includes("mountain waves") || s.includes("lens-shaped") || s.includes("weather")) return "weather";
  if (s.includes("airport") || s.includes("alternatives") || s.includes("runway") || s.includes("thin air changes")) return "airports";
  if (s.includes("10,000") || s.includes("ground may") || s.includes("ground itself") || s.includes("stay high") || s.includes("escape routes") || s.includes("every minute")) return "descent";
  if (s.includes("pressure") || s.includes("oxygen") || s.includes("cabin")) return "pressure";
  if (s.includes("cruise") || s.includes("everest") || s.includes("fly higher") || s.includes("high enough")) return "cruise";
  if (s.includes("plateau") || s.includes("4,500") || s.includes("himalayas") || s.includes("giant roof")) return "plateau";
  if (s.includes("options are safety") || s.includes("backup plans")) return "route";
  return "hook";
};

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const cameraAt = (sections: Section[], time: number): View => {
  const i = activeSection(sections, time);
  const section = sections[i];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.35));
  const bump = Math.max(from.span, to.span) * (1 + 0.1 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return { lon: lerp(from.lon, to.lon, p), lat: lerp(from.lat, to.lat, p), span };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["AVIATION MYSTERY", "WHY AVOID TIBET?", "The Himalayan danger is not one peak", C.gold],
    plateau: ["THE ROOF OF THE WORLD", "4,500 m+", "Average elevation across much of the plateau", C.plateau],
    cruise: ["NORMAL FLIGHT", "JETS CAN CROSS", "Cruise altitude clears most terrain", C.green],
    pressure: ["CABIN PRESSURE", "MASKS DOWN", "An emergency descent must begin quickly", C.red],
    descent: ["EMERGENCY DESCENT", "NO EASY WAY DOWN", "The ground can sit above breathing altitude", C.red],
    airports: ["DIVERSION OPTIONS", "AIRPORTS ARE SPARSE", "High terrain and weather narrow the choices", C.gold],
    weather: ["MOUNTAIN WEATHER", "INVISIBLE WAVES", "Wind can create strong turbulence", C.cyan],
    engine: ["ENGINE-OUT PLAN", "DRIFT-DOWN", "The escape path must still clear every ridge", C.red],
    route: ["ROUTE PLANNING", "OPTIONS = SAFETY", "Lower terrain and more alternates often win", C.cyan],
    myth: ["MYTH CHECK", "NOT A NO-FLY ZONE", "Regional flights do cross the plateau", C.green],
    aha: ["THE REAL ANSWER", "NO EASY WAY DOWN", "The problem is the backup plan", C.gold],
    india: ["THE HIMALAYAN ARC", "CAREFUL BY DESIGN", "Mountain routes use strict safety margins", C.cyan],
    cta: ["GLOBETALES", "THE MAP BEHIND THE ROUTE", "Every curved flight path has a reason", C.cyan],
  };
  return copy[kind];
};

const pathFrom = (pts: Pt[], project: (p: Pt) => Pt) =>
  pts.map((point, index) => `${index ? "L" : "M"}${project(point).join(",")}`).join(" ");

const Plane: React.FC<{ x: number; y: number; angle: number; scale?: number }> = ({ x, y, angle, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
    <path d="M-52-8L-8-8L17-48L32-48L18-8L54 0L18 8L32 48L17 48L-8 8L-52 8L-63 0Z" fill={C.white} stroke={C.edge} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={29} cy={0} r={5} fill={C.cyan} />
  </g>
);

const MapPin: React.FC<{ p: Pt; project: (p: Pt) => Pt; label: string; color: string; on: number }> = ({ p, project, label, color, on }) => {
  const [x, y] = project(p);
  return (
    <g opacity={clamp(on * 1.6)} transform={`translate(${x} ${y - (1 - on) * 80})`}>
      <circle r={13} fill={color} stroke={C.white} strokeWidth={5} />
      <path d="M0 13L-8 34L8 34Z" fill={color} stroke={C.white} strokeWidth={3} />
      <text y={-24} textAnchor="middle" fill={C.white} fontFamily={BODY} fontSize={24} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.edge, strokeWidth: 7 }}>{label}</text>
    </g>
  );
};

const AltitudePanel: React.FC<{ kind: Kind; reveal: number; wide: boolean }> = ({ kind, reveal, wide }) => {
  if (!["pressure", "descent", "engine"].includes(kind)) return null;
  const danger = kind === "descent";
  return (
    <div style={{ position: "absolute", right: wide ? 70 : 48, bottom: wide ? 68 : 300, width: wide ? 430 : 890, padding: wide ? "22px 28px" : "28px 34px", borderRadius: 24, background: "rgba(6,17,31,.94)", border: `5px solid ${danger ? C.red : C.cyan}`, boxShadow: `0 12px 0 ${C.edge}`, color: C.white, transform: `translateY(${(1 - reveal) * 80}px)`, opacity: reveal }}>
      <div style={{ fontFamily: BODY, fontSize: wide ? 22 : 28, letterSpacing: 3, color: danger ? C.red : C.cyan, fontWeight: 900 }}>EMERGENCY PROFILE</div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: wide ? 60 : 70 }}>35,000 FT</div>
        <div style={{ flex: 1, height: 8, background: C.white, position: "relative" }}>
          <div style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: C.red, left: `${80 - reveal * 65}%`, top: -6 }} />
        </div>
        <div style={{ fontFamily: DISPLAY, color: C.gold, fontSize: wide ? 54 : 66 }}>10,000 FT</div>
      </div>
      <div style={{ marginTop: 8, fontFamily: BODY, fontSize: wide ? 24 : 30, fontWeight: 800, color: danger ? C.red : "#c9eaff" }}>
        {danger ? "PLATEAU BLOCKS THE NORMAL DESCENT" : kind === "engine" ? "ONE-ENGINE ESCAPE ROUTE REQUIRED" : "OXYGEN TIME IS LIMITED"}
      </div>
    </div>
  );
};

const InfoCard: React.FC<{ kind: Kind; frame: number; start: number; fps: number; wide: boolean }> = ({ kind, frame, start, fps, wide }) => {
  const [kicker, title, sub, accent] = copyFor(kind);
  const p = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: wide ? 58 : 44, top: wide ? 55 : 310, width: wide ? 720 : 992, minHeight: wide ? 205 : 255, transform: `translateY(${(1 - p) * -90}px)`, opacity: clamp(p * 1.5), padding: wide ? "22px 34px" : "28px 38px 22px", background: "rgba(255,255,255,.96)", border: `6px solid ${C.edge}`, borderRadius: 30, boxShadow: `0 14px 0 ${C.edge}` }}>
      <div style={{ fontFamily: BODY, color: accent, fontSize: wide ? 22 : 28, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
      <div style={{ marginTop: 4, fontFamily: DISPLAY, color: C.edge, fontSize: wide ? 64 : 78, lineHeight: 0.96 }}>{title}</div>
      <div style={{ marginTop: 10, fontFamily: BODY, color: "#405064", fontSize: wide ? 26 : 33, lineHeight: 1.1, fontWeight: 850 }}>{sub}</div>
    </div>
  );
};

export const TibetFlightsScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const T = thumbnail ? 2 : frame / fps;
  const index = activeSection(timing.sections, T);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const cam = thumbnail ? V.hook : cameraAt(timing.sections, T);
  const refLat = 31;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const focusX = wide ? W * 0.62 : W * 0.5;
  const focusY = wide ? H * 0.57 : H * 0.58;
  const scale = Math.min(W / (cam.span * cos), (H * (wide ? 1.08 : 0.82)) / (cam.span * (wide ? 0.62 : 1.05)));
  const project = ([lon, lat]: Pt): Pt => [focusX + (lon - cam.lon) * cos * scale, focusY - (lat - cam.lat) * scale];
  const reveal = thumbnail ? 1 : ease(clamp((T - section.start) / 1.1));
  const plateauPath = `${pathFrom(PLATEAU, project)} Z`;
  const route = kind === "route" || kind === "aha" || kind === "cta" ? SOUTH_ROUTE : DIRECT_ROUTE;
  const routeP = thumbnail ? 0.68 : clamp((T - section.start) / Math.max(1.4, section.end - section.start));
  const routePts = route.map(project);
  const seg = Math.min(routePts.length - 2, Math.floor(routeP * (routePts.length - 1)));
  const local = routeP * (routePts.length - 1) - seg;
  const a = routePts[seg];
  const b = routePts[seg + 1];
  const px = lerp(a[0], b[0], local);
  const py = lerp(a[1], b[1], local);
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const airportsOn = ["airports", "route", "myth", "aha", "cta"].includes(kind) ? reveal : 0;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="tibetOcean" cx="55%" cy="45%" r="75%"><stop offset="0" stopColor={C.ocean} /><stop offset="1" stopColor={C.night} /></radialGradient>
          <pattern id="tibetGrid" width="74" height="74" patternUnits="userSpaceOnUse"><path d="M74 0H0V74" fill="none" stroke={C.grid} strokeWidth={2} /></pattern>
          <pattern id="plateauHatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="18" fill="rgba(255,210,63,.22)" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#tibetOcean)" />
        <rect width={W} height={H} fill="url(#tibetGrid)" />
        {COUNTRIES.filter((country) => ["IND", "CHN", "NPL", "BTN", "PAK", "BGD", "MMR", "AFG"].includes(country.iso)).map((country) => (
          <path key={country.iso} d={geomPath(country.geom as never, (lon, lat) => project([lon, lat]))} fill={country.iso === "IND" ? "#d8efe0" : country.iso === "CHN" ? "#e8dfc8" : C.land} fillOpacity={0.92} stroke={country.iso === "IND" ? "#ff9933" : C.edge} strokeWidth={country.iso === "IND" ? 5 : 3} strokeLinejoin="round" />
        ))}
        <path d={plateauPath} fill="url(#plateauHatch)" stroke={C.plateau} strokeWidth={7} strokeDasharray="18 10" opacity={0.9} />
        {[0.18, 0.38, 0.58].map((n) => {
          const ring = PLATEAU.map(([lon, lat]) => [lerp(90, lon, 1 - n * 0.35), lerp(32.5, lat, 1 - n * 0.35)] as Pt);
          return <path key={n} d={`${pathFrom(ring, project)} Z`} fill="none" stroke="rgba(255,210,63,.25)" strokeWidth={3} />;
        })}
        <path d={pathFrom(DIRECT_ROUTE, project)} fill="none" stroke={C.red} strokeWidth={7} strokeDasharray="20 14" opacity={["route", "aha", "cta"].includes(kind) ? 0.28 : 0.85} />
        {["route", "aha", "cta"].includes(kind) && <path d={pathFrom(SOUTH_ROUTE, project)} fill="none" stroke={C.cyan} strokeWidth={10} strokeDasharray="24 14" opacity={0.95} />}
        {kind === "weather" && [-1, 0, 1].map((n) => {
          const pts: Pt[] = [[78, 27.5 + n], [84, 30 + n], [90, 27.8 + n], [96, 30.2 + n], [102, 28 + n]];
          return <path key={n} d={pathFrom(pts, project)} fill="none" stroke={C.cyan} strokeWidth={6} opacity={0.8 - Math.abs(n) * 0.15} />;
        })}
        <Plane x={px} y={py} angle={angle} scale={wide ? 0.72 : 0.9} />
        <MapPin p={LHASA} project={project} label="LHASA" color={C.gold} on={airportsOn} />
        <MapPin p={KATHMANDU} project={project} label="KATHMANDU" color={C.green} on={airportsOn} />
        <MapPin p={CHENGDU} project={project} label="CHENGDU" color={C.cyan} on={airportsOn} />
        <MapPin p={KUNMING} project={project} label="KUNMING" color={C.cyan} on={airportsOn} />
        <text x={project([89.5, 34.1])[0]} y={project([89.5, 34.1])[1]} textAnchor="middle" fill={C.gold} fontFamily={BODY} fontSize={wide ? 27 : 32} fontWeight={1000} style={{ paintOrder: "stroke", stroke: C.edge, strokeWidth: 8 }}>TIBETAN PLATEAU · SCHEMATIC</text>
        <text x={project([81.5, 26.7])[0]} y={project([81.5, 26.7])[1]} textAnchor="middle" fill="#ff9933" fontFamily={DISPLAY} fontSize={wide ? 34 : 42} style={{ paintOrder: "stroke", stroke: C.edge, strokeWidth: 8 }}>INDIA</text>
      </svg>

      {!thumbnail && <InfoCard kind={kind} frame={frame} start={section.start} fps={fps} wide={wide} />}
      {!thumbnail && <AltitudePanel kind={kind} reveal={reveal} wide={wide} />}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 285 : 1490} />}
      {!thumbnail && T >= ctaT && <CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={wide ? 550 : 1120} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg,rgba(3,8,18,.98),rgba(3,8,18,.4) 62%,rgba(3,8,18,.05))" : "linear-gradient(180deg,rgba(3,8,18,.96),rgba(3,8,18,.08) 55%,rgba(3,8,18,.92))" }} />
          <div style={{ position: "absolute", left: wide ? 70 : 48, right: wide ? 690 : 48, top: wide ? 90 : 330, fontFamily: DISPLAY, fontSize: wide ? 142 : 132, lineHeight: 0.9, color: C.white, WebkitTextStroke: `${wide ? 7 : 9}px ${C.edge}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.edge}` }}>
            WHY PILOTS<br /><span style={{ color: C.red }}>AVOID TIBET</span>
          </div>
          <div style={{ position: "absolute", left: wide ? 78 : 66, bottom: wide ? 82 : 330, padding: "16px 28px", borderRadius: 18, background: C.gold, border: `5px solid ${C.edge}`, boxShadow: `0 9px 0 ${C.edge}`, color: C.edge, fontFamily: DISPLAY, fontSize: wide ? 54 : 64 }}>NO EASY WAY DOWN</div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const TibetFlightsVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaT = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.15],
    [0.9, "boom", 0.2],
    [first("plateau"), "whoosh", 0.16],
    [first("pressure"), "boom", 0.18],
    [first("airports"), "pop", 0.16],
    [first("weather"), "whoosh", 0.15],
    [first("engine"), "boom", 0.15],
    [first("aha"), "ding", 0.2],
  ];
  const cue = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cues.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaT).map((time) => cue(time + 1.1, "ding", 0.14))}
      <TibetFlightsScene timing={timing} />
    </AbsoluteFill>
  );
};

export const TibetFlightsThumb: React.FC<{ timing: Timing }> = ({ timing }) => <TibetFlightsScene timing={timing} thumbnail />;
