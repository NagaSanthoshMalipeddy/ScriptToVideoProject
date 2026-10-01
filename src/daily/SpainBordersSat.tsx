import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { countryGeom, makeSatProjector, SatelliteMap, type SatView } from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Kind = "hook" | "llivia" | "treaty" | "loophole" | "road" | "africa" | "penon" | "storm" | "gibraltar" | "pheasant" | "summary" | "aha" | "bridge" | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const INK = "#071523";
const GOLD = "#ffd23f";
const RED = "#ef3340";
const BLUE = "#3b82f6";
const GREEN = "#16a061";
const PURPLE = "#8b5cf6";
const WHITE = "#ffffff";

const LOC = {
  llivia: [1.981, 42.464] as Pt,
  mainSpain: [1.928, 42.431] as Pt,
  ceuta: [-5.321, 35.889] as Pt,
  melilla: [-2.938, 35.292] as Pt,
  penon: [-4.301, 35.172] as Pt,
  gibraltar: [-5.353, 36.141] as Pt,
  pheasant: [-1.765, 43.342] as Pt,
};

const VIEWS: Record<Kind, SatView> = {
  hook: { lon: -1.7, lat: 40.2, span: 24 },
  llivia: { lon: 1.65, lat: 42.38, span: 4.8 },
  treaty: { lon: 1.65, lat: 42.38, span: 5.4 },
  loophole: { lon: 1.76, lat: 42.42, span: 3.1 },
  road: { lon: 1.955, lat: 42.445, span: 0.72 },
  africa: { lon: -3.8, lat: 35.75, span: 8.8 },
  penon: { lon: -4.3, lat: 35.2, span: 2.3 },
  storm: { lon: -4.3, lat: 35.2, span: 1.65 },
  gibraltar: { lon: -5.33, lat: 36.12, span: 2.7 },
  pheasant: { lon: -1.76, lat: 43.34, span: 2.5 },
  summary: { lon: -2.4, lat: 39.5, span: 29 },
  aha: { lon: 1.65, lat: 42.38, span: 4.6 },
  bridge: { lon: -2.4, lat: 39.5, span: 30 },
  cta: { lon: -2.4, lat: 39.5, span: 31 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("world is full")) return "bridge";
  if (s.includes("answer is a legal")) return "aha";
  if (s.includes("border map reaches")) return "summary";
  if (s.includes("island governed")) return "pheasant";
  if (s.includes("gibraltar")) return "gibraltar";
  if (s.includes("1934 storm")) return "storm";
  if (s.includes("85 metres")) return "penon";
  if (s.includes("ceuta and melilla")) return "africa";
  if (s.includes("1.6 kilometres")) return "road";
  if (s.includes("therefore, it stayed")) return "loophole";
  if (s.includes("1659") || s.includes("officially a town")) return "treaty";
  if (s.includes("called llívia")) return "llivia";
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
  const p = ease(clamp((T - (section?.start ?? 0)) / 1.55));
  const wide = Math.max(from.span, to.span);
  const bump = wide * (1 + 0.16 * Math.sin(Math.PI * p));
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span: p < 0.5 ? from.span * Math.pow(bump / from.span, p * 2) : bump * Math.pow(to.span / bump, (p - 0.5) * 2),
  };
};

const COPY: Record<Kind, [string, string, string]> = {
  hook: ["A TOWN INSIDE FRANCE?!", "Spain's borders are crazy", GOLD],
  llivia: ["LLÍVIA, SPAIN", "42.46° N · 1.98° E · about 1,500 people", RED],
  treaty: ["1659 · 33 VILLAGES", "But Llívia was legally a town", GOLD],
  loophole: ["FRANCE WRAPS AROUND IT", "One word kept Llívia Spanish", RED],
  road: ["ONLY ABOUT 1.6 KM", "Llívia to main Spanish territory", RED],
  africa: ["CEUTA + MELILLA", "Spanish cities in North Africa", GREEN],
  penon: ["ABOUT 85 METRES", "Spain's tiny land border with Morocco", GOLD],
  storm: ["A 1934 STORM", "Joined the Spanish rock to Morocco", BLUE],
  gibraltar: ["GIBRALTAR", "A British Overseas Territory", PURPLE],
  pheasant: ["EVERY 6 MONTHS", "Governed by Spain, then France", BLUE],
  summary: ["EUROPE + AFRICA", "Treaties · storms · shared rule", GOLD],
  aha: ["TOWN, NOT VILLAGE", "The one-word legal loophole", RED],
  bridge: ["MORE MAP MYSTERIES", "Every border has a story", GOLD],
  cta: ["GLOBETALES", "Stories hidden between the lines", GOLD],
};

