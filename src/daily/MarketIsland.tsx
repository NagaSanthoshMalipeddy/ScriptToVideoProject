import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, SubscribeNudge } from "../cartoon/Nudge";
import type { Section, Timing } from "../types";
import { geomPath } from "../ukraine/GeoMap";
import { COUNTRIES } from "../wonders/data";

type Pt = [number, number];
type View = { lon: number; lat: number; span: number };
type Kind =
  | "hook"
  | "location"
  | "scale"
  | "origin"
  | "inherit"
  | "lighthouse"
  | "wrong"
  | "problem"
  | "move"
  | "redraw"
  | "take"
  | "swap"
  | "coast"
  | "aha"
  | "mistake"
  | "bridge"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);

const C = {
  night: "#061827",
  sea: "#0b3855",
  seaLight: "#12658a",
  grid: "rgba(152,220,255,.09)",
  cream: "#f1e7d0",
  ink: "#121a27",
  sweden: "#1769aa",
  swedenYellow: "#ffd43b",
  finland: "#255aa8",
  red: "#e44848",
  gold: "#ffd23f",
  white: "#ffffff",
  cyan: "#61d9ff",
  green: "#39c98a",
};

const V: Record<Kind, View> = {
  hook: { lon: 19.13, lat: 60.3, span: 0.05 },
  location: { lon: 18.7, lat: 60.1, span: 18 },
  scale: { lon: 19.13, lat: 60.3, span: 0.05 },
  origin: { lon: 19.13, lat: 60.3, span: 0.05 },
  inherit: { lon: 19.13, lat: 60.3, span: 0.05 },
  lighthouse: { lon: 19.13, lat: 60.3, span: 0.05 },
  wrong: { lon: 19.13, lat: 60.3, span: 0.05 },
  problem: { lon: 19.13, lat: 60.3, span: 0.05 },
  move: { lon: 19.13, lat: 60.3, span: 0.05 },
  redraw: { lon: 19.13, lat: 60.3, span: 0.05 },
  take: { lon: 19.13, lat: 60.3, span: 0.05 },
  swap: { lon: 19.13, lat: 60.3, span: 0.05 },
  coast: { lon: 19.13, lat: 60.3, span: 0.05 },
  aha: { lon: 19.13, lat: 60.3, span: 0.05 },
  mistake: { lon: 19.13, lat: 60.3, span: 0.05 },
  bridge: { lon: 18.7, lat: 60.1, span: 18 },
  cta: { lon: 18.7, lat: 60.1, span: 22 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("world is full")) return "bridge";
  if (s.includes("one building mistake")) return "mistake";
  if (s.includes("that is why")) return "aha";
  if (s.includes("coastlines stayed")) return "coast";
  if (s.includes("equal pieces")) return "swap";
  if (s.includes("could not simply")) return "take";
  if (s.includes("1985")) return "redraw";
  if (s.includes("impractical")) return "move";
  if (s.includes("international border")) return "problem";
  if (s.includes("one problem")) return "wrong";
  if (s.includes("1885")) return "lighthouse";
  if (s.includes("inherited")) return "inherit";
  if (s.includes("1809")) return "origin";
  if (s.includes("3.3 hectares")) return "scale";
  if (s.includes("lonely rock")) return "location";
  return "hook";
};

const activeSection = (sections: Section[], T: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (T >= section.start) active = index;
  });
  return active;
};

const cameraAt = (sections: Section[], T: number): View => {
  const i = activeSection(sections, T);
  const section = sections[i];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((T - (section?.start ?? 0)) / 1.35));
  const bump = Math.max(from.span, to.span) * (1 + 0.18 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return { lon: lerp(from.lon, to.lon, p), lat: lerp(from.lat, to.lat, p), span };
};

