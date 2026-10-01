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
  | "hook" | "everest" | "travel" | "chimborazo" | "height" | "compare"
  | "shape" | "bulge" | "radiusDiff" | "latitude" | "distance" | "farther"
  | "outward" | "twist" | "karman" | "result" | "ecuador" | "winners"
  | "bridge" | "cta";

const C = {
  night: "#050914",
  ink: "#172235",
  gold: "#ffd23f",
  cyan: "#55d8ff",
  coral: "#ff5263",
  green: "#39d98a",
  white: "#ffffff",
  ecuador: "#f6c744",
  nepal: "#dc143c",
};
const EVEREST: Pt = [86.925, 27.9881];
const CHIMBORAZO: Pt = [-78.817, -1.469];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("next globetales")) return "bridge";
  if (value.includes("one planet")) return "winners";
  if (value.includes("ecuador the answer")) return "ecuador";
  if (value.includes("wins one measurement")) return "result";
  if (value.includes("kármán line")) return "karman";
  if (value.includes("honest twist")) return "twist";
  if (value.includes("from earth's centre, ecuador")) return "outward";
  if (value.includes("about 2.1")) return "farther";
  if (value.includes("6,384.4")) return "distance";
  if (value.includes("far north")) return "latitude";
  if (value.includes("21 kilometres")) return "radiusDiff";
  if (value.includes("equator bulges")) return "bulge";
  if (value.includes("not a perfect ball")) return "shape";
  if (value.includes("2.5 kilometres taller")) return "compare";
  if (value.includes("6,263 metres")) return "height";
  if (value.includes("mount chimborazo")) return "chimborazo";
  if (value.includes("fly to ecuador")) return "travel";
  if (value.includes("8,848.86")) return "everest";
  return "hook";
};

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const V: Record<Kind, SatView> = {
  hook: { lon: 86.9, lat: 28, span: 35 },
  everest: { lon: 86.9, lat: 28, span: 13 },
  travel: { lon: 4, lat: 14, span: 245 },
  chimborazo: { lon: -78.8, lat: -1.5, span: 28 },
  height: { lon: -78.8, lat: -1.5, span: 22 },
  compare: { lon: 4, lat: 12, span: 245 },
  shape: { lon: 4, lat: 8, span: 250 },
  bulge: { lon: 4, lat: 8, span: 250 },
  radiusDiff: { lon: 4, lat: 8, span: 250 },
  latitude: { lon: 4, lat: 12, span: 245 },
  distance: { lon: -78.8, lat: -1.5, span: 48 },
  farther: { lon: 4, lat: 12, span: 245 },
  outward: { lon: -78.8, lat: -1.5, span: 42 },
  twist: { lon: 4, lat: 8, span: 250 },
  karman: { lon: 4, lat: 8, span: 250 },
  result: { lon: 4, lat: 12, span: 245 },
  ecuador: { lon: -78.8, lat: -1.5, span: 50 },
  winners: { lon: 4, lat: 12, span: 245 },
  bridge: { lon: -15, lat: 8, span: 250 },
  cta: { lon: -15, lat: 8, span: 250 },
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const i = activeSection(sections, time);
  const section = sections[i];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.35));
  let delta = to.lon - from.lon;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  const bump = Math.max(from.span, to.span) * (1 + 0.1 * Math.sin(Math.PI * p));
  const span = p < 0.5
    ? from.span * Math.pow(bump / from.span, p * 2)
    : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return { lon: from.lon + delta * p, lat: lerp(from.lat, to.lat, p), span };
};

