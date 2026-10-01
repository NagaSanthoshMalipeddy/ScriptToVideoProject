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
import { BackgroundBeat } from "../cartoon/WithCover";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import {
  countryGeom,
  makeSatProjector,
  SatelliteMap,
  type SatView,
} from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Scene =
  | "hook"
  | "split"
  | "invasion"
  | "busan"
  | "incheon"
  | "china"
  | "stalemate"
  | "armistice"
  | "dmz"
  | "people"
  | "contrast"
  | "aha"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ink: "#05080f",
  gold: "#ffd23f",
  red: "#ff4d5e",
  blue: "#4da3ff",
  orange: "#ff9a4d",
  cyan: "#9fd8ff",
  white: "#ffffff",
};

const SEOUL: Pt = [126.978, 37.5665];
const PYONGYANG: Pt = [125.7625, 39.0392];
const BUSAN: Pt = [129.0756, 35.1796];
const INCHEON: Pt = [126.7052, 37.4563];
const PANMUNJOM: Pt = [126.676, 37.956];
const YALU: Pt = [125.7, 40.8];

const VIEWS: Record<Scene, SatView> = {
  hook: { lon: 127.7, lat: 38.1, span: 35 },
  split: { lon: 127.2, lat: 38.2, span: 18 },
  invasion: { lon: 127.2, lat: 38.1, span: 10 },
  busan: { lon: 128.2, lat: 36.0, span: 11 },
  incheon: { lon: 126.8, lat: 37.6, span: 8 },
  china: { lon: 126.5, lat: 40.0, span: 20 },
  stalemate: { lon: 127.4, lat: 38.2, span: 15 },
  armistice: { lon: 126.9, lat: 38.0, span: 7 },
  dmz: { lon: 127.2, lat: 38.0, span: 10 },
  people: { lon: 127.4, lat: 38.0, span: 18 },
  contrast: { lon: 127.4, lat: 38.1, span: 24 },
  aha: { lon: 127.7, lat: 38.1, span: 32 },
  cta: { lon: 128.0, lat: 38.2, span: 42 },
};

const sceneOf = (text: string): Scene => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (
    s.includes("surprising truth") ||
    s.includes("shocking answer") ||
    s.includes("literally fighting") ||
    s.includes("why are north") ||
    s.includes("one peninsula")
  )
    return "aha";
  if (
    s.includes("economic") ||
    s.includes("nuclear") ||
    s.includes("developed in radically") ||
    s.includes("south korea became") ||
    s.includes("north korea remained") ||
    s.includes("summits") ||
    s.includes("missile tests")
  )
    return "contrast";
  if (s.includes("famil") || s.includes("relatives")) return "people";
  if (s.includes("demilitarized") || s.includes("250 kilometres") || s.includes("4 kilometres") || s.includes("panmunjom"))
    return "dmz";
  if (s.includes("armistice") || s.includes("july 27, 1953") || s.includes("south korea did not sign"))
    return "armistice";
  if (s.includes("stalemate") || s.includes("peace talks") || s.includes("2 more years") || s.includes("prisoners"))
    return "stalemate";
  if (s.includes("china") || s.includes("chinese") || s.includes("yalu")) return "china";
  if (s.includes("incheon") || s.includes("seoul was retaken") || s.includes("captured pyongyang")) return "incheon";
  if (s.includes("busan") || s.includes("pusan") || s.includes("controlled most")) return "busan";
  if (s.includes("june 25") || s.includes("crossed south") || s.includes("seoul fell")) return "invasion";
  if (
    s.includes("1945") ||
    s.includes("1948") ||
    s.includes("38th parallel") ||
    s.includes("soviet") ||
    s.includes("japan") ||
    s.includes("rival government") ||
    s.includes("kim il sung") ||
    s.includes("syngman")
  )
    return "split";
  return "hook";
};

const activeIndex = (sections: Section[], T: number) => {
  let index = 0;
  for (let i = 0; i < sections.length; i++) if (T >= sections[i].start) index = i;
  return index;
};

