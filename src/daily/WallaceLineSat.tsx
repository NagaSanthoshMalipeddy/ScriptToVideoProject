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
  | "empty"
  | "region"
  | "distance"
  | "west"
  | "east"
  | "shelf"
  | "route"
  | "depth"
  | "stopped"
  | "north"
  | "orangutan"
  | "sulawesi"
  | "wallace"
  | "name"
  | "exception"
  | "separated"
  | "worlds"
  | "bridge"
  | "cta";

const C = {
  ink: "#071523",
  gold: "#ffd23f",
  west: "#ffb547",
  east: "#63dcff",
  green: "#3bd38a",
  white: "#ffffff",
};
const BALI: Pt = [115.1889, -8.4095];
const LOMBOK: Pt = [116.3249, -8.6509];
const BORNEO: Pt = [114.0, 0.8];
const SULAWESI: Pt = [121.0, -2.0];
const WALLACE: Pt[] = [
  [115.62, -10.5],
  [115.67, -8.55],
  [116.15, -6.0],
  [117.2, -3.0],
  [118.8, 0.2],
  [119.7, 3.0],
  [120.4, 6.4],
];
const SUNDALAND: Pt[] = [
  [101.0, 3.0],
  [105.8, -4.0],
  [110.0, -7.0],
  BALI,
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) =>
  a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("next map")) return "bridge";
  if (value.includes("two different animal worlds")) return "worlds";
  if (value.includes("kept populations apart")) return "separated";
  if (value.includes("not magic")) return "exception";
  if (value.includes("carries his name")) return "name";
  if (value.includes("alfred russel wallace")) return "wallace";
  if (value.includes("babirusas and anoas")) return "sulawesi";
  if (value.includes("orangutans live")) return "orangutan";
  if (value.includes("borneo and sulawesi")) return "north";
  if (value.includes("could not simply walk")) return "stopped";
  if (value.includes("stayed deep")) return "depth";
  if (value.includes("sundaland")) return "route";
  if (value.includes("sea levels fell")) return "shelf";
  if (value.includes("australian-style")) return "east";
  if (value.includes("unmistakably asian")) return "west";
  if (value.includes("35 kilometres")) return "distance";
  if (value.includes("cuts through indonesia")) return "region";
  if (value.includes("no wall")) return "empty";
  return "hook";
};

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: 116.0, lat: -7.2, span: 14 },
  empty: { lon: 115.9, lat: -7.9, span: 10 },
  region: { lon: 116.6, lat: -1.5, span: 32 },
  distance: { lon: 115.76, lat: -8.5, span: 5.4 },
  west: { lon: 111.8, lat: -4.0, span: 19 },
  east: { lon: 120.0, lat: -4.0, span: 19 },
  shelf: { lon: 109.6, lat: -2.7, span: 28 },
  route: { lon: 109.8, lat: -3.2, span: 25 },
  depth: { lon: 115.76, lat: -8.5, span: 6.2 },
  stopped: { lon: 115.76, lat: -8.5, span: 7.2 },
  north: { lon: 117.7, lat: 0.0, span: 22 },
  orangutan: { lon: 117.7, lat: 0.0, span: 20 },
  sulawesi: { lon: 121.0, lat: -2.0, span: 15 },
  wallace: { lon: 116.8, lat: -2.0, span: 31 },
  name: { lon: 117.0, lat: -1.5, span: 29 },
  exception: { lon: 115.9, lat: -7.5, span: 12 },
  separated: { lon: 115.8, lat: -7.2, span: 15 },
  worlds: { lon: 117.0, lat: -2.0, span: 31 },
  bridge: { lon: 117.0, lat: -2.0, span: 42 },
  cta: { lon: 117.0, lat: -2.0, span: 46 },
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

