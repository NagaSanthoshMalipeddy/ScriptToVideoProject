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
  | "overview"
  | "islands"
  | "ownership"
  | "twist"
  | "dateline"
  | "clocks"
  | "nicknames"
  | "mainland"
  | "ice"
  | "border"
  | "swim"
  | "aha"
  | "timeskip"
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
  usa: "#4da3ff",
  russia: "#ff5b5b",
  cyan: "#63dcff",
  green: "#2ecf8f",
  ice: "#dff6ff",
  white: "#ffffff",
};

const LITTLE: Pt = [-168.9533, 65.7586];
const BIG: Pt = [-169.0486, 65.7811];
const DEZHNEV: Pt = [-169.655, 66.078];
const WALES: Pt = [-168.087, 65.613];

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: -169, lat: 64.8, span: 52 },
  overview: { lon: -169, lat: 64.8, span: 31 },
  islands: { lon: -169, lat: 65.77, span: 1.12 },
  ownership: { lon: -169, lat: 65.77, span: 1.28 },
  twist: { lon: -169, lat: 65.77, span: 1.5 },
  dateline: { lon: -169, lat: 65.77, span: 1.05 },
  clocks: { lon: -169, lat: 65.77, span: 1.05 },
  nicknames: { lon: -169, lat: 65.77, span: 1.22 },
  mainland: { lon: -168.85, lat: 65.78, span: 5.4 },
  ice: { lon: -169, lat: 65.77, span: 1.48 },
  border: { lon: -169, lat: 65.77, span: 1.25 },
  swim: { lon: -169, lat: 65.77, span: 1.05 },
  aha: { lon: -169, lat: 65.77, span: 1.42 },
  timeskip: { lon: -169, lat: 65.77, span: 1.08 },
  bridge: { lon: -169, lat: 64.8, span: 18 },
  cta: { lon: -169, lat: 64.8, span: 24 },
};

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("smallest gaps")) return "bridge";
  if (value.includes("across 3.8 km")) return "timeskip";
  if (value.includes("title is true")) return "aha";
  if (value.includes("lynne cox")) return "swim";
  if (value.includes("tightly controlled")) return "border";
  if (value.includes("winter ice")) return "ice";
  if (value.includes("mainlands")) return "mainland";
  if (value.includes("tomorrow island")) return "nicknames";
  if (value.includes("official clocks")) return "clocks";
  if (value.includes("date line")) return "dateline";
  if (value.includes("strangest part")) return "twist";
  if (value.includes("belongs to")) return "ownership";
  if (value.includes("diomede") || value.includes("tiny islands")) return "islands";
  if (value.includes("alaska") || value.includes("far east")) return "overview";
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
  const bump = wide * (1 + 0.15 * Math.sin(Math.PI * progress));
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span:
      progress < 0.5
        ? from.span * Math.pow(bump / from.span, progress * 2)
        : bump *
          Math.pow(to.span / bump, (progress - 0.5) * 2),
  };
};

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["USA + RUSSIA", "ONLY 4 KM APART?!", C.gold],
  overview: ["BERING STRAIT", "Alaska faces Russia's far east", C.cyan],
  islands: ["THE DIOMEDE ISLANDS", "Big Diomede ↔ Little Diomede", C.gold],
  ownership: ["2 ISLANDS · 2 COUNTRIES", "Russia ↔ United States", C.gold],
  twist: ["BUT HERE'S THE TWIST", "Distance is not the strangest part", C.russia],
  dateline: ["INTERNATIONAL DATE LINE", "It runs between the islands", C.gold],
  clocks: ["21 HOURS APART", "Official local time", C.gold],
  nicknames: ["TOMORROW ↔ YESTERDAY", "Big Diomede ↔ Little Diomede", C.cyan],
  mainland: ["MAINLAND TO MAINLAND", "ABOUT 82 KM", C.cyan],
  ice: ["WINTER SEA ICE", "Not safe. Not a public crossing.", C.ice],
  border: ["CONTROLLED BORDER", "Remote weather can turn deadly", C.russia],
  swim: ["LYNNE COX · 1987", "Crossed with official permission", C.green],
  aha: ["THE TITLE IS TRUE", "America and Russia nearly touch", C.gold],
  timeskip: ["3.8 KM · 21 HOURS", "A tiny gap. Almost a full day.", C.gold],
  bridge: ["SMALL GAP · BIG TIME JUMP", "The map hides an incredible story", C.cyan],
  cta: ["GLOBETALES", "Stories hidden between the lines", C.gold],
};