const copyFor = (kind: Kind): [string, string, string, string] => ({
  hook: ["GEOGRAPHY MYTH", "NOT EVEREST!", "A lower mountain reaches farther outward.", C.gold],
  everest: ["HIGHEST ABOVE SEA LEVEL", "8,848.86 M", "Mount Everest · Nepal", C.nepal],
  travel: ["FOLLOW THE SATELLITE", "NEPAL → ECUADOR", "The answer flips near the equator.", C.cyan],
  chimborazo: ["1.47°S · 78.82°W", "CHIMBORAZO", "Volcano · Ecuador", C.ecuador],
  height: ["ABOVE SEA LEVEL", "ABOUT 6,263 M", "Lower than Everest", C.coral],
  compare: ["THE CONTRADICTION", "EVEREST IS TALLER", "By more than 2.5 km", C.coral],
  shape: ["THE HIDDEN CLUE", "EARTH ISN'T A BALL", "It is slightly wider at the equator.", C.gold],
  bulge: ["EARTH SPINS", "THE EQUATOR BULGES", "Rotation changes the planet's shape.", C.cyan],
  radiusDiff: ["EQUATOR VS POLES", "ABOUT 21 KM", "Difference in Earth's radius", C.gold],
  latitude: ["LATITUDE MATTERS", "28°N VS 1.47°S", "Chimborazo stands on the bulge.", C.cyan],
  distance: ["FROM EARTH'S CENTRE", "6,384.4 KM", "Chimborazo's summit", C.gold],
  farther: ["THE WINNING GAP", "+2.1 KM OUTWARD", "Roughly farther than Everest", C.green],
  outward: ["ONE MEASUREMENT", "ECUADOR WINS", "Farthest summit from Earth's centre", C.ecuador],
  twist: ["IMPORTANT TWIST", "WHAT COUNTS AS SPACE?", "Distance from the centre is not altitude.", C.coral],
  karman: ["COMMON SPACE BOUNDARY", "KÁRMÁN LINE ~100 KM", "Measured above mean sea level", C.cyan],
  result: ["TWO TRUE RECORDS", "TWO WINNERS", "The definition decides the answer.", C.gold],
  ecuador: ["THE TITLE'S ANSWER", "ECUADOR", "Earth's bulge gives Chimborazo the edge.", C.ecuador],
  winners: ["THE PAYOFF", "ONE PLANET · TWO WINNERS", "Chimborazo outward · Everest upward", C.gold],
  bridge: ["GLOBETALES", "THE NEXT MAP IS WAITING", "A new world story every day.", C.cyan],
  cta: ["GLOBETALES", "FOLLOW THE GLOBE", "Like · Share · Subscribe", C.gold],
})[kind] as [string, string, string, string];

const InfoCard: React.FC<{ kind: Kind; start: number; frame: number; fps: number }> = ({ kind, start, frame, fps }) => {
  const [kicker, title, subtitle, accent] = copyFor(kind);
  const enter = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", top: 300, left: 42, right: 42, minHeight: 240, padding: "26px 34px 22px", borderRadius: 30, border: `6px solid ${C.ink}`, background: "rgba(255,255,255,.96)", boxShadow: `0 14px 0 ${C.ink}`, transform: `translateY(${(1 - enter) * -80}px)`, opacity: clamp(enter * 1.5) }}>
      <div style={{ color: accent, fontFamily: BODY, fontSize: 28, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
      <div style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 78, lineHeight: 0.95 }}>{title}</div>
      <div style={{ marginTop: 10, color: "#435267", fontFamily: BODY, fontSize: 31, fontWeight: 850 }}>{subtitle}</div>
    </div>
  );
};

const Marker: React.FC<{ point: Pt; project: (lon: number, lat: number) => Pt; label: string; color: string; reveal: number }> = ({ point, project, label, color, reveal }) => {
  const [x, y] = project(point[0], point[1]);
  return (
    <g transform={`translate(${x} ${y - (1 - reveal) * 150})`} opacity={clamp(reveal * 1.5)}>
      <path d="M0 0C-28-38-35-64-35-85A35 35 0 0 1 35-85C35-64 28-38 0 0Z" fill={C.ink} stroke={C.white} strokeWidth={5} />
      <circle cy={-85} r={21} fill={color} />
      <text x={0} y={-125} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={42} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>{label}</text>
    </g>
  );
};