const pathCut = (points: Pt[], progress: number) => {
  const count = Math.max(1, Math.ceil(progress * (points.length - 1)));
  const output = points.slice(0, count);
  if (count >= points.length) return points;
  const local = progress * (points.length - 1) - (count - 1);
  const from = points[count - 1];
  const to = points[count];
  return [...output, [lerp(from[0], to[0], local), lerp(from[1], to[1], local)] as Pt];
};

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["INVISIBLE LINE", "ANIMALS STOP HERE", C.gold],
  empty: ["NO WALL · NO FENCE", "Only open water", C.gold],
  region: ["INDONESIA", "A wildlife boundary through the islands", C.east],
  distance: ["ABOUT 35 KM", "Bali ↔ Lombok", C.gold],
  west: ["ASIAN ANIMALS", "Tigers · elephants · orangutans", C.west],
  east: ["AUSTRALASIAN ANIMALS", "Cockatoos · marsupials", C.east],
  shelf: ["ICE-AGE LAND BRIDGES", "Lower seas exposed Sundaland", C.west],
  route: ["ASIA → BALI", "Animals could walk across Sundaland", C.west],
  depth: ["DEEP WATER", "The Lombok Strait stayed flooded", C.east],
  stopped: ["NO LAND BRIDGE", "Many land animals stopped here", C.gold],
  north: ["BORNEO ↔ SULAWESI", "The break continues north", C.east],
  orangutan: ["ORANGUTAN ≠ BABIRUSA", "Nearby islands · different wildlife", C.gold],
  sulawesi: ["SULAWESI", "Babirusa + anoa", C.east],
  wallace: ["A. R. WALLACE", "Naturalist · explorer · 1800s", C.gold],
  name: ["THE WALLACE LINE", "A boundary in animal distribution", C.gold],
  exception: ["NOT A FORCE FIELD", "Some species do cross", C.east],
  separated: ["ISOLATION", "Deep water kept populations apart", C.gold],
  worlds: ["2 ANIMAL WORLDS", "One narrow strait shaped evolution", C.gold],
  bridge: ["GLOBETALES", "The next hidden border is waiting", C.east],
  cta: ["FOLLOW THE MAP", "A new story from our planet", C.gold],
};

