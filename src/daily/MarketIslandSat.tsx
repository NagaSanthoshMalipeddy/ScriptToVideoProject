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
import {
  countryGeom,
  makeSatProjector,
  SatelliteMap,
  type SatView,
} from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Kind =
  | "hook" | "location" | "scale" | "origin" | "inherit" | "lighthouse"
  | "wrong" | "problem" | "move" | "redraw" | "take" | "swap"
  | "coast" | "aha" | "mistake" | "bridge" | "cta";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ink: "#071523",
  gold: "#ffd23f",
  sweden: "#1769aa",
  swedenYellow: "#ffd43b",
  finland: "#255aa8",
  red: "#e44848",
  cyan: "#61d9ff",
  green: "#39c98a",
  white: "#ffffff",
};

const MARKET: Pt = [19.13, 60.3];
const CLOSE: SatView = { lon: 19.13, lat: 60.3, span: 1.8 };
const VIEWS: Record<Kind, SatView> = {
  hook: { lon: 18.6, lat: 60.1, span: 18 },
  location: { lon: 18.9, lat: 60.2, span: 8 },
  scale: CLOSE,
  origin: CLOSE,
  inherit: CLOSE,
  lighthouse: CLOSE,
  wrong: CLOSE,
  problem: CLOSE,
  move: CLOSE,
  redraw: CLOSE,
  take: CLOSE,
  swap: CLOSE,
  coast: CLOSE,
  aha: { ...CLOSE, span: 1.35 },
  mistake: { ...CLOSE, span: 1.5 },
  bridge: { lon: 18.4, lat: 60.1, span: 24 },
  cta: { lon: 18.4, lat: 60.1, span: 28 },
};

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("world is full")) return "bridge";
  if (value.includes("one building mistake")) return "mistake";
  if (value.includes("that is why")) return "aha";
  if (value.includes("coastlines stayed")) return "coast";
  if (value.includes("equal pieces")) return "swap";
  if (value.includes("could not simply")) return "take";
  if (value.includes("1985")) return "redraw";
  if (value.includes("impractical")) return "move";
  if (value.includes("international border")) return "problem";
  if (value.includes("one problem")) return "wrong";
  if (value.includes("1885")) return "lighthouse";
  if (value.includes("inherited")) return "inherit";
  if (value.includes("1809")) return "origin";
  if (value.includes("3.3 hectares")) return "scale";
  if (value.includes("lonely rock")) return "location";
  return "hook";
};

const activeIndex = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const index = activeIndex(sections, time);
  const section = sections[index] ?? sections[0];
  const from = VIEWS[kindOf(sections[Math.max(0, index - 1)]?.text ?? "")];
  const to = VIEWS[kindOf(section?.text ?? "")];
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.45));
  const wide = Math.max(from.span, to.span);
  const bump = wide * (1 + 0.16 * Math.sin(Math.PI * progress));
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span: progress < 0.5
      ? from.span * Math.pow(bump / from.span, progress * 2)
      : bump * Math.pow(to.span / bump, (progress - 0.5) * 2),
  };
};

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["SWEDEN + FINLAND", "ONE TINY ISLAND · ZIG-ZAG BORDER", C.gold],
  location: ["MÄRKET · ÅLAND SEA", "60.30° N · 19.13° E", C.cyan],
  scale: ["ONLY ABOUT 3.3 HECTARES", "Uninhabited Baltic rock", C.gold],
  origin: ["1809 · THE FIRST LINE", "Sweden ↔ Russia", C.gold],
  inherit: ["THE EASTERN SIDE", "Finland inherits Russia's half", C.finland],
  lighthouse: ["1885 · LIGHTHOUSE", "Built on the western side", C.red],
  wrong: ["ONE BIG PROBLEM", "That land was Swedish", C.red],
  problem: ["ACROSS THE BORDER", "The lighthouse was on the wrong side", C.gold],
  move: ["MOVE THE LIGHTHOUSE?", "The stone tower made that impractical", C.red],
  redraw: ["1985 · REDRAW THE LINE", "The border bends around the tower", C.green],
  take: ["BUT: NO EXTRA LAND", "Finland could not simply grow", C.gold],
  swap: ["EQUAL AREA SWAP", "Matching pieces changed sides", C.green],
  coast: ["COASTLINES UNCHANGED", "Neither country grew", C.cyan],
  aha: ["THE FINAL ZIG-ZAG", "A puzzle around the lighthouse", C.gold],
  mistake: ["A MISTAKE BECAME THE MAP", "One building reshaped a border", C.red],
  bridge: ["BORDERS HIDE STORIES", "Märket is one tiny example", C.cyan],
  cta: ["GLOBETALES", "Stories hidden between the lines", C.gold],
};

