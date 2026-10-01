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
import { CoverTitle } from "../cartoon/CoverTitle";
import type { Section, Timing } from "../types";
import statesJson from "./us-states.json";

type Pt = [number, number];
type Ring = Pt[];
type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: Ring[] | Ring[][] };
type StateFeature = {
  properties: { name: string; abbr: string };
  geometry: Geometry;
};

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

const CITY: Record<string, Pt> = {
  "LOS ANGELES": [-118.244, 34.052],
  "SAN FRANCISCO": [-122.419, 37.775],
  DALLAS: [-96.797, 32.777],
  HOUSTON: [-95.37, 29.76],
  AUSTIN: [-97.743, 30.267],
  "SAN ANTONIO": [-98.494, 29.425],
  "NEW YORK CITY": [-74.006, 40.713],
  PHILADELPHIA: [-75.165, 39.953],
  PITTSBURGH: [-79.996, 40.441],
  CHICAGO: [-87.63, 41.878],
  CLEVELAND: [-81.695, 41.499],
  COLUMBUS: [-82.999, 39.961],
  CINCINNATI: [-84.512, 39.103],
  ATLANTA: [-84.388, 33.749],
  CHARLOTTE: [-80.843, 35.227],
  RALEIGH: [-78.638, 35.78],
};

const C = {
  navy: "#071426",
  ocean: "#0d3152",
  grid: "rgba(137,207,240,.09)",
  land: "#e9dfc9",
  edge: "#172235",
  red: "#ef3340",
  blue: "#3b82f6",
  gold: "#ffd23f",
  green: "#20b486",
  white: "#ffffff",
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

const kindOf = (text: string) => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("9 states had") || value.includes("9 states outnumbered") || value.includes("other 41")) return "vs";
  if (value.includes("51%") || value.includes("just over 51") || value.includes("inside 18%")) return "pie";
  if (value.includes("california") && value.includes("texas")) return "top2";
  if (value.includes("florida") || value.includes("new york")) return "top4";
  if (value.includes("pennsylvania") || value.includes("illinois")) return "top6";
  if (value.includes("ohio") || value.includes("georgia") || value.includes("north carolina")) return "top9";
  if (value.includes("169.2") || value.includes("halfway") || value.includes("165.7")) return "total";
  if (value.includes("wyoming") || value.includes("new jersey")) return "density";
  if (value.includes("house of representatives") || value.includes("electoral") || value.includes("federal money")) return "power";
  if (value.includes("south and west") || value.includes("keep gaining") || value.includes("list can change")) return "shift";
  if (value.includes("city") || value.includes("metro") || value.includes("corridor") || value.includes("triangle")) return "metros";
  if (value.includes("mountain") || value.includes("desert") || value.includes("coast") || value.includes("river")) return "geography";
  return "intro";
};

const highlightedFor = (kind: string) => {
  if (kind === "top2") return TOP.slice(0, 2);
  if (kind === "top4") return TOP.slice(0, 4);
  if (kind === "top6") return TOP.slice(0, 6);
  if (["top9", "total", "vs", "pie", "cta", "power"].includes(kind)) return TOP;
  if (kind === "shift") return ["TX", "FL", "NC", "GA"];
  if (kind === "density") return ["NJ", "WY"];
  return [];
};

