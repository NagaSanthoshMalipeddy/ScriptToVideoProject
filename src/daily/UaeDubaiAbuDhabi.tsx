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

type Pt = [number, number];
type SceneKind =
  | "hook"
  | "country"
  | "seven"
  | "history"
  | "abu"
  | "dubai"
  | "compare"
  | "others"
  | "aha"
  | "bridge"
  | "cta";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ink: "#071523",
  gold: "#ffd23f",
  red: "#ff5b5b",
  green: "#2ecf8f",
  blue: "#4da3ff",
  cyan: "#63dcff",
  white: "#ffffff",
  muted: "#a9bfd0",
};

const UAE: Pt = [54.55, 24.35];
const ABU_DHABI: Pt = [54.3773, 24.4539];
const DUBAI: Pt = [55.2708, 25.2048];
const EMIRATES: { name: string; point: Pt; color: string }[] = [
  { name: "ABU DHABI", point: ABU_DHABI, color: C.gold },
  { name: "DUBAI", point: DUBAI, color: C.red },
  { name: "SHARJAH", point: [55.4209, 25.3463], color: C.cyan },
  { name: "AJMAN", point: [55.5136, 25.4052], color: C.green },
  { name: "UMM AL QUWAIN", point: [55.5552, 25.5647], color: "#c78cff" },
  { name: "RAS AL KHAIMAH", point: [55.9432, 25.7895], color: "#ff9c45" },
  { name: "FUJAIRAH", point: [56.3265, 25.1288], color: C.blue },
];

const VIEWS: Record<SceneKind, SatView> = {
  hook: { lon: 54.8, lat: 24.9, span: 10.5 },
  country: { lon: 54.8, lat: 24.8, span: 7.4 },
  seven: { lon: 55.0, lat: 24.9, span: 6.4 },
  history: { lon: 55.0, lat: 24.9, span: 7.2 },
  abu: { lon: 54.45, lat: 24.55, span: 3.7 },
  dubai: { lon: 55.28, lat: 25.2, span: 2.45 },
  compare: { lon: 54.85, lat: 24.85, span: 5.3 },
  others: { lon: 55.65, lat: 25.35, span: 3.5 },
  aha: { lon: 54.9, lat: 24.9, span: 6.1 },
  bridge: { lon: 59.0, lat: 22.8, span: 20 },
  cta: { lon: 58.0, lat: 22.5, span: 25 },
};

const includesAny = (text: string, values: string[]) =>
  values.some((value) => text.includes(value));

const kindOf = (raw: string): SceneKind => {
  const text = raw.toLowerCase();
  if (text.includes("please like")) return "cta";
  if (text.includes("globetales") || text.includes("maps make")) return "bridge";
  if (
    includesAny(text, [
      "complete answer",
      "here is the trick",
      "country, emirate, city",
      "country, emirate",
      "postal zoom",
      "confusion solved",
      "same word can label",
      "both belong",
    ])
  )
    return "aha";
  if (
    includesAny(text, [
      "mistake",
      "sharjah",
      "ajman",
      "umm al quwain",
      "ras al khaimah reaches",
      "fujairah faces",
      "five other",
      "these differences",
    ])
  )
    return "others";
  if (
    includesAny(text, [
      "side by side",
      "put them",
      "both are",
      "share the uae",
      "dirhams",
      "address may",
      "political capital",
      "best-known commercial",
      "every dubai address",
    ])
  )
    return "compare";
  if (
    includesAny(text, [
      "1971",
      "1972",
      "trucial",
      "britain ended",
      "original 6",
      "national day",
      "eid al etihad",
    ])
  )
    return "history";
  if (
    includesAny(text, [
      "dubai is another",
      "zoom northeast to dubai",
      "follow the coast",
      "dubai is also",
      "dubai creek",
      "pearl markets",
      "aviation",
      "jebel ali",
      "tourism followed",
      "burj khalifa",
      "commercial and tourism",
      "dubai became",
      "dubai is much smaller",
      "smaller. but",
    ])
  )
    return "dubai";
  if (
    includesAny(text, [
      "abu dhabi is one",
      "zoom into abu dhabi",
      "abu dhabi is also",
      "covers most",
      "holds most",
      "national capital",
      "federal ministries",
      "grand mosque",
      "louvre",
      "oil reserves",
      "largest emirate",
      "political capital",
    ])
  )
    return "abu";
  if (
    includesAny(text, [
      "7 emirates",
      "seven emirates",
      "those emirates",
      "most face",
      "federal country",
      "federation of",
      "splits into seven",
    ])
  )
    return "seven";
  if (
    includesAny(text, [
      "country is the united",
      "top of the ladder",
      "united arab emirates",
      "solution is one",
      "millions of indians",
      "people often say",
    ])
  )
    return "country";
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
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.45));
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