const Flag: React.FC<{ kind: "SE" | "FI" | "RU"; size?: number }> = ({ kind, size = 64 }) => (
  <div style={{
    position: "relative",
    width: size * 1.48,
    height: size,
    overflow: "hidden",
    border: `4px solid ${C.white}`,
    boxShadow: `0 6px 0 ${C.ink}`,
    background: kind === "SE" ? C.sweden : kind === "FI" ? C.white : "linear-gradient(#fff 0 33%,#1c57a7 33% 66%,#d52b1e 66%)",
  }}>
    {kind === "SE" && <>
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: "12%", background: C.swedenYellow }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "43%", height: "16%", background: C.swedenYellow }} />
    </>}
    {kind === "FI" && <>
      <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: "13%", background: C.finland }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "42%", height: "17%", background: C.finland }} />
    </>}
  </div>
);

const InfoCard: React.FC<{ kind: Kind; localTime: number }> = ({ kind, localTime }) => {
  const [title, detail, accent] = COPY[kind];
  const pop = spring({ frame: Math.round(localTime * 30), fps: 30, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{
      position: "absolute",
      left: 44,
      right: 44,
      top: 310,
      minHeight: 238,
      padding: "28px 30px 24px",
      display: "flex",
      alignItems: "center",
      gap: 24,
      background: "rgba(255,255,255,.96)",
      border: `6px solid ${C.ink}`,
      borderRadius: 30,
      boxShadow: `0 14px 0 ${C.ink}`,
      opacity: clamp(pop * 1.5),
      transform: `translateY(${(1 - pop) * -90}px)`,
      zIndex: 20,
    }}>
      <div style={{ width: 28, alignSelf: "stretch", borderRadius: 18, background: accent }} />
      <div>
        <div style={{ fontFamily: DISPLAY, color: C.ink, fontSize: title.length > 24 ? 55 : 70, lineHeight: 0.95 }}>{title}</div>
        <div style={{ marginTop: 14, fontFamily: BODY, color: "#405064", fontSize: 32, lineHeight: 1.1, fontWeight: 850 }}>{detail}</div>
      </div>
    </div>
  );
};

const MapPin: React.FC<{ project: (lon: number, lat: number) => Pt; reveal: number }> = ({ project, reveal }) => {
  const [x, y] = project(...MARKET);
  return (
    <svg width="1080" height="1920" style={{ position: "absolute", inset: 0 }}>
      <g opacity={clamp(reveal * 1.6)} transform={`translate(0 ${(1 - reveal) * -170})`}>
        <circle cx={x} cy={y} r={54 + 12 * Math.sin(reveal * Math.PI)} fill="none" stroke={C.gold} strokeWidth={7} />
        <path d={`M${x} ${y}c0 0-30-36-30-62a30 30 0 1 1 60 0c0 26-30 62-30 62Z`} fill={C.ink} stroke={C.white} strokeWidth={5} />
        <circle cx={x} cy={y - 62} r={12} fill={C.gold} />
        <text x={x} y={y - 112} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={50} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 10 }}>MÄRKET</text>
      </g>
    </svg>
  );
};

const Lighthouse: React.FC<{ progress: number; beam: number }> = ({ progress, beam }) => (
  <g transform={`translate(408 230) scale(${0.75 + progress * 0.25})`} opacity={clamp(progress * 1.6)}>
    {beam > 0 && <path d="M65 18L400 -50L400 110Z" fill={`rgba(255,238,130,${beam * 0.5})`} />}
    <path d="M34 205L48 50H83L99 205Z" fill="#f8f4e9" stroke={C.ink} strokeWidth="7" />
    <path d="M40 150H92M44 102H88" stroke={C.red} strokeWidth="25" />
    <rect x="32" y="24" width="68" height="42" rx="8" fill="#ffe98b" stroke={C.ink} strokeWidth="7" />
    <path d="M24 26Q66 -8 108 26Z" fill={C.red} stroke={C.ink} strokeWidth="7" />
  </g>
);

