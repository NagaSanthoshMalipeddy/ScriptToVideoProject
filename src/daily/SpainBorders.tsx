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
import { CoverTitle } from "../cartoon/CoverTitle";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const C = {
  ocean: "#12395a",
  ocean2: "#07111f",
  land: "#f3ead7",
  ink: "#111827",
  spain: "#ef3340",
  france: "#3b82f6",
  morocco: "#16a061",
  uk: "#7c3aed",
  gold: "#ffd23f",
  white: "#ffffff",
};

const LOC = {
  llivia: { p: [1.981, 42.464] as Pt, label: "LLÍVIA" },
  puigcerda: { p: [1.928, 42.431] as Pt, label: "MAIN SPAIN" },
  pheasant: { p: [-1.765, 43.342] as Pt, label: "PHEASANT ISLAND" },
  ceuta: { p: [-5.321, 35.889] as Pt, label: "CEUTA" },
  melilla: { p: [-2.938, 35.292] as Pt, label: "MELILLA" },
  penon: { p: [-4.301, 35.172] as Pt, label: "PEÑÓN · ~85 m" },
  gibraltar: { p: [-5.353, 36.141] as Pt, label: "GIBRALTAR" },
};

const V: Record<string, View> = {
  overview: { lon: -2.5, lat: 39.5, span: 26 },
  llivia: { lon: 1.4, lat: 42.35, span: 5.4 },
  road: { lon: 1.94, lat: 42.45, span: 1.1 },
  pheasant: { lon: -1.65, lat: 43.25, span: 3.2 },
  strait: { lon: -3.9, lat: 36.2, span: 8.7 },
  africa: { lon: -3.8, lat: 35.8, span: 8.2 },
  penon: { lon: -4.3, lat: 35.2, span: 2.5 },
  gibraltar: { lon: -5.3, lat: 36.15, span: 2.8 },
  finale: { lon: -2.7, lat: 39.2, span: 30 },
};

type Kind =
  | "hook"
  | "overview"
  | "llivia"
  | "treaty"
  | "road"
  | "pheasant"
  | "strait"
  | "africa"
  | "penon"
  | "gibraltar"
  | "summary"
  | "aha"
  | "cta";

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("one word preserved") || s.includes("answer is a legal") || s.includes("town inside france is real")) return "aha";
  if (s.includes("put the pieces") || s.includes("border map reaches") || s.includes("not random decorations")) return "summary";
  if (s.includes("gibraltar") || s.includes("british overseas") || s.includes("british territory")) return "gibraltar";
  if (s.includes("85 metres") || s.includes("85-metre") || s.includes("1934 storm") || s.includes("football pitch") || s.includes("spanish-held rock")) return "penon";
  if (s.includes("ceuta") || s.includes("melilla") || s.includes("north african") || s.includes("spain in africa")) return "africa";
  if (s.includes("strait of gibraltar")) return "strait";
  if (s.includes("pheasant") || s.includes("6 months") || s.includes("condominium") || s.includes("february")) return "pheasant";
  if (s.includes("road through france") || s.includes("1.6 kilomet") || s.includes("workers, students")) return "road";
  if (s.includes("1659") || s.includes("33 villages") || s.includes("town, not a village") || s.includes("specific word")) return "treaty";
  if (s.includes("llívia") || s.includes("llivia") || s.includes("surrounded by france")) return "llivia";
  if (s.includes("normal map") || s.includes("portugal")) return "overview";
  return "hook";
};

const viewFor = (kind: Kind): View => {
  if (kind === "llivia" || kind === "treaty" || kind === "aha") return V.llivia;
  if (kind === "road") return V.road;
  if (kind === "pheasant") return V.pheasant;
  if (kind === "strait") return V.strait;
  if (kind === "africa") return V.africa;
  if (kind === "penon") return V.penon;
  if (kind === "gibraltar") return V.gibraltar;
  if (kind === "summary" || kind === "cta") return V.finale;
  return V.overview;
};

