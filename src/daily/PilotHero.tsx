import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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
const SAFFRON = "#ff9933";
const INK = "#0d1220";
const W = 1080;
const H = 1920;

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  drop: 3.75, but: 7.95, saved: 12.18, real: 14.95, date: 18.3, dubai: 19.8, israel: 20.8, fz: 22.0, captain: 26.3, smit: 27.9, coAttack: 29.0,
  cockpit: 31.46, injured: 34.0, sameTime: 35.53, drop14: 38.1, imagine: 41.82, high: 43.4, hurt: 45.87, attack: 47.48, pax: 49.54,
  notBack: 52.49, injured2: 54.92, door: 57.8, crew: 58.78, restrained: 63.7, twoPilots: 65.37, control: 67.7, saudi: 69.8, tabuk: 71.1,
  landed: 72.5, all174: 73.8, survived: 76.5, modi: 78.48, praised: 83.4, hospital: 84.9, think: 88.78, ownLife: 90.8, hundreds: 92.8,
  name: 95.6, captainName: 96.1, voiceEnd: 98.13, cta: 98.5,
};
export const PILOT_SECONDS = 104;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const DXB: Pt = [55.36, 25.25];
const TLV: Pt = [34.89, 32.01];
const TABUK: Pt = [36.62, 28.37];
const INCIDENT: Pt = [lerp(DXB[0], TLV[0], 0.8), lerp(DXB[1], TLV[1], 0.8)];
const V = {
  wide: { lon: 45, lat: 28.5, span: 34 },
  route: { lon: 45, lat: 28.6, span: 27 },
  incident: { lon: 40.5, lat: 29.8, span: 14 },
  tabuk: { lon: 37.6, lat: 29.0, span: 9 },
} satisfies Record<string, SatView>;
const KEYS: [number, SatView][] = [
  [0, V.wide], [B.date, V.wide], [B.date + 0.2, V.route], [B.sameTime - 0.2, V.incident], [B.imagine, V.wide], [B.twoPilots - 0.2, V.incident],
  [B.saudi - 0.4, V.tabuk], [B.all174, V.wide], [PILOT_SECONDS + 2, V.wide],
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

// Aircraft position (lon/lat) and heading for the map scenes.
const planeAt = (T: number): { p: Pt; ang: number } => {
  const toInc = clamp((T - B.dubai) / (B.captain - B.dubai));
  if (T < B.control) {
    const f = lerp(0.12, 0.8, ease(toInc));
    return { p: [lerp(DXB[0], TLV[0], f), lerp(DXB[1], TLV[1], f)], ang: Math.atan2(TLV[1] - DXB[1], TLV[0] - DXB[0]) };
  }
  const f = ease(clamp((T - B.control) / (B.landed - B.control)));
  return { p: [lerp(INCIDENT[0], TABUK[0], f), lerp(INCIDENT[1], TABUK[1], f)], ang: Math.atan2(TABUK[1] - INCIDENT[1], TABUK[0] - INCIDENT[0]) };
};

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

// ---- art -------------------------------------------------------------------------------------
const PHOTO = staticFile("pilot/captain.png");
const PW = 540;
const PH = 283;

const FaceCircle: React.FC<{ size: number; ring?: string; glow?: number }> = ({ size, ring = GOLD, glow = 0 }) => {
  const k = (size * 0.62) / 150;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative", border: `${Math.max(6, size * 0.035)}px solid ${ring}`, boxShadow: `0 16px 40px rgba(0,0,0,0.6)${glow ? `, 0 0 ${60 * glow}px rgba(255,210,63,${glow})` : ""}`, background: "#222" }}>
      <Img src={PHOTO} style={{ position: "absolute", width: PW * k, height: PH * k, left: size / 2 - 310 * k, top: size * 0.47 - 135 * k, filter: "contrast(1.05) saturate(1.08)" }} />
    </div>
  );
};

