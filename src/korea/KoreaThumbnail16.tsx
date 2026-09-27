import React from "react";
import { AbsoluteFill } from "remotion";
import type { Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { Cloth } from "./KoreaWar";
import { KoreaLongScene } from "./KoreaLong";

// 16:9 (1920x1080) thumbnail for the long-form Korean War video: China-enters moment + title on the left.
export const KoreaThumbnail16: React.FC<{ timing: Timing }> = ({ timing }) => {
  const s = timing.sections.find((x) => x.text.toLowerCase().includes("launched major attacks"));
  const T = (s ? s.start : timing.durationSec * 0.6) + 3.5;
  return (
    <AbsoluteFill>
      <KoreaLongScene timing={timing} T={T} frame={0} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(3,5,10,0.95) 0%, rgba(3,5,10,0.75) 38%, rgba(3,5,10,0) 58%)" }} />
      <div style={{ position: "absolute", left: 80, top: 110, width: 900 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 50 }}>
          <div style={{ transform: "scale(1.9)", transformOrigin: "left center" }}>
            <Cloth kind="NK" w={80} frame={0} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 84, color: "#ff3b4a", marginLeft: 90, marginRight: 20, textShadow: "0 0 30px #ff3b4a" }}>VS</div>
          <div style={{ transform: "scale(1.9)", transformOrigin: "left center" }}>
            <Cloth kind="SK" w={80} frame={0} />
          </div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 176, color: "#fff", lineHeight: 0.92, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>THE KOREAN</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 210, color: "#ffd23f", lineHeight: 0.92, letterSpacing: 3, textShadow: "0 0 40px rgba(255,210,63,0.6), 0 8px 0 #000" }}>WAR</div>
        <div style={{ marginTop: 26, display: "inline-block", background: "rgba(6,10,18,0.85)", borderLeft: "8px solid #ff3b4a", padding: "10px 22px", fontFamily: BODY, fontSize: 44, fontWeight: 800, color: "#fff" }}>HOW THE NORTH INVADED THE SOUTH</div>
        <div style={{ marginTop: 34, display: "flex", gap: 14 }}>
          {["1950", "→", "1953", "→", "?"].map((x, i) => (
            <div key={i} style={{ fontFamily: DISPLAY, fontSize: 74, color: x === "→" ? "#9fd8ff" : x === "?" ? "#ff3b4a" : "#fff", background: x === "→" ? "transparent" : "rgba(6,10,18,0.85)", border: x === "→" ? "none" : `4px solid ${x === "?" ? "#ff3b4a" : "#9fd8ff"}`, padding: "0 18px" }}>
              {x}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
