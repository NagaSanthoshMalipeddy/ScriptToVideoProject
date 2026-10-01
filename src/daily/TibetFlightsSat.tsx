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
  | "hook"
  | "route"
  | "plateau"
  | "cruise"
  | "pressure"
  | "descent"
  | "ground"
  | "oxygen"
  | "airports"
  | "weather"
  | "engine"
  | "planning"
  | "myth"
  | "aha"
  | "takeaway"
  | "cta";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ink: "#071523",
  gold: "#ffd23f",
  red: "#ff4d5e",
  cyan: "#53d8ff",
  green: "#35d07f",
  white: "#ffffff",
  muted: "#405064",
};

const DELHI: Pt = [77.209, 28.6139];
const LHASA: Pt = [91.1172, 29.652];
const KATHMANDU: Pt = [85.324, 27.7172];
const CHENGDU: Pt = [104.0665, 30.5728];
const KUNMING: Pt = [102.8329, 24.8801];
const PLATEAU: Pt[] = [
  [77.5, 35.8],
  [82.4, 38],
  [91.6, 37.5],
  [100.8, 34.6],
  [102, 29.2],
  [96.5, 27.3],
  [87, 28],
  [80.2, 31],
];
const DIRECT_ROUTE: Pt[] = [DELHI, [87.5, 30.8], [96.5, 31.2], CHENGDU];
const SAFER_ROUTE: Pt[] = [DELHI, [82.5, 24.7], KUNMING, CHENGDU];

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: 90, lat: 30.5, span: 62 },
  route: { lon: 90, lat: 28.5, span: 48 },
  plateau: { lon: 90, lat: 32.5, span: 35 },
  cruise: { lon: 89, lat: 30.5, span: 28 },
  pressure: { lon: 91, lat: 31.2, span: 30 },
  descent: { lon: 91, lat: 31, span: 24 },
  ground: { lon: 91, lat: 31.5, span: 22 },
  oxygen: { lon: 91, lat: 31.5, span: 25 },
  airports: { lon: 93, lat: 28.8, span: 45 },
  weather: { lon: 89, lat: 29.5, span: 32 },
  engine: { lon: 94, lat: 30.5, span: 34 },
  planning: { lon: 91, lat: 28.5, span: 48 },
  myth: { lon: 91, lat: 30.5, span: 38 },
  aha: { lon: 91, lat: 31.2, span: 26 },
  takeaway: { lon: 91, lat: 28.5, span: 52 },
  cta: { lon: 91, lat: 28.5, span: 58 },
};

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("safest route")) return "takeaway";
  if (value.includes("real danger")) return "aha";
  if (value.includes("do not completely")) return "myth";
  if (value.includes("airlines often choose")) return "planning";
  if (value.includes("engine problem")) return "engine";
  if (value.includes("powerful winds")) return "weather";
  if (value.includes("diversion airports")) return "airports";
  if (value.includes("emergency oxygen")) return "oxygen";
  if (value.includes("ground itself")) return "ground";
  if (value.includes("10,000")) return "descent";
  if (value.includes("cabin pressure")) return "pressure";
  if (value.includes("modern jets")) return "cruise";
  if (value.includes("highest, largest plateau")) return "plateau";
  if (value.includes("flights cross")) return "route";
  return "hook";
};

const activeIndex = (sections: Section[], time: number) => {
  let index = 0;
  sections.forEach((section, candidate) => {
    if (time >= section.start) index = candidate;
  });
  return index;
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const index = activeIndex(sections, time);
  const section = sections[index] ?? sections[0];
  const from = VIEWS[kindOf(sections[Math.max(0, index - 1)]?.text ?? "")];
  const to = VIEWS[kindOf(section?.text ?? "")];
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.5));
  const wide = Math.max(from.span, to.span);
  const bump = wide * (1 + 0.14 * Math.sin(Math.PI * progress));
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span:
      progress < 0.5
        ? from.span * Math.pow(bump / from.span, progress * 2)
        : bump * Math.pow(to.span / bump, (progress - 0.5) * 2),
  };
};

