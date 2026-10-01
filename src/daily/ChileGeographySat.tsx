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
import {
  countryGeom,
  makeSatProjector,
  SatelliteMap,
  type Highlight,
  type SatView,
} from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Kind =
  | "compare" | "length" | "width" | "question" | "pacific" | "andes"
  | "plate" | "corridor" | "journey" | "north" | "central" | "south"
  | "climates" | "aha" | "answer" | "payoff" | "bridge" | "cta";

const C = {
  night: "#071426",
  ink: "#172235",
  gold: "#ffd23f",
  chile: "#d52b1e",
  blue: "#55d6ff",
  green: "#54c77a",
  sand: "#e5a24a",
  ice: "#dff6ff",
  white: "#ffffff",
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const CHILE_ROUTE: Pt[] = [
  [-69.5, -17.6], [-70.4, -23.6], [-71, -33.4],
  [-73, -42.2], [-74.8, -50.5], [-67.3, -55.9],
];
const ANDES: Pt[] = [
  [-68.8, -18.2], [-69.3, -23.2], [-69.8, -28.2],
  [-69.9, -33.5], [-71, -39], [-72, -44], [-73.2, -49],
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
  if (value.includes("one country touches")) return "climates";
  if (value.includes("south splinters")) return "south";
  if (value.includes("fertile valleys")) return "central";
  if (value.includes("atacama")) return "north";
  if (value.includes("different worlds")) return "journey";
  if (value.includes("long corridor")) return "corridor";
  if (value.includes("nazca plate") || value.includes("crumpled upward")) return "plate";
  if (value.includes("giant andes")) return "andes";
  if (value.includes("vast pacific")) return "pacific";
  if (value.includes("why is an entire")) return "question";
  if (value.includes("177")) return "width";
  if (value.includes("4,300")) return "length";
  return "compare";
};

const V: Record<Exclude<Kind, "plate">, SatView> = {
  compare: { lon: -7, lat: 5, span: 235 },
  length: { lon: -71.5, lat: -37, span: 28 },
  width: { lon: -71, lat: -33.5, span: 12 },
  question: { lon: -71, lat: -34, span: 24 },
  pacific: { lon: -73.5, lat: -33, span: 20 },
  andes: { lon: -69.5, lat: -33, span: 18 },
  corridor: { lon: -71, lat: -36, span: 31 },
  journey: { lon: -71, lat: -36, span: 34 },
  north: { lon: -69.6, lat: -24, span: 12 },
  central: { lon: -70.8, lat: -33.5, span: 11 },
  south: { lon: -73.2, lat: -49, span: 15 },
  climates: { lon: -71.5, lat: -37, span: 32 },
  aha: { lon: -71.5, lat: -37, span: 29 },
  answer: { lon: -71, lat: -35, span: 24 },
  payoff: { lon: -7, lat: 5, span: 235 },
  bridge: { lon: -62, lat: -20, span: 82 },
  cta: { lon: -62, lat: -20, span: 90 },
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const index = activeSection(sections, time);
  const section = sections[index];
  const currentKind = kindOf(section?.text ?? "");
  const previousKind = kindOf(sections[Math.max(0, index - 1)]?.text ?? "");
  const to = currentKind === "plate" ? V.andes : V[currentKind];
  const from = previousKind === "plate" ? V.andes : V[previousKind];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.45));
  const bump = Math.max(from.span, to.span) * (1 + 0.12 * Math.sin(Math.PI * p));
  const span = p < 0.5
    ? from.span * Math.pow(bump / from.span, p * 2)
    : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  let delta = to.lon - from.lon;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return { lon: from.lon + delta * p, lat: lerp(from.lat, to.lat, p), span };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    compare: ["THE IMPOSSIBLE COMPARISON", "CHILE > INDIA?", "4,300 KM VS 3,200 KM", C.gold],
    length: ["NORTH TO SOUTH", "ABOUT 4,300 KM", "ATACAMA TO CAPE HORN", C.chile],
    width: ["THE SQUEEZE", "AVG. 177 KM", "A COUNTRY SHAPED LIKE A RIBBON", C.gold],
    question: ["THE BIG QUESTION", "WHY SO THIN?", "TWO GIANT WALLS EXPLAIN IT", C.gold],
    pacific: ["WESTERN WALL", "PACIFIC OCEAN", "CHILE FOLLOWS THE COAST", C.blue],
    andes: ["EASTERN WALL", "THE ANDES", "A MOUNTAIN BARRIER RUNS BESIDE CHILE", C.gold],
    plate: ["THE ENGINE BELOW", "NAZCA PLATE", "OCEAN CRUST DIVES UNDER SOUTH AMERICA", C.gold],
    corridor: ["THE RESULT", "A LONG CORRIDOR", "MOUNTAINS ON ONE SIDE · SEA ON THE OTHER", C.chile],
    journey: ["NORTH TO SOUTH", "3 DIFFERENT WORLDS", "DESERT → VALLEYS → FJORDS", C.gold],
    north: ["NORTHERN CHILE", "ATACAMA", "ONE OF EARTH'S DRIEST DESERTS", C.sand],
    central: ["CENTRAL CHILE", "VALLEYS + CITIES", "FERTILE LAND AROUND SANTIAGO", C.green],
    south: ["SOUTHERN CHILE", "PATAGONIA", "GLACIERS · FJORDS · ISLANDS", C.ice],
    climates: ["ONE RIBBON", "MANY WORLDS", "DESERT → VALLEYS → GLACIERS", C.gold],
    aha: ["THE REAL SURPRISE", "≈24× LONGER", "THAN ITS AVERAGE WIDTH", C.gold],
    answer: ["THE TWO WALLS", "PACIFIC + ANDES", "PLATE TECTONICS RAISED THE EASTERN WALL", C.gold],
    payoff: ["TITLE: TRUE", "LONGER THAN INDIA", "YET FAMOUSLY SUPER THIN", C.chile],
    bridge: ["GLOBETALES", "ONE PLANET", "ENDLESS MAP STORIES", C.gold],
    cta: ["GLOBETALES", "FOLLOW THE MAP", "A NEW GEOGRAPHY STORY EVERY DAY", C.gold],
  };
  return copy[kind];
};

