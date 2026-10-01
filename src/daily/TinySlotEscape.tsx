import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { Globe } from "../brand/GlobeTales";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { CoverTitle } from "../cartoon/CoverTitle";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const eo = Easing.out(Easing.cubic);
const C = { bg: "#0d131d", wall: "#1b2230", steel: "#3a4456", steelHi: "#566176", ink: "#070a10", amber: "#ffb000", red: "#ff3b4a", text: "#f2f5fa", dim: "#9aa6b8", skin: "#c98f68", shirt: "#7a808a", pants: "#2b3350" };

// Door drawn at 7.8 px per cm: 2 m door, 15 × 45 cm food slot.
const SLOT = { x: 364, y: 1470, w: 351, h: 117 };
const SC = { x: 540, y: SLOT.y + SLOT.h / 2 };

// ---- cues ---------------------------------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const makeCues = (secs: Section[]) => {
  const missing: string[] = [];
  const idx = (p: string) => {
    const i = secs.findIndex((s) => s.text.toLowerCase().includes(p.toLowerCase()));
    if (i < 0) missing.push(p);
    return i;
  };
  const at = (p: string, off = 0) => {
    const i = idx(p);
    return i < 0 ? NaN : secs[i].start + off;
  };
  const word = (p: string, w: string) => {
    const i = idx(p);
    if (i < 0) return NaN;
    const x = secs[i].words.find((z) => norm(z.word) === norm(w)) ?? secs[i].words.find((z) => norm(z.word).startsWith(norm(w)));
    return x ? x.start : secs[i].start;
  };
  return { at, word, missing };
};

const buildPlan = (secs: Section[]) => {
  const { at, word, missing } = makeCues(secs);
  const shots = [
    at("This gap is only"), at("food slot of a police"), at("South Korea. September"), at("Inside one cell"), at("He was small"),
    at("The slot in his door"), at("skin ointment"), at("what about the guards"), at("pushed through the slot"), at("slipped out of the station"),
    at("massive manhunt"), at("A tiny body"), at("strangest prison escape"), at("like, share"),
  ];
  const w = {
    h15: word("This gap is only", "15"), grown: word("This gap is only", "grown"), chest: word("food slot of a police", "chest"),
    korea: word("South Korea. September", "Korea"), sept: word("South Korea. September", "September"), daegu: word("South Korea. September", "Daegu"),
    choi: word("Inside one cell", "Choi"), robbery: word("Inside one cell", "robbery"), h165: word("He was small", "165"), k52: word("He was small", "52"),
    s15: word("The slot in his door", "15"), s45: word("The slot in his door", "45"), ointment: word("skin ointment", "ointment"), slippery: word("skin ointment", "slippery"),
    dozed: word("what about the guards", "dozed"), head: word("pushed through the slot", "Head"), shoulders: word("pushed through the slot", "Shoulders"), body: word("pushed through the slot", "Body"),
    night: word("slipped out of the station", "night"), manhunt: word("massive manhunt", "manhunt"), caught: word("massive manhunt", "caught"),
    tiny: word("A tiny body", "tiny"), slip2: word("A tiny body", "slippery"), sleeping: word("A tiny body", "sleeping"), gap15: word("A tiny body", "15"),
    stories: word("strangest prison escape", "stories"),
    like: word("like, share", "like"), share: word("like, share", "share"), sub: word("like, share", "subscribe"),
  };
  return { shots, w, missing };
};
type Plan = ReturnType<typeof buildPlan>;

// ---- shared visuals --------------------------------------------------------------------
const Dust: React.FC<{ T: number; drift?: number; n?: number }> = ({ T, drift = 0, n = 46 }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: n }, (_, i) => {
      const depth = 0.4 + (i % 5) * 0.2;
      const x = ((i * 211.7 + drift * depth * 60) % 1180) - 50;
      const y = 1920 - (((T * (14 + (i % 7) * 6) * depth + i * 173) % 2000));
      const s = 2 + depth * 3;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#ffd98a", opacity: 0.08 + depth * 0.12, filter: depth > 1 ? "blur(1.5px)" : undefined }} />;
    })}
  </AbsoluteFill>
);
const Vignette: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.78) 100%)", pointerEvents: "none" }} />;

const pop = (frame: number, fps: number, t: number) => (Number.isFinite(t) ? spring({ frame: frame - Math.round(t * fps), fps, config: { damping: 12, mass: 0.6 } }) : 0);
const Bare = React.createContext(false);

