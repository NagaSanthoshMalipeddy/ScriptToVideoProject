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
  type Highlight,
  type SatView,
} from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Kind =
  | "hook"
  | "formation"
  | "tailwind"
  | "headwind"
  | "planning"
  | "safety"
  | "aha"
  | "cta";

const C = {
  night: "#06111f",
  ink: "#172235",
  cyan: "#53d8ff",
  gold: "#ffd23f",
  coral: "#ff4d5e",
  green: "#35d07f",
  white: "#ffffff",
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const NEW_YORK: Pt = [-74.006, 40.7128];
const LONDON: Pt = [-0.1276, 51.5072];
const REYKJAVIK: Pt = [-21.9426, 64.1466];
const SHANNON: Pt = [-8.9248, 52.7038];
const GANDER: Pt = [-54.5681, 48.9569];
const EAST: Pt[] = [
  NEW_YORK,
  [-58, 46],
  [-40, 52.5],
  [-20, 55],
  LONDON,
];
const WEST: Pt[] = [
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
  EAST.map(([lon, lat]) => [lon, lat + offset] as Pt)
);

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: -38, lat: 49, span: 112 },
  formation: { lon: -38, lat: 51, span: 142 },
  tailwind: { lon: -38, lat: 50, span: 105 },
  headwind: { lon: -38, lat: 45, span: 105 },
  planning: { lon: -39, lat: 51, span: 118 },
  safety: { lon: -39, lat: 52, span: 96 },
  aha: { lon: -36, lat: 48, span: 142 },
  cta: { lon: -34, lat: 47, span: 165 },
};

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (
    value.includes("please like") ||
    value.includes("every curved flight")
  )
    return "cta";
  if (
    value.includes("the twist") ||
    value.includes("moving air") ||
    value.includes("opposite flights")
  )
    return "aha";
  if (value.includes("safest ride") || value.includes("rough air"))
    return "safety";
  if (value.includes("route changes daily")) return "planning";
  if (value.includes("westbound") || value.includes("avoid its core"))
    return "headwind";
  if (
    value.includes("dispatchers") ||
    value.includes("ground speed") ||
    value.includes("save an hour")
  )
    return "tailwind";
  if (
    value.includes("high above") ||
    value.includes("jet streams") ||
    value.includes("wave north")
  )
    return "formation";
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
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.35));
  const bump =
    Math.max(from.span, to.span) *
    (1 + 0.1 * Math.sin(Math.PI * progress));
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
  const scaled = clamp(progress) * (points.length - 1);
  const index = Math.min(points.length - 2, Math.floor(scaled));
  return [
    ...points.slice(0, index + 1),
    [
      lerp(points[index][0], points[index + 1][0], scaled - index),
      lerp(points[index][1], points[index + 1][1], scaled - index),
    ] as Pt,
  ];
};

const pathD = (points: Pt[], project: (point: Pt) => Pt) =>
  points
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

