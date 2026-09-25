import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { Mark } from "./LogoRow";
import { INK } from "./ui";
import { TE_DISPLAY } from "../story/fonts";

// Static YouTube thumbnail (1280x720) in the cartoon theme.
export const Thumbnail: React.FC = () => {
  const LOGOS = ["oracle", "amazon", "dell", "meta", "microsoft"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #ffe0c2 0%, #ffd0d6 100%)" }}>
      {/* comic burst behind */}
      <svg width={1280} height={720} style={{ position: "absolute", opacity: 0.12 }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const a = (i / 28) * Math.PI * 2;
          return <line key={i} x1={430} y1={330} x2={430 + Math.cos(a) * 1400} y2={330 + Math.sin(a) * 1400} stroke={INK} strokeWidth={26} />;
        })}
      </svg>

      {/* Title */}
      <div style={{ position: "absolute", left: 56, top: 70 }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 150, fontWeight: 800, color: INK, lineHeight: 0.95 }}>AI vs</div>
        <div
          style={{
            fontFamily: TE_DISPLAY,
            fontSize: 150,
            fontWeight: 800,
            color: "#fff",
            WebkitTextStroke: `10px ${INK}`,
            lineHeight: 0.95,
            textShadow: "0 8px 0 #c1121f",
          }}
        >
          YOUR JOB?
        </div>
      </div>

      {/* Red banner */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 360,
          transform: "rotate(-4deg)",
          background: "#e63946",
          color: "#fff",
          border: `8px solid ${INK}`,
          borderRadius: 18,
          padding: "12px 30px",
          fontFamily: TE_DISPLAY,
          fontSize: 68,
          fontWeight: 800,
          boxShadow: `0 12px 0 ${INK}`,
        }}
      >
        1,00,000+ JOBS CUT
      </div>

      {/* Logos + down arrows */}
      <div style={{ position: "absolute", left: 56, top: 520, display: "flex", gap: 16, alignItems: "center" }}>
        {LOGOS.map((slug) => (
          <div key={slug} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: 96, height: 96, background: "#fff", border: `5px solid ${INK}`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 6px 0 ${INK}`, padding: 10, boxSizing: "border-box" }}>
              <Mark slug={slug} size={62} />
            </div>
            <svg width={30} height={30} viewBox="0 0 30 30">
              <path d="M15 3 L15 22 M6 15 L15 24 L24 15" fill="none" stroke="#c1121f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Character */}
      <div style={{ position: "absolute", right: 30, bottom: -30 }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.85} bob={0} skin="#ffffff" width={470} />
      </div>

      {/* 2026 tag */}
      <div style={{ position: "absolute", right: 60, top: 50, background: INK, color: "#fff", fontFamily: TE_DISPLAY, fontSize: 52, fontWeight: 800, borderRadius: 16, padding: "6px 26px", transform: "rotate(5deg)" }}>2026</div>
    </AbsoluteFill>
  );
};
