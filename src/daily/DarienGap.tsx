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
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";
import { BODY } from "../airace/fonts";
import { TE_DISPLAY } from "../story/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { CoverTitle } from "../cartoon/CoverTitle";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ocean: "#9ed8f6",
  land: "#f3ead7",
  ink: "#17212b",
  jungle: "#168a55",
  jungle2: "#36b46f",
  gold: "#ffc93c",
  red: "#ef3340",
  white: "#ffffff",
  blue: "#1976d2",
};

const YAVIZA: Pt = [-77.694, 8.158];
const TURBO: Pt = [-76.728, 8.093];
const GAP: Pt = [-77.55, 8.35];
const NORTH_ROUTE: Pt[] = [
  [-149.9, 61.2],
  [-123.1, 49.3],
  [-122.3, 37.8],
  [-99.1, 19.4],
  [-90.5, 14.6],
  [-84.1, 9.9],
  [-79.5, 9.0],
  YAVIZA,
];
const SOUTH_ROUTE: Pt[] = [
  TURBO,
  [-74.1, 4.7],
  [-77.0, -12.0],
  [-70.7, -33.5],
  [-70.9, -53.1],
];
const FOOT_ROUTE: Pt[] = [YAVIZA, [-77.72, 8.35], [-77.62, 8.55], [-77.45, 8.42], [-77.25, 8.22], TURBO];
const SEA_ROUTE: Pt[] = [YAVIZA, [-79.1, 8.7], [-78.8, 10.0], [-77.1, 9.8], TURBO];

const WORLD: View = { lon: -91, lat: 8, span: 155 };
const AMERICAS: View = { lon: -91, lat: 9, span: 112 };
const LOCAL: View = { lon: -77.4, lat: 8.35, span: 13 };
const CLOSE: View = { lon: -77.5, lat: 8.32, span: 7.5 };

const sectionKind = (text: string) => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("answer becomes clear") || s.includes("title has a twist") || s.includes("biggest misconception") || s.includes("cannot drive")) return "aha";
  if (s.includes("500,000") || s.includes("migrants") || s.includes("people do cross") || s.includes("people still cross") || s.includes("hiking route")) return "people";
  if (s.includes("disease") || s.includes("livestock")) return "health";
  if (s.includes("indigenous") || s.includes("whose land") || s.includes("community")) return "community";
  if (s.includes("national park") || s.includes("protected") || s.includes("wildlife") || s.includes("habitat") || s.includes("forest corridor")) return "forest";
  if (s.includes("timeline") || s.includes("proposal") || s.includes("plans") || s.includes("20th century") || s.includes("single dramatic answer")) return "history";
  if (s.includes("mud") || s.includes("wetlands") || s.includes("rivers") || s.includes("terrain") || s.includes("100 km")) return "terrain";
  if (s.includes("turbo") || s.includes("cargo") || s.includes("transport around") || s.includes("wheels leave")) return "ends";
  if (s.includes("should the highway") || s.includes("better ports") || s.includes("dilemma")) return "dilemma";
  if (s.includes("pan-american") || s.includes("2 continents") || s.includes("network") || s.includes("entire highway")) return "route";
  if (s.includes("road that just") || s.includes("no bridge")) return "hook";
  return "gap";
};

const viewFor = (kind: string): View => {
  if (kind === "hook" || kind === "route") return AMERICAS;
  if (kind === "aha" || kind === "cta") return WORLD;
  if (kind === "terrain" || kind === "forest" || kind === "community" || kind === "health" || kind === "people") return CLOSE;
  return LOCAL;
};

const currentSection = (sections: Section[], T: number) => {
  let i = 0;
  for (let j = 0; j < sections.length; j++) if (T >= sections[j].start) i = j;
  return i;
};

const cameraAt = (sections: Section[], T: number) => {
  const i = currentSection(sections, T);
  const cur = sections[i];
  const a = viewFor(sectionKind(sections[Math.max(0, i - 1)]?.text ?? ""));
  const b = viewFor(sectionKind(cur?.text ?? ""));
  const p = ease(clamp((T - (cur?.start ?? 0)) / 1.15));
  const mid = Math.max(a.span, b.span) * (1 + 0.18 * Math.sin(Math.PI * p));
  const span = p < 0.5
    ? a.span * Math.pow(mid / a.span, p * 2)
    : mid * Math.pow(b.span / mid, (p - 0.5) * 2);
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span };
};

