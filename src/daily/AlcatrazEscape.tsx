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
type Scene =
  | "hook"
  | "island"
  | "cell"
  | "dummy"
  | "workshop"
  | "night"
  | "route"
  | "search"
  | "mystery"
  | "aha"
  | "cta";

const ALCATRAZ: Pt = [-122.423, 37.8267];
const ANGEL: Pt = [-122.4326, 37.8609];
const GOLDEN_GATE: Pt = [-122.4783, 37.8199];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const C = {
  ink: "#06131f",
  navy: "#0a2438",
  gold: "#ffd23f",
  cyan: "#63dcff",
  red: "#ff5b5b",
  green: "#43d59a",
  white: "#ffffff",
  steel: "#8094a5",
};

const includesAny = (text: string, words: string[]) =>
  words.some((word) => text.includes(word));

const sceneOf = (raw: string): Scene => {
  const text = raw.toLowerCase();
  if (text.includes("please like")) return "cta";
  if (includesAny(text, ["key to the alcatraz", "escape the prison building", "question 1", "question 2", "definitely escaped alcatraz", "proven escape"])) return "aha";
  if (includesAny(text, ["likely drowned", "no bodies", "no body", "unknown", "unproven", "not the same as proven", "question mark", "unsolved mystery", "no verified trace", "no final physical"])) return "mystery";
  if (includesAny(text, ["massive search", "locked down", "fbi", "1979", "marshals", "evidence", "paddle", "aircraft scanned"])) return "search";
  if (includesAny(text, ["angel island", "tides", "currents", "pushed into", "dark water", "disappeared into", "route"])) return "route";
  if (includesAny(text, ["june 11", "dummies took", "climbed out", "reached the roof", "rooftops", "northeast shore", "launch point"])) return "night";
  if (includesAny(text, ["raincoat", "raft", "life vest", "hand pump", "paddles", "6 feet", "14 feet", "secret workshop", "above the cells"])) return "workshop";
  if (includesAny(text, ["dummy", "dummies", "real hair", "barbershop", "pillows", "soap, paper"])) return "dummy";
  if (includesAny(text, ["vents", "vent opening", "rear wall", "spoons", "painted cardboard", "music hour", "utility corridor", "wall openings", "allen west", "blocked opening"])) return "cell";
  if (includesAny(text, ["alcatraz was", "island prison", "2 kilometres", "1934", "natural wall", "final wall"])) return "island";
  if (includesAny(text, ["history sometimes", "some escapes end"])) return "cta";
  return "hook";
};

const activeIndex = (sections: Section[], time: number) => {
  let index = 0;
  sections.forEach((section, candidate) => {
    if (time >= section.start) index = candidate;
  });
  return index;
};

const views = (landscape: boolean): Record<"wide" | "close" | "route", SatView> => ({
  wide: landscape
    ? { lon: -122.43, lat: 37.83, span: 0.36 }
    : { lon: -122.43, lat: 37.83, span: 0.2 },
  close: landscape
    ? { lon: -122.423, lat: 37.827, span: 0.12 }
    : { lon: -122.423, lat: 37.827, span: 0.075 },
  route: landscape
    ? { lon: -122.435, lat: 37.84, span: 0.23 }
    : { lon: -122.435, lat: 37.84, span: 0.14 },
});

const targetView = (scene: Scene, landscape: boolean) => {
  const v = views(landscape);
  if (scene === "route" || scene === "search" || scene === "mystery" || scene === "cta") return v.route;
  if (scene === "hook" || scene === "island" || scene === "aha") return v.wide;
  return v.close;
};

const cameraAt = (sections: Section[], time: number, landscape: boolean): SatView => {
  const index = activeIndex(sections, time);
  const section = sections[index] ?? sections[0];
  const from = targetView(sceneOf(sections[Math.max(0, index - 1)]?.text ?? ""), landscape);
  const to = targetView(sceneOf(section?.text ?? ""), landscape);
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.4));
  const bump = Math.max(from.span, to.span) * (1 + 0.18 * Math.sin(Math.PI * p));
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span: p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2),
  };
};