const titleFor = (text: string, kind: string) => {
  if (kind === "cta") return ["GLOBETALES", "MAP THE HIDDEN PATTERN"];
  if (kind === "vs") return ["9 STATES VS 41", "169.2M BEATS 162.2M"];
  if (kind === "pie") return ["JUST OVER 51%", "INSIDE ONLY 9 STATES"];
  if (kind === "top2") return ["THE TWO GIANTS", "CA + TX = 68.7M"];
  if (kind === "top4") return ["FOUR STATES", "ABOUT 110.4 MILLION"];
  if (kind === "top6") return ["SIX STATES", "ABOUT 136.2 MILLION"];
  if (kind === "top9") return ["THE FINAL THREE", "OH + GA + NC"];
  if (kind === "total") return ["THE HALFWAY LINE", "165.7 MILLION"];
  if (kind === "density") return ["LAND IS NOT PEOPLE", "SIZE CAN FOOL YOU"];
  if (kind === "power") return ["WHY IT MATTERS", "SEATS, VOTES, FUNDING"];
  if (kind === "shift") return ["AMERICA IS MOVING", "SOUTH + WEST"];
  if (kind === "metros") return ["PEOPLE FOLLOW CITIES", "METROS BECOME MAGNETS"];
  if (kind === "geography") return ["GEOGRAPHY SHAPES GROWTH", "COASTS, RIVERS, CLIMATE"];
  if (text.toLowerCase().includes("50 states")) return ["50 STATES", "BUT ONLY 9 HOLD HALF"];
  if (text.toLowerCase().includes("2020 census")) return ["OFFICIAL 2020 CENSUS", "331.4 MILLION PEOPLE"];
  return ["HALF OF AMERICA", "LIVES IN JUST 9 STATES"];
};

const project = (point: Pt, width: number, height: number): Pt => {
  const x = ((point[0] + 125) / 59) * width;
  const y = ((50 - point[1]) / 26) * height;
  return [x, y];
};

const ringPath = (ring: Ring, width: number, height: number) =>
  ring
    .map((point, index) => {
      const [x, y] = project(point, width, height);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";

const geometryPath = (geometry: Geometry, width: number, height: number) => {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates as Ring[]]
      : (geometry.coordinates as Ring[][]);
  return polygons
    .flatMap((polygon) => polygon.map((ring) => ringPath(ring, width, height)))
    .join(" ");
};

const PopRail: React.FC<{
  highlighted: string[];
  wide: boolean;
  reveal: number;
}> = ({ highlighted, wide, reveal }) => (
  <div
    style={{
      position: "absolute",
      left: wide ? 58 : 42,
      right: wide ? 58 : 42,
      bottom: wide ? 42 : 260,
      display: "grid",
      gridTemplateColumns: "repeat(9, 1fr)",
      gap: wide ? 10 : 5,
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
            background: on ? C.red : "rgba(7,20,38,.8)",
            border: `3px solid ${on ? C.white : "rgba(255,255,255,.22)"}`,
            borderRadius: wide ? 14 : 10,
            padding: wide ? "9px 5px" : "8px 1px",
            textAlign: "center",
            color: C.white,
            boxShadow: on ? `0 6px 0 ${C.edge}` : "none",
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: wide ? 29 : 25 }}>{abbr}</div>
          <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: wide ? 17 : 15 }}>
            {POP[abbr].toFixed(1)}M
          </div>
        </div>
      );
    })}
  </div>
);