const activeSection = (sections: Section[], T: number) => {
  let i = 0;
  for (let j = 0; j < sections.length; j++) if (T >= sections[j].start) i = j;
  return i;
};

const cameraAt = (sections: Section[], T: number) => {
  const i = activeSection(sections, T);
  const section = sections[i];
  const a = viewFor(kindOf(sections[Math.max(0, i - 1)]?.text ?? ""));
  const b = viewFor(kindOf(section?.text ?? ""));
  const p = ease(clamp((T - (section?.start ?? 0)) / 1.45));
  const bump = Math.max(a.span, b.span) * (1 + 0.16 * Math.sin(Math.PI * p));
  const span = p < 0.5
    ? a.span * Math.pow(bump / a.span, p * 2)
    : bump * Math.pow(b.span / bump, (p - 0.5) * 2);
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span };
};

const cardCopy: Record<Kind, { kicker: string; title: string; sub: string; accent: string }> = {
  hook: { kicker: "SPAIN'S BORDER PUZZLE", title: "A TOWN INSIDE FRANCE?!", sub: "The map is stranger than it looks", accent: C.gold },
  overview: { kicker: "ZOOM IN", title: "THE NEAT MAP BREAKS", sub: "Europe · Africa · British territory", accent: C.gold },
  llivia: { kicker: "42.46° N · 1.98° E", title: "LLÍVIA, SPAIN", sub: "Completely surrounded by France", accent: C.spain },
  treaty: { kicker: "TREATY OF THE PYRENEES · 1659", title: "33 VILLAGES", sub: "But Llívia was legally a town", accent: C.gold },
  road: { kicker: "DAILY LIFE CROSSES FRANCE", title: "ONLY ~1.6 KM AWAY", sub: "Llívia ↔ main Spanish territory", accent: C.spain },
  pheasant: { kicker: "SPAIN · FEB–JUL  |  FRANCE · AUG–JAN", title: "CHANGES EVERY 6 MONTHS", sub: "Shared sovereignty on one tiny island", accent: C.france },
  strait: { kicker: "EUROPE ↔ AFRICA", title: "ABOUT 14 KM", sub: "The Strait at its narrowest", accent: C.gold },
  africa: { kicker: "SPANISH CITIES IN NORTH AFRICA", title: "CEUTA + MELILLA", sub: "EU land borders with Morocco", accent: C.morocco },
  penon: { kicker: "PEÑÓN DE VÉLEZ DE LA GOMERA", title: "ABOUT 85 METRES", sub: "A storm created this land border", accent: C.gold },
  gibraltar: { kicker: "BRITISH OVERSEAS TERRITORY", title: "GIBRALTAR", sub: "A roughly 1.2 km border with Spain", accent: C.uk },
  summary: { kicker: "ONE COUNTRY · MANY BORDER STORIES", title: "EUROPE + AFRICA", sub: "Treaties, storms and shared rule", accent: C.gold },
  aha: { kicker: "THE ONE-WORD LOOPHOLE", title: "TOWN, NOT VILLAGE", sub: "That is why Llívia stayed Spanish", accent: C.spain },
  cta: { kicker: "GLOBETALES", title: "MORE MAP MYSTERIES", sub: "A new border story every day", accent: C.gold },
};

const Marker: React.FC<{ x: number; y: number; label: string; color: string; on: number; compact: boolean }> = ({ x, y, label, color, on, compact }) => {
  const drop = (1 - on) * -150;
  return (
    <g opacity={clamp(on * 1.5)} transform={`translate(0 ${drop})`}>
      <circle cx={x} cy={y} r={compact ? 13 : 9} fill={C.ink} stroke={C.white} strokeWidth={4} />
      <circle cx={x} cy={y} r={compact ? 6 : 4} fill={color} />
      <path d={`M${x},${y + (compact ? 13 : 9)} l-7,15 h14z`} fill={C.ink} stroke={C.white} strokeWidth={2} />
      <text x={x + 18} y={y - 14} fill={C.white} fontFamily={BODY} fontSize={compact ? 28 : 22} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}>{label}</text>
    </g>
  );
};

