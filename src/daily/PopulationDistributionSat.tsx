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
import { geomPath } from "../ukraine/GeoMap";
import type { Section, Timing } from "../types";
import statesJson from "./us-states.json";

type Pt = [number, number];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };
type StateFeature = {
  properties: { name: string; abbr: string };
  geometry: Geometry;
};
type Kind =
  | "hook"
  | "setup"
  | "top2"
  | "top4"
  | "top6"
  | "half"
  | "top9"
  | "census"
  | "pie"
  | "west"
  | "hubs"
  | "clusters"
  | "versus"
  | "takeaway"
  | "bridge"
  | "cta";

const STATES = (statesJson as unknown as { features: StateFeature[] }).features.filter(
  (state) => !["AK", "HI"].includes(state.properties.abbr)
);
const TOP = ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC"];
const POP: Record<string, number> = {
  CA: 39.5,
  TX: 29.1,
  FL: 21.5,
  NY: 20.2,
  PA: 13.0,
  IL: 12.8,
  OH: 11.8,
  GA: 10.7,
  NC: 10.4,
};
const CITIES: { name: string; point: Pt; group: "coast" | "hub" }[] = [
  { name: "Los Angeles", point: [-118.244, 34.052], group: "coast" },
  { name: "San Francisco", point: [-122.419, 37.775], group: "coast" },
  { name: "Dallas", point: [-96.797, 32.777], group: "hub" },
  { name: "Houston", point: [-95.37, 29.76], group: "hub" },
  { name: "Chicago", point: [-87.63, 41.878], group: "hub" },
  { name: "Atlanta", point: [-84.388, 33.749], group: "hub" },
  { name: "New York", point: [-74.006, 40.713], group: "coast" },
  { name: "Miami", point: [-80.192, 25.762], group: "coast" },
];

const INK = "#071523";
const GOLD = "#ffd23f";
const RED = "#ef3340";
const BLUE = "#3b82f6";
const WHITE = "#ffffff";
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const ease = Easing.inOut(Easing.cubic);

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("maps reveal")) return "bridge";
  if (value.includes("fewer than")) return "takeaway";
  if (value.includes("outnumbered")) return "versus";
  if (value.includes("powerful cities")) return "clusters";
  if (value.includes("jobs, ports")) return "hubs";
  if (value.includes("much of the west")) return "west";
  if (value.includes("51%")) return "pie";
  if (value.includes("331.4")) return "census";
  if (value.includes("ohio")) return "top9";
  if (value.includes("below halfway")) return "half";
  if (value.includes("pennsylvania")) return "top6";
  if (value.includes("florida")) return "top4";
  if (value.includes("2 giants")) return "top2";
  if (value.includes("california")) return "top2";
  if (value.includes("50 states")) return "setup";
  return "hook";
};

const highlightedFor = (kind: Kind) => {
  if (kind === "top2") return TOP.slice(0, 2);
  if (kind === "top4") return TOP.slice(0, 4);
  if (kind === "top6" || kind === "half") return TOP.slice(0, 6);
  if (["top9", "census", "pie", "versus", "takeaway", "bridge", "cta"].includes(kind)) return TOP;
  return [];
};

const COPY: Record<Kind, [string, string]> = {
  hook: ["HALF OF AMERICA", "LIVES IN JUST 9 STATES"],
  setup: ["50 STATES", "BUT PEOPLE ARE NOT EVENLY SPREAD"],
  top2: ["CA + TX", "NEARLY 69 MILLION"],
  top4: ["FOUR STATES", "MORE THAN 110 MILLION"],
  top6: ["SIX STATES", "PAST 136 MILLION"],
  half: ["STILL NOT HALF", "THE LINE: ABOUT 165.7M"],
  top9: ["THE FINAL THREE", "TOTAL: 169.2 MILLION"],
  census: ["2020 CENSUS", "331.4 MILLION AMERICANS"],
  pie: ["JUST OVER 51%", "INSIDE ONLY 9 STATES"],
  west: ["LAND IS NOT PEOPLE", "MOUNTAINS · DESERTS · PUBLIC LAND"],
  hubs: ["POPULATION MAGNETS", "JOBS · PORTS · WARM CLIMATES"],
  clusters: ["PEOPLE FOLLOW CITIES", "COASTS · CORRIDORS · METROS"],
  versus: ["9 STATES VS 41", "169.2M BEATS 162.2M"],
  takeaway: ["FEWER THAN 1 IN 5", "HOLDS HALF OF AMERICA"],
  bridge: ["MAPS REVEAL PATTERNS", "BORDERS CAN HIDE THEM"],
  cta: ["GLOBETALES", "A NEW MAP EVERY DAY"],
};