const Plane: React.FC<{
  route: Pt[];
  progress: number;
  project: (point: Pt) => Pt;
}> = ({ route, progress, project }) => {
  const cut = cutPath(route, progress);
  const point = cut[cut.length - 1];
  const previous = cut[Math.max(0, cut.length - 2)];
  const [x, y] = project(point);
  const [px, py] = project(previous);
  const angle = (Math.atan2(y - py, x - px) * 180) / Math.PI;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${angle}) scale(.92)`}
      style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,.7))" }}
    >
      <path
        d="M-58-8H-10L15-46H31L18-8L62 0L18 8L31 46H15L-10 8H-58L-69 0Z"
        fill={C.white}
        stroke={C.ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <circle cx={32} r={6} fill={C.cyan} />
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

const COPY: Record<Kind, [string, string, string, string]> = {
  hook: [
    "AVIATION MYSTERY",
    "THE SKY IS MOVING",
    "Same ocean. Different flight time.",
    C.gold,
  ],
  formation: [
    "9-12 KM HIGH",
    "A RIVER OF FAST AIR",
    "The polar jet waves west to east.",
    C.cyan,
  ],
  tailwind: [
    "EASTBOUND",
    "RIDE THE TAILWIND",
    "Wind adds to speed over the ground.",
    C.green,
  ],
  headwind: [
    "WESTBOUND",
    "AVOID THE CORE",
    "A longer route can take less time.",
    C.coral,
  ],
  planning: [
    "DAILY ROUTE PLAN",
    "TRACKS MOVE",
    "Wind, traffic and weather rebuild the path.",
    C.cyan,
  ],
  safety: [
    "SAFETY FIRST",
    "FASTEST IS NOT BEST",
    "Pilots trade minutes for smoother air.",
    C.coral,
  ],
  aha: [
    "THE BIG IDEA",
    "A MOVING CONVEYOR",
    "The plane flies inside moving air.",
    C.gold,
  ],
  cta: [
    "GLOBETALES",
    "EVERY ROUTE HIDES A STORY",
    "Maps make the invisible visible.",
    C.cyan,
  ],
};

const InfoCard: React.FC<{ kind: Kind; local: number }> = ({
  kind,
  local,
}) => {
  const [kicker, title, detail, accent] = COPY[kind];
  const pop = spring({
    frame: Math.round(local * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        top: 305,
        minHeight: 245,
        padding: "28px 36px 20px",
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - pop) * -85}px)`,
        opacity: clamp(pop * 1.5),
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          color: accent,
          fontSize: 28,
          fontWeight: 1000,
          letterSpacing: 3,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          color: C.ink,
          fontSize: title.length > 20 ? 66 : 78,
          lineHeight: 0.95,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 10,
          fontFamily: BODY,
          color: "#405064",
          fontSize: 32,
          lineHeight: 1.1,
          fontWeight: 850,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const SpeedPanel: React.FC<{ kind: Kind; reveal: number }> = ({
  kind,
  reveal,
}) => {
  if (!["tailwind", "headwind", "aha"].includes(kind)) return null;
  const tail = kind !== "headwind";
  return (
    <div
      style={{
        position: "absolute",
        left: 62,
        right: 62,
        bottom: 285,
        padding: "24px 28px",
        background: "rgba(6,17,31,.94)",
        border: `5px solid ${tail ? C.green : C.coral}`,
        borderRadius: 24,
        boxShadow: `0 12px 0 ${C.ink}`,
        transform: `translateY(${(1 - reveal) * 70}px)`,
        opacity: reveal,
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          color: tail ? C.green : C.coral,
          fontSize: 25,
          letterSpacing: 3,
          fontWeight: 1000,
        }}
      >
        SPEED OVER THE GROUND
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: C.white,
          fontFamily: DISPLAY,
          fontSize: 55,
        }}
      >
        <span>PLANE</span>
        <span style={{ color: tail ? C.green : C.coral }}>
          {tail ? "+" : "-"}
        </span>
        <span>WIND</span>
        <span style={{ color: C.gold }}>=</span>
        <span style={{ color: C.gold }}>{tail ? "FASTER" : "SLOWER"}</span>
      </div>
    </div>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = [
    "invisible highway",
    "cross the atlantic",
    "not secretly faster",
    "high above us",
    "jet streams",
    "do not stay still",
    "dispatchers",
    "ground speed",
    "save an hour",
    "westbound",
    "avoid its core",
    "route changes daily",
    "safest ride",
    "rough air",
    "does not pull",
    "moving air",
    "opposite flights",
    "every curved flight",
    "please like",
  ];
  return expected.filter(
    (needle) =>
      !sections.some((section) =>
        section.text.toLowerCase().includes(needle)
      )
  );
};

