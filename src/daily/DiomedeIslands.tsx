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
type Kind =
  | "hook"
  | "overview"
  | "islands"
  | "mainland"
  | "purchase"
  | "dateline"
  | "people"
  | "ice"
  | "swim"
  | "bridge"
  | "beringia"
  | "aha"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const C = {
  night: "#06111f",
  ocean: "#0c3553",
  grid: "rgba(145,211,255,.10)",
  land: "#e9e0ca",
  edge: "#172235",
  usa: "#3b82f6",
  russia: "#ef4444",
  gold: "#ffd23f",
  ice: "#dff6ff",
  cyan: "#65d7ff",
  white: "#ffffff",
  green: "#26c281",
};

const LITTLE: Pt = [-168.9533, 65.7586];
const BIG: Pt = [-169.0486, 65.7811];
const DEZHNEV: Pt = [-169.655, 66.078];
const WALES: Pt = [-168.087, 65.613];

const V: Record<Kind, View> = {
  hook: { lon: -169.0, lat: 65.77, span: 4.4 },
  overview: { lon: -169.0, lat: 65.65, span: 24 },
  islands: { lon: -169.0, lat: 65.77, span: 1.05 },
  mainland: { lon: -168.85, lat: 65.78, span: 5.2 },
  purchase: { lon: -167.8, lat: 64.8, span: 26 },
  dateline: { lon: -169.0, lat: 65.77, span: 1.0 },
  people: { lon: -169.0, lat: 65.77, span: 1.2 },
  ice: { lon: -169.0, lat: 65.77, span: 1.5 },
  swim: { lon: -169.0, lat: 65.77, span: 1.05 },
  bridge: { lon: -168.85, lat: 65.78, span: 5.4 },
  beringia: { lon: -169.0, lat: 63.5, span: 28 },
  aha: { lon: -169.0, lat: 65.77, span: 1.45 },
  cta: { lon: -169.0, lat: 65.65, span: 7.2 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (
    s.includes("answer is clear") ||
    s.includes("title is true") ||
    s.includes("same gap carries") ||
    s.includes("4 km claim") ||
    s.includes("3.8 km, you can jump") ||
    s.includes("tiny rocks make")
  ) return "aha";
  if (s.includes("beringia") || s.includes("last ice age") || s.includes("rising seas") || s.includes("old connection")) return "beringia";
  if (s.includes("bridge") || s.includes("ferry") || s.includes("stepping stones") || s.includes("remote") || s.includes("vast roads") || s.includes("ecosystems") || s.includes("connection look easy")) return "bridge";
  if (s.includes("lynne cox") || s.includes("2 hours") || s.includes("1987") || s.includes("symbol of warming") || s.includes("soviet union ended")) return "swim";
  if (s.includes("winter ice") || s.includes("sea ice") || s.includes("illegal") || s.includes("dangerous") || s.includes("currents") || s.includes("public footpath")) return "ice";
  if (s.includes("iñupiat") || s.includes("small alaska native") || s.includes("no permanent") || s.includes("1948") || s.includes("ice curtain") || s.includes("families and neighbours")) return "people";
  if (s.includes("date line") || s.includes("21 hour") || s.includes("monday") || s.includes("tuesday") || s.includes("yesterday isle") || s.includes("tomorrow island") || s.includes("human time zones") || s.includes("official time zones")) return "dateline";
  if (s.includes("1867") || s.includes("7.2 million") || s.includes("bought alaska") || s.includes("internal russian waters")) return "purchase";
  if (s.includes("mainland") || s.includes("cape dezhnev") || s.includes("cape prince")) return "mainland";
  if (s.includes("big diomede") || s.includes("little diomede") || s.includes("3.8 km") || s.includes("diomede islands")) return "islands";
  if (s.includes("north pacific") || s.includes("flat maps") || s.includes("wrap that map") || s.includes("alaska reaches")) return "overview";
  return "hook";
};

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const cameraAt = (sections: Section[], time: number): View => {
  const i = activeSection(sections, time);
  const section = sections[i];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.5));
  const bump = Math.max(from.span, to.span) * (1 + 0.16 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return { lon: lerp(from.lon, to.lon, p), lat: lerp(from.lat, to.lat, p), span };
};

