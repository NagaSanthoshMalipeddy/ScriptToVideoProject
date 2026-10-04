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
const KHADI = "#f4ead5";
const INK = "#1a1408";
const W = 1080;
const H = 1920;

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  closed: 1.6, link: 4.88, every: 9.16, shops: 11.2, dry: 13.98, means: 16.25, noPerm: 16.96, delhi: 19.73, haryana: 20.6, goa: 21.6,
  gj: 23.7, but: 26.06, against: 28.5, alcohol: 31.71, family: 32.7, society: 33.6, so: 36.22, birthday: 37.4, stopSale: 39.2, memory: 41.11,
  twist: 45.42, home: 48.13, illegal: 50.3, rules: 52.18, someShops: 54.22, so2: 57.36, oct2: 58.3, reason: 60.6, notHoliday: 62.76,
  ideas: 65.63, dryLast: 69.6, voiceEnd: 71.84, cta: 72.2,
};
export const DRYDAY_SECONDS = 77.5;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const DELHI: Pt = [77.21, 28.61];
const HARYANA: Pt = [76.3, 29.6];
const GOA: Pt = [74.0, 15.35];
const V = {
  india: { lon: 80, lat: 22.5, span: 34 },
  west: { lon: 76.5, lat: 22.5, span: 24 },
} satisfies Record<string, SatView>;
const KEYS: [number, SatView][] = [[0, V.india], [B.delhi - 0.3, V.west], [B.but, V.india], [DRYDAY_SECONDS + 2, V.india]];
const cameraAt = (T: number): SatView => {
  let k = 0;
  while (k < KEYS.length - 1 && T >= KEYS[k + 1][0]) k++;
  if (k === 0) return KEYS[0][1];
  const a = KEYS[k - 1][1];
  const [t0, b] = KEYS[k];
  const p = ease(clamp((T - t0) / 1.6));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

// ---- art -------------------------------------------------------------------------------------
const Glasses: React.FC<{ w: number; color?: string; glow?: number }> = ({ w, color = "#1a1408", glow = 0 }) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 240 100" style={{ overflow: "visible", filter: glow ? `drop-shadow(0 0 ${24 * glow}px rgba(255,210,63,${glow}))` : undefined }}>
    <circle cx={70} cy={55} r={38} fill="rgba(255,255,255,0.18)" stroke={color} strokeWidth={8} />
    <circle cx={170} cy={55} r={38} fill="rgba(255,255,255,0.18)" stroke={color} strokeWidth={8} />
    <path d="M108 50 Q120 38 132 50" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
    <path d="M32 50 L4 40 M208 50 L236 40" stroke={color} strokeWidth={7} strokeLinecap="round" />
  </svg>
);

const Charkha: React.FC<{ size: number; spin: number }> = ({ size, spin }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <g transform={`rotate(${spin} 100 90)`}>
      <circle cx={100} cy={90} r={70} fill="none" stroke="#8a5a2b" strokeWidth={8} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <line key={i} x1={100} y1={90} x2={100 + Math.cos(a) * 70} y2={90 + Math.sin(a) * 70} stroke="#8a5a2b" strokeWidth={5} />;
      })}
      <circle cx={100} cy={90} r={10} fill="#5b3a1a" />
    </g>
    <path d="M40 190 L100 90 L160 190" fill="none" stroke="#5b3a1a" strokeWidth={9} strokeLinecap="round" />
    <line x1={20} y1={190} x2={180} y2={190} stroke="#5b3a1a" strokeWidth={10} strokeLinecap="round" />
  </svg>
);

const Bottle: React.FC<{ h: number; color?: string }> = ({ h, color = "#2f7d4a" }) => (
  <svg width={h * 0.4} height={h} viewBox="0 0 40 100">
    <path d="M15 2 H25 V24 Q36 32 36 46 V94 Q36 98 32 98 H8 Q4 98 4 94 V46 Q4 32 15 24 Z" fill={color} stroke="#0d1a12" strokeWidth={2.5} />
    <rect x={8} y={54} width={24} height={22} rx={3} fill={KHADI} />
    <rect x={14} y={0} width={12} height={6} fill="#c9a24a" />
  </svg>
);

