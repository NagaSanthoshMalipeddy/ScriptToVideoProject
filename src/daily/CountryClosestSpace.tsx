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
import { CoverTitle } from "../cartoon/CoverTitle";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
type Kind =
  | "hook"
  | "everest"
  | "travel"
  | "chimborazo"
  | "height"
  | "compare"
  | "shape"
  | "bulge"
  | "radiusDiff"
  | "latitude"
  | "distance"
  | "farther"
  | "outward"
  | "twist"
  | "karman"
  | "result"
  | "ecuador"
  | "winners"
  | "bridge"
  | "cta";

const C = {
  night: "#050914",
  ocean: "#0c3558",
  oceanLight: "#17688f",
  land: "#e9dfc7",
  ink: "#172235",
  gold: "#ffd23f",
  cyan: "#55d8ff",
  coral: "#ff5263",
  green: "#39d98a",
  white: "#ffffff",
  ecuador: "#f6c744",
  nepal: "#dc143c",
};

const EVEREST: Pt = [86.925, 27.9881];
const CHIMBORAZO: Pt = [-78.817, -1.469];
const ECUADOR_ISO = "ECU";
const NEPAL_ISO = "NPL";
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, progress: number) => a + (b - a) * progress;
const ease = Easing.inOut(Easing.cubic);

const kindOf = (text: string): Kind => {
  const value = text.toLowerCase();
  if (value.includes("please like")) return "cta";
  if (value.includes("next globetales")) return "bridge";
  if (value.includes("one planet")) return "winners";
  if (value.includes("ecuador the answer")) return "ecuador";
  if (value.includes("wins one measurement")) return "result";
  if (value.includes("kármán line")) return "karman";
  if (value.includes("honest twist")) return "twist";
  if (value.includes("from earth's centre, ecuador")) return "outward";
  if (value.includes("about 2.1")) return "farther";
  if (value.includes("6,384.4")) return "distance";
  if (value.includes("far north")) return "latitude";
  if (value.includes("21 kilometres")) return "radiusDiff";
  if (value.includes("equator bulges")) return "bulge";
  if (value.includes("not a perfect ball")) return "shape";
  if (value.includes("2.5 kilometres taller")) return "compare";
  if (value.includes("6,263 metres")) return "height";
  if (value.includes("mount chimborazo")) return "chimborazo";
  if (value.includes("fly to ecuador")) return "travel";
  if (value.includes("8,848.86")) return "everest";
  return "hook";
};

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const V: Record<Kind, View> = {
  hook: { lon: 86.9, lat: 28, span: 34 },
  everest: { lon: 86.9, lat: 28, span: 12 },
  travel: { lon: 4, lat: 14, span: 245 },
  chimborazo: { lon: -78.8, lat: -1.5, span: 28 },
  height: { lon: -78.8, lat: -1.5, span: 21 },
  compare: { lon: 4, lat: 14, span: 245 },
  shape: { lon: 4, lat: 8, span: 255 },
  bulge: { lon: 4, lat: 8, span: 255 },
  radiusDiff: { lon: 4, lat: 8, span: 255 },
  latitude: { lon: 4, lat: 14, span: 245 },
  distance: { lon: -78.8, lat: -1.5, span: 52 },
  farther: { lon: 4, lat: 14, span: 245 },
  outward: { lon: -78.8, lat: -1.5, span: 45 },
  twist: { lon: 4, lat: 8, span: 255 },
  karman: { lon: 4, lat: 8, span: 255 },
  result: { lon: 4, lat: 14, span: 245 },
  ecuador: { lon: -78.8, lat: -1.5, span: 50 },
  winners: { lon: 4, lat: 12, span: 245 },
  bridge: { lon: 4, lat: 12, span: 250 },
  cta: { lon: 4, lat: 12, span: 250 },
};

