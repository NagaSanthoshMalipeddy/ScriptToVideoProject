import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { countryGeom, makeSatProjector, SatelliteMap, type SatView } from "../geo/SatelliteMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";

type Pt = [number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const GOLD = "#ffd23f";
const RED = "#ff3b4a";
const GREEN = "#2ecc71";
const INK = "#1a0f24";
const W = 1080;
const H = 1920;

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  taj: 1.13, three: 3.0, which: 4.69, usual: 8.25, mumtaz: 10.6, truth: 14.47, notFirst: 15.46, history: 18.99, kand: 21.4, y1612: 24.9,
  arju: 27.35, renamed: 30.23, izz: 33.73, only: 37.99, memory: 40.0, y1631: 42.25, child: 44.2, died: 47.66, after: 49.25, tomb: 52.2,
  that: 55.48, famous: 58.18, tajName: 60.3, question: 61.91, why: 63.95, whyHer: 66.5, voiceEnd: 70.3, cta: 70.6,
};
export const TAJ_SECONDS = 76;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const AGRA: Pt = [78.042, 27.175];
const BURHANPUR: Pt = [76.23, 21.31];
const V = {
  wide: { lon: 80, lat: 22, span: 60 },
  india: { lon: 79, lat: 22.5, span: 34 },
  agra: { lon: 78.04, lat: 26.6, span: 7 },
  mid: { lon: 77.2, lat: 24.2, span: 12 },
} satisfies Record<string, SatView>;
const KEYS: [number, SatView][] = [
  [0, V.wide], [B.usual, V.wide], [B.usual + 0.2, V.india], [B.mumtaz - 0.8, V.agra], [B.history - 0.2, V.india], [B.y1631 - 0.1, V.mid],
  [B.after, V.india], [B.that - 0.1, V.agra], [B.question - 0.1, V.india], [B.cta, V.wide], [TAJ_SECONDS + 2, V.wide],
];
const cameraAt = (T: number): SatView => {
  let k = 0;
  while (k < KEYS.length - 1 && T >= KEYS[k + 1][0]) k++;
  if (k === 0) return KEYS[0][1];
  const a = KEYS[k - 1][1];
  const [t0, b] = KEYS[k];
  const next = k + 1 < KEYS.length ? KEYS[k + 1][0] : t0 + 2;
  const p = ease(clamp((T - t0) / Math.max(0.01, Math.min(2, next - t0))));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

// ---- art -------------------------------------------------------------------------------------
const minaret = (cx: number, top: number, w: number) => [
  `M${cx - w / 2} 470 L${cx - w * 0.38} ${top} H${cx + w * 0.38} L${cx + w / 2} 470 Z`,
  `M${cx - w * 0.62} ${top} Q${cx} ${top - w * 1.5} ${cx + w * 0.62} ${top} Z`,
  `M${cx - w * 0.6} ${lerp(top, 470, 0.33)} H${cx + w * 0.6} M${cx - w * 0.56} ${lerp(top, 470, 0.66)} H${cx + w * 0.56}`,
];
const TAJ_BACK = [...minaret(128, 200, 18), ...minaret(472, 200, 18)];
const TAJ_MAIN = [
  "M140 470 V300 L160 280 H440 L460 300 V470 Z",
  "M232 280 V246 H368 V280 Z",
  "M236 248 C196 200 214 140 270 118 C288 110 296 96 300 76 C304 96 312 110 330 118 C386 140 404 200 364 248 Z",
  "M168 280 V258 H212 V280 Z",
  "M164 260 Q190 212 216 260 Z",
  "M388 280 V258 H432 V280 Z",
  "M384 260 Q410 212 436 260 Z",
];
const TAJ_RECESS = [
  "M250 470 V362 Q250 318 300 300 Q350 318 350 362 V470 Z",
  "M175 460 V412 Q175 392 197 384 Q219 392 219 412 V460 Z",
  "M175 368 V332 Q175 314 197 306 Q219 314 219 332 V368 Z",
  "M381 460 V412 Q381 392 403 384 Q425 392 425 412 V460 Z",
  "M381 368 V332 Q381 314 403 306 Q425 314 425 332 V368 Z",
];
const TAJ_FRONT = [...minaret(52, 170, 24), ...minaret(548, 170, 24), "M20 470 H580 V500 H20 Z", "M235 470 V290 H365 V470", "M300 76 V38"];
const TAJ_ALL = [...TAJ_BACK, ...TAJ_MAIN, ...TAJ_RECESS, ...TAJ_FRONT];

const Taj: React.FC<{ w: number; mode?: "solid" | "blue"; draw?: number; glow?: number }> = ({ w, mode = "solid", draw = 1, glow = 0 }) => {
  if (mode === "blue") {
    return (
      <svg width={w} height={(w * 520) / 600} viewBox="0 0 600 520" style={{ overflow: "visible" }}>
        {TAJ_ALL.map((d, i) => {
          const p = clamp((draw - (i / TAJ_ALL.length) * 0.7) / 0.3);
          return p > 0 ? <path key={i} d={d} fill="none" stroke="#cfeeff" strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /> : null;
        })}
      </svg>
    );
  }
  const st = { stroke: "#7d6f5a", strokeWidth: 2.5, strokeLinejoin: "round" as const };
  return (
    <svg width={w} height={(w * 520) / 600} viewBox="0 0 600 520" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${30 * glow}px rgba(255,200,120,${0.8 * glow}))` : undefined }}>
      <defs>
        <linearGradient id="tajDome" x1="0" x2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.6" stopColor="#f3ece0" />
          <stop offset="1" stopColor="#d9cfbf" />
        </linearGradient>
      </defs>
      {TAJ_BACK.map((d, i) => <path key={`b${i}`} d={d} fill={i % 3 === 2 ? "none" : "#e2d9ca"} {...st} />)}
      {TAJ_MAIN.map((d, i) => <path key={`m${i}`} d={d} fill={i === 2 || i === 4 || i === 6 ? "url(#tajDome)" : "#f6f1e7"} {...st} />)}
      {TAJ_RECESS.map((d, i) => <path key={`r${i}`} d={d} fill="#cdbfa8" {...st} />)}
      {TAJ_FRONT.map((d, i) => <path key={`f${i}`} d={d} fill={d.endsWith("Z") && !d.includes("H580") ? (i % 3 === 2 ? "none" : "#f8f3ea") : d.includes("H580") ? "#e9e1d3" : "none"} {...st} />)}
      <circle cx={300} cy={40} r={6} fill={GOLD} stroke="#7d6f5a" strokeWidth={2} />
    </svg>
  );
};

const QUEEN = {
  kand: { veil: "#1f7a6d", name: "KANDAHARI BEGUM", year: "1610", n: "#1", te: "మొదటి భార్య" },
  mumtaz: { veil: "#c2185b", name: "ARJUMAND BANU BEGUM", year: "1612", n: "#2", te: "రెండో భార్య" },
  izz: { veil: "#4c3fa8", name: "IZZ-UN-NISSA BEGUM", year: "1617", n: "#3", te: "మూడో భార్య" },
};
type QueenKey = keyof typeof QUEEN;

// Queen portrait in a Mughal arch frame.
const Queen: React.FC<{ q: QueenKey; w: number; dim?: number; glow?: number; mystery?: number }> = ({ q, w, dim = 0, glow = 0, mystery = 0 }) => {
  const veil = QUEEN[q].veil;
  const id = `q${q}`;
  return (
    <div style={{ position: "relative", width: w, height: (w * 300) / 220, filter: `${dim ? `grayscale(${dim}) brightness(${1 - dim * 0.5})` : ""} ${glow ? `drop-shadow(0 0 ${36 * glow}px rgba(255,210,63,${glow}))` : ""} drop-shadow(0 14px 18px rgba(0,0,0,0.55))` }}>
      <svg width={w} height={(w * 300) / 220} viewBox="0 0 220 300">
        <defs>
          <clipPath id={`${id}c`}>
            <path d="M8 296 L8 118 Q8 52 110 6 Q212 52 212 118 L212 296 Z" />
          </clipPath>
          <radialGradient id={`${id}g`} cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#5a3a70" />
            <stop offset="1" stopColor="#170c22" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#${id}c)`}>
          <rect width={220} height={300} fill={`url(#${id}g)`} />
          <path d="M40 300 C50 238 80 206 110 206 C140 206 170 238 180 300Z" fill={veil} />
          <path d="M110 58 C66 58 52 100 56 150 C44 200 30 250 20 300 L60 300 C66 250 76 200 80 160 C80 120 92 100 110 100 C128 100 140 120 140 160 C144 200 154 250 160 300 L200 300 C190 250 176 200 164 150 C168 100 154 58 110 58 Z" fill={veil} stroke={GOLD} strokeWidth={4} />
          <ellipse cx={110} cy={146} rx={29} ry={37} fill="#e2b48c" />
          <path d="M81 138 Q84 104 110 100 Q136 104 139 138 Q128 116 110 114 Q92 116 81 138 Z" fill="#2b1a12" />
          <path d="M110 100 V112" stroke={GOLD} strokeWidth={3} />
          <circle cx={110} cy={115} r={4.5} fill={GOLD} />
          <path d="M96 146 Q100 150 104 146 M116 146 Q120 150 124 146" stroke="#3a2418" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M103 164 Q110 169 117 164" stroke="#9c4a3a" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M84 212 Q110 238 136 212" stroke={GOLD} strokeWidth={5} fill="none" />
          <circle cx={110} cy={228} r={5} fill={RED} stroke={GOLD} strokeWidth={2} />
          {mystery > 0 && <rect width={220} height={300} fill={`rgba(10,5,18,${0.72 * mystery})`} />}
        </g>
        <path d="M8 296 L8 118 Q8 52 110 6 Q212 52 212 118 L212 296 Z" fill="none" stroke={GOLD} strokeWidth={7} />
      </svg>
      {mystery > 0 && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: w * 0.12, fontFamily: DISPLAY, fontSize: w * 0.6, color: GOLD, opacity: mystery, textShadow: "0 6px 16px rgba(0,0,0,0.8)" }}>?</div>
      )}
    </div>
  );
};