const InfoCard: React.FC<{ kind: Kind; localT: number }> = ({ kind, localT }) => {
  const [title, sub, accent] = COPY[kind];
  const p = spring({ frame: Math.round(localT * 30), fps: 30, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 44, right: 44, top: 310, minHeight: 230, display: "flex", alignItems: "center", gap: 25, padding: "28px 30px 24px", background: "rgba(255,255,255,.95)", border: `6px solid ${INK}`, borderRadius: 30, boxShadow: `0 14px 0 ${INK}`, opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * -90}px)` }}>
      <div style={{ width: 28, alignSelf: "stretch", borderRadius: 20, background: accent }} />
      <div>
        <div style={{ fontFamily: DISPLAY, color: INK, fontSize: title.length > 21 ? 60 : 72, lineHeight: 0.96 }}>{title}</div>
        <div style={{ marginTop: 14, fontFamily: BODY, color: "#405064", fontSize: 31, fontWeight: 850 }}>{sub}</div>
      </div>
    </div>
  );
};

const Marker: React.FC<{ point: Pt; label: string; color: string; project: (lon: number, lat: number) => Pt; on?: number; align?: "left" | "right" }> = ({ point, label, color, project, on = 1, align = "left" }) => {
  const [x, y] = project(point[0], point[1]);
  return (
    <g opacity={clamp(on * 1.5)} transform={`translate(0 ${(1 - on) * -160})`}>
      <path d={`M${x} ${y}c0 0-24-29-24-51a24 24 0 1 1 48 0c0 22-24 51-24 51Z`} fill={INK} stroke={WHITE} strokeWidth={4} />
      <circle cx={x} cy={y - 51} r={9} fill={color} />
      <text x={x + (align === "left" ? 24 : -24)} y={y - 64} textAnchor={align === "left" ? "start" : "end"} fill={WHITE} fontFamily={BODY} fontWeight={900} fontSize={27} style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 7 }}>{label}</text>
    </g>
  );
};

const pathD = (points: Pt[], project: (lon: number, lat: number) => Pt) =>
  points.map((point, i) => `${i ? "L" : "M"}${project(point[0], point[1]).join(",")}`).join(" ");

const EvidenceCard: React.FC<{ kind: Kind }> = ({ kind }) => {
  if (!["treaty", "storm", "pheasant"].includes(kind)) return null;
  return (
    <div style={{ position: "absolute", left: 80, right: 80, bottom: 320, height: 310, borderRadius: 28, border: `6px solid ${INK}`, boxShadow: `0 13px 0 ${INK}`, overflow: "hidden", background: "rgba(255,250,225,.96)", color: INK, fontFamily: BODY, fontWeight: 900, textAlign: "center" }}>
      {kind === "treaty" && <><div style={{ fontFamily: DISPLAY, fontSize: 58, marginTop: 38 }}>1659 TREATY LIST</div><div style={{ fontSize: 39, marginTop: 28 }}>33 VILLAGES → FRANCE</div><div style={{ fontSize: 45, color: RED, marginTop: 16 }}>LLÍVIA = TOWN</div></>}
      {kind === "storm" && <><div style={{ height: 120, background: "linear-gradient(#87c9ee,#294f75)", color: WHITE, fontFamily: DISPLAY, fontSize: 64, paddingTop: 28 }}>STORM · 1934</div><div style={{ fontSize: 43, marginTop: 38 }}>ROCK + SAND = LAND BORDER</div></>}
      {kind === "pheasant" && <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: DISPLAY, fontSize: 58, color: WHITE }}><div style={{ background: RED, paddingTop: 75 }}>SPAIN<br /><span style={{ fontFamily: BODY, fontSize: 30 }}>FEB–JUL</span></div><div style={{ background: BLUE, paddingTop: 75 }}>FRANCE<br /><span style={{ fontFamily: BODY, fontSize: 30 }}>AUG–JAN</span></div></div>}
    </div>
  );
};

const missingCues = (sections: Section[]) => {
  const expected = ["borders are crazy", "called llívia", "1659", "officially a town", "therefore, it stayed", "1.6 kilometres", "ceuta and melilla", "85 metres", "1934 storm", "gibraltar", "island governed", "border map reaches", "legal loophole", "world is full", "please like"];
  return expected.filter((needle) => !sections.some((section) => section.text.toLowerCase().includes(needle)));
};

const SpainBordersSceneSat: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const T = thumbnail ? 2.5 : frame / fps;
  const index = activeIndex(timing.sections, T);
  const section = timing.sections[index] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "llivia" : kindOf(section?.text ?? "");
  const view = thumbnail ? { lon: 1.55, lat: 42.36, span: 5.2 } : cameraAt(timing.sections, T);
  const { project } = makeSatProjector(view, W, H, 0.56);
  const localT = T - (section?.start ?? 0);
  const reveal = thumbnail ? 1 : ease(clamp(localT / 0.75));
  const cta = timing.sections.find((item) => item.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const highlights = [
    { geom: countryGeom("ESP"), label: "Spain", labelAt: [-3.6, 40.2] as Pt, fill: "rgba(255,190,20,.46)" },
    { geom: countryGeom("FRA"), label: "France", labelAt: [2.4, 46.3] as Pt, fill: "rgba(255,190,20,.30)" },
    ...(["africa", "penon", "storm", "summary", "bridge", "cta"].includes(kind) ? [{ geom: countryGeom("MAR"), label: "Morocco", labelAt: [-5.4, 32.5] as Pt, fill: "rgba(255,190,20,.34)" }] : []),
    ...(["gibraltar", "summary"].includes(kind) ? [{ geom: countryGeom("GBR"), label: "United Kingdom", labelAt: [-2.5, 54.5] as Pt, fill: "rgba(255,190,20,.30)" }] : []),
  ];
  const marker = (point: Pt, label: string, color = RED, align: "left" | "right" = "left", on = reveal) => <Marker point={point} label={label} color={color} project={project} align={align} on={on} />;

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <SatelliteMap view={view} width={W} height={H} anchorY={0.56} darken={thumbnail ? 0.22 : kind === "cta" ? 0.32 : 0.12} highlights={highlights}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          {(["hook", "llivia", "treaty", "loophole", "road", "aha"].includes(kind)) && marker(LOC.llivia, "LLÍVIA · SPAIN")}
          {kind === "road" && <><path d={pathD([LOC.llivia, LOC.mainSpain], project)} fill="none" stroke={INK} strokeWidth={17} strokeDasharray="20 13" /><path d={pathD([LOC.llivia, LOC.mainSpain], project)} fill="none" stroke={GOLD} strokeWidth={8} strokeDasharray="20 13" />{marker(LOC.mainSpain, "MAIN SPAIN", GOLD, "right")}</>}
          {kind === "africa" && <>{marker(LOC.ceuta, "CEUTA", RED, "right")}{marker(LOC.melilla, "MELILLA")}</>}
          {(kind === "penon" || kind === "storm") && marker(LOC.penon, "PEÑÓN · ~85 m", GOLD)}
          {kind === "gibraltar" && marker(LOC.gibraltar, "GIBRALTAR · UK", PURPLE)}
          {kind === "pheasant" && marker(LOC.pheasant, "PHEASANT ISLAND", BLUE)}
          {(["summary", "bridge", "cta"].includes(kind)) && <>{marker(LOC.llivia, "LLÍVIA", RED, "left", 1)}{marker(LOC.ceuta, "CEUTA", RED, "right", 1)}{marker(LOC.melilla, "MELILLA", RED, "left", 1)}{marker(LOC.penon, "85 m", GOLD, "left", 1)}{marker(LOC.gibraltar, "GIBRALTAR", PURPLE, "right", 1)}{marker(LOC.pheasant, "6 MONTHS", BLUE, "left", 1)}</>}
        </svg>
        {!thumbnail && <InfoCard kind={kind} localT={localT} />}
        {!thumbnail && <EvidenceCard kind={kind} />}
        {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={650} />}
        {!thumbnail && T >= ctaT && <CtaCard T={T} top={1110} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />}
        {!thumbnail && missingCues(timing.sections).length > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 850, padding: 30, background: RED, color: WHITE, fontFamily: BODY, fontWeight: 900, fontSize: 40, textAlign: "center" }}>MISSING CUES: {missingCues(timing.sections).join(", ")}</div>}
        {thumbnail && <>
          <AbsoluteFill style={{ background: "linear-gradient(180deg,rgba(3,12,20,.82),rgba(3,12,20,.05) 55%,rgba(3,12,20,.75))" }} />
          <div style={{ position: "absolute", left: 48, right: 48, top: 330, fontFamily: DISPLAY, fontSize: 148, lineHeight: 0.86, color: WHITE, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", textShadow: `0 13px 0 ${INK}`, textAlign: "center" }}>SPAIN'S BORDERS<br /><span style={{ color: GOLD }}>ARE CRAZY</span></div>
          <div style={{ position: "absolute", left: 90, right: 90, top: 1280, padding: "18px 22px 13px", borderRadius: 23, border: `6px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, background: RED, color: WHITE, textAlign: "center", fontFamily: DISPLAY, fontSize: 58 }}>TOWN INSIDE FRANCE?!</div>
          <div style={{ position: "absolute", left: "67%", top: 1135, transform: "translate(-50%,-100%) scale(2.2)" }}><svg width="70" height="100" viewBox="0 0 64 88"><path d="M32 84S7 52 7 29a25 25 0 0150 0C57 52 32 84 32 84Z" fill={INK} stroke={WHITE} strokeWidth={4}/><circle cx={32} cy={29} r={11} fill={RED}/></svg></div>
        </>}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const SpainBordersVideoSat: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const startOf = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const ctaT = startOf("cta");
  const cues: [number, string, number][] = [[0.1, "riser", 0.16], [0.8, "boom", 0.22], [startOf("treaty"), "ding", 0.16], [startOf("africa"), "whoosh", 0.17], [startOf("penon"), "pop", 0.18], [startOf("aha"), "boom", 0.2]];
  const sound = (time: number, name: string, volume: number) => Number.isFinite(time) ? <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={60}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence> : null;
  return <AbsoluteFill><Audio src={staticFile(timing.audio)} />{cues.map(([time, name, volume]) => sound(time, name, volume))}{nudgeTimes(ctaT).map((time) => sound(time + 1.1, "ding", 0.16))}<SpainBordersSceneSat timing={timing} /></AbsoluteFill>;
};

export const SpainBordersThumbSat: React.FC<{ timing: Timing }> = ({ timing }) => <SpainBordersSceneSat timing={timing} thumbnail />;
