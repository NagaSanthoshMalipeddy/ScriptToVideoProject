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
import { geomPath } from "../ukraine/GeoMap";
import statesJson from "./us-states.json";

type Pt = [number, number];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
type StateFeature = {
  properties: { name: string; abbr: string };
  geometry: Geometry;
};
type SceneKind =
  | "hook"
  | "setup"
  | "dust"
  | "plan"
  | "science"
  | "people"
  | "scale"
  | "aha"
  | "bridge"
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
const MANGUM: Pt = [-99.504, 34.873];

const C = {
  ink: "#13243a",
  green: "#42c774",
  darkGreen: "#0b6638",
  dust: "#d69b4b",
  gold: "#ffd23f",
  red: "#ef4444",
  cyan: "#58d6ff",
  white: "#ffffff",
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
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
  if (value.includes("more hidden map stories")) return "bridge";
  if (
    value.includes("changed wind") ||
    value.includes("with stone") ||
    value.includes("giant shield")
  )
    return "aha";
  if (
    value.includes("18,600") ||
    value.includes("30,000") ||
    value.includes("separate living fences")
  )
    return "scale";
  if (
    value.includes("farmers gave") ||
    value.includes("federal crews") ||
    value.includes("first project tree")
  )
    return "people";
  if (value.includes("stop wind") || value.includes("lift it")) return "science";
  if (
    value.includes("roosevelt") ||
    value.includes("long rows") ||
    value.includes("north dakota")
  )
    return "plan";
  if (value.includes("1930s") || value.includes("dust storms")) return "dust";
  if (value.includes("not one solid forest")) return "setup";
  return "hook";
};

const VIEWS: Record<SceneKind, SatView> = {
  hook: { lon: -99.2, lat: 39.2, span: 62 },
  setup: { lon: -99.2, lat: 38.8, span: 68 },
  dust: { lon: -100.5, lat: 38.4, span: 53 },
  plan: { lon: -99.7, lat: 39.5, span: 45 },
  science: { lon: -99.2, lat: 38.2, span: 38 },
  people: { lon: -99.3, lat: 36.5, span: 38 },
  scale: { lon: -99.5, lat: 39.0, span: 48 },
  aha: { lon: -99.5, lat: 39.0, span: 60 },
  bridge: { lon: -99.5, lat: 39.0, span: 76 },
  cta: { lon: -99.5, lat: 39.0, span: 80 },
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const index = activeSection(sections, time);
  const section = sections[index] ?? sections[0];
  const from = VIEWS[kindOf(sections[Math.max(0, index - 1)]?.text ?? "")];
  const to = VIEWS[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.25));
  const bump = Math.max(from.span, to.span) * (1 + 0.1 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span,
  };
};

const COPY: Record<SceneKind, [string, string, string]> = {
  hook: ["AMERICA'S LIVING WALL", "220 MILLION TREES", "A CONTINENT-SCALE SHIELD"],
  setup: ["NOT ONE FOREST", "THOUSANDS OF ROWS", "A WALL MADE OF WINDBREAKS"],
  dust: ["THE DUST BOWL", "SOIL TOOK FLIGHT", "DROUGHT · BARE LAND · WIND"],
  plan: ["PRAIRIE STATES FORESTRY PROJECT", "NORTH DAKOTA → TEXAS", "THE 1934 PLAN"],
  science: ["THE WIND SHADOW", "TREES SLOW THE AIR", "LIFT · BREAK · PROTECT"],
  people: ["A HUGE PARTNERSHIP", "FARMS + FEDERAL CREWS", "MANGUM, OKLAHOMA · 1935"],
  scale: ["BY 1942", "18,600 MILES", "ABOUT 30,000 SHELTERBELTS"],
  aha: ["THE REAL GREAT WALL", "LIVING INFRASTRUCTURE", "A GIANT SHIELD THAT GREW"],
  bridge: ["GLOBETALES", "THE MAP HIDES STORIES", "A NEW ONE EVERY DAY"],
  cta: ["GLOBETALES", "LIKE · SHARE · SUBSCRIBE", "MORE HIDDEN MAP STORIES"],
};