const BorderInset: React.FC<{ kind: Kind; wide: boolean; T: number; start: number }> = ({ kind, wide, T, start }) => {
  const p = ease(clamp((T - start - 0.5) / 1.2));
  if (!["treaty", "pheasant", "penon"].includes(kind)) return null;
  const top = wide ? (kind === "penon" ? 700 : 560) : 1080;
  const width = wide ? 540 : 760;
  return (
    <div style={{
      position: "absolute", right: wide ? 62 : 60, top, width, height: wide ? 300 : 360,
      transform: `translateY(${(1 - p) * 80}px)`, opacity: p,
      background: "rgba(255,255,255,0.94)", border: `6px solid ${C.ink}`, borderRadius: 28,
      boxShadow: `0 13px 0 ${C.ink}`, overflow: "hidden",
    }}>
      {kind === "treaty" && (
        <div style={{ height: "100%", padding: 28, background: "linear-gradient(135deg,#fff8dc,#ead9aa)", fontFamily: BODY, color: C.ink }}>
          <div style={{ fontFamily: DISPLAY, fontSize: wide ? 52 : 62 }}>1659 TREATY LIST</div>
          <div style={{ marginTop: 22, fontSize: wide ? 28 : 34, fontWeight: 900 }}>✓ 33 VILLAGES → FRANCE</div>
          <div style={{ marginTop: 14, fontSize: wide ? 34 : 42, fontWeight: 900, color: C.spain }}>✕ LLÍVIA = TOWN</div>
        </div>
      )}
      {kind === "pheasant" && (
        <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: DISPLAY, fontSize: wide ? 44 : 54, textAlign: "center" }}>
          <div style={{ background: C.spain, color: "#fff", paddingTop: wide ? 72 : 90 }}>SPAIN<br /><span style={{ fontFamily: BODY, fontSize: wide ? 25 : 30 }}>FEB–JUL</span></div>
          <div style={{ background: C.france, color: "#fff", paddingTop: wide ? 72 : 90 }}>FRANCE<br /><span style={{ fontFamily: BODY, fontSize: wide ? 25 : 30 }}>AUG–JAN</span></div>
        </div>
      )}
      {kind === "penon" && (
        <div style={{ height: "100%", position: "relative", background: "linear-gradient(#9ed8f6 0 48%,#d9b66f 49%)" }}>
          <div style={{ position: "absolute", left: 55, bottom: 46, width: 125, height: 150, background: "#8e6a4c", clipPath: "polygon(20% 100%,0 30%,35% 0,90% 22%,100% 100%)" }} />
          <div style={{ position: "absolute", left: 178, right: 70, bottom: 62, height: 32, background: C.gold }} />
          <div style={{ position: "absolute", left: 190, right: 80, bottom: 118, borderTop: `6px solid ${C.spain}` }} />
          <div style={{ position: "absolute", left: 230, right: 115, bottom: 126, textAlign: "center", fontFamily: DISPLAY, color: C.spain, fontSize: wide ? 48 : 58 }}>~85 m</div>
          <div style={{ position: "absolute", right: 30, bottom: 18, fontFamily: BODY, color: C.ink, fontSize: 24, fontWeight: 900 }}>MOROCCO</div>
        </div>
      )}
    </div>
  );
};

