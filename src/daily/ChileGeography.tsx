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
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
type Kind =
  | "compare"
  | "length"
  | "width"
  | "question"
  | "pacific"
  | "andes"
  | "plate"
  | "corridor"
  | "north"
  | "central"
  | "south"
  | "climates"
  | "aha"
  | "answer"
  | "payoff"
  | "bridge"
  | "cta";

const C = {
  night: "#061321",
  ocean: "#0b3558",
  ocean2: "#17618b",
  land: "#eadfc8",
  ink: "#172235",
  chile: "#d52b1e",
  chileBlue: "#0039a6",
  gold: "#f6c453",
  ice: "#dff6ff",
  green: "#4aa66b",
  sand: "#d99745",
  white: "#ffffff",
};
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const CHILE = COUNTRIES.find((country) => country.iso === "CHL")!;
const INDIA = COUNTRIES.find((country) => country.iso === "IND")!;
const SOUTH_AMERICA = new Set(["CHL", "ARG", "PER", "BOL", "PRY", "URY", "BRA", "COL", "ECU"]);
const ANDES: Pt[] = [
  [-68.8, -18.2],
  [-69.3, -23.2],
  [-69.8, -28.2],
  [-69.9, -33.5],
  [-71.0, -39.0],
  [-72.0, -44.0],
  [-73.2, -49.0],
];

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("next one")) return "bridge";
  if (value.includes("famously super thin")) return "payoff";
  if (value.includes("pacific set one wall")) return "answer";
  if (value.includes("real surprise")) return "aha";
  if (value.includes("desert heat")) return "climates";
  if (value.includes("south splinters")) return "south";
  if (value.includes("fertile valleys")) return "central";
  if (value.includes("atacama")) return "north";
  if (value.includes("corridor crosses")) return "climates";
  if (value.includes("long corridor")) return "corridor";
  if (value.includes("nazca plate") || value.includes("crumpled upward")) return "plate";
  if (value.includes("giant andes")) return "andes";
  if (value.includes("pacific ocean")) return "pacific";
  if (value.includes("why did")) return "question";
  if (value.includes("177") || value.includes("weekend road")) return "width";
  if (value.includes("4,300")) return "length";
  return "compare";
};

const V: Record<Exclude<Kind, "plate">, View> = {
  compare: { lon: -70.5, lat: -36, span: 55 },
  length: { lon: -70.5, lat: -36, span: 45 },
  width: { lon: -70.5, lat: -33, span: 18 },
  question: { lon: -71, lat: -33, span: 24 },
  pacific: { lon: -74, lat: -33, span: 25 },
  andes: { lon: -69.8, lat: -33, span: 22 },
  corridor: { lon: -70.8, lat: -34, span: 38 },
  north: { lon: -69.5, lat: -24, span: 15 },
  central: { lon: -71, lat: -34, span: 13 },
  south: { lon: -73, lat: -47, span: 19 },
  climates: { lon: -71, lat: -36, span: 43 },
  aha: { lon: -71, lat: -36, span: 47 },
  answer: { lon: -71, lat: -34, span: 31 },
  payoff: { lon: -71, lat: -36, span: 48 },
  bridge: { lon: -61, lat: -20, span: 85 },
  cta: { lon: -61, lat: -20, span: 90 },
};

