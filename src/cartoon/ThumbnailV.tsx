import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { Mark } from "./LogoRow";
import { INK } from "./ui";
import { TE_DISPLAY } from "../story/fonts";

// Static 9:16 (1080x1920) thumbnail in the cartoon theme, for Shorts/Reels.
export const ThumbnailV: React.FC = () => {
  const LOGOS = ["oracle", "amazon", "dell", "meta", "microsoft"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #ffe0c2 0%, #ffd0d6 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.12 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return <line key={i} x1={540} y1={620} x2={540 + Math.cos(a) * 1600} y2={620 + Math.sin(a) * 1600} stroke={INK} strokeWidth={30} />;
        })}
      </svg>

      {/* 2026 tag */}
      <div style={{ position: "absolute", right: 60, top: 60, background: INK, color: "#fff", fontFamily: TE_DISPLAY, fontSize: 66, fontWeight: 800, borderRadius: 18, padding: "8px 32px", transform: "rotate(5deg)" }}>2026</div>

      {/* Title */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 180, fontWeight: 800, color: INK, lineHeight: 0.95 }}>AI vs</div>
        <div
          style={{
            fontFamily: TE_DISPLAY,
            fontSize: 180,
            fontWeight: 800,
            color: "#fff",
            WebkitTextStroke: `12px ${INK}`,
            lineHeight: 0.95,
            textShadow: "0 10px 0 #c1121f",
          }}
        >
          YOUR JOB?
        </div>
      </div>

      {/* Red banner */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: "translateX(-50%) rotate(-4deg)",
          background: "#e63946",
          color: "#fff",
          border: `9px solid ${INK}`,
          borderRadius: 22,
          padding: "16px 40px",
          fontFamily: TE_DISPLAY,
          fontSize: 90,
          fontWeight: 800,
          whiteSpace: "nowrap",
          boxShadow: `0 14px 0 ${INK}`,
        }}
      >
        1,00,000+ JOBS CUT
      </div>

      {/* Character */}
      <div style={{ position: "absolute", left: "50%", top: 720, transform: "translateX(-50%)" }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.85} bob={0} skin="#ffffff" width={620} />
      </div>

      {/* Logos + down arrows */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", gap: 22, alignItems: "center", justifyContent: "center" }}>
        {LOGOS.map((slug) => (
          <div key={slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 130, height: 130, background: "#fff", border: `6px solid ${INK}`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 0 ${INK}`, padding: 14, boxSizing: "border-box" }}>
              <Mark slug={slug} size={84} />
            </div>
            <svg width={38} height={38} viewBox="0 0 30 30">
              <path d="M15 3 L15 22 M6 15 L15 24 L24 15" fill="none" stroke="#c1121f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
