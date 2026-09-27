import React from "react";
import { AbsoluteFill } from "remotion";
import type { Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { WarScene } from "./WarMap";

const Flag: React.FC<{ stripes: string[]; w: number }> = ({ stripes, w }) => (
  <div style={{ width: w, height: w * 0.66, display: "flex", flexDirection: "column", border: "3px solid rgba(255,255,255,0.8)", boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}>
    {stripes.map((c, i) => (
      <div key={i} style={{ flex: 1, background: c }} />
    ))}
  </div>
);

// Static 9:16 thumbnail: the invasion-routes moment of the WarMap scene plus bold title.
export const WarMapThumbnailV: React.FC<{ timing: Timing }> = ({ timing }) => {
  const T = timing.sections[Math.min(3, timing.sections.length - 1)].end - 0.1;
  return (
    <AbsoluteFill>
      <WarScene timing={timing} T={T} frame={0} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.92) 0%, rgba(3,5,10,0.2) 32%, rgba(3,5,10,0) 60%, rgba(3,5,10,0.9) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
          <Flag stripes={["#ffffff", "#0039a6", "#d52b1e"]} w={170} />
          <div style={{ fontFamily: DISPLAY, fontSize: 100, color: "#ff3b4a", textShadow: "0 0 30px #ff3b4a" }}>VS</div>
          <Flag stripes={["#0057b7", "#ffd700"]} w={170} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 150, color: "#fff", lineHeight: 0.95, marginTop: 30, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>HOW THE WAR</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 180, color: "#ffd23f", lineHeight: 0.95, letterSpacing: 3, textShadow: "0 0 40px rgba(255,210,63,0.6), 0 8px 0 #000" }}>BEGAN</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center", gap: 26 }}>
        {["2014", "→", "2022"].map((s) => (
          <div key={s} style={{ fontFamily: DISPLAY, fontSize: 120, color: s === "→" ? "#9fd8ff" : "#fff", background: s === "→" ? "transparent" : "rgba(6,10,18,0.85)", border: s === "→" ? "none" : "4px solid #9fd8ff", padding: "0 30px", textShadow: "0 0 24px rgba(159,216,255,0.6)" }}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1615, textAlign: "center", fontFamily: BODY, fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#9fd8ff" }}>EXPLAINED ON THE MAP</div>
    </AbsoluteFill>
  );
};
