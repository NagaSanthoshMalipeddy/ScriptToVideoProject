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
import { BackgroundBeat } from "../cartoon/WithCover";
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
  | "shape"
  | "missouri"
  | "texas"
  | "gap"
  | "public"
  | "settlers"
  | "territory"
  | "statehood"
  | "modern"
  | "aha"
  | "bridge"
  | "cta";

const STATES = (statesJson as unknown as { features: StateFeature[] }).features.filter(
  (state) => ["OK", "TX", "KS", "CO", "NM"].includes(state.properties.abbr)
);
const PANHANDLE: Geometry = {
  type: "Polygon",
  coordinates: [[
    [-103.0025, 36.5004],
    [-100.0004, 36.4997],
    [-100.0000, 37.0000],
    [-103.0020, 37.0000],
    [-103.0025, 36.5004],
  ]],
};
const TEXAS_CLAIM: Geometry = {
  type: "Polygon",
  coordinates: [[
    [-103.0025, 36.5004],
    [-100.0004, 36.4997],
    [-100.0000, 42.0],
    [-106.0, 42.0],
    [-106.0, 36.5004],
    [-103.0025, 36.5004],
  ]],
};
const PLACES: { name: string; point: Pt }[] = [
  { name: "BEAVER", point: [-100.5199, 36.8161] },
  { name: "GUYMON", point: [-101.4815, 36.6828] },
  { name: "BOISE CITY", point: [-102.5132, 36.7295] },
];
const BLACK_MESA: Pt = [-102.9972, 36.9317];

const C = {
  ink: "#071523",
  gold: "#ffd23f",
  red: "#ff5b5b",
  green: "#2ecf8f",
  cyan: "#63dcff",
  blue: "#4da3ff",
  white: "#ffffff",
  muted: "#a9bfd0",
};
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const includesAny = (text: string, values: string[]) =>
  values.some((value) => text.includes(value));

const kindOf = (raw: string): SceneKind => {
  const text = raw.toLowerCase();
  if (text.includes("please like")) return "cta";
  if (includesAny(text, ["globetales", "maps remember", "every strange border"]))
    return "bridge";
  if (
    includesAny(text, [
      "complete answer",
      "that is the answer",
      "political fossil",
      "put those lines together",
      "then add the two",
      "unassigned rectangle survived",
      "spent 40 years",
    ])
  )
    return "aha";
  if (
    includesAny(text, [
      "highest point",
      "boise city",
      "four neighboring",
      "land also changes",
      "ranching",
      "most important feature",
      "northern border follows",
    ])
  )
    return "modern";
  if (
    includesAny(text, [
      "november 16",
      "old giant beaver",
      "part of oklahoma state",
      "1907",
    ])
  )
    return "statehood";
  if (
    includesAny(text, [
      "may 2, 1890",
      "whole panhandle became",
      "congress attached",
      "oklahoma territory",
      "1889",
    ])
  )
    return "territory";
  if (
    includesAny(text, [
      "indigenous peoples",
      "cattle ranchers",
      "newspapers popularized",
      "cimarron territory",
      "congress never made",
      "claims, records",
      "settlers arrived",
    ])
  )
    return "settlers";
  if (
    includesAny(text, [
      "public land strip",
      "did not attach",
      "unassigned",
      "no state or territory",
    ])
  )
    return "public";
  if (
    includesAny(text, [
      "half-degree",
      "one half-degree",
      "100 degrees west",
      "new mexico territory",
      "kansas began",
      "34 miles",
    ])
  )
    return "gap";
  if (
    includesAny(text, [
      "texas had become",
      "1845",
      "texas entered",
      "part of the texas",
      "compromise of 1850",
      "10 million",
      "surrendered",
    ])
  )
    return "texas";
  if (
    includesAny(text, [
      "1820",
      "missouri compromise",
      "36 degrees 30",
      "slavery could expand",
      "invisible line",
    ])
  )
    return "missouri";
  if (
    includesAny(text, [
      "166 miles",
      "three counties",
      "touches colorado",
      "corridor",
      "leftover from",
    ])
  )
    return "shape";
  return "hook";
};