const shortCopy = (kind: SceneKind, text: string): [string, string, string] => {
  if (kind === "hook") return ["DUBAI IS NOT A COUNTRY!", "UAE vs Dubai vs Abu Dhabi", C.gold];
  if (kind === "country") return ["UNITED ARAB EMIRATES", "The sovereign country", C.gold];
  if (kind === "seven") return ["7 EMIRATES", "One federal country", C.cyan];
  if (kind === "history") return [text.includes("1972") ? "1972" : "1971", "The federation takes shape", C.green];
  if (kind === "abu") return ["ABU DHABI", "Emirate + city + national capital", C.gold];
  if (kind === "dubai") return ["DUBAI", text.toLowerCase().includes("828") ? "Burj Khalifa · 828 m" : "Emirate + city", C.red];
  if (kind === "compare") return ["ABU DHABI vs DUBAI", "Capital vs commercial icon", C.cyan];
  if (kind === "others") return ["NOT JUST TWO", "Seven emirates complete the UAE", C.green];
  if (kind === "aha") return ["COUNTRY → EMIRATE → CITY", "That is the whole trick", C.gold];
  if (kind === "bridge") return ["MAPS MAKE IT CLICK", "GlobeTales", C.cyan];
  return ["GLOBETALES", "Maps made simple", C.gold];
};

const Pin: React.FC<{
  point: Pt;
  project: (lon: number, lat: number) => Pt;
  label: string;
  color: string;
  reveal: number;
  compact?: boolean;
}> = ({ point, project, label, color, reveal, compact = false }) => {
  const [x, y] = project(point[0], point[1]);
  const size = compact ? 13 : 18;
  return (
    <g
      opacity={clamp(reveal * 1.5)}
      transform={`translate(0 ${(1 - reveal) * -120})`}
    >
      <path
        d={`M${x} ${y}c0 0-${size}-${size * 1.45}-${size}-${size * 2.45}a${size} ${size} 0 1 1 ${size * 2} 0c0 ${size}-${size} ${size * 2.45}-${size} ${size * 2.45}Z`}
        fill={C.ink}
        stroke={C.white}
        strokeWidth={compact ? 3 : 4}
      />
      <circle cx={x} cy={y - size * 2.45} r={size * 0.42} fill={color} />
      <text
        x={x}
        y={y + (compact ? 32 : 45)}
        textAnchor="middle"
        fill={C.white}
        fontFamily={BODY}
        fontWeight={900}
        fontSize={compact ? 17 : 25}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: compact ? 5 : 7 }}
      >
        {label}
      </text>
    </g>
  );
};

const Flag = () => (
  <div
    style={{
      width: 125,
      height: 76,
      position: "relative",
      overflow: "hidden",
      border: `4px solid ${C.white}`,
      boxShadow: `0 6px 0 ${C.ink}`,
      background:
        "linear-gradient(#00732f 0 33.33%,#fff 33.33% 66.66%,#000 66.66%)",
    }}
  >
    <div style={{ width: 30, height: "100%", background: "#f00" }} />
  </div>
);