const PhotoCard: React.FC<{ w: number; tilt?: number; border?: string }> = ({ w, tilt = 0, border = GOLD }) => (
  <div style={{ width: w, height: (w * PH) / PW, borderRadius: 26, overflow: "hidden", border: `8px solid ${border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.65)", transform: `rotate(${tilt}deg)` }}>
    <Img src={PHOTO} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.05) saturate(1.08)" }} />
  </div>
);

const Plane: React.FC<{ size: number; color?: string }> = ({ size, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40">
    <path d="M18 0 L6 -2 L-2 -14 L-6 -14 L-1 -2 L-12 -2 L-16 -7 L-18 -7 L-15 0 L-18 7 L-16 7 L-12 2 L-1 2 L-6 14 L-2 14 L6 2 Z" fill={color} stroke="#111" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);

const SidePlane: React.FC<{ w: number }> = ({ w }) => (
  <svg width={w} height={w * 0.36} viewBox="0 0 300 108">
    <path d="M14 58 Q10 46 30 44 L238 40 Q290 42 296 58 Q290 72 238 72 L40 72 Q18 72 14 58 Z" fill="#f2f5fa" stroke="#1b2333" strokeWidth={4} />
    <path d="M40 44 L18 6 L46 6 L84 44 Z" fill="#e8434f" stroke="#1b2333" strokeWidth={4} strokeLinejoin="round" />
    <path d="M120 62 L170 102 L196 102 L170 62 Z" fill="#cfd6e2" stroke="#1b2333" strokeWidth={4} strokeLinejoin="round" />
    <path d="M262 48 Q280 49 286 56 L262 56 Z" fill="#1b2333" />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={96 + i * 17} cy={53} r={4} fill="#2b3a55" />)}
    <rect x={30} y={60} width={210} height={5} fill="#1e5aa8" />
  </svg>
);

const Person: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 40 52">
    <circle cx={20} cy={11} r={9} fill={color} />
    <path d="M4 52 Q4 24 20 24 Q36 24 36 52 Z" fill={color} />
  </svg>
);

const Tricolor: React.FC<{ w: number; h?: number }> = ({ w, h = 14 }) => (
  <div style={{ width: w, display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
    <div style={{ height: h, background: SAFFRON }} />
    <div style={{ height: h, background: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ width: h * 0.9, height: h * 0.9, borderRadius: "50%", border: `${Math.max(1.5, h * 0.12)}px solid #0b3d91` }} />
    </div>
    <div style={{ height: h, background: "#138808" }} />
  </div>
);

const Title: React.FC<{ text: string; t: number; top: number; size?: number; color?: string; frame: number; fps: number; te?: boolean }> = ({ text, t, top, size = 110, color = "#fff", frame, fps, te = true }) => {
  const p = pop(frame, fps, t);
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, textAlign: "center", transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -5}deg)`, opacity: clamp(p * 1.6) }}>
      <span style={{ fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.15, color, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}`, whiteSpace: "pre-line" }}>{text}</span>
    </div>
  );
};

