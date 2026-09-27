import React from "react";
import { AbsoluteFill } from "remotion";
import type { Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { Cloth, KoreaScene } from "./KoreaWar";

// Static 9:16 thumbnail: the China-enters moment with the 38th parallel, plus bold title.
export const KoreaThumbnailV: React.FC<{ timing: Timing }> = ({ timing }) => {
  const T = timing.sections[Math.min(6, timing.sections.length - 1)].end - 0.1;
  return (
    <AbsoluteFill>
      <KoreaScene timing={timing} T={T} frame={0} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.94) 0%, rgba(3,5,10,0.25) 34%, rgba(3,5,10,0) 58%, rgba(3,5,10,0.92) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
          <div style={{ transform: "scale(2.3)", transformOrigin: "center" }}>
            <Cloth kind="NK" w={80} frame={0} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 110, color: "#ff3b4a", margin: "0 70px", textShadow: "0 0 30px #ff3b4a" }}>VS</div>
          <div style={{ transform: "scale(2.3)", transformOrigin: "center" }}>
            <Cloth kind="SK" w={80} frame={0} />
          </div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 150, color: "#fff", lineHeight: 0.95, marginTop: 90, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>THE WAR THAT</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 180, color: "#ffd23f", lineHeight: 0.95, letterSpacing: 3, textShadow: "0 0 40px rgba(255,210,63,0.6), 0 8px 0 #000" }}>NEVER ENDED</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1420, display: "flex", justifyContent: "center", gap: 12 }}>
        {["1950", "→", "1953", "→", "?"].map((s, i) => (
          <div key={i} style={{ fontFamily: DISPLAY, fontSize: 92, color: s === "→" ? "#9fd8ff" : s === "?" ? "#ff3b4a" : "#fff", background: s === "→" ? "transparent" : "rgba(6,10,18,0.85)", border: s === "→" ? "none" : `4px solid ${s === "?" ? "#ff3b4a" : "#9fd8ff"}`, padding: "0 20px", textShadow: "0 0 24px rgba(159,216,255,0.6)" }}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1590, textAlign: "center", fontFamily: BODY, fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#9fd8ff" }}>THE KOREAN WAR · EXPLAINED ON THE MAP</div>
    </AbsoluteFill>
  );
};
