import React from "react";
import { AbsoluteFill } from "remotion";
import type { Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { Cloth } from "../korea/KoreaWar";
import { buildLongPlan, buildShortPlan, IraqDocScene } from "./IraqDoc";

const cueT = (timing: Timing, phrase: string, off: number) => (timing.sections.find((s) => s.text.toLowerCase().includes(phrase.toLowerCase()))?.start ?? 20) + off;

// 9:16 Short thumbnail — key content inside the Shorts feed safe area (y 300–1620).
export const IraqShortThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const plan = React.useMemo(() => buildShortPlan(timing.sections, timing.durationSec), [timing]);
  return (
    <AbsoluteFill>
      <IraqDocScene plan={plan} T={cueT(timing, "Iraqi flag moves across", 4)} frame={0} landscape={false} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,5,10,0.94) 0%, rgba(3,5,10,0.35) 40%, rgba(3,5,10,0) 58%, rgba(3,5,10,0.92) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: "scale(2.2)" }}>
            <Cloth kind="IR" w={80} frame={0} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 104, color: "#ffd23f", margin: "0 110px", textShadow: "0 0 30px #ffd23f" }}>VS</div>
          <div style={{ transform: "scale(2.2)" }}>
            <Cloth kind="IQ" w={80} frame={0} />
          </div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 176, color: "#fff", lineHeight: 0.95, marginTop: 90, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>8 YEARS OF</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 200, color: "#ff3b4a", lineHeight: 0.95, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.7), 0 8px 0 #000" }}>WAR</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "rgba(6,10,18,0.9)", border: "4px solid #ffd23f", padding: "6px 34px", fontFamily: DISPLAY, fontSize: 96, color: "#ffd23f", letterSpacing: 2 }}>WHO WON?</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1570, textAlign: "center", fontFamily: BODY, fontSize: 32, fontWeight: 800, letterSpacing: 6, color: "#9fd8ff" }}>IRAN – IRAQ WAR · 1980 → 1988</div>
    </AbsoluteFill>
  );
};

// 16:9 long-form thumbnail.
export const IraqLongThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const plan = React.useMemo(() => buildLongPlan(timing.sections, timing.durationSec), [timing]);
  return (
    <AbsoluteFill>
      <IraqDocScene plan={plan} T={cueT(timing, "Multiple Iraqi units", 2.5)} frame={0} landscape hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(3,5,10,0.95) 0%, rgba(3,5,10,0.75) 38%, rgba(3,5,10,0) 60%)" }} />
      <div style={{ position: "absolute", left: 70, top: 90 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 50, marginLeft: 30 }}>
          <div style={{ transform: "scale(1.8)", transformOrigin: "left center" }}>
            <Cloth kind="IR" w={80} frame={0} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 90, color: "#ffd23f", marginLeft: 90, textShadow: "0 0 30px #ffd23f" }}>VS</div>
          <div style={{ transform: "scale(1.8)", transformOrigin: "left center" }}>
            <Cloth kind="IQ" w={80} frame={0} />
          </div>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 170, color: "#fff", lineHeight: 0.95, marginTop: 70, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.8), 0 8px 0 #000" }}>8 YEARS</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 170, color: "#ff3b4a", lineHeight: 0.95, letterSpacing: 3, textShadow: "0 0 40px rgba(255,59,74,0.7), 0 8px 0 #000" }}>OF WAR</div>
        <div style={{ display: "inline-block", marginTop: 34, background: "rgba(6,10,18,0.9)", border: "4px solid #ffd23f", padding: "4px 28px", fontFamily: DISPLAY, fontSize: 76, color: "#ffd23f", letterSpacing: 2 }}>NO WINNER?</div>
        <div style={{ marginTop: 26, fontFamily: BODY, fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#9fd8ff" }}>THE IRAN – IRAQ WAR · 1980 → 1988</div>
      </div>
    </AbsoluteFill>
  );
};