const IslandDiagram: React.FC<{
  kind: Kind;
  reveal: number;
  localFrame: number;
  fps: number;
  thumbnail?: boolean;
}> = ({ kind, reveal, localFrame, fps, thumbnail = false }) => {
  const finalBorder = ["redraw", "take", "swap", "coast", "aha", "mistake", "hook"].includes(kind);
  const lighthouseOn = ["lighthouse", "wrong", "problem", "move", "redraw", "take", "swap", "coast", "aha", "mistake", "hook"].includes(kind);
  const light = thumbnail
    ? 1
    : lighthouseOn
      ? spring({ frame: Math.max(0, localFrame), fps, config: { damping: 11, mass: 0.65 } })
      : 0;
  const outline = "M100 300C95 220 170 145 280 120C405 92 575 112 700 180C810 240 900 340 875 430C848 526 700 572 535 558C365 545 205 512 132 430C98 392 88 346 100 300Z";
  const straight = "M490 108L490 565";
  const zig = "M490 108L490 188L420 232L420 330L530 365L530 454L480 498L480 565";
  const border = finalBorder ? zig : straight;
  const borderReveal = thumbnail ? 1 : finalBorder ? reveal : 1;
  const swap = kind === "swap" ? reveal : 0;
  const warn = ["wrong", "problem", "move"].includes(kind) ? reveal : 0;
  const beam = ["aha", "mistake"].includes(kind) ? reveal : 0;
  return (
    <div style={{ position: "absolute", left: 42, right: 42, top: 680, height: 780, zIndex: 8 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,18,30,.62)", border: "3px solid rgba(255,255,255,.32)", borderRadius: 36, backdropFilter: "blur(5px)" }} />
      <svg width="100%" height="100%" viewBox="0 0 980 760" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id="marketSatClip"><path d={outline} /></clipPath>
          <filter id="marketSatShadow"><feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#000" floodOpacity=".48" /></filter>
        </defs>
        <g filter="url(#marketSatShadow)">
          <path d={outline} fill="#a7a08e" stroke={C.white} strokeWidth="8" />
          <g clipPath="url(#marketSatClip)">
            <rect x="70" y="75" width="420" height="530" fill={C.sweden} opacity=".78" />
            <rect x="490" y="75" width="430" height="530" fill={C.finland} opacity=".76" />
            {finalBorder && <path d="M420 232L490 188V108H420V232M530 365V454L480 498V565H530V365" fill={C.sweden} />}
            {finalBorder && <path d="M420 232L490 188V108H490V188L420 232V330L530 365V454L480 498V565H530V365" fill={C.finland} opacity=".82" />}
            {swap > 0 && <>
              <path d="M432 210l58-34v70l-58 32z" fill={C.gold} stroke={C.ink} strokeWidth="5" transform={`translate(${70 * (1 - swap)} ${-60 * (1 - swap)})`} />
              <path d="M490 400l40 13v48l-40 28z" fill={C.cyan} stroke={C.ink} strokeWidth="5" transform={`translate(${-70 * (1 - swap)} ${60 * (1 - swap)})`} />
            </>}
          </g>
          <path d={border} fill="none" stroke={C.white} strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="560" strokeDashoffset={560 * (1 - borderReveal)} />
          <path d={border} fill="none" stroke={C.gold} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="560" strokeDashoffset={560 * (1 - borderReveal)} />
        </g>
        <Lighthouse progress={light} beam={beam} />
        {warn > 0 && <g transform={`translate(650 285) scale(${0.8 + 0.2 * warn})`} opacity={warn}><circle r="76" fill={C.red} stroke={C.white} strokeWidth="8" /><text y="24" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="92">!</text></g>}
        {kind === "move" && <g opacity={reveal}><path d="M410 290Q260 250 210 350" fill="none" stroke={C.red} strokeWidth="10" strokeDasharray="18 12" /><path d="M180 315l62 62M242 315l-62 62" stroke={C.red} strokeWidth="15" strokeLinecap="round" /></g>}
        {kind === "coast" && <path d={outline} fill="none" stroke={C.cyan} strokeWidth="18" opacity={reveal} />}
        {!thumbnail && <text x="265" y="640" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="45" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>SWEDEN</text>}
        {!thumbnail && <text x="700" y="640" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="45" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>FINLAND</text>}
        {kind === "scale" && <text x="490" y="710" textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize="58">≈ 3.3 HECTARES</text>}
        {kind === "origin" && <text x="490" y="710" textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize="58">STRAIGHT LINE · 1809</text>}
        {kind === "take" && <text x="490" y="710" textAnchor="middle" fill={C.red} fontFamily={DISPLAY} fontSize="58">NO EXTRA LAND</text>}
        {kind === "swap" && <text x="490" y="710" textAnchor="middle" fill={C.green} fontFamily={DISPLAY} fontSize="58">EQUAL AREA</text>}
      </svg>
      {!thumbnail && <div style={{ position: "absolute", left: 115, bottom: 48 }}><Flag kind="SE" /></div>}
      {!thumbnail && <div style={{ position: "absolute", right: 115, bottom: 48 }}><Flag kind={kind === "origin" ? "RU" : "FI"} /></div>}
    </div>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = ["zig-zag border", "lonely rock", "3.3 hectares", "1809", "inherited", "1885", "one problem", "international border", "impractical", "1985", "could not simply", "equal pieces", "coastlines stayed", "that is why", "one building mistake", "world is full", "please like"];
  return expected.filter((needle) => !sections.some((section) => section.text.toLowerCase().includes(needle)));
};

const MarketIslandSatScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 2 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const view = thumbnail ? { lon: 18.9, lat: 60.2, span: 9 } : cameraAt(timing.sections, time);
  const { project } = makeSatProjector(view, width, height, 0.56);
  const localTime = time - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localTime / 0.85));
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const diagram = !["location", "bridge", "cta"].includes(kind) || thumbnail;
  const highlights = [
    { geom: countryGeom("SWE"), label: kind === "cta" ? undefined : "Sweden", labelAt: [16.5, 62.2] as Pt, fill: "rgba(255,190,20,.42)" },
    { geom: countryGeom("FIN"), label: kind === "cta" ? undefined : "Finland", labelAt: [24.4, 62.8] as Pt, fill: "rgba(255,190,20,.34)" },
  ];

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap view={view} width={width} height={height} anchorY={0.56} darken={thumbnail ? 0.28 : kind === "cta" ? 0.36 : 0.18} highlights={highlights}>
        {!diagram && kind !== "cta" && <MapPin project={project} reveal={reveal} />}
        {diagram && <IslandDiagram kind={kind} reveal={reveal} localFrame={frame - Math.round((section?.start ?? 0) * fps)} fps={fps} thumbnail={thumbnail} />}
        {!thumbnail && <InfoCard kind={kind} localTime={localTime} />}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={650} />}
        {!thumbnail && time >= ctaTime && <CtaCard T={time} top={1110} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />}
        {!thumbnail && missingCues(timing.sections).length > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 850, padding: 30, background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 38, textAlign: "center", zIndex: 50 }}>MISSING CUES: {missingCues(timing.sections).join(", ")}</div>}
        {thumbnail && <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,10,18,.88),rgba(3,10,18,.02) 58%,rgba(3,10,18,.85))" }} />
          <div style={{ position: "absolute", left: 48, right: 48, top: 330, textAlign: "center", zIndex: 30 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "10px 22px", borderRadius: 999, background: C.gold, border: `5px solid ${C.ink}`, boxShadow: `0 9px 0 ${C.ink}`, fontFamily: BODY, color: C.ink, fontWeight: 1000, fontSize: 29, letterSpacing: 2 }}><Flag kind="SE" size={30} /> SWEDEN + FINLAND <Flag kind="FI" size={30} /></div>
            <div style={{ marginTop: 26, fontFamily: DISPLAY, color: C.white, fontSize: 112, lineHeight: 0.87, WebkitTextStroke: `8px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.ink}` }}>ONE TINY<br />ISLAND</div>
            <div style={{ marginTop: 24, display: "inline-block", padding: "12px 28px", borderRadius: 18, background: C.red, border: `5px solid ${C.white}`, boxShadow: `0 9px 0 ${C.ink}`, color: C.white, fontFamily: DISPLAY, fontSize: 58, transform: "rotate(-2deg)" }}>ZIG-ZAG BORDER!</div>
          </div>
          <div style={{ position: "absolute", left: 165, right: 165, top: 1320, padding: "16px 22px 12px", borderRadius: 22, border: `5px solid ${C.ink}`, boxShadow: `0 9px 0 ${C.ink}`, background: "rgba(7,21,35,.94)", color: C.gold, textAlign: "center", fontFamily: DISPLAY, fontSize: 49, zIndex: 30 }}>LIGHTHOUSE MISTAKE</div>
        </>}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const MarketIslandVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const startOf = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const ctaTime = startOf("cta");
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.8, "boom", 0.22],
    [startOf("location"), "whoosh", 0.17],
    [startOf("origin"), "ding", 0.17],
    [startOf("lighthouse"), "pop", 0.18],
    [startOf("redraw"), "whoosh", 0.17],
    [startOf("aha"), "boom", 0.2],
  ];
  const sound = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={70}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence> : null;
  return <AbsoluteFill><Audio src={staticFile(timing.audio)} />{cues.map(([time, name, volume]) => sound(time, name, volume))}{nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.14))}<MarketIslandSatScene timing={timing} /></AbsoluteFill>;
};

export const MarketIslandThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <MarketIslandSatScene timing={timing} thumbnail />
);
