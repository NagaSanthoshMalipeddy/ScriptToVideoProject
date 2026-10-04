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
  | "map"
  | "three"
  | "depth"
  | "engineering"
  | "sand"
  | "tom"
  | "night"
  | "exit"
  | "escape"
  | "search"
  | "memorial"
  | "aha"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const C = {
  ink: "#05080f",
  soil: "#6d4b34",
  sand: "#f4e2b8",
  gold: "#ffd23f",
  red: "#ff5a5f",
  blue: "#9fd8ff",
  green: "#4dd6a6",
  white: "#fff",
};

const CAMP: Pt = [15.307, 51.617];
const STOCKHOLM: Pt = [18.069, 59.329];
const GIBRALTAR: Pt = [-5.3536, 36.1408];

const sceneOf = (text: string): Scene => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (
    s.includes("central truth") ||
    s.includes("engineering triumph") ||
    s.includes("real story") ||
    s.includes("tunnel worked") ||
    s.includes("plan can succeed")
  )
    return "aha";
  if (
    s.includes("murdered") ||
    s.includes("memorial") ||
    s.includes("after the war") ||
    s.includes("human cost") ||
    s.includes("hitler was furious")
  )
    return "memorial";
  if (
    s.includes("sweden") ||
    s.includes("gibraltar") ||
    s.includes("reached safety") ||
    s.includes("recaptured") ||
    s.includes("huge search") ||
    s.includes("freedom was far")
  )
    return "search";
  if (
    s.includes("seventy-six") ||
    s.includes("76 men") ||
    s.includes("77th") ||
    s.includes("alarm sounded")
  )
    return "escape";
  if (
    s.includes("short of the forest") ||
    s.includes("near a guard") ||
    s.includes("signal") ||
    s.includes("one man per minute") ||
    s.includes("route was clear")
  )
    return "exit";
  if (
    s.includes("march 24") ||
    s.includes("freezing march") ||
    s.includes("frozen shut") ||
    s.includes("cold night") ||
    s.includes("tunnel collapsed")
  )
    return "night";
  if (
    s.includes("discovered tom") ||
    s.includes("tom became") ||
    s.includes("tom was") ||
    s.includes("dick was abandoned")
  )
    return "tom";
  if (
    s.includes("sand") ||
    s.includes("pouches") ||
    s.includes("gardens") ||
    s.includes("stooges") ||
    s.includes("lookouts")
  )
    return "sand";
  if (
    s.includes("102 metres") ||
    s.includes("air pumps") ||
    s.includes("electric lights") ||
    s.includes("wooden rails") ||
    s.includes("trolleys") ||
    s.includes("support used wood") ||
    s.includes("shafts, pulleys")
  )
    return "engineering";
  if (
    s.includes("9 metres") ||
    s.includes("hands and knees") ||
    s.includes("barely move") ||
    s.includes("far below")
  )
    return "depth";
  if (
    s.includes("tom, dick") ||
    s.includes("three tunnels") ||
    s.includes("spread the risk") ||
    s.includes("hut 104")
  )
    return "three";
  if (
    s.includes("sagan") ||
    s.includes("zagan") ||
    s.includes("stalag luft") ||
    s.includes("western poland") ||
    s.includes("allied airmen")
  )
    return "map";
  return "hook";
};

const activeIndex = (sections: Section[], T: number) => {
  let i = 0;
  for (let n = 0; n < sections.length; n++) if (T >= sections[n].start) i = n;
  return i;
};

const sceneView = (scene: Scene, landscape: boolean): SatView => {
  if (scene === "search")
    return landscape
      ? { lon: 8, lat: 48, span: 50 }
      : { lon: 8, lat: 48, span: 36 };
  if (scene === "cta")
    return landscape
      ? { lon: 11, lat: 49, span: 48 }
      : { lon: 11, lat: 49, span: 34 };
  return landscape
    ? { lon: 15.3, lat: 51.6, span: 20 }
    : { lon: 15.3, lat: 51.6, span: 12 };
};