const Title: React.FC<{ text: string; t: number; top: number; size?: number; color?: string; frame: number; fps: number; te?: boolean }> = ({ text, t, top, size = 110, color = "#fff", frame, fps, te = true }) => {
  const p = pop(frame, fps, t);
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, textAlign: "center", transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -5}deg)`, opacity: clamp(p * 1.6) }}>
      <span style={{ fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.15, color, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}` }}>{text}</span>
    </div>
  );
};

const Chip: React.FC<{ text: string; p: number; bg?: string; color?: string; size?: number; te?: boolean }> = ({ text, p, bg = "rgba(0,0,0,0.78)", color = "#fff", size = 44, te = false }) => (
  <div style={{ display: "inline-block", transform: `scale(${p})`, opacity: clamp(p * 2), background: bg, color, fontFamily: te ? TE_DISPLAY : BODY, fontWeight: 800, fontSize: size, letterSpacing: te ? 0 : 2, padding: "12px 30px", borderRadius: 999, border: `3px solid ${GOLD}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{text}</div>
);

const Stamp: React.FC<{ text: string; p: number; color: string; size?: number; tilt?: number }> = ({ text, p, color, size = 96, tilt = -7 }) => (
  <div style={{ display: "inline-block", fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.1, color, border: `10px solid ${color}`, borderRadius: 18, padding: "6px 34px", background: "rgba(0,0,0,0.6)", transform: `rotate(${tilt}deg) scale(${2 - p})`, opacity: clamp(p * 1.5), textAlign: "center", whiteSpace: "pre-line" }}>{text}</div>
);

const Pin: React.FC<{ x: number; y: number; label: string; o: number; color?: string }> = ({ x, y, label, o, color = RED }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: o }}>
    <div style={{ width: 26, height: 26, borderRadius: "50%", background: color, border: "5px solid #fff", boxShadow: `0 0 22px ${color}` }} />
    <div style={{ marginTop: 8, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 38, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.95)", whiteSpace: "nowrap" }}>{label}</div>
  </div>
);

// ---- scene -----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.which - 0.15], ["which", B.which - 0.15, B.usual - 0.15], ["agra", B.usual - 0.15, B.truth - 0.15], ["truth", B.truth - 0.15, B.history - 0.15],
  ["wives", B.history - 0.15, B.only - 0.15], ["only", B.only - 0.15, B.y1631 - 0.15], ["death", B.y1631 - 0.15, B.after - 0.15], ["tomb", B.after - 0.15, B.that - 0.15],
  ["reveal", B.that - 0.15, B.question - 0.15], ["question", B.question - 0.15, B.why - 0.15], ["why", B.why - 0.15, 999],
];
const CARD_SCENES = ["hook", "which", "wives", "only", "tomb", "question", "why"];

export const TajScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const view = cameraAt(T);
  const { project: P } = makeSatProjector(view, W, H);
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const dimMap = SCENES.reduce((m, [n, a, b]) => Math.max(m, CARD_SCENES.includes(n) ? win(T, a, b, 0.5) : 0), 0);
  const [ax, ay] = P(AGRA[0], AGRA[1]);
  const [bx, by] = P(BURHANPUR[0], BURHANPUR[1]);
  const agraPin = Math.max(o("agra") * clamp((T - B.mumtaz + 0.6) * 3), o("truth"), o("death"), o("reveal"));
  const showIndia = T > B.usual && T < B.history;

  return (
    <AbsoluteFill style={{ background: "#07101f", overflow: "hidden" }}>
      <SatelliteMap view={view} width={W} height={H} darken={0.1} highlights={showIndia ? [{ geom: countryGeom("IND"), fill: "rgba(255,190,20,0.22)", stroke: GOLD, label: T < B.mumtaz - 0.8 ? "INDIA" : undefined, labelAt: [78.5, 21], labelSize: 40 }] : []}>
        {o("death") > 0 && (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: o("death") }}>
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#fff" strokeWidth={5} strokeDasharray="16 12" pathLength={1} opacity={0.85} />
          </svg>
        )}
        {agraPin > 0 && <Pin x={ax} y={ay} label="AGRA" o={agraPin} color={GOLD} />}
        {o("death") > 0 && <Pin x={bx} y={by} label="BURHANPUR" o={o("death") * clamp((T - B.y1631) * 3)} />}
      </SatelliteMap>
      <AbsoluteFill style={{ background: `rgba(6,4,14,${0.62 * dimMap})` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      {T < 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <Title text={T < B.taj ? "ఏంటి?!" : "తాజ్ మహల్ కట్టించిన షాజహాన్ కి"} t={T < B.taj ? 0.05 : B.taj} top={T < B.taj ? 420 : 320} size={T < B.taj ? 170 : 66} color={T < B.taj ? GOLD : "#fff"} frame={frame} fps={fps} />
          {T >= B.three - 0.1 && <Title text="ముగ్గురు భార్యలా?!" t={B.three - 0.1} top={420} size={120} color={GOLD} frame={frame} fps={fps} />}
          <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center", transform: `translateY(${(1 - pop(frame, fps, B.taj - 0.2, 14)) * 500}px) scale(${lerp(1.05, 0.92, clamp((T - B.three) / 1.2))})` }}>
            <Taj w={560} glow={0.6} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", gap: 36 }}>
            {(["kand", "mumtaz", "izz"] as QueenKey[]).map((q, i) => {
              const p = pop(frame, fps, B.three + i * 0.22);
              return (
                <div key={q} style={{ transform: `translateY(${(1 - p) * 400}px) rotate(${(i - 1) * 5}deg)`, opacity: clamp(p * 2) }}>
                  <Queen q={q} w={220} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {o("which") > 0 && (
        <AbsoluteFill style={{ opacity: o("which") }}>
          <Title text="మరి తాజ్ మహల్" t={B.which} top={310} size={92} frame={frame} fps={fps} />
          <Title text="ఏ భార్య కోసం?" t={B.which + 0.9} top={430} size={120} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 610, display: "flex", justifyContent: "center" }}>
            <Taj w={420} glow={0.5} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", gap: 36 }}>
            {(["kand", "mumtaz", "izz"] as QueenKey[]).map((q, i) => {
              const lit = Math.floor((T - B.which) * 2.2) % 3 === i;
              return (
                <div key={q} style={{ transform: `scale(${lit ? 1.08 : 0.96}) rotate(${(i - 1) * 5}deg)` }}>
                  <Queen q={q} w={220} mystery={clamp((T - B.which) * 3)} glow={lit ? 0.9 : 0} />
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {o("agra") > 0 && (
        <AbsoluteFill style={{ opacity: o("agra") }}>
          <Title text="మనం వినేది…" t={B.usual} top={330} size={96} frame={frame} fps={fps} />
          {T > B.mumtaz - 0.3 && (
            <>
              <div style={{ position: "absolute", left: ax - 130, top: ay - 330, transform: `scale(${pop(frame, fps, B.mumtaz - 0.3)})`, transformOrigin: "50% 100%" }}>
                <Taj w={260} glow={0.7} />
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1150, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
                <div style={{ transform: `scale(${pop(frame, fps, B.mumtaz)})` }}>
                  <Queen q="mumtaz" w={200} glow={0.7} />
                </div>
                <div style={{ transform: `scale(${pop(frame, fps, B.mumtaz + 0.4)})`, textAlign: "left" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 70, lineHeight: 1, color: "#fff", textShadow: "0 4px 14px rgba(0,0,0,0.9)" }}>FOR</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1, color: GOLD, textShadow: "0 4px 14px rgba(0,0,0,0.9)" }}>MUMTAZ</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1, color: GOLD, textShadow: "0 4px 14px rgba(0,0,0,0.9)" }}>MAHAL ❤</div>
                </div>
              </div>
            </>
          )}
        </AbsoluteFill>
      )}

      {o("truth") > 0 && (
        <AbsoluteFill style={{ opacity: o("truth") }}>
          <div style={{ position: "absolute", left: ax - 130, top: ay - 330 }}>
            <Taj w={260} glow={0.7} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center" }}>
            {T < B.notFirst - 0.1 ? <Stamp text="నిజమే ✓" p={pop(frame, fps, B.truth)} color={GREEN} size={120} /> : <Stamp text={"కానీ…\nమొదటి భార్య కాదు!"} p={pop(frame, fps, B.notFirst - 0.1)} color={RED} size={92} tilt={-5} />}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1100, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <Queen q="mumtaz" w={210} glow={0.6} />
            <div style={{ position: "relative", fontFamily: DISPLAY, fontSize: 150, color: "#fff", textShadow: "0 6px 18px rgba(0,0,0,0.9)" }}>
              #1?
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                <path d="M8 12 L92 88 M92 12 L8 88" stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.notFirst - 0.9) / 0.4)} fill="none" />
              </svg>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {o("wives") > 0 && (
        <AbsoluteFill style={{ opacity: o("wives") }}>
          <Title text="📜 చరిత్ర ప్రకారం…" t={B.history} top={300} size={80} color={GOLD} frame={frame} fps={fps} />
          {([["kand", B.kand, 470], ["mumtaz", B.y1612, 830], ["izz", B.izz, 1190]] as [QueenKey, number, number][]).map(([q, t, y]) => {
            const p = pop(frame, fps, t - 0.2);
            const Q = QUEEN[q];
            const renamed = q === "mumtaz" && T >= B.renamed;
            const rp = pop(frame, fps, B.renamed);
            const glow = q === "mumtaz" ? clamp((T - B.renamed) * 2) * (0.6 + 0.3 * Math.sin(T * 5)) : 0;
            return p > 0.01 ? (
              <div key={q} style={{ position: "absolute", left: 70, right: 40, top: y, height: 290, display: "flex", alignItems: "center", gap: 36, transform: `translateX(${(1 - p) * -900}px)` }}>
                <Queen q={q} w={200} glow={glow} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ fontFamily: DISPLAY, fontSize: 64, color: INK, background: GOLD, borderRadius: 16, padding: "0 18px" }}>{Q.n}</span>
                    <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 48, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>{Q.te}</span>
                  </div>
                  {renamed ? (
                    <>
                      <div style={{ fontFamily: DISPLAY, fontSize: 78, lineHeight: 1.02, color: GOLD, marginTop: 8, transform: `scale(${0.6 + 0.4 * rp})`, transformOrigin: "left center", textShadow: "0 0 24px rgba(255,210,63,0.7), 0 4px 12px rgba(0,0,0,0.9)" }}>MUMTAZ MAHAL ✨</div>
                      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: "#e8dcff", marginTop: 4, textDecoration: "line-through", opacity: 0.85 }}>ARJUMAND BANU BEGUM</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: DISPLAY, fontSize: q === "mumtaz" ? 60 : 66, lineHeight: 1.02, color: "#fff", marginTop: 8, textShadow: "0 4px 12px rgba(0,0,0,0.9)", opacity: q === "mumtaz" ? clamp((T - B.arju + 0.2) * 3) : 1 }}>{Q.name}</div>
                  )}
                  <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: GOLD, marginTop: 8, letterSpacing: 3 }}>MARRIED {Q.year}</div>
                </div>
              </div>
            ) : null;
          })}
        </AbsoluteFill>
      )}

      {o("only") > 0 && (
        <AbsoluteFill style={{ opacity: o("only") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", transform: `scale(${lerp(0.9, 1, clamp((T - B.only) / 3))})` }}>
            <Taj w={480} glow={0.9} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", fontSize: 110, transform: `scale(${pop(frame, fps, B.memory - 0.6) * (1 + 0.08 * Math.sin(T * 8))})` }}>❤️</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 930, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 30 }}>
            <Queen q="kand" w={170} dim={clamp((T - B.only) * 2)} />
            <div style={{ transform: `scale(${lerp(1, 1.12, clamp((T - B.only) * 2))})`, transformOrigin: "50% 100%" }}>
              <Queen q="mumtaz" w={250} glow={0.9} />
            </div>
            <Queen q="izz" w={170} dim={clamp((T - B.only) * 2)} />
          </div>
          <Title text="ముంతాజ్ జ్ఞాపకార్థం" t={B.memory - 0.4} top={1300} size={92} color={GOLD} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("death") > 0 && (
        <AbsoluteFill style={{ opacity: o("death") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center", transform: `scale(${pop(frame, fps, B.y1631)})` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 140, lineHeight: 1, color: "#fff", textShadow: "0 6px 20px rgba(0,0,0,0.95)" }}>1631</div>
            <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: GOLD, textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>BURHANPUR</div>
          </div>
          {T > B.child - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1320, display: "flex", justifyContent: "center", alignItems: "center", gap: 26, transform: `scale(${pop(frame, fps, B.child - 0.2)})` }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: 1, color: GOLD, textShadow: "0 6px 20px rgba(0,0,0,0.95)" }}>{Math.max(1, Math.min(14, Math.round(1 + (T - B.child) * 11)))}</span>
              <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 66, lineHeight: 1.1, color: "#fff", textShadow: "0 4px 14px rgba(0,0,0,0.95)" }}>వ బిడ్డ<br />పుట్టినప్పుడు</span>
            </div>
          )}
          {T > B.died - 0.2 && (
            <>
              <AbsoluteFill style={{ background: "rgba(5,8,25,0.45)", opacity: clamp((T - B.died) * 2) }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 530, display: "flex", justifyContent: "center" }}>
                <Chip text="MUMTAZ MAHAL · 1593 – 1631" p={pop(frame, fps, B.died)} color={GOLD} size={40} />
              </div>
            </>
          )}
        </AbsoluteFill>
      )}

      {o("tomb") > 0 && (
        <AbsoluteFill style={{ opacity: o("tomb") }}>
          <AbsoluteFill style={{ background: "rgba(8,40,78,0.82)", backgroundImage: "linear-gradient(rgba(160,220,255,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(160,220,255,0.12) 2px, transparent 2px)", backgroundSize: "60px 60px" }} />
          <Title text="ఒక భారీ సమాధి" t={B.after + 0.3} top={320} size={110} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
            <Taj w={760} mode="blue" draw={clamp((T - B.after) / 5)} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1290, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <Chip text="1632 → 1653" p={pop(frame, fps, B.tomb)} size={52} />
            <Chip text="≈ 20,000 WORKERS" p={pop(frame, fps, B.tomb + 1.2)} color={GOLD} size={44} />
          </div>
        </AbsoluteFill>
      )}

      {o("reveal") > 0 && (
        <AbsoluteFill style={{ opacity: o("reveal") }}>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,10,40,0.2) 0%, rgba(255,120,60,0.18) 55%, rgba(40,10,20,0.75) 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", transform: `translateY(${(1 - ease(clamp((T - B.that) / 1.6))) * 900}px) scale(${lerp(0.95, 1.05, clamp((T - B.that) / 6))})` }}>
            <Taj w={760} glow={1} />
          </div>
          <Title text="ప్రపంచంలోనే అత్యంత ప్రసిద్ధ కట్టడం" t={B.famous - 0.4} top={330} size={64} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", transform: `scale(${pop(frame, fps, B.tajName - 0.3)})` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 150, color: "#fff", textShadow: `0 0 30px rgba(255,200,120,0.8), 0 8px 0 ${INK}` }}>TAJ MAHAL</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center", gap: 18 }}>
            <Chip text="🌍 NEW 7 WONDERS" p={pop(frame, fps, B.famous + 0.6)} size={34} />
            <Chip text="UNESCO · 1983" p={pop(frame, fps, B.famous + 1.1)} size={34} color={GOLD} />
          </div>
        </AbsoluteFill>
      )}

      {o("question") > 0 && (
        <AbsoluteFill style={{ opacity: o("question") }}>
          <Title text="కానీ ప్రశ్న మాత్రం" t={B.question} top={330} size={100} frame={frame} fps={fps} />
          <Title text="అలాగే ఉంది…" t={B.question + 0.6} top={460} size={100} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 640, textAlign: "center", fontFamily: DISPLAY, fontSize: 620, lineHeight: 1, color: RED, textShadow: `0 20px 0 ${INK}, 0 0 60px rgba(255,59,74,0.6)`, transform: `scale(${pop(frame, fps, B.question + 0.2, 8) * (1 + 0.05 * Math.sin(T * 7))})` }}>?</div>
        </AbsoluteFill>
      )}

      {o("why") > 0 && (
        <AbsoluteFill style={{ opacity: o("why") }}>
          <Title text="3 భార్యల్లో…" t={B.why} top={320} size={100} frame={frame} fps={fps} />
          <Title text="ఎందుకు ముంతాజ్?" t={B.whyHer} top={450} size={120} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 30 }}>
            {(["kand", "mumtaz", "izz"] as QueenKey[]).map((q, i) => {
              const p = pop(frame, fps, B.why + 0.2 + i * 0.2);
              const center = q === "mumtaz";
              const focus = clamp((T - B.whyHer) * 2);
              return (
                <div key={q} style={{ transform: `translateY(${(1 - p) * 500}px) scale(${center ? lerp(1, 1.18, focus) : 1})`, transformOrigin: "50% 100%" }}>
                  <Queen q={q} w={center ? 270 : 200} dim={center ? 0 : focus * 0.8} glow={center ? focus * (0.7 + 0.3 * Math.sin(T * 5)) : 0} />
                </div>
              );
            })}
          </div>
          {T < B.cta && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center" }}>
              <Chip text="మీ సమాధానం COMMENT చేయండి 👇" p={pop(frame, fps, B.whyHer + 1.6)} size={46} te />
            </div>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1180} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const ShahJahanWives: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.22], [B.taj, "whoosh", 0.18], [B.three, "pop", 0.18], [B.three + 0.22, "pop", 0.18], [B.three + 0.44, "pop", 0.18], [B.which, "whoosh", 0.16],
    [B.usual, "whoosh", 0.2], [B.mumtaz, "ding", 0.2], [B.truth, "ding", 0.22], [B.notFirst, "boom", 0.24], [B.history, "whoosh", 0.18], [B.kand - 0.2, "pop", 0.2],
    [B.y1612 - 0.2, "pop", 0.2], [B.renamed, "ding", 0.22], [B.izz - 0.2, "pop", 0.2], [B.only, "whoosh", 0.18], [B.y1631, "whoosh", 0.2], [B.child - 0.2, "pop", 0.18],
    [B.died, "boom", 0.16], [B.after, "whoosh", 0.16], [B.tomb, "pop", 0.18], [B.tomb + 1.2, "pop", 0.18], [B.that, "whoosh", 0.2], [B.tajName - 0.3, "ding", 0.24],
    [B.question + 0.2, "boom", 0.22], [B.why, "whoosh", 0.18], [B.whyHer, "ding", 0.2],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("taj/voice.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <TajScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const ShahJahanThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#07101f" }}>
    <SatelliteMap view={{ lon: 79, lat: 24, span: 30 }} width={W} height={H} darken={0.2} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,4,20,0.85) 0%, rgba(40,10,30,0.35) 40%, rgba(255,120,60,0.2) 62%, rgba(10,4,20,0.85) 100%)" }} />
    <div style={{ position: "absolute", left: 30, right: 30, top: 300, textAlign: "center", lineHeight: 1.05 }}>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 96, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>షాజహాన్ కి</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 150, color: GOLD, WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}` }}>3 భార్యలా?!</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", justifyContent: "center" }}>
      <Taj w={600} glow={1} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 26 }}>
      <Queen q="kand" w={200} mystery={0.9} />
      <Queen q="mumtaz" w={250} glow={0.9} />
      <Queen q="izz" w={200} mystery={0.9} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1370, display: "flex", justifyContent: "center" }}>
      <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 64, color: "#fff", background: "rgba(255,59,74,0.95)", borderRadius: 20, padding: "4px 34px", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>తాజ్ మహల్ ఎవరి కోసం?</span>
    </div>
  </AbsoluteFill>
);