const cutPath = (pts: Pt[], p: number) => {
  if (p <= 0) return [pts[0]];
  if (p >= 1) return pts;
  const lens = pts.slice(1).map((v, i) => Math.hypot(v[0] - pts[i][0], v[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let target = total * p;
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < lens.length; i++) {
    if (target >= lens[i]) {
      out.push(pts[i + 1]);
      target -= lens[i];
    } else {
      const q = lens[i] ? target / lens[i] : 0;
      out.push([lerp(pts[i][0], pts[i + 1][0], q), lerp(pts[i][1], pts[i + 1][1], q)]);
      break;
    }
  }
  return out;
};

const Pin: React.FC<{ color?: string }> = ({ color = C.red }) => (
  <svg width="60" height="82" viewBox="0 0 60 82">
    <path d="M30 78C30 78 7 48 7 28A23 23 0 1146 44Z" fill={C.ink} stroke="#fff" strokeWidth="4" />
    <circle cx="30" cy="28" r="11" fill={color} />
  </svg>
);

const Car: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <svg width={100 * scale} height={58 * scale} viewBox="0 0 100 58">
    <path d="M14 35l11-19h43l17 19" fill={C.red} stroke={C.ink} strokeWidth="5" strokeLinejoin="round" />
    <rect x="6" y="31" width="88" height="18" rx="8" fill={C.red} stroke={C.ink} strokeWidth="5" />
    <circle cx="25" cy="49" r="8" fill={C.ink} stroke="#fff" strokeWidth="3" />
    <circle cx="76" cy="49" r="8" fill={C.ink} stroke="#fff" strokeWidth="3" />
    <path d="M31 20h31l10 12H25z" fill="#dff5ff" stroke={C.ink} strokeWidth="3" />
  </svg>
);

const Shield: React.FC<{ label: string; color?: string }> = ({ label, color = C.jungle }) => (
  <div style={{ width: 180, height: 190, clipPath: "polygon(50% 0,94% 18%,84% 72%,50% 100%,16% 72%,6% 18%)", background: color, border: `8px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: BODY, fontSize: 24, fontWeight: 900, textAlign: "center", padding: 24 }}>
    {label}
  </div>
);

const iconSet: Record<string, { title: string; sub: string; icon: string; accent: string }> = {
  hook: { title: "THE ROAD JUST ENDS", sub: "No drive-through route", icon: "STOP", accent: C.red },
  route: { title: "ONE BROKEN LINK", sub: "Pan-American Highway", icon: "ROAD", accent: C.gold },
  terrain: { title: "ABOUT 100 KM", sub: "Rainforest · rivers · swamps · hills", icon: "MUD", accent: C.jungle },
  forest: { title: "PROTECTED FORESTS", sub: "Darién + Los Katíos", icon: "PARK", accent: C.jungle2 },
  community: { title: "HOME, NOT EMPTY SPACE", sub: "Indigenous communities", icon: "HOME", accent: "#a65d2e" },
  health: { title: "A NATURAL BARRIER", sub: "Livestock disease control", icon: "HEALTH", accent: C.blue },
  history: { title: "PLANS KEPT STOPPING", sub: "Cost · terrain · ecology · rights", icon: "1970s", accent: C.gold },
  ends: { title: "THE WHEELS LEAVE LAND", sub: "Vehicles must go around by sea", icon: "SHIP", accent: C.blue },
  people: { title: "NO SAFE PUBLIC ROUTE", sub: "A humanitarian crisis", icon: "CARE", accent: C.red },
  dilemma: { title: "CONNECTION vs PROTECTION", sub: "There is no simple answer", icon: "VS", accent: C.gold },
  aha: { title: "YOU CAN CROSS", sub: "But not by road", icon: "AHA", accent: C.red },
  gap: { title: "THE DARIÉN GAP", sub: "Panama ↔ Colombia", icon: "MAP", accent: C.jungle },
  cta: { title: "MAPS HIDE STORIES", sub: "GlobeTales", icon: "GT", accent: C.red },
};

const MainCard: React.FC<{ kind: string; frame: number; start: number; fps: number; wide: boolean }> = ({ kind, frame, start, fps, wide }) => {
  const data = iconSet[kind] ?? iconSet.gap;
  const p = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{
      position: "absolute",
      left: wide ? 58 : 44,
      right: wide ? "auto" : 44,
      top: wide ? 82 : 300,
      width: wide ? 610 : "auto",
      minHeight: wide ? 200 : 238,
      transform: `translateY(${(1 - p) * -100}px) scale(${0.9 + 0.1 * p})`,
      opacity: clamp(p * 1.4),
      background: "rgba(255,255,255,0.94)",
      border: `6px solid ${C.ink}`,
      borderRadius: 30,
      boxShadow: `0 14px 0 ${C.ink}`,
      padding: wide ? "28px 32px" : "30px 30px 24px",
      display: "flex",
      alignItems: "center",
      gap: 26,
    }}>
      <div style={{ width: wide ? 116 : 130, height: wide ? 116 : 130, flex: "0 0 auto", borderRadius: 28, background: data.accent, border: `5px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.ink, fontFamily: TE_DISPLAY, fontSize: data.icon.length > 4 ? 28 : 42, fontWeight: 900, textAlign: "center" }}>{data.icon}</div>
      <div>
        <div style={{ fontFamily: TE_DISPLAY, color: C.ink, fontSize: wide ? 56 : 63, lineHeight: 0.98, fontWeight: 900 }}>{data.title}</div>
        <div style={{ marginTop: 14, fontFamily: BODY, color: "#43505b", fontSize: wide ? 29 : 33, lineHeight: 1.15, fontWeight: 800 }}>{data.sub}</div>
      </div>
    </div>
  );
};

