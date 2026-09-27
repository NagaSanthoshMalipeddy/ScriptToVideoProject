import React from "react";
import { Easing, spring } from "remotion";
import { INK } from "./ui";
import { TE_BODY, TE_DISPLAY } from "../story/fonts";
import { VehicleIcon, VehicleKind } from "./Icons";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const formatDuration = (hours: number) => {
  if (hours < 1) return `${Math.max(0, Math.round(hours * 60))} min`;
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  if (m === 60) {
    h += 1;
    m = 0;
  }
  if (m) return `${h}h ${m}m`;
  return h === 1 ? "1 hr" : `${h} hrs`;
};

// ---- Entrance transitions + screen shake -------------------------------------------

export type Enter = "whip" | "zoom" | "drop";

export const enterStyle = (enter: Enter | undefined, frame: number, width: number, height: number): React.CSSProperties => {
  if (!enter) return {};
  const e = spring({ frame, fps: 30, config: { damping: enter === "drop" ? 11 : 20, mass: 0.55 } });
  const blur = (1 - clamp(e)) * 16;
  if (enter === "whip") return { transform: `translateX(${(1 - e) * width * 0.7}px) skewX(${(1 - e) * -12}deg)`, filter: `blur(${blur}px)` };
  if (enter === "zoom") return { transform: `scale(${1 + (1 - e) * 0.35})`, filter: `blur(${blur}px)` };
  return { transform: `translateY(${(1 - e) * -height * 0.35}px)` };
};

export const shakeOffset = (intensity: number | undefined, frame: number) => {
  if (!intensity) return { x: 0, y: 0 };
  const amp = intensity * (0.35 + 0.65 * Math.exp(-frame / 14));
  return { x: Math.sin(frame * 2.7) * amp, y: Math.cos(frame * 3.3) * amp * 0.8 };
};

// ---- Trip HUD: spinning clock + log-scale speedometer ------------------------------

const GAUGE_MIN = 10;
const GAUGE_MAX = 30000;
export const speedFrac = (v: number) => clamp(Math.log10(v / GAUGE_MIN) / Math.log10(GAUGE_MAX / GAUGE_MIN));

const arcPath = (cx: number, cy: number, r: number, f0: number, f1: number) => {
  const a0 = Math.PI * (1 - f0);
  const a1 = Math.PI * (1 - f1);
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy - r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

export const Speedometer: React.FC<{ frame: number; speed: number; size: number; label?: string; delay?: number; jitter?: number }> = ({ frame, speed, size, label, delay = 6, jitter = 0 }) => {
  const s = spring({ frame: frame - delay, fps: 30, config: { damping: 7, mass: 0.8, stiffness: 90 } });
  const f = speedFrac(speed) * s + Math.sin(frame * 1.9) * jitter;
  const ang = Math.PI * (1 - f);
  const nx = 100 + 70 * Math.cos(ang);
  const ny = 100 - 70 * Math.sin(ang);
  const mach1 = speedFrac(1235);
  const ticks = [100, 1000, 10000];
  return (
    <svg width={size} height={size * 0.69} viewBox="0 -14 200 138">
      <path d={arcPath(100, 100, 82, 0, mach1)} stroke="#2dd4bf" strokeWidth={16} fill="none" />
      <path d={arcPath(100, 100, 82, mach1, 1)} stroke="#e63946" strokeWidth={16} fill="none" />
      <path d={arcPath(100, 100, 90, 0, 1)} stroke={INK} strokeWidth={4} fill="none" />
      {ticks.map((v) => {
        const a = Math.PI * (1 - speedFrac(v));
        return (
          <g key={v}>
            <line x1={100 + 64 * Math.cos(a)} y1={100 - 64 * Math.sin(a)} x2={100 + 74 * Math.cos(a)} y2={100 - 74 * Math.sin(a)} stroke={INK} strokeWidth={4} />
            <text x={100 + 50 * Math.cos(a)} y={104 - 50 * Math.sin(a)} textAnchor="middle" fontFamily={TE_DISPLAY} fontSize={13} fontWeight={800} fill={INK}>
              {v >= 1000 ? `${v / 1000}K` : v}
            </text>
          </g>
        );
      })}
      <text x={100 + 96 * Math.cos(Math.PI * (1 - mach1))} y={96 - 96 * Math.sin(Math.PI * (1 - mach1))} textAnchor="middle" fontFamily={TE_DISPLAY} fontSize={12} fontWeight={800} fill="#e63946">
        MACH 1
      </text>
      <line x1={100} y1={100} x2={nx} y2={ny} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={100} cy={100} r={10} fill={INK} />
      {label && (
        <text x={100} y={122} textAnchor="middle" fontFamily={TE_DISPLAY} fontSize={20} fontWeight={800} fill={INK}>
          {label}
        </text>
      )}
    </svg>
  );
};

const Clock: React.FC<{ elapsed: number; size: number }> = ({ elapsed, size }) => {
  // Minute hand does one turn per 6 trip-hours, so a long trip visibly spins and a fast one barely moves.
  const mA = (elapsed / 6) * Math.PI * 2;
  const hA = (elapsed / 48) * Math.PI * 2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={44} fill="#fff" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={50 + 34 * Math.sin(a)} y1={50 - 34 * Math.cos(a)} x2={50 + 39 * Math.sin(a)} y2={50 - 39 * Math.cos(a)} stroke={INK} strokeWidth={3} />;
      })}
      <line x1={50} y1={50} x2={50 + 20 * Math.sin(hA)} y2={50 - 20 * Math.cos(hA)} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <line x1={50} y1={50} x2={50 + 32 * Math.sin(mA)} y2={50 - 32 * Math.cos(mA)} stroke="#e63946" strokeWidth={4} strokeLinecap="round" />
      <circle cx={50} cy={50} r={5} fill={INK} />
    </svg>
  );
};