const highlightsFor = (kind: Kind): Highlight[] => {
  const isos =
    kind === "formation" || kind === "aha" || kind === "cta"
      ? ["USA", "CAN", "GRL", "ISL", "IRL", "GBR", "FRA", "ESP", "PRT"]
      : ["USA", "CAN", "IRL", "GBR", "FRA"];
  const labels: Record<string, [string, Pt]> = {
    USA: ["United States", [-99, 38]],
    CAN: ["Canada", [-102, 58]],
    GRL: ["Greenland", [-42, 72]],
    ISL: ["Iceland", [-19, 65]],
    IRL: ["Ireland", [-8.1, 53.3]],
    GBR: ["United Kingdom", [-2.8, 55]],
    FRA: ["France", [2.4, 46.5]],
    ESP: ["Spain", [-3.5, 40.2]],
    PRT: ["Portugal", [-8, 39.5]],
  };
  return isos.map((iso) => ({
    geom: countryGeom(iso),
    label: labels[iso][0],
    labelAt: labels[iso][1],
    fill: "rgba(255,190,20,.22)",
    labelSize: 22,
  }));
};

export const JetStreamsSceneSat: React.FC<{
  timing: Timing;
  thumbnail?: boolean;
}> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 2.2 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section.text);
  const view = thumbnail ? VIEWS.hook : cameraAt(timing.sections, time);
  const { project: rawProject } = makeSatProjector(
    view,
    width,
    height,
    0.57
  );
  const project = ([lon, lat]: Pt): Pt => rawProject(lon, lat);
  const local = time - section.start;
  const reveal = thumbnail ? 1 : ease(clamp(local / 1.05));
  const route = kind === "headwind" ? WEST : EAST;
  const routeProgress = thumbnail
    ? 0.72
    : ease(clamp(local / Math.max(1.4, section.end - section.start)));
  const cta = timing.sections.find((item) =>
    item.text.toLowerCase().includes("please like")
  );
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word
        .toLowerCase()
        .replace(/[^a-z]/g, "")
        .startsWith(needle)
    )?.start ?? ctaTime;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={0.57}
        darken={thumbnail ? 0.18 : kind === "cta" ? 0.38 : 0.2}
        highlights={highlightsFor(kind)}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
        >
          <defs>
            <filter id="jetGlowSat">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={pathD(JET, project)}
            fill="none"
            stroke="rgba(83,216,255,.2)"
            strokeWidth={98}
            strokeLinecap="round"
            filter="url(#jetGlowSat)"
          />
          <path
            d={pathD(JET, project)}
            fill="none"
            stroke={C.cyan}
            strokeWidth={20}
            strokeDasharray="34 20"
            strokeDashoffset={-time * 70}
            strokeLinecap="round"
          />
          {kind === "formation" &&
            [-6, 6].map((offset) => (
              <path
                key={offset}
                d={pathD(
                  JET.map(([lon, lat]) => [lon, lat + offset] as Pt),
                  project
                )}
                fill="none"
                stroke="rgba(83,216,255,.5)"
                strokeWidth={5}
                strokeDasharray="18 18"
              />
            ))}
          {kind === "planning" &&
            TRACKS.map((track, trackIndex) => (
              <path
                key={trackIndex}
                d={pathD(track, project)}
                fill="none"
                stroke={trackIndex === 1 ? C.gold : C.white}
                strokeWidth={trackIndex === 1 ? 8 : 5}
                strokeDasharray="20 13"
                opacity={0.82}
              />
            ))}
          <path
            d={pathD(cutPath(route, routeProgress), project)}
            fill="none"
            stroke={kind === "headwind" ? C.coral : C.green}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <Plane
            route={route}
            progress={routeProgress}
            project={project}
          />
          <Pin
            point={NEW_YORK}
            project={project}
            label="NEW YORK"
            color={C.coral}
          />
          <Pin
            point={LONDON}
            project={project}
            label="LONDON"
            color={C.gold}
          />
          {kind === "planning" && (
            <>
              <Pin
                point={REYKJAVIK}
                project={project}
                label="ICELAND"
                color={C.cyan}
              />
              <Pin
                point={SHANNON}
                project={project}
                label="IRELAND"
                color={C.green}
              />
              <Pin
                point={GANDER}
                project={project}
                label="CANADA"
                color={C.coral}
              />
            </>
          )}
          {kind === "safety" &&
            (() => {
              const [x, y] = project([-42, 56]);
              return (
                <g transform={`translate(${x} ${y})`}>
                  <path
                    d="M-80 20Q-55-35-10-5Q25-55 65-5Q105-5 105 35H-90Z"
                    fill="rgba(255,77,94,.72)"
                    stroke={C.white}
                    strokeWidth={5}
                  />
                  <path
                    d="M-30 34L-52 78L-12 58L-28 104L28 48L2 54L18 34Z"
                    fill={C.gold}
                  />
                </g>
              );
            })()}
        </svg>
        {!thumbnail && <InfoCard kind={kind} local={local} />}
        {!thumbnail && <SpeedPanel kind={kind} reveal={reveal} />}
        {!thumbnail && (
          <SubscribeNudge T={time} until={ctaTime} top={1480} />
        )}
        {!thumbnail && time >= ctaTime && (
          <CtaCard
            T={time}
            likeT={wordAt("like")}
            shareT={wordAt("share")}
            subT={wordAt("subscribe")}
            top={1110}
          />
        )}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 850,
              padding: 28,
              background: C.coral,
              color: C.white,
              fontFamily: BODY,
              fontSize: 36,
              textAlign: "center",
            }}
          >
            MISSING CUES: {missingCues(timing.sections).join(", ")}
          </div>
        )}
        {thumbnail && (
          <>
            <AbsoluteFill
              style={{
                background:
                  "linear-gradient(180deg,rgba(3,8,18,.92),rgba(3,8,18,.04) 58%,rgba(3,8,18,.88))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 44,
                right: 44,
                top: 335,
                fontFamily: DISPLAY,
                fontSize: 122,
                lineHeight: 0.88,
                textAlign: "center",
                color: C.white,
                WebkitTextStroke: `9px ${C.ink}`,
                paintOrder: "stroke fill",
                textShadow: `0 12px 0 ${C.ink}`,
              }}
            >
              INVISIBLE
              <br />
              <span style={{ color: C.cyan }}>SKY HIGHWAY</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: 92,
                right: 92,
                top: 1260,
                padding: "17px 20px 13px",
                borderRadius: 24,
                border: `6px solid ${C.ink}`,
                boxShadow: `0 10px 0 ${C.ink}`,
                background: C.gold,
                color: C.ink,
                textAlign: "center",
                fontFamily: DISPLAY,
                fontSize: 56,
              }}
            >
              WHY EASTBOUND WINS
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const JetStreamsVideoSat: React.FC<{ timing: Timing }> = ({
  timing,
}) => {
  const { fps } = useVideoConfig();
  const ctaTime =
    timing.sections.find((section) =>
      section.text.toLowerCase().includes("please like")
    )?.start ?? timing.durationSec;
  const first = (kind: Kind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ??
    Number.NaN;
  const sounds: [number, string, number][] = [
    [0.1, "riser", 0.14],
    [0.9, "boom", 0.2],
    [first("formation"), "whoosh", 0.15],
    [first("tailwind"), "ding", 0.14],
    [first("headwind"), "whoosh", 0.15],
    [first("planning"), "pop", 0.14],
    [first("safety"), "boom", 0.1],
    [first("aha"), "ding", 0.2],
  ];
  const cue = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence
        key={`${name}-${time}`}
        from={Math.max(0, Math.round(time * fps))}
        durationInFrames={75}
      >
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sounds.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) =>
        cue(time + 1.1, "ding", 0.13)
      )}
      <JetStreamsSceneSat timing={timing} />
    </AbsoluteFill>
  );
};

export const JetStreamsThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <JetStreamsSceneSat timing={timing} thumbnail />
);