const COPY: Record<Scene, [string, string, string]> = {
  hook: ["ESCAPE FROM ALCATRAZ", "3 prisoners · 1 homemade raft", C.gold],
  island: ["THE ROCK", "37.8267° N · 122.4230° W", C.cyan],
  cell: ["A HOLE BEHIND THE SINK", "Simple tools · months of patience", C.gold],
  dummy: ["THE NIGHT-COUNT TRICK", "Paper · soap · dust · real hair", C.cyan],
  workshop: ["50+ RAINCOATS", "Raft · life vests · pump · paddles", C.gold],
  night: ["JUNE 11, 1962", "Cell → roof → northeast shore", C.red],
  route: ["INTO SAN FRANCISCO BAY", "Planned route toward Angel Island", C.cyan],
  search: ["THE SEARCH", "Clues found · no confirmed ending", C.red],
  mystery: ["LIKELY IS NOT PROVEN", "No bodies · no verified survival", C.gold],
  aha: ["PRISON ESCAPE: PROVEN", "Escape from the bay: unknown", C.green],
  cta: ["GLOBETALES", "History leaves clues, not always answers", C.gold],
};

const Header: React.FC<{ scene: Scene; local: number; landscape: boolean }> = ({ scene, local, landscape }) => {
  const [title, detail, accent] = COPY[scene];
  const p = spring({ frame: Math.round(local * 30), fps: 30, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{
      position: "absolute",
      left: landscape ? 70 : 44,
      right: landscape ? undefined : 44,
      width: landscape ? 760 : "auto",
      top: landscape ? 62 : 310,
      padding: landscape ? "24px 30px 20px" : "28px 32px 24px",
      borderRadius: 26,
      border: `5px solid ${accent}`,
      background: "rgba(4,12,21,.9)",
      boxShadow: `0 0 34px ${accent}55,0 12px 36px rgba(0,0,0,.55)`,
      transform: `translateY(${(1 - p) * -70}px)`,
      opacity: clamp(p * 1.4),
      textAlign: landscape ? "left" : "center",
    }}>
      <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 68 : title.length > 20 ? 68 : 82, lineHeight: 0.94, color: accent }}>
        {title}
      </div>
      <div style={{ marginTop: 12, fontFamily: BODY, fontSize: landscape ? 27 : 33, fontWeight: 850, color: C.white }}>
        {detail}
      </div>
    </div>
  );
};

const Pin: React.FC<{ point: Pt; project: (lon: number, lat: number) => Pt; label: string; color: string; pulse: number }> = ({ point, project, label, color, pulse }) => {
  const [x, y] = project(...point);
  return (
    <g>
      <circle cx={x} cy={y} r={16} fill={color} stroke={C.white} strokeWidth={5} />
      <circle cx={x} cy={y} r={28 + 9 * Math.sin(pulse * 5)} fill="none" stroke={color} strokeWidth={4} opacity={0.7} />
      <text x={x + 25} y={y - 20} fill={C.white} fontFamily={BODY} fontWeight={900} fontSize={25} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>
        {label}
      </text>
    </g>
  );
};

const routePath = (a: Pt, b: Pt, project: (lon: number, lat: number) => Pt, p: number) => {
  const [x1, y1] = project(...a);
  const [x2, y2] = project(...b);
  const cx = (x1 + x2) / 2 + 55;
  const cy = Math.min(y1, y2) - 55;
  return (
    <path
      d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`}
      fill="none"
      stroke={C.gold}
      strokeWidth={8}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={`${clamp(p)} 1`}
      style={{ filter: `drop-shadow(0 0 9px ${C.gold})` }}
    />
  );
};

const Raft: React.FC<{ x: number; y: number; scale?: number; tilt?: number }> = ({ x, y, scale = 1, tilt = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${tilt})`}>
    <ellipse cx={0} cy={24} rx={112} ry={28} fill="rgba(0,0,0,.35)" />
    <path d="M-105 0 Q-85-32 0-35 Q85-32 105 0 L84 46 H-84Z" fill="#627a47" stroke={C.ink} strokeWidth={8} />
    {[-68, -34, 0, 34, 68].map((dx) => <path key={dx} d={`M${dx - 17} -25 Q${dx} -37 ${dx + 17} -25 L${dx + 15} 35 H${dx - 15}Z`} fill="#7f965b" stroke="#435133" strokeWidth={4} />)}
    <path d="M-128 -50 L98 70 M-104 64 L126 -54" stroke="#d4b16d" strokeWidth={10} strokeLinecap="round" />
  </g>
);