const copyFor = (kind: Kind) => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["THE BERING STRAIT", "ONLY 4 KM?!", "USA and Russia nearly touch", C.gold],
    overview: ["MAP EDGE ILLUSION", "ALASKA ↔ RUSSIA", "A globe brings the neighbours together", C.cyan],
    islands: ["65.77° N · 169.00° W", "THE DIOMEDES", "Little Diomede 🇺🇸 · Big Diomede 🇷🇺", C.gold],
    mainland: ["CAPE TO CAPE", "ABOUT 82 KM", "The mainlands are much farther apart", C.cyan],
    purchase: ["ALASKA PURCHASE · 1867", "$7.2 MILLION", "One former internal waterway became a border", C.gold],
    dateline: ["INTERNATIONAL DATE LINE", "21 HOURS APART", "Yesterday Isle ↔ Tomorrow Island", C.gold],
    people: ["PEOPLE OF THE BERING STRAIT", "THE ICE CURTAIN", "A narrow border separated communities", C.cyan],
    ice: ["ARCTIC REALITY", "NOT A FOOTPATH", "Moving ice · currents · fog · law", C.ice],
    swim: ["LYNNE COX · 1987", "2 H 6 MIN", "A permitted swim across the border", C.green],
    bridge: ["THE BIG IDEA", "82 KM + REMOTE ROADS", "A bridge is far bigger than the island gap", C.gold],
    beringia: ["THE LAST ICE AGE", "BERINGIA", "A broad land connection once joined continents", C.ice],
    aha: ["THE TRUE ANSWER", "3.8 KM · 21 HOURS", "Island territory makes the headline true", C.gold],
    cta: ["GLOBETALES", "MAP THE HIDDEN STORY", "New geography stories every day", C.cyan],
  };
  return copy[kind];
};

const Flag: React.FC<{ kind: "US" | "RU"; size?: number }> = ({ kind, size = 78 }) => (
  <div style={{ width: size * 1.45, height: size, border: `4px solid ${C.white}`, boxShadow: `0 6px 0 ${C.edge}`, overflow: "hidden", background: kind === "RU" ? "linear-gradient(#fff 0 33%,#1854a7 33% 66%,#d52b1e 66%)" : "repeating-linear-gradient(#b22234 0 8%,#fff 8% 16%)", position: "relative" }}>
    {kind === "US" && <div style={{ position: "absolute", inset: "0 auto auto 0", width: "43%", height: "54%", background: "#3c3b6e", color: "#fff", fontSize: size * 0.28, lineHeight: 1.1, paddingLeft: 4 }}>✦✦<br />✦✦</div>}
  </div>
);

const Pin: React.FC<{ color: string; label: string; on: number; wide: boolean; side: "left" | "right" }> = ({ color, label, on, wide, side }) => (
  <div style={{ width: 500, height: 180, position: "relative", transform: `translateY(${(1 - on) * -180}px) scale(${0.8 + 0.2 * on})`, opacity: clamp(on * 1.5) }}>
    <div style={{ position: "absolute", top: side === "left" ? 0 : 48, ...(side === "left" ? { right: 260 } : { left: 260 }), padding: wide ? "8px 16px" : "10px 18px", borderRadius: 14, background: "rgba(6,17,31,.94)", color: C.white, border: `3px solid ${C.white}`, fontFamily: BODY, fontSize: wide ? 22 : 29, fontWeight: 900, whiteSpace: "nowrap" }}>{label}</div>
    <svg width={wide ? 48 : 62} height={wide ? 66 : 84} viewBox="0 0 60 82" style={{ position: "absolute", left: "50%", top: 70, transform: "translateX(-50%)" }}>
      <path d="M30 78C30 78 7 48 7 28A23 23 0 1146 44Z" fill={C.edge} stroke={C.white} strokeWidth="4" />
      <circle cx="30" cy="28" r="11" fill={color} />
    </svg>
  </div>
);

