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
type Kind = "world" | "india" | "greenwich" | "offsets" | "dateline" | "aha" | "cta";

const C = {
  night: "#071426",
  ocean: "#0d3152",
  land: "#eadfc8",
  ink: "#172235",
  gold: "#ffd23f",
  saffron: "#ff9933",
  cyan: "#55d6ff",
  red: "#ef4444",
  white: "#ffffff",
};
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("big answer") || s.includes("nature") || s.includes("people decide") || s.includes("negotiated") || s.includes("agreements shaped")) return "aha";
  if (s.includes("date line") || s.includes("samoa") || s.includes("daylight saving") || s.includes("seasonal")) return "dateline";
  if (s.includes("nepal") || s.includes("newfoundland") || s.includes("chatham") || s.includes("china") || s.includes("russia")) return "offsets";
  if (s.includes("greenwich") || s.includes("prime meridian") || s.includes("longitude zero") || s.includes("utc,")) return "greenwich";
  if (s.includes("india") || s.includes("ist") || s.includes("82.5") || s.includes("mirzapur") || s.includes("assam") || s.includes("chaibagaan")) return "india";
  return "world";
};

const V: Record<Kind, View> = {
  world: { lon: 15, lat: 17, span: 330 },
  india: { lon: 81, lat: 23, span: 47 },
  greenwich: { lon: 0, lat: 35, span: 95 },
  offsets: { lon: 65, lat: 25, span: 225 },
  dateline: { lon: 178, lat: 3, span: 145 },
  aha: { lon: 35, lat: 15, span: 300 },
  cta: { lon: 35, lat: 15, span: 330 },
};

const cameraAt = (sections: Section[], time: number): View => {
  const i = activeSection(sections, time);
  const section = sections[i];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.35));
  const bump = Math.max(from.span, to.span) * (1 + 0.12 * Math.sin(Math.PI * p));
  const span = p < 0.5
    ? from.span * Math.pow(bump / from.span, p * 2)
    : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  let delta = to.lon - from.lon;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return { lon: from.lon + delta * p, lat: lerp(from.lat, to.lat, p), span };
};

const copyFor = (text: string, kind: Kind): [string, string, string] => {
  const s = text.toLowerCase();
  if (kind === "cta") return ["GLOBETALES", "ONE PLANET", "MANY CLOCKS"];
  if (kind === "aha") return ["THE BIG ANSWER", "NATURE SETS THE DAY", "PEOPLE SET THE CLOCK"];
  if (kind === "greenwich") return ["LONGITUDE ZERO", "GREENWICH", "THE WORLD'S CLOCK STARTING LINE"];
  if (kind === "dateline") return ["THE PACIFIC", "CHANGE THE CLOCK", "OR CHANGE THE DAY"];
  if (kind === "offsets") return ["NOT ALWAYS HOURS", "30 AND 45 MINUTES", "TIME IS A LEGAL CHOICE"];
  if (kind === "india") {
    if (s.includes("82.5") || s.includes("mirzapur")) return ["INDIA'S MERIDIAN", "82.5° EAST", "NEAR MIRZAPUR"];
    if (s.includes("chaibagaan") || s.includes("assam")) return ["NORTHEAST INDIA", "SUNRISE COMES EARLY", "ONE CLOCK, DIFFERENT DAYLIGHT"];
    return ["INDIAN STANDARD TIME", "UTC + 5:30", "ONE COUNTRY · ONE OFFICIAL TIME"];
  }
  if (s.includes("15 degrees") || s.includes("divide 360")) return ["THE IDEAL GRID", "15° = 1 HOUR", "24 SLICES AROUND EARTH"];
  if (s.includes("borders") || s.includes("bend")) return ["BUT COUNTRIES BEND IT", "JAGGED TIME ZONES", "BORDERS BEAT PERFECT LINES"];
  return ["HOW TIME ZONES WORK", "24 HOURS", "ONE ROTATING PLANET"];
};

const Clock: React.FC<{ label: string; time: string; color: string; small?: boolean }> = ({ label, time, color, small }) => (
  <div style={{ background: "rgba(7,20,38,.94)", border: `4px solid ${color}`, borderRadius: 22, padding: small ? "12px 18px" : "18px 28px", textAlign: "center", boxShadow: `0 8px 0 ${C.ink}`, minWidth: small ? 190 : 260 }}>
    <div style={{ fontFamily: BODY, color: C.white, fontWeight: 900, fontSize: small ? 18 : 24 }}>{label}</div>
    <div style={{ fontFamily: DISPLAY, color, fontSize: small ? 44 : 62, lineHeight: 1 }}>{time}</div>
  </div>
);

