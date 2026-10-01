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
import { CoverTitle } from "../cartoon/CoverTitle";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
type Kind =
  | "hook"
  | "empty"
  | "region"
  | "distance"
  | "west"
  | "east"
  | "shelf"
  | "route"
  | "depth"
  | "stopped"
  | "north"
  | "orangutan"
  | "sulawesi"
  | "wallace"
  | "name"
  | "exception"
  | "separated"
  | "worlds"
  | "bridge"
  | "cta";

const C = {
  night: "#07131f",
  ocean: "#0d4263",
  oceanLight: "#17749d",
  land: "#eadfc7",
  ink: "#17212b",
  west: "#ffb547",
  east: "#53d4ff",
  gold: "#ffd43b",
  white: "#ffffff",
  green: "#3cab70",
};
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const BALI: Pt = [115.19, -8.41];
const LOMBOK: Pt = [116.32, -8.65];
const BORNEO: Pt = [114.0, 0.8];
const SULAWESI: Pt = [121.0, -2.0];
const WALLACE: Pt[] = [
  [115.65, -10.3],
  [115.67, -8.55],
  [116.2, -6.0],
  [117.2, -3.0],
  [118.8, 0.2],
  [119.7, 3.0],
  [120.4, 6.2],
];
const SUNDALAND: Pt[] = [
  [101.0, 3.0],
  [105.8, -4.0],
  [110.0, -7.0],
  BALI,
];
const REGION_ISOS = new Set(["IDN", "MYS", "BRN", "PNG", "PHL", "TLS", "SGP", "THA", "VNM", "KHM", "AUS"]);

const sectionKind = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("next map")) return "bridge";
  if (s.includes("two different animal worlds")) return "worlds";
  if (s.includes("kept populations apart")) return "separated";
  if (s.includes("not magic")) return "exception";
  if (s.includes("carries his name")) return "name";
  if (s.includes("alfred russel wallace")) return "wallace";
  if (s.includes("babirusas and anoas")) return "sulawesi";
  if (s.includes("orangutans live")) return "orangutan";
  if (s.includes("borneo and sulawesi")) return "north";
  if (s.includes("could not simply walk")) return "stopped";
  if (s.includes("stayed deep")) return "depth";
  if (s.includes("sundaland")) return "route";
  if (s.includes("sea levels fell")) return "shelf";
  if (s.includes("australian-style")) return "east";
  if (s.includes("unmistakably asian")) return "west";
  if (s.includes("35 kilometres")) return "distance";
  if (s.includes("cuts through indonesia")) return "region";
  if (s.includes("no wall")) return "empty";
  return "hook";
};

const currentSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const V: Record<Kind, View> = {
  hook: { lon: 116.1, lat: -6.8, span: 17 },
  empty: { lon: 116.0, lat: -7.8, span: 12 },
  region: { lon: 116.4, lat: -1.5, span: 31 },
  distance: { lon: 115.75, lat: -8.45, span: 5.5 },
  west: { lon: 112.2, lat: -4.0, span: 18 },
  east: { lon: 120.0, lat: -4.0, span: 18 },
  shelf: { lon: 110.0, lat: -2.5, span: 27 },
  route: { lon: 109.7, lat: -3.3, span: 24 },
  depth: { lon: 115.75, lat: -8.5, span: 6 },
  stopped: { lon: 115.75, lat: -8.5, span: 7 },
  north: { lon: 117.5, lat: 0.0, span: 21 },
  orangutan: { lon: 117.5, lat: 0.0, span: 20 },
  sulawesi: { lon: 121.0, lat: -2.0, span: 14 },
  wallace: { lon: 116.5, lat: -2.0, span: 30 },
  name: { lon: 117.0, lat: -1.5, span: 29 },
  exception: { lon: 116.0, lat: -7.5, span: 11 },
  separated: { lon: 115.8, lat: -7.2, span: 15 },
  worlds: { lon: 117.0, lat: -2.0, span: 30 },
  bridge: { lon: 117.0, lat: -2.0, span: 42 },
  cta: { lon: 117.0, lat: -2.0, span: 46 },
};