const InfoCard: React.FC<{ kind: Kind; frame: number; start: number; fps: number; wide: boolean }> = ({ kind, frame, start, fps, wide }) => {
  const copy = cardCopy[kind];
  const p = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{
      position: "absolute", left: wide ? 58 : 44, top: wide ? 64 : 315,
      width: wide ? 690 : 992, minHeight: wide ? 225 : 280,
      transform: `translateY(${(1 - p) * -90}px) scale(${0.94 + p * 0.06})`, opacity: clamp(p * 1.5),
      padding: wide ? "26px 34px" : "32px 38px 28px",
      background: "rgba(255,255,255,0.95)", border: `6px solid ${C.ink}`, borderRadius: 30,
      boxShadow: `0 14px 0 ${C.ink}`,
    }}>
      <div style={{ fontFamily: BODY, color: copy.accent, fontSize: wide ? 24 : 29, fontWeight: 1000, letterSpacing: 3 }}>{copy.kicker}</div>
      <div style={{ marginTop: 8, fontFamily: DISPLAY, color: C.ink, fontSize: wide ? 66 : 77, lineHeight: 0.96, letterSpacing: 1 }}>{copy.title}</div>
      <div style={{ marginTop: 13, fontFamily: BODY, color: "#465467", fontSize: wide ? 29 : 35, fontWeight: 850 }}>{copy.sub}</div>
    </div>
  );
};