const Peaks: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", inset: "620px 45px 250px" }}>
    <svg width="100%" height="100%" viewBox="0 0 990 1000">
      <line x1="40" y1="850" x2="950" y2="850" stroke={C.cyan} strokeWidth="8" strokeDasharray="20 14" />
      <text x="495" y="910" textAnchor="middle" fill={C.cyan} fontFamily={BODY} fontSize="30" fontWeight="900">MEAN SEA LEVEL</text>
      <g transform={`translate(70 ${850 - 700 * reveal})`}>
        <path d="M0 700L230 0L460 700Z" fill="#7898ad" stroke={C.white} strokeWidth="7" />
        <path d="M172 175L230 0L288 175L245 142L218 185Z" fill={C.white} />
        <text x="230" y="-35" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="54" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>EVEREST</text>
        <text x="230" y="68" textAnchor="middle" fill={C.nepal} fontFamily={DISPLAY} fontSize="48" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>8,848.86 M</text>
      </g>
      <g transform={`translate(535 ${850 - 495 * reveal})`}>
        <path d="M0 495Q230-40 420 495Z" fill="#a96848" stroke={C.white} strokeWidth="7" />
        <path d="M132 158Q230-40 312 158Q240 112 132 158Z" fill={C.white} />
        <text x="210" y="-35" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="49" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>CHIMBORAZO</text>
        <text x="210" y="65" textAnchor="middle" fill={C.ecuador} fontFamily={DISPLAY} fontSize="48" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>6,263 M</text>
      </g>
    </svg>
  </div>
);

const EarthDiagram: React.FC<{ kind: Kind; reveal: number; time: number }> = ({ kind, reveal, time }) => {
  const shell = kind === "twist" || kind === "karman";
  const distance = kind === "distance" || kind === "farther";
  const latitude = kind === "latitude";
  const radius = kind === "radiusDiff";
  return (
    <div style={{ position: "absolute", inset: "610px 30px 230px" }}>
      <svg width="100%" height="100%" viewBox="0 0 1020 1050">
        <defs>
          <radialGradient id="satEarth" cx="38%" cy="30%" r="78%"><stop stopColor="#2c91b8" /><stop offset="1" stopColor="#0c3558" /></radialGradient>
          <filter id="satGlow"><feGaussianBlur stdDeviation="10" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g transform={`translate(510 540) scale(${1 + Math.sin(time * 2.2) * 0.01})`}>
          {shell && <><ellipse rx="425" ry="405" fill="none" stroke={C.cyan} strokeWidth="20" opacity={0.35} filter="url(#satGlow)" /><ellipse rx="425" ry="405" fill="none" stroke={C.cyan} strokeWidth="7" strokeDasharray="24 16" opacity={reveal} /><text x="270" y="-350" fill={C.gold} fontFamily={DISPLAY} fontSize="50">~100 KM</text></>}
          <ellipse rx="365" ry="335" fill="url(#satEarth)" stroke={C.white} strokeWidth={7} />
          <path d="M-315 115Q-100 40 80 110T315 100" fill="none" stroke="#d3c49c" strokeWidth={25} opacity={0.7} />
          <path d="M-275-115Q-100-200 55-135T285-160" fill="none" stroke="#d3c49c" strokeWidth={21} opacity={0.7} />
          <ellipse rx={365 + reveal * 22} ry={335 - reveal * 10} fill="none" stroke={C.gold} strokeWidth={kind === "bulge" || radius ? 10 : 4} opacity={0.85} />
          <ellipse rx="365" ry="92" fill="none" stroke={C.gold} strokeWidth={latitude ? 10 : 5} strokeDasharray="22 13" opacity={0.75} />
          <circle r={16} fill={C.white} />
          {(radius || distance || kind === "shape" || kind === "bulge") && <><line x1="0" y1="0" x2={360 * reveal} y2="0" stroke={C.gold} strokeWidth={11} /><line x1="0" y1="0" x2="0" y2={-330 * reveal} stroke={C.cyan} strokeWidth={9} /><text x="165" y="-25" textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize="42">EQUATOR</text><text x="25" y="-185" fill={C.cyan} fontFamily={DISPLAY} fontSize="39">POLE</text></>}
          {(latitude || distance) && <><circle cx="365" cy="12" r="17" fill={C.ecuador} stroke={C.white} strokeWidth={5} /><text x="320" y="75" textAnchor="end" fill={C.white} fontFamily={DISPLAY} fontSize="40" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>CHIMBORAZO</text><circle cx="295" cy="-155" r="17" fill={C.nepal} stroke={C.white} strokeWidth={5} /><text x="285" y="-188" textAnchor="end" fill={C.white} fontFamily={DISPLAY} fontSize="40" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>EVEREST</text>{distance && <line x1="0" y1="0" x2={365 * reveal} y2="12" stroke={C.gold} strokeWidth={12} />}</>}
        </g>
        {(radius || distance) && <g transform="translate(125 900)"><rect width="770" height="105" rx="52" fill={C.gold} stroke={C.ink} strokeWidth="7" /><text x="385" y="70" textAnchor="middle" fill={C.ink} fontFamily={DISPLAY} fontSize="54">{radius ? "EQUATORIAL RADIUS ≈ 21 KM LARGER" : kind === "farther" ? "+2.1 KM FARTHER OUT" : "6,384.4 KM"}</text></g>}
      </svg>
    </div>
  );
};