const COPY: Record<Kind, [string, string, string, string]> = {
  hook: ["SWEDEN + FINLAND", "ONE TINY ISLAND", "A border bends around one lighthouse", C.gold],
  location: ["ÅLAND SEA · NORTHERN BALTIC", "MÄRKET", "60.30° N · 19.13° E", C.cyan],
  scale: ["TINY AND UNINHABITED", "ABOUT 3.3 HECTARES", "Smaller than five football pitches", C.gold],
  origin: ["THE FIRST LINE", "1809", "A straight border split the skerry", C.gold],
  inherit: ["THE EASTERN HALF", "FINLAND", "Finland inherited the former Russian side", C.finland],
  lighthouse: ["BUILT BY RUSSIA", "1885 LIGHTHOUSE", "But it landed on the western half", C.red],
  wrong: ["THE PROBLEM", "WRONG COUNTRY", "The lighthouse stood on Swedish land", C.red],
  problem: ["LEGAL REALITY", "ACROSS THE BORDER", "A building trapped on the wrong side", C.gold],
  move: ["OPTION ONE", "MOVE THE LIGHTHOUSE?", "A massive stone tower made that impractical", C.red],
  redraw: ["THE PRACTICAL FIX", "1985", "Redraw the border around the tower", C.green],
  take: ["BUT THERE WAS A RULE", "NO EXTRA LAND", "Finland could not simply grow", C.gold],
  swap: ["THE SOLUTION", "EQUAL AREA SWAP", "Matching pieces traded sides", C.green],
  coast: ["THE COAST STAYED FIXED", "NO COUNTRY GREW", "Only the internal border moved", C.cyan],
  aha: ["THE FINAL BORDER", "A PERFECT PUZZLE", "It bends around the lighthouse", C.gold],
  mistake: ["THE PAYOFF", "A MISTAKE BECAME THE MAP", "One building permanently changed the line", C.red],
  bridge: ["GLOBETALES", "BORDERS HIDE STORIES", "Zoom out. Another map mystery waits.", C.cyan],
  cta: ["GLOBETALES", "FOLLOW THE NEXT MAP", "New geography stories every day", C.gold],
};

const Flag: React.FC<{ kind: "SE" | "FI" | "RU"; size?: number }> = ({ kind, size = 76 }) => (
  <div
    style={{
      position: "relative",
      width: size * 1.48,
      height: size,
      overflow: "hidden",
      border: `4px solid ${C.white}`,
      boxShadow: `0 7px 0 ${C.ink}`,
      background:
        kind === "SE"
          ? C.sweden
          : kind === "FI"
            ? C.white
            : "linear-gradient(#fff 0 33%,#1c57a7 33% 66%,#d52b1e 66%)",
    }}
  >
    {kind === "SE" && (
      <>
        <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: "12%", background: C.swedenYellow }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "43%", height: "16%", background: C.swedenYellow }} />
      </>
    )}
    {kind === "FI" && (
      <>
        <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: "13%", background: C.finland }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "42%", height: "17%", background: C.finland }} />
      </>
    )}
  </div>
);

const Lighthouse: React.FC<{ progress: number; beam?: number }> = ({ progress, beam = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: "45%",
      top: "39%",
      width: 150,
      height: 250,
      transform: `translate(-50%, -50%) scale(${0.72 + 0.28 * progress}) translateY(${(1 - progress) * 120}px)`,
      opacity: clamp(progress * 1.5),
      transformOrigin: "50% 100%",
      zIndex: 6,
    }}
  >
    {beam > 0 && (
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 21,
          width: 440,
          height: 90,
          clipPath: "polygon(0 43%,100% 0,100% 100%,0 57%)",
          background: `linear-gradient(90deg,rgba(255,236,128,${0.6 * beam}),transparent)`,
          transform: `rotate(${interpolate(beam, [0, 1], [-35, 22])}deg)`,
          transformOrigin: "0 50%",
        }}
      />
    )}
    <div style={{ position: "absolute", left: 42, bottom: 0, width: 70, height: 178, background: "repeating-linear-gradient(#f7f4e8 0 32px,#d84a48 32px 56px)", border: `5px solid ${C.ink}`, clipPath: "polygon(18% 0,82% 0,100% 100%,0 100%)" }} />
    <div style={{ position: "absolute", left: 29, top: 18, width: 96, height: 48, borderRadius: "12px 12px 4px 4px", background: "#ffed8d", border: `5px solid ${C.ink}` }} />
    <div style={{ position: "absolute", left: 17, top: 4, width: 120, height: 25, borderRadius: "50% 50% 5px 5px", background: C.red, border: `5px solid ${C.ink}` }} />
  </div>
);

const InfoCard: React.FC<{ kind: Kind; start: number; frame: number; fps: number }> = ({ kind, start, frame, fps }) => {
  const [kicker, title, sub, accent] = COPY[kind];
  const p = spring({ frame: frame - Math.round(start * fps), fps, config: { damping: 13, mass: 0.7 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        top: 310,
        width: 992,
        minHeight: 270,
        padding: "30px 38px 25px",
        background: "rgba(255,255,255,.96)",
        border: `6px solid ${C.ink}`,
        borderRadius: 30,
        boxShadow: `0 14px 0 ${C.ink}`,
        transform: `translateY(${(1 - p) * -85}px)`,
        opacity: clamp(p * 1.5),
        zIndex: 20,
      }}
    >
      <div style={{ fontFamily: BODY, color: accent, fontSize: 28, fontWeight: 1000, letterSpacing: 3 }}>{kicker}</div>
      <div style={{ marginTop: 6, fontFamily: DISPLAY, color: C.ink, fontSize: 78, lineHeight: 0.96 }}>{title}</div>
      <div style={{ marginTop: 14, fontFamily: BODY, color: "#405064", fontSize: 34, lineHeight: 1.1, fontWeight: 850 }}>{sub}</div>
    </div>
  );
};