const cameraAt = (sections: Section[], time: number): View => {
  const index = currentSection(sections, time);
  const section = sections[index];
  const current = V[sectionKind(section?.text ?? "")];
  const previous = V[sectionKind(sections[Math.max(0, index - 1)]?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.15));
  const bump = Math.max(previous.span, current.span) * (1 + 0.12 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? previous.span * Math.pow(bump / previous.span, p * 2)
      : bump * Math.pow(current.span / bump, (p - 0.5) * 2);
  return { lon: lerp(previous.lon, current.lon, p), lat: lerp(previous.lat, current.lat, p), span };
};

const pathCut = (points: Pt[], progress: number) => {
  if (progress <= 0) return [points[0]];
  if (progress >= 1) return points;
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = lengths.reduce((sum, value) => sum + value, 0);
  let target = total * progress;
  const out: Pt[] = [points[0]];
  for (let index = 0; index < lengths.length; index++) {
    if (target >= lengths[index]) {
      out.push(points[index + 1]);
      target -= lengths[index];
    } else {
      const p = lengths[index] ? target / lengths[index] : 0;
      out.push([lerp(points[index][0], points[index + 1][0], p), lerp(points[index][1], points[index + 1][1], p)]);
      break;
    }
  }
  return out;
};

const Animal: React.FC<{ name: string; color: string; symbol: "cat" | "ape" | "bird" | "pig" | "buffalo"; size?: number }> = ({
  name,
  color,
  symbol,
  size = 160,
}) => {
  const body =
    symbol === "bird" ? (
      <>
        <path d="M28 85Q75 18 132 62Q96 62 77 92Q53 111 28 85Z" fill={color} />
        <path d="M75 78Q118 88 140 120Q94 117 63 92Z" fill={color} opacity={0.75} />
        <circle cx="108" cy="57" r="5" fill={C.ink} />
        <path d="M130 62L153 70L132 78Z" fill={C.gold} />
      </>
    ) : symbol === "ape" ? (
      <>
        <circle cx="80" cy="76" r="45" fill={color} />
        <circle cx="38" cy="76" r="20" fill={color} />
        <circle cx="122" cy="76" r="20" fill={color} />
        <ellipse cx="80" cy="87" rx="29" ry="25" fill="#f5c996" />
        <circle cx="66" cy="70" r="5" fill={C.ink} />
        <circle cx="94" cy="70" r="5" fill={C.ink} />
        <path d="M68 99Q80 107 92 99" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      </>
    ) : symbol === "pig" ? (
      <>
        <ellipse cx="79" cy="87" rx="57" ry="38" fill={color} />
        <circle cx="125" cy="79" r="27" fill={color} />
        <ellipse cx="143" cy="86" rx="17" ry="12" fill="#f19a9e" />
        <path d="M128 58Q142 22 152 56M120 58Q112 24 103 59" fill="none" stroke={C.white} strokeWidth="7" strokeLinecap="round" />
        <circle cx="132" cy="72" r="4" fill={C.ink} />
      </>
    ) : symbol === "buffalo" ? (
      <>
        <ellipse cx="80" cy="88" rx="52" ry="36" fill={color} />
        <circle cx="80" cy="74" r="31" fill={color} />
        <path d="M56 62Q24 35 20 70M104 62Q136 35 140 70" fill="none" stroke={C.white} strokeWidth="8" strokeLinecap="round" />
        <circle cx="68" cy="70" r="4" fill={C.ink} />
        <circle cx="92" cy="70" r="4" fill={C.ink} />
      </>
    ) : (
      <>
        <circle cx="80" cy="80" r="48" fill={color} />
        <path d="M42 53L32 18L66 40M118 53L128 18L94 40" fill={color} />
        <circle cx="63" cy="72" r="6" fill={C.ink} />
        <circle cx="97" cy="72" r="6" fill={C.ink} />
        <path d="M78 84L68 94H88Z" fill={C.ink} />
        <path d="M50 54L110 104M110 54L50 104" stroke={C.ink} strokeWidth="6" opacity={0.45} />
      </>
    );
  return (
    <div style={{ width: size, textAlign: "center", filter: "drop-shadow(0 12px 14px rgba(0,0,0,.45))" }}>
      <svg width={size} height={size * 0.82} viewBox="0 0 160 132">{body}</svg>
      <div style={{ marginTop: -4, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: size * 0.18, textShadow: `0 4px 0 ${C.ink}` }}>{name}</div>
    </div>
  );
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["THE MYSTERY", "INVISIBLE LINE", "Animals stop. The map explains why.", C.gold],
    empty: ["NOT A BORDER", "NO WALL · NO FENCE", "Only open water", C.gold],
    region: ["SOUTHEAST ASIA", "INDONESIA", "A boundary through the islands", C.east],
    distance: ["BALI ↔ LOMBOK", "ABOUT 35 KM", "Close islands · different wildlife", C.gold],
    west: ["WEST OF THE LINE", "ASIAN FAUNA", "Tigers · elephants · orangutans", C.west],
    east: ["EAST OF THE LINE", "AUSTRALASIAN FAUNA", "Cockatoos · marsupials · endemic species", C.east],
    shelf: ["ICE AGE", "LAND BRIDGES", "Lower seas exposed Sundaland", C.west],
    route: ["THE WALKABLE ROUTE", "ASIA → BALI", "Animals spread across Sundaland", C.west],
    depth: ["THE HIDDEN BARRIER", "DEEP WATER", "The Lombok Strait stayed flooded", C.east],
    stopped: ["THE LIMIT", "NO LAND BRIDGE", "Many land animals could not walk farther", C.gold],
    north: ["THE LINE CONTINUES", "BORNEO ↔ SULAWESI", "Across the Makassar Strait", C.east],
    orangutan: ["A SHARP CHANGE", "ORANGUTAN ≠ BABIRUSA", "Neighbouring islands · different animals", C.gold],
    sulawesi: ["SULAWESI", "BABIRUSA + ANOA", "Rare animals evolved in isolation", C.east],
    wallace: ["THE OBSERVER", "A. R. WALLACE", "Naturalist · explorer · 1800s", C.gold],
    name: ["A LINE ON THE MAP", "THE WALLACE LINE", "A boundary in animal distribution", C.gold],
    exception: ["IMPORTANT DETAIL", "SOME SPECIES CROSS", "It is a pattern, not a force field", C.east],
    separated: ["THE REAL ENGINE", "ISOLATION", "Deep water kept populations apart", C.gold],
    worlds: ["THE PAYOFF", "2 ANIMAL WORLDS", "One narrow strait shaped evolution", C.gold],
    bridge: ["GLOBETALES", "HIDDEN BORDERS", "The next map is waiting", C.east],
    cta: ["GLOBETALES", "FOLLOW THE MAP", "A new story from our planet", C.gold],
  };
  return copy[kind];
};