const cameraAt = (sections: Section[], time: number): View => {
  const index = activeSection(sections, time);
  const section = sections[index];
  const currentKind = kindOf(section?.text ?? "");
  const previousKind = kindOf(sections[Math.max(0, index - 1)]?.text ?? "");
  const to = currentKind === "plate" ? V.andes : V[currentKind];
  const from = previousKind === "plate" ? V.andes : V[previousKind];
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.35));
  const bump = Math.max(from.span, to.span) * (1 + 0.1 * Math.sin(Math.PI * progress));
  const span =
    progress < 0.5
      ? from.span * Math.pow(bump / from.span, progress * 2)
      : bump * Math.pow(to.span / bump, (progress - 0.5) * 2);
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span,
  };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    compare: ["THE IMPOSSIBLE COMPARISON", "CHILE > INDIA?", "Longer north to south", C.gold],
    length: ["NORTH TO SOUTH", "ABOUT 4,300 KM", "Atacama to Cape Horn", C.chile],
    width: ["THE SQUEEZE", "AVG. 177 KM", "A country shaped like a ribbon", C.gold],
    question: ["THE BIG QUESTION", "WHY SO THIN?", "Two giant walls explain it", C.gold],
    pacific: ["WESTERN WALL", "PACIFIC OCEAN", "Chile follows the coast", C.ocean2],
    andes: ["EASTERN WALL", "THE ANDES", "A mountain barrier runs beside Chile", C.gold],
    plate: ["THE ENGINE BELOW", "NAZCA PLATE", "Ocean crust dives under South America", C.gold],
    corridor: ["THE RESULT", "A LONG CORRIDOR", "Mountains on one side · sea on the other", C.chile],
    north: ["NORTHERN CHILE", "ATACAMA", "One of Earth's driest deserts", C.sand],
    central: ["CENTRAL CHILE", "VALLEYS + CITIES", "Fertile land around Santiago", C.green],
    south: ["SOUTHERN CHILE", "PATAGONIA", "Wind · glaciers · fjords · islands", C.ice],
    climates: ["ONE RIBBON", "MANY WORLDS", "Desert → valleys → glaciers", C.gold],
    aha: ["THE REAL SURPRISE", "≈24× LONGER", "Than its average width", C.gold],
    answer: ["THE TWO WALLS", "PACIFIC + ANDES", "Plate tectonics raised the eastern wall", C.gold],
    payoff: ["TITLE: TRUE", "LONGER THAN INDIA", "Yet famously super thin", C.chile],
    bridge: ["GLOBETALES", "ONE PLANET", "ENDLESS MAP STORIES", C.gold],
    cta: ["GLOBETALES", "FOLLOW THE MAP", "A new geography story every day", C.gold],
  };
  return copy[kind];
};

const Flag: React.FC<{ country: "Chile" | "India" }> = ({ country }) => (
  <div
    style={{
      width: 104,
      height: 70,
      border: `4px solid ${C.white}`,
      boxShadow: `0 6px 0 ${C.ink}`,
      overflow: "hidden",
      position: "relative",
      background:
        country === "Chile"
          ? `linear-gradient(${C.white} 0 50%,${C.chile} 50%)`
          : "linear-gradient(#ff9933 0 33%,#fff 33% 66%,#138808 66%)",
    }}
  >
    {country === "Chile" ? (
      <div style={{ width: 38, height: 35, background: C.chileBlue, color: C.white, textAlign: "center", fontSize: 25 }}>★</div>
    ) : (
      <div style={{ position: "absolute", left: 43, top: 27, width: 14, height: 14, border: "2px solid #000080", borderRadius: "50%" }} />
    )}
  </div>
);