const PostText: React.FC<{ text: string; t: number; top: number; size?: number; color?: string; frame: number; fps: number }> = ({ text, t, top, size = 150, color = C.text, frame, fps }) => {
  const p = pop(frame, fps, t);
  if (p <= 0.001 || React.useContext(Bare)) return null;
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, textAlign: "center", fontFamily: DISPLAY, fontSize: size, lineHeight: 1, letterSpacing: 2, color, textShadow: "0 6px 24px rgba(0,0,0,0.85)", transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + 0.15 * p})`, opacity: clamp(p * 1.6) }}>
      {text}
    </div>
  );
};
const Chip: React.FC<{ text: string; t: number; top: number; frame: number; fps: number; color?: string }> = ({ text, t, top, frame, fps, color = C.amber }) => {
  const p = pop(frame, fps, t);
  if (p <= 0.001 || React.useContext(Bare)) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: clamp(p * 1.6), transform: `translateY(${(1 - p) * 24}px)` }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 5, color: C.text, background: "rgba(10,14,22,0.82)", borderLeft: `8px solid ${color}`, padding: "12px 26px", whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

// Recurring cell door (one design for every door shot).
const Door: React.FC<{ glow: number; T: number; showSlotLight?: boolean }> = ({ glow, T, showSlotLight = true }) => {
  const flick = 0.85 + 0.15 * Math.sin(T * 23) * Math.sin(T * 7.3);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="dwall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141a25" />
          <stop offset="1" stopColor="#0c1018" />
        </linearGradient>
        <linearGradient id="dsteel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c3443" />
          <stop offset="0.5" stopColor={C.steel} />
          <stop offset="1" stopColor="#262d3a" />
        </linearGradient>
        <radialGradient id="dslot" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#fff1c2" />
          <stop offset="0.45" stopColor={C.amber} />
          <stop offset="1" stopColor="#7a3d00" />
        </radialGradient>
        <radialGradient id="dspill" cx="50%" cy="0%" r="70%">
          <stop offset="0" stopColor="rgba(255,176,0,0.45)" />
          <stop offset="1" stopColor="rgba(255,176,0,0)" />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#dwall)" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={0} y1={160 * i + 40} x2={1080} y2={160 * i + 40} stroke="rgba(255,255,255,0.03)" strokeWidth={3} />
      ))}
      <rect x={0} y={1740} width={1080} height={180} fill="#0a0d14" />
      <rect x={140} y={160} width={800} height={1580} fill="#11161f" />
      <rect x={160} y={180} width={760} height={1560} rx={6} fill="url(#dsteel)" stroke={C.ink} strokeWidth={6} />
      {[260, 980].map((y) => (
        <rect key={y} x={210} y={y} width={660} height={y === 260 ? 640 : 380} rx={6} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={8} />
      ))}
      {Array.from({ length: 18 }, (_, i) => (
        <circle key={i} cx={i < 9 ? 185 : 895} cy={230 + (i % 9) * 170} r={9} fill={C.steelHi} stroke={C.ink} strokeWidth={3} />
      ))}
      <rect x={840} y={900} width={46} height={120} rx={10} fill="#1d2330" stroke={C.ink} strokeWidth={4} />
      <rect x={SLOT.x - 16} y={SLOT.y - 16} width={SLOT.w + 32} height={SLOT.h + 32} rx={8} fill="#1c222d" stroke={C.ink} strokeWidth={5} />
      <rect x={SLOT.x} y={SLOT.y} width={SLOT.w} height={SLOT.h} fill={showSlotLight ? "url(#dslot)" : "#05070b"} opacity={showSlotLight ? 0.35 + 0.65 * glow * flick : 1} />
      {showSlotLight && <ellipse cx={SC.x} cy={1740} rx={420 * glow} ry={70} fill="url(#dspill)" opacity={glow * flick} />}
    </svg>
  );
};

type Pose = "stand" | "sit";
// Choi Gap-bok (same design everywhere): slim, short black hair with grey temples, grey long-sleeve top, navy trousers.
const Choi: React.FC<{ pose?: Pose; gloss?: number; tense?: boolean; id: string }> = ({ pose = "stand", gloss = 0, id }) => {
  const body = (
    <>
      {pose === "stand" ? (
        <>
          <rect x={72} y={225} width={24} height={150} rx={10} fill={C.pants} />
          <rect x={104} y={225} width={24} height={150} rx={10} fill={C.pants} />
          <rect x={66} y={368} width={34} height={14} rx={6} fill="#111" />
          <rect x={100} y={368} width={34} height={14} rx={6} fill="#111" />
        </>
      ) : (
        <>
          <rect x={72} y={220} width={96} height={26} rx={10} fill={C.pants} />
          <rect x={144} y={230} width={24} height={110} rx={10} fill={C.pants} />
          <rect x={140} y={334} width={40} height={14} rx={6} fill="#111" />
        </>
      )}
      <rect x={66} y={110} width={68} height={125} rx={22} fill={C.shirt} />
      <rect x={48} y={116} width={20} height={112} rx={10} fill={C.shirt} />
      <rect x={132} y={116} width={20} height={112} rx={10} fill={C.shirt} />
      <circle cx={58} cy={232} r={10} fill={C.skin} />
      <circle cx={142} cy={232} r={10} fill={C.skin} />
      <rect x={90} y={88} width={20} height={26} fill={C.skin} />
      <ellipse cx={100} cy={62} rx={30} ry={35} fill={C.skin} />
      <path d="M70 58 Q72 24 100 24 Q128 24 130 58 Q122 40 100 40 Q78 40 70 58Z" fill="#161616" />
      <path d="M70 58 Q70 48 74 44 L76 60Z M130 58 Q130 48 126 44 L124 60Z" fill="#8d8d8d" />
      <path d="M86 58 L94 56 M106 56 L114 58" stroke="#222" strokeWidth={3} strokeLinecap="round" />
      <circle cx={90} cy={64} r={2.6} fill="#111" />
      <circle cx={110} cy={64} r={2.6} fill="#111" />
      <path d="M92 82 Q100 79 108 82" stroke="#6b3f2a" strokeWidth={3} fill="none" strokeLinecap="round" />
    </>
  );
  return (
    <g>
      <clipPath id={`cb-${id}`}>{body}</clipPath>
      <g stroke={C.ink} strokeWidth={0}>{body}</g>
      {gloss > 0 && (
        <g clipPath={`url(#cb-${id})`}>
          <rect x={-120 + gloss * 380} y={0} width={70} height={420} fill="rgba(255,255,255,0.55)" transform={`skewX(-20)`} />
          <rect x={0} y={0} width={200} height={420} fill="rgba(255,240,210,0.12)" opacity={gloss} />
        </g>
      )}
    </g>
  );
};