export const TimeZonesScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const wide = W > H;
  const T = thumbnail ? 12 : frame / fps;
  const i = activeSection(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind = thumbnail ? "india" : kindOf(section.text);
  const cam = thumbnail ? V.india : cameraAt(timing.sections, T);
  const [kicker, title, sub] = copyFor(section.text, kind);
  const reveal = spring({ frame: Math.max(0, frame - Math.round(section.start * fps)), fps, config: { damping: 12, mass: 0.7 } });
  const refLat = 20;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const mapH = wide ? H * 1.05 : H * 0.83;
  const scale = Math.min(W / (cam.span * cos), mapH / (cam.span * (wide ? 0.58 : 1.02)));
  const focusX = wide ? W * 0.63 : W * 0.5;
  const focusY = wide ? H * 0.58 : H * 0.55;
  const project = (point: Pt): Pt => {
    let lon = point[0];
    while (lon - cam.lon > 180) lon -= 360;
    while (lon - cam.lon < -180) lon += 360;
    return [focusX + (lon - cam.lon) * cos * scale, focusY - (point[1] - cam.lat) * scale];
  };
  const P = (lon: number, lat: number) => project([lon, lat]);
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) => cta?.words.find((w) => w.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const markers: [number, number, string, string][] = kind === "india"
    ? [[82.5, 25.15, "82.5°E", C.gold], [95.3, 27.1, "ARUNACHAL", C.cyan], [69.0, 23.2, "GUJARAT", C.saffron]]
    : kind === "offsets"
      ? [[84.1, 28.4, "NEPAL +5:45", C.gold], [-56, 48.6, "NEWFOUNDLAND -3:30", C.cyan], [-176.5, -44, "CHATHAM +12:45", C.red]]
      : [];

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="tzOcean" cx="55%" cy="45%" r="78%"><stop stopColor={C.ocean} /><stop offset="1" stopColor={C.night} /></radialGradient>
          <pattern id="tzGrid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="rgba(120,200,255,.09)" strokeWidth="2" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#tzOcean)" />
        <rect width={W} height={H} fill="url(#tzGrid)" />
        {COUNTRIES.map((country) => (
          <path
            key={country.iso}
            d={geomPath(country.geom as never, P)}
            fill={country.iso === "IND" ? C.saffron : C.land}
            fillOpacity={country.iso === "IND" ? 0.92 : 0.72}
            stroke={country.iso === "IND" ? C.white : C.ink}
            strokeWidth={country.iso === "IND" ? 4 : 1.6}
            strokeLinejoin="round"
          />
        ))}
        {(kind === "world" || kind === "aha") && Array.from({ length: 25 }, (_, j) => -180 + j * 15).map((lon) => {
          const [x1, y1] = P(lon, -70);
          const [x2, y2] = P(lon, 80);
          return <line key={lon} x1={x1} y1={y1} x2={x2} y2={y2} stroke={jitterColor(lon)} strokeWidth={kind === "aha" ? 4 : 2.5} opacity={0.38} />;
        })}
        {kind === "greenwich" && <line x1={P(0, -65)[0]} y1={P(0, -65)[1]} x2={P(0, 80)[0]} y2={P(0, 80)[1]} stroke={C.gold} strokeWidth={8} strokeDasharray="20 12" />}
        {kind === "india" && <line x1={P(82.5, 7)[0]} y1={P(82.5, 7)[1]} x2={P(82.5, 36)[0]} y2={P(82.5, 36)[1]} stroke={C.gold} strokeWidth={7} strokeDasharray="18 10" />}
        {kind === "dateline" && <path d={`M${P(180,75).join(",")} L${P(180,15).join(",")} L${P(172,-5).join(",")} L${P(180,-25).join(",")} L${P(180,-65).join(",")}`} fill="none" stroke={C.gold} strokeWidth={8} strokeDasharray="20 12" />}
        {markers.map(([lon, lat, label, color]) => {
          const [x, y] = P(lon, lat);
          return <g key={label} transform={`translate(${x} ${y})`} opacity={clamp(reveal)}>
            <circle r={13} fill={color} stroke={C.white} strokeWidth={4} />
            <text x={18} y={8} fill={C.white} fontFamily={BODY} fontSize={wide ? 22 : 29} fontWeight={900} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 6 }}>{label}</text>
          </g>;
        })}
      </svg>

      {!thumbnail && (
        <div style={{ position: "absolute", left: wide ? 55 : 42, top: wide ? 50 : 300, width: wide ? 740 : 996, padding: wide ? "22px 32px" : "28px 34px", background: "rgba(255,255,255,.95)", border: `6px solid ${C.ink}`, borderRadius: 28, boxShadow: `0 13px 0 ${C.ink}`, transform: `translateY(${(1 - reveal) * -70}px)`, opacity: clamp(reveal * 1.5) }}>
          <div style={{ fontFamily: BODY, color: C.red, fontSize: wide ? 22 : 28, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
          <div style={{ fontFamily: DISPLAY, color: C.ink, fontSize: wide ? 70 : 83, lineHeight: 0.95 }}>{title}</div>
          <div style={{ fontFamily: BODY, color: "#46566b", fontSize: wide ? 27 : 34, fontWeight: 850 }}>{sub}</div>
        </div>
      )}
      {!thumbnail && kind === "india" && <div style={{ position: "absolute", right: wide ? 60 : 55, bottom: wide ? 55 : 285, display: "flex", gap: 16 }}><Clock label="UTC" time="06:00" color={C.cyan} small={wide} /><Clock label="INDIA" time="11:30" color={C.saffron} small={wide} /></div>}
      {!thumbnail && kind === "dateline" && <div style={{ position: "absolute", right: wide ? 65 : 55, bottom: wide ? 60 : 300, display: "flex", gap: 16 }}><Clock label="WEST SIDE" time="MONDAY" color={C.cyan} small={wide} /><Clock label="EAST SIDE" time="TUESDAY" color={C.gold} small={wide} /></div>}
      {!thumbnail && <SubscribeNudge T={T} until={ctaT} top={wide ? 280 : 1480} />}
      {!thumbnail && T >= ctaT && <CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={wide ? 555 : 1130} />}

      {thumbnail && <>
        <AbsoluteFill style={{ background: wide ? "linear-gradient(90deg,rgba(3,8,18,.96),rgba(3,8,18,.2) 62%)" : "linear-gradient(180deg,rgba(3,8,18,.94),rgba(3,8,18,.05) 55%,rgba(3,8,18,.75))" }} />
        <div style={{ position: "absolute", left: wide ? 65 : 45, right: wide ? 730 : 45, top: wide ? 65 : 300, fontFamily: DISPLAY, fontSize: wide ? 145 : 136, lineHeight: 0.88, color: C.white, WebkitTextStroke: `${wide ? 7 : 9}px ${C.ink}`, paintOrder: "stroke fill", textShadow: `0 11px 0 ${C.ink}` }}>
          TIME ZONES<br /><span style={{ color: C.gold }}>ARE SO WEIRD</span>
        </div>
        <div style={{ position: "absolute", left: wide ? 80 : 65, bottom: wide ? 70 : 330 }}><Clock label="INDIA HAS ONE TIME" time="UTC +5:30" color={C.saffron} /></div>
      </>}
    </AbsoluteFill>
  );
};

