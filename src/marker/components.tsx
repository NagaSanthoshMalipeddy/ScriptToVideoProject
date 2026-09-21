import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { GRAY, HIGHLIGHT, INK, MARKER, RED, SCRIPT } from "./fonts";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Top-left section label, e.g. "HOOK", in tilted gray script. */
export const SectionLabel: React.FC<{ text: string; frame: number }> = ({ text, frame }) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 3, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        top: 56,
        fontFamily: SCRIPT,
        fontSize: 46,
        fontWeight: 700,
        letterSpacing: 2,
        color: GRAY,
        textTransform: "uppercase",
        transform: `rotate(-6deg) translateX(${(1 - p) * -30}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};

/** Hero phrase with an optional yellow highlighter swipe and hand-drawn red circle. */
export const HeroTitle: React.FC<{
  text: string;
  frame: number;
  maxWidth: number;
  highlight?: boolean;
  circle?: boolean;
  color?: string;
}> = ({ text, frame, maxWidth, highlight = false, circle = false, color = INK }) => {
  const { fps } = useVideoConfig();

  const measure = (fs: number) =>
    measureText({ text, fontFamily: MARKER, fontSize: fs, fontWeight: 400 }).width;

  let fontSize = 150;
  let w = measure(fontSize);
  while (w > maxWidth && fontSize > 56) {
    fontSize -= 6;
    w = measure(fontSize);
  }

  const boxH = fontSize * 1.25;
  const enter = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 0.7 } });

  // Highlighter swipe (left -> right).
  const hp = interpolate(frame, [12, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Red circle draw-on.
  const cp = interpolate(frame, [20, 44], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const circleW = w + 90;
  const circleH = boxH + 30;

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: boxH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${(1 - enter) * 26}px)`,
        opacity: enter,
      }}
    >
      {highlight && (
        <div
          style={{
            position: "absolute",
            left: -20,
            width: w + 40,
            top: fontSize * 0.2,
            height: fontSize * 0.72,
            background: HIGHLIGHT,
            borderRadius: 8,
            transform: "rotate(-1.8deg)",
            clipPath: `inset(0 ${(1 - hp) * 100}% 0 0)`,
            zIndex: 0,
          }}
        />
      )}
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: MARKER,
          fontSize,
          fontWeight: 400,
          color,
          lineHeight: 1,
          whiteSpace: "pre",
        }}
      >
        {text}
      </span>
      {circle && (
        <svg
          width={circleW}
          height={circleH}
          viewBox={`0 0 ${circleW} ${circleH}`}
          style={{
            position: "absolute",
            left: (w - circleW) / 2,
            top: (boxH - circleH) / 2,
            overflow: "visible",
            zIndex: 2,
          }}
        >
          <ellipse
            cx={circleW / 2}
            cy={circleH / 2}
            rx={circleW / 2 - 8}
            ry={circleH / 2 - 6}
            fill="none"
            stroke={RED}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - cp}
            transform={`rotate(-4 ${circleW / 2} ${circleH / 2})`}
          />
        </svg>
      )}
    </div>
  );
};

/** A tilted sticky-note tag. */
export const Tag: React.FC<{
  text: string;
  bg: string;
  fg?: string;
  rot?: number;
  progress: number;
}> = ({ text, bg, fg = "#fff", rot = -3, progress }) => (
  <div
    style={{
      fontFamily: MARKER,
      fontSize: 46,
      letterSpacing: 1,
      color: fg,
      background: bg,
      padding: "10px 26px",
      borderRadius: 8,
      boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
      transform: `rotate(${rot}deg) scale(${0.7 + progress * 0.3})`,
      opacity: clamp(progress),
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

export const TagRow: React.FC<{
  tags: { text: string; bg: string; fg?: string }[];
  frame: number;
  delay?: number;
}> = ({ tags, frame, delay = 26 }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
      {tags.map((tg, i) => {
        const p = spring({ frame: frame - delay - i * 6, fps, config: { damping: 12, mass: 0.6 } });
        return <Tag key={tg.text} text={tg.text} bg={tg.bg} fg={tg.fg} rot={i % 2 === 0 ? -3 : 3} progress={p} />;
      })}
    </div>
  );
};

export const Subtitle: React.FC<{ text: string; frame: number; delay?: number }> = ({
  text,
  frame,
  delay = 34,
}) => {
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  return (
    <div
      style={{
        fontFamily: SCRIPT,
        fontSize: 56,
        fontWeight: 600,
        fontStyle: "italic",
        color: GRAY,
        textAlign: "center",
        transform: `translateY(${(1 - p) * 18}px)`,
        opacity: p,
      }}
    >
      {text}
    </div>
  );
};