// ---- shots -------------------------------------------------------------------------------
type ShotProps = { lt: number; dur: number; T: number; frame: number; fps: number; plan: Plan };
const Cam: React.FC<{ s: number; x?: number; y?: number; ox?: number; oy?: number; children: React.ReactNode }> = ({ s, x = 0, y = 0, ox = 540, oy = 960, children }) => (
  <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: `${ox}px ${oy}px` }}>{children}</AbsoluteFill>
);
const DimLine: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; label: string; lx: number; ly: number }> = ({ x1, y1, x2, y2, p, label, lx, ly }) =>
  p <= 0 ? null : (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={x1} y1={y1} x2={lerp(x1, x2, p)} y2={lerp(y1, y2, p)} stroke={C.amber} strokeWidth={6} />
      {[[x1, y1], [lerp(x1, x2, p), lerp(y1, y2, p)]].map(([x, y], i) => (
        <line key={i} x1={x - (y1 === y2 ? 0 : 22)} y1={y - (y1 === y2 ? 22 : 0)} x2={x + (y1 === y2 ? 0 : 22)} y2={y + (y1 === y2 ? 22 : 0)} stroke={C.amber} strokeWidth={6} />
      ))}
      <text x={lx} y={ly} fill={C.amber} fontFamily={DISPLAY} fontSize={64} textAnchor="middle" opacity={clamp(p * 2 - 1)}>
        {label}
      </text>
    </svg>
  );

const S1: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const s = lerp(3.0, 3.5, eo(clamp(lt / 6)));
  const p15 = clamp((T - plan.w.h15) / 0.6);
  return (
    <AbsoluteFill>
      <Cam s={s} y={-(SC.y - 960)} ox={SC.x} oy={SC.y}>
        <Door glow={1} T={T} />
        <DimLine x1={SLOT.x - 40} y1={SLOT.y} x2={SLOT.x - 40} y2={SLOT.y + SLOT.h} p={p15} label="" lx={0} ly={0} />
      </Cam>
      <PostText text="15 CM" t={plan.w.h15} top={560} size={220} color={C.amber} frame={frame} fps={fps} />
      <Chip text="A GROWN MAN ESCAPED THROUGH IT" t={plan.w.grown} top={1300} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S2: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const p = ease(clamp(lt / 2.6));
  const s = lerp(3.5, 1, p);
  return (
    <AbsoluteFill>
      <Cam s={s} y={-(SC.y - 960) * (1 - p)} ox={SC.x} oy={SC.y}>
        <Door glow={1} T={T} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: clamp((lt - 2.2) * 2) }}>
          <g transform="translate(560 365) scale(6.8)" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={0.6} strokeDasharray="3 3">
            <ellipse cx={50} cy={32} rx={15} ry={18} />
            <path d="M35 58 L65 58 L72 120 L66 200 L56 200 L50 128 L44 200 L34 200 L28 120 Z" />
          </g>
        </svg>
      </Cam>
      <Chip text="POLICE CELL · FOOD SLOT" t={plan.shots[1] + 0.4} top={380} frame={frame} fps={fps} />
      <Chip text="MOST ADULTS WOULDN'T FIT" t={plan.w.chest} top={470} frame={frame} fps={fps} color={C.red} />
    </AbsoluteFill>
  );
};