const Result: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", inset: "650px 42px 290px", display: "flex", gap: 24 }}>
    {[
      ["FARTHEST FROM", "EARTH'S CENTRE", "CHIMBORAZO", C.ecuador],
      ["HIGHEST ABOVE", "SEA LEVEL", "EVEREST", C.nepal],
    ].map(([a, b, c, color], i) => <div key={c} style={{ flex: 1, borderRadius: 32, border: `7px solid ${C.white}`, background: "rgba(12,53,88,.95)", boxShadow: `0 16px 0 ${C.ink}`, padding: "36px 24px", textAlign: "center", transform: `translateY(${(1 - reveal) * (i ? 120 : -120)}px)`, opacity: reveal }}><div style={{ color: C.cyan, fontFamily: BODY, fontSize: 28, fontWeight: 1000 }}>{a}</div><div style={{ color: C.white, fontFamily: DISPLAY, fontSize: 57, lineHeight: 0.95 }}>{b}</div><div style={{ margin: "70px auto 35px", width: 150, height: 150, borderRadius: "50%", background: color, border: `7px solid ${C.white}`, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 84 }}>✓</div><div style={{ color, fontFamily: DISPLAY, fontSize: 58, lineHeight: 0.95 }}>{c}</div></div>)}
  </div>
);

const mapKinds = new Set<Kind>(["hook", "everest", "travel", "chimborazo", "height", "outward", "ecuador", "winners", "bridge", "cta"]);
const earthKinds = new Set<Kind>(["shape", "bulge", "radiusDiff", "latitude", "distance", "farther", "twist", "karman"]);

