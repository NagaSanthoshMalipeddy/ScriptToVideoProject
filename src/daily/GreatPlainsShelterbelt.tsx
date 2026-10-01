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
import statesJson from "./us-states.json";

type Pt = [number, number];
type Ring = Pt[];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
type StateFeature = {
  properties: { name: string; abbr: string };
  geometry: Geometry;
};
type SceneKind =
  | "hook"
  | "dust"
  | "plan"
  | "science"
  | "people"
  | "scale"
  | "legacy"
  | "aha"
  | "cta";

const STATES = (statesJson as unknown as { features: StateFeature[] }).features.filter(
  (state) => !["AK", "HI"].includes(state.properties.abbr)
);
const PLAINS = ["ND", "SD", "NE", "KS", "OK", "TX"];
const STATE_LABELS: Record<string, Pt> = {
  ND: [-100.5, 47.4],
  SD: [-100.2, 44.4],
  NE: [-99.9, 41.5],
  KS: [-98.8, 38.6],
  OK: [-97.6, 35.6],
  TX: [-99.4, 31.4],
};

const C = {
  night: "#071426",
  ocean: "#0d3152",
  land: "#eadfc8",
  ink: "#172235",
  green: "#39b86b",
  darkGreen: "#176b43",
  dust: "#d79a43",
  gold: "#ffd23f",
  red: "#ef4444",
  white: "#ffffff",
  sky: "#9bd8ff",
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const ease = Easing.inOut(Easing.cubic);

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const kindOf = (text: string): SceneKind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (
    value.includes("secret") ||
    value.includes("living infrastructure") ||
    value.includes("giant shield") ||
    value.includes("surprising answer") ||
    value.includes("small idea") ||
    value.includes("overlapping pockets") ||
    value.includes("build with nature") ||
    value.includes("still matters")
  )
    return "aha";
  if (
    value.includes("not every tree") ||
    value.includes("could not solve") ||
    value.includes("better farming") ||
    value.includes("many belts endured") ||
    value.includes("living infrastructure ages") ||
    value.includes("removed for larger") ||
    value.includes("thinned as trees") ||
    value.includes("renewal") ||
    value.includes("next generation")
  )
    return "legacy";
  if (
    value.includes("220 million") ||
    value.includes("18,600") ||
    value.includes("30,000") ||
    value.includes("by 1942") ||
    value.includes("planting continued") ||
    value.includes("tree mileage") ||
    value.includes("thousands of separate") ||
    value.includes("placement, not")
  )
    return "scale";
  if (
    value.includes("farmers gave") ||
    value.includes("federal crews") ||
    value.includes("landowners") ||
    value.includes("farm families") ||
    value.includes("government could") ||
    value.includes("public works") ||
    value.includes("created work") ||
    value.includes("first project tree") ||
    value.includes("march 18") ||
    value.includes("austrian pine")
  )
    return "people";
  if (
    value.includes("stop wind") ||
    value.includes("lift it") ||
    value.includes("solid wall") ||
    value.includes("partly open") ||
    value.includes("loses speed") ||
    value.includes("slower wind") ||
    value.includes("shelter livestock") ||
    value.includes("habitat") ||
    value.includes("design mattered") ||
    value.includes("mixed heights") ||
    value.includes("species") ||
    value.includes("local conditions")
  )
    return "science";
  if (
    value.includes("roosevelt") ||
    value.includes("prairie states") ||
    value.includes("planned zone") ||
    value.includes("shelterbelt plan") ||
    value.includes("north dakota") ||
    value.includes("south dakota") ||
    value.includes("kansas") ||
    value.includes("continuous green") ||
    value.includes("each farm") ||
    value.includes("regional defence")
  )
    return "plan";
  if (
    value.includes("1930") ||
    value.includes("drought") ||
    value.includes("dust") ||
    value.includes("plough") ||
    value.includes("prairie grass") ||
    value.includes("soil") ||
    value.includes("foundation of farming")
  )
    return "dust";
  return "hook";
};