const activeIndex = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const viewAt = (kind: Kind, localT: number): SatView => {
  const close = ["top2", "top4", "top6", "half", "top9", "clusters"].includes(kind);
  const base = close ? 60 : 69;
  const push = clamp(localT / 5);
  return {
    lon: kind === "west" ? -105 : kind === "clusters" ? -96 : -98.5,
    lat: kind === "west" ? 39 : 38.4,
    span: base * (1 - push * 0.055),
  };
};

const Header: React.FC<{ kind: Kind; localT: number }> = ({ kind, localT }) => {
  const [title, detail] = COPY[kind];
  const pop = spring({
    frame: Math.max(0, Math.round(localT * 30)),
    fps: 30,
    config: { damping: 12, mass: 0.65 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        right: 44,
        top: 310,
        padding: "29px 32px 24px",
        border: `6px solid ${INK}`,
        borderRadius: 30,
        background: "rgba(255,255,255,.95)",
        boxShadow: `0 14px 0 ${INK}`,
        transform: `translateY(${(1 - pop) * -90}px)`,
        opacity: clamp(pop * 1.5),
      }}
    >
      <div style={{ fontFamily: DISPLAY, color: INK, fontSize: title.length > 20 ? 65 : 78, lineHeight: 0.94 }}>
        {title}
      </div>
      <div style={{ marginTop: 13, fontFamily: BODY, color: "#405064", fontSize: 31, fontWeight: 900 }}>
        {detail}
      </div>
    </div>
  );
};

const PopRail: React.FC<{ highlighted: string[]; reveal: number }> = ({ highlighted, reveal }) => (
  <div
    style={{
      position: "absolute",
      left: 42,
      right: 42,
      bottom: 260,
      display: "grid",
      gridTemplateColumns: "repeat(9, 1fr)",
      gap: 5,
    }}
  >
    {TOP.map((abbr, index) => {
      const on = highlighted.includes(abbr);
      const pop = spring({
        frame: Math.max(0, Math.round((reveal - index * 0.035) * 30)),
        fps: 30,
        config: { damping: 12, mass: 0.6 },
      });
      return (
        <div
          key={abbr}
          style={{
            transform: `translateY(${on ? (1 - pop) * 35 : 0}px)`,
            background: on ? RED : "rgba(7,20,38,.82)",
            border: `3px solid ${on ? WHITE : "rgba(255,255,255,.35)"}`,
            borderRadius: 10,
            padding: "8px 1px",
            textAlign: "center",
            color: WHITE,
            boxShadow: on ? `0 6px 0 ${INK}` : "none",
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: 25 }}>{abbr}</div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 15 }}>{POP[abbr].toFixed(1)}M</div>
        </div>
      );
    })}
  </div>
);