export const CountryClosestSpaceSceneSat: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 0 : frame / fps;
  const section = timing.sections[activeSection(timing.sections, time)] ?? timing.sections[0];
  const kind = thumbnail ? "ecuador" : kindOf(section.text);
  const reveal = thumbnail ? 1 : spring({ frame: frame - Math.round(section.start * fps), fps, config: { damping: 12, mass: 0.7 } });
  const view = thumbnail ? V.ecuador : cameraAt(timing.sections, time);
  const { project } = makeSatProjector(view, width, height, 0.59);
  const cta = timing.sections.find((candidate) => candidate.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const routeProgress = kind === "travel" ? ease(clamp((time - section.start) / Math.max(1.8, section.end - section.start))) : 1;
  const mapHighlights: Highlight[] = kind === "travel" || kind === "winners"
    ? [
        { geom: countryGeom("NPL"), label: "Nepal", labelAt: [84, 28.3], fill: "rgba(220,20,60,.72)", stroke: C.gold, labelSize: 26 },
        { geom: countryGeom("ECU"), label: "Ecuador", labelAt: [-78.2, -1.4], fill: "rgba(255,190,20,.72)", stroke: C.gold, labelSize: 26 },
      ]
    : kind === "hook" || kind === "everest"
      ? [{ geom: countryGeom("NPL"), label: "Nepal", labelAt: [84, 28.3], fill: "rgba(255,190,20,.72)", stroke: C.gold, labelSize: 28 }]
      : [{ geom: countryGeom("ECU"), label: "Ecuador", labelAt: [-78.2, -1.4], fill: "rgba(255,190,20,.72)", stroke: C.gold, labelSize: 30 }];
  const showMap = mapKinds.has(kind);
  const [ex, ey] = project(EVEREST[0], EVEREST[1]);
  const [cx, cy] = project(CHIMBORAZO[0], CHIMBORAZO[1]);

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      {showMap ? (
        <SatelliteMap view={view} width={width} height={height} anchorY={0.59} highlights={mapHighlights} darken={thumbnail ? 0.13 : 0.28}>
          <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
            {kind === "travel" && <><path d={`M${ex},${ey} Q${(ex + cx) / 2},${Math.min(ey, cy) - 260} ${cx},${cy}`} fill="none" stroke="rgba(85,216,255,.25)" strokeWidth="28" /><path d={`M${ex},${ey} Q${(ex + cx) / 2},${Math.min(ey, cy) - 260} ${cx},${cy}`} fill="none" stroke={C.cyan} strokeWidth="9" strokeDasharray={`${Math.max(1, routeProgress * 1250)} 1250`} strokeLinecap="round" /></>}
            {["hook", "everest", "travel", "winners"].includes(kind) && <Marker point={EVEREST} project={project} label="EVEREST" color={C.nepal} reveal={clamp(reveal)} />}
            {["travel", "chimborazo", "height", "outward", "ecuador", "winners", "bridge", "cta"].includes(kind) && <Marker point={CHIMBORAZO} project={project} label="CHIMBORAZO" color={C.ecuador} reveal={clamp(reveal)} />}
          </svg>
        </SatelliteMap>
      ) : (
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%,#123d60,#050914 72%)" }} />
      )}
      {(kind === "height" || kind === "compare") && <Peaks reveal={clamp(reveal)} />}
      {earthKinds.has(kind) && <EarthDiagram kind={kind} reveal={clamp(reveal)} time={time} />}
      {(kind === "result" || kind === "winners") && <Result reveal={clamp(reveal)} />}
      {!thumbnail && <InfoCard kind={kind} start={section.start} frame={frame} fps={fps} />}
      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1480} />}
      {!thumbnail && time >= ctaTime && <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1110} />}
      {thumbnail && <><AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(5,9,20,.94),rgba(5,9,20,.04) 58%,rgba(5,9,20,.88))" }} /><div style={{ position: "absolute", top: 310, left: 42, right: 42, textAlign: "center", color: C.white, fontFamily: DISPLAY, fontSize: 126, lineHeight: 0.88, WebkitTextStroke: `10px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${C.ink}` }}>NOT EVEREST!<br /><span style={{ color: C.gold }}>ECUADOR WINS</span></div><div style={{ position: "absolute", left: 118, right: 118, top: 1325, height: 116, borderRadius: 58, background: C.gold, border: `7px solid ${C.white}`, boxShadow: `0 12px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 62, display: "flex", alignItems: "center", justifyContent: "center" }}>+2.1 KM OUTWARD</div></>}
    </AbsoluteFill>
  );
};

export const CountryClosestSpaceVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.05, "riser", 0.14], [0.9, "boom", 0.2], [first("travel"), "whoosh", 0.18],
    [first("chimborazo"), "pop", 0.17], [first("compare"), "boom", 0.14],
    [first("shape"), "whoosh", 0.12], [first("distance"), "riser", 0.11],
    [first("farther"), "boom", 0.2], [first("twist"), "whoosh", 0.14],
    [first("result"), "ding", 0.16], [first("ecuador"), "boom", 0.18],
  ];
  const cue = (time: number, name: string, volume: number) => Number.isFinite(time) ? <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence> : null;
  return <AbsoluteFill><Audio src={staticFile(timing.audio)} />{cues.map(([time, name, volume]) => cue(time, name, volume))}{nudgeTimes(ctaTime).map((time) => cue(time + 1.1, "ding", 0.13))}<CountryClosestSpaceSceneSat timing={timing} /><CoverTitle lines={["NOT EVEREST!", "ECUADOR WINS"]} sub="+2.1 km outward" accent={C.gold} /></AbsoluteFill>;
};

export const CountryClosestSpaceThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => <CountryClosestSpaceSceneSat timing={timing} thumbnail />;
