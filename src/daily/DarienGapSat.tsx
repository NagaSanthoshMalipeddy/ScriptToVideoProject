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
  | "route"
  | "end"
  | "gap"
  | "terrain"
  | "forest"
  | "community"
  | "health"
  | "history"
  | "people"
  | "aha"
  | "protect"
  | "continents"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const INK = "#071523";
const GOLD = "#ffd23f";
const RED = "#ff5b5b";
const GREEN = "#28c76f";
const CYAN = "#39c8ff";
const WHITE = "#fff";

const YAVIZA: Pt = [-77.694, 8.158];
const TURBO: Pt = [-76.728, 8.093];
const GAP: Pt = [-77.35, 8.34];
const NORTH_ROUTE: Pt[] = [
  [-149.9, 61.2],
  [-123.1, 49.3],
  [-122.3, 37.8],
  [-99.1, 19.4],
  [-90.5, 14.6],
  [-84.1, 9.9],
  [-79.5, 9],
  YAVIZA,
];
const SOUTH_ROUTE: Pt[] = [
  TURBO,
  [-74.1, 4.7],
  [-77, -12],
  [-70.7, -33.5],
  [-70.9, -53.1],
];
const WALK_ROUTE: Pt[] = [
  YAVIZA,
  [-77.73, 8.34],
  [-77.58, 8.56],
  [-77.4, 8.43],
  [-77.2, 8.22],
  TURBO,
];

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: -91, lat: 10, span: 112 },
  route: { lon: -91, lat: 10, span: 112 },
  end: { lon: -77.55, lat: 8.25, span: 7.5 },
  gap: { lon: -77.35, lat: 8.3, span: 6.5 },
  terrain: { lon: -77.35, lat: 8.3, span: 5.4 },
  forest: { lon: -77.35, lat: 8.3, span: 6.3 },
  community: { lon: -77.4, lat: 8.45, span: 5.2 },
  health: { lon: -77.35, lat: 8.3, span: 6.1 },
  history: { lon: -77.35, lat: 8.3, span: 8 },
  people: { lon: -77.35, lat: 8.35, span: 5.5 },
  aha: { lon: -91, lat: 8, span: 150 },
  protect: { lon: -77.35, lat: 8.3, span: 7 },
  continents: { lon: -91, lat: 8, span: 150 },
  cta: { lon: -91, lat: 8, span: 150 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("one break changes")) return "continents";
  if (s.includes("keeping it roadless")) return "protect";
  if (s.includes("title has a twist")) return "aha";
  if (s.includes("people cross")) return "people";
  if (s.includes("road plans returned")) return "history";
  if (s.includes("livestock diseases")) return "health";
  if (s.includes("indigenous homelands")) return "community";
  if (s.includes("protected forests")) return "forest";
  if (s.includes("jungle is only")) return "terrain";
  if (s.includes("missing link")) return "gap";
  if (s.includes("at yaviza")) return "end";
  if (s.includes("pan-american highway")) return "route";
  return "hook";
};

const activeIndex = (sections: Section[], T: number) => {
  let i = 0;
  sections.forEach((section, index) => {
    if (T >= section.start) i = index;
  });
  return i;
};

const cameraAt = (sections: Section[], T: number): SatView => {
  const i = activeIndex(sections, T);
  const section = sections[i] ?? sections[0];
  const from = VIEWS[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = VIEWS[kindOf(section?.text ?? "")];
  const p = ease(clamp((T - (section?.start ?? 0)) / 1.45));
  const wide = Math.max(from.span, to.span);
  const bump = wide * (1 + 0.14 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span,
  };
};

const cutPath = (points: Pt[], progress: number) => {
  if (progress <= 0) return [points[0]];
  if (progress >= 1) return points;
  const lengths = points.slice(1).map((point, i) =>
    Math.hypot(point[0] - points[i][0], point[1] - points[i][1]),
  );
  let remaining = lengths.reduce((a, b) => a + b, 0) * progress;
  const out = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    if (remaining >= lengths[i]) {
      out.push(points[i + 1]);
      remaining -= lengths[i];
      continue;
    }
    const p = lengths[i] ? remaining / lengths[i] : 0;
    out.push([
      lerp(points[i][0], points[i + 1][0], p),
      lerp(points[i][1], points[i + 1][1], p),
    ]);
    break;
  }
  return out;
};