const InfoCard: React.FC<{ kind: Kind; frame: number; start: number; fps: number; wide: boolean }> = ({ kind, frame, start, fps, wide }) => {
  const [kicker, title, sub, accent] = copyFor(kind);
  const p = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 12, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: wide ? 58 : 44, top: wide ? 55 : 310, width: wide ? 700 : 992, minHeight: wide ? 218 : 270, transform: `translateY(${(1 - p) * -90}px)`, opacity: clamp(p * 1.5), padding: wide ? "24px 34px" : "30px 38px 24px", background: "rgba(255,255,255,.95)", border: `6px solid ${C.edge}`, borderRadius: 30, boxShadow: `0 14px 0 ${C.edge}` }}>
      <div style={{ fontFamily: BODY, color: accent, fontSize: wide ? 23 : 28, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
      <div style={{ marginTop: 5, fontFamily: DISPLAY, color: C.edge, fontSize: wide ? 68 : 80, lineHeight: 0.95 }}>{title}</div>
      <div style={{ marginTop: 12, fontFamily: BODY, color: "#405064", fontSize: wide ? 28 : 34, lineHeight: 1.1, fontWeight: 850 }}>{sub}</div>
    </div>
  );
};

const Clocks: React.FC<{ wide: boolean; reveal: number }> = ({ wide, reveal }) => (
  <div style={{ position: "absolute", right: wide ? 75 : 70, bottom: wide ? 75 : 285, display: "flex", gap: wide ? 20 : 14, transform: `scale(${0.8 + reveal * 0.2})`, opacity: reveal }}>
    {[["LITTLE DIOMEDE", "MON · 12:00", C.usa], ["BIG DIOMEDE", "TUE · 09:00", C.russia]].map(([name, time, color]) => (
      <div key={name} style={{ width: wide ? 300 : 420, padding: wide ? "18px 22px" : "24px 20px", background: "rgba(6,17,31,.94)", border: `5px solid ${color}`, borderRadius: 22, color: C.white, textAlign: "center", boxShadow: `0 10px 0 ${C.edge}` }}>
        <div style={{ fontFamily: BODY, fontSize: wide ? 20 : 27, fontWeight: 900 }}>{name}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: wide ? 50 : 64, color }}>{time}</div>
      </div>
    ))}
  </div>
);

const Distance: React.FC<{ a: Pt; b: Pt; project: (p: Pt) => Pt; text: string; color: string; on: number; labelDy?: number }> = ({ a, b, project, text, color, on, labelDy = -28 }) => {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  const x = lerp(x1, x2, on);
  const y = lerp(y1, y2, on);
  return (
    <g opacity={clamp(on * 1.4)}>
      <path d={`M${x1},${y1} L${x},${y}`} stroke={color} strokeWidth={8} strokeDasharray="18 12" />
      <circle cx={x1} cy={y1} r={8} fill={color} />
      <circle cx={x2} cy={y2} r={8} fill={color} />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + labelDy} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={44} style={{ paintOrder: "stroke", stroke: C.edge, strokeWidth: 8 }}>{text}</text>
    </g>
  );
};

