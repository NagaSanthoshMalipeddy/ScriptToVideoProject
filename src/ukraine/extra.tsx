import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, clamp } from "../airace/lib";
import { BODY, DISPLAY } from "../airace/fonts";

/** Horizontal timeline that draws in, with event dots + labels appearing in turn. */
export const Timeline: React.FC<{
  events: { tag: string; label: string }[];
  progress: number;
  width: number;
  color?: string;
}> = ({ events, progress, width, color = COLORS.cyan }) => {
  const n = events.length;
  return (
    <div style={{ position: "relative", width, paddingTop: 40 }}>
      <div style={{ position: "relative", height: 4, background: "rgba(120,160,220,0.25)", borderRadius: 2 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 4,
            width: `${clamp(progress) * 100}%`,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 14px ${color}`,
          }}
        />
      </div>
      {events.map((e, i) => {
        const at = (i + 0.5) / n;
        const on = clamp((progress - at + 0.12) * 5);
        const left = at * width;
        return (
          <div key={i} style={{ position: "absolute", left, top: 24, transform: "translateX(-50%)", opacity: on }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 14px ${color}`,
                margin: "0 auto",
                transform: `scale(${0.6 + on * 0.4})`,
              }}
            />
            <div
              style={{
                marginTop: 12,
                width: 190,
                transform: "translateX(-50%)",
                marginLeft: "50%",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: DISPLAY, fontSize: 30, color: COLORS.white }}>{e.tag}</div>
              <div style={{ fontFamily: BODY, fontSize: 20, color: COLORS.dim, marginTop: 4, lineHeight: 1.2 }}>
                {e.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** A calendar page turning to a date, with a red stamp slamming down. */
export const Calendar: React.FC<{
  month: string;
  day: string;
  year: string;
  stamp: string;
  progress: number;
}> = ({ month, day, year, stamp, progress }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const pop = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.7 } });
  const stampIn = spring({ frame: frame - 22, fps, config: { damping: 9, mass: 0.5 } });
  const stampScale = 2.2 - stampIn * 1.2;
  return (
    <div style={{ position: "relative", transform: `scale(${0.8 + pop * 0.2})`, opacity: pop }}>
      <div
        style={{
          width: 340,
          borderRadius: 22,
          overflow: "hidden",
          background: "#f4f6fb",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ background: "#ff4d5e", color: "#fff", textAlign: "center", padding: "14px 0", fontFamily: DISPLAY, fontSize: 40, letterSpacing: 3 }}>
          {month}
        </div>
        <div style={{ textAlign: "center", padding: "18px 0 8px", fontFamily: DISPLAY, fontSize: 150, color: "#12203a", lineHeight: 1 }}>
          {day}
        </div>
        <div style={{ textAlign: "center", paddingBottom: 22, fontFamily: BODY, fontSize: 30, color: "#5b6b86", letterSpacing: 4 }}>
          {year}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "62%",
          transform: `translate(-50%,-50%) rotate(-12deg) scale(${stampScale})`,
          opacity: stampIn,
          border: "5px solid #ff4d5e",
          color: "#ff4d5e",
          padding: "8px 18px",
          borderRadius: 10,
          fontFamily: DISPLAY,
          fontSize: 30,
          letterSpacing: 2,
          background: "rgba(255,77,94,0.12)",
          whiteSpace: "nowrap",
        }}
      >
        {stamp}
      </div>
    </div>
  );
};

