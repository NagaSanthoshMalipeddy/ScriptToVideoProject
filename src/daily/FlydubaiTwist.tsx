import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { countryGeom, makeSatProjector, SatelliteMap, type SatView } from "../geo/SatelliteMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Chip, Door, Plane, Stamp, Title, Tricolor } from "./PilotHero";

type Pt = [number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const GOLD = "#ffd23f";
const RED = "#ff3b4a";
const GREEN = "#2ecc71";
const INK = "#0d1220";
const MANILA = "#e8c98a";
const W = 1080;
const H = 1920;

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  captain: 5.48, name: 10.1, omani: 11.59, date: 15.65, attack: 21.55, dive: 24.0, injured: 27.08, door: 29.5, crew: 31.72, land: 34.39,
  reveal: 38.78, y2024: 42.15, omanAir: 44.0, risk: 45.3, suspended: 47.42, extremist: 50.45, admin: 53.83, joined: 56.92, probe: 59.82,
  terror: 61.5, crash: 64.09, angles: 66.68, motive: 68.75, pax: 70.95, shock: 76.17, voiceEnd: 78.55, cta: 78.9,
};
export const TWIST_SECONDS = 84.5;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const DXB: Pt = [55.36, 25.25];
const TLV: Pt = [34.89, 32.01];
const TABUK: Pt = [36.62, 28.37];
const INCIDENT: Pt = [lerp(DXB[0], TLV[0], 0.8), lerp(DXB[1], TLV[1], 0.8)];
const V = {
  wide: { lon: 45, lat: 28.5, span: 34 },
  incident: { lon: 40.5, lat: 29.8, span: 14 },
  tabuk: { lon: 37.6, lat: 29.0, span: 9 },
} satisfies Record<string, SatView>;
const KEYS: [number, SatView][] = [[0, V.wide], [B.attack - 0.2, V.incident], [B.land - 0.2, V.tabuk], [B.reveal, V.wide], [TWIST_SECONDS + 2, V.wide]];
const cameraAt = (T: number): SatView => {
  let k = 0;
  while (k < KEYS.length - 1 && T >= KEYS[k + 1][0]) k++;
  if (k === 0) return KEYS[0][1];
  const a = KEYS[k - 1][1];
  const [t0, b] = KEYS[k];
  const p = ease(clamp((T - t0) / 1.8));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};
const planeAt = (T: number): { p: Pt; ang: number } => {
  if (T < B.land) {
    const f = lerp(0.12, 0.8, ease(clamp((T - B.date) / (B.attack - B.date))));
    return { p: [lerp(DXB[0], TLV[0], f), lerp(DXB[1], TLV[1], f)], ang: Math.atan2(TLV[1] - DXB[1], TLV[0] - DXB[0]) };
  }
  const f = ease(clamp((T - B.land) / 3));
  return { p: [lerp(INCIDENT[0], TABUK[0], f), lerp(INCIDENT[1], TABUK[1], f)], ang: Math.atan2(TABUK[1] - INCIDENT[1], TABUK[0] - INCIDENT[0]) };
};

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

// ---- art -------------------------------------------------------------------------------------
const PHOTO = staticFile("pilot/smit.png");
const PW = 577;
const PH = 532;

const HeroCircle: React.FC<{ size: number; ring?: string; glow?: number }> = ({ size, ring = GOLD, glow = 0 }) => {
  const k = (size * 0.5) / 105;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative", border: `${Math.max(6, size * 0.035)}px solid ${ring}`, boxShadow: `0 16px 40px rgba(0,0,0,0.6)${glow ? `, 0 0 ${60 * glow}px rgba(46,204,113,${glow})` : ""}`, background: "#222" }}>
      <Img src={PHOTO} style={{ position: "absolute", width: PW * k, height: PH * k, left: size / 2 - 258 * k, top: size * 0.44 - 160 * k }} />
    </div>
  );
};

