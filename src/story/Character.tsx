import React from "react";

export type Expr = "neutral" | "happy" | "surprised" | "worried" | "annoyed";
export type Mouth = "closed" | "open" | "smile" | "o" | "flat";

const INK = "#20232a";
const SW = 9;

/** A minimalist "storytime" avatar (rounded blob, thick outline, flat colors). */
export const Character: React.FC<{
  expr?: Expr;
  mouth?: Mouth;
  blink?: number; // 0 = open, 1 = closed
  armRaise?: number; // 0..1 right arm wave
  bob?: number; // vertical bob in px
  skin?: string;
  cheek?: string;
  width?: number;
}> = ({
  expr = "neutral",
  mouth = "closed",
  blink = 0,
  armRaise = 0,
  bob = 0,
  skin = "#ffffff",
  cheek = "#ffc7c7",
  width = 320,
}) => {
  const eyeScaleY = Math.max(0.08, 1 - blink);

  // Eyebrow pose per expression: [yOffset, innerAngleDeg]
  const brow: Record<Expr, { y: number; a: number }> = {
    neutral: { y: 0, a: 0 },
    happy: { y: -4, a: -6 },
    surprised: { y: -12, a: 0 },
    worried: { y: -2, a: 18 },
    annoyed: { y: 4, a: -18 },
  };
  const b = brow[expr];

  const Mouth = () => {
    switch (mouth) {
      case "open":
        return <ellipse cx={150} cy={172} rx={22} ry={17} fill={INK} />;
      case "o":
        return <circle cx={150} cy={172} r={13} fill={INK} />;
      case "smile":
        return <path d="M124 160 Q150 192 176 160" fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />;
      case "flat":
        return <line x1={132} y1={168} x2={168} y2={168} stroke={INK} strokeWidth={SW} strokeLinecap="round" />;
      default:
        return <path d="M132 166 Q150 176 168 166" fill="none" stroke={INK} strokeWidth={SW} strokeLinecap="round" />;
    }
  };

  return (
    <svg viewBox="0 0 300 400" width={width} height={(width * 400) / 300} style={{ overflow: "visible" }}>
      <g transform={`translate(0 ${bob})`}>
        {/* Body (drawn first so the head overlaps — no neck seam) */}
        <path
          d="M92 250 Q76 340 66 366 Q150 384 234 366 Q224 340 208 250 Z"
          fill={skin}
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        {/* Arms */}
        <path d="M96 276 q-30 8 -40 34" fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
        <path d="M96 276 q-30 8 -40 34" fill="none" stroke={skin} strokeWidth={9} strokeLinecap="round" />
        <g transform={`rotate(${-armRaise * 120} 206 278)`}>
          <path d="M206 276 q30 8 40 34" fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
          <path d="M206 276 q30 8 40 34" fill="none" stroke={skin} strokeWidth={9} strokeLinecap="round" />
        </g>
        {/* Legs */}
        <path d="M124 360 l-4 26" stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <path d="M176 360 l4 26" stroke={INK} strokeWidth={22} strokeLinecap="round" />

        {/* Head */}
        <circle cx={150} cy={132} r={96} fill={skin} stroke={INK} strokeWidth={SW} />

        {/* Cheeks */}
        <ellipse cx={108} cy={158} rx={14} ry={9} fill={cheek} opacity={0.8} />
        <ellipse cx={192} cy={158} rx={14} ry={9} fill={cheek} opacity={0.8} />

        {/* Eyes */}
        <g transform={`translate(120 132) scale(1 ${eyeScaleY})`}>
          <ellipse cx={0} cy={0} rx={11} ry={16} fill={INK} />
          <circle cx={4} cy={-6} r={3.4} fill="#fff" />
        </g>
        <g transform={`translate(180 132) scale(1 ${eyeScaleY})`}>
          <ellipse cx={0} cy={0} rx={11} ry={16} fill={INK} />
          <circle cx={4} cy={-6} r={3.4} fill="#fff" />
        </g>

        {/* Eyebrows */}
        <line x1={104} y1={102 + b.y} x2={134} y2={102 + b.y} stroke={INK} strokeWidth={SW} strokeLinecap="round" transform={`rotate(${-b.a} 119 ${102 + b.y})`} />
        <line x1={166} y1={102 + b.y} x2={196} y2={102 + b.y} stroke={INK} strokeWidth={SW} strokeLinecap="round" transform={`rotate(${b.a} 181 ${102 + b.y})`} />

        <Mouth />
      </g>
    </svg>
  );
};