const S3: React.FC<ShotProps> = ({ lt, dur, T, frame, fps, plan }) => {
  const p = ease(clamp(lt / Math.max(1, dur - 0.5)));
  const r = 360 * Math.pow(4200 / 360, p);
  const pinP = pop(frame, fps, plan.w.daegu);
  return (
    <AbsoluteFill style={{ background: "#03060c" }}>
      {Array.from({ length: 90 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: (i * 347) % 1080, top: (i * 617) % 1920, width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: "50%", background: "#fff", opacity: 0.2 + (i % 4) * 0.12 }} />
      ))}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: "saturate(0.5) brightness(0.85)" }}>
        <Globe r={r} cx={540} cy={960} lon0={128.6} lat0={35.9} id="g3" outline={Math.max(4, r / 60)} />
      </svg>
      <div style={{ position: "absolute", left: 540, top: 960, transform: `translate(-50%, -100%) translateY(${(1 - pinP) * -120}px)`, opacity: clamp(pinP * 2) }}>
        <svg width={70} height={92} viewBox="0 0 40 52">
          <path d="M20 50 C20 50 4 30 4 18 A16 16 0 1 1 36 18 C36 30 20 50 20 50 Z" fill={C.red} stroke="#fff" strokeWidth={3} />
          <circle cx={20} cy={18} r={7} fill="#fff" />
        </svg>
      </div>
      <PostText text="SOUTH KOREA" t={plan.w.korea} top={420} size={120} frame={frame} fps={fps} />
      <Chip text="SEPTEMBER 2012" t={plan.w.sept} top={560} frame={frame} fps={fps} />
      <Chip text="DAEGU" t={plan.w.daegu} top={1100} frame={frame} fps={fps} color={C.red} />
    </AbsoluteFill>
  );
};

const Cell: React.FC<{ T: number; children?: React.ReactNode }> = ({ T, children }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #151b26 0%, #0e131c 70%, #0a0d14 100%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={0} y1={200 + i * 170} x2={1080} y2={200 + i * 170} stroke="rgba(255,255,255,0.035)" strokeWidth={3} />
      ))}
      <polygon points="440,0 640,0 900,1500 180,1500" fill={`rgba(255,220,150,${0.07 + 0.02 * Math.sin(T * 9)})`} />
      <rect x={0} y={1500} width={1080} height={420} fill="#090c12" />
      <rect x={120} y={1180} width={600} height={60} rx={8} fill="#2a3240" stroke={C.ink} strokeWidth={5} />
      <rect x={150} y={1240} width={30} height={260} fill="#222936" />
      <rect x={660} y={1240} width={30} height={260} fill="#222936" />
    </svg>
    {children}
  </AbsoluteFill>
);

const S4: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => (
  <AbsoluteFill>
    <Cam s={lerp(1, 1.12, eo(clamp(lt / 5)))} oy={1100}>
      <Cell T={T}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform="translate(230 780) scale(2.2)">
            <Choi pose="sit" id="s4" />
          </g>
        </svg>
      </Cell>
    </Cam>
    <Dust T={T} />
    <PostText text="CHOI GAP-BOK" t={plan.w.choi} top={420} size={130} color={C.amber} frame={frame} fps={fps} />
    <Chip text="AGE 50 · ROBBERY SUSPECT" t={plan.w.robbery} top={570} frame={frame} fps={fps} />
  </AbsoluteFill>
);