const PlateDiagram: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", left: 36, right: 36, top: 610, bottom: 250 }}>
    <svg width="100%" height="100%" viewBox="0 0 1000 950">
      <defs>
        <linearGradient id="satMantle" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#d96b36" />
          <stop offset="1" stopColor="#7d271f" />
        </linearGradient>
      </defs>
      <rect y={430} width={1000} height={520} fill="url(#satMantle)" />
      <path d="M0 360H500L720 400H1000V540H690L480 470H0Z" fill="#37566f" stroke={C.ice} strokeWidth={7} />
      <path d={`M350 460 L${420 + reveal * 330} ${500 + reveal * 220}`} stroke={C.gold} strokeWidth={18} strokeLinecap="round" />
      <path d="M0 300H510V365H0Z" fill="#17618b" />
      <path d="M500 365L590 260L650 360L725 185L790 360L855 250L930 360L1000 330V440H500Z" fill="#eadfc8" stroke={C.gold} strokeWidth={8} />
      <path d={`M545 360 Q640 ${360 - reveal * 155} 735 250`} fill="none" stroke={C.gold} strokeWidth={12} opacity={reveal} />
      <text x={210} y={285} fill={C.white} fontFamily={DISPLAY} fontSize={58}>PACIFIC</text>
      <text x={140} y={535} fill={C.ice} fontFamily={DISPLAY} fontSize={52}>NAZCA PLATE →</text>
      <text x={715} y={125} fill={C.gold} fontFamily={DISPLAY} fontSize={60}>ANDES ↑</text>
    </svg>
  </div>
);

