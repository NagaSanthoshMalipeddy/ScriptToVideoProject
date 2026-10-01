import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { useHasCover } from "./WithCover";

const INK = "#20232a";

// Instagram uses frame 0 as the Reel cover and crops it to 4:5 (y 285–1635) or 3:4 on the grid,
// with its own overlay at the bottom. So 9:16 videos open on a full-opacity title centred in y ≈ 560–1300.
export const CoverTitle: React.FC<{ lines: string[]; sub?: string; accent?: string; hold?: number }> = ({ lines, sub, accent = "#ffc93c", hold = 1.2 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const T = frame / fps;
  if (useHasCover() || width > height || T > hold + 0.4) return null;
  const op = T <= hold ? 1 : 1 - (T - hold) / 0.4;
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(170, Math.floor(960 / (longest * 0.64)));
  return (
    <AbsoluteFill style={{ opacity: op, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, height: 820, background: "linear-gradient(180deg, rgba(8,18,40,0) 0%, rgba(8,18,40,0.72) 18%, rgba(8,18,40,0.72) 82%, rgba(8,18,40,0) 100%)" }} />
      <div style={{ position: "absolute", left: 40, right: 40, top: 560, height: 740, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: TE_DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.05, color: i === 0 ? accent : "#ffffff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}`, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        {sub && (
          <div style={{ marginTop: 26, background: "#ffffff", border: `5px solid ${INK}`, borderRadius: 22, boxShadow: `0 8px 0 ${INK}`, padding: "10px 28px 4px", fontFamily: TE_DISPLAY, fontSize: 48, color: INK }}>{sub}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