const VIEWS: Record<SceneKind, SatView> = {
  hook: { lon: -99.6, lat: 36.1, span: 20 },
  shape: { lon: -100.3, lat: 36.45, span: 12 },
  missouri: { lon: -101.4, lat: 36.65, span: 13 },
  texas: { lon: -102.8, lat: 36.7, span: 30 },
  gap: { lon: -101.5, lat: 36.75, span: 7.2 },
  public: { lon: -101.5, lat: 36.75, span: 6.5 },
  settlers: { lon: -101.6, lat: 36.75, span: 7.5 },
  territory: { lon: -100.2, lat: 36.2, span: 16 },
  statehood: { lon: -99.3, lat: 36.0, span: 18 },
  modern: { lon: -101.7, lat: 36.75, span: 7.8 },
  aha: { lon: -101.5, lat: 36.75, span: 6.8 },
  bridge: { lon: -100.2, lat: 37.0, span: 42 },
  cta: { lon: -99.0, lat: 38.0, span: 58 },
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
  const bump = wide * (1 + 0.15 * Math.sin(Math.PI * progress));
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span:
      progress < 0.5
        ? from.span * Math.pow(bump / from.span, progress * 2)
        : bump * Math.pow(to.span / bump, (progress - 0.5) * 2),
  };
};

const copyFor = (kind: SceneKind, text: string): [string, string, string] => {
  if (kind === "hook") return ["WHY THE WEIRD HANDLE?", "Oklahoma's map mystery", C.gold];
  if (kind === "shape") return ["166 MILES × 34 MILES", "Three counties · Four neighbors", C.cyan];
  if (kind === "missouri") return ["36°30′ NORTH", "The 1820 slavery boundary", C.red];
  if (kind === "texas")
    return [text.includes("10 million") ? "$10 MILLION" : "TEXAS GIVES IT UP", "The Compromise of 1850", C.red];
  if (kind === "gap") return ["A HALF-DEGREE GAP", "36°30′ → 37°N", C.gold];
  if (kind === "public") return ["PUBLIC LAND STRIP", "Assigned to no state or territory", C.gold];
  if (kind === "settlers") return ["“NO MAN'S LAND”", "Settled, but without normal local government", C.cyan];
  if (kind === "territory") return ["1890", "Attached to Oklahoma Territory", C.green];
  if (kind === "statehood") return ["1907", "Oklahoma inherits the handle", C.green];
  if (kind === "modern") return ["THE MODERN PANHANDLE", "Cimarron · Texas · Beaver", C.cyan];
  if (kind === "aha") return ["FOUR LINES MADE IT", "A political fossil on today's map", C.gold];
  if (kind === "bridge") return ["BORDERS REMEMBER", "GlobeTales", C.cyan];
  return ["GLOBETALES", "LIKE · SHARE · SUBSCRIBE", C.gold];
};

const Marker: React.FC<{
  point: Pt;
  project: (lon: number, lat: number) => Pt;
  label: string;
  color: string;
  reveal: number;
}> = ({ point, project, label, color, reveal }) => {
  const [x, y] = project(...point);
  return (
    <g transform={`translate(0 ${(1 - reveal) * -150})`} opacity={clamp(reveal * 1.5)}>
      <path
        d={`M${x} ${y}c-30-38-28-80 0-80s30 42 0 80Z`}
        fill={C.ink}
        stroke={C.white}
        strokeWidth={5}
      />
      <circle cx={x} cy={y - 50} r={12} fill={color} />
      <text
        x={x}
        y={y + 30}
        textAnchor="middle"
        fill={C.white}
        fontFamily={BODY}
        fontWeight={900}
        fontSize={20}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}
      >
        {label}
      </text>
    </g>
  );
};