export const DiomedeScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const T = thumbnail ? 2 : frame / fps;
  const i = activeSection(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind = thumbnail ? "islands" : kindOf(section?.text ?? "");
  const cam = thumbnail ? V.islands : cameraAt(timing.sections, T);
  const refLat = 65.8;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const focusX = wide ? W * 0.64 : W * 0.5;
  const focusY = wide ? H * 0.57 : H * 0.56;
  const mapHeight = wide ? H * 1.08 : H * 0.82;
  const scale = Math.min(W / (cam.span * cos), mapHeight / (cam.span * (wide ? 0.58 : 1.03)));
  const project = ([lon, lat]: Pt): Pt => [focusX + (lon - cam.lon) * cos * scale, focusY - (lat - cam.lat) * scale];
  const P = (lon: number, lat: number): Pt => project([lon > 0 ? lon - 360 : lon, lat]);
  const reveal = ease(clamp((T - section.start) / 1.1));
  const islandMode = ["hook", "islands", "dateline", "people", "ice", "swim", "aha", "cta"].includes(kind);
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const flagOn = thumbnail ? 1 : spring({ frame: Math.max(0, frame - Math.round((section.start + 0.35) * fps)), fps, config: { damping: 10, mass: 0.6 } });
  const [lx, ly] = project(LITTLE);
  const [bx, by] = project(BIG);
  const pin = (point: Pt, label: string, color: string, side: "left" | "right") => {
    const [x, y] = project(point);
    return <foreignObject x={x - 250} y={y - 148} width={500} height={180} style={{ overflow: "visible" }}><Pin color={color} label={label} on={flagOn} wide={wide} side={side} /></foreignObject>;
  };

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="beringOcean" cx="53%" cy="45%" r="75%"><stop offset="0" stopColor={C.ocean} /><stop offset="1" stopColor={C.night} /></radialGradient>
          <pattern id="beringGrid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke={C.grid} strokeWidth="2" /></pattern>
          <pattern id="iceHatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="22" fill="rgba(223,246,255,.28)" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#beringOcean)" />
        <rect width={W} height={H} fill="url(#beringGrid)" />
        {COUNTRIES.filter((country) => ["USA", "RUS", "CAN"].includes(country.iso)).map((country) => {
          const active = country.iso === "USA" || country.iso === "RUS";
          return <path key={country.iso} d={geomPath(country.geom as never, P)} fill={country.iso === "USA" ? C.usa : country.iso === "RUS" ? C.russia : C.land} fillOpacity={active ? 0.84 : 0.55} stroke={C.edge} strokeWidth={cam.span < 8 ? 4 : 2} strokeLinejoin="round" />;
        })}
        {kind === "beringia" && <path d={`M${P(-174, 68).join(",")} Q${P(-169, 61).join(",")} ${P(-164, 66).join(",")} L${P(-162, 58).join(",")} Q${P(-170, 55).join(",")} ${P(-177, 61).join(",")}Z`} fill="rgba(223,246,255,.62)" stroke={C.ice} strokeWidth={5} strokeDasharray="16 10" />}
        {kind === "ice" && <path d={`M${project([-169.35,65.95]).join(",")} Q${project([-169,65.55]).join(",")} ${project([-168.65,65.9]).join(",")} L${project([-168.7,65.55]).join(",")} Q${project([-169,65.9]).join(",")} ${project([-169.3,65.55]).join(",")}Z`} fill="url(#iceHatch)" stroke={C.ice} strokeWidth={5} opacity={0.9} />}
        {(kind === "dateline" || kind === "aha" || kind === "cta") && <path d={`M${project([-169.005,66.3]).join(",")} L${project([-169.005,65.2]).join(",")}`} stroke={C.gold} strokeWidth={8} strokeDasharray="22 14" opacity={0.9} />}
        {(kind === "islands" || kind === "hook" || kind === "aha") && <Distance a={BIG} b={LITTLE} project={project} text="3.8 KM" color={C.gold} on={thumbnail ? 1 : reveal} labelDy={150} />}
        {kind === "mainland" && <Distance a={DEZHNEV} b={WALES} project={project} text="~82 KM" color={C.cyan} on={reveal} />}
        {kind === "bridge" && <Distance a={DEZHNEV} b={WALES} project={project} text="BRIDGE IDEA · ~82 KM" color={C.gold} on={reveal} />}
        {kind === "swim" && <path d={`M${lx},${ly} Q${(lx + bx) / 2},${Math.min(ly, by) - 100} ${lerp(lx, bx, reveal)},${lerp(ly, by, reveal)}`} fill="none" stroke={C.green} strokeWidth={10} strokeDasharray="14 12" />}
        <ellipse cx={lx} cy={ly} rx={cam.span < 2 ? 30 : 8} ry={cam.span < 2 ? 48 : 12} fill={C.usa} stroke={C.white} strokeWidth={4} transform={`rotate(-12 ${lx} ${ly})`} />
        <ellipse cx={bx} cy={by} rx={cam.span < 2 ? 47 : 10} ry={cam.span < 2 ? 62 : 15} fill={C.russia} stroke={C.white} strokeWidth={4} transform={`rotate(15 ${bx} ${by})`} />
        {islandMode && pin(LITTLE, "LITTLE DIOMEDE · USA", C.usa, "right")}
        {islandMode && pin(BIG, "BIG DIOMEDE · RUSSIA", C.russia, "left")}
        {kind === "mainland" && pin(DEZHNEV, "CAPE DEZHNEV", C.russia, "left")}
        {kind === "mainland" && pin(WALES, "CAPE PRINCE OF WALES", C.usa, "right")}
      </svg>

      {!thumbnail && <InfoCard kind={kind} frame={frame} start={section.start} fps={fps} wide={wide} />}
      {!thumbnail && kind === "dateline" && <Clocks wide={wide} reveal={reveal} />}
      {!thumbnail && kind === "swim" && <div style={{ position: "absolute", right: wide ? 70 : 70, bottom: wide ? 90 : 300, padding: "18px 28px", borderRadius: 22, background: C.green, border: `5px solid ${C.edge}`, boxShadow: `0 10px 0 ${C.edge}`, color: C.white, fontFamily: DISPLAY, fontSize: wide ? 58 : 70 }}>1987 · 2 H 6 MIN</div>}
      {!thumbnail && kind === "ice" && <div style={{ position: "absolute", right: wide ? 70 : 70, bottom: wide ? 80 : 300, maxWidth: wide ? 510 : 880, padding: "20px 30px", borderRadius: 24, background: C.russia, border: `5px solid ${C.edge}`, boxShadow: `0 10px 0 ${C.edge}`, color: C.white, fontFamily: DISPLAY, fontSize: wide ? 50 : 62, textAlign: "center" }}>NO PUBLIC CROSSING</div>}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 275 : 1480} />}
      {!thumbnail && T >= ctaT && <CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={wide ? 560 : 1130} />}

      {thumbnail && (
        <>
          <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg,rgba(3,8,18,.96),rgba(3,8,18,.48) 55%,rgba(3,8,18,.05))" : "linear-gradient(180deg,rgba(3,8,18,.94),rgba(3,8,18,.08) 52%,rgba(3,8,18,.9))" }} />
          <div style={{ position: "absolute", left: wide ? 70 : 48, right: wide ? 760 : 48, top: wide ? 80 : 325, fontFamily: DISPLAY, fontSize: wide ? 150 : 144, lineHeight: 0.87, color: C.white, WebkitTextStroke: `${wide ? 7 : 9}px ${C.edge}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.edge}` }}>
            USA &amp; RUSSIA<br /><span style={{ color: C.gold }}>ONLY 4 KM?!</span>
          </div>
          <div style={{ position: "absolute", left: wide ? 80 : 75, bottom: wide ? 80 : 335, display: "flex", alignItems: "center", gap: 22 }}>
            <Flag kind="US" size={wide ? 70 : 86} />
            <div style={{ color: C.gold, fontFamily: DISPLAY, fontSize: wide ? 72 : 78 }}>3.8 KM</div>
            <Flag kind="RU" size={wide ? 70 : 86} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const DiomedeVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaT = timing.sections.find((section) => section.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? NaN;
  const sfx: [number, string, number][] = [
    [0.1, "riser", 0.16],
    [0.8, "boom", 0.22],
    [first("islands"), "pop", 0.18],
    [first("mainland"), "whoosh", 0.17],
    [first("dateline"), "ding", 0.2],
    [first("swim"), "whoosh", 0.17],
    [first("beringia"), "riser", 0.13],
    [first("aha"), "boom", 0.2],
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
      {sfx.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaT).map((time) => cue(time + 1.1, "ding", 0.14))}
      <DiomedeScene timing={timing} />
      <CoverTitle lines={["USA & RUSSIA", "ONLY 4 KM APART?!"]} sub="The Diomede Islands" accent="#4db3ff" />
    </AbsoluteFill>
  );
};

export const DiomedeThumb: React.FC<{ timing: Timing }> = ({ timing }) => <DiomedeScene timing={timing} thumbnail />;