const COPY: Record<Scene, [string, string, string]> = {
  hook: ["THE GREAT ESCAPE", "A secret railway beneath a prison camp", C.gold],
  map: ["STALAG LUFT III", "Zagan, Poland - 51.60 N, 15.31 E", C.gold],
  three: ["TOM - DICK - HARRY", "Three tunnels spread the risk", C.blue],
  depth: ["9 METRES DOWN", "Below the listening microphones", C.gold],
  engineering: ["102 METRES", "Lights - air pumps - rails - trolleys", C.green],
  sand: ["HIDE THE SAND", "Thousands of secret trips above ground", C.sand],
  tom: ["TOM DISCOVERED", "Dick stores supplies - Harry continues", C.red],
  night: ["MARCH 24, 1944", "A frozen hatch and a tunnel collapse", C.blue],
  exit: ["9 METRES SHORT", "A signal rope times every escape", C.red],
  escape: ["76 MEN OUT", "The 77th is spotted at dawn", C.gold],
  search: ["EUROPE-WIDE SEARCH", "73 recaptured - only 3 reach safety", C.blue],
  memorial: ["50 MEN MURDERED", "Remember the cost, not only the tunnel", C.red],
  aha: ["TRIUMPH AND TRAGEDY", "The engineering worked. Freedom did not.", C.gold],
  cta: ["GLOBETALES", "History remembers every life behind the map", C.gold],
};

const InfoCard: React.FC<{
  scene: Scene;
  local: number;
  landscape: boolean;
}> = ({ scene, local, landscape }) => {
  const [title, detail, accent] = COPY[scene];
  const p = spring({
    frame: Math.round(local * 30),
    fps: 30,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        left: landscape ? 64 : 46,
        top: landscape ? 58 : 310,
        width: landscape ? 680 : 988,
        boxSizing: "border-box",
        padding: landscape ? "24px 30px" : "30px 34px",
        background: "rgba(5,8,15,.9)",
        border: `4px solid ${accent}`,
        borderRadius: 24,
        boxShadow: `0 0 32px ${accent}55,0 14px 38px rgba(0,0,0,.55)`,
        opacity: clamp(p * 1.4),
        transform: `translateY(${(1 - p) * -70}px)`,
        textAlign: landscape ? "left" : "center",
      }}
    >
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: landscape ? 70 : title.length > 20 ? 70 : 86,
          lineHeight: 0.95,
          color: accent,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: BODY,
          fontWeight: 800,
          fontSize: landscape ? 28 : 36,
          lineHeight: 1.15,
          color: C.white,
        }}
      >
        {detail}
      </div>
    </div>
  );
};

const Barracks: React.FC<{ width: number; y: number }> = ({ width, y }) => (
  <g transform={`translate(0 ${y})`}>
    <rect x={0} y={0} width={width} height={44} fill="#172235" />
    <path
      d={`M${width * 0.12} 0 L${width * 0.2} -80 H${width * 0.8} L${width * 0.88} 0Z`}
      fill="#333d4c"
      stroke="#8793a6"
      strokeWidth={4}
    />
    {[0.25, 0.5, 0.75].map((x) => (
      <rect
        key={x}
        x={width * x - 22}
        y={-50}
        width={44}
        height={34}
        fill="#ffd98a"
      />
    ))}
    {[0.18, 0.82].map((x) => (
      <rect key={x} x={width * x - 7} y={40} width={14} height={42} fill="#8793a6" />
    ))}
  </g>
);