const Header: React.FC<{
  kind: SceneKind;
  sectionText: string;
  progress: number;
}> = ({ kind, sectionText, progress }) => {
  let [kicker, title, detail] = COPY[kind];
  if (kind === "scale" && sectionText.includes("220 million")) {
    title = "220 MILLION TREES";
    detail = "IN ROUGHLY 30,000 SHELTERBELTS";
  } else if (kind === "scale" && sectionText.includes("separate living")) {
    title = "THOUSANDS OF FENCES";
    detail = "NOT ONE SOLID FOREST";
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        right: 42,
        top: 306,
        padding: "29px 34px 24px",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        background: "rgba(255,255,255,.95)",
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - progress) * -80}px)`,
        opacity: clamp(progress * 1.6),
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          color: kind === "dust" ? "#a55a18" : C.darkGreen,
          fontWeight: 1000,
          fontSize: 27,
          letterSpacing: 2.5,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          color: C.ink,
          fontSize: title.length > 22 ? 67 : 82,
          lineHeight: 0.93,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 9,
          fontFamily: BODY,
          color: "#46566b",
          fontSize: 31,
          fontWeight: 900,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const Counter: React.FC<{
  value: number;
  label: string;
  progress: number;
  suffix?: string;
}> = ({ value, label, progress, suffix = "" }) => (
  <div
    style={{
      position: "absolute",
      left: 70,
      bottom: 285,
      minWidth: 395,
      padding: "22px 30px",
      background: "rgba(255,255,255,.96)",
      border: `6px solid ${C.ink}`,
      borderRadius: 26,
      boxShadow: `0 11px 0 ${C.ink}`,
      textAlign: "center",
      transform: `scale(${0.84 + 0.16 * clamp(progress * 2)})`,
    }}
  >
    <div
      style={{
        fontFamily: DISPLAY,
        color: C.green,
        fontSize: 72,
        lineHeight: 0.9,
      }}
    >
      {Math.round(value * ease(clamp(progress))).toLocaleString("en-US")}
      {suffix}
    </div>
    <div style={{ fontFamily: BODY, color: C.ink, fontWeight: 950, fontSize: 25 }}>
      {label}
    </div>
  </div>
);

const WindbreakCutaway: React.FC<{ progress: number }> = ({ progress }) => (
  <svg
    width={940}
    height={330}
    viewBox="0 0 940 330"
    style={{
      position: "absolute",
      left: 70,
      bottom: 280,
      filter: "drop-shadow(0 12px 8px rgba(0,0,0,.42))",
    }}
  >
    <rect x={5} y={5} width={930} height={320} rx={28} fill="#dff2ff" stroke={C.ink} strokeWidth={8} />
    <path d="M8 250 Q220 220 450 250 T932 245 V322 H8Z" fill="#d3a65d" />
    {Array.from({ length: 5 }, (_, index) => {
      const y = 64 + index * 36;
      const end = 405 + index * 43;
      return (
        <g key={index} opacity={0.35 + 0.65 * clamp(progress)}>
          <path
            d={`M38 ${y} C175 ${y - 12} 280 ${y + 8} ${end} ${y - (index - 2) * 9}`}
            fill="none"
            stroke={index < 2 ? C.dust : C.cyan}
            strokeWidth={11 - index}
            strokeLinecap="round"
            strokeDasharray={`${Math.max(1, progress) * 710} 900`}
          />
          <path d={`M${end - 18} ${y - 10} L${end} ${y} L${end - 18} ${y + 10}`} fill="none" stroke={index < 2 ? C.dust : C.cyan} strokeWidth={7} />
        </g>
      );
    })}
    {Array.from({ length: 7 }, (_, index) => {
      const x = 430 + index * 43;
      const grow = clamp(progress * 1.8 - index * 0.06);
      const treeHeight = (index % 2 ? 150 : 190) * grow;
      return (
        <g key={index} transform={`translate(${x} 250)`}>
          <rect x={-8} y={-treeHeight * 0.55} width={16} height={treeHeight * 0.58} rx={7} fill="#79512f" />
          <circle cy={-treeHeight * 0.68} r={treeHeight * 0.27} fill={index % 2 ? C.green : C.darkGreen} stroke={C.ink} strokeWidth={5} />
          <circle cx={-18} cy={-treeHeight * 0.5} r={treeHeight * 0.2} fill={C.green} stroke={C.ink} strokeWidth={4} />
        </g>
      );
    })}
    <text x={50} y={305} fontFamily={BODY} fontSize={24} fontWeight={900} fill={C.ink}>FAST, DRY WIND</text>
    <text x={670} y={305} fontFamily={BODY} fontSize={24} fontWeight={900} fill={C.darkGreen}>CALMER AIR</text>
  </svg>
);

const missingCues = (sections: Section[]) => {
  const expected = [
    "220 million trees",
    "not one solid forest",
    "1930s",
    "dust storms",
    "franklin roosevelt",
    "long rows",
    "north dakota to texas",
    "stop wind",
    "lift it",
    "farmers gave",
    "federal crews",
    "oklahoma soil",
    "18,600 miles",
    "30,000 shelterbelts",
    "separate living fences",
    "changed wind",
    "with stone",
    "giant shield",
    "hidden map stories",
    "please like",
  ];
  return expected.filter(
    (needle) => !sections.some((section) => section.text.toLowerCase().includes(needle))
  );
};

const GreatPlainsShelterbeltSceneSat: React.FC<{
  timing: Timing;
  thumbnail?: boolean;
}> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 0 : frame / fps;
  const index = activeSection(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind: SceneKind = thumbnail ? "hook" : kindOf(section.text);
  const progress = thumbnail
    ? 1
    : spring({
        frame: Math.max(0, frame - Math.round(section.start * fps)),
        fps,
        config: { damping: 12, mass: 0.7 },
      });
  const cam = thumbnail
    ? { lon: -99.2, lat: 39.2, span: 59 }
    : cameraAt(timing.sections, time);
  const anchorY = 0.58;
  const { project } = makeSatProjector(cam, width, height, anchorY);
  const cta = timing.sections.find((item) =>
    item.text.toLowerCase().includes("please like")
  );
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle)
    )?.start ?? ctaTime;
  const showRoute = ["hook", "setup", "plan"].includes(kind) || thumbnail;
  const showBelts = ["scale", "aha", "bridge", "cta"].includes(kind) || thumbnail;
  const showDust = kind === "dust";
  const draw = ease(clamp(progress));
  const corridor = PLAINS.map((abbr) => project(...STATE_LABELS[abbr]));
  const route = corridor.map(([x, y], routeIndex) => `${routeIndex ? "L" : "M"}${x},${y}`).join(" ");
  const counter =
    kind === "hook"
      ? { value: 220, suffix: "M", label: "TREES PLANTED" }
      : kind === "scale" && section.text.includes("18,600")
        ? { value: 18600, suffix: "", label: "MILES OF SHELTERBELTS" }
        : kind === "scale" && section.text.includes("220 million")
          ? { value: 220, suffix: "M", label: "TREES · ABOUT 30,000 BELTS" }
          : kind === "aha" && section.text.includes("giant shield")
            ? { value: 220, suffix: "M", label: "TREES IN THE LIVING SHIELD" }
            : null;

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={cam}
        width={width}
        height={height}
        anchorY={anchorY}
        darken={thumbnail ? 0.24 : kind === "dust" ? 0.3 : kind === "cta" ? 0.4 : 0.14}
        highlights={[
          {
            geom: countryGeom("USA"),
            label: "United States",
            labelAt: [-100, 49.2],
            fill: "rgba(255,190,20,.23)",
            labelSize: 27,
          },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="beltGlowSat">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {STATES.map((state) => {
            const isPlain = PLAINS.includes(state.properties.abbr);
            return (
              <path
                key={state.properties.abbr}
                d={geomPath(state.geometry as never, project)}
                fill={
                  isPlain
                    ? showDust
                      ? "rgba(196,126,49,.43)"
                      : "rgba(45,198,104,.30)"
                    : "rgba(4,16,29,.04)"
                }
                stroke={isPlain ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.38)"}
                strokeWidth={isPlain ? 3.4 : 1.35}
                strokeLinejoin="round"
              />
            );
          })}
          {showRoute && (
            <>
              <path d={route} fill="none" stroke="rgba(19,36,58,.82)" strokeWidth={33} strokeLinecap="round" strokeDasharray={`${draw * 1900} 2000`} />
              <path d={route} fill="none" stroke={C.green} strokeWidth={18} strokeLinecap="round" strokeDasharray={`${draw * 1900} 2000`} filter="url(#beltGlowSat)" />
            </>
          )}
          {showBelts &&
            Array.from({ length: 50 }, (_, beltIndex) => {
              const row = beltIndex % 17;
              const col = Math.floor(beltIndex / 17);
              const lon = -103 + col * 2.15 + (row % 2) * 0.32;
              const lat = 27.8 + row * 1.28;
              const [x, y] = project(lon, lat);
              const length = 32 + (beltIndex % 5) * 10;
              const local = clamp(draw * 1.9 - beltIndex * 0.016);
              return (
                <line
                  key={beltIndex}
                  x1={x - length / 2}
                  y1={y}
                  x2={x - length / 2 + length * local}
                  y2={y - 3}
                  stroke={beltIndex % 3 ? C.green : C.gold}
                  strokeWidth={8}
                  strokeLinecap="round"
                  opacity={0.3 + 0.7 * local}
                  filter="url(#beltGlowSat)"
                />
              );
            })}
          {PLAINS.map((abbr, stateIndex) => {
            const [x, y] = project(...STATE_LABELS[abbr]);
            const pop = clamp(draw * 2 - stateIndex * 0.08);
            return (
              <g key={abbr} transform={`translate(${x} ${y}) scale(${0.7 + 0.3 * pop})`} opacity={0.45 + 0.55 * pop}>
                <circle r={20} fill={C.ink} stroke={C.white} strokeWidth={4} />
                <text textAnchor="middle" y={7} fontFamily={BODY} fontSize={17} fontWeight={1000} fill={C.white}>{abbr}</text>
              </g>
            );
          })}
          {kind === "people" && (() => {
            const [x, y] = project(...MANGUM);
            const bounce = spring({
              frame: Math.max(0, Math.round((time - section.start) * fps)),
              fps,
              config: { damping: 9, mass: 0.6 },
            });
            return (
              <g transform={`translate(${x} ${y - (1 - bounce) * 220})`}>
                <path d="M0 0 C-36-38-32-88 0-88 C32-88 36-38 0 0Z" fill={C.red} stroke={C.white} strokeWidth={6} />
                <circle cy={-54} r={16} fill={C.gold} />
                <text x={24} y={-40} fontFamily={BODY} fontWeight={1000} fontSize={25} fill={C.white} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>MANGUM · 1935</text>
              </g>
            );
          })()}
          {showDust &&
            Array.from({ length: 42 }, (_, dustIndex) => {
              const x = ((dustIndex * 139 + time * (110 + (dustIndex % 5) * 17)) % (width + 240)) - 120;
              const y = height * (0.3 + ((dustIndex * 43) % 50) / 100);
              return <circle key={dustIndex} cx={x} cy={y} r={6 + (dustIndex % 5) * 4} fill={C.dust} opacity={0.18 + (dustIndex % 4) * 0.07} />;
            })}
        </svg>

        {!thumbnail && <Header kind={kind} sectionText={section.text} progress={progress} />}
        {!thumbnail && kind === "science" && <WindbreakCutaway progress={progress} />}
        {!thumbnail && counter && <Counter {...counter} progress={progress} />}
        {!thumbnail && kind === "people" && (
          <div style={{ position: "absolute", left: 65, bottom: 285, display: "flex", gap: 14 }}>
            {["FARMERS", "FORESTERS", "WORK CREWS"].map((label, badgeIndex) => (
              <div key={label} style={{ padding: "13px 17px", background: badgeIndex === 0 ? C.gold : C.green, border: `4px solid ${C.ink}`, borderRadius: 18, boxShadow: `0 7px 0 ${C.ink}`, color: C.ink, fontFamily: BODY, fontWeight: 1000, fontSize: 22 }}>
                {label}
              </div>
            ))}
          </div>
        )}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1460} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1120} />
        )}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, padding: 30, background: C.red, color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 38, textAlign: "center" }}>
            MISSING CUES: {missingCues(timing.sections).join(", ")}
          </div>
        )}

        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,10,19,.9),rgba(3,10,19,.05) 56%,rgba(3,10,19,.8))" }} />
            <div style={{ position: "absolute", left: 42, right: 42, top: 320, fontFamily: DISPLAY, fontSize: 117, lineHeight: 0.88, textAlign: "center", color: C.white, WebkitTextStroke: `9px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 12px 0 ${C.ink}` }}>
              USA PLANTED A<br /><span style={{ color: C.gold }}>&quot;GREAT WALL&quot;</span>
            </div>
            <div style={{ position: "absolute", left: 90, right: 90, top: 1260, padding: "17px 20px 13px", borderRadius: 24, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, background: C.green, color: C.ink, textAlign: "center", fontFamily: DISPLAY, fontSize: 58 }}>
              220 MILLION TREES!
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const GreatPlainsShelterbeltVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) =>
    section.text.toLowerCase().includes("please like")
  )?.start ?? timing.durationSec;
  const firstKind = (kind: SceneKind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.14],
    [0.9, "boom", 0.2],
    [firstKind("dust"), "whoosh", 0.14],
    [firstKind("plan"), "ding", 0.15],
    [firstKind("science"), "whoosh", 0.14],
    [firstKind("people"), "pop", 0.16],
    [firstKind("scale"), "boom", 0.17],
    [firstKind("aha"), "riser", 0.14],
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
      {cues.map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.13))}
      <GreatPlainsShelterbeltSceneSat timing={timing} />
    </AbsoluteFill>
  );
};

export const GreatPlainsShelterbeltThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <GreatPlainsShelterbeltSceneSat timing={timing} thumbnail />
);