const InfoCard: React.FC<{ kind: Kind; localTime: number }> = ({
  kind,
  localTime,
}) => {
  const [title, detail, accent] = COPY[kind];
  const enter = spring({
    frame: Math.round(localTime * 30),
    fps: 30,
    config: { damping: 12, mass: 0.65 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 310,
        left: 44,
        right: 44,
        minHeight: 222,
        padding: "28px 30px 22px",
        borderRadius: 30,
        background: "rgba(255,255,255,.95)",
        border: `6px solid ${C.ink}`,
        boxShadow: `0 14px 0 ${C.ink}`,
        opacity: clamp(enter * 1.5),
        transform: `translateY(${(1 - enter) * -90}px)`,
      }}
    >
      <div
        style={{
          color: accent,
          fontFamily: DISPLAY,
          fontSize: title.length > 20 ? 59 : 76,
          lineHeight: 0.95,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 12,
          color: "#405064",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 32,
          lineHeight: 1.08,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const Animal: React.FC<{
  label: string;
  color: string;
  kind: "cat" | "ape" | "bird" | "pig" | "buffalo";
}> = ({ label, color, kind }) => (
  <div style={{ width: 190, textAlign: "center", filter: "drop-shadow(0 12px 14px rgba(0,0,0,.55))" }}>
    <svg width="190" height="154" viewBox="0 0 160 132">
      {kind === "bird" ? (
        <>
          <path d="M20 88Q72 15 133 60Q94 64 73 98Q44 114 20 88Z" fill={color} stroke={C.ink} strokeWidth="5" />
          <path d="M73 82Q119 90 143 122Q94 119 59 95Z" fill={color} stroke={C.ink} strokeWidth="5" />
          <circle cx="110" cy="56" r="5" fill={C.ink} />
          <path d="M132 61L154 70L132 79Z" fill={C.gold} />
        </>
      ) : kind === "ape" ? (
        <>
          <circle cx="80" cy="76" r="44" fill={color} stroke={C.ink} strokeWidth="5" />
          <circle cx="39" cy="76" r="19" fill={color} />
          <circle cx="121" cy="76" r="19" fill={color} />
          <ellipse cx="80" cy="86" rx="28" ry="24" fill="#f5c996" />
          <circle cx="67" cy="70" r="5" fill={C.ink} />
          <circle cx="93" cy="70" r="5" fill={C.ink} />
        </>
      ) : kind === "pig" ? (
        <>
          <ellipse cx="76" cy="89" rx="55" ry="36" fill={color} stroke={C.ink} strokeWidth="5" />
          <circle cx="124" cy="80" r="27" fill={color} stroke={C.ink} strokeWidth="5" />
          <ellipse cx="143" cy="88" rx="16" ry="11" fill="#f19a9e" />
          <path d="M128 60Q144 22 153 58M120 59Q111 24 102 59" fill="none" stroke={C.white} strokeWidth="7" />
        </>
      ) : kind === "buffalo" ? (
        <>
          <ellipse cx="80" cy="88" rx="50" ry="34" fill={color} stroke={C.ink} strokeWidth="5" />
          <circle cx="80" cy="72" r="29" fill={color} />
          <path d="M58 61Q27 34 21 69M102 61Q133 34 139 69" fill="none" stroke={C.white} strokeWidth="8" />
        </>
      ) : (
        <>
          <circle cx="80" cy="80" r="47" fill={color} stroke={C.ink} strokeWidth="5" />
          <path d="M43 52L31 17L66 40M117 52L129 17L94 40" fill={color} stroke={C.ink} strokeWidth="5" />
          <circle cx="63" cy="72" r="6" fill={C.ink} />
          <circle cx="97" cy="72" r="6" fill={C.ink} />
        </>
      )}
    </svg>
    <div style={{ color: C.white, fontFamily: DISPLAY, fontSize: 36, textShadow: `0 5px 0 ${C.ink}` }}>{label}</div>
  </div>
);

const Marker: React.FC<{
  point: Pt;
  project: (lon: number, lat: number) => Pt;
  label: string;
  color: string;
  reveal: number;
}> = ({ point, project, label, color, reveal }) => {
  const [x, y] = project(point[0], point[1]);
  return (
    <g opacity={clamp(reveal * 1.5)} transform={`translate(0 ${(1 - reveal) * -150})`}>
      <path d={`M${x} ${y}c0 0-25-31-25-53a25 25 0 1 1 50 0c0 22-25 53-25 53Z`} fill={C.ink} stroke={C.white} strokeWidth="4" />
      <circle cx={x} cy={y - 53} r="10" fill={color} />
      <text x={x} y={y - 88} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="38" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>{label}</text>
    </g>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = [
    "invisible line",
    "no wall",
    "cuts through indonesia",
    "35 kilometres",
    "unmistakably asian",
    "australian-style",
    "sea levels fell",
    "sundaland",
    "stayed deep",
    "could not simply walk",
    "borneo and sulawesi",
    "orangutans live",
    "babirusas and anoas",
    "alfred russel wallace",
    "carries his name",
    "not magic",
    "kept populations apart",
    "two different animal worlds",
    "next map",
    "please like",
  ];
  return expected.filter(
    (needle) => !sections.some((section) => section.text.toLowerCase().includes(needle)),
  );
};

const WallaceLineSceneSat: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 1.5 : frame / fps;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section.text);
  const view = thumbnail ? VIEWS.hook : cameraAt(timing.sections, time);
  const { project } = makeSatProjector(view, width, height, 0.57);
  const localTime = time - section.start;
  const reveal = thumbnail ? 1 : ease(clamp(localTime / 0.9));
  const progress = ease(clamp(localTime / Math.max(0.8, section.end - section.start)));
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const d = (points: Pt[]) =>
    points.map((point, i) => `${i ? "L" : "M"}${project(point[0], point[1]).join(",")}`).join(" ");
  const lineProgress = ["hook", "empty", "region"].includes(kind) ? progress : 1;
  const westAnimals = ["hook", "west", "route", "stopped", "orangutan", "worlds"].includes(kind);
  const eastAnimals = ["hook", "east", "stopped", "orangutan", "sulawesi", "exception", "worlds"].includes(kind);
  const showNorth = ["north", "orangutan", "sulawesi"].includes(kind);

  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        anchorY={0.57}
        darken={thumbnail ? 0.25 : kind === "cta" ? 0.38 : 0.15}
        highlights={[
          {
            geom: countryGeom("IDN"),
            label: "Indonesia",
            labelAt: [119, -4],
            fill: "rgba(255,190,20,.38)",
          },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="wallaceSatGlow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {kind === "shelf" && (
            <path d={d([[95, 6], [108, 7], [114, 2], [115.6, -8.5], [106, -9], [98, -3], [95, 6]])} fill={C.west} opacity={0.34 + 0.22 * reveal} stroke={C.west} strokeWidth="6" strokeDasharray="20 12" />
          )}
          <path d={d(pathCut(WALLACE, lineProgress))} fill="none" stroke="rgba(255,210,50,.32)" strokeWidth="28" strokeLinecap="round" filter="url(#wallaceSatGlow)" />
          <path d={d(pathCut(WALLACE, lineProgress))} fill="none" stroke={C.gold} strokeWidth="9" strokeLinecap="round" strokeDasharray="22 12" />
          {kind === "route" && <path d={d(pathCut(SUNDALAND, progress))} fill="none" stroke={C.west} strokeWidth="12" strokeDasharray="24 14" strokeLinecap="round" />}
          {kind === "distance" && (
            <>
              <line x1={project(...BALI)[0]} y1={project(...BALI)[1]} x2={project(...LOMBOK)[0]} y2={project(...LOMBOK)[1]} stroke={C.gold} strokeWidth="9" strokeDasharray="16 10" />
              <Marker point={BALI} project={project} label="BALI" color={C.west} reveal={reveal} />
              <Marker point={LOMBOK} project={project} label="LOMBOK" color={C.east} reveal={reveal} />
            </>
          )}
          {showNorth && (
            <>
              <Marker point={BORNEO} project={project} label="BORNEO" color={C.west} reveal={reveal} />
              <Marker point={SULAWESI} project={project} label="SULAWESI" color={C.east} reveal={reveal} />
            </>
          )}
        </svg>

        {!thumbnail && <InfoCard kind={kind} localTime={localTime} />}
        {!thumbnail && kind === "depth" && (
          <div style={{ position: "absolute", left: 70, right: 70, bottom: 280, height: 650, borderRadius: 30, overflow: "hidden", background: "linear-gradient(#207ba5,#041a2a)", border: `6px solid ${C.white}`, boxShadow: `0 14px 0 ${C.ink}` }}>
            <svg width="100%" height="100%" viewBox="0 0 940 650">
              <path d="M0 180Q170 140 320 210L410 480Q470 620 535 480L630 210Q790 140 940 185V650H0Z" fill="#9b7654" stroke="#eadfc7" strokeWidth="9" />
              <path d="M422 450Q470 615 525 450" fill="none" stroke={C.east} strokeWidth="18" />
              <text x="205" y="125" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="68">BALI</text>
              <text x="745" y="125" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="68">LOMBOK</text>
              <text x="470" y="610" textAnchor="middle" fill={C.east} fontFamily={DISPLAY} fontSize="60">DEEP STRAIT</text>
            </svg>
          </div>
        )}
        {!thumbnail && westAnimals && (
          <div style={{ position: "absolute", left: 72, top: 850, opacity: clamp(reveal * 1.5), transform: `translateX(${(1 - reveal) * -160}px)` }}>
            <Animal label={kind === "orangutan" ? "ORANGUTAN" : "TIGER"} color={C.west} kind={kind === "orangutan" ? "ape" : "cat"} />
          </div>
        )}
        {!thumbnail && eastAnimals && (
          <div style={{ position: "absolute", right: 65, top: kind === "sulawesi" ? 910 : 850, display: "flex", gap: 6, opacity: clamp(reveal * 1.5), transform: `translateX(${(1 - reveal) * 160}px)` }}>
            <Animal label={kind === "sulawesi" || kind === "orangutan" ? "BABIRUSA" : "COCKATOO"} color={C.east} kind={kind === "sulawesi" || kind === "orangutan" ? "pig" : "bird"} />
            {kind === "sulawesi" && <Animal label="ANOA" color={C.green} kind="buffalo" />}
          </div>
        )}
        {!thumbnail && kind === "wallace" && (
          <div style={{ position: "absolute", left: 125, right: 125, top: 720, padding: 42, borderRadius: 30, background: "#f3e6c8", border: `7px solid ${C.ink}`, boxShadow: `0 16px 0 ${C.ink}`, transform: `rotate(${(1 - reveal) * -7}deg) scale(${0.86 + reveal * 0.14})` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 70, color: C.ink }}>FIELD NOTES · 1800s</div>
            <div style={{ marginTop: 25, height: 285, display: "grid", placeItems: "center" }}>
              <svg width="330" height="280" viewBox="0 0 330 280">
                <circle cx="165" cy="90" r="67" fill="#d5a47c" stroke={C.ink} strokeWidth="8" />
                <path d="M98 89Q108 13 166 16Q230 23 233 97Q201 57 166 58Q127 56 98 89Z" fill="#594031" />
                <path d="M123 116Q165 151 207 116M143 91H153M177 91H187" fill="none" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
                <path d="M62 270Q74 162 165 162Q256 162 268 270Z" fill="#485b67" stroke={C.ink} strokeWidth="8" />
              </svg>
            </div>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 37, color: "#584936", textAlign: "center" }}>ALFRED RUSSEL WALLACE</div>
          </div>
        )}
        {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1435} />}
        {!thumbnail && time >= ctaTime && <CtaCard T={time} top={1120} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />}
        {!thumbnail && missingCues(timing.sections).length > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 820, padding: 25, background: "#e63946", color: C.white, fontFamily: BODY, fontWeight: 900, fontSize: 36, textAlign: "center" }}>
            MISSING CUES: {missingCues(timing.sections).join(", ")}
          </div>
        )}

        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,10,18,.92),rgba(3,10,18,.08) 55%,rgba(3,10,18,.86))" }} />
            <div style={{ position: "absolute", left: 42, right: 42, top: 320, color: C.white, fontFamily: DISPLAY, fontSize: 122, lineHeight: 0.88, textAlign: "center", WebkitTextStroke: `10px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${C.ink}` }}>
              ANIMALS REFUSE<br /><span style={{ color: C.gold }}>TO CROSS!</span>
            </div>
            <div style={{ position: "absolute", left: 62, top: 850 }}><Animal label="TIGER" color={C.west} kind="cat" /></div>
            <div style={{ position: "absolute", right: 55, top: 850 }}><Animal label="COCKATOO" color={C.east} kind="bird" /></div>
            <div style={{ position: "absolute", left: 140, right: 140, top: 1310, height: 100, borderRadius: 50, background: C.gold, border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 51, display: "flex", alignItems: "center", justifyContent: "center" }}>
              NO WALL · NO FENCE
            </div>
            <div style={{ position: "absolute", left: 50, right: 50, top: 1430, color: C.white, fontFamily: BODY, fontWeight: 1000, fontSize: 34, textAlign: "center", letterSpacing: 2 }}>THE WALLACE LINE · INDONESIA</div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const WallaceLineVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.9, "boom", 0.22],
    [first("distance"), "ding", 0.18],
    [first("east"), "whoosh", 0.15],
    [first("depth"), "boom", 0.19],
    [first("north"), "whoosh", 0.17],
    [first("name"), "ding", 0.18],
    [first("worlds"), "boom", 0.22],
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
      <WallaceLineSceneSat timing={timing} />
    </AbsoluteFill>
  );
};

export const WallaceLineThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => (
  <WallaceLineSceneSat timing={timing} thumbnail />
);
