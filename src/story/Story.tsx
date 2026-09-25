import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, Expr, Mouth } from "./Character";

const BODY_FONT = "system-ui, sans-serif";

// A tiny scripted beat list so the character "acts out" the narration.
const BEATS: { start: number; end: number; expr: Expr; text: string; talk: boolean }[] = [
  { start: 0, end: 2.4, expr: "happy", text: "So… let me tell you a story.", talk: true },
  { start: 2.4, end: 4.6, expr: "surprised", text: "And you WON'T believe what happened!", talk: true },
  { start: 4.6, end: 7, expr: "annoyed", text: "It all went completely wrong…", talk: true },
];

export const StoryDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const beat = BEATS.find((b) => t >= b.start && t < b.end) ?? BEATS[BEATS.length - 1];

  // Blink every ~2.6s, quick.
  const blinkPhase = (t % 2.6);
  const blink = blinkPhase > 2.45 ? Math.sin(((blinkPhase - 2.45) / 0.15) * Math.PI) : 0;

  // Talk mouth: flap open/closed a few times per second while talking.
  const mouthOpen = Math.sin(t * 22) > 0;
  const mouth: Mouth = beat.talk ? (mouthOpen ? "open" : "flat") : beat.expr === "happy" ? "smile" : "closed";

  // Gentle idle bob + a wave on the surprised beat.
  const bob = Math.sin(t * 3) * 5;
  const armRaise = beat.expr === "surprised" ? (0.5 + 0.5 * Math.sin(t * 10)) : 0;

  const bubbleIn = interpolate(t - beat.start, [0, 0.25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Flat two-tone room */}
      <AbsoluteFill style={{ background: "#8ecae6" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.32, background: "#ffb703" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: height * 0.32, height: 8, background: "#20232a" }} />
      {/* Simple wall poster */}
      <div style={{ position: "absolute", left: width * 0.12, top: height * 0.16, width: 150, height: 190, background: "#fff", border: "8px solid #20232a", borderRadius: 10, transform: "rotate(-3deg)" }} />

      {/* Speech bubble */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: height * 0.12,
          transform: `translateX(-50%) scale(${0.7 + bubbleIn * 0.3})`,
          opacity: bubbleIn,
          maxWidth: width * 0.8,
          background: "#fff",
          border: "8px solid #20232a",
          borderRadius: 26,
          padding: "22px 32px",
          fontFamily: BODY_FONT,
          fontSize: 44,
          fontWeight: 800,
          color: "#20232a",
          textAlign: "center",
        }}
      >
        {beat.text}
      </div>

      {/* Character */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: height * 0.06 }}>
        <Character expr={beat.expr} mouth={mouth} blink={blink} armRaise={armRaise} bob={bob} width={width * 0.5} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
