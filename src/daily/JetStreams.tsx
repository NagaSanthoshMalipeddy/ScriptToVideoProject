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
  | "formation"
  | "tailwind"
  | "headwind"
  | "tracks"
  | "safety"
  | "india"
  | "aha"
  | "cta";

const C = {
  night: "#06111f",
  ocean: "#0b2d46",
  land: "#e9e1cf",
  ink: "#172235",
  cyan: "#53d8ff",
  blue: "#158ee7",
  gold: "#ffd23f",
  coral: "#ff4d5e",
  green: "#35d07f",
  white: "#ffffff",
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const NEW_YORK: Pt = [-74.006, 40.7128];
const LONDON: Pt = [-0.1276, 51.5072];
const DELHI: Pt = [77.209, 28.6139];
const REYKJAVIK: Pt = [-21.9426, 64.1466];
const SHANNON: Pt = [-8.9248, 52.7038];
const GANDER: Pt = [-54.5681, 48.9569];

const ROUTE_EAST: Pt[] = [
  NEW_YORK,
  [-58, 46],
  [-40, 52.5],
  [-20, 55],
  LONDON,
];
const ROUTE_WEST: Pt[] = [
  LONDON,
  [-18, 47],
  [-38, 43],
  [-58, 40],
  NEW_YORK,
];
const JET: Pt[] = [
  [-100, 42],
  [-82, 46],
  [-64, 50],
  [-46, 55],
  [-27, 57],
  [-8, 53],
  [15, 49],
];
const TRACKS = [-5, 0, 5].map((offset) =>
  ROUTE_EAST.map(([lon, lat]) => [lon, lat + offset] as Pt)
);

const V: Record<Kind, View> = {
  hook: { lon: -37, lat: 47, span: 115 },
  formation: { lon: -34, lat: 50, span: 145 },
  tailwind: { lon: -38, lat: 50, span: 105 },
  headwind: { lon: -38, lat: 44, span: 105 },
  tracks: { lon: -39, lat: 50, span: 115 },
  safety: { lon: -37, lat: 50, span: 92 },
  india: { lon: 1, lat: 36, span: 190 },
  aha: { lon: -35, lat: 48, span: 122 },
  cta: { lon: -31, lat: 44, span: 175 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (
    s.includes("big idea") ||
    s.includes("moving walkway") ||
    s.includes("boat in a current") ||
    s.includes("here is the twist") ||
    s.includes("invisible current") ||
    s.includes("invisible highway is real") ||
    s.includes("mystery solved") ||
    s.includes("same ocean. similar plane")
  )
    return "aha";
  if (
    s.includes("travellers from india") ||
    s.includes("mumbai") ||
    s.includes("connecting through europe")
  )
    return "india";
  if (
    s.includes("turbulence") ||
    s.includes("safest ride") ||
    s.includes("rough air") ||
    s.includes("thunderstorm") ||
    s.includes("reserve fuel") ||
    s.includes("diversion") ||
    s.includes("forecast is still") ||
    s.includes("comfort") ||
    s.includes("safety first")
  )
    return "safety";
  if (
    s.includes("track") ||
    s.includes("dispatcher") ||
    s.includes("controllers") ||
    s.includes("organised") ||
    s.includes("clearance") ||
    s.includes("routes change daily") ||
    s.includes("forecast winds")
  )
    return "tracks";
  if (
    s.includes("westbound") ||
    s.includes("headwind") ||
    s.includes("wrong direction") ||
    s.includes("flying a longer distance") ||
    s.includes("longer can be faster")
  )
    return "headwind";
  if (
    s.includes("eastbound") ||
    s.includes("tailwind") ||
    s.includes("ground speed") ||
    s.includes("airspeed") ||
    s.includes("engines hold") ||
    s.includes("save an hour") ||
    s.includes("boat")
  )
    return "tailwind";
  if (
    s.includes("9 to 12") ||
    s.includes("9–12") ||
    s.includes("air masses") ||
    s.includes("rotating") ||
    s.includes("polar front") ||
    s.includes("winter") ||
    s.includes("circle the planet") ||
    s.includes("west to east") ||
    s.includes("wave north") ||
    s.includes("jet streams") ||
    s.includes("fast air")
  )
    return "formation";
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
  const index = activeSection(sections, time);
  const section = sections[index];
  const from = V[kindOf(sections[Math.max(0, index - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.4));
  const bump = Math.max(from.span, to.span) * (1 + 0.08 * Math.sin(Math.PI * p));
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span:
      p < 0.5
        ? from.span * Math.pow(bump / from.span, p * 2)
        : bump * Math.pow(to.span / bump, (p - 0.5) * 2),
  };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["AVIATION MYSTERY", "THE SKY IS MOVING", "Same ocean. Different flight time.", C.gold],
    formation: ["9–12 KM HIGH", "A RIVER OF FAST AIR", "The polar jet waves from west to east.", C.cyan],
    tailwind: ["EASTBOUND", "RIDE THE TAILWIND", "Wind adds to speed over the ground.", C.green],
    headwind: ["WESTBOUND", "FIGHT THE HEADWIND", "A longer route can take less time.", C.coral],
    tracks: ["DAILY ROUTE PLAN", "TRACKS MOVE", "Wind, traffic and weather rebuild the path.", C.cyan],
    safety: ["SAFETY FIRST", "FASTEST ≠ BEST", "Turbulence, storms and reserves matter.", C.coral],
    india: ["INDIA CONNECTION", "THE WIND STILL MATTERS", "Europe links India to Atlantic journeys.", "#ff9933"],
    aha: ["THE BIG IDEA", "A MOVING WALKWAY", "Normal airspeed. Exceptional ground speed.", C.gold],
    cta: ["GLOBETALES", "EVERY ROUTE HIDES A MAP", "New journeys, explained visually.", C.cyan],
  };
  return copy[kind];
};

const pathFrom = (points: Pt[], project: (point: Pt) => Pt) =>
  points
    .map((point, index) => `${index ? "L" : "M"}${project(point).join(",")}`)
    .join(" ");

const pointOn = (points: Pt[], progress: number): { point: Pt; angle: number } => {
  const scaled = clamp(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  const local = scaled - index;
  const a = points[index];
  const b = points[index + 1];
  return {
    point: [lerp(a[0], b[0], local), lerp(a[1], b[1], local)],
    angle: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI,
  };
};

const Plane: React.FC<{
  point: Pt;
  angle: number;
  project: (point: Pt) => Pt;
  scale?: number;
}> = ({ point, angle, project, scale = 1 }) => {
  const [x, y] = project(point);
  return (
    <g transform={`translate(${x} ${y}) rotate(${-angle}) scale(${scale})`}>
      <path
        d="M-54-8L-9-8L18-48L33-48L18-8L57 0L18 8L33 48L18 48L-9 8L-54 8L-66 0Z"
        fill={C.white}
        stroke={C.ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle cx={31} r={5} fill={C.cyan} />
    </g>
  );
};

const Pin: React.FC<{
  point: Pt;
  project: (point: Pt) => Pt;
  label: string;
  color: string;
}> = ({ point, project, label, color }) => {
  const [x, y] = project(point);
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={13} fill={color} stroke={C.white} strokeWidth={5} />
      <text
        y={-24}
        textAnchor="middle"
        fill={C.white}
        fontFamily={BODY}
        fontWeight={1000}
        fontSize={24}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}
      >
        {label}
      </text>
    </g>
  );
};

const InfoCard: React.FC<{
  kind: Kind;
  frame: number;
  start: number;
  wide: boolean;
}> = ({ kind, frame, start, wide }) => {
  const [kicker, title, sub, accent] = copyFor(kind);
  const p = spring({
    frame: frame - Math.round(start * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: wide ? 64 : 44,
        top: wide ? 54 : 300,
        width: wide ? 730 : 992,
        minHeight: wide ? 196 : 250,
        padding: wide ? "22px 34px" : "28px 38px 20px",
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - p) * -80}px)`,
        opacity: clamp(p * 1.5),
      }}
    >
      <div style={{ fontFamily: BODY, fontSize: wide ? 22 : 28, fontWeight: 1000, letterSpacing: 3, color: accent }}>
        {kicker}
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: wide ? 62 : 76, lineHeight: 0.95, color: C.ink }}>
        {title}
      </div>
      <div style={{ marginTop: 9, fontFamily: BODY, fontSize: wide ? 25 : 32, lineHeight: 1.1, fontWeight: 850, color: "#405064" }}>
        {sub}
      </div>
    </div>
  );
};

const VectorPanel: React.FC<{ kind: Kind; reveal: number; wide: boolean }> = ({
  kind,
  reveal,
  wide,
}) => {
  if (!["tailwind", "headwind", "aha"].includes(kind)) return null;
  const tail = kind !== "headwind";
  return (
    <div
      style={{
        position: "absolute",
        right: wide ? 62 : 48,
        bottom: wide ? 60 : 285,
        width: wide ? 485 : 920,
        padding: "22px 28px",
        background: "rgba(6,17,31,.94)",
        border: `5px solid ${tail ? C.green : C.coral}`,
        borderRadius: 24,
        boxShadow: `0 12px 0 ${C.ink}`,
        transform: `translateY(${(1 - reveal) * 70}px)`,
        opacity: reveal,
      }}
    >
      <div style={{ fontFamily: BODY, color: tail ? C.green : C.coral, fontSize: wide ? 21 : 27, letterSpacing: 3, fontWeight: 1000 }}>
        SPEED OVER THE GROUND
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, color: C.white }}>
        <span style={{ fontFamily: DISPLAY, fontSize: wide ? 47 : 60 }}>PLANE</span>
        <span style={{ fontFamily: DISPLAY, fontSize: wide ? 48 : 62, color: tail ? C.green : C.coral }}>{tail ? "+" : "−"}</span>
        <span style={{ fontFamily: DISPLAY, fontSize: wide ? 47 : 60 }}>WIND</span>
        <span style={{ fontFamily: DISPLAY, fontSize: wide ? 48 : 62, color: C.gold }}>=</span>
        <span style={{ fontFamily: DISPLAY, fontSize: wide ? 51 : 66, color: C.gold }}>{tail ? "FASTER" : "SLOWER"}</span>
      </div>
    </div>
  );
};

export const JetStreamsScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const T = thumbnail ? 2.2 : frame / fps;
  const index = activeSection(timing.sections, T);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const cam = thumbnail ? V.hook : cameraAt(timing.sections, T);
  const refLat = 44;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const focusX = wide ? W * 0.58 : W * 0.5;
  const focusY = wide ? H * 0.57 : H * 0.58;
  const scale = Math.min(W / (cam.span * cos), (H * (wide ? 1.05 : 0.84)) / (cam.span * (wide ? 0.66 : 1.08)));
  const project = ([lon, lat]: Pt): Pt => [
    focusX + (lon - cam.lon) * cos * scale,
    focusY - (lat - cam.lat) * scale,
  ];
  const reveal = thumbnail ? 1 : ease(clamp((T - section.start) / 1.15));
  const route = kind === "headwind" ? ROUTE_WEST : ROUTE_EAST;
  const routeP = thumbnail ? 0.7 : clamp((T - section.start) / Math.max(1.5, section.end - section.start));
  const plane = pointOn(route, routeP);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const showIndia = kind === "india";

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="atlanticOcean" cx="54%" cy="48%" r="75%">
            <stop offset="0" stopColor={C.ocean} />
            <stop offset="1" stopColor={C.night} />
          </radialGradient>
          <pattern id="atlanticGrid" width="74" height="74" patternUnits="userSpaceOnUse">
            <path d="M74 0H0V74" fill="none" stroke="rgba(112,205,255,.10)" strokeWidth={2} />
          </pattern>
          <filter id="jetGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="url(#atlanticOcean)" />
        <rect width={W} height={H} fill="url(#atlanticGrid)" />
        {COUNTRIES.filter((country) =>
          (showIndia
            ? ["USA", "CAN", "GBR", "IRL", "FRA", "ISL", "GRL", "IND", "PAK", "ESP", "PRT"]
            : ["USA", "CAN", "GBR", "IRL", "FRA", "ISL", "GRL", "ESP", "PRT"]).includes(country.iso)
        ).map((country) => (
          <path
            key={country.iso}
            d={geomPath(country.geom as never, (lon, lat) => project([lon, lat]))}
            fill={country.iso === "IND" ? "#d8efe0" : C.land}
            fillOpacity={0.92}
            stroke={country.iso === "IND" ? "#ff9933" : C.ink}
            strokeWidth={country.iso === "IND" ? 5 : 3}
            strokeLinejoin="round"
          />
        ))}

        <path d={pathFrom(JET, project)} fill="none" stroke="rgba(83,216,255,.2)" strokeWidth={wide ? 78 : 96} strokeLinecap="round" filter="url(#jetGlow)" />
        <path d={pathFrom(JET, project)} fill="none" stroke={C.cyan} strokeWidth={wide ? 16 : 20} strokeDasharray="34 20" strokeDashoffset={-T * 70} strokeLinecap="round" />
        {kind === "formation" && [-6, 6].map((offset) => (
          <path key={offset} d={pathFrom(JET.map(([lon, lat]) => [lon, lat + offset] as Pt), project)} fill="none" stroke="rgba(83,216,255,.45)" strokeWidth={5} strokeDasharray="18 18" />
        ))}
        {kind === "tracks" && TRACKS.map((track, trackIndex) => (
          <path key={trackIndex} d={pathFrom(track, project)} fill="none" stroke={trackIndex === 1 ? C.gold : C.white} strokeWidth={trackIndex === 1 ? 8 : 5} strokeDasharray="20 13" opacity={0.82} />
        ))}
        <path d={pathFrom(route, project)} fill="none" stroke={kind === "headwind" ? C.coral : C.green} strokeWidth={10} strokeDasharray={`${reveal * 1800} 1900`} strokeLinecap="round" />
        <Plane point={plane.point} angle={plane.angle} project={project} scale={wide ? 0.72 : 0.9} />
        <Pin point={NEW_YORK} project={project} label="NEW YORK" color={C.coral} />
        <Pin point={LONDON} project={project} label="LONDON" color={C.gold} />
        {kind === "tracks" && (
          <>
            <Pin point={REYKJAVIK} project={project} label="ICELAND" color={C.cyan} />
            <Pin point={SHANNON} project={project} label="IRELAND" color={C.green} />
            <Pin point={GANDER} project={project} label="CANADA" color={C.coral} />
          </>
        )}
        {showIndia && <Pin point={DELHI} project={project} label="INDIA" color="#ff9933" />}
        {kind === "safety" && (
          <g transform={`translate(${project([-42, 56]).join(" ")})`}>
            <path d="M-80 20Q-55-35-10-5Q25-55 65-5Q105-5 105 35H-90Z" fill="rgba(255,77,94,.72)" stroke={C.white} strokeWidth={5} />
            <path d="M-30 34L-52 78L-12 58L-28 104L28 48L2 54L18 34Z" fill={C.gold} />
          </g>
        )}
      </svg>

      {!thumbnail && <InfoCard kind={kind} frame={frame} start={section.start} wide={wide} />}
      {!thumbnail && <VectorPanel kind={kind} reveal={reveal} wide={wide} />}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 285 : 1480} />}
      {!thumbnail && T >= ctaT && (
        <CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={wide ? 540 : 1110} />
      )}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg,rgba(3,8,18,.98),rgba(3,8,18,.34) 64%,rgba(3,8,18,.08))" : "linear-gradient(180deg,rgba(3,8,18,.92),rgba(3,8,18,.05) 56%,rgba(3,8,18,.9))" }} />
          <div style={{ position: "absolute", left: wide ? 70 : 48, right: wide ? 670 : 48, top: wide ? 82 : 330, fontFamily: DISPLAY, fontSize: wide ? 128 : 126, lineHeight: 0.9, color: C.white, WebkitTextStroke: `${wide ? 7 : 9}px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.ink}` }}>
            INVISIBLE<br /><span style={{ color: C.cyan }}>SKY HIGHWAY</span>
          </div>
          <div style={{ position: "absolute", left: wide ? 76 : 66, bottom: wide ? 76 : 440, padding: "15px 27px", borderRadius: 18, background: C.gold, border: `5px solid ${C.ink}`, boxShadow: `0 9px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: wide ? 50 : 62 }}>
            WHY EASTBOUND WINS
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const JetStreamsVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaT = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.08, "riser", 0.15],
    [0.9, "boom", 0.2],
    [first("formation"), "whoosh", 0.15],
    [first("tailwind"), "ding", 0.14],
    [first("headwind"), "whoosh", 0.15],
    [first("tracks"), "pop", 0.14],
    [first("safety"), "boom", 0.1],
    [first("india"), "whoosh", 0.14],
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
      {nudgeTimes(ctaT).map((time) => cue(time + 1.1, "ding", 0.13))}
      <JetStreamsScene timing={timing} />
      <CoverTitle lines={["INVISIBLE", "SKY HIGHWAY"]} sub="Why eastbound wins" accent={C.cyan} />
    </AbsoluteFill>
  );
};

export const JetStreamsThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <JetStreamsScene timing={timing} thumbnail />
);