const IslandPlan: React.FC<{ kind: Kind; reveal: number; frame: number; fps: number; thumbnail?: boolean }> = ({
  kind,
  reveal,
  frame,
  fps,
  thumbnail = false,
}) => {
  const finalBorder = ["redraw", "take", "swap", "coast", "aha", "mistake", "bridge", "cta", "hook"].includes(kind);
  const lighthouseOn = ["lighthouse", "wrong", "problem", "move", "redraw", "take", "swap", "coast", "aha", "mistake", "bridge", "cta", "hook"].includes(kind);
  const borderDraw = thumbnail ? 1 : finalBorder ? reveal : 1;
  const lightPop = thumbnail ? 1 : lighthouseOn ? spring({ frame: Math.max(0, frame), fps, config: { damping: 11, mass: 0.65 } }) : 0;
  const outline = "M125 360 C110 300 140 218 220 170 C310 115 435 105 555 138 C680 170 820 248 900 340 C952 402 936 476 865 520 C750 590 622 600 485 574 C350 548 250 518 170 463 C132 437 116 401 125 360Z";
  const zig = "M506 126 L506 208 L438 250 L438 348 L540 380 L540 468 L490 506 L490 582";
  const straight = "M506 126 L506 582";
  const path = finalBorder ? zig : straight;
  const dash = 560 * (1 - borderDraw);
  const swapP = kind === "swap" ? reveal : 0;
  const coastOn = kind === "coast" ? reveal : 0;
  const warning = ["wrong", "problem", "move"].includes(kind) ? reveal : 0;
  const beam = ["aha", "mistake"].includes(kind) ? reveal : 0;

  return (
    <div style={{ position: "absolute", left: 34, right: 34, top: 660, height: 850 }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 780">
        <defs>
          <clipPath id="marketIslandClip"><path d={outline} /></clipPath>
          <filter id="islandShadow"><feDropShadow dx="0" dy="18" stdDeviation="12" floodColor="#000" floodOpacity=".45" /></filter>
          <pattern id="rockTexture" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="8" r="3" fill="rgba(255,255,255,.16)" />
            <path d="M12 29l15-7" stroke="rgba(0,0,0,.12)" strokeWidth="3" />
          </pattern>
        </defs>
        <g filter="url(#islandShadow)">
          <path d={outline} fill={C.cream} stroke={coastOn ? C.white : C.ink} strokeWidth={coastOn ? 16 : 8} />
          <g clipPath="url(#marketIslandClip)">
            <rect x="95" y="95" width="412" height="520" fill={C.sweden} opacity=".94" />
            <rect x="506" y="95" width="445" height="520" fill={C.finland} opacity=".92" />
            <path d={outline} fill="url(#rockTexture)" />
            {finalBorder && <path d="M438 250L506 208V126H506V208L438 250V348L540 380V468L490 506V582H506V126" fill="rgba(37,90,168,.92)" />}
            {finalBorder && <path d="M438 250L506 208V126H438V250M540 380V468L490 506V582H540V380" fill="rgba(23,105,170,.95)" opacity={0.95} />}
            {swapP > 0 && (
              <>
                <path d="M454 225l52-32v66l-52 30z" fill={C.gold} stroke={C.ink} strokeWidth="5" transform={`translate(${70 * (1 - swapP)} ${-70 * (1 - swapP)})`} />
                <path d="M506 410l34 12v45l-34 25z" fill={C.cyan} stroke={C.ink} strokeWidth="5" transform={`translate(${-70 * (1 - swapP)} ${70 * (1 - swapP)})`} />
              </>
            )}
          </g>
          <path d={path} fill="none" stroke={C.white} strokeWidth="19" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="560" strokeDashoffset={dash} />
          <path d={path} fill="none" stroke={C.gold} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="560" strokeDashoffset={dash} />
        </g>
        <g fontFamily={BODY} fontWeight="1000" textAnchor="middle">
          <text x="295" y="655" fill={C.white} fontSize="38" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>SWEDEN</text>
          <text x="715" y="655" fill={C.white} fontSize="38" style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 9 }}>FINLAND</text>
        </g>
        {kind === "origin" && (
          <g>
            <text x="505" y="730" textAnchor="middle" fill={C.gold} fontFamily={DISPLAY} fontSize="56">STRAIGHT LINE · 1809</text>
          </g>
        )}
        {kind === "scale" && (
          <g transform={`translate(0 ${(1 - reveal) * 90})`} opacity={reveal}>
            <rect x="310" y="660" width="380" height="72" rx="36" fill={C.gold} stroke={C.ink} strokeWidth="6" />
            <text x="500" y="710" textAnchor="middle" fill={C.ink} fontFamily={DISPLAY} fontSize="52">≈ 3.3 HECTARES</text>
          </g>
        )}
        {warning > 0 && (
          <g transform={`translate(650 305) scale(${0.8 + 0.2 * warning})`} opacity={warning}>
            <circle r="82" fill={C.red} stroke={C.white} strokeWidth="8" />
            <text textAnchor="middle" y="20" fill={C.white} fontFamily={DISPLAY} fontSize="88">!</text>
          </g>
        )}
        {kind === "move" && (
          <g opacity={reveal}>
            <path d="M420 310 Q270 260 220 360" fill="none" stroke={C.red} strokeWidth="10" strokeDasharray="18 12" />
            <path d="M188 320l64 64M252 320l-64 64" stroke={C.red} strokeWidth="15" strokeLinecap="round" />
          </g>
        )}
        {kind === "take" && (
          <g opacity={reveal}>
            <rect x="620" y="645" width="280" height="76" rx="20" fill={C.red} stroke={C.ink} strokeWidth="6" />
            <text x="760" y="697" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="50">NO EXTRA LAND</text>
          </g>
        )}
        {kind === "swap" && (
          <g opacity={reveal}>
            <path d="M345 680H655" stroke={C.white} strokeWidth="8" />
            <path d="M500 665v40" stroke={C.gold} strokeWidth="10" />
            <circle cx="500" cy="683" r="22" fill={C.gold} />
            <text x="500" y="755" textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize="48">EQUAL AREA</text>
          </g>
        )}
      </svg>
      <Lighthouse progress={lightPop} beam={beam} />
      <div style={{ position: "absolute", left: 138, top: 700, transform: `scale(${0.8 + 0.2 * reveal})` }}><Flag kind="SE" size={66} /></div>
      <div style={{ position: "absolute", right: 138, top: 700, transform: `scale(${0.8 + 0.2 * reveal})` }}><Flag kind={kind === "origin" ? "RU" : "FI"} size={66} /></div>
    </div>
  );
};