const MapStage: React.FC<{ timing: Timing; scene: Scene; local: number; time: number; thumbnail?: boolean }> = ({ timing, scene, local, time, thumbnail = false }) => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const view = thumbnail
    ? landscape
      ? { lon: -122.43, lat: 37.837, span: 0.26 }
      : { lon: -122.43, lat: 37.837, span: 0.17 }
    : cameraAt(timing.sections, time, landscape);
  const anchorY = landscape ? 0.55 : 0.58;
  const { project } = makeSatProjector(view, width, height, anchorY);
  const p = ease(clamp(local / 2));
  const [ax, ay] = project(...ALCATRAZ);
  const [gx, gy] = project(...GOLDEN_GATE);
  const [rx1, ry1] = project(...ALCATRAZ);
  const [rx2, ry2] = project(...ANGEL);
  const raftX = lerp(rx1, rx2, p);
  const raftY = lerp(ry1, ry2, p) - Math.sin(Math.PI * p) * 42;
  return (
    <SatelliteMap
      view={view}
      width={width}
      height={height}
      anchorY={anchorY}
      darken={thumbnail ? 0.3 : scene === "cta" ? 0.52 : 0.24}
      highlights={[{
        geom: countryGeom("USA"),
        label: "United States",
        labelAt: [-122.47, 37.79],
        labelSize: landscape ? 19 : 17,
        fill: "rgba(255,190,20,.2)",
      }]}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="alGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {(scene === "route" || scene === "search" || scene === "mystery" || scene === "aha" || scene === "cta" || thumbnail) && routePath(ALCATRAZ, ANGEL, project, thumbnail ? 0.8 : p)}
        <Pin point={ALCATRAZ} project={project} label="ALCATRAZ" color={C.red} pulse={time} />
        {(scene === "route" || scene === "search" || thumbnail) && <Pin point={ANGEL} project={project} label="ANGEL ISLAND" color={C.cyan} pulse={time + 1} />}
        {(scene === "route" || thumbnail) && <Raft x={thumbnail ? lerp(rx1, rx2, 0.48) : raftX} y={thumbnail ? lerp(ry1, ry2, 0.48) : raftY} scale={landscape ? 0.64 : 0.5} tilt={-12} />}
        {scene === "search" && [0, 1, 2].map((n) => <circle key={n} cx={ax} cy={ay} r={80 + n * 95 + (local * 34) % 90} fill="none" stroke={n === 1 ? C.red : C.cyan} strokeWidth={5} opacity={0.7 - n * 0.15} />)}
        {scene === "mystery" && <text x={(ax + gx) / 2} y={(ay + gy) / 2} textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize={landscape ? 190 : 230} style={{ filter: `drop-shadow(0 0 15px ${C.ink})` }}>?</text>}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 54%,transparent 36%,rgba(0,0,0,.64) 100%)" }} />
    </SatelliteMap>
  );
};