const TunnelStage: React.FC<{
  scene: Scene;
  local: number;
  landscape: boolean;
  width: number;
  height: number;
}> = ({ scene, local, landscape, width, height }) => {
  const isThree = scene === "three" || scene === "tom";
  const reveal = ease(clamp(local / 1.5));
  const top = landscape ? 280 : 610;
  const ground = landscape ? 355 : 760;
  const tunnelY = landscape ? 760 : 1270;
  const left = landscape ? 230 : 95;
  const right = landscape ? width - 130 : width - 65;
  const tunnelW = right - left;
  const exitX = left + tunnelW * 0.9;
  const trolley = left + 150 + ((local * (landscape ? 120 : 70)) % Math.max(180, tunnelW - 340));
  const escaped = Math.min(76, Math.floor(local * 11));
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7b5940" />
            <stop offset="1" stopColor="#2b1b18" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x={0} y={0} width={width} height={ground} fill="#0d1725" />
        <rect x={0} y={ground} width={width} height={height - ground} fill="url(#soil)" />
        <path d={`M0 ${ground + 20} Q${width / 2} ${ground - 18} ${width} ${ground + 14}`} stroke="#c5b18e" strokeWidth={8} fill="none" />
        <Barracks width={landscape ? 690 : 620} y={top} />
        <g transform={`translate(${landscape ? 60 : 20} 0)`}>
          <rect x={left} y={ground + 20} width={56} height={tunnelY - ground} rx={25} fill="#14100e" stroke={C.gold} strokeWidth={5} />
          <path
            d={`M${left + 28} ${tunnelY} H${left + 80 + (tunnelW - 80) * reveal} Q${exitX} ${tunnelY} ${exitX} ${ground + 65}`}
            fill="none"
            stroke="#16110d"
            strokeWidth={landscape ? 104 : 92}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M${left + 28} ${tunnelY} H${left + 80 + (tunnelW - 80) * reveal} Q${exitX} ${tunnelY} ${exitX} ${ground + 65}`}
            fill="none"
            stroke={scene === "tom" ? C.red : C.gold}
            strokeWidth={5}
            strokeDasharray={scene === "tom" ? "18 14" : undefined}
            filter="url(#glow)"
          />
          {isThree && (
            <>
              <path d={`M${left + 120} ${tunnelY - 8} Q${width * 0.45} ${tunnelY - 260} ${right - 180} ${tunnelY - 250}`} fill="none" stroke={scene === "tom" ? C.red : C.blue} strokeWidth={22} opacity={0.8} />
              <path d={`M${left + 170} ${tunnelY + 8} Q${width * 0.48} ${tunnelY + 240} ${right - 250} ${tunnelY + 210}`} fill="none" stroke="#8f7b68" strokeWidth={22} opacity={0.75} />
              {[
                ["TOM", right - 170, tunnelY - 250, scene === "tom" ? C.red : C.blue],
                ["DICK", right - 245, tunnelY + 215, "#c5b18e"],
                ["HARRY", right - 155, tunnelY + 10, C.gold],
              ].map(([name, x, y, color]) => (
                <text key={String(name)} x={Number(x)} y={Number(y)} fill={String(color)} fontFamily={DISPLAY} fontSize={landscape ? 42 : 36} textAnchor="end">
                  {name}
                </text>
              ))}
              {scene === "tom" && <text x={right - 250} y={tunnelY - 285} fill={C.red} fontFamily={DISPLAY} fontSize={landscape ? 64 : 52}>DISCOVERED</text>}
            </>
          )}
          {(scene === "depth" || scene === "engineering") && (
            <>
              <line x1={left - 40} y1={ground + 35} x2={left - 40} y2={tunnelY} stroke={C.white} strokeWidth={4} />
              <path d={`M${left - 55} ${ground + 55} L${left - 40} ${ground + 35} L${left - 25} ${ground + 55} M${left - 55} ${tunnelY - 20} L${left - 40} ${tunnelY} L${left - 25} ${tunnelY - 20}`} stroke={C.white} strokeWidth={4} fill="none" />
              <text x={left - 65} y={(ground + tunnelY) / 2} fill={C.white} fontFamily={DISPLAY} fontSize={42} textAnchor="middle" transform={`rotate(-90 ${left - 65} ${(ground + tunnelY) / 2})`}>ABOUT 9 M</text>
            </>
          )}
          {scene === "engineering" && (
            <>
              <line x1={left + 110} y1={tunnelY + 28} x2={right - 120} y2={tunnelY + 28} stroke="#b7c3cf" strokeWidth={6} />
              <rect x={trolley} y={tunnelY - 18} width={95} height={52} rx={8} fill="#665040" stroke={C.sand} strokeWidth={4} />
              <circle cx={trolley + 18} cy={tunnelY + 37} r={10} fill="#b7c3cf" />
              <circle cx={trolley + 78} cy={tunnelY + 37} r={10} fill="#b7c3cf" />
              {Array.from({ length: 8 }).map((_, i) => (
                <g key={i}>
                  <line x1={left + 140 + i * (tunnelW / 9)} y1={tunnelY - 55} x2={left + 140 + i * (tunnelW / 9)} y2={tunnelY + 45} stroke="#967050" strokeWidth={10} />
                  <circle cx={left + 140 + i * (tunnelW / 9)} cy={tunnelY - 26} r={8} fill="#fff2a8" filter="url(#glow)" />
                </g>
              ))}
            </>
          )}
          {scene === "sand" && (
            <>
              {Array.from({ length: 44 }).map((_, i) => {
                const x = left + 160 + ((i * 67) % Math.max(300, tunnelW - 260));
                const y = ground - 8 - ((local * 85 + i * 23) % 180);
                return <circle key={i} cx={x} cy={y} r={4 + (i % 3)} fill={C.sand} opacity={0.75} />;
              })}
              <path d={`M${left + 230} ${ground - 20} Q${left + 270} ${ground - 130} ${left + 310} ${ground - 20}Z`} fill="#5d7187" stroke="#fff" strokeWidth={4} />
              <text x={left + 360} y={ground - 72} fill={C.sand} fontFamily={BODY} fontWeight={900} fontSize={38}>SAND POUCH</text>
            </>
          )}
          {(scene === "night" || scene === "exit" || scene === "escape") && (
            <>
              <path d={`M${exitX - 25} ${ground + 20} H${exitX + 25} V${ground - 12} H${exitX - 25}Z`} fill="#151c22" stroke={C.gold} strokeWidth={5} />
              <path d={`M${exitX} ${ground - 10} L${right + 30} ${ground - 120}`} stroke={C.red} strokeWidth={4} strokeDasharray="16 12" />
              <text x={exitX + 40} y={ground - 70} fill={C.red} fontFamily={DISPLAY} fontSize={34}>9 M SHORT</text>
              <path d={`M${exitX} ${ground - 25} Q${exitX - 170} ${ground - 170} ${exitX - 320} ${tunnelY - 35}`} fill="none" stroke={C.blue} strokeWidth={4} strokeDasharray="12 10" />
              <circle cx={exitX} cy={ground - 28} r={10 + Math.sin(local * 8) * 4} fill={C.blue} />
              <path d={`M${right + 80} ${ground - 250} L${exitX - 260} ${ground + 20}`} fill="rgba(255,245,185,.13)" stroke="rgba(255,245,185,.35)" strokeWidth={3} />
            </>
          )}
          {scene === "escape" && (
            <text x={width / 2} y={tunnelY + (landscape ? 180 : 250)} fill={C.gold} fontFamily={DISPLAY} fontSize={landscape ? 126 : 150} textAnchor="middle">
              {escaped} / 76
            </text>
          )}
        </g>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 54%,transparent 38%,rgba(0,0,0,.62) 100%)" }} />
    </AbsoluteFill>
  );
};

const route = (
  a: Pt,
  b: Pt,
  project: (lon: number, lat: number) => Pt,
  color: string,
  p: number,
) => {
  const [x1, y1] = project(...a);
  const [x2, y2] = project(...b);
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.18;
  return (
    <path
      d={`M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={8}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray={`${p} 1`}
      style={{ filter: `drop-shadow(0 0 9px ${color})` }}
    />
  );
};