const ContextMap: React.FC<{ cam: View; W: number; H: number; reveal: number; kind: Kind }> = ({ cam, W, H, reveal, kind }) => {
  const refLat = 60;
  const cos = Math.cos((refLat * Math.PI) / 180);
  const focusX = W * 0.5;
  const focusY = H * 0.61;
  const scale = Math.min(W / (cam.span * cos), H * 0.72 / cam.span);
  const P = (lon: number, lat: number): Pt => [focusX + (lon - cam.lon) * cos * scale, focusY - (lat - cam.lat) * scale];
  const [mx, my] = P(19.13, 60.3);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
      {COUNTRIES.filter((country) => ["SWE", "FIN", "NOR", "EST", "LVA", "DNK", "RUS"].includes(country.iso)).map((country) => (
        <path
          key={country.iso}
          d={geomPath(country.geom as never, P)}
          fill={country.iso === "SWE" ? C.sweden : country.iso === "FIN" ? C.finland : "#8797a4"}
          fillOpacity={country.iso === "SWE" || country.iso === "FIN" ? 0.88 : 0.35}
          stroke={C.ink}
          strokeWidth={2}
        />
      ))}
      <circle cx={mx} cy={my} r={20 + 10 * Math.sin(reveal * Math.PI)} fill={C.gold} stroke={C.white} strokeWidth={6} />
      <circle cx={mx} cy={my} r={50 * reveal} fill="none" stroke={C.gold} strokeWidth={6} opacity={1 - reveal * 0.5} />
      <path d={`M${mx},${my + 20}l-16,34h32z`} fill={C.gold} stroke={C.white} strokeWidth={4} />
      <text x={mx} y={my - 50} textAnchor="middle" fill={C.white} fontFamily={DISPLAY} fontSize={52} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 10 }}>MÄRKET</text>
      {(kind === "location" || kind === "bridge" || kind === "cta") && (
        <text x={mx} y={my + 96} textAnchor="middle" fill={C.cyan} fontFamily={BODY} fontSize={31} fontWeight={1000} style={{ paintOrder: "stroke", stroke: C.ink, strokeWidth: 8 }}>60.30° N · 19.13° E</text>
      )}
    </svg>
  );
};