const jitterColor = (lon: number) => lon % 30 === 0 ? C.gold : C.cyan;

export const TimeZonesVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const ctaT = timing.sections.find((s) => s.text.toLowerCase().includes("please like"))?.start ?? timing.durationSec;
  const first = (kind: Kind) => timing.sections.find((s) => kindOf(s.text) === kind)?.start ?? NaN;
  const sfx: [number, string, number][] = [[0.1, "riser", 0.14], [0.9, "boom", 0.2], [first("greenwich"), "ding", 0.16], [first("india"), "whoosh", 0.15], [first("dateline"), "whoosh", 0.14], [first("aha"), "boom", 0.18]];
  const cue = (time: number, name: string, volume: number) => Number.isFinite(time) ? <Sequence key={`${name}-${time}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={75}><Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} /></Sequence> : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([time, name, volume]) => cue(time, name, volume))}
      {nudgeTimes(ctaT).map((time) => cue(time + 1.1, "ding", 0.13))}
      <TimeZonesScene timing={timing} />
      <CoverTitle lines={["TIME ZONES", "ARE SO WEIRD"]} sub="Why India has just ONE" accent={C.gold} />
    </AbsoluteFill>
  );
};

export const TimeZonesThumb: React.FC<{ timing: Timing }> = ({ timing }) => <TimeZonesScene timing={timing} thumbnail />;