const InfoCard: React.FC<{ kind: Kind; localTime: number }> = ({
  kind,
  localTime,
}) => {
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
        minHeight: 240,
        padding: "28px 30px 24px",
        display: "flex",
        alignItems: "center",
        gap: 24,
        background: "rgba(255,255,255,.95)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${C.ink}`,
        opacity: clamp(pop * 1.5),
        transform: `translateY(${(1 - pop) * -90}px)`,
      }}
    >
      <div
        style={{
          width: 28,
          alignSelf: "stretch",
          borderRadius: 18,
          background: accent,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: DISPLAY,
            color: C.ink,
            fontSize: title.length > 22 ? 60 : 74,
            lineHeight: 0.95,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: BODY,
            color: "#405064",
            fontSize: 33,
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

const Flag: React.FC<{ country: "US" | "RU" }> = ({ country }) => (
  <div
    style={{
      width: 128,
      height: 82,
      border: `4px solid ${C.white}`,
      boxShadow: `0 6px 0 ${C.ink}`,
      overflow: "hidden",
      background:
        country === "RU"
          ? "linear-gradient(#fff 0 33%,#1854a7 33% 66%,#d52b1e 66%)"
          : "repeating-linear-gradient(#b22234 0 8%,#fff 8% 16%)",
      position: "relative",
    }}
  >
    {country === "US" && (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "44%",
          height: "54%",
          background: "#3c3b6e",
          color: C.white,
          fontSize: 22,
          lineHeight: 1,
          padding: 4,
        }}
      >
        ✦✦
        <br />
        ✦✦
      </div>
    )}
  </div>
);

const Marker: React.FC<{
  point: Pt;
  project: (lon: number, lat: number) => Pt;
  label: string;
  color: string;
  align?: "left" | "right";
  labelDy?: number;
  reveal: number;
}> = ({
  point,
  project,
  label,
  color,
  align = "left",
  labelDy = 0,
  reveal,
}) => {
  const [x, y] = project(point[0], point[1]);
  return (
    <g
      opacity={clamp(reveal * 1.5)}
      transform={`translate(0 ${(1 - reveal) * -150})`}
    >
      <path
        d={`M${x} ${y}c0 0-25-31-25-53a25 25 0 1 1 50 0c0 22-25 53-25 53Z`}
        fill={C.ink}
        stroke={C.white}
        strokeWidth={4}
      />
      <circle cx={x} cy={y - 53} r={10} fill={color} />
      {label && (
        <text
          x={x + (align === "left" ? 25 : -25)}
          y={y - 67 + labelDy}
          textAnchor={align === "left" ? "start" : "end"}
          fill={C.white}
          fontFamily={BODY}
          fontWeight={900}
          fontSize={24}
          style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

const Distance: React.FC<{
  from: Pt;
  to: Pt;
  project: (lon: number, lat: number) => Pt;
  label: string;
  color: string;
  reveal: number;
}> = ({ from, to, project, label, color, reveal }) => {
  const [x1, y1] = project(from[0], from[1]);
  const [x2, y2] = project(to[0], to[1]);
  const x = lerp(x1, x2, reveal);
  const y = lerp(y1, y2, reveal);
  return (
    <g opacity={clamp(reveal * 1.5)}>
      <path
        d={`M${x1},${y1} L${x},${y}`}
        stroke={C.ink}
        strokeWidth={18}
        strokeLinecap="round"
      />
      <path
        d={`M${x1},${y1} L${x},${y}`}
        stroke={color}
        strokeWidth={8}
        strokeDasharray="18 12"
        strokeLinecap="round"
      />
      <text
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2 + 130}
        textAnchor="middle"
        fill={C.white}
        fontFamily={DISPLAY}
        fontSize={48}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}
      >
        {label}
      </text>
    </g>
  );
};

const Clocks: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div
    style={{
      position: "absolute",
      left: 65,
      right: 65,
      bottom: 290,
      display: "flex",
      gap: 16,
      opacity: reveal,
      transform: `scale(${0.82 + 0.18 * reveal})`,
    }}
  >
    {[
      ["YESTERDAY ISLE", "MON · 12:00", C.usa],
      ["TOMORROW ISLAND", "TUE · 09:00", C.russia],
    ].map(([name, time, color]) => (
      <div
        key={name}
        style={{
          flex: 1,
          padding: "22px 14px",
          borderRadius: 22,
          border: `5px solid ${color}`,
          background: "rgba(7,21,35,.94)",
          boxShadow: `0 10px 0 ${C.ink}`,
          color: C.white,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: BODY, fontSize: 26, fontWeight: 900 }}>{name}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 61, color }}>{time}</div>
      </div>
    ))}
  </div>
);