const S5: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const h = clamp((T - plan.w.h165) / 1.2);
  const px = 5.2;
  const base = 1560;
  return (
    <AbsoluteFill>
      <Cam s={1.02} x={lerp(-30, 30, clamp(lt / 7))}>
        <Cell T={T}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <rect x={700} y={base - 200 * px} width={60} height={200 * px} fill="#1b2230" stroke={C.dim} strokeWidth={3} />
            {Array.from({ length: 21 }, (_, i) => (
              <g key={i}>
                <line x1={700} y1={base - i * 10 * px} x2={i % 5 === 0 ? 740 : 722} y2={base - i * 10 * px} stroke={C.dim} strokeWidth={3} />
                {i % 5 === 0 && <text x={772} y={base - i * 10 * px + 10} fill={C.dim} fontFamily={BODY} fontSize={28} fontWeight={700}>{i * 10}</text>}
              </g>
            ))}
            <rect x={704} y={base - 165 * px * h} width={52} height={165 * px * h} fill={C.amber} opacity={0.55} />
            <line x1={330} y1={base - 165 * px} x2={760} y2={base - 165 * px} stroke={C.amber} strokeWidth={4} strokeDasharray="12 10" opacity={h} />
            <g transform={`translate(${380} ${base - 165 * px}) scale(${(165 * px) / 382})`}>
              <Choi pose="stand" id="s5" />
            </g>
          </svg>
        </Cell>
      </Cam>
      <Dust T={T} drift={lt} />
      <PostText text={`${Math.round(165 * eo(h))} CM`} t={plan.w.h165} top={330} size={170} color={C.amber} frame={frame} fps={fps} />
      <Chip text="52 KG" t={plan.w.k52} top={520} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S6: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const s = lerp(1.7, 1.95, eo(clamp(lt / 6)));
  const pv = clamp((T - plan.w.s15) / 0.7);
  const ph = clamp((T - plan.w.s45) / 0.8);
  return (
    <AbsoluteFill>
      <Cam s={s} y={-(SC.y - 1060)} ox={SC.x} oy={SC.y}>
        <Door glow={0.9} T={T} />
        <DimLine x1={SLOT.x - 50} y1={SLOT.y} x2={SLOT.x - 50} y2={SLOT.y + SLOT.h} p={pv} label="" lx={0} ly={0} />
        <DimLine x1={SLOT.x} y1={SLOT.y - 50} x2={SLOT.x + SLOT.w} y2={SLOT.y - 50} p={ph} label="" lx={0} ly={0} />
      </Cam>
      <PostText text="15 CM HIGH" t={plan.w.s15} top={420} size={130} color={C.amber} frame={frame} fps={fps} />
      <PostText text="45 CM WIDE" t={plan.w.s45} top={570} size={130} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S7: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const squeeze = clamp((T - plan.w.ointment + 0.6) / 0.8);
  const gloss = clamp((T - plan.w.slippery) / 1.6);
  return (
    <AbsoluteFill>
      <Cell T={T}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(560 ${1560 - 382 * 2.3}) scale(2.3)`}>
            <Choi pose="stand" gloss={gloss} id="s7" />
          </g>
          <g transform={`translate(${lerp(300, 250, eo(clamp(lt / 6)))} 1080) rotate(-24)`}>
            <g transform={`scale(1 ${1 - 0.35 * squeeze})`}>
              <rect x={-60} y={-190} width={120} height={300} rx={26} fill="#e9eef5" stroke={C.ink} strokeWidth={6} />
              <rect x={-60} y={-80} width={120} height={70} fill={C.amber} />
              <rect x={-40} y={110} width={80} height={24} fill="#c9d1dc" stroke={C.ink} strokeWidth={5} />
            </g>
            <rect x={-18} y={-236} width={36} height={48} rx={6} fill="#d8dee7" stroke={C.ink} strokeWidth={5} />
            <ellipse cx={0} cy={-236 - 40 * squeeze} rx={26 * squeeze} ry={34 * squeeze} fill="#fff5dc" opacity={squeeze} />
          </g>
        </svg>
      </Cell>
      <Dust T={T} />
      <PostText text="SKIN OINTMENT" t={plan.w.ointment} top={380} size={140} color={C.amber} frame={frame} fps={fps} />
      <Chip text="EARLY MORNING · MAKING HIMSELF SLIPPERY" t={plan.w.slippery} top={540} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S8: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #121926, #0a0e16)" }}>
    <Cam s={1.05} x={lerp(40, -40, clamp(lt / 7))}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={660} y={760} width={300} height={200} rx={10} fill="#0b1422" stroke="#2c3a52" strokeWidth={8} />
        <rect x={676} y={776} width={268} height={168} fill={`rgba(90,170,255,${0.35 + 0.1 * Math.sin(T * 17)})`} />
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={676} y1={800 + i * 40} x2={944} y2={800 + i * 40} stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
        ))}
        <rect x={60} y={1150} width={960} height={70} rx={8} fill="#3a2e22" stroke={C.ink} strokeWidth={6} />
        <rect x={90} y={1220} width={40} height={320} fill="#2a2119" />
        <rect x={950} y={1220} width={40} height={320} fill="#2a2119" />
        {[210, 500, 790].map((x, i) => (
          <g key={x} transform={`translate(${x} ${1150}) rotate(${i === 1 ? 4 : -6})`}>
            <ellipse cx={0} cy={-40} rx={120} ry={40} fill="#1e2a44" />
            <ellipse cx={0} cy={-70} rx={52} ry={46} fill={C.skin} />
            <path d="M-58 -92 Q0 -140 58 -92 L64 -82 L-64 -82Z" fill="#101a30" stroke={C.ink} strokeWidth={4} />
            <rect x={-20} y={-122} width={40} height={16} rx={4} fill={C.amber} />
          </g>
        ))}
      </svg>
      {[210, 500, 790].map((x, i) => {
        const ph = ((T * 0.45 + i * 0.33) % 1);
        return (
          <div key={x} style={{ position: "absolute", left: x + 40 + ph * 60, top: 950 - ph * 260, fontFamily: DISPLAY, fontSize: 64 - ph * 18, color: "#cfe3ff", opacity: (1 - ph) * 0.9 }}>
            Z
          </div>
        );
      })}
    </Cam>
    <Dust T={T} drift={-lt} />
    <PostText text="REPORTEDLY ASLEEP" t={plan.w.dozed} top={420} size={130} color={C.amber} frame={frame} fps={fps} />
    <Chip text="THE OFFICERS ON DUTY" t={plan.shots[7] + 0.8} top={330} frame={frame} fps={fps} />
  </AbsoluteFill>
);

const S9: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const kf: [number, number][] = [[plan.shots[8], 0], [plan.w.head, 0.08], [plan.w.shoulders, 0.42], [plan.w.body, 0.72], [plan.w.body + 1.8, 1]];
  let p = 0;
  for (let i = 1; i < kf.length; i++) if (T >= kf[i - 1][0]) p = lerp(kf[i - 1][1], kf[i][1], ease(clamp((T - kf[i - 1][0]) / Math.max(0.3, kf[i][0] - kf[i - 1][0]))));
  const floor = 1400;
  const gapTop = floor - 64;
  const k = 700 / 400;
  const hx = lerp(640, -300, p);
  const inGap = (x: number) => x < 575 && x > 505;
  const sq = inGap(hx + 120) || inGap(hx + 350) || inGap(hx + 600) ? 0.62 : 1;
  const twist = Math.sin(clamp((p - 0.3) / 0.3) * Math.PI) * 10;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #111724, #0b0f17)" }}>
      <Cam s={1} x={lerp(60, -60, p)}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <rect x={-200} y={floor} width={1480} height={600} fill="#090c12" />
          <rect x={505} y={420} width={70} height={gapTop - 420} fill={C.steel} stroke={C.ink} strokeWidth={6} />
          <rect x={505} y={gapTop - 30} width={70} height={30} fill={C.steelHi} stroke={C.ink} strokeWidth={4} />
          <rect x={-200} y={gapTop - 2} width={705} height={2} fill="none" />
          <rect x={-200} y={floor} width={705} height={4} fill={C.amber} opacity={0.35} />
          <g transform={`translate(${hx} ${floor}) rotate(${-90 + twist}) scale(${sq * k} ${k})`}>
            <Choi pose="stand" gloss={0.8} id="s9" />
          </g>
          <rect x={505} y={gapTop} width={70} height={64} fill="none" stroke={C.amber} strokeWidth={4} strokeDasharray="10 8" />
        </svg>
      </Cam>
      <Dust T={T} drift={p * 4} />
      <Chip text="HEAD FIRST" t={plan.w.head} top={420} frame={frame} fps={fps} />
      <Chip text="SHOULDERS TWISTED" t={plan.w.shoulders} top={510} frame={frame} fps={fps} />
      <Chip text="BODY FLAT" t={plan.w.body} top={600} frame={frame} fps={fps} />
      <PostText text="15 CM" t={plan.shots[8] + 0.3} top={1500} size={110} color={C.amber} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S10: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const route: [number, number][] = [[270, 620], [270, 820], [540, 820], [540, 1260], [820, 1260], [820, 1520], [820, 1700]];
  const p = ease(clamp((lt - 0.3) / 3.2));
  const segs = route.slice(1).map((q, i) => Math.hypot(q[0] - route[i][0], q[1] - route[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * p;
  const pts: [number, number][] = [route[0]];
  for (let i = 0; i < segs.length && left > 0; i++) {
    const q = Math.min(1, left / segs[i]);
    pts.push([lerp(route[i][0], route[i + 1][0], q), lerp(route[i][1], route[i + 1][1], q)]);
    left -= segs[i];
  }
  const tip = pts[pts.length - 1];
  const flash = clamp(1 - lt / 0.35);
  return (
    <AbsoluteFill style={{ background: "#08111f" }}>
      <Cam s={lerp(1.08, 1, eo(clamp(lt / 5)))} y={lerp(40, -40, clamp(lt / 5))}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 28 }, (_, i) => (
            <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={1920} stroke="rgba(120,170,255,0.06)" strokeWidth={2} />
          ))}
          <g fill="none" stroke="#6f9fe0" strokeWidth={6} opacity={0.8}>
            <rect x={150} y={500} width={780} height={1060} />
            <rect x={170} y={520} width={200} height={200} />
            <rect x={390} y={520} width={200} height={200} />
            <rect x={610} y={520} width={300} height={200} />
            <rect x={170} y={1080} width={300} height={260} />
            <rect x={610} y={1080} width={300} height={140} />
          </g>
          <text x={270} y={500} fill="#9ec0f0" fontFamily={BODY} fontSize={30} fontWeight={800} textAnchor="middle">CELL</text>
          <text x={320} y={1220} fill="#9ec0f0" fontFamily={BODY} fontSize={30} fontWeight={800} textAnchor="middle">DUTY DESK</text>
          <rect x={780} y={1545} width={80} height={30} fill="#08111f" />
          <text x={820} y={1620} fill={C.amber} fontFamily={BODY} fontSize={32} fontWeight={800} textAnchor="middle">EXIT</text>
          <rect x={0} y={1700} width={1080} height={220} fill="#0d1624" />
          {[160, 540, 920].map((x) => (
            <g key={x}>
              <circle cx={x} cy={1760} r={70} fill="rgba(255,200,120,0.12)" />
              <circle cx={x} cy={1760} r={10} fill="#ffd9a0" />
            </g>
          ))}
          <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke={C.amber} strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" />
          <circle cx={tip[0]} cy={tip[1]} r={16} fill={C.amber} />
          <circle cx={tip[0]} cy={tip[1]} r={36 + 10 * Math.sin(T * 8)} fill="none" stroke={C.amber} strokeWidth={4} opacity={0.6} />
        </svg>
      </Cam>
      <PostText text="OUT INTO THE NIGHT" t={plan.w.night} top={330} size={110} color={C.amber} frame={frame} fps={fps} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.7 }} />
    </AbsoluteFill>
  );
};

const S11: React.FC<ShotProps> = ({ lt, dur, T, frame, fps, plan }) => {
  const day = 1 + Math.min(5, Math.floor(clamp((T - plan.w.manhunt) / Math.max(1, plan.w.caught - plan.w.manhunt)) * 6));
  const caught = pop(frame, fps, plan.w.caught);
  const r = lerp(5200, 5600, clamp(lt / dur));
  return (
    <AbsoluteFill style={{ background: "#03060c" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, filter: "saturate(0.45) brightness(0.8)" }}>
        <Globe r={r} cx={540} cy={1000} lon0={128.0} lat0={36.2} id="g11" outline={40} />
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {[[0, 0], [-120, 150], [140, -110], [60, 230], [-200, -60], [220, 120]].map(([dx, dy], i) =>
          [0, 1].map((k) => {
            const ph = ((T * 0.6 + i * 0.17 + k * 0.5) % 1);
            return <circle key={`${i}${k}`} cx={620 + dx} cy={1080 + dy} r={30 + ph * 170} fill="none" stroke={C.red} strokeWidth={5} opacity={(1 - ph) * 0.8 * (1 - caught)} />;
          }),
        )}
        <circle cx={620} cy={1080} r={14} fill={C.red} />
      </svg>
      <PostText text={`DAY ${day}`} t={plan.shots[10] + 0.2} top={360} size={170} color="#ffffff" frame={frame} fps={fps} />
      <Chip text="MASSIVE MANHUNT" t={plan.w.manhunt} top={560} frame={frame} fps={fps} color={C.red} />
      {caught > 0.01 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 1300, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 180, color: C.red, border: `12px solid ${C.red}`, padding: "0 40px", transform: `rotate(-8deg) scale(${2 - caught})`, opacity: clamp(caught * 1.5), background: "rgba(0,0,0,0.35)" }}>CAUGHT</div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const S12: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const s = lerp(1.5, 1.85, eo(clamp(lt / 8)));
  const icons: [string, number, string][] = [["🧍", plan.w.tiny, "TINY BODY"], ["🧴", plan.w.slip2, "OINTMENT"], ["💤", plan.w.sleeping, "SLEEPING GUARDS"]];
  return (
    <AbsoluteFill>
      <Cam s={s} y={-(SC.y - 1160)} ox={SC.x} oy={SC.y}>
        <Door glow={1} T={T} />
      </Cam>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 34 }}>
        {icons.map(([e, t, label]) => {
          const p = pop(frame, fps, t);
          return (
            <div key={label} style={{ width: 290, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `scale(${p})`, opacity: clamp(p * 1.5) }}>
              <div style={{ width: 170, height: 170, borderRadius: "50%", background: "rgba(10,14,22,0.85)", border: `6px solid ${C.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>{e}</div>
              <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: C.text, textAlign: "center" }}>{label}</div>
            </div>
          );
        })}
      </div>
      <PostText text="15 CM" t={plan.w.gap15} top={700} size={230} color={C.amber} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S13: React.FC<ShotProps> = ({ lt, T, frame, fps, plan }) => {
  const p = Easing.in(Easing.cubic)(clamp(lt / 2.4));
  const s = lerp(1.9, 14, p);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Cam s={s} y={-(SC.y - 960) * clamp(p * 3)} ox={SC.x} oy={SC.y}>
        <Door glow={1 - p * 0.5} T={T} />
      </Cam>
      <AbsoluteFill style={{ background: "#000", opacity: clamp((lt - 2.0) / 0.6) }} />
      <Chip text="MORE TRUE ESCAPE STORIES" t={plan.w.stories} top={900} frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

const S14: React.FC<ShotProps> = ({ T, plan }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1a2334 0%, #05070b 70%)" }}>
    <Dust T={T} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontFamily: DISPLAY, fontSize: 120, color: C.amber, letterSpacing: 2 }}>GLOBETALES</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center", fontFamily: BODY, fontWeight: 700, fontSize: 38, color: C.dim, letterSpacing: 4 }}>TRUE STORIES · MAPS · HISTORY</div>
    <CtaCard T={T} top={1000} likeT={plan.w.like} shareT={plan.w.share} subT={plan.w.sub} />
  </AbsoluteFill>
);