const InfoCard: React.FC<{ kind: Kind; start: number; frame: number; fps: number }> = ({ kind, start, frame, fps }) => {
  const [kicker, title, subtitle, accent] = copyFor(kind);
  const enter = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 42, right: 42, top: 300, minHeight: 245, padding: "26px 34px 22px", borderRadius: 30, background: "rgba(255,255,255,.96)", border: `6px solid ${C.ink}`, boxShadow: `0 14px 0 ${C.ink}`, transform: `translateY(${(1 - enter) * -80}px)`, opacity: clamp(enter * 1.5) }}>
      <div style={{ fontFamily: BODY, fontWeight: 1000, letterSpacing: 3, color: accent, fontSize: 28 }}>{kicker}</div>
      <div style={{ fontFamily: DISPLAY, color: C.ink, fontSize: 82, lineHeight: 0.94 }}>{title}</div>
      <div style={{ fontFamily: BODY, color: "#435267", fontSize: 32, fontWeight: 850 }}>{subtitle}</div>
    </div>
  );
};

export const ChileGeographySceneSat: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const T = thumbnail ? 0 : frame / fps;
  const index = activeSection(timing.sections, T);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "compare" : kindOf(section.text);
  const cam = thumbnail ? V.compare : cameraAt(timing.sections, T);
  const reveal = thumbnail ? 1 : spring({ frame: frame - Math.round(section.start * fps), fps, config: { damping: 12, mass: 0.7 } });
  const anchorY = 0.58;
  const projector = makeSatProjector(cam, W, H, anchorY);
  const P = (lon: number, lat: number): Pt => projector.project(lon, lat);
  const path = (points: Pt[]) => points.map((point, i) => `${i ? "L" : "M"}${P(point[0], point[1]).join(",")}`).join(" ");
  const cta = timing.sections.find((candidate) => candidate.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const compare = kind === "compare" || kind === "payoff";
  const highlights: Highlight[] = compare
    ? [
        { geom: countryGeom("CHL"), label: "Chile", labelAt: [-71.2, -35], fill: "rgba(213,43,30,.78)", stroke: C.gold, labelSize: 28 },
        { geom: countryGeom("IND"), label: "India", labelAt: [79, 22], fill: "rgba(255,210,63,.72)", stroke: C.gold, labelSize: 28 },
      ]
    : [{ geom: countryGeom("CHL"), label: "Chile", labelAt: [-71.2, -35], fill: "rgba(255,190,20,.64)", stroke: C.gold, labelSize: 24 }];
  const marker = (point: Pt, label: string, color: string) => {
    const [x, y] = P(point[0], point[1]);
    return (
      <g transform={`translate(${x} ${y})`} opacity={clamp(reveal)}>
        <path d="M0 0C-24-26-28-53-12-69C5-86 34-76 39-53C43-33 25-15 0 0Z" fill={C.ink} stroke={C.white} strokeWidth={5} />
        <circle cx={8} cy={-51} r={12} fill={color} />
        <text x={48} y={-38} fill={C.white} fontFamily={BODY} fontSize={30} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>{label}</text>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      {kind === "plate" ? (
        <>
          <SatelliteMap view={V.andes} width={W} height={H} anchorY={anchorY} highlights={[{ geom: countryGeom("CHL"), label: "Chile", labelAt: [-71.2, -35] }]} darken={0.62} />
          <PlateDiagram reveal={clamp(reveal)} />
        </>
      ) : (
        <SatelliteMap view={cam} width={W} height={H} anchorY={anchorY} highlights={highlights} darken={thumbnail ? 0.1 : 0.24}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            {(kind === "length" || kind === "journey" || kind === "climates" || kind === "aha") && (
              <path d={path(CHILE_ROUTE)} fill="none" stroke={C.gold} strokeWidth={10} strokeDasharray="20 12" strokeLinecap="round" opacity={clamp(reveal)} />
            )}
            {(kind === "andes" || kind === "corridor" || kind === "answer") && (
              <path d={path(ANDES)} fill="none" stroke={C.gold} strokeWidth={12} strokeDasharray="18 10" strokeLinecap="round" opacity={clamp(reveal)} />
            )}
            {kind === "width" && (
              <>
                <line x1={P(-72.2, -33.4)[0]} y1={P(-72.2, -33.4)[1]} x2={P(-69.8, -33.4)[0]} y2={P(-69.8, -33.4)[1]} stroke={C.gold} strokeWidth={10} strokeDasharray="18 10" />
                <text x={W / 2} y={P(-71, -33.4)[1] - 45} textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize={64} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>AVG. 177 KM</text>
              </>
            )}
            {kind === "pacific" && Array.from({ length: 4 }, (_, i) => {
              const y = 800 + i * 120;
              return <path key={i} d={`M40 ${y}Q230 ${y - 55} 420 ${y}T800 ${y}`} fill="none" stroke={C.blue} strokeWidth={8} strokeDasharray="30 18" opacity={0.55} />;
            })}
            {kind === "north" && marker([-68.2, -22.9], "ATACAMA", C.sand)}
            {kind === "central" && marker([-70.6693, -33.4489], "SANTIAGO", C.green)}
            {kind === "south" && marker([-73, -50.4], "PATAGONIA", C.ice)}
            {kind === "climates" && (
              <>
                {marker([-68.2, -22.9], "DESERT", C.sand)}
                {marker([-70.6693, -33.4489], "VALLEYS", C.green)}
                {marker([-73, -50.4], "GLACIERS", C.ice)}
              </>
            )}
          </svg>
        </SatelliteMap>
      )}

      {!thumbnail && <InfoCard kind={kind} start={section.start} frame={frame} fps={fps} />}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={1480} />}
      {!thumbnail && T >= ctaT && <CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1130} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,8,18,.96),rgba(3,8,18,.08) 54%,rgba(3,8,18,.78))" }} />
          <div style={{ position: "absolute", left: 45, right: 45, top: 315, color: C.white, fontFamily: DISPLAY, fontSize: 126, lineHeight: 0.88, textAlign: "center", WebkitTextStroke: `9px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 12px 0 ${C.ink}` }}>
            CHILE IS<br /><span style={{ color: C.gold }}>LONGER!</span>
          </div>
          <div style={{ position: "absolute", left: 110, right: 110, top: 665, padding: "20px 30px", borderRadius: 28, background: C.chile, border: `6px solid ${C.white}`, boxShadow: `0 10px 0 ${C.ink}`, color: C.white, fontFamily: DISPLAY, fontSize: 60, textAlign: "center" }}>
            BUT SUPER THIN
          </div>
          <div style={{ position: "absolute", left: 150, right: 150, bottom: 360, padding: "16px 24px", borderRadius: 50, background: C.gold, border: `6px solid ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 53, textAlign: "center" }}>
            4,300 KM · WHY?
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const ChileGeographyVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaT = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const sfx: [number, string, number][] = [
    [0.1, "riser", 0.14], [0.9, "boom", 0.2],
    [first("length"), "whoosh", 0.16], [first("width"), "ding", 0.15],
    [first("plate"), "riser", 0.12], [first("north"), "pop", 0.14],
    [first("central"), "ding", 0.14], [first("south"), "whoosh", 0.14],
    [first("aha"), "boom", 0.2], [first("payoff"), "boom", 0.18],
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
      {sfx.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaT).map((time) => cue(time + 1.1, "ding", 0.13))}
      <ChileGeographySceneSat timing={timing} />
      <CoverTitle lines={["CHILE IS LONGER", "BUT SUPER THIN!"]} sub="Why is it shaped like a ribbon?" accent={C.gold} />
    </AbsoluteFill>
  );
};

export const ChileGeographyThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <ChileGeographySceneSat timing={timing} thumbnail />
);