const cameraAt = (sections: Section[], time: number): View => {
  const index = activeSection(sections, time);
  const section = sections[index];
  const from = V[kindOf(sections[Math.max(0, index - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const progress = ease(clamp((time - (section?.start ?? 0)) / 1.25));
  const bump = Math.max(from.span, to.span) * (1 + 0.08 * Math.sin(Math.PI * progress));
  const span =
    progress < 0.5
      ? from.span * Math.pow(bump / from.span, progress * 2)
      : bump * Math.pow(to.span / bump, (progress - 0.5) * 2);
  return {
    lon: lerp(from.lon, to.lon, progress),
    lat: lerp(from.lat, to.lat, progress),
    span,
  };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["GEOGRAPHY MYTH", "NOT EVEREST!", "A lower mountain reaches farther outward.", C.gold],
    everest: ["HIGHEST ABOVE SEA LEVEL", "8,848.86 M", "Mount Everest · Nepal", C.nepal],
    travel: ["FOLLOW THE GLOBE", "NEPAL → ECUADOR", "The answer flips near the equator.", C.cyan],
    chimborazo: ["1.47° SOUTH · 78.82° WEST", "MOUNT CHIMBORAZO", "Inactive volcano · Ecuador", C.ecuador],
    height: ["ABOVE SEA LEVEL", "ABOUT 6,263 M", "Lower than Everest", C.coral],
    compare: ["THE CONTRADICTION", "EVEREST IS TALLER", "By more than 2.5 km", C.coral],
    shape: ["THE HIDDEN CLUE", "EARTH IS NOT A BALL", "It is slightly wider at the equator.", C.gold],
    bulge: ["EARTH SPINS", "THE EQUATOR BULGES", "Rotation changes the planet's shape.", C.cyan],
    radiusDiff: ["EQUATOR VS POLES", "ABOUT 21 KM", "Difference in Earth's radius", C.gold],
    latitude: ["LATITUDE MATTERS", "28°N VS 1.47°S", "Chimborazo stands on the bulge.", C.cyan],
    distance: ["FROM EARTH'S CENTRE", "6,384.4 KM", "Chimborazo's summit", C.gold],
    farther: ["THE WINNING GAP", "+2.1 KM OUTWARD", "Roughly farther than Everest's summit", C.green],
    outward: ["ONE MEASUREMENT", "ECUADOR WINS", "Farthest summit from Earth's centre", C.ecuador],
    twist: ["IMPORTANT TWIST", "WHAT COUNTS AS SPACE?", "Distance from the centre is not altitude.", C.coral],
    karman: ["COMMON SPACE BOUNDARY", "KÁRMÁN LINE ~100 KM", "Measured above mean sea level", C.cyan],
    result: ["TWO TRUE RECORDS", "TWO DIFFERENT WINNERS", "The definition decides the answer.", C.gold],
    ecuador: ["THE TITLE'S ANSWER", "ECUADOR", "Earth's bulge gives Chimborazo the edge.", C.ecuador],
    winners: ["THE PAYOFF", "ONE PLANET · TWO WINNERS", "Chimborazo outward · Everest upward", C.gold],
    bridge: ["GLOBETALES", "THE NEXT MAP IS WAITING", "A new world story every day.", C.cyan],
    cta: ["GLOBETALES", "FOLLOW THE GLOBE", "Like · Share · Subscribe", C.gold],
  };
  return copy[kind];
};

const InfoCard: React.FC<{ kind: Kind; start: number; frame: number; fps: number }> = ({
  kind,
  start,
  frame,
  fps,
}) => {
  const [kicker, title, subtitle, accent] = copyFor(kind);
  const enter = spring({
    frame: frame - Math.round(start * fps),
    fps,
    config: { damping: 12, mass: 0.7 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 42,
        right: 42,
        minHeight: 242,
        padding: "26px 34px 22px",
        borderRadius: 30,
        border: `6px solid ${C.ink}`,
        background: "rgba(255,255,255,.96)",
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - enter) * -82}px) scale(${0.96 + enter * 0.04})`,
        opacity: clamp(enter * 1.5),
      }}
    >
      <div style={{ color: accent, fontFamily: BODY, fontSize: 28, fontWeight: 1000, letterSpacing: 3 }}>
        {kicker}
      </div>
      <div style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 78, lineHeight: 0.95 }}>{title}</div>
      <div style={{ marginTop: 10, color: "#435267", fontFamily: BODY, fontSize: 31, fontWeight: 850 }}>
        {subtitle}
      </div>
    </div>
  );
};

const Marker: React.FC<{
  point: Pt;
  project: (point: Pt) => Pt;
  label: string;
  color: string;
  reveal: number;
}> = ({ point, project, label, color, reveal }) => {
  const [x, y] = project(point);
  return (
    <g transform={`translate(${x} ${y - (1 - reveal) * 130})`} opacity={clamp(reveal * 1.5)}>
      <path d="M0 0C-28-38-35-64-35-85A35 35 0 0 1 35-85C35-64 28-38 0 0Z" fill={C.ink} stroke={C.white} strokeWidth={5} />
      <circle cy={-85} r={21} fill={color} />
      <text
        x={0}
        y={-125}
        textAnchor="middle"
        fill={C.white}
        fontFamily={DISPLAY}
        fontSize={43}
        style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}
      >
        {label}
      </text>
    </g>
  );
};

const Peaks: React.FC<{ reveal: number; winner?: boolean }> = ({ reveal, winner = false }) => (
  <div style={{ position: "absolute", left: 45, right: 45, top: 625, bottom: 270 }}>
    <svg width="100%" height="100%" viewBox="0 0 990 1000">
      <defs>
        <linearGradient id="everestPeak" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e8f7ff" />
          <stop offset="1" stopColor="#55758f" />
        </linearGradient>
        <linearGradient id="chimPeak" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fff2bd" />
          <stop offset="1" stopColor="#9b573a" />
        </linearGradient>
      </defs>
      <line x1="40" y1="850" x2="950" y2="850" stroke={C.cyan} strokeWidth="8" strokeDasharray="20 14" />
      <text x="495" y="905" textAnchor="middle" fill={C.cyan} fontFamily={BODY} fontSize="30" fontWeight="900">MEAN SEA LEVEL</text>
      <g transform={`translate(80 ${850 - 700 * reveal})`}>
        <path d="M0 700L230 0L460 700Z" fill="url(#everestPeak)" stroke={C.white} strokeWidth="7" />
        <path d="M175 170L230 0L285 170L247 145L220 185Z" fill={C.white} />
        <text x="230" y="-35" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="54" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>EVEREST</text>
        <text x="230" y="70" textAnchor="middle" fill={C.nepal} fontFamily={DISPLAY} fontSize="48" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>8,848.86 M</text>
      </g>
      <g transform={`translate(540 ${850 - 495 * reveal})`}>
        <path d="M0 495Q230-40 420 495Z" fill="url(#chimPeak)" stroke={C.white} strokeWidth="7" />
        <path d="M135 155Q230-40 310 155Q240 115 135 155Z" fill={C.white} />
        <text x="210" y="-35" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="50" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>CHIMBORAZO</text>
        <text x="210" y="65" textAnchor="middle" fill={C.ecuador} fontFamily={DISPLAY} fontSize="48" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>6,263 M</text>
      </g>
      {winner && (
        <g transform={`translate(365 ${190 - reveal * 25})`} opacity={reveal}>
          <rect width="260" height="105" rx="52" fill={C.gold} stroke={C.ink} strokeWidth="7" />
          <text x="130" y="72" textAnchor="middle" fill={C.ink} fontFamily={DISPLAY} fontSize="57">HEIGHT</text>
        </g>
      )}
    </svg>
  </div>
);

const EarthDiagram: React.FC<{ kind: Kind; reveal: number; time: number }> = ({ kind, reveal, time }) => {
  const shell = kind === "twist" || kind === "karman";
  const latitude = kind === "latitude";
  const distance = kind === "distance" || kind === "farther";
  const radius = kind === "radiusDiff";
  const pulse = 1 + Math.sin(time * 2.2) * 0.01;
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: 610, bottom: 230 }}>
      <svg width="100%" height="100%" viewBox="0 0 1020 1050">
        <defs>
          <radialGradient id="earthBody" cx="38%" cy="30%" r="78%">
            <stop stopColor={C.oceanLight} />
            <stop offset="1" stopColor={C.ocean} />
          </radialGradient>
          <filter id="spaceGlow"><feGaussianBlur stdDeviation="11" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g transform={`translate(510 540) scale(${pulse})`}>
          {shell && (
            <>
              <ellipse rx="425" ry="405" fill="none" stroke={C.cyan} strokeWidth={22} opacity={0.18 + reveal * 0.32} filter="url(#spaceGlow)" />
              <ellipse rx="425" ry="405" fill="none" stroke={C.cyan} strokeWidth={7} strokeDasharray="24 16" opacity={reveal} />
              <path d="M330-255L405-318" stroke={C.gold} strokeWidth={8} />
              <path d="M384-321L420-326L411-291" fill={C.gold} />
              <text x="318" y="-350" fill={C.gold} fontFamily={DISPLAY} fontSize={50}>~100 KM</text>
            </>
          )}
          <ellipse rx="360" ry="335" fill="url(#earthBody)" stroke={C.white} strokeWidth={7} />
          <ellipse rx={360 + reveal * 22} ry={335 - reveal * 10} fill="none" stroke={C.gold} strokeWidth={kind === "bulge" || radius ? 10 : 3} opacity={kind === "bulge" || radius ? 0.9 : 0.25} />
          <ellipse rx="360" ry="92" fill="none" stroke={C.gold} strokeWidth={latitude ? 10 : 5} strokeDasharray="22 13" opacity={0.55 + (latitude ? 0.4 : 0)} />
          <path d="M-315 115Q-100 40 80 110T315 100" fill="none" stroke={C.land} strokeWidth={25} opacity={0.65} />
          <path d="M-275-115Q-100-200 55-135T285-160" fill="none" stroke={C.land} strokeWidth={21} opacity={0.65} />
          <circle r={16} fill={C.white} />
          {(radius || distance || kind === "shape" || kind === "bulge") && (
            <>
              <line x1="0" y1="0" x2={355 * reveal} y2="0" stroke={C.gold} strokeWidth={11} strokeLinecap="round" />
              <path d={`M${355 * reveal} 0l-30-18v36z`} fill={C.gold} />
              <line x1="0" y1="0" x2="0" y2={-330 * reveal} stroke={C.cyan} strokeWidth={9} strokeLinecap="round" />
              <text x="178" y="-25" textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize="42">EQUATOR</text>
              <text x="25" y="-185" fill={C.cyan} fontFamily={DISPLAY} fontSize="39">POLE</text>
            </>
          )}
          {(latitude || distance) && (
            <>
              <circle cx="360" cy="12" r="17" fill={C.ecuador} stroke={C.white} strokeWidth={5} />
              <text x="325" y="70" textAnchor="end" fill={C.white} fontFamily={DISPLAY} fontSize="42" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>CHIMBORAZO</text>
              <circle cx="295" cy="-155" r="17" fill={C.nepal} stroke={C.white} strokeWidth={5} />
              <text x="286" y="-185" textAnchor="end" fill={C.white} fontFamily={DISPLAY} fontSize="42" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>EVEREST</text>
              {distance && <line x1="0" y1="0" x2={360 * reveal} y2="12" stroke={C.gold} strokeWidth={12} strokeLinecap="round" />}
            </>
          )}
        </g>
        {radius && (
          <g transform="translate(115 915)">
            <rect width="790" height="92" rx="46" fill="rgba(5,9,20,.88)" stroke={C.gold} strokeWidth="5" />
            <text x="395" y="63" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="50">EQUATORIAL RADIUS ≈ 21 KM LARGER</text>
          </g>
        )}
        {distance && (
          <g transform="translate(175 900)">
            <rect width="670" height="110" rx="55" fill={C.gold} stroke={C.ink} strokeWidth="7" />
            <text x="335" y="74" textAnchor="middle" fill={C.ink} fontFamily={DISPLAY} fontSize="59">
              {kind === "farther" ? "+2.1 KM FARTHER OUT" : "6,384.4 KM"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

const Result: React.FC<{ reveal: number }> = ({ reveal }) => (
  <div style={{ position: "absolute", left: 42, right: 42, top: 650, bottom: 290, display: "flex", gap: 24 }}>
    {[
      ["FARTHEST FROM", "EARTH'S CENTRE", "CHIMBORAZO", C.ecuador],
      ["HIGHEST ABOVE", "SEA LEVEL", "EVEREST", C.nepal],
    ].map(([a, b, c, color], index) => (
      <div
        key={c}
        style={{
          flex: 1,
          borderRadius: 32,
          border: `7px solid ${C.white}`,
          background: "rgba(12,53,88,.94)",
          boxShadow: `0 16px 0 ${C.ink}`,
          padding: "36px 24px",
          textAlign: "center",
          transform: `translateY(${(1 - reveal) * (index ? 120 : -120)}px)`,
          opacity: reveal,
        }}
      >
        <div style={{ color: C.cyan, fontFamily: BODY, fontSize: 28, fontWeight: 1000 }}>{a}</div>
        <div style={{ color: C.white, fontFamily: DISPLAY, fontSize: 57, lineHeight: 0.95 }}>{b}</div>
        <div style={{ margin: "70px auto 35px", width: 150, height: 150, borderRadius: "50%", background: color, border: `7px solid ${C.white}`, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 84 }}>✓</div>
        <div style={{ color, fontFamily: DISPLAY, fontSize: 62, lineHeight: 0.95 }}>{c}</div>
      </div>
    ))}
  </div>
);

const mapKinds = new Set<Kind>(["hook", "everest", "travel", "chimborazo", "height", "outward", "ecuador", "winners", "bridge", "cta"]);
const earthKinds = new Set<Kind>(["shape", "bulge", "radiusDiff", "latitude", "distance", "farther", "twist", "karman"]);

export const CountryClosestSpaceScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({
  timing,
  thumbnail = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = thumbnail ? 0 : frame / fps;
  const index = activeSection(timing.sections, time);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind = thumbnail ? "ecuador" : kindOf(section?.text ?? "");
  const reveal = thumbnail
    ? 1
    : spring({ frame: frame - Math.round(section.start * fps), fps, config: { damping: 12, mass: 0.7 } });
  const camera = thumbnail ? V.ecuador : cameraAt(timing.sections, time);
  const refLat = 12;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const scale = Math.min(width / (camera.span * cos), (height * 0.82) / camera.span);
  const focusX = width * 0.5;
  const focusY = height * 0.59;
  const project = ([lon, lat]: Pt): Pt => [
    focusX + (lon - camera.lon) * cos * scale,
    focusY - (lat - camera.lat) * scale,
  ];
  const cta = timing.sections.find((candidate) => candidate.text.toLowerCase().includes("please like"));
  const ctaTime = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaTime;
  const showMap = mapKinds.has(kind);
  const showPeaks = kind === "height" || kind === "compare";
  const showEarth = earthKinds.has(kind);
  const showResult = kind === "result" || kind === "winners";
  const routeProgress = kind === "travel" ? ease(clamp((time - section.start) / Math.max(1.8, section.end - section.start))) : 1;
  const [ex, ey] = project(EVEREST);
  const [cx, cy] = project(CHIMBORAZO);

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="spaceOcean" cx="50%" cy="45%" r="76%">
            <stop stopColor={C.oceanLight} />
            <stop offset="1" stopColor={C.night} />
          </radialGradient>
          <pattern id="spaceGrid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M72 0H0V72" fill="none" stroke="rgba(100,210,255,.09)" strokeWidth="2" />
          </pattern>
          <filter id="routeGlow"><feGaussianBlur stdDeviation="8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={width} height={height} fill="url(#spaceOcean)" />
        <rect width={width} height={height} fill="url(#spaceGrid)" />
        {Array.from({ length: 34 }, (_, star) => (
          <circle
            key={star}
            cx={(star * 137 + 53) % width}
            cy={(star * 223 + 91) % height}
            r={star % 5 === 0 ? 3 : 1.6}
            fill={C.white}
            opacity={0.2 + 0.35 * (0.5 + 0.5 * Math.sin(star + time))}
          />
        ))}
        {showMap && COUNTRIES.map((country) => {
          const active = country.iso === ECUADOR_ISO || country.iso === NEPAL_ISO;
          return (
            <path
              key={country.iso}
              d={geomPath(country.geom as never, (lon, lat) => project([lon, lat]))}
              fill={country.iso === ECUADOR_ISO ? C.ecuador : country.iso === NEPAL_ISO ? C.nepal : C.land}
              fillOpacity={active ? 0.97 : 0.74}
              stroke={active ? C.white : C.ink}
              strokeWidth={active ? 5 : camera.span < 40 ? 2.5 : 1.2}
              strokeLinejoin="round"
            />
          );
        })}
        {showMap && kind === "travel" && (
          <>
            <path d={`M${ex},${ey} Q${(ex + cx) / 2},${Math.min(ey, cy) - 260} ${cx},${cy}`} fill="none" stroke="rgba(85,216,255,.22)" strokeWidth="28" filter="url(#routeGlow)" />
            <path d={`M${ex},${ey} Q${(ex + cx) / 2},${Math.min(ey, cy) - 260} ${cx},${cy}`} fill="none" stroke={C.cyan} strokeWidth="9" strokeDasharray={`${Math.max(1, routeProgress * 1250)} 1250`} strokeLinecap="round" />
          </>
        )}
        {showMap && ["hook", "everest", "travel", "winners"].includes(kind) && <Marker point={EVEREST} project={project} label="EVEREST" color={C.nepal} reveal={clamp(reveal)} />}
        {showMap && !thumbnail && ["travel", "chimborazo", "height", "outward", "ecuador", "winners", "bridge", "cta"].includes(kind) && <Marker point={CHIMBORAZO} project={project} label="CHIMBORAZO" color={C.ecuador} reveal={clamp(reveal)} />}
      </svg>

      {showPeaks && <Peaks reveal={clamp(reveal)} winner={kind === "compare"} />}
      {showEarth && <EarthDiagram kind={kind} reveal={clamp(reveal)} time={time} />}
      {showResult && <Result reveal={clamp(reveal)} />}
      {!thumbnail && <InfoCard kind={kind} start={section.start} frame={frame} fps={fps} />}
      {!thumbnail && <SubscribeNudge T={time} until={ctaTime} top={1480} />}
      {!thumbnail && time >= ctaTime && (
        <CtaCard T={time} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1110} />
      )}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(5,9,20,.93),rgba(5,9,20,.03) 57%,rgba(5,9,20,.88))" }} />
          <div style={{ position: "absolute", top: 310, left: 42, right: 42, textAlign: "center", color: C.white, fontFamily: DISPLAY, fontSize: 137, lineHeight: 0.88, WebkitTextStroke: `10px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${C.ink}` }}>
            NOT EVEREST!<br /><span style={{ color: C.gold }}>ECUADOR WINS</span>
          </div>
          <div style={{ position: "absolute", left: 118, right: 118, top: 1325, height: 116, borderRadius: 58, background: C.gold, border: `7px solid ${C.white}`, boxShadow: `0 12px 0 ${C.ink}`, color: C.ink, fontFamily: DISPLAY, fontSize: 62, display: "flex", alignItems: "center", justifyContent: "center" }}>
            +2.1 KM OUTWARD
          </div>
          <div style={{ position: "absolute", top: 725, left: 400, width: 280, height: 280, borderRadius: "50%", border: `11px solid ${C.gold}`, boxShadow: `0 0 50px ${C.gold}`, background: "radial-gradient(circle at 35% 30%,#2d91b7,#0c3558 68%)" }}>
            <div style={{ position: "absolute", left: -54, right: -54, top: 124, borderTop: `10px dashed ${C.gold}` }} />
            <div style={{ position: "absolute", top: 94, left: 43, color: C.white, fontFamily: DISPLAY, fontSize: 64, WebkitTextStroke: `7px ${C.ink}`, paintOrder: "stroke fill" }}>EARTH</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const CountryClosestSpaceVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaTime = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const cues: [number, string, number][] = [
    [0.05, "riser", 0.14],
    [0.9, "boom", 0.2],
    [first("travel"), "whoosh", 0.18],
    [first("chimborazo"), "pop", 0.17],
    [first("compare"), "boom", 0.14],
    [first("shape"), "whoosh", 0.12],
    [first("distance"), "riser", 0.11],
    [first("farther"), "boom", 0.2],
    [first("twist"), "whoosh", 0.14],
    [first("result"), "ding", 0.16],
    [first("ecuador"), "boom", 0.18],
  ];
  const cue = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cues.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaTime).map((time) => cue(time + 1.1, "ding", 0.13))}
      <CountryClosestSpaceScene timing={timing} />
      <CoverTitle lines={["NOT EVEREST!", "ECUADOR WINS"]} sub="+2.1 km outward" accent={C.gold} />
    </AbsoluteFill>
  );
};

export const CountryClosestSpaceThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <CountryClosestSpaceScene timing={timing} thumbnail />
);
