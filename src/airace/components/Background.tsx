import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../lib";

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stars = useMemo(() => {
    const rnd = mulberry32(1337);
    return new Array(140).fill(0).map(() => ({
      x: rnd() * width,
      y: rnd() * height,
      r: rnd() * 1.8 + 0.3,
      tw: rnd() * Math.PI * 2,
      sp: rnd() * 0.06 + 0.02,
    }));
  }, [width, height]);

  const gridSpacing = 90;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 18%, ${COLORS.bg1} 0%, ${COLORS.bg0} 60%, #02030a 100%)`,
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {Array.from({ length: Math.ceil(width / gridSpacing) + 1 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * gridSpacing}
            y1={0}
            x2={i * gridSpacing}
            y2={height}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: Math.ceil(height / gridSpacing) + 1 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * gridSpacing}
            x2={width}
            y2={i * gridSpacing}
            stroke={COLORS.grid}
            strokeWidth={1}
          />
        ))}
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={COLORS.cyan}
            opacity={0.25 + 0.55 * (0.5 + 0.5 * Math.sin(s.tw + frame * s.sp))}
          />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          boxShadow: `inset 0 0 ${Math.round(width * 0.55)}px ${Math.round(
            width * 0.22
          )}px rgba(2,4,12,0.9)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