const Chip: React.FC<{ text: string; p: number; bg?: string; color?: string; size?: number; te?: boolean; border?: string }> = ({ text, p, bg = "rgba(0,0,0,0.8)", color = "#fff", size = 44, te = false, border = GOLD }) => (
  <div style={{ display: "inline-block", transform: `scale(${p})`, opacity: clamp(p * 2), background: bg, color, fontFamily: te ? TE_DISPLAY : BODY, fontWeight: 800, fontSize: size, letterSpacing: te ? 0 : 2, padding: "12px 30px", borderRadius: 999, border: `3px solid ${border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{text}</div>
);

const Stamp: React.FC<{ text: string; p: number; color: string; size?: number; tilt?: number; te?: boolean }> = ({ text, p, color, size = 96, tilt = -7, te = true }) => (
  <div style={{ display: "inline-block", fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.1, color, border: `10px solid ${color}`, borderRadius: 18, padding: "6px 34px", background: "rgba(0,0,0,0.6)", transform: `rotate(${tilt}deg) scale(${2 - p})`, opacity: clamp(p * 1.5), textAlign: "center", whiteSpace: "pre-line" }}>{text}</div>
);

const Altimeter: React.FC<{ T: number; t0: number; dur?: number; top: number }> = ({ T, t0, dur = 2.6, top }) => {
  const f = Easing.in(Easing.quad)(clamp((T - t0) / dur));
  const alt = Math.round(lerp(34000, 20000, f) / 10) * 10;
  const blink = f > 0 && Math.floor(T * 6) % 2 === 0;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ background: "rgba(5,10,20,0.88)", border: `6px solid ${f > 0 ? RED : "#7a8aa6"}`, borderRadius: 24, padding: "14px 40px", boxShadow: blink ? `0 0 50px ${RED}` : "0 10px 30px rgba(0,0,0,0.6)", textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: "#9fb3d1" }}>ALTITUDE</div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 120, lineHeight: 1, color: f > 0 ? "#fff" : "#9fe8a6" }}>{alt.toLocaleString("en-US")}</div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 30, letterSpacing: 6, color: "#9fb3d1" }}>FEET</div>
      </div>
      <div style={{ marginTop: 18, transform: `scale(${clamp(f * 4)})` }}>
        <Chip text="▼ −14,000 FT" p={1} bg={RED} border="#fff" size={52} />
      </div>
    </div>
  );
};

const Cockpit: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const shake = T > B.coAttack && T < B.injured + 1 ? Math.sin(T * 50) * 6 : 0;
  const tilt = T > B.coAttack ? Math.sin(T * 1.7) * 5 : 0;
  const knife = clamp((T - B.coAttack) / 0.35);
  const hurt = T > B.injured - 0.2 ? 0.5 + 0.5 * Math.sin(T * 9) : 0;
  return (
    <div style={{ position: "absolute", left: 40, top: 560, width: 1000, height: 760, transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      <svg width={1000} height={760} viewBox="0 0 1000 760" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="ckSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1a3a" />
            <stop offset="1" stopColor="#3a5f9a" />
          </linearGradient>
          <clipPath id="ckWin">
            <path d="M60 300 L150 70 Q500 10 850 70 L940 300 Z" />
          </clipPath>
        </defs>
        <path d="M60 300 L150 70 Q500 10 850 70 L940 300 Z" fill="url(#ckSky)" />
        <g clipPath="url(#ckWin)">
          <g transform={`rotate(${tilt} 500 230)`}>
            <rect x={-200} y={230} width={1400} height={300} fill="#c98a4a" opacity={0.85} />
          </g>
        </g>
        <path d="M60 300 L150 70 Q500 10 850 70 L940 300 Z M500 30 V300 M300 44 L250 300 M700 44 L750 300" fill="none" stroke="#1a2232" strokeWidth={16} strokeLinejoin="round" />
        <rect x={20} y={300} width={960} height={190} rx={30} fill="#232a38" stroke="#0e121b" strokeWidth={6} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={70 + i * 145} y={330} width={120} height={90} rx={10} fill={T > B.coAttack && i % 2 === Math.floor(T * 4) % 2 ? "#5a1220" : "#0f2a1c"} stroke="#4a5568" strokeWidth={4} />
        ))}
        <rect x={430} y={440} width={140} height={320} fill="#1b202b" />
        <path d="M60 760 Q60 520 180 500 L330 500 Q400 520 400 760 Z" fill="#3b3f48" stroke="#14171d" strokeWidth={6} />
        <path d="M600 760 Q600 520 670 500 L820 500 Q940 520 940 760 Z" fill="#3b3f48" stroke="#14171d" strokeWidth={6} />
      </svg>
      <div style={{ position: "absolute", left: 105, top: 380, transform: `scale(${pop(frame, 30, B.captain)})` }}>
        <FaceCircle size={250} ring={hurt ? `rgba(255,59,74,${0.6 + 0.4 * hurt})` : GOLD} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 650, width: 330, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 32, color: "#fff", letterSpacing: 2, textShadow: "0 3px 8px #000" }}>
        CAPTAIN
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}><Tricolor w={70} h={10} /></div>
      </div>
      <div style={{ position: "absolute", left: 640, top: 400, opacity: clamp((T - B.coAttack + 0.6) * 3) }}>
        <svg width={250} height={240} viewBox="0 0 250 240">
          <circle cx={125} cy={80} r={62} fill="#2a0d12" stroke={RED} strokeWidth={6} />
          <path d="M20 240 Q20 150 125 150 Q230 150 230 240 Z" fill="#2a0d12" stroke={RED} strokeWidth={6} />
          <text x={125} y={104} textAnchor="middle" fontFamily={DISPLAY} fontSize={80} fill={RED}>?</text>
        </svg>
      </div>
      <div style={{ position: "absolute", left: 600, top: 650, width: 330, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 32, color: RED, letterSpacing: 2, textShadow: "0 3px 8px #000", opacity: clamp((T - B.coAttack + 0.6) * 3) }}>CO-PILOT</div>
      {knife > 0 && (
        <div style={{ position: "absolute", left: lerp(640, 360, knife), top: 470, fontSize: 120, transform: `rotate(${lerp(-20, -60, knife)}deg)`, filter: "drop-shadow(0 0 16px rgba(255,59,74,0.9))" }}>🔪</div>
      )}
      {knife >= 1 && T < B.injured + 3 && (
        <svg width={300} height={300} viewBox="0 0 300 300" style={{ position: "absolute", left: 80, top: 360, opacity: clamp(1 - (T - B.coAttack - 1.2) / 0.6) }}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 60 + 70 * clamp((T - B.coAttack - 0.35) / 0.4);
            return <line key={i} x1={150 + Math.cos(a) * 50} y1={150 + Math.sin(a) * 50} x2={150 + Math.cos(a) * r} y2={150 + Math.sin(a) * r} stroke={GOLD} strokeWidth={8} strokeLinecap="round" />;
          })}
        </svg>
      )}
    </div>
  );
};

const Door: React.FC<{ open: number }> = ({ open }) => (
  <div style={{ position: "relative", width: 520, height: 760, perspective: 1400 }}>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(255,240,200,${open}) 0%, rgba(255,210,120,${0.6 * open}) 40%, #0a0d14 75%)`, borderRadius: 16, border: "14px solid #2c3444" }} />
    <div style={{ position: "absolute", left: 14, top: 14, width: 492, height: 732, background: "linear-gradient(90deg, #5d6678, #3b4252)", border: "4px solid #1a1f29", borderRadius: 8, transformOrigin: "0% 50%", transform: `rotateY(${-100 * open}deg)` }}>
      <div style={{ position: "absolute", left: 156, top: 120, width: 180, height: 120, borderRadius: 10, background: "#1a2433", border: "4px solid #11161f" }} />
      <div style={{ position: "absolute", right: 40, top: 360, width: 60, height: 22, borderRadius: 11, background: "#c9ced8" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 30, color: "#e8ecf3", letterSpacing: 4 }}>COCKPIT</div>
      <div style={{ position: "absolute", left: 200, top: 420, width: 90, height: 60, borderRadius: 8, background: RED, boxShadow: `0 0 20px ${RED}` }} />
    </div>
  </div>
);

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.drop - 0.15], ["drop", B.drop - 0.15, B.but - 0.15], ["hero", B.but - 0.15, B.real - 0.15], ["real", B.real - 0.15, B.date - 0.15],
  ["route", B.date - 0.15, B.captain - 0.15], ["cockpit", B.captain - 0.15, B.sameTime - 0.15], ["dive", B.sameTime - 0.15, B.imagine - 0.15],
  ["imagine", B.imagine - 0.15, B.notBack - 0.15], ["door", B.notBack - 0.15, B.crew - 0.15], ["rush", B.crew - 0.15, B.twoPilots - 0.15],
  ["land", B.twoPilots - 0.15, B.all174 - 0.15], ["saved", B.all174 - 0.15, B.modi - 0.15], ["modi", B.modi - 0.15, B.hospital - 0.15],
  ["hospital", B.hospital - 0.15, B.think - 0.15], ["think", B.think - 0.15, B.name - 0.15], ["name", B.name - 0.15, 999],
];
const MAP_SCENES = ["route", "dive", "land"];