/** Arrows converging from source labels into a central target. */
export const AidArrows: React.FC<{
  sources: { label: string; color: string }[];
  target: string;
  progress: number;
  width: number;
  height: number;
}> = ({ sources, target, progress, width, height }) => {
  const cx = width / 2;
  const cy = height / 2;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {sources.map((s, i) => {
        const angle = Math.PI * (0.2 + (0.6 * i) / Math.max(1, sources.length - 1)) + Math.PI * 0.6;
        const sx = cx + Math.cos(angle) * width * 0.42;
        const sy = cy + Math.sin(angle) * height * 0.42;
        const on = clamp((progress - i * 0.15) * 2.5);
        const hx = sx + (cx - sx) * on;
        const hy = sy + (cy - sy) * on;
        return (
          <g key={i} opacity={clamp(on * 1.2)}>
            <line x1={sx} y1={sy} x2={hx} y2={hy} stroke={s.color} strokeWidth={4} strokeLinecap="round" />
            <circle cx={hx} cy={hy} r={7} fill={s.color} />
            <foreignObject x={sx - 90} y={sy - 34} width={180} height={40}>
              <div style={{ textAlign: "center", fontFamily: BODY, fontSize: 24, fontWeight: 800, color: s.color }}>
                {s.label}
              </div>
            </foreignObject>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={20 + 8 * (0.5 + 0.5 * Math.sin(progress * 12))} fill="none" stroke={COLORS.cyan} strokeWidth={2} opacity={0.5} />
      <circle cx={cx} cy={cy} r={12} fill={COLORS.cyan} />
      <foreignObject x={cx - 100} y={cy + 20} width={200} height={40}>
        <div style={{ textAlign: "center", fontFamily: DISPLAY, fontSize: 30, color: COLORS.white }}>{target}</div>
      </foreignObject>
    </svg>
  );
};

/** Two demand panels facing off with a VS in the middle. */
export const TwoSideTable: React.FC<{
  left: { title: string; color: string; items: string[] };
  right: { title: string; color: string; items: string[] };
  progress: number;
  width: number;
}> = ({ left, right, progress, width }) => {
  const Panel: React.FC<{ side: typeof left; align: "left" | "right"; base: number }> = ({ side, align, base }) => (
    <div style={{ width: width / 2 - 40, display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: 40,
          color: side.color,
          textAlign: align,
          textShadow: `0 0 18px ${side.color}66`,
        }}
      >
        {side.title}
      </div>
      {side.items.map((it, i) => {
        const on = clamp((progress - (base + i * 0.12)) * 4);
        return (
          <div
            key={it}
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              background: "rgba(10,18,40,0.8)",
              border: `1.5px solid ${side.color}aa`,
              color: COLORS.white,
              fontFamily: BODY,
              fontSize: 24,
              fontWeight: 700,
              textAlign: align,
              opacity: on,
              transform: `translateX(${(1 - on) * (align === "left" ? -30 : 30)}px)`,
            }}
          >
            {it}
          </div>
        );
      })}
    </div>
  );
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", width, alignItems: "flex-start" }}>
      <Panel side={left} align="left" base={0.1} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 20,
          transform: "translateX(-50%)",
          fontFamily: DISPLAY,
          fontSize: 54,
          color: COLORS.white,
          background: "rgba(5,7,15,0.7)",
          borderRadius: "50%",
          width: 84,
          height: 84,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid rgba(120,160,220,0.4)",
        }}
      >
        VS
      </div>
      <Panel side={right} align="right" base={0.3} />
    </div>
  );
};

/** Simple commodity icon (energy / grain / shipping) with a label. */
export const CommodityIcon: React.FC<{ kind: "energy" | "grain" | "shipping" | "market"; label: string; color: string; progress: number }> = ({
  kind,
  label,
  color,
  progress,
}) => {
  const icon = () => {
    switch (kind) {
      case "energy":
        return <path d="M32 6 C 20 26, 14 34, 14 44 a18 18 0 0 0 36 0 C 50 34, 44 26, 32 6 Z" fill={color} />;
      case "grain":
        return (
          <g stroke={color} strokeWidth={3} fill="none" strokeLinecap="round">
            <line x1="32" y1="12" x2="32" y2="54" />
            {[18, 26, 34, 42].map((y) => (
              <g key={y}>
                <path d={`M32 ${y} q -12 -6 -16 -14`} />
                <path d={`M32 ${y} q 12 -6 16 -14`} />
              </g>
            ))}
          </g>
        );
      case "shipping":
        return (
          <g fill={color}>
            <rect x="14" y="34" width="36" height="14" rx="3" />
            <rect x="26" y="22" width="8" height="12" />
            <rect x="36" y="22" width="8" height="12" />
          </g>
        );
      case "market":
        return (
          <g stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="12,44 26,30 36,38 52,16" />
            <polyline points="44,16 52,16 52,24" />
          </g>
        );
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: clamp(progress), transform: `translateY(${(1 - clamp(progress)) * 18}px)` }}>
      <div style={{ width: 96, height: 96, borderRadius: 20, background: "rgba(10,18,40,0.75)", border: `1.5px solid ${color}88`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 26px ${color}33` }}>
        <svg width={64} height={64} viewBox="0 0 64 64">{icon()}</svg>
      </div>
      <div style={{ fontFamily: BODY, fontSize: 22, fontWeight: 800, color: COLORS.white, letterSpacing: 1 }}>{label}</div>
    </div>
  );
};