const Header: React.FC<{
  kind: SceneKind;
  text: string;
  progress: number;
  landscape: boolean;
}> = ({ kind, text, progress, landscape }) => {
  const [title, detail, accent] = copyFor(kind, text);
  return (
    <div
      style={{
        position: "absolute",
        left: landscape ? 70 : 42,
        width: landscape ? 790 : "auto",
        right: landscape ? undefined : 42,
        top: landscape ? 70 : 306,
        padding: landscape ? "25px 34px 20px" : "29px 34px 24px",
        border: `6px solid ${C.ink}`,
        borderRadius: 28,
        background: "rgba(255,255,255,.95)",
        boxShadow: `0 13px 0 ${C.ink}`,
        transform: `translateY(${(1 - progress) * -70}px)`,
        opacity: clamp(progress * 1.6),
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          color: accent,
          fontWeight: 1000,
          fontSize: landscape ? 24 : 26,
          letterSpacing: 2.5,
        }}
      >
        OKLAHOMA PANHANDLE
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          color: C.ink,
          fontSize: landscape ? (title.length > 22 ? 62 : 74) : title.length > 22 ? 62 : 76,
          lineHeight: 0.92,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 8, fontFamily: BODY, color: "#46566b", fontSize: landscape ? 25 : 29, fontWeight: 900 }}>
        {detail}
      </div>
    </div>
  );
};

const BoundaryBadge: React.FC<{ landscape: boolean; progress: number }> = ({ landscape, progress }) => (
  <div
    style={{
      position: "absolute",
      right: landscape ? 65 : 55,
      bottom: landscape ? 55 : 265,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      transform: `scale(${0.82 + progress * 0.18})`,
    }}
  >
    {[
      ["37°N", "NORTH"],
      ["103°W", "WEST"],
      ["36°30′", "SOUTH"],
      ["100°W", "EAST"],
    ].map(([big, small], index) => (
      <div
        key={big}
        style={{
          width: landscape ? 145 : 180,
          padding: "12px 15px",
          borderRadius: 16,
          border: `4px solid ${C.ink}`,
          background: index % 2 ? C.cyan : C.gold,
          color: C.ink,
          textAlign: "center",
          boxShadow: `0 6px 0 ${C.ink}`,
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 35 : 41, lineHeight: 0.9 }}>{big}</div>
        <div style={{ fontFamily: BODY, fontWeight: 950, fontSize: 16 }}>{small}</div>
      </div>
    ))}
  </div>
);