const MapStage: React.FC<{
  scene: Scene;
  local: number;
  landscape: boolean;
  width: number;
  height: number;
}> = ({ scene, local, landscape, width, height }) => {
  const view = sceneView(scene, landscape);
  const { project } = makeSatProjector(view, width, height);
  const p = ease(clamp(local / 2));
  const [cx, cy] = project(...CAMP);
  return (
    <SatelliteMap
      view={view}
      width={width}
      height={height}
      darken={scene === "cta" ? 0.48 : 0.28}
      highlights={[
        {
          geom: countryGeom("POL"),
          label: "Poland",
          labelAt: [19, 52],
          fill: "rgba(255,190,20,.35)",
          stroke: C.gold,
        },
      ]}
    >
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {scene === "search" && (
          <>
            {route(CAMP, STOCKHOLM, project, C.blue, p)}
            {route(CAMP, GIBRALTAR, project, C.gold, p)}
          </>
        )}
        <circle cx={cx} cy={cy} r={18} fill={C.red} stroke="#fff" strokeWidth={5} />
        <circle cx={cx} cy={cy} r={30 + 12 * Math.sin(local * 5)} fill="none" stroke={C.red} strokeWidth={4} opacity={0.6} />
        <text x={cx + 28} y={cy - 24} fill="#fff" fontFamily={BODY} fontSize={30} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>
          STALAG LUFT III
        </text>
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 52%,transparent 40%,rgba(0,0,0,.58) 100%)" }} />
    </SatelliteMap>
  );
};