const Counter: React.FC<{ T: number; start: number; wide: boolean }> = ({ T, start, wide }) => {
  const value = Math.round(500000 * ease(clamp((T - start) / 2.6)));
  return (
    <div style={{ position: "absolute", left: wide ? 78 : 90, bottom: wide ? 88 : 320, background: C.red, color: "#fff", border: `6px solid ${C.ink}`, boxShadow: `0 10px 0 ${C.ink}`, borderRadius: 24, padding: "18px 30px 12px", fontFamily: TE_DISPLAY, fontSize: wide ? 70 : 82 }}>
      {value.toLocaleString("en-IN")}+ <span style={{ fontSize: wide ? 30 : 34 }}>CROSSED IN 2023</span>
    </div>
  );
};

export const DarienScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const T = thumbnail ? 2.2 : frame / fps;
  const wide = W > H;
  const i = currentSection(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : sectionKind(section?.text ?? "");
  const cam = thumbnail ? LOCAL : cameraAt(timing.sections, T);
  const refLat = 8;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const focusX = wide ? W * 0.65 : W * 0.5;
  const focusY = wide ? H * 0.55 : H * 0.53;
  const mapH = wide ? H * 1.08 : H * 0.86;
  const scale = Math.min(W / (cam.span * cos), mapH / (cam.span * (wide ? 0.55 : 1.08)));
  const P = (lon: number, lat: number): Pt => [focusX + (lon - cam.lon) * cos * scale, focusY - (lat - cam.lat) * scale];
  const d = (pts: Pt[]) => pts.map((p, j) => `${j ? "L" : "M"}${P(p[0], p[1]).map((v) => v.toFixed(1)).join(",")}`).join(" ");
  const local = cam.span < 30;
  const parkOn = ["forest", "community", "health", "dilemma", "aha", "cta"].includes(kind);
  const peopleOn = kind === "people";
  const roadOn = kind !== "terrain" ? 1 : 0.5;
  const routeP = thumbnail ? 1 : ease(clamp((T - section.start) / Math.max(1, section.end - section.start)));
  const ctaIndex = timing.sections.findIndex((s) => s.text.toLowerCase().includes("please like"));
  const cta = timing.sections[Math.max(0, ctaIndex)];
  const wordTime = (word: string) => cta?.words.find((w) => w.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(word))?.start ?? cta?.start ?? timing.durationSec;
  const ctaT = cta?.start ?? timing.durationSec;
  const marker = (pt: Pt, label: string, color: string, dx = 18) => {
    const [x, y] = P(...pt);
    return (
      <g>
        <circle cx={x} cy={y} r={local ? 11 : 7} fill={color} stroke="#fff" strokeWidth={4} />
        <text x={x + dx} y={y - 14} fill="#fff" fontFamily={BODY} fontSize={local ? 30 : 22} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}>{label}</text>
      </g>
    );
  };

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="sea" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#d8f2ff" />
            <stop offset="1" stopColor={C.ocean} />
          </radialGradient>
          <pattern id="hatch" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <rect width="8" height="18" fill="rgba(17,138,85,0.24)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#sea)" />
        {COUNTRIES.map((country) => {
          const selected = country.iso === "PAN" || country.iso === "COL";
          return (
            <path
              key={country.iso}
              d={geomPath(country.geom as never, P)}
              fill={selected ? (parkOn ? C.jungle : "#d7dfa8") : C.land}
              stroke={C.ink}
              strokeWidth={local ? 2.5 : 1.2}
              strokeLinejoin="round"
            />
          );
        })}
        <path d={d(NORTH_ROUTE)} fill="none" stroke="#fff" strokeWidth={local ? 18 : 9} strokeLinecap="round" strokeLinejoin="round" opacity={roadOn} />
        <path d={d(NORTH_ROUTE)} fill="none" stroke={C.gold} strokeWidth={local ? 10 : 5} strokeLinecap="round" strokeLinejoin="round" opacity={roadOn} />
        <path d={d(SOUTH_ROUTE)} fill="none" stroke="#fff" strokeWidth={local ? 18 : 9} strokeLinecap="round" strokeLinejoin="round" opacity={roadOn} />
        <path d={d(SOUTH_ROUTE)} fill="none" stroke={C.gold} strokeWidth={local ? 10 : 5} strokeLinecap="round" strokeLinejoin="round" opacity={roadOn} />
        {local && (
          <>
            <ellipse cx={P(...GAP)[0]} cy={P(...GAP)[1]} rx={2.1 * scale} ry={1.35 * scale} fill="url(#hatch)" stroke={C.jungle2} strokeWidth={6} opacity={0.92} />
            <path d={d(cutPath(FOOT_ROUTE, peopleOn ? routeP : 0))} fill="none" stroke={C.red} strokeWidth={7} strokeDasharray="14 12" strokeLinecap="round" />
            <path d={d(cutPath(SEA_ROUTE, kind === "ends" || kind === "dilemma" ? routeP : 0))} fill="none" stroke={C.blue} strokeWidth={8} strokeDasharray="18 10" strokeLinecap="round" />
          </>
        )}
        {marker(YAVIZA, "YAVIZA", C.red, -118)}
        {marker(TURBO, "TURBO", C.blue)}
        {local && (
          <>
            <text x={P(-78.8, 9.25)[0]} y={P(-78.8, 9.25)[1]} fill="#fff" fontFamily={TE_DISPLAY} fontSize={38} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>PANAMA</text>
            <text x={P(-76.4, 7.25)[0]} y={P(-76.4, 7.25)[1]} fill="#fff" fontFamily={TE_DISPLAY} fontSize={38} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 7 }}>COLOMBIA</text>
          </>
        )}
      </svg>

      {local && kind === "forest" && (
        <div style={{ position: "absolute", left: "50%", top: wide ? 500 : 940, transform: "translate(-50%,-50%)", display: "flex", gap: 22 }}>
          <Shield label="DARIÉN NATIONAL PARK" />
          <Shield label="LOS KATÍOS" color="#26a65b" />
        </div>
      )}
      {local && kind === "health" && (
        <div style={{ position: "absolute", left: "50%", top: wide ? 560 : 1030, transform: "translate(-50%,-50%)" }}>
          <Shield label="DISEASE BARRIER" color={C.blue} />
        </div>
      )}
      {local && kind === "community" && (
        <div style={{ position: "absolute", left: "50%", top: wide ? 575 : 1040, transform: "translate(-50%,-50%)", display: "flex", gap: 16 }}>
          {["HOME", "RIVER", "FOREST"].map((x) => <div key={x} style={{ background: "#fff", border: `5px solid ${C.ink}`, borderRadius: 18, padding: "16px 18px 10px", fontFamily: TE_DISPLAY, fontSize: 30, color: C.ink, boxShadow: `0 7px 0 ${C.ink}` }}>{x}</div>)}
        </div>
      )}
      {kind === "history" && (
        <div style={{ position: "absolute", left: wide ? 70 : 70, right: 70, bottom: wide ? 90 : 330, height: 120 }}>
          <div style={{ height: 12, background: C.ink, borderRadius: 9 }} />
          {["1920s", "1970s", "TODAY"].map((year, k) => <div key={year} style={{ position: "absolute", left: `${8 + k * 42}%`, top: -30, width: 30, height: 70, background: k === 2 ? C.red : C.gold, border: `4px solid ${C.ink}`, borderRadius: 15 }}><span style={{ position: "absolute", top: 74, left: -35, width: 100, textAlign: "center", fontFamily: BODY, fontWeight: 900, fontSize: 24, color: C.ink }}>{year}</span></div>)}
        </div>
      )}
      {peopleOn && <Counter T={T} start={section.start} wide={wide} />}

      {!thumbnail && <MainCard kind={kind} frame={frame} start={section.start} fps={fps} wide={wide} />}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 220 : 1460} />}
      {!thumbnail && T >= ctaT && (
        <CtaCard T={T} top={wide ? 610 : 1160} likeT={wordTime("like")} shareT={wordTime("share")} subT={wordTime("subscribe")} />
      )}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(10,25,38,.72),rgba(10,25,38,0) 48%,rgba(10,25,38,.66))" }} />
          <div style={{ position: "absolute", left: wide ? 74 : 42, right: wide ? 920 : 42, top: wide ? 100 : 320, fontFamily: TE_DISPLAY, fontWeight: 900, lineHeight: 0.9, color: "#fff", fontSize: wide ? 106 : 142, WebkitTextStroke: `${wide ? 10 : 12}px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 ${wide ? 10 : 14}px 0 ${C.ink}` }}>
            THE ROAD
            <br />
            JUST <span style={{ color: C.gold }}>ENDS</span>
          </div>
          <div style={{ position: "absolute", left: wide ? 84 : 105, bottom: wide ? 95 : 335, background: C.red, color: "#fff", border: `6px solid ${C.ink}`, borderRadius: 22, boxShadow: `0 9px 0 ${C.ink}`, padding: wide ? "14px 28px 8px" : "16px 30px 10px", fontFamily: TE_DISPLAY, fontSize: wide ? 48 : 57 }}>
            NO ROAD THROUGH
          </div>
          <div style={{ position: "absolute", left: wide ? W * 0.66 : W * 0.51, top: wide ? H * 0.51 : 1120, transform: "translate(-50%,-50%) rotate(-7deg)" }}><Car scale={wide ? 1.6 : 1.9} /></div>
          <div style={{ position: "absolute", left: wide ? W * 0.77 : W * 0.71, top: wide ? H * 0.42 : 950, transform: "translate(-50%,-100%)" }}><Pin color={C.red} /></div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const DarienGapVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const sfx: [number, string, number][] = [
    [0.15, "riser", 0.18],
    [0.75, "boom", 0.24],
    [timing.sections.find((s) => sectionKind(s.text) === "terrain")?.start ?? NaN, "whoosh", 0.18],
    [timing.sections.find((s) => sectionKind(s.text) === "forest")?.start ?? NaN, "ding", 0.2],
    [timing.sections.find((s) => sectionKind(s.text) === "aha")?.start ?? NaN, "boom", 0.22],
  ];
  const cue = (t: number, name: string, volume: number) => Number.isFinite(t) ? (
    <Sequence key={`${name}-${t}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={60}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([t, n, v]) => cue(t, n, v))}
      {nudgeTimes(ctaT).map((t) => cue(t + 1.1, "ding", 0.18))}
      <DarienScene timing={timing} />
      <CoverTitle lines={["THE ROAD", "THAT JUST ENDS"]} sub="Why no one can cross the Darién Gap" accent="#2fbf71" />
    </AbsoluteFill>
  );
};

export const DarienGapThumb: React.FC<{ timing: Timing }> = ({ timing }) => <DarienScene timing={timing} thumbnail />;