const missingCues = (sections: Section[]) => {
  const expected = [
    "only 4 km",
    "tiny islands",
    "alaska",
    "3.8 km apart",
    "belongs to",
    "strangest part",
    "date line",
    "21 hours",
    "tomorrow island",
    "mainlands",
    "winter ice",
    "tightly controlled",
    "lynne cox",
    "title is true",
    "across 3.8 km",
    "smallest gaps",
    "please like",
  ];
  return expected.filter(
    (needle) =>
      !sections.some((section) => section.text.toLowerCase().includes(needle)),
  );
};

const DiomedeSatScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 2.4 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "islands" : kindOf(section?.text ?? "");
  const view = thumbnail
    ? { lon: -169, lat: 65.77, span: 1.34 }
    : cameraAt(timing.sections, time);
  const { project } = makeSatProjector(view, width, height, 0.56);
  const localTime = time - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localTime / 0.9));
  const cta = timing.sections.find((item) =>
    item.text.toLowerCase().includes("please like"),
  );
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) =>
      word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle),
    )?.start ?? ctaTime;
  const close = view.span < 7;
  const islandKinds: Kind[] = [
    "islands",
    "ownership",
    "twist",
    "dateline",
    "clocks",
    "nicknames",
    "ice",
    "border",
    "swim",
    "aha",
    "timeskip",
  ];
  const highlights = [
    {
      geom: countryGeom("USA"),
      label: "United States",
      labelAt: [-161, 63] as Pt,
      fill: "rgba(255,190,20,.36)",
    },
    {
      geom: countryGeom("RUS"),
      label: "Russia",
      labelAt: [-176, 67] as Pt,
      fill: "rgba(255,190,20,.36)",
    },
  ];
  const islandMarkers = islandKinds.includes(kind) || thumbnail;

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={0.56}
        darken={thumbnail ? 0.25 : kind === "cta" ? 0.34 : 0.12}
        highlights={highlights}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {close && islandMarkers && (
            <>
              <Marker
                point={LITTLE}
                project={project}
                label={thumbnail ? "" : "LITTLE DIOMEDE · USA"}
                color={C.usa}
                align="right"
                labelDy={34}
                reveal={reveal}
              />
              <Marker
                point={BIG}
                project={project}
                label={thumbnail ? "" : "BIG DIOMEDE · RUSSIA"}
                color={C.russia}
                labelDy={-22}
                reveal={reveal}
              />
            </>
          )}
          {close && ["islands", "ownership", "aha", "timeskip"].includes(kind) && (
            <Distance
              from={BIG}
              to={LITTLE}
              project={project}
              label="3.8 KM"
              color={C.gold}
              reveal={reveal}
            />
          )}
          {kind === "mainland" && (
            <>
              <Marker
                point={DEZHNEV}
                project={project}
                label="CAPE DEZHNEV"
                color={C.russia}
                reveal={reveal}
              />
              <Marker
                point={WALES}
                project={project}
                label="CAPE PRINCE OF WALES"
                color={C.usa}
                align="right"
                reveal={reveal}
              />
              <Distance
                from={DEZHNEV}
                to={WALES}
                project={project}
                label="ABOUT 82 KM"
                color={C.cyan}
                reveal={reveal}
              />
            </>
          )}
          {close && ["dateline", "clocks", "nicknames", "timeskip"].includes(kind) && (() => {
            const [x1, y1] = project(-169.005, 66.25);
            const [x2, y2] = project(-169.005, 65.25);
            return (
              <path
                d={`M${x1},${y1} L${x2},${y2}`}
                stroke={C.gold}
                strokeWidth={8}
                strokeDasharray="24 15"
              />
            );
          })()}
          {kind === "swim" && (() => {
            const [x1, y1] = project(LITTLE[0], LITTLE[1]);
            const [x2, y2] = project(BIG[0], BIG[1]);
            return (
              <path
                d={`M${x1},${y1} Q${(x1 + x2) / 2},${Math.min(y1, y2) - 120} ${lerp(x1, x2, reveal)},${lerp(y1, y2, reveal)}`}
                fill="none"
                stroke={C.green}
                strokeWidth={11}
                strokeDasharray="16 12"
              />
            );
          })()}
        </svg>

        {!thumbnail && <InfoCard kind={kind} localTime={localTime} />}
        {!thumbnail && ["clocks", "nicknames", "timeskip"].includes(kind) && (
          <Clocks reveal={reveal} />
        )}
        {!thumbnail && kind === "ice" && (
          <div
            style={{
              position: "absolute",
              left: 85,
              right: 85,
              bottom: 300,
              padding: "23px 28px",
              border: `6px solid ${C.ink}`,
              borderRadius: 25,
              boxShadow: `0 11px 0 ${C.ink}`,
              background: "rgba(223,246,255,.94)",
              color: C.ink,
              fontFamily: DISPLAY,
              fontSize: 62,
              textAlign: "center",
            }}
          >
            SEA ICE ≠ SAFE CROSSING
          </div>
        )}
        {!thumbnail && kind === "swim" && (
          <div
            style={{
              position: "absolute",
              left: 170,
              right: 170,
              bottom: 305,
              padding: "22px 28px",
              border: `6px solid ${C.ink}`,
              borderRadius: 24,
              boxShadow: `0 11px 0 ${C.ink}`,
              background: C.green,
              color: C.white,
              fontFamily: DISPLAY,
              fontSize: 64,
              textAlign: "center",
            }}
          >
            OFFICIAL PERMISSION
          </div>
        )}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={650} />}
        {!thumbnail && time >= ctaTime && (
          <CtaCard
            T={time}
            top={1110}
            likeT={wordAt("like")}
            shareT={wordAt("share")}
            subT={wordAt("subscribe")}
          />
        )}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 820,
              padding: 30,
              background: C.russia,
              color: C.white,
              fontFamily: BODY,
              fontWeight: 900,
              fontSize: 38,
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
                  "linear-gradient(180deg,rgba(3,10,18,.9),rgba(3,10,18,.05) 56%,rgba(3,10,18,.88))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 48,
                right: 48,
                top: 335,
                fontFamily: DISPLAY,
                fontSize: 137,
                lineHeight: 0.88,
                color: C.white,
                WebkitTextStroke: `9px ${C.ink}`,
                paintOrder: "stroke fill",
                textShadow: `0 12px 0 ${C.ink}`,
                textAlign: "center",
              }}
            >
              USA &amp; RUSSIA
              <br />
              <span style={{ color: C.gold }}>ONLY 4 KM APART?!</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: 80,
                right: 80,
                top: 1270,
                padding: "18px 24px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 22,
                border: `6px solid ${C.ink}`,
                borderRadius: 24,
                boxShadow: `0 11px 0 ${C.ink}`,
                background: "rgba(7,21,35,.94)",
              }}
            >
              <Flag country="US" />
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontSize: 72,
                  color: C.gold,
                  whiteSpace: "nowrap",
                }}
              >
                3.8 KM
              </div>
              <Flag country="RU" />
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const DiomedeVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const startOf = (kind: Kind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ??
    Number.NaN;
  const ctaTime = startOf("cta");
  const soundCues: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.8, "boom", 0.22],
    [startOf("islands"), "pop", 0.18],
    [startOf("dateline"), "ding", 0.2],
    [startOf("mainland"), "whoosh", 0.17],
    [startOf("swim"), "whoosh", 0.17],
    [startOf("aha"), "boom", 0.2],
  ];
  const sound = (time: number, name: string, volume: number) =>
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
      {soundCues.map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => sound(time + 1.1, "ding", 0.14))}
      <DiomedeSatScene timing={timing} />
    </AbsoluteFill>
  );
};

export const DiomedeThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <DiomedeSatScene timing={timing} thumbnail />
);