export const SpainBordersScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const T = thumbnail ? 3 : frame / fps;
  const i = activeSection(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const cam = thumbnail ? V.llivia : cameraAt(timing.sections, T);
  const refLat = 40;
  const cos = Math.cos(refLat * Math.PI / 180);
  const focusX = wide ? W * 0.62 : W * 0.5;
  const focusY = wide ? H * 0.55 : H * 0.58;
  const usableH = wide ? H * 1.08 : H * 0.88;
  const scale = Math.min(W / (cam.span * cos), usableH / (cam.span * (wide ? 0.58 : 1.04)));
  const P = (lon: number, lat: number): Pt => [focusX + (lon - cam.lon) * cos * scale, focusY - (lat - cam.lat) * scale];
  const local = cam.span < 7;
  const reveal = ease(clamp((T - section.start) / 0.75));
  const selectedIso = kind === "africa" || kind === "penon" ? "MAR" : kind === "llivia" || kind === "treaty" || kind === "road" || kind === "aha" ? "FRA" : "";
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((w) => w.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const marker = (loc: typeof LOC.llivia, color = C.spain, on = reveal) => {
    const [x, y] = P(...loc.p);
    return <Marker x={x} y={y} label={loc.label} color={color} on={on} compact={local} />;
  };

  return (
    <AbsoluteFill style={{ background: C.ocean2, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="spainSea" cx="50%" cy="38%" r="80%">
            <stop offset="0" stopColor={C.ocean} />
            <stop offset="1" stopColor={C.ocean2} />
          </radialGradient>
          <pattern id="gridSpain" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M70 0H0V70" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#spainSea)" />
        <rect width={W} height={H} fill="url(#gridSpain)" />
        {COUNTRIES.map((country) => {
          let fill = C.land;
          if (country.iso === "ESP") fill = C.spain;
          if (country.iso === "FRA" && selectedIso === "FRA") fill = "#7db1ff";
          if (country.iso === "MAR" && selectedIso === "MAR") fill = "#54cb8d";
          return <path key={country.iso} d={geomPath(country.geom as never, P)} fill={fill} stroke={C.ink} strokeWidth={local ? 3 : 1.5} strokeLinejoin="round" />;
        })}
        {(kind === "llivia" || kind === "treaty" || kind === "road" || kind === "aha" || kind === "hook") && marker(LOC.llivia)}
        {kind === "road" && (
          <>
            <path d={`M${P(...LOC.llivia.p).join(",")} L${P(...LOC.puigcerda.p).join(",")}`} stroke={C.gold} strokeWidth={12} strokeDasharray="18 10" />
            {marker(LOC.puigcerda, C.gold)}
          </>
        )}
        {kind === "pheasant" && marker(LOC.pheasant, C.gold)}
        {(kind === "africa" || kind === "summary") && (
          <>
            {marker(LOC.ceuta)}
            {marker(LOC.melilla)}
          </>
        )}
        {kind === "penon" && marker(LOC.penon, C.gold)}
        {kind === "gibraltar" && marker(LOC.gibraltar, C.uk)}
        {(kind === "summary" || kind === "cta") && (
          <>
            {marker(LOC.llivia, C.spain, 1)}
            {marker(LOC.pheasant, C.france, 1)}
            {marker(LOC.ceuta, C.spain, 1)}
            {marker(LOC.melilla, C.spain, 1)}
            {marker(LOC.penon, C.gold, 1)}
            {marker(LOC.gibraltar, C.uk, 1)}
          </>
        )}
      </svg>

      {!thumbnail && <InfoCard kind={kind} frame={frame} start={section.start} fps={fps} wide={wide} />}
      {!thumbnail && <BorderInset kind={kind} wide={wide} T={T} start={section.start} />}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 260 : 1480} />}
      {!thumbnail && T >= ctaT && <CtaCard T={T} top={wide ? 590 : 1140} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg,rgba(4,8,18,.95),rgba(4,8,18,.55) 50%,rgba(4,8,18,.05))" : "linear-gradient(180deg,rgba(4,8,18,.92),rgba(4,8,18,.12) 48%,rgba(4,8,18,.88))" }} />
          <div style={{
            position: "absolute", left: wide ? 70 : 48, right: wide ? 850 : 48, top: wide ? 90 : 325,
            fontFamily: DISPLAY, fontSize: wide ? 150 : 150, lineHeight: 0.87, color: "#fff",
            WebkitTextStroke: `${wide ? 7 : 9}px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.ink}`,
          }}>
            SPAIN'S<br />BORDERS<br /><span style={{ color: C.gold }}>ARE CRAZY</span>
          </div>
          <div style={{
            position: "absolute", left: wide ? 88 : 75, bottom: wide ? 92 : 330,
            background: C.spain, color: "#fff", border: `6px solid ${C.ink}`, borderRadius: 22,
            boxShadow: `0 9px 0 ${C.ink}`, padding: "12px 28px 8px", fontFamily: DISPLAY,
            fontSize: wide ? 62 : 64,
          }}>
            A TOWN INSIDE FRANCE?!
          </div>
          <div style={{ position: "absolute", left: wide ? W * 0.72 : W * 0.66, top: wide ? H * 0.52 : 1070, transform: "translate(-50%,-100%) scale(1.9)" }}>
            <svg width="90" height="120" viewBox="0 0 60 82"><path d="M30 78C30 78 7 48 7 28A23 23 0 1146 44Z" fill={C.ink} stroke="#fff" strokeWidth="4" /><circle cx="30" cy="28" r="11" fill={C.spain} /></svg>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const SpainBordersVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const ctaT = timing.sections.find((s) => s.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const kindStart = (kind: Kind) => timing.sections.find((s) => kindOf(s.text) === kind)?.start ?? NaN;
  const sfx: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.8, "boom", 0.22],
    [kindStart("treaty"), "ding", 0.16],
    [kindStart("africa"), "whoosh", 0.17],
    [kindStart("penon"), "pop", 0.18],
    [kindStart("aha"), "boom", 0.2],
  ];
  const cue = (t: number, name: string, volume: number) => Number.isFinite(t) ? (
    <Sequence key={`${name}-${t}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={60}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([t, name, volume]) => cue(t, name, volume))}
      {nudgeTimes(ctaT).map((t) => cue(t + 1.1, "ding", 0.15))}
      <SpainBordersScene timing={timing} />
      <CoverTitle lines={["SPAIN'S BORDERS", "ARE CRAZY!"]} sub="A Spanish town inside France?!" accent="#ffc93c" />
    </AbsoluteFill>
  );
};

export const SpainBordersThumb: React.FC<{ timing: Timing }> = ({ timing }) => <SpainBordersScene timing={timing} thumbnail />;