const HeroCard: React.FC<{ w: number; h: number; tilt?: number; border?: string }> = ({ w, h, tilt = 0, border = GREEN }) => (
  <div style={{ width: w, height: h, borderRadius: 26, overflow: "hidden", border: `9px solid ${border}`, boxShadow: "0 24px 60px rgba(0,0,0,0.65)", transform: `rotate(${tilt}deg)` }}>
    <Img src={PHOTO} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "42% 22%" }} />
  </div>
);

// Faceless suspect bust with pilot epaulettes and a redaction bar.
const Suspect: React.FC<{ w: number; reveal?: number; q?: number }> = ({ w, reveal = 0, q = 1 }) => (
  <div style={{ position: "relative", width: w, height: w * 1.15 }}>
    <svg width={w} height={w * 1.15} viewBox="0 0 300 345">
      <defs>
        <radialGradient id="susBg" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#4a0f18" />
          <stop offset="1" stopColor="#120407" />
        </radialGradient>
      </defs>
      <rect width={300} height={345} rx={26} fill="url(#susBg)" stroke={RED} strokeWidth={8} />
      <circle cx={150} cy={130} r={70} fill="#050307" />
      <path d="M30 345 Q30 220 150 214 Q270 220 270 345 Z" fill="#050307" />
      <path d="M150 214 L132 345 M150 214 L168 345" stroke="#f2f2f2" strokeWidth={10} />
      {[0, 1].map((s) => (
        <g key={s} transform={`translate(${s ? 196 : 52} 236)`}>
          <rect width={52} height={22} rx={4} fill="#111" stroke="#333" strokeWidth={2} />
          {[0, 1, 2].map((i) => <rect key={i} x={8 + i * 13} y={4} width={7} height={14} fill={GOLD} />)}
        </g>
      ))}
      <rect x={60} y={108} width={180} height={36} fill="#000" stroke={RED} strokeWidth={3} />
      <text x={150} y={134} textAnchor="middle" fontFamily={BODY} fontWeight={900} fontSize={22} letterSpacing={4} fill={RED}>CLASSIFIED</text>
    </svg>
    {q > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: w * 0.1, textAlign: "center", fontFamily: DISPLAY, fontSize: w * 0.42, color: RED, opacity: q * (1 - reveal), textShadow: "0 0 30px rgba(255,59,74,0.8)" }}>?</div>}
  </div>
);

const Folder: React.FC<{ w: number; open: number }> = ({ w, open }) => (
  <div style={{ position: "relative", width: w, height: w * 0.78 }}>
    <svg width={w} height={w * 0.78} viewBox="0 0 400 312" style={{ position: "absolute", inset: 0 }}>
      <path d="M10 40 H140 L160 16 H390 V302 H10 Z" fill="#c9a861" stroke={INK} strokeWidth={6} />
      <rect x={40} y={50 - open * 40} width={320} height={230} fill="#fdfbf5" stroke={INK} strokeWidth={4} transform={`rotate(${-open * 4} 200 160)`} />
      {Array.from({ length: 7 }, (_, i) => <line key={i} x1={70} y1={92 + i * 24 - open * 40} x2={330 - (i % 3) * 40} y2={92 + i * 24 - open * 40} stroke="#9aa3ad" strokeWidth={5} transform={`rotate(${-open * 4} 200 160)`} />)}
      <path d={`M10 ${80 + open * 60} H390 V302 H10 Z`} fill={MANILA} stroke={INK} strokeWidth={6} />
    </svg>
    <div style={{ position: "absolute", left: w * 0.16, top: w * 0.5, transform: "rotate(-10deg)", fontFamily: DISPLAY, fontSize: w * 0.1, color: RED, border: `${w * 0.012}px solid ${RED}`, padding: `0 ${w * 0.03}px`, borderRadius: 8, opacity: 0.9 }}>CONFIDENTIAL</div>
  </div>
);