export type Hud = { hours: number; speed: number; speedLabel: string };

export const TripHud: React.FC<{ frame: number; p: number; hud: Hud; color: string }> = ({ frame, p, hud, color }) => {
  const pop = spring({ frame: frame - 6, fps: 30, config: { damping: 13, mass: 0.6 } });
  const done = p >= 0.999;
  const card: React.CSSProperties = { background: "#fff", border: `5px solid ${INK}`, borderRadius: 24, boxShadow: `0 8px 0 ${INK}`, padding: "10px 18px", display: "flex", alignItems: "center", gap: 14 };
  return (
    <div style={{ display: "flex", gap: 22, transform: `translateY(${(1 - pop) * 60}px)`, opacity: pop }}>
      <div style={card}>
        <Clock elapsed={hud.hours * p} size={140} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: TE_BODY, fontSize: 28, fontWeight: 800, color: "rgba(32,35,42,0.55)" }}>TRIP TIME</span>
          <span style={{ fontFamily: TE_DISPLAY, fontSize: 66, fontWeight: 800, color: done ? color : INK, lineHeight: 1 }}>
            {formatDuration(hud.hours * p)}
          </span>
        </div>
      </div>
      <div style={{ ...card, padding: "6px 12px" }}>
        <Speedometer frame={frame} speed={hud.speed} size={270} label={hud.speedLabel} />
      </div>
    </div>
  );
};

// ---- Speed streaks (drawn in the vehicle's local space, trailing to the left) ------

export const SpeedStreaks: React.FC<{ frame: number; size: number; color?: string; strength?: number }> = ({ frame, size, color = "#ffffff", strength = 1 }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60" style={{ position: "absolute", right: "70%", top: "20%", overflow: "visible" }}>
    {[14, 30, 46].map((y, i) => {
      const len = (30 + 25 * Math.abs(Math.sin(frame * 0.7 + i * 1.3))) * strength;
      return <line key={y} x1={100 - len} y1={y} x2={100} y2={y} stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.85} />;
    })}
  </svg>
);

// ---- Race track: every vehicle leaves Kashmir together -----------------------------

type Racer = { kind: VehicleKind; name: string; hours: number; color: string };

// sqrt compresses the huge range so every racer's finish is visible within the beat.
export const racerFinishAt = (hours: number) => 0.4 + 1.2 * Math.sqrt(hours);

export const RACERS: Racer[] = [
  { kind: "rocket", name: "Agni-V", hours: 3500 / 24700, color: "#e63946" },
  { kind: "rocket", name: "BrahMos", hours: 1, color: "#ff5a1f" },
  { kind: "jet", name: "Su-30", hours: 4 / 3, color: "#ff9933" },
  { kind: "plane", name: "Flight", hours: 4, color: "#a78bfa" },
  { kind: "train", name: "Train", hours: 35, color: "#2dd4bf" },
  { kind: "car", name: "Car", hours: 44, color: "#4ea3ff" },
];