const CellStage: React.FC<{ scene: Scene; local: number }> = ({ scene, local }) => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const p = ease(clamp(local / 1.4));
  const floor = landscape ? 860 : 1590;
  const cellTop = landscape ? 230 : 610;
  const left = landscape ? 190 : 75;
  const cellW = landscape ? 470 : 430;
  const gap = landscape ? 40 : 25;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0b1c2c,#07111b)", overflow: "hidden" }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="cellWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#596875" /><stop offset="1" stopColor="#273642" /></linearGradient>
          <filter id="cellGlow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={width} height={height} fill="#07131f" />
        <rect y={floor} width={width} height={height - floor} fill="#101922" />
        {[0, 1, 2].map((n) => {
          const x = left + n * (cellW + gap);
          const narrowW = landscape ? cellW : 280;
          const actualX = landscape ? x : 75 + n * 315;
          return (
            <g key={n}>
              <rect x={actualX} y={cellTop} width={narrowW} height={floor - cellTop} fill="url(#cellWall)" stroke={C.steel} strokeWidth={8} />
              {Array.from({ length: 6 }, (_, i) => <line key={i} x1={actualX + 34 + i * ((narrowW - 68) / 5)} y1={cellTop} x2={actualX + 34 + i * ((narrowW - 68) / 5)} y2={floor} stroke="#111820" strokeWidth={12} />)}
              <rect x={actualX + narrowW * 0.56} y={floor - 150} width={narrowW * 0.28} height={90} rx={16} fill={C.ink} stroke={scene === "cell" ? C.gold : C.steel} strokeWidth={7} />
              <rect x={actualX + 22} y={floor - 170} width={narrowW * 0.46} height={80} rx={12} fill="#8292a0" />
              {(scene === "dummy" || scene === "night") && <circle cx={actualX + 75} cy={floor - 176} r={32} fill="#d5b196" stroke={C.ink} strokeWidth={6} />}
            </g>
          );
        })}
        {scene === "cell" && (
          <>
            <path d={`M${width * 0.57} ${floor - 105} l${p * 150} -55`} stroke={C.gold} strokeWidth={12} strokeLinecap="round" />
            {Array.from({ length: 28 }, (_, i) => <circle key={i} cx={width * 0.57 + ((i * 37) % 130) * p} cy={floor - 100 - ((i * 23) % 105) * p} r={3 + (i % 3)} fill="#d4c4a7" />)}
          </>
        )}
        {scene === "dummy" && (
          <g transform={`translate(${width * 0.5} ${landscape ? 560 : 1180}) scale(${0.75 + 0.25 * p})`}>
            <circle r={landscape ? 150 : 125} fill="#d6b193" stroke={C.ink} strokeWidth={12} />
            <path d="M-116-70 Q0-170 116-70" fill="#3b2a20" stroke={C.ink} strokeWidth={10} />
            <circle cx={-48} cy={-15} r={10} fill={C.ink} /><circle cx={48} cy={-15} r={10} fill={C.ink} />
            <path d="M-45 58 Q0 75 45 58" fill="none" stroke={C.ink} strokeWidth={8} />
          </g>
        )}
        {scene === "workshop" && (
          <g transform={`translate(${landscape ? width * 0.69 : width * 0.5} ${landscape ? 670 : 1290})`}>
            <Raft x={0} y={0} scale={landscape ? 1.55 : 1.25} tilt={-3} />
            <text x={0} y={landscape ? 175 : 150} textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize={landscape ? 72 : 65}>50+ RAINCOATS</text>
          </g>
        )}
        {scene === "night" && (
          <>
            <path d={`M${width * 0.12} ${floor - 40} Q${width * 0.5} ${cellTop - 160} ${width * 0.88} ${floor - 40}`} fill="none" stroke={C.cyan} strokeWidth={8} strokeDasharray="20 14" pathLength={1} strokeDashoffset={1 - p} />
            {[0, 1, 2].map((n) => <circle key={n} cx={lerp(width * 0.16, width * 0.84, p) - n * 50} cy={lerp(floor - 80, cellTop - 80, Math.sin(Math.PI * p)) + n * 25} r={22} fill={C.white} />)}
          </>
        )}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 52% 58%,transparent 32%,rgba(0,0,0,.62) 100%)" }} />
    </AbsoluteFill>
  );
};