const DiveMeter: React.FC<{ T: number; t0: number }> = ({ T, t0 }) => {
  const f = Easing.in(Easing.quad)(clamp((T - t0) / 2.4));
  const alt = Math.round(lerp(34000, 16600, f) / 10) * 10;
  const blink = f > 0 && Math.floor(T * 6) % 2 === 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ background: "rgba(5,10,20,0.9)", border: `6px solid ${f > 0 ? RED : "#7a8aa6"}`, borderRadius: 24, padding: "12px 40px", boxShadow: blink ? `0 0 50px ${RED}` : "0 10px 30px rgba(0,0,0,0.6)", textAlign: "center" }}>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 6, color: "#9fb3d1" }}>ALTITUDE · FT</div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 110, lineHeight: 1, color: "#fff" }}>{alt.toLocaleString("en-US")}</div>
      </div>
      <div style={{ marginTop: 16, transform: `scale(${clamp(f * 3)})` }}>
        <Chip text="▼ NOSEDIVE" p={1} bg={RED} border="#fff" size={46} />
      </div>
    </div>
  );
};

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.captain - 0.15], ["who", B.captain - 0.15, B.date - 0.15], ["route", B.date - 0.15, B.attack - 0.15], ["dive", B.attack - 0.15, B.injured - 0.15],
  ["door", B.injured - 0.15, B.land - 0.15], ["land", B.land - 0.15, B.reveal - 0.15], ["reveal", B.reveal - 0.15, B.y2024 - 0.15],
  ["file", B.y2024 - 0.15, B.probe - 0.15], ["probe", B.probe - 0.15, B.pax - 0.15], ["end", B.pax - 0.15, 999],
];
const MAP_SCENES = ["route", "dive", "land"];