const Skyline: React.FC<{ city: "abu" | "dubai"; reveal: number }> = ({
  city,
  reveal,
}) => {
  const isDubai = city === "dubai";
  const bars = isDubai
    ? [100, 145, 115, 245, 130, 170, 95]
    : [95, 125, 150, 105, 130, 115, 90];
  return (
    <div
      style={{
        display: "flex",
        height: 250,
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {bars.map((height, index) => (
        <div
          key={index}
          style={{
            width: index === 3 && isDubai ? 42 : 58,
            height: height * reveal,
            border: `4px solid ${C.ink}`,
            borderRadius: "10px 10px 0 0",
            background:
              index === 3 && isDubai
                ? `linear-gradient(${C.gold},${C.red})`
                : `linear-gradient(${isDubai ? C.red : C.gold},${C.blue})`,
            clipPath:
              index === 3 && isDubai
                ? "polygon(45% 0,55% 0,60% 22%,70% 22%,70% 100%,30% 100%,30% 22%,40% 22%)"
                : undefined,
          }}
        />
      ))}
    </div>
  );
};

const Hierarchy: React.FC<{ reveal: number; landscape: boolean }> = ({
  reveal,
  landscape,
}) => (
  <div
    style={{
      position: "absolute",
      left: landscape ? 110 : 70,
      right: landscape ? 110 : 70,
      bottom: landscape ? 80 : 250,
      display: "flex",
      flexDirection: landscape ? "row" : "column",
      alignItems: "center",
      justifyContent: "center",
      gap: landscape ? 28 : 16,
      opacity: reveal,
      transform: `scale(${0.82 + reveal * 0.18})`,
    }}
  >
    {[
      ["COUNTRY", "UAE", C.gold],
      ["EMIRATES", "Dubai · Abu Dhabi", C.cyan],
      ["CITIES", "Dubai · Abu Dhabi", C.green],
    ].map(([label, value, color], index) => (
      <React.Fragment key={label}>
        {index > 0 && (
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: landscape ? 55 : 48,
              color: C.white,
              transform: landscape ? "rotate(0deg)" : "rotate(90deg)",
            }}
          >
            →
          </div>
        )}
        <div
          style={{
            minWidth: landscape ? 360 : 500,
            padding: "16px 26px",
            border: `5px solid ${C.ink}`,
            borderRadius: 24,
            boxShadow: `0 9px 0 ${C.ink}`,
            background: color,
            color: C.ink,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: BODY, fontSize: 22, fontWeight: 900 }}>{label}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 46, lineHeight: 1 }}>{value}</div>
        </div>
      </React.Fragment>
    ))}
  </div>
);