const cameraAt = (sections: Section[], T: number): SatView => {
  const i = activeIndex(sections, T);
  const current = sections[i] ?? sections[0];
  const from = VIEWS[sceneOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = VIEWS[sceneOf(current?.text ?? "")];
  const p = ease(clamp((T - (current?.start ?? 0)) / 1.65));
  const bump = Math.max(from.span, to.span) * (1 + 0.12 * Math.sin(Math.PI * p));
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span:
      p < 0.5
        ? from.span * Math.pow(bump / from.span, p * 2)
        : bump * Math.pow(to.span / bump, (p - 0.5) * 2),
  };
};

const COPY: Record<Scene, [string, string, string]> = {
  hook: ["STILL AT WAR?", "70+ years after the guns fell quiet", C.gold],
  split: ["ONE KOREA DIVIDED", "1945 → 38th parallel → 2 governments", C.cyan],
  invasion: ["JUNE 25, 1950", "North Korean forces cross south", C.red],
  busan: ["PUSAN PERIMETER", "The defenders hold the southeast", C.blue],
  incheon: ["THE INCHEON REVERSAL", "The front races north", C.blue],
  china: ["CHINA ENTERS", "The front sweeps south again", C.orange],
  stalemate: ["STALEMATE", "Talks begin while fighting continues", C.gold],
  armistice: ["JULY 27, 1953", "Armistice signed · no peace treaty", C.gold],
  dmz: ["THE DMZ", "About 250 km long · roughly 4 km wide", C.cyan],
  people: ["FAMILIES DIVIDED", "A border became a lifetime", C.white],
  contrast: ["ONE PENINSULA · TWO STATES", "Seoul ↔ Pyongyang", C.gold],
  aha: ["WAR PAUSED, NOT ENDED", "Armistice ≠ peace treaty", C.gold],
  cta: ["GLOBETALES", "History hidden in every border", C.gold],
};

const marker = (
  point: Pt,
  project: (lon: number, lat: number) => Pt,
  label: string,
  color: string,
  reveal: number,
) => {
  const [x, y] = project(point[0], point[1]);
  return (
    <g opacity={clamp(reveal * 1.5)} transform={`translate(0 ${(1 - reveal) * -90})`}>
      <circle cx={x} cy={y} r={18} fill={color} stroke="#fff" strokeWidth={5} />
      <circle cx={x} cy={y} r={34} fill="none" stroke={color} strokeWidth={4} opacity={0.65} />
      <text
        x={x + 28}
        y={y - 28}
        fill="#fff"
        fontFamily={BODY}
        fontWeight={900}
        fontSize={26}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}
      >
        {label}
      </text>
    </g>
  );
};

const line = (
  points: Pt[],
  project: (lon: number, lat: number) => Pt,
  color: string,
  reveal: number,
  dashed = false,
) => {
  const projected = points.map(([lon, lat]) => project(lon, lat));
  return (
    <polyline
      points={projected.map(([x, y]) => `${x},${y}`).join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={10}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "24 16" : `${reveal * 2400} 2400`}
      opacity={0.9}
      style={{ filter: `drop-shadow(0 0 9px ${color})` }}
    />
  );
};

