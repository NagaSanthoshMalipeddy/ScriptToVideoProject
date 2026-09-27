import React from "react";
import { spring } from "remotion";
import { BODY } from "../airace/fonts";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const YT_RED = "#ff0000";

// Start times of the periodic subscribe nudges (every `every` s, stopping before the CTA).
export const nudgeTimes = (until: number, every = 20) => {
  const out: number[] = [];
  for (let t = every; t < until - 2; t += every) out.push(t);
  return out;
};

export const Bell: React.FC<{ size: number; ring: number }> = ({ size, ring }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `rotate(${Math.sin(ring * 22) * 22 * clamp(1 - ring)}deg)`, transformOrigin: "50% 12%" }}>
    <path d="M32 6 C20 6 15 16 15 27 L15 38 L9 46 L55 46 L49 38 L49 27 C49 16 44 6 32 6 Z" fill="#fff" stroke="#111" strokeWidth={3.5} strokeLinejoin="round" />
    <circle cx={32} cy={52} r={6} fill="#fff" stroke="#111" strokeWidth={3.5} />
    <rect x={29} y={2} width={6} height={6} rx={2} fill="#111" />
    {ring > 0 && ring < 1 && (
      <g stroke="#ffd23f" strokeWidth={3.5} strokeLinecap="round" opacity={1 - ring}>
        <path d="M6 20 Q2 28 6 36" fill="none" />
        <path d="M58 20 Q62 28 58 36" fill="none" />
      </g>
    )}
  </svg>
);

const SubButton: React.FC<{ pressed: number; scale?: number }> = ({ pressed, scale = 1 }) => {
  const done = pressed >= 1;
  return (
    <div style={{ transform: `scale(${scale * (1 - 0.08 * Math.sin(Math.PI * clamp(pressed)))})`, background: done ? "#3a3a3a" : YT_RED, color: "#fff", borderRadius: 999, padding: "14px 30px", fontFamily: BODY, fontSize: 34, fontWeight: 800, letterSpacing: 1, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10 }}>
      {done ? "SUBSCRIBED ✓" : "SUBSCRIBE"}
    </div>
  );
};

/** Bell + Subscribe button that pops in at the top-right for ~2.6s every 20s. */
export const SubscribeNudge: React.FC<{ T: number; until: number; every?: number; top?: number }> = ({ T, until, every = 20, top = 150 }) => {
  const DUR = 2.6;
  const start = nudgeTimes(until, every).find((s) => T >= s && T < s + DUR);
  if (start === undefined) return null;
  const lt = T - start;
  const f = Math.round(lt * 30);
  const pop = spring({ frame: f, fps: 30, config: { damping: 11, mass: 0.6 } });
  const out = clamp((DUR - lt) / 0.3);
  const pressed = clamp((lt - 1.1) / 0.25);
  const ripple = clamp((lt - 1.1) / 0.5);
  return (
    <div style={{ position: "absolute", right: 36, top, display: "flex", alignItems: "center", gap: 16, transform: `translateX(${(1 - pop) * 360}px)`, opacity: out }}>
      <div style={{ width: 84, height: 84, borderRadius: "50%", background: "rgba(10,14,22,0.9)", border: "3px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.45)" }}>
        <Bell size={56} ring={clamp((lt - 1.2) / 1.2)} />
      </div>
      <div style={{ position: "relative" }}>
        <SubButton pressed={pressed} />
        {ripple > 0 && ripple < 1 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 30 + ripple * 160, height: 30 + ripple * 160, marginLeft: -(15 + ripple * 80), marginTop: -(15 + ripple * 80), borderRadius: "50%", border: "4px solid #fff", opacity: 1 - ripple }} />}
      </div>
    </div>
  );
};

const Pill: React.FC<{ icon: React.ReactNode; text: string; bg: string; pop: number }> = ({ icon, text, bg, pop }) => (
  <div style={{ transform: `scale(${pop})`, opacity: clamp(pop * 2), background: bg, color: "#fff", borderRadius: 999, padding: "14px 26px", fontFamily: BODY, fontSize: 36, fontWeight: 800, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", border: "2px solid rgba(255,255,255,0.25)" }}>
    {icon}
    {text}
  </div>
);

const ThumbUp = () => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <path d="M2 10h4v11H2zM8 21h9.2c.9 0 1.6-.6 1.8-1.4l1.9-7.1c.3-1.2-.6-2.5-1.9-2.5H13l.9-4.3c.2-.9-.4-1.7-1.3-1.7-.5 0-.9.3-1.1.7L8 10v11z" fill="#fff" />
  </svg>
);
const ShareIcon = () => (
  <svg width={38} height={38} viewBox="0 0 24 24">
    <path d="M14 4l8 8-8 8v-5c-6 0-9.5 2-12 6 1-6 4-11 12-12V4z" fill="#fff" />
  </svg>
);

/** End card: Like, Share, Subscribe (+bell) pop in as each word is spoken. */
export const CtaCard: React.FC<{ T: number; likeT: number; shareT: number; subT: number; top?: number }> = ({ T, likeT, shareT, subT, top = 1120 }) => {
  const p = (t: number) => (T < t ? 0 : spring({ frame: Math.round((T - t) * 30), fps: 30, config: { damping: 10, mass: 0.6 } }));
  const sub = p(subT);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ display: "flex", gap: 20 }}>
        <Pill icon={<ThumbUp />} text="LIKE" bg="#2b2f3a" pop={p(likeT)} />
        <Pill icon={<ShareIcon />} text="SHARE" bg="#2b2f3a" pop={p(shareT)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 70, transform: `scale(${sub})`, opacity: clamp(sub * 2) }}>
        <SubButton pressed={clamp((T - subT - 1.2) / 0.25)} scale={1.35} />
        <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(10,14,22,0.9)", border: "3px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bell size={64} ring={clamp((T - subT - 1.3) / 1.2)} />
        </div>
      </div>
    </div>
  );
};