const InfoCard: React.FC<{ kind: Kind; frame: number; fps: number; start: number }> = ({ kind, frame, fps, start }) => {
  const [kicker, title, subtitle, accent] = copyFor(kind);
  const enter = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.65 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 44,
        right: 44,
        minHeight: 230,
        padding: "26px 32px 22px",
        borderRadius: 30,
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - enter) * -85}px) scale(${0.94 + enter * 0.06})`,
        opacity: clamp(enter * 1.5),
      }}
    >
      <div style={{ color: accent, fontFamily: BODY, fontSize: 27, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
      <div style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 78, lineHeight: 0.96 }}>{title}</div>
      <div style={{ marginTop: 10, color: "#445366", fontFamily: BODY, fontSize: 31, fontWeight: 850 }}>{subtitle}</div>
    </div>
  );
};

const DepthDiagram: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", left: 32, right: 32, top: 620, bottom: 230 }}>
    <svg width="100%" height="100%" viewBox="0 0 1016 1000">
      <defs>
        <linearGradient id="wallaceDepth" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={C.oceanLight} />
          <stop offset="1" stopColor="#031522" />
        </linearGradient>
      </defs>
      <rect width="1016" height="1000" rx="34" fill="url(#wallaceDepth)" stroke={C.white} strokeWidth="6" />
      <path d="M0 260Q180 220 340 290L440 650Q500 870 575 650L680 300Q850 230 1016 265V1000H0Z" fill="#9b7654" stroke={C.land} strokeWidth="9" />
      <path d="M455 620Q505 860 565 620" fill="none" stroke={C.east} strokeWidth={18} opacity={reveal} />
      <line x1="60" y1="350" x2="956" y2="350" stroke={C.gold} strokeWidth="8" strokeDasharray="22 14" opacity={reveal} />
      <text x="210" y="210" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="72">BALI</text>
      <text x="820" y="210" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="72">LOMBOK</text>
      <text x="508" y="940" textAnchor="middle" fill={C.east} fontFamily={DISPLAY} fontSize="70">DEEP STRAIT</text>
      <text x="508" y="330" textAnchor="middle" fill={C.gold} fontFamily={BODY} fontWeight="900" fontSize="31">LOWER ICE-AGE SEA LEVEL</text>
    </svg>
  </div>
);

export const WallaceLineScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 1.5 : frame / fps;
  const index = currentSection(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : sectionKind(section.text);
  const reveal = thumbnail ? 1 : spring({ frame: frame - Math.round(section.start * fps), fps, config: { damping: 12, mass: 0.7 } });
  const camera = thumbnail ? V.hook : cameraAt(timing.sections, time);
  const cos = Math.cos((-2 * Math.PI) / 180);
  const scale = Math.min(width / (camera.span * cos), (height * 0.83) / camera.span);
  const focusX = width * 0.5;
  const focusY = height * 0.58;
  const project = ([lon, lat]: Pt): Pt => [focusX + (lon - camera.lon) * cos * scale, focusY - (lat - camera.lat) * scale];
  const d = (points: Pt[]) => points.map((point, pointIndex) => `${pointIndex ? "L" : "M"}${project(point).map((value) => value.toFixed(1)).join(",")}`).join(" ");
  const progress = ease(clamp((time - section.start) / Math.max(0.8, section.end - section.start)));
  const cta = timing.sections.find((candidate) => candidate.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const showDepth = kind === "depth" || kind === "separated";
  const lineProgress = ["hook", "empty", "distance"].includes(kind) ? progress : 1;
  const westAnimals = ["hook", "west", "shelf", "route", "stopped", "orangutan", "worlds"].includes(kind);
  const eastAnimals = ["hook", "east", "stopped", "orangutan", "sulawesi", "exception", "worlds"].includes(kind);
  const animalTop = kind === "hook" ? 850 : 790;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="wallaceOcean" cx="50%" cy="45%" r="75%">
            <stop stopColor={C.oceanLight} />
            <stop offset="1" stopColor={C.night} />
          </radialGradient>
          <pattern id="wallaceGrid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M70 0H0V70" fill="none" stroke="rgba(130,210,255,.1)" strokeWidth="2" />
          </pattern>
          <filter id="wallaceGlow"><feGaussianBlur stdDeviation="8" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={width} height={height} fill="url(#wallaceOcean)" />
        <rect width={width} height={height} fill="url(#wallaceGrid)" />
        {!showDepth && COUNTRIES.filter((country) => REGION_ISOS.has(country.iso)).map((country) => (
          <path
            key={country.iso}
            d={geomPath(country.geom as never, (lon, lat) => project([lon, lat]))}
            fill={country.iso === "IDN" ? C.land : "#a9bcae"}
            fillOpacity={country.iso === "IDN" ? 0.96 : 0.62}
            stroke={C.ink}
            strokeWidth={camera.span < 10 ? 3 : 1.5}
            strokeLinejoin="round"
          />
        ))}
        {!showDepth && kind === "shelf" && (
          <path d={d([[95, 6], [108, 7], [114, 2], [115.6, -8.5], [106, -9], [98, -3], [95, 6]])} fill={C.west} opacity={0.32 + 0.28 * reveal} stroke={C.west} strokeWidth={6} strokeDasharray="20 12" />
        )}
        {!showDepth && (
          <>
            <path d={d(pathCut(WALLACE, lineProgress))} fill="none" stroke="rgba(255,212,59,.28)" strokeWidth={28} strokeLinecap="round" filter="url(#wallaceGlow)" />
            <path d={d(pathCut(WALLACE, lineProgress))} fill="none" stroke={C.gold} strokeWidth={9} strokeLinecap="round" strokeDasharray="22 12" />
          </>
        )}
        {!showDepth && kind === "route" && (
          <path d={d(pathCut(SUNDALAND, progress))} fill="none" stroke={C.west} strokeWidth={12} strokeDasharray="24 14" strokeLinecap="round" />
        )}
        {!showDepth && kind === "distance" && (
          <>
            <line x1={project(BALI)[0]} y1={project(BALI)[1]} x2={project(LOMBOK)[0]} y2={project(LOMBOK)[1]} stroke={C.gold} strokeWidth={10} strokeDasharray="16 10" />
            {[BALI, LOMBOK].map((point, pointIndex) => <circle key={pointIndex} cx={project(point)[0]} cy={project(point)[1]} r={15} fill={pointIndex ? C.east : C.west} stroke={C.white} strokeWidth={5} />)}
          </>
        )}
        {!showDepth && ["north", "orangutan", "sulawesi"].includes(kind) && (
          <>
            <circle cx={project(BORNEO)[0]} cy={project(BORNEO)[1]} r={16} fill={C.west} stroke={C.white} strokeWidth={5} />
            <circle cx={project(SULAWESI)[0]} cy={project(SULAWESI)[1]} r={16} fill={C.east} stroke={C.white} strokeWidth={5} />
            <text x={project(BORNEO)[0] - 18} y={project(BORNEO)[1] - 30} textAnchor="end" fill={C.white} fontFamily={DISPLAY} fontSize={48} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>BORNEO</text>
            <text x={project(SULAWESI)[0] + 22} y={project(SULAWESI)[1] - 28} fill={C.white} fontFamily={DISPLAY} fontSize={48} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>SULAWESI</text>
          </>
        )}
      </svg>

      {showDepth && <DepthDiagram reveal={clamp(reveal)} />}
      {!showDepth && westAnimals && (
        <div style={{ position: "absolute", left: 70, top: animalTop, transform: `translateX(${(1 - reveal) * -160}px) scale(${0.9 + reveal * 0.1})`, opacity: clamp(reveal * 1.5) }}>
          <Animal name={kind === "orangutan" ? "ORANGUTAN" : "TIGER"} color={C.west} symbol={kind === "orangutan" ? "ape" : "cat"} size={kind === "hook" ? 210 : 180} />
        </div>
      )}
      {!showDepth && eastAnimals && (
        <div style={{ position: "absolute", right: 55, top: animalTop + (kind === "sulawesi" ? 120 : 0), transform: `translateX(${(1 - reveal) * 160}px) scale(${0.9 + reveal * 0.1})`, opacity: clamp(reveal * 1.5), display: "flex", gap: 12 }}>
          <Animal name={kind === "sulawesi" || kind === "orangutan" ? "BABIRUSA" : "COCKATOO"} color={C.east} symbol={kind === "sulawesi" || kind === "orangutan" ? "pig" : "bird"} size={kind === "hook" ? 210 : 175} />
          {kind === "sulawesi" && <Animal name="ANOA" color={C.green} symbol="buffalo" size={165} />}
        </div>
      )}
      {kind === "wallace" && (
        <div style={{ position: "absolute", left: 120, right: 120, top: 700, height: 670, borderRadius: 34, background: "#f3e6c8", border: `8px solid ${C.ink}`, boxShadow: `0 18px 0 ${C.ink}`, transform: `rotate(${(1 - reveal) * -8}deg) scale(${0.86 + reveal * 0.14})`, padding: 48 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 72, color: C.ink }}>FIELD NOTES · 1800s</div>
          <svg width="100%" height="410" viewBox="0 0 700 410">
            <circle cx="350" cy="130" r="78" fill="#d5a47c" stroke={C.ink} strokeWidth="8" />
            <path d="M275 120Q285 35 350 32Q428 42 430 130Q397 84 352 86Q310 84 275 120Z" fill="#5a3b2c" />
            <path d="M315 157Q350 188 386 157M330 130H342M370 130H382" fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
            <path d="M235 390Q250 230 350 230Q450 230 465 390Z" fill="#485b67" stroke={C.ink} strokeWidth="8" />
            <path d="M510 100Q585 44 650 94Q598 105 560 160Q547 121 510 100Z" fill={C.east} opacity={clamp(reveal)} />
          </svg>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 38, color: "#584936", textAlign: "center" }}>ALFRED RUSSEL WALLACE</div>
        </div>
      )}

      {!thumbnail && <InfoCard kind={kind} frame={frame} fps={fps} start={section.start} />}
      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1450} />}
      {!thumbnail && time >= ctaTime && <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1140} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(4,12,22,.92),rgba(4,12,22,.08) 55%,rgba(4,12,22,.82))" }} />
          <div style={{ position: "absolute", left: 42, right: 42, top: 310, color: C.white, fontFamily: DISPLAY, fontSize: 126, lineHeight: 0.88, textAlign: "center", WebkitTextStroke: `10px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${C.ink}` }}>
            ANIMALS REFUSE<br /><span style={{ color: C.gold }}>TO CROSS!</span>
          </div>
          <div style={{ position: "absolute", left: 140, right: 140, bottom: 360, height: 100, borderRadius: 50, background: C.gold, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 51, display: "flex", alignItems: "center", justifyContent: "center" }}>
            NO WALL · NO FENCE
          </div>
          <div style={{ position: "absolute", left: 50, right: 50, top: 1320, color: C.white, fontFamily: BODY, fontWeight: 1000, fontSize: 35, textAlign: "center", letterSpacing: 2 }}>THE WALLACE LINE · INDONESIA</div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const WallaceLineVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => sectionKind(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.9, "boom", 0.22],
    [first("distance"), "ding", 0.18],
    [first("east"), "whoosh", 0.15],
    [first("depth"), "boom", 0.19],
    [first("north"), "whoosh", 0.17],
    [first("name"), "ding", 0.18],
    [first("worlds"), "boom", 0.22],
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
      {nudgeTimes(ctaTime).map((time) => cue(time + 1.1, "ding", 0.13))}
      <WallaceLineScene timing={timing} />
      <CoverTitle lines={["ANIMALS REFUSE", "TO CROSS!"]} sub="The invisible Wallace Line" accent={C.gold} />
    </AbsoluteFill>
  );
};

export const WallaceLineThumb: React.FC<{ timing: Timing }> = ({ timing }) => <WallaceLineScene timing={timing} thumbnail />;