const SHOTS = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14];
const NO_FADE = new Set([1, 9, 12]);

export const TinySlotScene: React.FC<{ plan: Plan; T: number; frame: number; hud?: boolean }> = ({ plan, T, frame, hud = true }) => {
  const { fps } = useVideoConfig();
  const starts = plan.shots.map((t, i) => (Number.isFinite(t) ? t : i * 6));
  let i = 0;
  while (i < starts.length - 1 && T >= starts[i + 1]) i++;
  if (T < starts[0]) i = 0;
  const dur = (i + 1 < starts.length ? starts[i + 1] : starts[i] + 6) - starts[i];
  const Cur = SHOTS[i];
  const fade = i > 0 && !NO_FADE.has(i) ? clamp((T - starts[i]) / 0.45) : 1;
  const Prev = i > 0 ? SHOTS[i - 1] : null;
  const pd = i > 0 ? starts[i] - starts[i - 1] : 0;
  const props = (k: number): ShotProps => ({ lt: Math.max(0, T - starts[k]), dur: k === i ? dur : pd, T, frame, fps, plan });
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Cur {...props(i)} />
      {Prev && fade < 1 && (
        <AbsoluteFill style={{ opacity: 1 - fade }}>
          <Prev {...props(i - 1)} />
        </AbsoluteFill>
      )}
      <Vignette />
      {hud && (
        <>
          <SubscribeNudge T={T} until={plan.shots[13]} top={1440} />
          {plan.missing.length > 0 && <div style={{ position: "absolute", left: 20, bottom: 20, color: "#f00", background: "#000", fontSize: 24, padding: 8 }}>MISSING CUES: {plan.missing.join(" | ")}</div>}
        </>
      )}
    </AbsoluteFill>
  );
};