const InfoCard: React.FC<{ kind: Kind; start: number; frame: number; fps: number }> = ({ kind, start, frame, fps }) => {
  const [kicker, title, subtitle, accent] = copyFor(kind);
  const enter = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        right: 42,
        top: 300,
        minHeight: 245,
        padding: "26px 34px 22px",
        borderRadius: 30,
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - enter) * -80}px)`,
        opacity: clamp(enter * 1.5),
      }}
    >
      <div style={{ fontFamily: BODY, fontWeight: 1000, letterSpacing: 3, color: accent, fontSize: 28 }}>{kicker}</div>
      <div style={{ fontFamily: DISPLAY, color: C.ink, fontSize: 82, lineHeight: 0.94 }}>{title}</div>
      <div style={{ fontFamily: BODY, color: "#435267", fontSize: 32, fontWeight: 850 }}>{subtitle}</div>
    </div>
  );
};

const Comparison: React.FC<{ thumbnail?: boolean; reveal: number }> = ({ thumbnail, reveal }) => {
  const chileProject = makeProjector({ lonMin: -76, lonMax: -66, latMin: -56, latMax: -17, noWrap: true, refLat: -35 }, 360, 900);
  const indiaProject = makeProjector({ lonMin: 67, lonMax: 98, latMin: 6, latMax: 37, noWrap: true, refLat: 22 }, 390, 600);
  return (
    <div style={{ position: "absolute", left: 52, right: 52, top: thumbnail ? 680 : 600, bottom: thumbnail ? 310 : 270 }}>
      <svg width="100%" height="100%" viewBox="0 0 976 1000">
        <g transform={`translate(70 10) scale(${0.9 + reveal * 0.1})`} opacity={reveal}>
          <path d={geomPath(CHILE.geom as never, chileProject)} fill={C.chile} stroke={C.white} strokeWidth={5} />
          <text x={180} y={950} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={66}>CHILE</text>
        </g>
        <g transform={`translate(520 150) scale(${0.9 + reveal * 0.1})`} opacity={reveal}>
          <path d={geomPath(INDIA.geom as never, indiaProject)} fill="#ff9933" stroke={C.white} strokeWidth={5} />
          <text x={195} y={680} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={66}>INDIA</text>
        </g>
        <g transform="translate(395 700)">
          <rect width={190} height={88} rx={44} fill={C.gold} stroke={C.ink} strokeWidth={6} />
          <text x={95} y={62} textAnchor="middle" fill={C.ink} fontFamily={DISPLAY} fontSize={60}>VS</text>
        </g>
      </svg>
    </div>
  );
};

const PlateDiagram: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", left: 36, right: 36, top: 600, bottom: 250 }}>
    <svg width="100%" height="100%" viewBox="0 0 1000 950">
      <defs>
        <linearGradient id="mantle" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#d96b36" /><stop offset="1" stopColor="#7d271f" /></linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="1" y2="0"><stop stopColor={C.ocean} /><stop offset="1" stopColor={C.ocean2} /></linearGradient>
      </defs>
      <rect y={430} width={1000} height={520} fill="url(#mantle)" />
      <path d="M0 360H500L720 400H1000V540H690L480 470H0Z" fill="#37566f" stroke={C.ice} strokeWidth={7} />
      <path d={`M350 460 L${420 + reveal * 330} ${500 + reveal * 220}`} stroke={C.gold} strokeWidth={18} strokeLinecap="round" markerEnd="url(#arrow)" />
      <path d="M0 300H510V365H0Z" fill="url(#sea)" />
      <path d="M500 365 L590 260 L650 360 L725 185 L790 360 L855 250 L930 360 L1000 330V440H500Z" fill={C.land} stroke={C.gold} strokeWidth={8} />
      <path d={`M545 360 Q640 ${360 - reveal * 155} 735 250`} fill="none" stroke={C.gold} strokeWidth={12} opacity={reveal} />
      <text x={210} y={285} fill={C.white} fontFamily={DISPLAY} fontSize={58}>PACIFIC</text>
      <text x={140} y={535} fill={C.ice} fontFamily={DISPLAY} fontSize={52}>NAZCA PLATE →</text>
      <text x={715} y={125} fill={C.gold} fontFamily={DISPLAY} fontSize={60}>ANDES ↑</text>
      <text x={675} y={520} fill={C.white} fontFamily={BODY} fontWeight={900} fontSize={26}>SOUTH AMERICAN PLATE</text>
    </svg>
  </div>
);

export const ChileGeographyScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 0 : frame / fps;
  const index = activeSection(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "compare" : kindOf(section?.text ?? "");
  const reveal = thumbnail ? 1 : spring({ frame: frame - Math.round(section.start * fps), fps, config: { damping: 12, mass: 0.7 } });
  const camera = cameraAt(timing.sections, time);
  const cos = Math.cos((-32 * Math.PI) / 180);
  const mapHeight = height * 0.81;
  const scale = Math.min(width / (camera.span * cos), mapHeight / camera.span);
  const focusX = width * 0.51;
  const focusY = height * 0.59;
  const project = ([lon, lat]: Pt): Pt => [focusX + (lon - camera.lon) * cos * scale, focusY - (lat - camera.lat) * scale];
  const path = (points: Pt[]) => points.map((point, pointIndex) => `${pointIndex ? "L" : "M"}${project(point).join(",")}`).join(" ");
  const cta = timing.sections.find((candidate) => candidate.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const showComparison = thumbnail || kind === "compare" || kind === "payoff";
  const showPlate = !thumbnail && kind === "plate";
  const pin = (point: Pt, label: string, color: string) => {
    const [x, y] = project(point);
    return <g transform={`translate(${x} ${y})`} opacity={clamp(reveal)}><circle r={15} fill={color} stroke={C.white} strokeWidth={5} /><text x={24} y={10} fill={C.white} fontFamily={BODY} fontSize={30} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>{label}</text></g>;
  };

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="chileOcean" cx="50%" cy="45%" r="75%"><stop stopColor={C.ocean} /><stop offset="1" stopColor={C.night} /></radialGradient>
          <pattern id="chileGrid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke="rgba(130,205,255,.09)" strokeWidth="2" /></pattern>
        </defs>
        <rect width={width} height={height} fill="url(#chileOcean)" />
        <rect width={width} height={height} fill="url(#chileGrid)" />
        {!showComparison && !showPlate && COUNTRIES.filter((country) => SOUTH_AMERICA.has(country.iso)).map((country) => (
          <path
            key={country.iso}
            d={geomPath(country.geom as never, (lon, lat) => project([lon, lat]))}
            fill={country.iso === "CHL" ? C.chile : C.land}
            fillOpacity={country.iso === "CHL" ? 0.96 : 0.66}
            stroke={country.iso === "CHL" ? C.white : C.ink}
            strokeWidth={country.iso === "CHL" ? 5 : 2}
            strokeLinejoin="round"
          />
        ))}
        {!showComparison && !showPlate && ["andes", "corridor", "answer"].includes(kind) && <path d={path(ANDES)} fill="none" stroke={C.gold} strokeWidth={12} strokeLinecap="round" strokeDasharray="18 10" opacity={clamp(reveal)} />}
        {!showComparison && !showPlate && kind === "pacific" && Array.from({ length: 5 }, (_, wave) => {
          const y = 720 + wave * 130;
          return <path key={wave} d={`M50 ${y} Q250 ${y - 70} 450 ${y} T850 ${y}`} fill="none" stroke={C.ice} strokeWidth={8} opacity={0.3 + wave * 0.1} strokeDasharray="30 18" />;
        })}
        {!showComparison && !showPlate && kind === "width" && <>
          <line x1={project([-72.2, -33.4])[0]} y1={project([-72.2, -33.4])[1]} x2={project([-69.8, -33.4])[0]} y2={project([-69.8, -33.4])[1]} stroke={C.gold} strokeWidth={10} strokeDasharray="18 10" />
          <text x={focusX} y={project([-71, -33.4])[1] - 40} textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize={64} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>AVG. 177 KM</text>
        </>}
        {!showComparison && !showPlate && kind === "north" && pin([-70.4, -23.6], "ATACAMA", C.sand)}
        {!showComparison && !showPlate && kind === "central" && pin([-70.6693, -33.4489], "SANTIAGO", C.green)}
        {!showComparison && !showPlate && kind === "south" && pin([-72.9, -50.4], "PATAGONIA", C.ice)}
        {!showComparison && !showPlate && kind === "length" && <path d={path([[-69.5, -18], [-75.6, -55.8]])} fill="none" stroke={C.gold} strokeWidth={10} strokeDasharray="20 12" opacity={clamp(reveal)} />}
      </svg>

      {showComparison && <Comparison thumbnail={thumbnail} reveal={reveal} />}
      {showPlate && <PlateDiagram reveal={clamp(reveal)} />}
      {!thumbnail && <InfoCard kind={kind} start={section.start} frame={frame} fps={fps} />}
      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1480} />}
      {!thumbnail && time >= ctaTime && <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1130} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,8,18,.95),rgba(3,8,18,.05) 56%,rgba(3,8,18,.82))" }} />
          <div style={{ position: "absolute", left: 46, right: 46, top: 305, color: C.white, fontFamily: DISPLAY, fontSize: 132, lineHeight: 0.87, textAlign: "center", WebkitTextStroke: `9px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 12px 0 ${C.ink}` }}>
            CHILE &gt; INDIA?<br /><span style={{ color: C.gold }}>BUT SUPER THIN!</span>
          </div>
          <div style={{ position: "absolute", left: 118, right: 118, bottom: 450, height: 104, borderRadius: 52, background: C.chile, border: `6px solid ${C.white}`, boxShadow: `0 10px 0 ${C.ink}`, color: C.white, fontFamily: DISPLAY, fontSize: 58, display: "flex", alignItems: "center", justifyContent: "center", gap: 25 }}>
            <Flag country="Chile" /> 4,300 KM LONG
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const ChileGeographyVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.15],
    [0.9, "boom", 0.21],
    [first("length"), "whoosh", 0.17],
    [first("width"), "ding", 0.14],
    [first("andes"), "boom", 0.12],
    [first("plate"), "riser", 0.11],
    [first("central"), "ding", 0.14],
    [first("south"), "whoosh", 0.14],
    [first("aha"), "boom", 0.2],
    [first("payoff"), "boom", 0.18],
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
      <ChileGeographyScene timing={timing} />
      <CoverTitle lines={["CHILE > INDIA?", "BUT SUPER THIN!"]} sub="Why is it shaped like a ribbon?" accent={C.gold} />
    </AbsoluteFill>
  );
};

export const ChileGeographyThumb: React.FC<{ timing: Timing }> = ({ timing }) => <ChileGeographyScene timing={timing} thumbnail />;
