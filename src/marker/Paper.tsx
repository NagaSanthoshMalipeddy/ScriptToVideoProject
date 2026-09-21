import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

// Off-white paper with a faint dot grid and a soft top light — matches the
// reference whiteboard look.
export const Paper: React.FC = () => {
  const { width, height } = useVideoConfig();
  const spacing = 46;

  const dots = useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let y = spacing; y < height; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        pts.push({ x, y });
      }
    }
    return pts;
  }, [width, height]);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 70% at 50% 12%, #ffffff 0%, #f6f5ef 45%, #efeee7 100%)",
        }}
      />
      <svg width={width} height={height} style={{ position: "absolute" }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={1.6} fill="rgba(60,60,70,0.10)" />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 260px 60px rgba(120,120,130,0.10)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