const soundsFor = (sections: Section[]) => {
  const first = (scene: Scene) => sections.find((section) => sceneOf(section.text) === scene)?.start ?? Number.NaN;
  return [
    [0.15, "boom", 0.18],
    [first("island"), "whoosh", 0.13],
    [first("cell"), "pop", 0.12],
    [first("dummy"), "ding", 0.12],
    [first("workshop"), "pop", 0.14],
    [first("night"), "whoosh", 0.15],
    [first("route"), "whoosh", 0.14],
    [first("search"), "boom", 0.15],
    [first("aha"), "ding", 0.15],
  ] as const;
};

const AlcatrazVideo: React.FC<{ timing: Timing; long?: boolean }> = ({ timing, long = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const landscape = width > height;
  const index = activeIndex(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const scene = sceneOf(section?.text ?? "");
  const local = time - (section?.start ?? 0);
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string, fallback: number) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? fallback;
  const mapScene = ["hook", "island", "route", "search", "mystery", "aha", "cta"].includes(scene);
  const sound = (at: number, name: string, volume: number) =>
    Number.isFinite(at) ? (
      <Sequence key={`${name}-${at}`} from={Math.max(0, Math.round(at * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Audio src={staticFile(timing.audio)} />
      {long && <BackgroundBeat />}
      {mapScene
        ? <MapStage timing={timing} scene={scene} local={local} time={time} />
        : <CellStage scene={scene} local={local} />}
      <Header scene={scene} local={local} landscape={landscape} />
      <SubscribeNudge T={time} until={ctaTime} top={landscape ? 300 : 570} />
      {time >= ctaTime && (
        <CtaCard
          T={time}
          likeT={wordAt("like", ctaTime + 1)}
          shareT={wordAt("share", ctaTime + 1.7)}
          subT={wordAt("subscribe", ctaTime + 2.4)}
          top={landscape ? 445 : 1130}
        />
      )}
      {soundsFor(timing.sections).map(([at, name, volume]) => sound(at, name, volume))}
      {nudgeTimes(ctaTime).map((at) => sound(at + 1.1, "ding", 0.12))}
    </AbsoluteFill>
  );
};

export const AlcatrazEscapeShort: React.FC<{ timing: Timing }> = ({ timing }) => <AlcatrazVideo timing={timing} />;
export const AlcatrazEscapeLong: React.FC<{ timing: Timing }> = ({ timing }) => <AlcatrazVideo timing={timing} long />;

export const AlcatrazEscapeThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <MapStage timing={timing} scene="hook" local={2} time={2} thumbnail />
      <AbsoluteFill style={{ background: landscape ? "linear-gradient(90deg,rgba(3,9,16,.93),rgba(3,9,16,.05) 72%)" : "linear-gradient(180deg,rgba(3,9,16,.9),rgba(3,9,16,.08) 58%,rgba(3,9,16,.8))" }} />
      <div style={{
        position: "absolute",
        left: landscape ? 70 : 48,
        right: landscape ? 720 : 48,
        top: landscape ? 120 : 320,
        textAlign: landscape ? "left" : "center",
        fontFamily: DISPLAY,
        fontSize: landscape ? 112 : 108,
        lineHeight: 0.9,
        color: C.white,
        WebkitTextStroke: `8px ${C.ink}`,
        paintOrder: "stroke fill",
        textShadow: `0 11px 0 ${C.ink}`,
      }}>
        HOW 3 PRISONERS<br />
        <span style={{ color: C.gold }}>ESCAPED ALCATRAZ</span>
      </div>
      <div style={{
        position: "absolute",
        left: landscape ? 95 : 110,
        right: landscape ? 1160 : 110,
        top: landscape ? 760 : 1320,
        padding: "16px 22px 13px",
        borderRadius: 22,
        border: `6px solid ${C.ink}`,
        boxShadow: `0 10px 0 ${C.ink}`,
        background: C.red,
        color: C.white,
        textAlign: "center",
        fontFamily: DISPLAY,
        fontSize: landscape ? 46 : 50,
      }}>
        ON A HOMEMADE RAFT
      </div>
    </AbsoluteFill>
  );
};