export const TinySlotEscape: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const plan = React.useMemo(() => buildPlan(timing.sections), [timing]);
  const s = plan.shots;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.25], [s[1], "whoosh", 0.2], [s[2], "whoosh", 0.22], [plan.w.daegu, "pop", 0.25], [s[3], "whoosh", 0.16],
    [plan.w.h165, "pop", 0.2], [plan.w.s15, "pop", 0.2], [plan.w.s45, "pop", 0.2], [s[8], "whoosh", 0.18], [s[9], "whoosh", 0.22],
    [s[10], "riser", 0.15], [plan.w.caught, "ding", 0.3], [plan.w.tiny, "pop", 0.2], [plan.w.slip2, "pop", 0.2], [plan.w.sleeping, "pop", 0.2],
    [plan.w.gap15, "boom", 0.25], [s[12], "whoosh", 0.25],
  ];
  const cue = (t: number, name: string, vol: number, len = 45) =>
    Number.isFinite(t) ? (
      <Sequence key={`${name}${t.toFixed(2)}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([t, n, v]) => cue(t, n, v))}
      {nudgeTimes(s[13]).map((t) => cue(t + 1.1, "ding", 0.18))}
      {cue(plan.w.sub + 1.2, "ding", 0.3)}
      <TinySlotScene plan={plan} T={T} frame={frame} />
      <CoverTitle lines={["SQUEEZED THROUGH", "A 15 CM GAP!"]} sub="The Choi Gap-bok escape · 2012" accent={C.amber} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail — key content inside y 300–1620.
export const TinySlotThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const plan = React.useMemo(() => buildPlan(timing.sections), [timing]);
  const T = plan.w.shoulders + 0.4;
  return (
    <AbsoluteFill>
      <Bare.Provider value>
        <TinySlotScene plan={plan} T={T} frame={Math.round(T * 30)} hud={false} />
      </Bare.Provider>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.8) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 250, lineHeight: 1, color: C.amber, textShadow: "0 10px 40px rgba(0,0,0,0.9)" }}>15 CM</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 104, lineHeight: 1.05, color: "#fff", textShadow: "0 8px 30px rgba(0,0,0,0.9)" }}>HE SQUEEZED THROUGH</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1470, textAlign: "center" }}>
        <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, letterSpacing: 5, color: "#fff", background: C.red, padding: "12px 30px" }}>A TRUE PRISON ESCAPE · 2012</span>
      </div>
    </AbsoluteFill>
  );
};