const Timeline: React.FC<{ time: number; landscape: boolean }> = ({ time, landscape }) => {
  const years = [1820, 1845, 1850, 1890, 1907];
  const active = time < 20 ? 1820 : time < 35 ? 1845 : time < 60 ? 1850 : time < 90 ? 1890 : 1907;
  return (
    <div style={{ position: "absolute", left: landscape ? 80 : 60, right: landscape ? 80 : 60, bottom: landscape ? 45 : 250, display: "flex", alignItems: "center" }}>
      {years.map((year, index) => (
        <React.Fragment key={year}>
          <div style={{ width: landscape ? 72 : 82, height: landscape ? 72 : 82, borderRadius: "50%", border: `5px solid ${C.ink}`, background: year <= active ? C.gold : "rgba(255,255,255,.9)", color: C.ink, fontFamily: DISPLAY, fontSize: landscape ? 27 : 30, display: "grid", placeItems: "center", boxShadow: `0 7px 0 ${C.ink}` }}>
            {year}
          </div>
          {index < years.length - 1 && <div style={{ flex: 1, height: 9, background: year < active ? C.gold : "rgba(255,255,255,.75)", borderTop: `3px solid ${C.ink}`, borderBottom: `3px solid ${C.ink}` }} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const OklahomaScene: React.FC<{
  timing: Timing;
  thumbnail?: boolean;
}> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const landscape = width > height;
  const time = thumbnail ? 0 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section.text);
  const sectionFrame = Math.max(0, frame - Math.round(section.start * fps));
  const progress = thumbnail ? 1 : spring({ frame: sectionFrame, fps, config: { damping: 12, mass: 0.7 } });
  const draw = ease(clamp(progress));
  const cam = thumbnail
    ? landscape
      ? { lon: -100.6, lat: 36.45, span: 14 }
      : { lon: -100.1, lat: 36.1, span: 17 }
    : cameraAt(timing.sections, time);
  const anchorY = landscape ? 0.57 : 0.58;
  const { project } = makeSatProjector(cam, width, height, anchorY);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const showClaim = kind === "texas";
  const showFourLines = ["missouri", "gap", "public", "aha"].includes(kind);
  const showPins = ["shape", "modern", "aha"].includes(kind);
  const showTimeline = ["missouri", "texas", "territory", "statehood"].includes(kind);
  const panPath = geomPath(PANHANDLE as never, project);

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={cam}
        width={width}
        height={height}
        anchorY={anchorY}
        darken={thumbnail ? 0.26 : kind === "cta" ? 0.43 : 0.18}
        highlights={[{
          geom: countryGeom("USA"),
          label: cam.span > 28 ? "United States" : undefined,
          labelAt: [-107, 44],
          fill: "rgba(255,190,20,.16)",
          labelSize: 24,
        }]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="okGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {STATES.map((state) => (
            <path
              key={state.properties.abbr}
              d={geomPath(state.geometry as never, project)}
              fill={state.properties.abbr === "OK" ? "rgba(255,210,63,.24)" : "rgba(5,18,31,.05)"}
              stroke="rgba(255,255,255,.68)"
              strokeWidth={state.properties.abbr === "OK" ? 4 : 2}
              strokeLinejoin="round"
            />
          ))}
          {showClaim && (
            <path d={geomPath(TEXAS_CLAIM as never, project)} fill="rgba(255,91,91,.31)" stroke={C.red} strokeWidth={5} strokeDasharray="14 10" />
          )}
          <path d={panPath} fill="rgba(255,210,63,.68)" stroke={C.gold} strokeWidth={7} filter="url(#okGlow)" />
          {showFourLines && (
            <>
              {[
                [[-104.1, 36.5], [-99.2, 36.5], "36°30′"],
                [[-104.1, 37.0], [-99.2, 37.0], "37°N"],
                [[-103.0, 36.25], [-103.0, 37.25], "103°W"],
                [[-100.0, 36.25], [-100.0, 37.25], "100°W"],
              ].map(([a, b, label], lineIndex) => {
                const [x1, y1] = project(...(a as Pt));
                const [x2, y2] = project(...(b as Pt));
                return (
                  <g key={label as string}>
                    <line x1={x1} y1={y1} x2={lerp(x1, x2, draw)} y2={lerp(y1, y2, draw)} stroke={lineIndex < 2 ? C.red : C.cyan} strokeWidth={5} strokeDasharray="14 9" />
                    <text x={lineIndex < 2 ? x2 - 35 : x2 + 12} y={lineIndex < 2 ? y2 - 12 : y2} fill={C.white} fontFamily={BODY} fontWeight={950} fontSize={landscape ? 19 : 23} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}>{label as string}</text>
                  </g>
                );
              })}
            </>
          )}
          {kind === "shape" && (() => {
            const [westX, baseY] = project(-103.0, 36.42);
            const [eastX] = project(-100.0, 36.42);
            const [sideX, southY] = project(-99.9, 36.5);
            const [, northY] = project(-99.9, 37.0);
            return (
              <g>
                <line x1={westX} y1={baseY} x2={eastX} y2={baseY} stroke={C.cyan} strokeWidth={7} />
                <text x={(westX + eastX) / 2} y={baseY + 34} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={28} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>ABOUT 166 MILES</text>
                <line x1={sideX} y1={southY} x2={sideX} y2={northY} stroke={C.cyan} strokeWidth={7} />
                <text x={sideX + 18} y={(southY + northY) / 2} fill={C.white} fontFamily={DISPLAY} fontSize={24} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>34 MI</text>
              </g>
            );
          })()}
          {showPins && PLACES.map((place, pinIndex) => (
            <Marker key={place.name} point={place.point} label={place.name} project={project} color={pinIndex === 1 ? C.red : C.cyan} reveal={clamp(draw * 1.6 - pinIndex * 0.18)} />
          ))}
          {kind === "modern" && section.text.toLowerCase().includes("highest point") && (
            <Marker point={BLACK_MESA} project={project} label="BLACK MESA · 4,973 FT" color={C.gold} reveal={draw} />
          )}
          {["public", "settlers"].includes(kind) && (
            <text x={project(-101.5, 36.76)[0]} y={project(-101.5, 36.76)[1]} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={landscape ? 34 : 43} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>
              {kind === "public" ? "PUBLIC LAND STRIP" : "“NO MAN'S LAND”"}
            </text>
          )}
          {kind === "settlers" && Array.from({ length: 7 }, (_, markerIndex) => {
            const lon = -102.7 + markerIndex * 0.43;
            const lat = 36.62 + (markerIndex % 2) * 0.2;
            const [x, y] = project(lon, lat);
            return <circle key={markerIndex} cx={x} cy={y} r={8 + 8 * clamp(draw * 1.5 - markerIndex * 0.08)} fill={markerIndex % 2 ? C.cyan : C.white} stroke={C.ink} strokeWidth={4} />;
          })}
        </svg>

        {!thumbnail && <Header kind={kind} text={section.text} progress={progress} landscape={landscape} />}
        {!thumbnail && showFourLines && kind === "aha" && <BoundaryBadge landscape={landscape} progress={draw} />}
        {!thumbnail && showTimeline && <Timeline time={time} landscape={landscape} />}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={landscape ? 310 : 1450} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={landscape ? 440 : 1110} />
        )}

        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: landscape ? "linear-gradient(90deg,rgba(3,10,19,.88),rgba(3,10,19,.08) 70%)" : "linear-gradient(180deg,rgba(3,10,19,.9),rgba(3,10,19,.05) 55%,rgba(3,10,19,.82))" }} />
            <div style={{ position: "absolute", left: landscape ? 70 : 45, right: landscape ? 720 : 45, top: landscape ? 135 : 330, fontFamily: DISPLAY, fontSize: landscape ? 105 : 108, lineHeight: 0.88, textAlign: landscape ? "left" : "center", color: C.white, WebkitTextStroke: `9px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 12px 0 ${C.ink}` }}>
              WHY THE WEIRD<br /><span style={{ color: C.gold }}>&quot;HANDLE&quot;?</span>
            </div>
            <div style={{ position: "absolute", left: landscape ? 120 : 90, right: landscape ? 1120 : 90, top: landscape ? 720 : 1270, padding: "16px 20px 12px", borderRadius: 22, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, background: C.red, color: C.white, textAlign: "center", fontFamily: DISPLAY, fontSize: landscape ? 44 : 49 }}>
              TEXAS CREATED IT!
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

const soundsFor = (sections: Section[]) => {
  const first = (kind: SceneKind) => sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  return [
    [0.25, "boom", 0.19],
    [first("shape"), "whoosh", 0.13],
    [first("missouri"), "ding", 0.13],
    [first("texas"), "pop", 0.13],
    [first("gap"), "whoosh", 0.13],
    [first("public"), "pop", 0.13],
    [first("territory"), "ding", 0.14],
    [first("statehood"), "boom", 0.16],
    [first("aha"), "boom", 0.18],
  ] as const;
};

const Video: React.FC<{ timing: Timing; long?: boolean }> = ({ timing, long = false }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const sound = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {long && <BackgroundBeat />}
      {soundsFor(timing.sections).map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.12))}
      <OklahomaScene timing={timing} />
    </AbsoluteFill>
  );
};

export const OklahomaPanhandleShort: React.FC<{ timing: Timing }> = ({ timing }) => <Video timing={timing} />;
export const OklahomaPanhandleLong: React.FC<{ timing: Timing }> = ({ timing }) => <Video timing={timing} long />;
export const OklahomaPanhandleThumb: React.FC<{ timing: Timing }> = ({ timing }) => <OklahomaScene timing={timing} thumbnail />;