export const PilotScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const view = cameraAt(T);
  const { project: P, pxPerDeg } = makeSatProjector(view, W, H);
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const lit = SCENES.reduce((m, [n, a, b]) => Math.max(m, MAP_SCENES.includes(n) ? win(T, a, b, 0.5) : 0), 0);
  const plane = planeAt(T);
  const [px, py] = P(plane.p[0], plane.p[1]);
  const [dx, dy] = P(DXB[0], DXB[1]);
  const [tx, ty] = P(TLV[0], TLV[1]);
  const [bx, by] = P(TABUK[0], TABUK[1]);
  const [ix, iy] = P(INCIDENT[0], INCIDENT[1]);
  const k = clamp(pxPerDeg / 45, 0.8, 1.8);
  const dive = T > B.sameTime && T < B.imagine ? Math.sin(T * 30) * 5 * clamp((T - B.drop14 + 1) * 2) : 0;
  const alarm = T > B.coAttack && T < B.notBack ? 0.18 + 0.12 * Math.sin(T * 8) : 0;
  const routeOn = o("route") + o("dive") + o("land") > 0;

  return (
    <AbsoluteFill style={{ background: "#050a14", overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={W}
        height={H}
        darken={0.1}
        highlights={T > B.saudi - 0.5 && T < B.all174 ? [{ geom: countryGeom("SAU"), fill: "rgba(46,204,113,0.22)", stroke: GREEN, label: "SAUDI ARABIA", labelAt: [44, 24], labelSize: 34 }] : []}
      >
        {routeOn && (
          <>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <line x1={dx} y1={dy} x2={tx} y2={ty} stroke="#fff" strokeWidth={5} strokeDasharray="18 14" opacity={0.75 * clamp((T - B.dubai) * 2) * (T > B.control ? 0.4 : 1)} />
              {T > B.control && <line x1={ix} y1={iy} x2={bx} y2={by} stroke={GREEN} strokeWidth={7} strokeDasharray="18 12" pathLength={1} strokeDashoffset={0} opacity={0.9} />}
              {T > B.cockpit && T < B.all174 && <circle cx={ix} cy={iy} r={(40 + 20 * Math.sin(T * 6)) * k} fill="none" stroke={RED} strokeWidth={6} opacity={0.8} />}
            </svg>
            {([[dx, dy, "DUBAI", B.dubai], [tx, ty, "TEL AVIV", B.israel]] as [number, number, string, number][]).map(([x, y, label, t]) => (
              <div key={label} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp((T - t) * 3) }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: GOLD, border: "5px solid #fff" }} />
                <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 36, color: "#fff", textShadow: "0 2px 8px #000" }}>{label}</div>
              </div>
            ))}
            {T > B.saudi && (
              <div style={{ position: "absolute", left: bx, top: by, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp((T - B.tabuk + 0.4) * 3) }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: GREEN, border: "5px solid #fff", boxShadow: `0 0 26px ${GREEN}` }} />
                <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 40, color: "#fff", textShadow: "0 2px 8px #000" }}>TABUK</div>
              </div>
            )}
            {T > B.dubai && (
              <div style={{ position: "absolute", left: px + dive, top: py + dive * 0.5, transform: `translate(-50%,-50%) rotate(${(-plane.ang * 180) / Math.PI}deg)`, filter: T > B.cockpit && T < B.landed ? `drop-shadow(0 0 14px ${RED})` : "drop-shadow(0 0 10px rgba(255,255,255,0.6))" }}>
                <Plane size={70 * k} color={T > B.cockpit && T < B.landed ? "#ffd0d4" : "#fff"} />
              </div>
            )}
          </>
        )}
      </SatelliteMap>
      <AbsoluteFill style={{ background: `rgba(4,6,14,${0.66 * (1 - lit)})` }} />
      {alarm > 0 && <AbsoluteFill style={{ boxShadow: `inset 0 0 220px rgba(255,30,50,${alarm * 2.4})` }} />}
      {T < 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #0b1630 0%, #3a1630 60%, #7a1d1d 100%)", opacity: 0.85 }} />
          <Title text="మధ్య ఆకాశంలో…" t={0.05} top={330} size={110} frame={frame} fps={fps} />
          <Title text="పైలట్ ని కత్తితో పొడిచారు!" t={1.5} top={470} size={84} color={RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center", transform: `translateX(${lerp(-200, 120, T / 3.6)}px) rotate(${Math.sin(T * 20) * 2}deg)` }}>
            <SidePlane w={760} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1150, textAlign: "center", fontSize: 200, transform: `scale(${pop(frame, fps, 1.5, 8)}) rotate(-25deg)`, filter: `drop-shadow(0 0 30px ${RED})` }}>🔪</div>
        </AbsoluteFill>
      )}

      {o("drop") > 0 && (
        <AbsoluteFill style={{ opacity: o("drop") }}>
          <Title text="14 వేల అడుగులు" t={B.drop + 0.6} top={320} size={110} color={GOLD} frame={frame} fps={fps} />
          <Title text="కిందికి పడిపోయింది!" t={B.drop + 2.3} top={450} size={90} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center", transform: `translateY(${Easing.in(Easing.quad)(clamp((T - B.drop) / 3.6)) * 160}px) rotate(${lerp(0, 22, clamp((T - B.drop) / 1.5))}deg)` }}>
            <SidePlane w={560} />
          </div>
          <Altimeter T={T} t0={B.drop + 0.4} top={940} />
        </AbsoluteFill>
      )}

      {o("hero") > 0 && (
        <AbsoluteFill style={{ opacity: o("hero") }}>
          <Title text="కానీ ఆ పైలట్…" t={B.but} top={320} size={100} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.but + 0.6, 13) * lerp(1, 1.06, clamp((T - B.but) / 6))})` }}>
            <PhotoCard w={940} tilt={-2} />
          </div>
          {T > B.saved - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1040, textAlign: "center", transform: `scale(${pop(frame, fps, B.saved - 0.2)})` }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 210, lineHeight: 1, color: GOLD, textShadow: `0 10px 0 ${INK}, 0 0 40px rgba(255,210,63,0.6)` }}>{Math.min(174, Math.round(clamp((T - B.saved) / 1.4) * 174))}</span>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 80, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>మంది ప్రాణాలు కాపాడాడు!</div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("real") > 0 && (
        <AbsoluteFill style={{ opacity: o("real") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", transform: `scale(${pop(frame, fps, B.real)})` }}>
              <span style={{ fontSize: 300 }}>🎬</span>
              <svg width={360} height={360} viewBox="0 0 100 100" style={{ position: "absolute", left: -20, top: 0 }}>
                <line x1={10} y1={10} x2={90} y2={90} stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.real - 0.7) / 0.3)} />
              </svg>
            </div>
          </div>
          <Title text="సినిమా కథ కాదు!" t={B.real + 0.4} top={780} size={110} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1020, display: "flex", justifyContent: "center" }}>
            <Stamp text="నిజంగా జరిగిన ఘటన" p={pop(frame, fps, B.real + 1.6)} color={RED} size={90} />
          </div>
        </AbsoluteFill>
      )}

      {o("route") > 0 && (
        <AbsoluteFill style={{ opacity: o("route") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Chip text="📅 30 SEPTEMBER 2026" p={pop(frame, fps, B.date)} size={48} />
            <Chip text="FLYDUBAI · FZ1073" p={pop(frame, fps, B.fz)} size={56} bg="rgba(220,40,50,0.92)" border="#fff" />
            <Chip text="BOEING 737 MAX 8" p={pop(frame, fps, B.fz + 1.6)} size={36} />
          </div>
        </AbsoluteFill>
      )}

      {o("cockpit") > 0 && (
        <AbsoluteFill style={{ opacity: o("cockpit") }}>
          <AbsoluteFill style={{ background: "rgba(4,6,14,0.5)" }} />
          <Title text={T < B.coAttack ? "కెప్టెన్: స్మిత్ మచ్ఛర్" : T < B.cockpit ? "కో-పైలట్ దాడి!" : "కాక్‌పిట్ లోనే దాడి"} t={T < B.coAttack ? B.captain : T < B.cockpit ? B.coAttack : B.cockpit} top={320} size={T < B.coAttack ? 84 : 104} color={T < B.coAttack ? "#fff" : RED} frame={frame} fps={fps} />
          <Cockpit T={T} frame={frame} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", gap: 18 }}>
            {T < B.coAttack ? <Chip text="INDIAN · 13+ YEARS FLYING" p={pop(frame, fps, B.smit)} size={38} /> : T > B.injured - 0.2 && <Chip text="SERIOUSLY INJURED" p={pop(frame, fps, B.injured - 0.2)} size={44} bg={RED} border="#fff" />}
          </div>
        </AbsoluteFill>
      )}

      {o("dive") > 0 && (
        <AbsoluteFill style={{ opacity: o("dive") }}>
          <Title text="అదే సమయంలో…" t={B.sameTime} top={320} size={100} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1100, transform: "scale(0.82)" }}>
            <Altimeter T={T} t0={B.drop14 - 0.6} dur={2.4} top={0} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1450, display: "flex", justifyContent: "center" }}>
            <Chip text="IN UNDER 30 SECONDS" p={pop(frame, fps, B.drop14 + 1.8)} size={36} color={GOLD} />
          </div>
        </AbsoluteFill>
      )}

      {o("imagine") > 0 && (
        <AbsoluteFill style={{ opacity: o("imagine") }}>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(80,0,10,${0.25 + 0.15 * Math.sin(T * 7)}) 0%, rgba(0,0,0,0.6) 80%)` }} />
          <Title text="ఒక్కసారి ఊహించండి…" t={B.imagine} top={320} size={104} color={GOLD} frame={frame} fps={fps} />
          {([["✈️", "వేల అడుగుల ఎత్తు", B.high], ["🩸", "పైలట్ కి గాయాలు", B.hurt], ["🔪", "కాక్‌పిట్ లో దాడి", B.attack], ["👥", "174 మంది ప్రయాణికులు", B.pax]] as [string, string, number][]).map(([e, text, t], i) => {
            const p = pop(frame, fps, t);
            const beat = 1 + 0.03 * Math.sin((T - t) * 9) * clamp(p);
            return p > 0.01 ? (
              <div key={text} style={{ position: "absolute", left: 80, right: 80, top: 520 + i * 220, height: 180, display: "flex", alignItems: "center", gap: 30, padding: "0 36px", background: i === 3 ? "rgba(255,59,74,0.9)" : "rgba(10,14,26,0.88)", border: `5px solid ${i === 3 ? "#fff" : RED}`, borderRadius: 30, transform: `translateX(${(1 - p) * (i % 2 ? 900 : -900)}px) scale(${beat})`, boxShadow: "0 14px 34px rgba(0,0,0,0.6)" }}>
                <span style={{ fontSize: 100 }}>{e}</span>
                <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: i === 3 ? 58 : 70, color: "#fff", whiteSpace: "nowrap" }}>{text}</span>
              </div>
            ) : null;
          })}
        </AbsoluteFill>
      )}

      {o("door") > 0 && (
        <AbsoluteFill style={{ opacity: o("door") }}>
          <Title text="కానీ స్మిత్" t={B.notBack} top={300} size={100} frame={frame} fps={fps} />
          <Title text="వెనక్కి తగ్గలేదు!" t={B.notBack + 0.8} top={420} size={110} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center", transform: "scale(0.95)" }}>
            <Door open={ease(clamp((T - B.door + 0.3) / 0.8))} />
          </div>
          <div style={{ position: "absolute", left: 70, top: 1130, transform: `scale(${pop(frame, fps, B.injured2 - 0.2)})` }}>
            <FaceCircle size={260} ring={RED} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center" }}>
            <Chip text="కాక్‌పిట్ డోర్ తెరిచాడు 🚪" p={pop(frame, fps, B.door)} size={54} te bg="rgba(46,204,113,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("rush") > 0 && (
        <AbsoluteFill style={{ opacity: o("rush") }}>
          <Title text="ప్రయాణికులు + సిబ్బంది" t={B.crew + 0.4} top={320} size={88} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", transform: "scale(0.7)", transformOrigin: "50% 0%" }}>
            <Door open={1} />
          </div>
          {Array.from({ length: 9 }, (_, i) => {
            const st = B.crew + 0.6 + i * 0.3;
            const f = ease(clamp((T - st) / 1.8));
            const x = lerp(i % 2 ? 1180 : -160, 470 + ((i * 37) % 60) - 30, f);
            const y = lerp(1300 + (i % 3) * 40, 930, f);
            return T > st ? (
              <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${lerp(1.3, 0.55, f)})`, opacity: 1 - clamp((f - 0.85) * 6), filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.7))" }}>
                <Person size={110} color={i % 3 === 0 ? "#7fd1ff" : i % 3 === 1 ? GOLD : "#ffffff"} />
              </div>
            ) : null;
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center" }}>
            <Chip text="CO-PILOT OVERPOWERED ✓" p={pop(frame, fps, B.restrained)} size={46} bg="rgba(46,204,113,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("land") > 0 && (
        <AbsoluteFill style={{ opacity: o("land") }}>
          <Title text="మరో ఇద్దరు పైలట్లు" t={B.twoPilots} top={320} size={96} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 460, display: "flex", justifyContent: "center", gap: 24 }}>
            <Chip text="TOOK CONTROL 🕹️" p={pop(frame, fps, B.control)} size={42} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center" }}>
            <Chip text="SAFE LANDING · TABUK ✓" p={pop(frame, fps, B.landed)} size={50} bg="rgba(46,204,113,0.95)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("saved") > 0 && (
        <AbsoluteFill style={{ opacity: o("saved") }}>
          <AbsoluteFill style={{ background: "rgba(4,20,12,0.55)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", transform: `scale(${pop(frame, fps, B.all174)})` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 230, lineHeight: 1, color: GREEN, textShadow: `0 10px 0 ${INK}, 0 0 40px rgba(46,204,113,0.6)` }}>{Math.min(174, Math.round(clamp((T - B.all174) / 2.2) * 174))}</span>
          </div>
          <div style={{ position: "absolute", left: 90, right: 90, top: 600, display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {Array.from({ length: 174 }, (_, i) => {
              const on = (T - B.all174) / 2.2 > i / 174;
              return <div key={i} style={{ opacity: on ? 1 : 0.18, transform: `scale(${on ? 1 : 0.8})` }}><Person size={42} color={on ? GREEN : "#8893a6"} /></div>;
            })}
          </div>
          <Title text="మంది ప్రాణాలతో బయటపడ్డారు!" t={B.survived - 0.3} top={1290} size={74} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center" }}>
            <Chip text="INCLUDING 27 CHILDREN" p={pop(frame, fps, B.survived + 0.6)} size={34} color={GOLD} />
          </div>
        </AbsoluteFill>
      )}

      {o("modi") > 0 && (
        <AbsoluteFill style={{ opacity: o("modi") }}>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,153,51,0.35) 0%, rgba(10,10,20,0.6) 45%, rgba(19,136,8,0.35) 100%)" }} />
          <Title text="ప్రధాని నరేంద్ర మోదీ" t={B.modi + 0.6} top={320} size={92} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 80, right: 80, top: 520, background: "rgba(255,255,255,0.96)", borderRadius: 34, padding: "50px 50px 40px", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", transform: `scale(${pop(frame, fps, B.modi + 1.4, 13)})` }}>
            <div style={{ position: "absolute", left: 30, top: -70, fontFamily: DISPLAY, fontSize: 200, color: SAFFRON, lineHeight: 1 }}>“</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 84, lineHeight: 1.05, color: INK, textAlign: "center" }}>INDIA IS PROUD OF CAPTAIN MACHCHHAR</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}><Tricolor w={180} h={16} /></div>
            <div style={{ marginTop: 18, fontFamily: BODY, fontWeight: 800, fontSize: 32, color: "#55607a", textAlign: "center", letterSpacing: 2 }}>PM NARENDRA MODI · POST ON X</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1140, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.praised - 0.4)})` }}>
            <FaceCircle size={280} glow={0.7} />
          </div>
        </AbsoluteFill>
      )}

      {o("hospital") > 0 && (
        <AbsoluteFill style={{ opacity: o("hospital") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", transform: `scale(${lerp(1, 1.05, clamp((T - B.hospital) / 4))})` }}>
            <FaceCircle size={520} glow={0.5} />
          </div>
          <Title text="ఆసుపత్రిలో చికిత్స" t={B.hospital + 0.4} top={980} size={100} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
            <Chip text="🏥 CONDITION: STABLE" p={pop(frame, fps, B.hospital + 1.2)} size={46} bg="rgba(46,204,113,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("think") > 0 && (
        <AbsoluteFill style={{ opacity: o("think") }}>
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)" }} />
          <Title text="ఒక్కసారి ఆలోచించండి…" t={B.think} top={320} size={96} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.ownLife)})` }}>
              <div style={{ fontSize: 150 }}>💔</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 56, color: "#fff" }}>తన ప్రాణం</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 44, color: RED }}>ప్రమాదంలో</div>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 130, color: GOLD, opacity: clamp((T - B.hundreds + 0.3) * 3) }}>→</div>
            <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.hundreds)})` }}>
              <div style={{ fontSize: 150 }}>👨‍👩‍👧‍👦</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 56, color: "#fff" }}>వందల మంది</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 44, color: GREEN }}>ప్రాణాల కోసం</div>
            </div>
          </div>
          <Title text="పోరాడిన ఆ పైలట్ పేరు…" t={B.hundreds + 1.4} top={1080} size={86} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("name") > 0 && (
        <AbsoluteFill style={{ opacity: o("name") }}>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,210,63,0.35) 0%, rgba(5,8,18,0.9) 70%)" }} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + T * 0.15;
            return <div key={i} style={{ position: "absolute", left: 540, top: 700, width: 900, height: 26, background: "linear-gradient(90deg, rgba(255,210,63,0.35), rgba(255,210,63,0))", transformOrigin: "0% 50%", transform: `rotate(${(a * 180) / Math.PI}deg)` }} />;
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.name - 0.2, 12)})` }}>
            <PhotoCard w={960} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", transform: `scale(${pop(frame, fps, B.captainName)})` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 92, lineHeight: 1, color: "#fff", textShadow: `0 8px 0 ${INK}` }}>CAPTAIN</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 124, lineHeight: 1.05, color: GOLD, textShadow: `0 8px 0 ${INK}, 0 0 40px rgba(255,210,63,0.6)` }}>SMIT MACHCHHAR</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}><Tricolor w={220} h={14} /></div>
          </div>
          {T < B.cta && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center" }}>
              <Chip text="REAL HERO 🫡" p={pop(frame, fps, B.captainName + 1)} size={54} color={GOLD} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.3)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1200} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const PilotHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.24], [1.5, "whoosh", 0.2], [B.drop, "boom", 0.22], [B.drop + 2.3, "pop", 0.16], [B.but, "whoosh", 0.18], [B.saved, "ding", 0.22],
    [B.real, "pop", 0.18], [B.real + 1.6, "boom", 0.2], [B.date, "whoosh", 0.2], [B.fz, "pop", 0.18], [B.captain, "whoosh", 0.18], [B.coAttack, "boom", 0.26],
    [B.injured - 0.2, "pop", 0.18], [B.sameTime, "whoosh", 0.2], [B.drop14, "boom", 0.22], [B.imagine, "whoosh", 0.16], [B.high, "pop", 0.18],
    [B.hurt, "pop", 0.18], [B.attack, "pop", 0.18], [B.pax, "boom", 0.18], [B.notBack, "whoosh", 0.2], [B.door, "boom", 0.2], [B.crew, "whoosh", 0.16],
    [B.restrained, "ding", 0.2], [B.twoPilots, "whoosh", 0.18], [B.control, "pop", 0.18], [B.landed, "ding", 0.24], [B.all174, "whoosh", 0.18],
    [B.survived, "ding", 0.22], [B.modi + 1.4, "pop", 0.2], [B.hospital, "whoosh", 0.16], [B.think, "whoosh", 0.16], [B.ownLife, "pop", 0.16],
    [B.hundreds, "pop", 0.16], [B.name - 0.2, "boom", 0.22], [B.captainName, "ding", 0.26],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("pilot/voice.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <PilotScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const PilotThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#050a14", overflow: "hidden" }}>
    <SatelliteMap view={{ lon: 44, lat: 28.5, span: 30 }} width={W} height={H} darken={0.25} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(8,10,25,0.92) 0%, rgba(90,10,20,0.55) 45%, rgba(8,10,25,0.95) 100%)" }} />
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return <div key={i} style={{ position: "absolute", left: 540, top: 700, width: 1100, height: 34, background: "linear-gradient(90deg, rgba(255,210,63,0.28), rgba(255,210,63,0))", transformOrigin: "0% 50%", transform: `rotate(${(a * 180) / Math.PI}deg)` }} />;
    })}
    <div style={{ position: "absolute", left: 30, right: 30, top: 300, textAlign: "center", lineHeight: 1.05 }}>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 92, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>కత్తితో పొడిచినా…</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 450, display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative" }}>
        <PhotoCard w={1000} tilt={-2.5} />
        <div style={{ position: "absolute", left: -10, bottom: -34, transform: "rotate(-2.5deg)" }}>
          <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 42, letterSpacing: 3, color: "#fff", background: RED, padding: "10px 26px", borderRadius: 12, border: "4px solid #fff", boxShadow: "0 10px 24px rgba(0,0,0,0.6)" }}>🔴 STABBED IN COCKPIT</span>
        </div>
        <div style={{ position: "absolute", right: -6, top: -40, width: 210, height: 210, borderRadius: "50%", background: `radial-gradient(circle, #ffe680 0%, ${GOLD} 55%, #c9971a 100%)`, border: `8px solid ${INK}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(12deg)", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 60, lineHeight: 0.95, color: INK }}>REAL</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 60, lineHeight: 0.95, color: INK }}>HERO</div>
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", left: 30, right: 30, top: 1010, textAlign: "center", lineHeight: 1 }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 230, color: GOLD, WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: `0 12px 0 ${INK}, 0 0 50px rgba(255,210,63,0.5)` }}>174</span>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 88, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}`, marginTop: -10 }}>ప్రాణాలు కాపాడాడు!</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1370, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 2, color: "#fff", background: "rgba(0,0,0,0.85)", padding: "10px 24px", borderRadius: 999, border: `3px solid ${RED}` }}>▼ −14,000 FT</span>
      <Tricolor w={90} h={14} />
      <span style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 2, color: GOLD, background: "rgba(0,0,0,0.85)", padding: "10px 24px", borderRadius: 999, border: `3px solid ${GOLD}` }}>CAPT. SMIT</span>
    </div>
  </AbsoluteFill>
);