export const StalagLuftIIIVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const T = frame / fps;
  const landscape = width > height;
  const i = activeIndex(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const scene = sceneOf(section?.text ?? "");
  const local = T - (section?.start ?? 0);
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec - 6;
  const word = (name: string, fallback: number) =>
    cta?.words.find((w) => w.word.toLowerCase().replace(/[^a-z]/g, "") === name)?.start ??
    fallback;
  const likeT = word("like", ctaT + 1);
  const shareT = word("share", ctaT + 1.7);
  const subT = word("subscribe", ctaT + 2.4);
  const mapScene = scene === "map" || scene === "search" || scene === "cta";
  const sfx: [number, string, number][] = [
    [0.1, "boom", 0.2],
    [timing.sections.find((s) => sceneOf(s.text) === "map")?.start ?? 3, "whoosh", 0.18],
    [timing.sections.find((s) => sceneOf(s.text) === "three")?.start ?? 9, "pop", 0.18],
    [timing.sections.find((s) => sceneOf(s.text) === "night")?.start ?? 35, "ding", 0.18],
    [timing.sections.find((s) => sceneOf(s.text) === "escape")?.start ?? 50, "boom", 0.16],
    [timing.sections.find((s) => sceneOf(s.text) === "memorial")?.start ?? 65, "ding", 0.14],
  ];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {landscape && <BackgroundBeat />}
      <Audio src={staticFile(timing.audio)} volume={1} />
      {mapScene ? (
        <MapStage scene={scene} local={local} landscape={landscape} width={width} height={height} />
      ) : (
        <TunnelStage scene={scene} local={local} landscape={landscape} width={width} height={height} />
      )}
      <InfoCard scene={scene} local={local} landscape={landscape} />
      <SubscribeNudge T={T} until={ctaT} top={landscape ? 62 : 570} />
      {T >= ctaT && <CtaCard T={T} likeT={likeT} shareT={shareT} subT={subT} top={landscape ? 465 : 1130} />}
      {nudgeTimes(ctaT).map((t) => (
        <Sequence key={t} from={Math.round((t + 1.1) * fps)} durationInFrames={Math.round(0.8 * fps)}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.16} />
        </Sequence>
      ))}
      {sfx.map(([t, name, volume], key) => (
        <Sequence key={key} from={Math.max(0, Math.round(t * fps))} durationInFrames={Math.round(1.1 * fps)}>
          <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const StalagLuftIIIThumb: React.FC<{ timing: Timing }> = () => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const ground = landscape ? 470 : 900;
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="thumbSoil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#78583f" />
            <stop offset="1" stopColor="#281a17" />
          </linearGradient>
          <filter id="thumbGlow">
            <feGaussianBlur stdDeviation="9" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={width} height={ground} fill="#0c1727" />
        <rect y={ground} width={width} height={height - ground} fill="url(#thumbSoil)" />
        <Barracks width={landscape ? 700 : 620} y={ground - 80} />
        <path
          d={landscape ? `M280 760 H1540 Q1700 760 1700 520` : `M155 1390 H825 Q920 1390 920 1030`}
          fill="none"
          stroke="#15100d"
          strokeWidth={110}
          strokeLinecap="round"
        />
        <path
          d={landscape ? `M280 760 H1540 Q1700 760 1700 520` : `M155 1390 H825 Q920 1390 920 1030`}
          fill="none"
          stroke={C.gold}
          strokeWidth={7}
          filter="url(#thumbGlow)"
        />
        <circle cx={landscape ? 420 : 280} cy={landscape ? 760 : 1390} r={24} fill={C.sand} />
        <circle cx={landscape ? 1450 : 780} cy={landscape ? 760 : 1390} r={24} fill={C.sand} />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 56% 58%,transparent 35%,rgba(0,0,0,.62) 100%)" }} />
      <div
        style={{
          position: "absolute",
          left: landscape ? 70 : 50,
          right: landscape ? 670 : 50,
          top: landscape ? 90 : 330,
          textAlign: landscape ? "left" : "center",
        }}
      >
        <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 126 : 128, lineHeight: 0.9, color: "#fff", textShadow: "0 8px 0 #000,0 0 30px #000" }}>
          THE PRISONERS
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: landscape ? 142 : 145, lineHeight: 0.9, color: C.gold, textShadow: "0 8px 0 #000,0 0 30px #000" }}>
          WHO DUG OUT
        </div>
        <div style={{ display: "inline-block", marginTop: 28, padding: "10px 24px", border: `4px solid ${C.red}`, background: "rgba(5,8,15,.9)", color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: landscape ? 38 : 44 }}>
          76 ESCAPED - ONLY 3 MADE IT
        </div>
      </div>
    </AbsoluteFill>
  );
};