const copyFor = (kind: SceneKind, text: string): [string, string, string] => {
  if (kind === "cta") return ["GLOBETALES", "THE MAP HIDES STORIES", "NEW JOURNEYS EVERY DAY"];
  if (kind === "aha")
    return ["THE REAL GREAT WALL", "LIVING INFRASTRUCTURE", "SMALL ROWS · CONTINENTAL SCALE"];
  if (kind === "legacy")
    return ["A LIVING SYSTEM", "REPAIR · REPLANT · RENEW", "NATURE-BASED INFRASTRUCTURE AGES"];
  if (kind === "scale") {
    if (text.includes("18,600")) return ["BY 1942", "18,600 MILES", "OF SHELTERBELTS"];
    if (text.includes("30,000")) return ["ACROSS THE PLAINS", "≈30,000 BELTS", "ON THOUSANDS OF FARMS"];
    return ["THE HUGE NUMBER", "220 MILLION TREES", "PLANTED FROM 1935 TO 1942"];
  }
  if (kind === "people")
    return ["A NATIONAL PARTNERSHIP", "FARMERS + FEDERAL CREWS", "LAND · LABOUR · LONG-TERM CARE"];
  if (kind === "science")
    return ["THE WIND SHADOW", "TREES SLOW THE AIR", "POROUS ROWS PROTECT SOIL"];
  if (kind === "plan")
    return ["PRAIRIE STATES FORESTRY PROJECT", "NORTH DAKOTA → TEXAS", "SIX GREAT PLAINS STATES"];
  if (kind === "dust")
    return ["THE DUST BOWL", "THE SOIL TOOK FLIGHT", "DROUGHT + BARE GROUND + WIND"];
  return ["THE USA'S LIVING WALL", "220 MILLION TREES", "NOT ONE FOREST"];
};

const project = (point: Pt, width: number, height: number): Pt => {
  const x = ((point[0] + 125) / 59) * width;
  const y = ((50 - point[1]) / 26) * height;
  return [x, y];
};

const ringPath = (ring: Ring, width: number, height: number) =>
  `${ring
    .map((point, index) => {
      const [x, y] = project(point, width, height);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ")} Z`;

const geometryPath = (geometry: Geometry, width: number, height: number) => {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as Ring[]]
      : (geometry.coordinates as Ring[][]);
  return polygons
    .flatMap((polygon) => polygon.map((ring) => ringPath(ring, width, height)))
    .join(" ");
};

const Counter: React.FC<{
  value: number;
  suffix: string;
  label: string;
  progress: number;
  wide: boolean;
}> = ({ value, suffix, label, progress, wide }) => {
  const displayed = Math.round(value * ease(clamp(progress)));
  return (
    <div
      style={{
        padding: wide ? "18px 28px" : "22px 30px",
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        borderRadius: 26,
        boxShadow: `0 11px 0 ${C.ink}`,
        textAlign: "center",
        transform: `scale(${0.86 + 0.14 * clamp(progress * 2)})`,
      }}
    >
      <div style={{ fontFamily: DISPLAY, color: C.green, fontSize: wide ? 60 : 72, lineHeight: 0.9 }}>
        {displayed.toLocaleString("en-US")}{suffix}
      </div>
      <div style={{ fontFamily: BODY, color: C.ink, fontWeight: 950, fontSize: wide ? 20 : 25 }}>
        {label}
      </div>
    </div>
  );
};