export const TwistScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
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
  const shake = T > B.attack && T < B.injured ? Math.sin(T * 30) * 5 : 0;
  const glitch = T < 1.2 || (T > B.reveal && T < B.reveal + 0.5) ? Math.sin(T * 90) * 14 : 0;

  return (
    <AbsoluteFill style={{ background: "#07050a", overflow: "hidden" }}>
      <SatelliteMap view={view} width={W} height={H} darken={0.1} highlights={T > B.land && T < B.reveal ? [{ geom: countryGeom("SAU"), fill: "rgba(46,204,113,0.2)", stroke: GREEN, label: "SAUDI ARABIA", labelAt: [44, 24], labelSize: 34 }] : []}>
        {lit > 0 && (
          <>
            <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: lit }}>
              <line x1={dx} y1={dy} x2={tx} y2={ty} stroke="#fff" strokeWidth={5} strokeDasharray="18 14" opacity={0.75 * (T > B.land ? 0.4 : 1)} />
              {T > B.land && <line x1={ix} y1={iy} x2={bx} y2={by} stroke={GREEN} strokeWidth={7} strokeDasharray="18 12" />}
              {T > B.attack && T < B.reveal && <circle cx={ix} cy={iy} r={(40 + 20 * Math.sin(T * 6)) * k} fill="none" stroke={RED} strokeWidth={6} opacity={0.8} />}
            </svg>
            {([[dx, dy, "DUBAI"], [tx, ty, "TEL AVIV"]] as [number, number, string][]).map(([x, y, label]) => (
              <div key={label} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: lit }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: GOLD, border: "5px solid #fff" }} />
                <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 36, color: "#fff", textShadow: "0 2px 8px #000" }}>{label}</div>
              </div>
            ))}
            {T > B.land && (
              <div style={{ position: "absolute", left: bx, top: by, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: lit * clamp((T - B.land - 1) * 3) }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: GREEN, border: "5px solid #fff", boxShadow: `0 0 26px ${GREEN}` }} />
                <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 40, color: "#fff", textShadow: "0 2px 8px #000" }}>TABUK</div>
              </div>
            )}
            <div style={{ position: "absolute", left: px + shake, top: py + shake * 0.5, transform: `translate(-50%,-50%) rotate(${(-plane.ang * 180) / Math.PI}deg)`, opacity: lit, filter: T > B.attack && T < B.land + 3 ? `drop-shadow(0 0 14px ${RED})` : "drop-shadow(0 0 10px rgba(255,255,255,0.6))" }}>
              <Plane size={70 * k} color={T > B.attack && T < B.land + 3 ? "#ffd0d4" : "#fff"} />
            </div>
          </>
        )}
      </SatelliteMap>
      <AbsoluteFill style={{ background: `rgba(6,3,8,${0.7 * (1 - lit)})` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)" }} />
      {T < 0.25 && <AbsoluteFill style={{ background: RED, opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center" }}>
            <div style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 44, letterSpacing: 8, padding: "8px 30px", transform: `scale(${pop(frame, fps, 0.1)})` }}>🔴 BREAKING · FZ1073</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, textAlign: "center", transform: `translateX(${glitch}px) scale(${pop(frame, fps, 0.3, 9)})` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.95, color: GOLD, textShadow: `6px 0 0 ${RED}, -6px 0 0 #2ad1ff, 0 12px 0 ${INK}` }}>SHOCKING</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 190, lineHeight: 0.95, color: "#fff", textShadow: `6px 0 0 ${RED}, -6px 0 0 #2ad1ff, 0 12px 0 ${INK}` }}>TWIST!</div>
          </div>
          <Title text="ఫ్లైదుబాయ్ ఘటనలో…" t={1.6} top={900} size={88} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080, display: "flex", justifyContent: "center", gap: 60, alignItems: "center" }}>
            <div style={{ transform: `scale(${pop(frame, fps, 2.4)})` }}><HeroCircle size={250} ring={GREEN} /></div>
            <div style={{ fontFamily: DISPLAY, fontSize: 110, color: RED, transform: `scale(${pop(frame, fps, 3.0, 8)})` }}>VS</div>
            <div style={{ transform: `scale(${pop(frame, fps, 3.4)})` }}><Suspect w={240} /></div>
          </div>
        </AbsoluteFill>
      )}

      {o("who") > 0 && (
        <AbsoluteFill style={{ opacity: o("who") }}>
          <Title text="కెప్టెన్ పై దాడి చేసిన" t={B.captain} top={300} size={80} frame={frame} fps={fps} />
          <Title text="ఆ కో-పైలట్ ఎవరు?" t={B.captain + 1.4} top={410} size={96} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 580, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.captain + 0.6, 13)})` }}>
            <Suspect w={420} reveal={clamp((T - B.name) * 2)} />
          </div>
          {T > B.name - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1090, textAlign: "center" }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 96, color: "#fff", background: "rgba(0,0,0,0.85)", border: `5px solid ${RED}`, borderRadius: 18, padding: "4px 30px", textShadow: `0 0 20px ${RED}` }}>
                {"HAMAM ALHAMAMI".slice(0, Math.max(0, Math.round((T - B.name + 0.2) * 14)))}
              </span>
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: 1260, display: "flex", justifyContent: "center", gap: 18 }}>
            <Chip text="29 YEARS" p={pop(frame, fps, B.omani)} size={44} />
            <Chip text="OMANI NATIONAL" p={pop(frame, fps, B.omani + 0.6)} size={44} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center" }}>
            <Chip text="🔍 IDENTIFIED BY INVESTIGATORS" p={pop(frame, fps, B.omani + 1.8)} size={36} color={GOLD} />
          </div>
        </AbsoluteFill>
      )}

      {o("route") > 0 && (
        <AbsoluteFill style={{ opacity: o("route") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Chip text="📅 30 SEPTEMBER" p={pop(frame, fps, B.date)} size={48} />
            <Chip text="DUBAI → TEL AVIV · FZ1073" p={pop(frame, fps, B.date + 1.4)} size={46} bg="rgba(220,40,50,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("dive") > 0 && (
        <AbsoluteFill style={{ opacity: o("dive") }}>
          <Title text="కెప్టెన్ పై అటాక్!" t={B.attack} top={320} size={104} color={RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1060, transform: "scale(0.9)" }}>
            <DiveMeter T={T} t0={B.dive - 0.8} />
          </div>
        </AbsoluteFill>
      )}

      {o("door") > 0 && (
        <AbsoluteFill style={{ opacity: o("door") }}>
          <AbsoluteFill style={{ background: "rgba(4,6,14,0.55)" }} />
          <Title text="గాయాలతోనే…" t={B.injured} top={300} size={100} frame={frame} fps={fps} />
          <Title text="డోర్ ఓపెన్ చేశాడు!" t={B.door - 0.6} top={420} size={100} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 520, top: 600, transform: "scale(0.85)", transformOrigin: "0 0" }}>
            <Door open={ease(clamp((T - B.door) / 0.8))} />
          </div>
          <div style={{ position: "absolute", left: 60, top: 680, transform: `scale(${pop(frame, fps, B.injured + 0.3)})` }}>
            <HeroCard w={420} h={560} tilt={-4} />
            <div style={{ marginTop: -40, display: "flex", justifyContent: "center" }}>
              <Chip text="CAPT. SMIT MACHCHHAR" p={1} size={34} bg={GREEN} border="#fff" />
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1380, display: "flex", justifyContent: "center" }}>
            <Chip text="PASSENGERS + CREW STOPPED HIM ✓" p={pop(frame, fps, B.crew)} size={40} bg="rgba(46,204,113,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("land") > 0 && (
        <AbsoluteFill style={{ opacity: o("land") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center" }}>
            <Chip text="SAFE LANDING · SAUDI ARABIA ✓" p={pop(frame, fps, B.land + 1.6)} size={44} bg="rgba(46,204,113,0.95)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("reveal") > 0 && (
        <AbsoluteFill style={{ opacity: o("reveal") }}>
          <AbsoluteFill style={{ background: `rgba(120,0,15,${0.25 + 0.1 * Math.sin(T * 10)})` }} />
          <Title text="కానీ ఇప్పుడు…" t={B.reveal} top={320} size={104} frame={frame} fps={fps} />
          <Title text="అసలు నిజం బయటికి!" t={B.reveal + 1.0} top={450} size={100} color={RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 680, display: "flex", justifyContent: "center", transform: `translateX(${glitch}px) scale(${pop(frame, fps, B.reveal + 0.4, 12)})` }}>
            <Folder w={720} open={clamp((T - B.reveal - 1.6) / 1)} />
          </div>
        </AbsoluteFill>
      )}

      {o("file") > 0 && (
        <AbsoluteFill style={{ opacity: o("file") }}>
          <div style={{ position: "absolute", left: 60, right: 60, top: 300, height: 980, background: "#fdfbf5", borderRadius: 20, border: `6px solid ${INK}`, boxShadow: "0 30px 60px rgba(0,0,0,0.6)", transform: `rotate(-1.2deg) scale(${pop(frame, fps, B.y2024 - 0.2, 14)})` }}>
            <div style={{ position: "absolute", left: 30, top: 24, fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: "#55607a" }}>FILE: H. ALHAMAMI</div>
            <div style={{ position: "absolute", right: 24, top: 18, transform: "rotate(8deg)" }}><Suspect w={150} q={0} /></div>
            <div style={{ position: "absolute", left: 92, top: 220, width: 6, height: 700, background: "#c9cfd8" }} />
            {([
              ["2024 · OMAN AIR", "🚩 సెక్యూరిటీ రిస్క్ గా గుర్తింపు", B.y2024, RED],
              ["", "✈️ ఫ్లయింగ్ నుంచి సస్పెండ్", B.suspended, RED],
              ["REPORTS", "📂 ఎక్స్‌ట్రీమిస్ట్ మెటీరియల్", B.extremist, RED],
              ["THEN", "🗂️ అడ్మిన్ రోల్ లో కంటిన్యూ", B.admin, "#55607a"],
              ["LATER", "😱 ఫ్లైదుబాయ్ లో కో-పైలట్!", B.joined, "#c47a00"],
            ] as [string, string, number, string][]).map(([tag, text, t, col], i) => {
              const p = pop(frame, fps, t - 0.15);
              return p > 0.01 ? (
                <div key={text} style={{ position: "absolute", left: 60, right: 30, top: 200 + i * 150, display: "flex", alignItems: "center", gap: 28, transform: `translateX(${(1 - p) * 700}px)`, opacity: clamp(p * 2) }}>
                  <div style={{ width: 70, height: 70, borderRadius: "50%", background: col, border: `6px solid ${INK}`, flexShrink: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {tag && <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, lineHeight: 1, letterSpacing: 4, color: col }}>{tag}</div>}
                    <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 52, color: INK, lineHeight: 1.3 }}>{text}</div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
          {T > B.joined + 0.6 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
              <Stamp text="HOW?!" p={pop(frame, fps, B.joined + 0.6)} color={RED} size={110} te={false} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("probe") > 0 && (
        <AbsoluteFill style={{ opacity: o("probe") }}>
          <Title text="ఇన్వెస్టిగేషన్ 🔍" t={B.probe} top={310} size={100} color={GOLD} frame={frame} fps={fps} />
          {([["TERROR LINK?", B.terror, 520], ["INTENTIONAL CRASH?", B.crash, 760]] as [string, number, number][]).map(([text, t, y], i) => (
            <div key={text} style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 92, color: "#fff", background: "rgba(10,10,18,0.9)", border: `6px solid ${RED}`, borderRadius: 26, padding: "14px 44px", transform: `scale(${pop(frame, fps, t)}) rotate(${i ? 2 : -2}deg)`, boxShadow: `0 0 40px rgba(255,59,74,${0.3 + 0.2 * Math.sin(T * 6)})` }}>{text}</div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 640, top: 960, fontSize: 200, transform: `rotate(${Math.sin(T * 2) * 12}deg) scale(${pop(frame, fps, B.angles)})` }}>🔍</div>
          {T > B.motive - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center" }}>
              <Stamp text={"MOTIVE:\nNOT CONFIRMED"} p={pop(frame, fps, B.motive - 0.2)} color={GOLD} size={80} te={false} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("end") > 0 && (
        <AbsoluteFill style={{ opacity: o("end") }}>
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center", transform: `scale(${pop(frame, fps, B.pax)})` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 200, lineHeight: 1, color: GOLD, textShadow: `0 10px 0 ${INK}` }}>170+</span>
            <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 70, color: "#fff", WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>ప్రయాణికులు ఉన్న ఫ్లైట్ లో…</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 700, display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
            <div style={{ transform: `scale(${pop(frame, fps, B.pax + 1.2)})`, textAlign: "center" }}>
              <HeroCircle size={300} ring={GREEN} glow={0.5} />
              <div style={{ marginTop: 10, fontFamily: DISPLAY, fontSize: 52, color: GREEN }}>HERO</div>
            </div>
            <div style={{ transform: `scale(${pop(frame, fps, B.pax + 1.8)})`, textAlign: "center" }}>
              <Suspect w={260} q={0.6} />
              <div style={{ marginTop: 10, fontFamily: DISPLAY, fontSize: 52, color: RED }}>ATTACKER</div>
            </div>
          </div>
          {T < B.cta && <Title text={"ఏవియేషన్ వరల్డ్\nషాక్! 😱"} t={B.shock} top={1150} size={96} color={GOLD} frame={frame} fps={fps} />}
          {T > B.shock && T < B.cta && <div style={{ position: "absolute", left: 0, right: 0, top: 1440, display: "flex", justifyContent: "center" }}><Tricolor w={160} h={10} /></div>}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1200} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const FlydubaiTwist: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.26], [0.3, "whoosh", 0.2], [1.6, "pop", 0.16], [2.4, "pop", 0.18], [3.0, "boom", 0.2], [3.4, "pop", 0.18],
    [B.captain, "whoosh", 0.18], [B.name - 0.2, "boom", 0.24], [B.omani, "pop", 0.18], [B.omani + 0.6, "pop", 0.18], [B.date, "whoosh", 0.2],
    [B.attack, "boom", 0.24], [B.dive, "whoosh", 0.2], [B.injured, "whoosh", 0.18], [B.door, "boom", 0.2], [B.crew, "ding", 0.2], [B.land + 1.6, "ding", 0.22],
    [B.reveal, "boom", 0.26], [B.reveal + 1.6, "whoosh", 0.18], [B.y2024 - 0.15, "pop", 0.2], [B.suspended - 0.15, "pop", 0.2], [B.extremist - 0.15, "pop", 0.2],
    [B.admin - 0.15, "pop", 0.18], [B.joined - 0.15, "pop", 0.2], [B.joined + 0.6, "boom", 0.24], [B.probe, "whoosh", 0.18], [B.terror, "pop", 0.2],
    [B.crash, "pop", 0.2], [B.motive - 0.2, "boom", 0.2], [B.pax, "whoosh", 0.18], [B.shock, "ding", 0.24],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("pilot/twist.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <TwistScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const FlydubaiTwistThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#07050a", overflow: "hidden" }}>
    <SatelliteMap view={V.wide} width={W} height={H} darken={0.35} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,0,4,0.92) 0%, rgba(90,0,15,0.55) 45%, rgba(10,0,4,0.95) 100%)" }} />
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d="M540 640 L520 760 L565 820 L515 930 L560 1010 L530 1140" fill="none" stroke="#fff" strokeWidth={10} strokeLinejoin="round" opacity={0.9} />
      <path d="M540 640 L520 760 L565 820 L515 930 L560 1010 L530 1140" fill="none" stroke={RED} strokeWidth={26} strokeLinejoin="round" opacity={0.35} />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
      <span style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 8, padding: "6px 26px" }}>🔴 FLYDUBAI FZ1073</span>
      <div style={{ marginTop: 14, fontFamily: DISPLAY, fontSize: 150, lineHeight: 0.92, color: GOLD, textShadow: `6px 0 0 ${RED}, -6px 0 0 #2ad1ff, 0 12px 0 ${INK}` }}>SHOCKING</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.92, color: "#fff", textShadow: `6px 0 0 ${RED}, -6px 0 0 #2ad1ff, 0 12px 0 ${INK}` }}>TWIST!</div>
    </div>
    <div style={{ position: "absolute", left: 30, top: 700, transform: "rotate(-4deg)" }}>
      <HeroCard w={460} h={520} border={GREEN} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -26, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 56, color: "#fff", background: GREEN, border: "5px solid #fff", borderRadius: 14, padding: "0 26px" }}>HERO ✓</span>
      </div>
    </div>
    <div style={{ position: "absolute", right: 30, top: 720, transform: "rotate(4deg)" }}>
      <Suspect w={440} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -26, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 52, color: "#fff", background: RED, border: "5px solid #fff", borderRadius: 14, padding: "0 22px" }}>CO-PILOT?</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 70, color: INK, background: GOLD, border: `6px solid ${INK}`, borderRadius: 22, padding: "2px 34px", transform: "rotate(-2deg)", boxShadow: "0 14px 34px rgba(0,0,0,0.7)" }}>🚩 2024 లోనే FLAG అయ్యాడా?!</div>
    </div>
  </AbsoluteFill>
);