const InfoCard: React.FC<{
  scene: Scene;
  localTime: number;
  landscape: boolean;
}> = ({ scene, localTime, landscape }) => {
  const [title, detail, accent] = COPY[scene];
  const pop = spring({
    frame: Math.round(localTime * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: landscape ? 70 : 46,
        width: landscape ? 620 : 988,
        top: landscape ? 70 : 300,
        minHeight: landscape ? 190 : 225,
        boxSizing: "border-box",
        padding: landscape ? "25px 30px" : "30px 32px",
        background: "rgba(5,8,15,0.88)",
        border: `4px solid ${accent}`,
        borderRadius: 24,
        boxShadow: `0 0 34px ${accent}55, 0 14px 38px rgba(0,0,0,.55)`,
        opacity: clamp(pop * 1.4),
        transform: `translateY(${(1 - pop) * -70}px)`,
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: landscape ? (title.length > 20 ? 60 : 72) : title.length > 22 ? 66 : 80,
          lineHeight: 0.95,
          color: accent,
          letterSpacing: 1,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 15,
          fontFamily: BODY,
          fontWeight: 750,
          fontSize: landscape ? 27 : 34,
          lineHeight: 1.15,
          color: "#fff",
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const FlagPair: React.FC<{ landscape: boolean }> = ({ landscape }) => (
  <div
    style={{
      position: "absolute",
      right: landscape ? 82 : 70,
      bottom: landscape ? 70 : 310,
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: 16,
      background: "rgba(5,8,15,.82)",
      borderRadius: 20,
      border: `2px solid ${C.gold}`,
    }}
  >
    <div style={{ width: 116, height: 72, background: "linear-gradient(#024fa2 0 18%,#fff 18% 22%,#ed1c27 22% 78%,#fff 78% 82%,#024fa2 82%)", border: "3px solid #fff" }} />
    <div style={{ fontFamily: DISPLAY, fontSize: 42, color: C.gold }}>VS</div>
    <div style={{ width: 116, height: 72, background: "#fff", border: "3px solid #fff", position: "relative" }}>
      <div style={{ position: "absolute", width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(#cd2e3a 50%,#0047a0 50%)", left: 41, top: 19 }} />
    </div>
  </div>
);

export const KoreanPeninsulaVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const T = frame / fps;
  const landscape = width > height;
  const i = activeIndex(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const scene = sceneOf(section?.text ?? "");
  const view = cameraAt(timing.sections, T);
  const { project } = makeSatProjector(view, width, height);
  const local = T - (section?.start ?? 0);
  const reveal = ease(clamp(local / 1.6));
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec - 6;
  const findWord = (word: string, fallback: number) =>
    cta?.words.find((w) => w.word.toLowerCase().replace(/[^a-z]/g, "") === word)?.start ?? fallback;
  const likeT = findWord("like", ctaT + 1);
  const shareT = findWord("share", ctaT + 1.7);
  const subT = findWord("subscribe", ctaT + 2.4);
  const invasionRoute: Pt[] = [PYONGYANG, [126.7, 38.2], SEOUL, [127.7, 36.6], BUSAN];
  const unRoute: Pt[] = [INCHEON, SEOUL, [126.4, 38.5], PYONGYANG, YALU];
  const chinaRoute: Pt[] = [YALU, [126.3, 39.8], [127.0, 38.4], SEOUL];
  const dmz: Pt[] = [[124.2, 38.05], [125.8, 38.0], PANMUNJOM, [127.8, 38.28], [129.7, 38.6]];
  const activeRoute =
    scene === "invasion" || scene === "busan"
      ? [invasionRoute, C.red] as const
      : scene === "incheon"
        ? [unRoute, C.blue] as const
        : scene === "china"
          ? [chinaRoute, C.orange] as const
          : null;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {landscape && <BackgroundBeat />}
      <Audio src={staticFile(timing.audio)} volume={1} />
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        darken={scene === "cta" ? 0.42 : 0.27}
        highlights={[
          { geom: countryGeom("PRK"), label: "North Korea", labelAt: [127.1, 40.2], fill: "rgba(255,77,94,.42)", stroke: C.red },
          { geom: countryGeom("KOR"), label: "South Korea", labelAt: [127.8, 36.1], fill: "rgba(77,163,255,.42)", stroke: C.blue },
          ...(scene === "china" ? [{ geom: countryGeom("CHN"), label: "China", labelAt: [123.5, 41.5] as Pt, fill: "rgba(255,154,77,.35)", stroke: C.orange }] : []),
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {(scene === "split" || scene === "invasion") &&
            line([[123.3, 38], [131.5, 38]], project, C.white, reveal, true)}
          {activeRoute && line(activeRoute[0], project, activeRoute[1], reveal)}
          {["stalemate", "armistice", "dmz", "people", "contrast", "aha", "cta"].includes(scene) &&
            line(dmz, project, C.gold, reveal, true)}
          {marker(SEOUL, project, "SEOUL", C.blue, reveal)}
          {marker(PYONGYANG, project, "PYONGYANG", C.red, reveal)}
          {scene === "busan" && marker(BUSAN, project, "BUSAN", C.blue, reveal)}
          {scene === "incheon" && marker(INCHEON, project, "INCHEON", C.gold, reveal)}
          {(scene === "armistice" || scene === "dmz") && marker(PANMUNJOM, project, "PANMUNJOM", C.gold, reveal)}
        </svg>
      </SatelliteMap>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 52% 52%, transparent 42%, rgba(0,0,0,.64) 100%)" }} />
      <InfoCard scene={scene} localTime={local} landscape={landscape} />
      {(scene === "hook" || scene === "contrast" || scene === "aha") && <FlagPair landscape={landscape} />}
      <SubscribeNudge T={T} until={ctaT} top={landscape ? 70 : 565} />
      {T >= ctaT && <CtaCard T={T} likeT={likeT} shareT={shareT} subT={subT} top={landscape ? 470 : 1120} />}
      {nudgeTimes(ctaT).map((t) => (
        <Sequence key={t} from={Math.round((t + 1.1) * fps)} durationInFrames={Math.round(0.8 * fps)}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.18} />
        </Sequence>
      ))}
      {[
        [0.15, "boom", 0.2],
        [timing.sections.find((s) => sceneOf(s.text) === "invasion")?.start ?? 20, "boom", 0.22],
        [timing.sections.find((s) => sceneOf(s.text) === "incheon")?.start ?? 35, "whoosh", 0.2],
        [timing.sections.find((s) => sceneOf(s.text) === "armistice")?.start ?? 55, "ding", 0.22],
        [ctaT, "pop", 0.2],
      ].map(([t, name, volume], key) => (
        <Sequence key={key} from={Math.max(0, Math.round(Number(t) * fps))} durationInFrames={Math.round(1.1 * fps)}>
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={Number(volume)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const KoreanPeninsulaThumb: React.FC<{ timing: Timing }> = () => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const view: SatView = landscape
    ? { lon: 127.7, lat: 38.1, span: 35 }
    : { lon: 127.7, lat: 38.1, span: 26 };
  const { project } = makeSatProjector(view, width, height);
  const dmz: Pt[] = [[124.2, 38.05], [125.8, 38.0], PANMUNJOM, [127.8, 38.28], [129.7, 38.6]];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        darken={0.34}
        highlights={[
          { geom: countryGeom("PRK"), label: "North Korea", labelAt: [127.1, 40.2], fill: "rgba(255,77,94,.52)", stroke: C.red },
          { geom: countryGeom("KOR"), label: "South Korea", labelAt: [127.8, 36.1], fill: "rgba(77,163,255,.52)", stroke: C.blue },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {line(dmz, project, C.gold, 1, true)}
        </svg>
      </SatelliteMap>
      <AbsoluteFill style={{ background: landscape ? "linear-gradient(90deg,rgba(3,5,10,.96) 0%,rgba(3,5,10,.72) 42%,transparent 74%)" : "linear-gradient(180deg,rgba(3,5,10,.94) 0%,rgba(3,5,10,.15) 50%,rgba(3,5,10,.88) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: landscape ? 70 : 54,
          right: landscape ? 860 : 54,
          top: landscape ? 105 : 330,
          textAlign: landscape ? "left" : "center",
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 136 : 128, lineHeight: 0.92, color: "#fff", textShadow: "0 7px 0 #000,0 0 30px #000" }}>
          70+ YEARS
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 122 : 120, lineHeight: 0.95, color: C.gold, textShadow: "0 7px 0 #000,0 0 30px #000" }}>
          STILL AT WAR!
        </div>
        <div style={{ display: "inline-block", marginTop: 34, padding: "10px 24px", border: `4px solid ${C.red}`, background: "rgba(5,8,15,.9)", color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: landscape ? 38 : 42 }}>
          ARMISTICE ≠ PEACE
        </div>
      </div>
      <div style={{ position: "absolute", left: landscape ? 80 : 100, right: landscape ? 960 : 100, bottom: landscape ? 80 : 350 }}>
        <FlagPair landscape={landscape} />
      </div>
    </AbsoluteFill>
  );
};