const WindbreakCutaway: React.FC<{ progress: number; wide: boolean; legacy?: boolean }> = ({
  progress,
  wide,
  legacy = false,
}) => {
  const trees = Array.from({ length: 7 }, (_, index) => index);
  const wind = Array.from({ length: 5 }, (_, index) => index);
  const width = wide ? 560 : 940;
  const height = wide ? 270 : 330;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 940 330"
      style={{ filter: "drop-shadow(0 12px 8px rgba(0,0,0,.35))" }}
    >
      <rect x={5} y={5} width={930} height={320} rx={28} fill="#dff2ff" stroke={C.ink} strokeWidth={8} />
      <path d="M8 250 Q220 220 450 250 T932 245 V322 H8Z" fill="#d3a65d" />
      {wind.map((index) => {
        const y = 70 + index * 33;
        const end = legacy ? 850 : 400 + index * 35;
        return (
          <g key={index} opacity={0.35 + 0.65 * clamp(progress)}>
            <path
              d={`M40 ${y} C180 ${y - 12} 280 ${y + 8} ${end} ${y - (index - 2) * 8}`}
              fill="none"
              stroke={index < 2 ? C.dust : C.sky}
              strokeWidth={10 - index}
              strokeLinecap="round"
              strokeDasharray={`${Math.max(1, progress) * 700} 900`}
            />
            <path d={`M${end - 18} ${y - 10} L${end} ${y} L${end - 18} ${y + 10}`} fill="none" stroke={index < 2 ? C.dust : C.sky} strokeWidth={7} />
          </g>
        );
      })}
      {trees.map((index) => {
        const x = 430 + index * 43;
        const healthy = !legacy || index % 3 !== 1;
        const grow = clamp(progress * 1.8 - index * 0.06);
        const treeH = (index % 2 ? 150 : 190) * grow;
        return (
          <g key={index} transform={`translate(${x} ${250})`}>
            <rect x={-8} y={-treeH * 0.55} width={16} height={treeH * 0.58} rx={7} fill="#79512f" />
            {healthy && (
              <>
                <circle cy={-treeH * 0.68} r={treeH * 0.27} fill={index % 2 ? C.green : C.darkGreen} stroke={C.ink} strokeWidth={5} />
                <circle cx={-18} cy={-treeH * 0.5} r={treeH * 0.2} fill={C.green} stroke={C.ink} strokeWidth={4} />
              </>
            )}
          </g>
        );
      })}
      <text x={55} y={305} fontFamily={BODY} fontSize={24} fontWeight={900} fill={C.ink}>
        FAST, DRY WIND
      </text>
      <text x={675} y={305} fontFamily={BODY} fontSize={24} fontWeight={900} fill={C.darkGreen}>
        CALMER AIR
      </text>
    </svg>
  );
};

const Dust: React.FC<{ time: number; width: number; height: number }> = ({ time, width, height }) => (
  <>
    {Array.from({ length: 34 }, (_, index) => {
      const x = ((index * 137 + time * (95 + (index % 5) * 16)) % (width + 220)) - 110;
      const y = height * (0.2 + ((index * 47) % 70) / 100);
      const r = 5 + (index % 5) * 4;
      return (
        <circle
          key={index}
          cx={x}
          cy={y}
          r={r}
          fill={C.dust}
          opacity={0.16 + (index % 4) * 0.07}
        />
      );
    })}
  </>
);