const DataCard: React.FC<{ kind: Kind; reveal: number }> = ({ kind, reveal }) => {
  if (kind === "pie") {
    return (
      <div
        style={{
          position: "absolute",
          right: 68,
          bottom: 385,
          width: 315,
          height: 315,
          borderRadius: "50%",
          background: `conic-gradient(${RED} 0 51%, rgba(255,255,255,.85) 51% 100%)`,
          border: `8px solid ${WHITE}`,
          boxShadow: `0 12px 0 ${INK}`,
          transform: `scale(${0.7 + 0.3 * reveal})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "22%",
            borderRadius: "50%",
            background: INK,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: WHITE,
            fontFamily: DISPLAY,
            fontSize: 70,
          }}
        >
          51%
        </div>
      </div>
    );
  }
  if (kind !== "versus") return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 55,
        right: 55,
        bottom: 390,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 13,
        alignItems: "stretch",
        transform: `scale(${0.82 + 0.18 * reveal})`,
      }}
    >
      {[
        ["9 STATES", "169.2M", RED],
        ["VS", "", GOLD],
        ["41 STATES", "162.2M", BLUE],
      ].map(([label, value, color]) => (
        <div
          key={label}
          style={{
            borderRadius: 22,
            padding: "20px 14px",
            background: color,
            border: `5px solid ${INK}`,
            boxShadow: `0 9px 0 ${INK}`,
            color: label === "VS" ? INK : WHITE,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: label === "VS" ? 58 : 44,
          }}
        >
          {label}
          {value && <div style={{ fontFamily: BODY, fontSize: 37, fontWeight: 950 }}>{value}</div>}
        </div>
      ))}
    </div>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = [
    "half of america",
    "50 states",
    "california and texas",
    "2 giants",
    "florida and new york",
    "pennsylvania and illinois",
    "below halfway",
    "ohio, georgia",
    "331.4",
    "51%",
    "much of the west",
    "jobs, ports",
    "powerful cities",
    "outnumbered",
    "fewer than",
    "maps reveal",
    "please like",
  ];
  return expected.filter((needle) => !sections.some((section) => section.text.toLowerCase().includes(needle)));
};

const PopulationDistributionSceneSat: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 2 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "versus" : kindOf(section?.text ?? "");
  const localT = time - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localT / 0.8));
  const highlighted = thumbnail ? TOP : highlightedFor(kind);
  const view = thumbnail ? { lon: -98.5, lat: 38.4, span: 67 } : viewAt(kind, localT);
  const { project } = makeSatProjector(view, width, height, 0.58);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const showCities = ["hubs", "clusters"].includes(kind);

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={0.58}
        darken={thumbnail ? 0.27 : kind === "cta" ? 0.36 : 0.13}
        highlights={[
          {
            geom: countryGeom("USA"),
            label: "United States",
            labelAt: [-100, 48],
            fill: "rgba(255,190,20,.28)",
            labelSize: 27,
          },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {STATES.map((state) => {
            const abbr = state.properties.abbr;
            const on = highlighted.includes(abbr);
            const order = Math.max(0, TOP.indexOf(abbr));
            const stateReveal = clamp((reveal - order * 0.045) * 2);
            return (
              <path
                key={abbr}
                d={geomPath(state.geometry as never, project)}
                fill={on ? `rgba(239,51,64,${0.35 + 0.58 * stateReveal})` : "rgba(7,21,35,.08)"}
                stroke={on ? WHITE : "rgba(255,255,255,.38)"}
                strokeWidth={on ? 3.5 : 1.4}
                strokeLinejoin="round"
              />
            );
          })}
          {showCities &&
            CITIES.map((city, cityIndex) => {
              const [x, y] = project(city.point[0], city.point[1]);
              const pulse = 0.5 + 0.5 * Math.sin(time * 5 - cityIndex);
              return (
                <g key={city.name}>
                  <circle cx={x} cy={y} r={10 + pulse * 18} fill="none" stroke={GOLD} strokeWidth={5} opacity={1 - pulse * 0.45} />
                  <circle cx={x} cy={y} r={8} fill={GOLD} stroke={INK} strokeWidth={3} />
                  <text x={x + 13} y={y - 14} fontFamily={BODY} fontWeight={950} fontSize={22} fill={WHITE} stroke={INK} strokeWidth={5} paintOrder="stroke">
                    {city.name}
                  </text>
                </g>
              );
            })}
        </svg>
        {!thumbnail && <Header kind={kind} localT={localT} />}
        {!thumbnail && <PopRail highlighted={highlighted} reveal={reveal} />}
        {!thumbnail && <DataCard kind={kind} reveal={reveal} />}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={660} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard T={time} top={1110} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />
        )}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 850, padding: 30, background: RED, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 40, textAlign: "center" }}>
            MISSING CUES: {missingCues(timing.sections).join(", ")}
          </div>
        )}
        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,12,20,.88),rgba(3,12,20,.05) 56%,rgba(3,12,20,.78))" }} />
            <div
              style={{
                position: "absolute",
                left: 45,
                right: 45,
                top: 320,
                fontFamily: DISPLAY,
                fontSize: 132,
                lineHeight: 0.86,
                color: WHITE,
                WebkitTextStroke: `10px ${INK}`,
                paintOrder: "stroke fill",
                textShadow: `0 13px 0 ${INK}`,
                textAlign: "center",
              }}
            >
              HALF OF<br />AMERICA LIVES<br /><span style={{ color: GOLD }}>IN 9 STATES!</span>
            </div>
            <div style={{ position: "absolute", left: 92, right: 92, top: 1260, padding: "18px 20px 13px", borderRadius: 23, border: `6px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, background: RED, color: WHITE, textAlign: "center", fontFamily: DISPLAY, fontSize: 57 }}>
              9 STATES &gt; 41 STATES
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const PopulationDistributionVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const startOf = (kind: Kind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const ctaTime = startOf("cta");
  const effects: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.9, "boom", 0.22],
    [startOf("top2"), "whoosh", 0.12],
    [startOf("top4"), "ding", 0.14],
    [startOf("top6"), "ding", 0.14],
    [startOf("top9"), "whoosh", 0.14],
    [startOf("pie"), "pop", 0.16],
    [startOf("versus"), "boom", 0.2],
  ];
  const sound = (start: number, name: string, volume: number) =>
    Number.isFinite(start) ? (
      <Sequence key={`${name}-${start}`} from={Math.max(0, Math.round(start * fps))} durationInFrames={60}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {effects.map(([start, name, volume]) => sound(start, name, volume))}
      {nudgeTimes(ctaTime).map((start) => sound(start + 1.1, "ding", 0.16))}
      <PopulationDistributionSceneSat timing={timing} />
    </AbsoluteFill>
  );
};

export const PopulationDistributionThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <PopulationDistributionSceneSat timing={timing} thumbnail />
);