export const MarketIslandScene: React.FC<{ timing: Timing; thumbnail?: boolean }> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const T = thumbnail ? 2 : frame / fps;
  const i = activeSection(timing.sections, T);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind: Kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const cam = thumbnail ? V.hook : cameraAt(timing.sections, T);
  const reveal = thumbnail ? 1 : ease(clamp((T - section.start) / 1.1));
  const context = ["location", "bridge", "cta"].includes(kind);
  const cta = timing.sections.find((s) => s.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? timing.durationSec;
  const wordAt = (needle: string) =>
    cta?.words.find((word) => word.word.toLowerCase().replace(/[^a-z]/g, "").startsWith(needle))?.start ?? ctaT;
  const push = thumbnail ? 1 : 1 + 0.025 * clamp((T - section.start) / Math.max(1, section.end - section.start));

  return (
    <AbsoluteFill style={{ background: C.night, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})` }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="marketSea" cx="50%" cy="48%" r="78%"><stop offset="0" stopColor={C.seaLight} /><stop offset=".5" stopColor={C.sea} /><stop offset="1" stopColor={C.night} /></radialGradient>
            <pattern id="marketGrid" width="70" height="70" patternUnits="userSpaceOnUse"><path d="M70 0H0V70" fill="none" stroke={C.grid} strokeWidth="2" /></pattern>
          </defs>
          <rect width={W} height={H} fill="url(#marketSea)" />
          <rect width={W} height={H} fill="url(#marketGrid)" />
        </svg>
        {context ? <ContextMap cam={cam} W={W} H={H} reveal={reveal} kind={kind} /> : <IslandPlan kind={kind} reveal={reveal} frame={frame - Math.round(section.start * fps)} fps={fps} thumbnail={thumbnail} />}
      </div>

      {!thumbnail && <InfoCard kind={kind} start={section.start} frame={frame} fps={fps} />}
      {!thumbnail && <div style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none" }}><SubscribeNudge T={T} until={ctaT} top={1480} /></div>}
      {!thumbnail && T >= ctaT && <div style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none" }}><CtaCard T={T} likeT={wordAt("like")} shareT={wordAt("share")} subT={wordAt("subscribe")} top={1390} /></div>}

      <div style={{ position: "absolute", left: 38, bottom: 48, zIndex: 40, color: "rgba(255,255,255,.78)", fontFamily: BODY, fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>
        {context ? "GEOGRAPHIC CONTEXT" : "CLOSE-UP INFOGRAPHIC · NOT TO SURVEY SCALE"}
      </div>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 150px rgba(0,0,0,.68)" }} />
    </AbsoluteFill>
  );
};

export const MarketIslandVideo: React.FC<{ timing: Timing }> = ({ timing }) => (
  <AbsoluteFill>
    <Audio src={staticFile(timing.audio)} />
    <MarketIslandScene timing={timing} />
  </AbsoluteFill>
);

export const MarketIslandThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <AbsoluteFill style={{ background: C.night }}>
    <MarketIslandScene timing={timing} thumbnail />
    <div style={{ position: "absolute", left: 54, right: 54, top: 306, textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "12px 24px", borderRadius: 999, background: C.gold, border: `5px solid ${C.ink}`, boxShadow: `0 9px 0 ${C.ink}`, fontFamily: BODY, color: C.ink, fontWeight: 1000, fontSize: 31, letterSpacing: 2 }}>
        <Flag kind="SE" size={34} /> SWEDEN + FINLAND <Flag kind="FI" size={34} />
      </div>
      <div style={{ marginTop: 26, fontFamily: DISPLAY, color: C.white, fontSize: 110, lineHeight: 0.88, textShadow: `0 8px 0 ${C.ink}, 0 0 28px rgba(0,0,0,.7)` }}>
        ONE TINY<br />ISLAND
      </div>
      <div style={{ marginTop: 24, display: "inline-block", padding: "12px 28px", borderRadius: 18, background: C.red, border: `5px solid ${C.white}`, boxShadow: `0 9px 0 ${C.ink}`, color: C.white, fontFamily: DISPLAY, fontSize: 58, transform: "rotate(-2deg)" }}>
        ZIG-ZAG BORDER!
      </div>
    </div>
  </AbsoluteFill>
);