const cutPath = (points: Pt[], progress: number) => {
  if (progress <= 0) return [points[0]];
  if (progress >= 1) return points;
  const lengths = points.slice(1).map((point, i) =>
    Math.hypot(point[0] - points[i][0], point[1] - points[i][1]),
  );
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * progress;
  const output: Pt[] = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) {
      output.push(points[i + 1]);
      remaining -= lengths[i];
      continue;
    }
    const local = lengths[i] ? remaining / lengths[i] : 0;
    output.push([
      lerp(points[i][0], points[i + 1][0], local),
      lerp(points[i][1], points[i + 1][1], local),
    ]);
    break;
  }
  return output;
};

const pathD = (points: Pt[], project: (point: Pt) => Pt, close = false) =>
  `${points
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ")}${close ? " Z" : ""}`;

const pointOnPath = (points: Pt[], progress: number) => {
  const cut = cutPath(points, clamp(progress));
  const point = cut[cut.length - 1];
  const previous = cut[Math.max(0, cut.length - 2)];
  return { point, previous };
};

const Plane: React.FC<{ point: Pt; previous: Pt; project: (point: Pt) => Pt; danger?: boolean }> = ({
  point,
  previous,
  project,
  danger = false,
}) => {
  const [x, y] = project(point);
  const [px, py] = project(previous);
  const angle = (Math.atan2(y - py, x - px) * 180) / Math.PI;
  return (
    <svg
      width={150}
      height={110}
      viewBox="-75 -55 150 110"
      style={{
        position: "absolute",
        left: x,
        top: y,
        overflow: "visible",
        transform: `translate(-50%,-50%) rotate(${angle}deg)`,
        filter: "drop-shadow(0 6px 8px rgba(0,0,0,.65))",
      }}
    >
      <path
        d="M-58-8H-10L15-46H31L18-8L62 0L18 8L31 46H15L-10 8H-58L-69 0Z"
        fill={C.white}
        stroke={C.ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle cx={32} cy={0} r={7} fill={danger ? C.red : C.cyan} />
    </svg>
  );
};

const AirportPin: React.FC<{
  point: Pt;
  project: (point: Pt) => Pt;
  label: string;
  color: string;
  reveal: number;
  align?: "left" | "right";
}> = ({ point, project, label, color, reveal, align = "left" }) => {
  const [x, y] = project(point);
  return (
    <g
      opacity={clamp(reveal * 1.6)}
      transform={`translate(0 ${(1 - reveal) * -110})`}
    >
      <path
        d={`M${x} ${y}c0 0-22-28-22-48a22 22 0 1 1 44 0c0 20-22 48-22 48Z`}
        fill={C.ink}
        stroke={C.white}
        strokeWidth={4}
      />
      <circle cx={x} cy={y - 48} r={9} fill={color} />
      <text
        x={x + (align === "left" ? 24 : -24)}
        y={y - 60}
        textAnchor={align === "left" ? "start" : "end"}
        fill={C.white}
        fontFamily={BODY}
        fontWeight={900}
        fontSize={25}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}
      >
        {label}
      </text>
    </g>
  );
};

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["WHY PILOTS AVOID TIBET", "The danger is not one mountain", C.red],
  route: ["THE ROUTE BENDS", "Long flights often skirt the plateau", C.cyan],
  plateau: ["EARTH'S HIGHEST PLATEAU", "Much of it averages over 4,500 m", C.gold],
  cruise: ["JETS CAN CROSS", "The peaks alone are not the main problem", C.green],
  pressure: ["CABIN PRESSURE FAILS", "Pilots must descend fast", C.red],
  descent: ["35,000 → 10,000 FT", "The normal emergency target", C.gold],
  ground: ["THE GROUND IS TOO HIGH", "The plateau can block that descent", C.red],
  oxygen: ["LIMITED OXYGEN TIME", "Staying high shrinks the safety margin", C.red],
  airports: ["FEW DIVERSION AIRPORTS", "Far apart in difficult terrain", C.gold],
  weather: ["MOUNTAIN WEATHER", "Wind · turbulence · sudden changes", C.cyan],
  engine: ["ENGINE-OUT ESCAPE", "A safe route must still clear the ridges", C.red],
  planning: ["OPTIONS = SAFETY", "More airports and lower terrain often win", C.cyan],
  myth: ["CAN FLY · SAFER TO SKIRT", "Some regional flights do cross Tibet", C.green],
  aha: ["THE REAL DANGER", "NO EASY WAY DOWN", C.gold],
  takeaway: ["SAFEST ≠ STRAIGHTEST", "A longer route can offer better options", C.cyan],
  cta: ["GLOBETALES", "The map behind every route", C.gold],
};