const NoSign: React.FC<{ size: number; p?: number }> = ({ size, p = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, margin: "auto" }}>
    <circle cx={50} cy={50} r={44} fill="none" stroke={RED} strokeWidth={9} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    <line x1={19} y1={19} x2={81} y2={81} stroke={RED} strokeWidth={9} strokeLinecap="round" opacity={clamp(p * 2 - 1)} />
  </svg>
);

const Calendar: React.FC<{ w: number; day?: string; month?: string }> = ({ w, day = "2", month = "OCT" }) => (
  <div style={{ width: w, background: "#fff", borderRadius: w * 0.1, overflow: "hidden", border: `${w * 0.035}px solid ${INK}`, boxShadow: `0 ${w * 0.05}px 0 ${INK}`, textAlign: "center" }}>
    <div style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: w * 0.2, padding: `${w * 0.03}px 0`, letterSpacing: w * 0.02 }}>{month}</div>
    <div style={{ fontFamily: DISPLAY, fontSize: w * 0.62, lineHeight: 1.05, color: INK }}>{day}</div>
  </div>
);

// Storefront whose shutter rolls down (shut 0→1).
const Shop: React.FC<{ w: number; shut: number; sign?: number }> = ({ w, shut, sign = 0 }) => {
  const h = w * 0.95;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 400 380" style={{ position: "absolute", inset: 0 }}>
        <rect x={10} y={20} width={380} height={350} rx={10} fill="#5a4636" stroke={INK} strokeWidth={8} />
        <rect x={30} y={40} width={340} height={56} rx={8} fill="#1d3a5c" stroke={INK} strokeWidth={5} />
        <text x={200} y={82} textAnchor="middle" fontFamily={DISPLAY} fontSize={40} fill={GOLD}>WINE SHOP</text>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${20 + i * 45} 100 h45 v28 q-22 14 -45 0 Z`} fill={i % 2 ? "#fff" : RED} stroke={INK} strokeWidth={3} />)}
        <rect x={40} y={140} width={320} height={220} fill="#2a1f17" />
        {[0, 1, 2].map((r) => [0, 1, 2, 3, 4, 5].map((c) => <rect key={`${r}${c}`} x={58 + c * 50} y={156 + r * 66} width={22} height={52} rx={6} fill={["#2f7d4a", "#7a2b2b", "#c9a24a"][(r + c) % 3]} />))}
        <g>
          <rect x={40} y={140} width={320} height={220 * shut} fill="#9aa3ad" />
          {Array.from({ length: Math.floor(22 * shut) }, (_, i) => <line key={i} x1={40} y1={150 + i * 10} x2={360} y2={150 + i * 10} stroke="#6f7881" strokeWidth={3} />)}
          {shut > 0.05 && <rect x={40} y={140 + 220 * shut - 12} width={320} height={12} fill="#5c636b" />}
        </g>
      </svg>
      {sign > 0 && (
        <div style={{ position: "absolute", left: w * 0.24, top: h * 0.5, width: w * 0.52, transformOrigin: "50% -40%", transform: `rotate(${Math.sin(sign * 12) * 10 * (1 - clamp(sign))}deg) scale(${clamp(sign * 2)})`, background: RED, border: `${w * 0.015}px solid #fff`, borderRadius: w * 0.03, textAlign: "center", fontFamily: DISPLAY, fontSize: w * 0.13, color: "#fff", boxShadow: "0 10px 24px rgba(0,0,0,0.5)" }}>CLOSED</div>
      )}
    </div>
  );
};

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