export const RaceTrack: React.FC<{ frame: number; t: number; width: number; height: number }> = ({ frame, t, width, height }) => {
  const w = width - 80;
  const laneH = Math.round(height * 0.092);
  const labelW = 150;
  const trackW = w - labelW - 40;
  const iconW = 92;
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 14, mass: 0.7 } });
  return (
    <div style={{ width: w, background: "#fff", border: `5px solid ${INK}`, borderRadius: 28, boxShadow: `0 10px 0 ${INK}`, padding: "16px 20px", transform: `scale(${0.92 + pop * 0.08})`, opacity: pop, boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginLeft: labelW, marginBottom: 6, fontFamily: TE_DISPLAY, fontSize: 30, fontWeight: 800, color: INK }}>
        <span>KASHMIR</span>
        <span>KANYAKUMARI</span>
      </div>
      <div style={{ position: "relative" }}>
        {/* finish line */}
        <div style={{ position: "absolute", left: labelW + trackW - 6, top: 0, bottom: 0, width: 16, backgroundImage: `repeating-linear-gradient(0deg, ${INK} 0 12px, #fff 12px 24px)`, border: `2px solid ${INK}` }} />
        {RACERS.map((r, i) => {
          const finishAt = racerFinishAt(r.hours);
          const raw = clamp((t - 0.4) / (finishAt - 0.4));
          const p = Easing.inOut(Easing.quad)(raw);
          const x = (trackW - iconW - 12) * p;
          const done = raw >= 1;
          const stamp = spring({ frame: frame - Math.round(finishAt * 30), fps: 30, config: { damping: 9, mass: 0.5 } });
          const fast = r.hours < 2 && raw > 0 && raw < 1;
          return (
            <div key={r.name} style={{ position: "relative", height: laneH, display: "flex", alignItems: "center", borderTop: i ? `3px dashed rgba(32,35,42,0.25)` : "none" }}>
              <div style={{ width: labelW, display: "flex", alignItems: "center", gap: 8, fontFamily: TE_DISPLAY, fontSize: 30, fontWeight: 800, color: INK }}>
                <div style={{ width: 14, height: 34, borderRadius: 5, background: r.color, border: `2px solid ${INK}` }} />
                {r.name}
              </div>
              <div style={{ position: "relative", width: trackW, height: laneH }}>
                <div style={{ position: "absolute", left: 0, top: laneH / 2 - 3, width: x + iconW / 2, height: 6, background: r.color, borderRadius: 3, opacity: 0.6 }} />
                <div style={{ position: "absolute", left: x, top: (laneH - iconW * 0.72) / 2, width: iconW, transform: r.kind === "car" || r.kind === "train" ? `translateY(${Math.sin(frame * 0.9 + i) * 2}px)` : undefined }}>
                  {fast && <SpeedStreaks frame={frame} size={iconW} color={r.color} />}
                  <VehicleIcon kind={r.kind} size={iconW} color={r.color} />
                </div>
                {done && (
                  <div style={{ position: "absolute", right: iconW + 30, top: laneH / 2 - 26, transform: `scale(${stamp})`, background: r.color, color: "#fff", border: `4px solid ${INK}`, borderRadius: 14, padding: "2px 14px", fontFamily: TE_DISPLAY, fontSize: 34, fontWeight: 800, whiteSpace: "nowrap" }}>
                    {formatDuration(r.hours)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Launch scene: night sky, missile rising with smoke ----------------------------

export const LaunchScene: React.FC<{ frame: number; t: number; width: number; height: number }> = ({ frame, t, width, height }) => {
  const w = width - 80;
  const h = Math.round(height * 0.62);
  const rise = Easing.in(Easing.cubic)(clamp((t - 0.35) / 2.2));
  const rocketW = 250;
  const y = h - 170 - rise * (h + 60);
  const stars = Array.from({ length: 40 }).map((_, i) => ({ x: (i * 137.5) % w, y: (i * 71.3) % (h * 0.8), r: 1.5 + (i % 3) }));
  return (
    <div style={{ position: "relative", width: w, height: h, background: "linear-gradient(180deg, #0b1026 0%, #1b2a4a 70%, #3a2b4a 100%)", border: `5px solid ${INK}`, borderRadius: 30, overflow: "hidden", boxShadow: `0 10px 0 ${INK}` }}>
      {stars.map((s, i) => (
        <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: "50%", background: "#fff", opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.15 + i)) }} />
      ))}
      <div style={{ position: "absolute", left: w / 2 - 260, bottom: -140, width: 520, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,170,60,0.55) 0%, rgba(255,120,40,0) 70%)", opacity: 0.4 + rise }} />
      {Array.from({ length: 9 }).map((_, i) => {
        const age = clamp((t - 0.25 - i * 0.12) / 1.4);
        if (age <= 0) return null;
        const side = i % 2 ? 1 : -1;
        const r = 30 + age * 90;
        return (
          <div key={i} style={{ position: "absolute", left: w / 2 - r + side * age * (60 + i * 12), top: h - 60 - r * 0.6 - i * 4, width: r * 2, height: r * 2, borderRadius: "50%", background: "#e8e3dc", border: `4px solid ${INK}`, opacity: 1 - age * 0.55 }} />
        );
      })}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 60, background: "#2a3a2a", borderTop: `5px solid ${INK}` }} />
      <div style={{ position: "absolute", left: w / 2 - rocketW / 2, top: y, width: rocketW, height: rocketW, transform: "rotate(-90deg)" }}>
        <VehicleIcon kind="rocket" size={rocketW} color="#e63946" />
      </div>
    </div>
  );
};