const ShelterbeltMap: React.FC<{
  kind: SceneKind;
  time: number;
  progress: number;
  wide: boolean;
  thumbnail?: boolean;
}> = ({ kind, time, progress, wide, thumbnail = false }) => {
  const mapWidth = wide ? 1220 : 1030;
  const mapHeight = wide ? 790 : 760;
  const draw = ease(clamp(progress * 1.25));
  const corridor = PLAINS.map((abbr) => project(STATE_LABELS[abbr], mapWidth, mapHeight));
  const route = corridor.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const showBelts = ["science", "scale", "legacy", "aha", "cta"].includes(kind) || thumbnail;
  return (
    <svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
      <defs>
        <filter id="greenGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="corridor" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={C.gold} /><stop offset="1" stopColor={C.green} />
        </linearGradient>
      </defs>
      {STATES.map((state) => {
        const plains = PLAINS.includes(state.properties.abbr);
        const faded = kind === "dust";
        return (
          <path
            key={state.properties.abbr}
            d={geometryPath(state.geometry, mapWidth, mapHeight)}
            fill={plains ? (faded ? "#b88b4e" : "#bce4b9") : C.land}
            fillOpacity={plains ? 0.96 : 0.73}
            stroke={plains ? C.darkGreen : C.ink}
            strokeWidth={plains ? 4 : 2}
            strokeLinejoin="round"
          />
        );
      })}
      {(kind === "plan" || kind === "hook" || thumbnail) && (
        <>
          <path d={route} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth={34} strokeLinecap="round" strokeDasharray={`${draw * 1800} 1900`} />
          <path d={route} fill="none" stroke="url(#corridor)" strokeWidth={21} strokeLinecap="round" strokeDasharray={`${draw * 1800} 1900`} filter="url(#greenGlow)" />
        </>
      )}
      {showBelts && Array.from({ length: 42 }, (_, index) => {
        const row = index % 14;
        const col = Math.floor(index / 14);
        const lon = -103 + col * 2.15 + (row % 2) * 0.35;
        const lat = 29.3 + row * 1.35;
        const [x, y] = project([lon, lat], mapWidth, mapHeight);
        const length = 35 + (index % 4) * 11;
        const local = clamp(draw * 1.8 - index * 0.018);
        return (
          <line
            key={index}
            x1={x - length / 2}
            y1={y}
            x2={x - length / 2 + length * local}
            y2={y - 3}
            stroke={index % 3 ? C.green : C.darkGreen}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={0.35 + 0.65 * local}
          />
        );
      })}
      {PLAINS.map((abbr, index) => {
        const [x, y] = project(STATE_LABELS[abbr], mapWidth, mapHeight);
        const pop = clamp(progress * 2 - index * 0.08);
        return (
          <g key={abbr} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * pop})`} opacity={0.35 + 0.65 * pop}>
            <circle r={wide ? 22 : 19} fill={C.ink} stroke={C.white} strokeWidth={4} />
            <text textAnchor="middle" y={7} fontFamily={BODY} fontSize={wide ? 18 : 16} fontWeight={1000} fill={C.white}>{abbr}</text>
          </g>
        );
      })}
      {kind === "people" && (() => {
        const [x, y] = project([-99.5, 34.9], mapWidth, mapHeight);
        const bounce = spring({ frame: Math.max(0, Math.round(progress * 30)), fps: 30, config: { damping: 9, mass: 0.6 } });
        return (
          <g transform={`translate(${x} ${y - (1 - bounce) * 180})`}>
            <path d="M0 0 C-34-35-30-82 0-82 C30-82 34-35 0 0Z" fill={C.red} stroke={C.white} strokeWidth={6} />
            <circle cy={-51} r={15} fill={C.gold} />
            <text x={22} y={-38} fontFamily={BODY} fontWeight={1000} fontSize={22} fill={C.white} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}>MANGUM · 1935</text>
          </g>
        );
      })()}
      {kind === "dust" && <Dust time={time} width={mapWidth} height={mapHeight} />}
    </svg>
  );
};

const GreatPlainsScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const wide = width > height;
  const time = thumbnail ? 2.4 : frame / fps;
  const sectionIndex = activeSection(timing.sections, time);
  const section = timing.sections[sectionIndex] ?? timing.sections[0];
  const kind = thumbnail ? "scale" : kindOf(section.text);
  const progress = thumbnail ? 1 : clamp((time - section.start) / 1.4);
  const reveal = ease(clamp(progress));
  const [kicker, title, sub] = thumbnail
    ? ["AMERICA'S SECRET MEGAPROJECT", "220 MILLION TREES!", "THE GREAT PLAINS SHELTERBELT"]
    : copyFor(kind, section.text);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle)
    )?.start ?? ctaTime;

  const mapLeft = wide ? 650 : 25;
  const mapTop = wide ? 145 : 650;
  const titleLeft = wide ? 55 : 42;
  const titleTop = wide ? 55 : thumbnail ? 300 : 245;
  const titleWidth = wide ? 680 : 996;
  const science = kind === "science" || kind === "legacy";
  const counter =
    kind === "scale" || kind === "aha" || thumbnail
      ? section.text.includes("18,600")
        ? { value: 18600, suffix: "", label: "MILES OF SHELTERBELTS" }
        : section.text.includes("30,000")
          ? { value: 30000, suffix: "", label: "SEPARATE SHELTERBELTS" }
          : { value: 220, suffix: "M", label: "TREES PLANTED" }
      : null;

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 68% 45%, ${C.ocean}, ${C.night} 72%)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.45, backgroundImage: "linear-gradient(rgba(130,205,240,.1) 2px,transparent 2px),linear-gradient(90deg,rgba(130,205,240,.1) 2px,transparent 2px)", backgroundSize: "72px 72px" }} />

      <div
        style={{
          position: "absolute",
          left: mapLeft,
          top: mapTop,
          transform: `scale(${1 + Math.sin(time * 0.35) * 0.012 + reveal * 0.018})`,
          transformOrigin: "50% 50%",
          filter: "drop-shadow(0 18px 18px rgba(0,0,0,.42))",
        }}
      >
        <ShelterbeltMap kind={kind} time={time} progress={progress} wide={wide} thumbnail={thumbnail} />
      </div>

      <div
        style={{
          position: "absolute",
          left: titleLeft,
          top: titleTop,
          width: titleWidth,
          padding: wide ? "26px 34px 22px" : "30px 34px 25px",
          background: "rgba(255,255,255,.96)",
          border: `6px solid ${C.ink}`,
          borderRadius: 28,
          boxShadow: `0 13px 0 ${C.ink}`,
          transform: thumbnail ? "none" : `translateY(${(1 - reveal) * -55}px)`,
          opacity: thumbnail ? 1 : clamp(reveal * 1.8),
        }}
      >
        <div style={{ fontFamily: BODY, color: kind === "dust" ? C.dust : C.green, fontSize: wide ? 20 : 27, fontWeight: 1000, letterSpacing: 2 }}>
          {kicker}
        </div>
        <div style={{ fontFamily: DISPLAY, color: C.ink, fontSize: thumbnail ? (wide ? 90 : 94) : wide ? 66 : 78, lineHeight: 0.92 }}>
          {title}
        </div>
        <div style={{ fontFamily: BODY, color: "#4c5b6f", fontSize: wide ? 24 : 31, fontWeight: 900, marginTop: 8 }}>
          {sub}
        </div>
      </div>

      {science && (
        <div style={{ position: "absolute", right: wide ? 65 : 70, bottom: wide ? 45 : 280 }}>
          <WindbreakCutaway progress={progress} wide={wide} legacy={kind === "legacy"} />
        </div>
      )}
      {counter && (
        <div style={{ position: "absolute", left: wide ? 85 : 90, bottom: wide ? 90 : thumbnail ? 330 : 300 }}>
          <Counter {...counter} progress={thumbnail ? 1 : progress} wide={wide} />
        </div>
      )}
      {kind === "people" && (
        <div style={{ position: "absolute", left: wide ? 80 : 65, bottom: wide ? 75 : 285, display: "flex", gap: 16 }}>
          {["FARMERS", "FORESTERS", "WORK CREWS"].map((label, index) => (
            <div key={label} style={{ padding: "13px 18px", background: index === 0 ? C.gold : C.green, border: `4px solid ${C.ink}`, borderRadius: 18, boxShadow: `0 7px 0 ${C.ink}`, color: C.ink, fontFamily: BODY, fontWeight: 1000, fontSize: wide ? 18 : 22 }}>
              {label}
            </div>
          ))}
        </div>
      )}
      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={wide ? 300 : 1460} />}
      {!thumbnail && time >= ctaTime && (
        <CtaCard
          T={time}
          likeT={wordAt("like")}
          shareT={wordAt("share")}
          subT={wordAt("subscribe")}
          top={wide ? 540 : 1120}
        />
      )}
      {thumbnail && (
        <div style={{ position: "absolute", right: wide ? 70 : 60, bottom: wide ? 55 : 330, padding: "14px 26px", background: C.gold, border: `5px solid ${C.ink}`, borderRadius: 22, boxShadow: `0 9px 0 ${C.ink}`, fontFamily: DISPLAY, fontSize: wide ? 45 : 52, color: C.ink }}>
          NORTH DAKOTA → TEXAS
        </div>
      )}
    </AbsoluteFill>
  );
};

export const GreatPlainsShelterbeltVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) =>
    section.text.toLowerCase().includes("please like")
  )?.start ?? timing.durationSec;
  const firstKind = (kind: SceneKind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.14],
    [0.9, "boom", 0.2],
    [firstKind("dust"), "whoosh", 0.14],
    [firstKind("plan"), "ding", 0.15],
    [firstKind("science"), "whoosh", 0.14],
    [firstKind("scale"), "boom", 0.17],
    [firstKind("aha"), "riser", 0.14],
  ];
  const sfx = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cues.map(([time, name, volume]) => sfx(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sfx(time + 1.1, "ding", 0.12))}
      <GreatPlainsScene timing={timing} />
      <CoverTitle
        lines={["220 MILLION", "TREES!"]}
        sub="USA'S LIVING WALL"
        accent={C.gold}
      />
    </AbsoluteFill>
  );
};

export const GreatPlainsShelterbeltThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <GreatPlainsScene timing={timing} thumbnail />
);