const InfoPanel: React.FC<{
  kind: SceneKind;
  text: string;
  localTime: number;
  landscape: boolean;
}> = ({ kind, text, localTime, landscape }) => {
  const [title, detail, accent] = shortCopy(kind, text);
  const pop = spring({
    frame: Math.round(localTime * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  const city = kind === "abu" ? "abu" : kind === "dubai" ? "dubai" : null;
  return (
    <div
      style={{
        position: "absolute",
        left: landscape ? 80 : 44,
        width: landscape ? 620 : undefined,
        right: landscape ? undefined : 44,
        top: landscape ? 80 : 300,
        minHeight: landscape ? 260 : 235,
        padding: landscape ? "28px 34px" : "26px 30px",
        background: "rgba(255,255,255,.95)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 13px 0 ${C.ink}`,
        opacity: clamp(pop * 1.5),
        transform: `translateY(${(1 - pop) * -80}px)`,
      }}
    >
      <div
        style={{
          height: 14,
          width: 160,
          borderRadius: 99,
          background: accent,
          marginBottom: 18,
        }}
      />
      <div
        style={{
          fontFamily: DISPLAY,
          color: C.ink,
          fontSize: landscape ? (title.length > 25 ? 48 : 62) : title.length > 25 ? 48 : 67,
          lineHeight: 0.95,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 13,
          fontFamily: BODY,
          color: "#405064",
          fontSize: landscape ? 27 : 31,
          lineHeight: 1.12,
          fontWeight: 850,
        }}
      >
        {detail}
      </div>
      {landscape && city && (
        <div style={{ position: "absolute", left: 680, top: 0, width: 560 }}>
          <Skyline city={city} reveal={clamp(pop)} />
        </div>
      )}
    </div>
  );
};

const Timeline: React.FC<{ reveal: number; landscape: boolean }> = ({
  reveal,
  landscape,
}) => (
  <div
    style={{
      position: "absolute",
      left: landscape ? 760 : 85,
      right: landscape ? 100 : 85,
      bottom: landscape ? 110 : 300,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 18,
      opacity: reveal,
    }}
  >
    {[
      ["1971", "6 emirates unite"],
      ["1972", "Ras Al Khaimah joins"],
    ].map(([year, detail], index) => (
      <React.Fragment key={year}>
        {index > 0 && <div style={{ height: 8, flex: 1, background: C.white }} />}
        <div
          style={{
            width: landscape ? 340 : 390,
            padding: "20px 18px",
            textAlign: "center",
            background: index ? C.green : C.gold,
            border: `6px solid ${C.ink}`,
            borderRadius: 26,
            boxShadow: `0 11px 0 ${C.ink}`,
          }}
        >
          <div style={{ fontFamily: DISPLAY, fontSize: 72, color: C.ink }}>{year}</div>
          <div style={{ fontFamily: BODY, fontSize: 24, fontWeight: 900, color: C.ink }}>
            {detail}
          </div>
        </div>
      </React.Fragment>
    ))}
  </div>
);

const MissingCues: React.FC<{ sections: Section[] }> = ({ sections }) => {
  const expected = ["dubai is not a country", "united arab emirates", "7 emirates", "abu dhabi", "dubai", "1971", "country", "please like"];
  const missing = expected.filter(
    (value) => !sections.some((section) => section.text.toLowerCase().includes(value)),
  );
  if (!missing.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 760,
        padding: 24,
        background: C.red,
        color: C.white,
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: 36,
        textAlign: "center",
      }}
    >
      MISSING CUES: {missing.join(", ")}
    </div>
  );
};

const UaeScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const landscape = width > height;
  const time = thumbnail ? 1.8 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "compare" : kindOf(section?.text ?? "");
  const view = thumbnail
    ? { lon: 54.85, lat: 24.85, span: landscape ? 7.8 : 5.8 }
    : cameraAt(timing.sections, time);
  const anchorY = landscape ? 0.52 : 0.58;
  const { project } = makeSatProjector(view, width, height, anchorY);
  const localTime = time - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localTime / 0.85));
  const cta = timing.sections.find((item) =>
    item.text.toLowerCase().includes("please like"),
  );
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle),
    )?.start ?? ctaTime;
  const pinBoth = ["hook", "compare", "aha"].includes(kind) || thumbnail;
  const showSeven = ["seven", "history", "others"].includes(kind);

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={anchorY}
        darken={thumbnail ? 0.32 : kind === "cta" ? 0.4 : 0.2}
        highlights={[
          {
            geom: countryGeom("ARE"),
            label: kind === "country" || kind === "seven" ? "United Arab Emirates" : undefined,
            labelAt: UAE,
            labelSize: landscape ? 30 : 25,
            fill: "rgba(255,190,20,.45)",
          },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {(pinBoth || kind === "abu") && (
            <Pin
              point={ABU_DHABI}
              project={project}
              label={thumbnail ? "CAPITAL" : "ABU DHABI"}
              color={C.gold}
              reveal={reveal}
            />
          )}
          {(pinBoth || kind === "dubai") && (
            <Pin
              point={DUBAI}
              project={project}
              label={thumbnail ? "NOT A COUNTRY" : "DUBAI"}
              color={C.red}
              reveal={reveal}
            />
          )}
          {showSeven &&
            EMIRATES.map((emirate, emirateIndex) => (
              <Pin
                key={emirate.name}
                point={emirate.point}
                project={project}
                label={kind === "seven" ? `${emirateIndex + 1}` : emirate.name}
                color={emirate.color}
                compact
                reveal={clamp((localTime - emirateIndex * 0.12) / 0.7)}
              />
            ))}
        </svg>

        {!thumbnail && <InfoPanel kind={kind} text={section?.text ?? ""} localTime={localTime} landscape={landscape} />}
        {!thumbnail && kind === "history" && <Timeline reveal={reveal} landscape={landscape} />}
        {!thumbnail && kind === "aha" && <Hierarchy reveal={reveal} landscape={landscape} />}
        {!thumbnail && (kind === "abu" || kind === "dubai") && !landscape && (
          <div
            style={{
              position: "absolute",
              left: 100,
              right: 100,
              bottom: 260,
              padding: "22px 28px 14px",
              background: "rgba(7,21,35,.92)",
              border: `5px solid ${kind === "abu" ? C.gold : C.red}`,
              borderRadius: 26,
            }}
          >
            <Skyline city={kind} reveal={reveal} />
          </div>
        )}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={landscape ? 60 : 620} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard
            T={time}
            top={landscape ? 470 : 1120}
            likeT={wordAt("like")}
            shareT={wordAt("share")}
            subT={wordAt("subscribe")}
          />
        )}
        {!thumbnail && <MissingCues sections={timing.sections} />}

        {thumbnail && (
          <>
            <AbsoluteFill
              style={{
                background: landscape
                  ? "linear-gradient(90deg,rgba(3,10,18,.93),rgba(3,10,18,.2) 70%,rgba(3,10,18,.75))"
                  : "linear-gradient(180deg,rgba(3,10,18,.9),rgba(3,10,18,.08) 58%,rgba(3,10,18,.92))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: landscape ? 80 : 48,
                right: landscape ? 900 : 48,
                top: landscape ? 150 : 335,
                fontFamily: DISPLAY,
                fontSize: landscape ? 115 : 119,
                lineHeight: 0.88,
                color: C.white,
                WebkitTextStroke: `8px ${C.ink}`,
                paintOrder: "stroke fill",
                textShadow: `0 11px 0 ${C.ink}`,
                textAlign: landscape ? "left" : "center",
              }}
            >
              DUBAI IS
              <br />
              <span style={{ color: C.gold }}>NOT A COUNTRY!</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: landscape ? 110 : 110,
                right: landscape ? 1030 : 110,
                top: landscape ? 550 : 1260,
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                border: `6px solid ${C.ink}`,
                borderRadius: 24,
                boxShadow: `0 10px 0 ${C.ink}`,
                background: "rgba(255,255,255,.95)",
                color: C.ink,
                fontFamily: DISPLAY,
                fontSize: landscape ? 43 : 52,
                whiteSpace: "nowrap",
              }}
            >
              <Flag />
              UAE · DUBAI · ABU DHABI
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const UaeExplainer: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps, width, height } = useVideoConfig();
  const landscape = width > height;
  const startOf = (kind: SceneKind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ??
    Number.NaN;
  const ctaTime = startOf("cta");
  const soundCues: [number, string, number][] = [
    [0.15, "boom", 0.2],
    [startOf("country"), "whoosh", 0.14],
    [startOf("seven"), "pop", 0.16],
    [startOf("history"), "ding", 0.16],
    [startOf("abu"), "whoosh", 0.14],
    [startOf("dubai"), "whoosh", 0.14],
    [startOf("compare"), "boom", 0.17],
    [startOf("aha"), "ding", 0.2],
  ];
  const sound = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence
        key={`${name}-${time}`}
        from={Math.max(0, Math.round(time * fps))}
        durationInFrames={60}
      >
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;

  return (
    <AbsoluteFill>
      {landscape && <BackgroundBeat />}
      <Audio src={staticFile(timing.audio)} />
      {soundCues.map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.13))}
      <UaeScene timing={timing} />
    </AbsoluteFill>
  );
};

export const UaeThumbnail: React.FC<{ timing: Timing }> = ({ timing }) => (
  <UaeScene timing={timing} thumbnail />
);