const DataGraphic: React.FC<{ kind: string; wide: boolean; reveal: number }> = ({
  kind,
  wide,
  reveal,
}) => {
  if (kind === "pie") {
    return (
      <div
        style={{
          position: "absolute",
          right: wide ? 72 : 70,
          bottom: wide ? 175 : 350,
          width: wide ? 260 : 330,
          height: wide ? 260 : 330,
          borderRadius: "50%",
          background: `conic-gradient(${C.red} 0 51%, ${C.land} 51% 100%)`,
          border: `8px solid ${C.white}`,
          boxShadow: `0 12px 0 ${C.edge}`,
          transform: `scale(${0.7 + 0.3 * reveal})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "22%",
            borderRadius: "50%",
            background: C.navy,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.white,
            fontFamily: DISPLAY,
            fontSize: wide ? 58 : 72,
          }}
        >
          51%
        </div>
      </div>
    );
  }
  if (kind !== "vs") return null;
  return (
    <div
      style={{
        position: "absolute",
        right: wide ? 55 : 55,
        bottom: wide ? 175 : 380,
        width: wide ? 510 : 970,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 14,
        alignItems: "stretch",
        transform: `scale(${0.82 + 0.18 * reveal})`,
      }}
    >
      {[
        ["9 STATES", "169.2M", C.red],
        ["VS", "", C.gold],
        ["41 STATES", "162.2M", C.blue],
      ].map(([label, value, color]) => (
        <div
          key={label}
          style={{
            borderRadius: 22,
            padding: wide ? "18px 22px" : "20px 14px",
            background: color,
            border: `5px solid ${C.edge}`,
            boxShadow: `0 9px 0 ${C.edge}`,
            color: kind === "vs" && label === "VS" ? C.edge : C.white,
            textAlign: "center",
            fontFamily: DISPLAY,
            fontSize: label === "VS" ? (wide ? 45 : 58) : wide ? 34 : 45,
          }}
        >
          {label}
          {value && (
            <div style={{ fontFamily: BODY, fontSize: wide ? 30 : 38, fontWeight: 950 }}>
              {value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const PopulationScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: widthPx, height: heightPx } = useVideoConfig();
  const wide = widthPx > heightPx;
  const time = thumbnail ? 2 : frame / fps;
  const sectionIndex = activeSection(timing.sections, time);
  const section = timing.sections[sectionIndex] ?? timing.sections[0];
  const kind = thumbnail ? "vs" : kindOf(section?.text ?? "");
  const highlighted = thumbnail ? TOP : highlightedFor(kind);
  const reveal = thumbnail ? 1 : ease(clamp((time - section.start) / 0.8));
  const [kicker, headline] = thumbnail
    ? ["USA POPULATION", "HALF LIVES IN 9 STATES!"]
    : titleFor(section?.text ?? "", kind);
  const cta = timing.sections.find((item) =>
    item.text.toLowerCase().includes("please like")
  );
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle)
    )?.start ?? ctaTime;

  const mapLeft = wide ? 660 : 25;
  const mapTop = wide ? 145 : 660;
  const mapWidth = wide ? 1210 : 1030;
  const mapHeight = wide ? 760 : 760;
  const pulseCities = Object.entries(CITY).filter(([name]) => {
    const text = section?.text.toUpperCase() ?? "";
    return text.includes(name) ||
      (kind === "metros" && ["NEW YORK CITY", "CHICAGO", "ATLANTA", "CHARLOTTE", "RALEIGH"].includes(name));
  });
  const zoom = 1 + Math.sin(time * 0.45) * 0.012 + reveal * 0.025;

  return (
    <AbsoluteFill style={{ background: C.navy, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            `radial-gradient(circle at 60% 48%, ${C.ocean} 0%, ${C.navy} 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.55,
          backgroundImage: `linear-gradient(${C.grid} 2px, transparent 2px), linear-gradient(90deg, ${C.grid} 2px, transparent 2px)`,
          backgroundSize: "72px 72px",
        }}
      />

      <svg
        width={mapWidth}
        height={mapHeight}
        viewBox={`0 0 ${mapWidth} ${mapHeight}`}
        style={{
          position: "absolute",
          left: mapLeft,
          top: mapTop,
          overflow: "visible",
          transform: `scale(${zoom})`,
          transformOrigin: "50% 50%",
          filter: "drop-shadow(0 18px 16px rgba(0,0,0,.38))",
        }}
      >
        {STATES.map((state) => {
          const abbr = state.properties.abbr;
          const on = highlighted.includes(abbr);
          const order = Math.max(0, TOP.indexOf(abbr));
          const stateReveal = clamp((reveal - order * 0.045) * 2);
          const densityPair = kind === "density";
          const fill =
            densityPair && abbr === "NJ"
              ? C.gold
              : densityPair && abbr === "WY"
                ? C.blue
                : on
                  ? `rgba(239,51,64,${0.35 + 0.65 * stateReveal})`
                  : C.land;
          return (
            <path
              key={abbr}
              d={geometryPath(state.geometry, mapWidth, mapHeight)}
              fill={fill}
              stroke={on ? C.white : C.edge}
              strokeWidth={on ? 3.2 : 1.8}
              strokeLinejoin="round"
            />
          );
        })}
        {pulseCities.map(([name, point], index) => {
          const [x, y] = project(point, mapWidth, mapHeight);
          const pulse = 0.5 + 0.5 * Math.sin(time * 5 - index);
          return (
            <g key={name}>
              <circle cx={x} cy={y} r={10 + pulse * 17} fill="none" stroke={C.gold} strokeWidth={5} opacity={1 - pulse * 0.5} />
              <circle cx={x} cy={y} r={8} fill={C.gold} stroke={C.edge} strokeWidth={3} />
              <text x={x + 14} y={y - 15} fontFamily={BODY} fontWeight={950} fontSize={wide ? 19 : 23} fill={C.white} stroke={C.edge} strokeWidth={5} paintOrder="stroke">
                {name}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "absolute",
          left: wide ? 52 : 42,
          top: thumbnail ? 320 : wide ? 52 : 275,
          width: wide ? 670 : 995,
          minHeight: wide ? 245 : 300,
          padding: wide ? "28px 34px" : "32px 38px",
          borderRadius: 30,
          background: "rgba(255,255,255,.96)",
          border: `6px solid ${C.edge}`,
          boxShadow: `0 14px 0 ${C.edge}`,
          transform: `translateY(${(1 - reveal) * -65}px)`,
        }}
      >
        <div style={{ color: C.red, fontFamily: BODY, fontWeight: 1000, fontSize: wide ? 25 : 31, letterSpacing: 3 }}>
          {kicker}
        </div>
        <div
          style={{
            color: C.edge,
            fontFamily: DISPLAY,
            fontSize: thumbnail ? 100 : wide ? 74 : 84,
            lineHeight: 0.92,
            marginTop: 8,
          }}
        >
          {headline}
        </div>
        {!thumbnail && (
          <div style={{ marginTop: 16, color: "#526174", fontFamily: BODY, fontSize: wide ? 25 : 31, fontWeight: 850 }}>
            {section?.text}
          </div>
        )}
      </div>

      <DataGraphic kind={kind} wide={wide} reveal={reveal} />
      <PopRail highlighted={highlighted} wide={wide} reveal={reveal} />

      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={wide ? 330 : 1460} />}
      {!thumbnail && time >= ctaTime && (
        <CtaCard
          T={time}
          top={wide ? 610 : 1100}
          likeT={wordAt("like")}
          shareT={wordAt("share")}
          subT={wordAt("subscribe")}
        />
      )}
      {!thumbnail && (
        <div
          style={{
            position: "absolute",
            right: wide ? 38 : 34,
            top: wide ? 28 : 58,
            color: C.white,
            fontFamily: DISPLAY,
            fontSize: wide ? 33 : 38,
            letterSpacing: 2,
          }}
        >
          GLOBETALES
        </div>
      )}
    </AbsoluteFill>
  );
};

export const PopulationDistributionVideo: React.FC<{ timing: Timing }> = ({
  timing,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const ctaTime =
    timing.sections.find((section) =>
      section.text.toLowerCase().includes("please like")
    )?.start ?? timing.durationSec;
  const starts = timing.sections.map((section) => section.start);
  const effects: [number, string, number][] = [
    [0.15, "riser", 0.15],
    [0.9, "boom", 0.2],
    ...starts.slice(1).map(
      (start, index) =>
        [start, index % 4 === 0 ? "ding" : "whoosh", 0.11] as [
          number,
          string,
          number,
        ]
    ),
    ...nudgeTimes(ctaTime).map(
      (start) => [start + 1.1, "ding", 0.15] as [number, string, number]
    ),
  ];

  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {effects.map(([start, name, volume], index) => (
        <Sequence
          key={`${name}-${index}-${start}`}
          from={Math.max(0, Math.round(start * fps))}
          durationInFrames={60}
        >
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
      <PopulationScene timing={timing} />
      <CoverTitle lines={["HALF OF AMERICA", "LIVES IN 9 STATES!"]} sub="Where Americans really live" accent="#ff3b4a" />
      {time > timing.durationSec + 1 && (
        <AbsoluteFill style={{ background: C.navy }} />
      )}
    </AbsoluteFill>
  );
};

export const PopulationDistributionThumb: React.FC<{ timing: Timing }> = ({
  timing,
}) => <PopulationScene timing={timing} thumbnail />;
