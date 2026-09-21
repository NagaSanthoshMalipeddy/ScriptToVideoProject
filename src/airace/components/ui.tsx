import React from "react";
import { spring, useVideoConfig } from "remotion";
import { BODY, DISPLAY } from "../fonts";
import { COLORS } from "../lib";

export const RevealText: React.FC<{
  text: string;
  frame: number;
  delay?: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  letterSpacing?: number;
  uppercase?: boolean;
  align?: "center" | "left";
}> = ({
  text,
  frame,
  delay = 0,
  stagger = 2,
  size = 42,
  weight = 600,
  color = COLORS.white,
  letterSpacing = 0,
  uppercase = false,
  align = "center",
}) => {
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: `0 ${size * 0.28}px`,
        justifyContent: align === "center" ? "center" : "flex-start",
        fontFamily: BODY,
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing,
        textTransform: uppercase ? "uppercase" : "none",
        lineHeight: 1.15,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 200, mass: 0.6 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * 22}px)`,
              opacity: p,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const BigTitle: React.FC<{
  text: string;
  frame: number;
  delay?: number;
  size: number;
  color?: string;
  glow?: string;
}> = ({ text, frame, delay = 0, size, color = COLORS.white, glow = COLORS.cyan }) => {
  const { fps } = useVideoConfig();
  const letters = text.split("");
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        fontFamily: DISPLAY,
        fontSize: size,
        color,
        letterSpacing: 2,
        textShadow: `0 0 24px ${glow}`,
        lineHeight: 1,
      }}
    >
      {letters.map((ch, i) => {
        const p = spring({
          frame: frame - delay - i * 1.6,
          fps,
          config: { damping: 200, mass: 0.7 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${(1 - p) * 40}px) scale(${0.85 + p * 0.15})`,
              opacity: p,
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

export const CodePill: React.FC<{
  code: string;
  name: string;
  color: string;
  progress: number;
  size?: number;
}> = ({ code, name, color, progress, size = 1 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16 * size,
      padding: `${14 * size}px ${26 * size}px`,
      borderRadius: 18 * size,
      background: "rgba(10,18,40,0.75)",
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${34 * size}px ${color}66`,
      transform: `scale(${0.8 + progress * 0.2})`,
      opacity: progress,
      fontFamily: BODY,
    }}
  >
    <div
      style={{
        width: 14 * size,
        height: 44 * size,
        borderRadius: 6,
        background: color,
        boxShadow: `0 0 18px ${color}`,
      }}
    />
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontSize: 40 * size, fontWeight: 800, color: COLORS.white, letterSpacing: 3 }}>
        {code}
      </span>
      <span style={{ fontSize: 20 * size, fontWeight: 500, color: COLORS.dim, letterSpacing: 1 }}>
        {name}
      </span>
    </div>
  </div>
);

export const Chip: React.FC<{
  label: string;
  color: string;
  progress: number;
  size?: number;
}> = ({ label, color, progress, size = 1 }) => (
  <div
    style={{
      padding: `${12 * size}px ${22 * size}px`,
      borderRadius: 14 * size,
      background: "rgba(10,18,40,0.7)",
      border: `1.5px solid ${color}aa`,
      color: COLORS.white,
      fontFamily: BODY,
      fontSize: 26 * size,
      fontWeight: 700,
      letterSpacing: 1,
      boxShadow: `0 0 ${24 * size}px ${color}44`,
      transform: `translateY(${(1 - progress) * 18}px)`,
      opacity: progress,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);
