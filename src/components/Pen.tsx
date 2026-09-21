import React from "react";
import { useCurrentFrame } from "remotion";

// A simple marker whose tip sits at the bottom-left of the SVG (12, 188).
export const Pen: React.FC<{ tipX: number; tipY: number; accent: string }> = ({
  tipX,
  tipY,
  accent,
}) => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 2) * 1.5;

  return (
    <div
      style={{
        position: "absolute",
        left: tipX - 12,
        top: tipY - 188 + bob,
        width: 190,
        height: 200,
        pointerEvents: "none",
      }}
    >
      <svg width="190" height="200" viewBox="0 0 190 200">
        <line
          x1="12"
          y1="188"
          x2="150"
          y2="40"
          stroke="#2b2b2b"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <line
          x1="150"
          y1="40"
          x2="170"
          y2="18"
          stroke="#5a5a5a"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <line
          x1="12"
          y1="188"
          x2="46"
          y2="150"
          stroke={accent}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="12" cy="188" r="4" fill="#111" />
      </svg>
    </div>
  );
};