const Stamp: React.FC<{ text: string; p: number; color: string; size?: number; tilt?: number; te?: boolean }> = ({ text, p, color, size = 96, tilt = -7, te = false }) => (
  <div style={{ display: "inline-block", fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.1, color, border: `12px solid ${color}`, borderRadius: 20, padding: "6px 40px", background: "rgba(0,0,0,0.65)", transform: `rotate(${tilt}deg) scale(${2 - p})`, opacity: clamp(p * 1.5), textAlign: "center", whiteSpace: "pre-line" }}>{text}</div>
);

const Card: React.FC<{ children: React.ReactNode; w: number; p: number; bg?: string; tilt?: number }> = ({ children, w, p, bg = KHADI, tilt = 0 }) => (
  <div style={{ width: w, padding: 26, borderRadius: 34, background: bg, border: `7px solid ${INK}`, boxShadow: `0 12px 0 ${INK}, 0 24px 50px rgba(0,0,0,0.5)`, transform: `scale(${p}) rotate(${tilt}deg)`, opacity: clamp(p * 2), display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>{children}</div>
);

const Pin: React.FC<{ x: number; y: number; label: string; o: number }> = ({ x, y, label, o }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${o})`, display: "flex", flexDirection: "column", alignItems: "center", opacity: clamp(o * 2) }}>
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: RED, border: "5px solid #fff", boxShadow: `0 0 20px ${RED}` }} />
    <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 40, color: "#fff", textShadow: "0 2px 8px #000", whiteSpace: "nowrap" }}>{label}</div>
  </div>
);

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.link - 0.15], ["link", B.link - 0.15, B.every - 0.15], ["dry", B.every - 0.15, B.delhi - 0.15], ["states", B.delhi - 0.15, B.but - 0.15],
  ["reason", B.but - 0.15, B.so - 0.15], ["birthday", B.so - 0.15, B.twist - 0.15], ["twist", B.twist - 0.15, B.so2 - 0.15], ["so", B.so2 - 0.15, B.notHoliday - 0.15],
  ["end", B.notHoliday - 0.15, 999],
];
const MAP_SCENES = ["dry", "states"];
// Scattered shop markers across India for the "many states" beat.
const SHOPS: Pt[] = [[77.2, 28.6], [72.9, 19.1], [88.4, 22.6], [80.3, 13.1], [77.6, 13.0], [78.5, 17.4], [75.8, 26.9], [80.9, 26.8], [85.1, 25.6], [73.9, 15.4], [76.3, 9.9], [91.7, 26.1], [81.6, 21.3], [85.8, 20.3], [75.3, 31.6], [83.0, 25.3]];

export const DryDayScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const view = cameraAt(T);
  const { project: P } = makeSatProjector(view, W, H);
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const lit = SCENES.reduce((m, [n, a, b]) => Math.max(m, MAP_SCENES.includes(n) ? win(T, a, b, 0.5) : 0), 0);

  return (
    <AbsoluteFill style={{ background: "#0b0a10", overflow: "hidden" }}>
      <SatelliteMap view={view} width={W} height={H} darken={0.1} highlights={lit > 0 ? [{ geom: countryGeom("IND"), fill: "rgba(255,153,51,0.22)", stroke: SAFFRON }] : []}>
        {o("dry") > 0 &&
          SHOPS.map((p, i) => {
            const [x, y] = P(p[0], p[1]);
            const s = pop(frame, fps, B.shops - 0.6 + i * 0.12, 12);
            return s > 0.01 ? (
              <div key={i} style={{ position: "absolute", left: x, top: y, width: 70, height: 70, transform: `translate(-50%,-50%) scale(${s})`, opacity: o("dry") }}>
                <div style={{ position: "absolute", inset: 8, display: "flex", justifyContent: "center" }}><Bottle h={54} /></div>
                <NoSign size={70} p={clamp((T - B.dry + 0.6 - i * 0.03) * 2)} />
              </div>
            ) : null;
          })}
        {o("states") > 0 &&
          ([[DELHI, "DELHI", B.delhi], [HARYANA, "HARYANA", B.haryana], [GOA, "GOA", B.goa]] as [Pt, string, number][]).map(([p, label, t]) => {
            const [x, y] = P(p[0], p[1]);
            const off = label === "HARYANA" ? -70 : 0;
            return <Pin key={label} x={x} y={y + off} label={label} o={pop(frame, fps, t) * o("states")} />;
          })}
      </SatelliteMap>
      <AbsoluteFill style={{ background: `rgba(14,10,4,${0.7 * (1 - lit)})` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      {T < 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <Title text="ఏంటి?!" t={0.05} top={320} size={150} color={GOLD} frame={frame} fps={fps} />
          <Title text="అక్టోబర్ 2న వైన్ షాపులు క్లోజ్?!" t={1.0} top={500} size={72} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, 0.4, 13)})` }}>
            <Shop w={640} shut={Easing.bounce(clamp((T - B.closed) / 0.7))} sign={clamp((T - B.closed - 0.7) / 0.9)} />
          </div>
          <div style={{ position: "absolute", left: 760, top: 1220, transform: `rotate(8deg) scale(${pop(frame, fps, 2.6)})` }}>
            <Calendar w={230} />
          </div>
        </AbsoluteFill>
      )}

      {o("link") > 0 && (
        <AbsoluteFill style={{ opacity: o("link") }}>
          <Title text="గాంధీ జయంతి కి" t={B.link} top={320} size={92} frame={frame} fps={fps} />
          <Title text="వైన్ షాపులకి సంబంధం?" t={B.link + 1.2} top={440} size={86} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 60, top: 700 }}>
            <Card w={400} p={pop(frame, fps, B.link + 0.3)} tilt={-4}>
              <Glasses w={300} />
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 50, color: INK, whiteSpace: "nowrap" }}>గాంధీ జయంతి</div>
              <Calendar w={150} />
            </Card>
          </div>
          <div style={{ position: "absolute", right: 60, top: 760 }}>
            <Card w={360} p={pop(frame, fps, B.link + 1.4)} tilt={4} bg="#e9f1ff">
              <div style={{ display: "flex", gap: 10 }}><Bottle h={170} /><Bottle h={170} color="#7a2b2b" /></div>
              <div style={{ fontFamily: DISPLAY, fontSize: 56, color: INK }}>WINE SHOP</div>
            </Card>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", fontFamily: DISPLAY, fontSize: 260, color: RED, textShadow: `0 12px 0 ${INK}`, transform: `scale(${pop(frame, fps, B.link + 2.2, 8) * (1 + 0.06 * Math.sin(T * 8))})` }}>?</div>
        </AbsoluteFill>
      )}

      {o("dry") > 0 && (
        <AbsoluteFill style={{ opacity: o("dry") }}>
          <Title text="ప్రతి సంవత్సరం" t={B.every} top={300} size={84} frame={frame} fps={fps} />
          <Title text="అక్టోబర్ 2న షాపులు బంద్" t={B.every + 1.2} top={410} size={80} color={GOLD} frame={frame} fps={fps} />
          {T > B.dry - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center" }}>
              <Stamp text="DRY DAY" p={pop(frame, fps, B.dry - 0.2)} color={RED} size={150} />
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1460, display: "flex", justifyContent: "center" }}>
            <Chip text="🚫 లిక్కర్ అమ్మకానికి పర్మిషన్ లేదు" p={pop(frame, fps, B.noPerm)} size={46} te bg="rgba(0,0,0,0.85)" border={RED} />
          </div>
        </AbsoluteFill>
      )}

      {o("states") > 0 && (
        <AbsoluteFill style={{ opacity: o("states") }}>
          <Title text="ఢిల్లీ · హర్యానా · గోవా" t={B.delhi} top={310} size={84} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", alignItems: "center", gap: 20 }}>
            <Chip text="GANDHI JAYANTI = DRY DAY" p={pop(frame, fps, B.gj)} size={46} bg={RED} border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("reason") > 0 && (
        <AbsoluteFill style={{ opacity: o("reason") }}>
          <Title text="అసలు కారణం?" t={B.but} top={310} size={110} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
            <Card w={820} p={pop(frame, fps, B.but + 0.8, 13)}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <Charkha size={200} spin={T * 40} />
                <Glasses w={330} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 64, color: INK, letterSpacing: 2 }}>MAHATMA GANDHI</div>
              {T > B.against - 0.3 && (
                <div style={{ display: "flex", alignItems: "center", gap: 26, transform: `scale(${pop(frame, fps, B.against - 0.3)})` }}>
                  <div style={{ position: "relative", width: 130, height: 130, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Bottle h={110} />
                    <NoSign size={130} p={clamp((T - B.against) * 2)} />
                  </div>
                  <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 60, color: RED }}>మద్యపానానికి వ్యతిరేకం</span>
                </div>
              )}
            </Card>
          </div>
          {T > B.alcohol - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 50 }}>
              <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.family - 0.3)})` }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                  <Person size={70} color="#fff" /><Person size={60} color={GOLD} /><Person size={44} color="#7fd1ff" />
                </div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 52, color: "#fff", textShadow: "0 3px 10px #000" }}>కుటుంబాలు</div>
              </div>
              <div style={{ fontSize: 120, transform: `scale(${pop(frame, fps, B.alcohol)})` }}>💔</div>
              <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.society - 0.2)})` }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
                  {Array.from({ length: 5 }, (_, i) => <Person key={i} size={44} color={i % 2 ? "#cfd6e2" : "#fff"} />)}
                </div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 52, color: "#fff", textShadow: "0 3px 10px #000" }}>సమాజం</div>
              </div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("birthday") > 0 && (
        <AbsoluteFill style={{ opacity: o("birthday") }}>
          <Title text="ఆయన పుట్టిన రోజు" t={B.so + 0.3} top={310} size={100} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: 50 }}>
            <div style={{ transform: `rotate(-6deg) scale(${pop(frame, fps, B.birthday - 0.3)})` }}>
              <Calendar w={330} />
            </div>
            <div style={{ transform: `scale(${pop(frame, fps, B.birthday + 0.3)})`, textAlign: "left" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 96, lineHeight: 1, color: GOLD, textShadow: `0 6px 0 ${INK}` }}>1869</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 3, color: "#fff" }}>PORBANDAR</div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 950, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", transform: `scale(${pop(frame, fps, B.stopSale - 0.3)})` }}>
              <Shop w={380} shut={clamp((T - B.stopSale) / 0.8)} sign={clamp((T - B.stopSale - 0.8) / 0.9)} />
            </div>
          </div>
          <Title text="గాంధీ ఆలోచనలకు గుర్తుగా 🕊️" t={B.memory} top={1340} size={76} color={GOLD} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("twist") > 0 && (
        <AbsoluteFill style={{ opacity: o("twist") }}>
          <Title text={"ఇంట్రెస్టింగ్\nట్విస్ట్! 🌀"} t={B.twist} top={300} size={100} color={GOLD} frame={frame} fps={fps} />
          {T > B.home - 0.2 && (
            <div style={{ position: "absolute", left: 60, right: 60, top: 600, display: "flex", alignItems: "center", gap: 30, padding: "26px 36px", background: "rgba(10,12,20,0.88)", border: `5px solid ${GREEN}`, borderRadius: 30, transform: `translateX(${(1 - pop(frame, fps, B.home - 0.2)) * -900}px)` }}>
              <span style={{ fontSize: 120 }}>🏠</span>
              <div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 58, color: "#fff" }}>ఇంట్లో తాగడం</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 64, color: GREEN, opacity: clamp((T - B.illegal) * 3) }}>ILLEGAL కాదు</div>
              </div>
            </div>
          )}
          {T > B.rules - 0.2 && (
            <div style={{ position: "absolute", left: 60, right: 60, top: 870, display: "flex", alignItems: "center", gap: 30, padding: "26px 36px", background: "rgba(10,12,20,0.88)", border: `5px solid ${GOLD}`, borderRadius: 30, transform: `translateX(${(1 - pop(frame, fps, B.rules - 0.2)) * 900}px)` }}>
              <span style={{ fontSize: 120 }}>📜</span>
              <div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 58, color: "#fff" }}>రూల్స్ మారతాయి</div>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38, color: GOLD, letterSpacing: 2 }}>STATE BY STATE</div>
              </div>
            </div>
          )}
          {T > B.someShops - 0.2 && (
            <div style={{ position: "absolute", left: 60, right: 60, top: 1140, display: "flex", alignItems: "center", gap: 30, padding: "26px 36px", background: "rgba(10,12,20,0.88)", border: `5px solid ${RED}`, borderRadius: 30, transform: `translateX(${(1 - pop(frame, fps, B.someShops - 0.2)) * -900}px)` }}>
              <span style={{ position: "relative", width: 120, height: 120, display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: 90 }}>
                🏪
                <NoSign size={120} p={clamp((T - B.someShops - 0.4) * 2)} />
              </span>
              <div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 58, color: "#fff" }}>షాపుల్లో అమ్మకం</div>
                <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 50, color: RED }}>మాత్రమే బంద్</div>
              </div>
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1410, display: "flex", justifyContent: "center" }}>
            <Chip text="GUJARAT & BIHAR: BANNED ALL YEAR" p={pop(frame, fps, B.someShops + 1.4)} size={32} color={GOLD} />
          </div>
        </AbsoluteFill>
      )}

      {o("so") > 0 && (
        <AbsoluteFill style={{ opacity: o("so") }}>
          <Title text="అక్టోబర్ 2న షాప్ మూసి ఉంటే…" t={B.so2} top={310} size={72} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
            <Shop w={600} shut={1} sign={clamp((T - B.oct2) / 0.9)} />
          </div>
          <div style={{ position: "absolute", left: 90, top: 1000, transform: `rotate(-8deg) scale(${pop(frame, fps, B.oct2)})` }}>
            <Calendar w={200} />
          </div>
          <Title text="కారణం ఇదే! ✅" t={B.reason} top={1220} size={110} color={GOLD} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("end") > 0 && (
        <AbsoluteFill style={{ opacity: o("end") }}>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(255,153,51,0.3) 0%, rgba(10,8,4,0.55) 45%, rgba(19,136,8,0.3) 100%)" }} />
          <Title text="కేవలం హాలిడే కాదు…" t={B.notHoliday} top={310} size={96} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.notHoliday + 0.6, 13) * lerp(1, 1.06, clamp((T - B.notHoliday) / 8))})` }}>
            <Card w={820} p={1}>
              <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
                <Charkha size={180} spin={T * 30} />
                <Glasses w={320} glow={0.6} />
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 60, color: INK, letterSpacing: 2 }}>GANDHI JAYANTI</div>
              <Tricolor w={240} h={14} />
            </Card>
          </div>
          <Title text={"గాంధీ ఆలోచనలకు\nగుర్తు 🕊️"} t={B.ideas + 1.2} top={1130} size={92} color={GOLD} frame={frame} fps={fps} />
          {T < B.cta && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center" }}>
              <Chip text="DRY DAY · 2 OCTOBER" p={pop(frame, fps, B.dryLast)} size={40} bg={RED} border="#fff" />
            </div>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1200} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const GandhiDryDay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.22], [1.0, "whoosh", 0.16], [B.closed + 0.1, "boom", 0.2], [2.6, "pop", 0.18], [B.link, "whoosh", 0.18], [B.link + 0.3, "pop", 0.16],
    [B.link + 1.4, "pop", 0.16], [B.link + 2.2, "boom", 0.18], [B.every, "whoosh", 0.18], [B.shops, "pop", 0.14], [B.dry - 0.2, "boom", 0.24],
    [B.noPerm, "pop", 0.18], [B.delhi, "pop", 0.18], [B.haryana, "pop", 0.18], [B.goa, "pop", 0.18], [B.gj, "ding", 0.2], [B.but, "whoosh", 0.18],
    [B.against, "pop", 0.18], [B.alcohol, "pop", 0.16], [B.so, "whoosh", 0.18], [B.birthday, "ding", 0.2], [B.stopSale, "pop", 0.18], [B.memory, "ding", 0.18],
    [B.twist, "boom", 0.22], [B.home, "whoosh", 0.16], [B.rules, "whoosh", 0.16], [B.someShops, "whoosh", 0.16], [B.so2, "whoosh", 0.18],
    [B.reason, "ding", 0.22], [B.notHoliday, "whoosh", 0.18], [B.ideas + 1.2, "ding", 0.22],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("dryday/voice.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <DryDayScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const GandhiDryDayThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#0b0a10", overflow: "hidden" }}>
    <SatelliteMap view={V.india} width={W} height={H} darken={0.3} highlights={[{ geom: countryGeom("IND"), fill: "rgba(255,153,51,0.2)", stroke: SAFFRON }]} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(20,10,0,0.9) 0%, rgba(60,20,0,0.35) 45%, rgba(10,8,4,0.92) 100%)" }} />
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return <div key={i} style={{ position: "absolute", left: 540, top: 980, width: 1100, height: 30, background: "linear-gradient(90deg, rgba(255,153,51,0.3), rgba(255,153,51,0))", transformOrigin: "0% 50%", transform: `rotate(${(a * 180) / Math.PI}deg)` }} />;
    })}
    <div style={{ position: "absolute", left: 30, right: 30, top: 300, textAlign: "center", lineHeight: 1.05 }}>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 104, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>అక్టోబర్ 2న</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 104, color: GOLD, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>వైన్ షాపులు</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 104, color: RED, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}` }}>ఎందుకు బంద్?</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
      <Shop w={440} shut={0.82} sign={1} />
    </div>
    <div style={{ position: "absolute", left: 700, top: 650, transform: "rotate(10deg)" }}>
      <Calendar w={150} />
    </div>
    <div style={{ position: "absolute", left: 14, top: 690, transform: "rotate(-5deg)", filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.6))" }}>
      <div style={{ width: 330, height: 420, background: KHADI, padding: 14, border: `7px solid ${INK}`, borderRadius: 18 }}>
        <Img src={staticFile("dryday/gandhi.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 18%", borderRadius: 8, filter: "sepia(0.25) contrast(1.08)" }} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 770, top: 760, display: "flex", alignItems: "flex-end", gap: 8, transform: "rotate(6deg)", filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.6))" }}>
      <Bottle h={400} />
      <Bottle h={330} color="#7a2b2b" />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 104, color: "#fff", background: RED, border: "10px solid #fff", borderRadius: 24, padding: "0 40px", transform: "rotate(-4deg)", boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>DRY DAY 🚫</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1350, display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: "rgba(10,8,4,0.9)", border: `5px solid ${GOLD}`, borderRadius: 999, padding: "6px 36px", boxShadow: "0 12px 30px rgba(0,0,0,0.6)" }}>
        <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 64, color: "#fff" }}>గాంధీ</span>
        <span style={{ fontFamily: DISPLAY, fontSize: 80, lineHeight: 1, color: RED }}>?</span>
        <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 64, color: "#fff" }}>వైన్ షాప్</span>
        <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 58, color: INK, background: GOLD, borderRadius: 16, padding: "0 18px" }}>లింక్ ఏంటి?</span>
      </div>
    </div>
  </AbsoluteFill>
);
