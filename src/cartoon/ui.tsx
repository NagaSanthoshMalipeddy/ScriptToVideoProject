import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_BODY, TE_DISPLAY } from "../story/fonts";

export const INK = "#20232a";

/** Top-left outlined section label pill. */
export const SectionPill: React.FC<{ text: string; frame: number; dark?: boolean }> = ({ text, frame, dark }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 2, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 56,
        top: 56,
        fontFamily: TE_DISPLAY,
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 1,
        color: dark ? "#fff" : INK,
        background: dark ? INK : "rgba(255,255,255,0.85)",
        border: `4px solid ${INK}`,
        borderRadius: 16,
        padding: "6px 22px",
        transform: `translateX(${(1 - p) * -30}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Dark rounded chapter/date pill. */
export const DatePill: React.FC<{ text: string; frame: number; delay?: number }> = ({ text, frame, delay = 0 }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 12, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: TE_DISPLAY,
        fontSize: 40,
        fontWeight: 800,
        color: "#fff",
        background: INK,
        borderRadius: 18,
        padding: "8px 28px",
        transform: `scale(${0.6 + p * 0.4})`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Big bold rounded title. */
export const Title: React.FC<{ text: string; frame: number; delay?: number; size: number; color?: string }> = ({
  text,
  frame,
  delay = 0,
  size,
  color = INK,
}) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 13, mass: 0.7 } });
  return (
    <div
      style={{
        fontFamily: TE_DISPLAY,
        fontSize: size,
        fontWeight: 800,
        color,
        textAlign: "center",
        lineHeight: 1.08,
        transform: `scale(${0.7 + p * 0.3})`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Gray rounded lowercase caption. */
export const Caption: React.FC<{ text: string; frame: number; delay?: number; size?: number }> = ({ text, frame, delay = 0, size = 44 }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  return (
    <div
      style={{
        fontFamily: TE_BODY,
        fontSize: size,
        fontWeight: 700,
        color: "rgba(32,35,42,0.55)",
        textAlign: "center",
        transform: `translateY(${(1 - p) * 16}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Blue rounded button with thick outline + drop shadow. */
export const Button: React.FC<{ text: string; frame: number; delay?: number; bg?: string }> = ({ text, frame, delay = 0, bg = "#3b6bff" }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 11, mass: 0.6 } });
  return (
    <div
      style={{
        display: "inline-block",
        fontFamily: TE_DISPLAY,
        fontSize: 52,
        fontWeight: 800,
        color: "#fff",
        background: bg,
        border: `6px solid ${INK}`,
        borderRadius: 22,
        padding: "12px 40px",
        boxShadow: `0 10px 0 ${INK}`,
        transform: `scale(${0.6 + p * 0.4})`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Thick black directional arrow. */
export const BigArrow: React.FC<{ width: number; progress: number; color?: string }> = ({ width, progress, color = INK }) => {
  const w = width * Math.min(1, progress);
  return (
    <svg width={width} height={70} style={{ overflow: "visible", opacity: progress > 0.02 ? 1 : 0 }}>
      <line x1={0} y1={35} x2={Math.max(1, w - 24)} y2={35} stroke={color} strokeWidth={16} strokeLinecap="round" />
      {progress > 0.15 && <polygon points={`${w},35 ${w - 34},14 ${w - 34},56`} fill={color} />}
    </svg>
  );
};