const pathD = (points: Pt[], project: (lon: number, lat: number) => Pt) =>
  points
    .map((point, i) => {
      const [x, y] = project(point[0], point[1]);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

const Pin: React.FC<{ color?: string }> = ({ color = RED }) => (
  <svg width={64} height={88} viewBox="0 0 64 88">
    <path
      d="M32 84S7 52 7 29a25 25 0 0150 0C57 52 32 84 32 84Z"
      fill={INK}
      stroke={WHITE}
      strokeWidth={4}
    />
    <circle cx={32} cy={29} r={11} fill={color} />
  </svg>
);

const Car = () => (
  <svg width={116} height={70} viewBox="0 0 116 70">
    <path d="M20 43l14-24h48l20 24" fill={RED} stroke={INK} strokeWidth={6} />
    <rect x={8} y={38} width={100} height={22} rx={9} fill={RED} stroke={INK} strokeWidth={6} />
    <path d="M40 24h36l14 16H31Z" fill="#dff5ff" stroke={INK} strokeWidth={4} />
    <circle cx={31} cy={60} r={9} fill={INK} stroke={WHITE} strokeWidth={3} />
    <circle cx={87} cy={60} r={9} fill={INK} stroke={WHITE} strokeWidth={3} />
  </svg>
);

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["THE ROAD JUST ENDS", "Why is the highway broken?", RED],
  route: ["PAN-AMERICAN HIGHWAY", "A road across the Americas", GOLD],
  end: ["YAVIZA · PANAMA", "The asphalt stops here", RED],
  gap: ["ABOUT 100 KM", "Rainforest · swamps · hills", GREEN],
  terrain: ["THE JUNGLE IS STEP ONE", "Terrain is not the only barrier", GREEN],
  forest: ["PROTECTED FORESTS", "Darién + Los Katíos", GREEN],
  community: ["HOME, NOT EMPTY LAND", "Indigenous homelands", "#e69543"],
  health: ["DISEASE BARRIER", "Helps protect livestock", CYAN],
  history: ["PLANS KEPT STOPPING", "Cost · terrain · ecology · politics", GOLD],
  people: ["NO SAFE HIGHWAY", "Crossing can be deadly", RED],
  aha: ["YOU CAN CROSS", "But you cannot drive through", RED],
  protect: ["PROTECTS + ISOLATES", "Forests · communities · animal health", GREEN],
  continents: ["ONE MISSING LINK", "A road across 2 continents", GOLD],
  cta: ["GLOBETALES", "Stories hidden between the lines", CYAN],
};

const InfoCard: React.FC<{ kind: Kind; localT: number }> = ({ kind, localT }) => {
  const [title, sub, accent] = COPY[kind];
  const p = spring({ frame: Math.round(localT * 30), fps: 30, config: { damping: 12, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        right: 42,
        top: 310,
        minHeight: 230,
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "26px 30px 22px",
        background: "rgba(255,255,255,.95)",
        border: `6px solid ${INK}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${INK}`,
        opacity: clamp(p * 1.5),
        transform: `translateY(${(1 - p) * -90}px)`,
      }}
    >
      <div style={{ width: 30, alignSelf: "stretch", borderRadius: 20, background: accent }} />
      <div>
        <div style={{ fontFamily: DISPLAY, color: INK, fontSize: title.length > 22 ? 59 : 70, lineHeight: 0.95 }}>
          {title}
        </div>
        <div style={{ marginTop: 14, fontFamily: BODY, color: "#405064", fontSize: 32, fontWeight: 850 }}>
          {sub}
        </div>
      </div>
    </div>
  );
};

const Shield: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <div
    style={{
      width: 190,
      height: 188,
      clipPath: "polygon(50% 0,94% 18%,84% 72%,50% 100%,16% 72%,6% 18%)",
      background: color,
      border: `7px solid ${INK}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      color: WHITE,
      fontFamily: BODY,
      fontWeight: 900,
      fontSize: 25,
      textAlign: "center",
      textShadow: "0 2px 4px rgba(0,0,0,.5)",
    }}
  >
    {label}
  </div>
);

const Timeline = () => (
  <div style={{ position: "absolute", left: 70, right: 70, bottom: 330, height: 150 }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 32, height: 12, borderRadius: 8, background: WHITE }} />
    {["1970s", "PLANS", "STOP"].map((label, i) => (
      <div key={label} style={{ position: "absolute", left: `${8 + i * 40}%`, top: 0, textAlign: "center" }}>
        <div style={{ width: 66, height: 66, borderRadius: "50%", background: i === 2 ? RED : GOLD, border: `5px solid ${INK}` }} />
        <div style={{ marginLeft: -30, width: 126, marginTop: 7, fontFamily: DISPLAY, fontSize: 34, color: WHITE, textShadow: `0 3px 7px ${INK}` }}>{label}</div>
      </div>
    ))}
  </div>
);

const requiredMissing = (sections: Section[]) => {
  const expected = ["road that just", "pan-american", "at yaviza", "about 100 km", "protected forests", "indigenous", "livestock", "road plans", "people cross", "title has a twist", "keeping it roadless", "one break changes", "please like"];
  return expected.filter((term) => !sections.some((section) => section.text.toLowerCase().includes(term)));
};

const DarienGapSatScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const T = thumbnail ? 2.2 : frame / fps;
  const i = activeIndex(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind = thumbnail ? "end" : kindOf(section?.text ?? "");
  const view = thumbnail ? VIEWS.end : cameraAt(timing.sections, T);
  const { project } = makeSatProjector(view, W, H, 0.55);
  const localT = T - (section?.start ?? 0);
  const sectionP = ease(clamp(localT / Math.max(1, (section?.end ?? T + 1) - (section?.start ?? T))));
  const local = view.span < 30;
  const routeProgress = thumbnail ? 1 : kind === "hook" ? sectionP : 1;
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const marker = (point: Pt, label: string, color: string, align: "left" | "right" = "left") => {
    const [x, y] = project(point[0], point[1]);
    return (
      <g>
        <circle cx={x} cy={y} r={12} fill={color} stroke={WHITE} strokeWidth={4} />
        <text x={x + (align === "left" ? 20 : -20)} y={y - 16} textAnchor={align === "left" ? "start" : "end"} fill={WHITE} fontFamily={BODY} fontWeight={900} fontSize={28} style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 7 }}>
          {label}
        </text>
      </g>
    );
  };
  const [gapX, gapY] = project(GAP[0], GAP[1]);
  const [yavizaX, yavizaY] = project(YAVIZA[0], YAVIZA[1]);

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={W}
        height={H}
        anchorY={0.55}
        darken={thumbnail ? 0.18 : kind === "cta" ? 0.28 : 0.1}
        highlights={[
          { geom: countryGeom("PAN"), label: "Panama", labelAt: [-80.2, 8.85], fill: "rgba(255,190,20,.40)" },
          { geom: countryGeom("COL"), label: "Colombia", labelAt: [-74.6, 4.6], fill: "rgba(255,190,20,.34)" },
        ]}
      >
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={pathD(cutPath(NORTH_ROUTE, routeProgress), project)} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD(cutPath(NORTH_ROUTE, routeProgress), project)} fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD(SOUTH_ROUTE, project)} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD(SOUTH_ROUTE, project)} fill="none" stroke={GOLD} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          {local && (
            <>
              <ellipse cx={gapX} cy={gapY} rx={190} ry={250} fill="rgba(40,199,111,.22)" stroke={GREEN} strokeWidth={6} strokeDasharray="18 12" />
              {!["forest", "community", "health"].includes(kind) && marker(YAVIZA, "YAVIZA", RED, "right")}
              {!["forest", "community", "health"].includes(kind) && marker(TURBO, "TURBO", CYAN)}
              <line x1={yavizaX - 54} y1={yavizaY - 4} x2={yavizaX + 54} y2={yavizaY - 4} stroke={RED} strokeWidth={16} strokeLinecap="round" />
              {(kind === "people" || kind === "aha") && (
                <path d={pathD(cutPath(WALK_ROUTE, sectionP), project)} fill="none" stroke={RED} strokeWidth={8} strokeDasharray="16 13" strokeLinecap="round" />
              )}
            </>
          )}
        </svg>
        {local && (kind === "end" || thumbnail) && (
          <>
            <div style={{ position: "absolute", left: yavizaX - 54, top: yavizaY - 92, transform: "translate(-50%,-50%)" }}><Car /></div>
            <div style={{ position: "absolute", left: yavizaX, top: yavizaY - 8, transform: "translate(-50%,-100%)" }}><Pin /></div>
          </>
        )}
        {local && kind === "forest" && (
          <div style={{ position: "absolute", left: "50%", top: 1010, transform: "translate(-50%,-50%)", display: "flex", gap: 25 }}>
            <Shield label="DARIÉN NATIONAL PARK" color={GREEN} />
            <Shield label="LOS KATÍOS" color="#169d58" />
          </div>
        )}
        {local && kind === "community" && (
          <div style={{ position: "absolute", left: "50%", top: 1030, transform: "translate(-50%,-50%)", display: "flex", gap: 18 }}>
            {["HOME", "RIVER", "FOREST"].map((label) => <Shield key={label} label={label} color="#b86f34" />)}
          </div>
        )}
        {local && kind === "health" && (
          <div style={{ position: "absolute", left: "50%", top: 1030, transform: "translate(-50%,-50%)" }}>
            <Shield label="LIVESTOCK DISEASE BARRIER" color="#168cc4" />
          </div>
        )}
        {kind === "history" && <Timeline />}
        {!thumbnail && <InfoCard kind={kind} localT={localT} />}
        {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={1460} />}
        {!thumbnail && T >= ctaT && <CtaCard T={T} top={1130} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />}
        {!thumbnail && requiredMissing(timing.sections).length > 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, top: 850, padding: 30, background: RED, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 42, textAlign: "center" }}>
            MISSING CUES: {requiredMissing(timing.sections).join(", ")}
          </div>
        )}
        {thumbnail && (
          <>
            <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,12,20,.72),rgba(3,12,20,0) 52%,rgba(3,12,20,.76))" }} />
            <div style={{ position: "absolute", left: 46, right: 46, top: 320, fontFamily: DISPLAY, fontSize: 152, lineHeight: 0.85, color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${INK}` }}>
              THE ROAD
              <br />
              JUST <span style={{ color: GOLD }}>ENDS</span>
            </div>
            <div style={{ position: "absolute", left: 100, right: 100, top: 1320, padding: "18px 24px 12px", borderRadius: 22, border: `6px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, background: RED, color: WHITE, textAlign: "center", fontFamily: DISPLAY, fontSize: 62 }}>
              WHY NO ROAD?
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const DarienGapSatVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const cueAt = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const ctaT = cueAt("cta");
  const cues: [number, string, number][] = [
    [0.15, "riser", 0.16],
    [0.8, "boom", 0.22],
    [cueAt("route"), "whoosh", 0.16],
    [cueAt("end"), "boom", 0.16],
    [cueAt("forest"), "ding", 0.18],
    [cueAt("aha"), "boom", 0.2],
    [cueAt("continents"), "riser", 0.14],
  ];
  const sound = (time: number, name: string, volume: number) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={60}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cues.map(([time, name, volume]) => sound(time, name, volume))}
      {nudgeTimes(ctaT).map((time) => sound(time + 1.1, "ding", 0.17))}
      <DarienGapSatScene timing={timing} />
    </AbsoluteFill>
  );
};

export const DarienGapSatThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <DarienGapSatScene timing={timing} thumbnail />
);