const InfoCard: React.FC<{ kind: Kind; localTime: number }> = ({ kind, localTime }) => {
  const [title, detail, accent] = COPY[kind];
  const pop = spring({
    frame: Math.round(localTime * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        top: 310,
        minHeight: 235,
        padding: "27px 32px 23px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${C.ink}`,
        opacity: clamp(pop * 1.5),
        transform: `translateY(${(1 - pop) * -90}px)`,
      }}
    >
      <div style={{ width: 28, alignSelf: "stretch", borderRadius: 18, background: accent }} />
      <div>
        <div
          style={{
            fontFamily: DISPLAY,
            color: C.ink,
            fontSize: title.length > 23 ? 58 : 72,
            lineHeight: 0.95,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 13,
            fontFamily: BODY,
            color: C.muted,
            fontSize: 32,
            lineHeight: 1.1,
            fontWeight: 850,
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
};

const AltitudePanel: React.FC<{ kind: Kind; reveal: number }> = ({ kind, reveal }) => {
  if (!["pressure", "descent", "ground", "oxygen", "engine"].includes(kind)) return null;
  const danger = ["ground", "oxygen"].includes(kind);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        bottom: 300,
        padding: "26px 32px",
        borderRadius: 26,
        background: "rgba(7,21,35,.95)",
        border: `5px solid ${danger ? C.red : C.cyan}`,
        boxShadow: `0 12px 0 ${C.ink}`,
        color: C.white,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 80}px)`,
      }}
    >
      <div style={{ fontFamily: BODY, fontSize: 26, fontWeight: 900, letterSpacing: 3, color: danger ? C.red : C.cyan }}>
        EMERGENCY PROFILE
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 64 }}>35,000 FT</div>
        <div style={{ flex: 1, height: 9, background: C.white, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: `${80 - reveal * 65}%`,
              top: -7,
              width: 23,
              height: 23,
              borderRadius: "50%",
              background: C.red,
            }}
          />
        </div>
        <div style={{ fontFamily: DISPLAY, color: C.gold, fontSize: 62 }}>10,000 FT</div>
      </div>
      <div style={{ marginTop: 8, fontFamily: BODY, fontSize: 29, fontWeight: 850, color: danger ? C.red : "#c9eaff" }}>
        {kind === "engine"
          ? "ONE-ENGINE ESCAPE ROUTE REQUIRED"
          : danger
            ? "PLATEAU BLOCKS THE NORMAL DESCENT"
            : "DESCEND QUICKLY TO BREATHABLE AIR"}
      </div>
    </div>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = [
    "avoid flying over tibet",
    "flights cross",
    "4,500",
    "modern jets",
    "cabin pressure",
    "10,000",
    "ground itself",
    "emergency oxygen",
    "diversion airports",
    "powerful winds",
    "engine problem",
    "airlines often choose",
    "do not completely",
    "real danger",
    "safest route",
    "please like",
  ];
  return expected.filter(
    (needle) => !sections.some((section) => section.text.toLowerCase().includes(needle)),
  );
};

const TibetFlightsSatScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 2.2 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const view = thumbnail ? { lon: 90, lat: 30.5, span: 48 } : cameraAt(timing.sections, time);
  const rawProject = makeSatProjector(view, width, height, 0.57).project;
  const project = ([lon, lat]: Pt): Pt => rawProject(lon, lat);
  const localTime = time - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localTime / 1));
  const routeProgress = thumbnail ? 0.75 : ease(clamp(localTime / Math.max(1.4, section.end - section.start)));
  const route = ["planning", "takeaway", "cta"].includes(kind) ? SAFER_ROUTE : DIRECT_ROUTE;
  const plane = pointOnPath(route, routeProgress);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle),
    )?.start ?? ctaTime;
  const airportsOn = ["airports", "planning", "myth", "aha", "takeaway", "cta"].includes(kind)
    ? reveal
    : 0;
  const airportLabels = kind === "airports";
  const plateauPath = pathD(PLATEAU, project, true);
  const highlights = [
    { geom: countryGeom("CHN"), label: "China", labelAt: [100, 36] as Pt },
    { geom: countryGeom("IND"), label: "India", labelAt: [79.5, 24] as Pt },
    { geom: countryGeom("NPL"), label: "Nepal", labelAt: [82.7, 26.6] as Pt },
    { geom: countryGeom("BTN"), label: "Bhutan", labelAt: [90.5, 25.6] as Pt },
  ];

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={0.57}
        darken={thumbnail ? 0.2 : kind === "cta" ? 0.34 : 0.12}
        highlights={highlights}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <path d={plateauPath} fill="rgba(255,190,20,.22)" stroke={C.gold} strokeWidth={7} strokeDasharray="18 12" />
          {[0.18, 0.36, 0.54].map((shrink) => {
            const ring = PLATEAU.map(([lon, lat]) => [
              lerp(lon, 90, shrink * 0.34),
              lerp(lat, 32.5, shrink * 0.34),
            ] as Pt);
            return <path key={shrink} d={pathD(ring, project, true)} fill="none" stroke="rgba(255,210,63,.32)" strokeWidth={3} />;
          })}
          <path d={pathD(DIRECT_ROUTE, project)} fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
          <path
            d={pathD(cutPath(DIRECT_ROUTE, ["planning", "takeaway", "cta"].includes(kind) ? 1 : routeProgress), project)}
            fill="none"
            stroke={C.red}
            strokeWidth={8}
            strokeDasharray="22 14"
            strokeLinecap="round"
            opacity={["planning", "takeaway", "cta"].includes(kind) ? 0.36 : 0.9}
          />
          {["route", "planning", "takeaway", "cta"].includes(kind) && (
            <>
              <path d={pathD(SAFER_ROUTE, project)} fill="none" stroke={C.ink} strokeWidth={19} strokeLinecap="round" />
              <path
                d={pathD(cutPath(SAFER_ROUTE, kind === "route" ? routeProgress : 1), project)}
                fill="none"
                stroke={C.cyan}
                strokeWidth={9}
                strokeDasharray="24 14"
                strokeLinecap="round"
              />
            </>
          )}
          {kind === "weather" && [-1, 0, 1].map((offset) => {
            const wave: Pt[] = [[78, 27.8 + offset], [84, 30 + offset], [90, 27.8 + offset], [96, 30.2 + offset], [102, 28 + offset]];
            return <path key={offset} d={pathD(wave, project)} fill="none" stroke={C.cyan} strokeWidth={6} opacity={0.82 - Math.abs(offset) * 0.16} />;
          })}
          <AirportPin point={LHASA} project={project} label={airportLabels ? "LHASA" : ""} color={C.gold} reveal={airportsOn} />
          <AirportPin point={KATHMANDU} project={project} label={airportLabels ? "KATHMANDU" : ""} color={C.green} reveal={airportsOn} align="right" />
          <AirportPin point={CHENGDU} project={project} label={airportLabels ? "CHENGDU" : ""} color={C.cyan} reveal={airportsOn} />
          <AirportPin point={KUNMING} project={project} label={airportLabels ? "KUNMING" : ""} color={C.cyan} reveal={airportsOn} />
          <text
            x={project([90, 34.2])[0]}
            y={project([90, 34.2])[1]}
            textAnchor="middle"
            fill={C.white}
            fontFamily={BODY}
            fontStyle="italic"
            fontWeight={900}
            fontSize={30}
            style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}
          >
            TIBETAN PLATEAU · 4,500 m+
          </text>
        </svg>
        {kind !== "airports" && (
          <Plane point={plane.point} previous={plane.previous} project={project} danger={kind === "engine"} />
        )}

        {!thumbnail && <InfoCard kind={kind} localTime={localTime} />}
        {!thumbnail && <AltitudePanel kind={kind} reveal={reveal} />}
        {!thumbnail && kind === "myth" && (
          <div style={{ position: "absolute", left: 74, right: 74, bottom: 315, display: "flex", gap: 18 }}>
            {[
              ["CAN FLY", C.green],
              ["SAFER TO SKIRT", C.gold],
            ].map(([label, color]) => (
              <div key={label} style={{ flex: 1, padding: "22px 10px 17px", background: color, border: `6px solid ${C.ink}`, borderRadius: 24, boxShadow: `0 11px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 48, textAlign: "center" }}>
                {label}
              </div>
            ))}
          </div>
        )}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1460} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard
            T={time}
            top={1120}
            likeT={wordAt("like")}
            shareT={wordAt("share")}
            subT={wordAt("subscribe")}
          />
        )}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 820, padding: 30, background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 38, textAlign: "center" }}>
            MISSING CUES: {missingCues(timing.sections).join(", ")}
          </div>
        )}

        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,10,18,.9),rgba(3,10,18,.08) 55%,rgba(3,10,18,.9))" }} />
            <div
              style={{
                position: "absolute",
                left: 45,
                right: 45,
                top: 330,
                fontFamily: DISPLAY,
                fontSize: 132,
                lineHeight: 0.88,
                color: C.white,
                WebkitTextStroke: `9px ${C.ink}`,
                paintOrder: "stroke fill",
                textShadow: `0 12px 0 ${C.ink}`,
                textAlign: "center",
              }}
            >
              WHY PILOTS
              <br />
              <span style={{ color: C.red }}>AVOID TIBET</span>
            </div>
            <div style={{ position: "absolute", left: 82, right: 82, top: 1310, padding: "18px 22px 14px", border: `6px solid ${C.ink}`, borderRadius: 24, boxShadow: `0 11px 0 ${C.ink}`, background: C.gold, color: C.ink, fontFamily: DISPLAY, fontSize: 62, textAlign: "center" }}>
              NO EASY WAY DOWN
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const TibetFlightsVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const startOf = (kind: Kind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const ctaTime = startOf("cta");
  const soundCues: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.85, "boom", 0.22],
    [startOf("route"), "whoosh", 0.16],
    [startOf("plateau"), "ding", 0.16],
    [startOf("pressure"), "boom", 0.18],
    [startOf("airports"), "pop", 0.17],
    [startOf("weather"), "whoosh", 0.15],
    [startOf("engine"), "boom", 0.15],
    [startOf("aha"), "ding", 0.2],
    [startOf("takeaway"), "riser", 0.14],
  ];
  const sound = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {soundCues.map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.14))}
      <TibetFlightsSatScene timing={timing} />
    </AbsoluteFill>
  );
};

export const TibetFlightsThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <TibetFlightsSatScene timing={timing} thumbnail />
);
