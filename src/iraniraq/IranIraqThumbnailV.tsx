import React from "react";
import { AbsoluteFill } from "remotion";
import { BODY, DISPLAY } from "../airace/fonts";
import { Cloth } from "../korea/KoreaWar";
import { IranIraqScene } from "./IranIraqWar";

// 9:16 thumbnail; all key content sits inside the Shorts feed safe area (y 300–1620).
export const IranIraqThumbnailV: React.FC = () => (
  <AbsoluteFill>
    <IranIraqScene T={40.2} frame={0} hud={false} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.94) 0%, rgba(3,5,10,0.3) 38%, rgba(3,5,10,0) 58%, rgba(3,5,10,0.92) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
        <div style={{ transform: "scale(2.2)", transformOrigin: "center" }}>
          <Cloth kind="IR" w={80} frame={0} />
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 104, color: "#ffd23f", margin: "0 70px", textShadow: "0 0 30px #ffd23f" }}>VS</div>
        <div style={{ transform: "scale(2.2)", transformOrigin: "center" }}>
          <Cloth kind="IQ" w={80} frame={0} />
        </div>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 176, color: "#fff", lineHeight: 0.95, marginTop: 90, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>8 YEARS OF</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 200, color: "#ff3b4a", lineHeight: 0.95, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.7), 0 8px 0 #000" }}>WAR</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "rgba(6,10,18,0.9)", border: "4px solid #ffd23f", padding: "6px 34px", fontFamily: DISPLAY, fontSize: 96, color: "#ffd23f", letterSpacing: 2 }}>NO WINNER?</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1570, textAlign: "center", fontFamily: BODY, fontSize: 32, fontWeight: 800, letterSpacing: 6, color: "#9fd8ff" }}>IRAN – IRAQ WAR · 1980–1988</div>
  </AbsoluteFill>
);
