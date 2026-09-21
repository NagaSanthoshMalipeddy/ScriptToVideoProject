import React, { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section } from "../types";

// Bright, friendly palette shared by words and shapes.
export const PALETTE = [
  "#e63946",
  "#1d9bf0",
  "#2a9d8f",
  "#f4a261",
  "#8e44ad",
  "#e76f51",
  "#ff6b9d",
  "#00b4a6",
  "#f9c74f",
  "#4361ee",
];

type Kind = "circle" | "rect" | "triangle" | "star" | "squiggle" | "burst" | "dot";

const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

const hashText = (t: string) => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const starPath = (outer: number, points = 5) => {
  const inner = outer * 0.42;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)} `;
  }
  return d + "Z";
};

const squigglePath = (s: number) => {
  const half = s / 2;
  const steps = 16;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = -half + (s * i) / steps;
    const y = Math.sin((i / steps) * Math.PI * 3) * (s * 0.16);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d;
};

type ShapeDef = {
  kind: Kind;
  x: number;
  y: number;
  size: number;
  rot: number;
  color: string;
  appear: number;
};

/** A seeded set of decorative shapes that pop in around the text as it's spoken. */
export const Shapes: React.FC<{ section: Section; opacity?: number }> = ({
  section,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const shapes = useMemo<ShapeDef[]>(() => {
    const r = rand(hashText(section.text) + 101);
    const kinds: Kind[] = ["circle", "rect", "triangle", "star", "squiggle", "burst", "dot"];
    const n = 6 + Math.floor(r() * 3);
    const m = 130;
    const arr: ShapeDef[] = [];
    for (let i = 0; i < n; i++) {
      // Keep shapes in the edge/corner bands so they frame (not cover) the text.
      let x: number;
      let y: number;
      if (r() < 0.5) {
        x = m + r() * (width - 2 * m);
        y = r() < 0.5 ? 120 + r() * 200 : height - 120 - r() * 200;
      } else {
        x = r() < 0.5 ? 70 + r() * 120 : width - 70 - r() * 120;
        y = 260 + r() * (height - 520);
      }
      arr.push({
        kind: kinds[Math.floor(r() * kinds.length)],
        x,
        y,
        size: 44 + r() * 76,
        rot: (r() - 0.5) * 55,
        color: PALETTE[Math.floor(r() * PALETTE.length)],
        appear: i / n,
      });
    }
    return arr;
  }, [section.text, width, height]);

  const dur = Math.max(0.6, section.end - section.start);

  const renderShape = (s: ShapeDef) => {
    const sw = Math.max(4, s.size * 0.09);
    switch (s.kind) {
      case "circle":
        return <circle r={s.size / 2} fill="none" stroke={s.color} strokeWidth={sw} />;
      case "dot":
        return <circle r={s.size / 3.2} fill={s.color} />;
      case "rect":
        return (
          <rect
            x={-s.size / 2}
            y={-s.size / 2}
            width={s.size}
            height={s.size}
            rx={s.size * 0.16}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
          />
        );
      case "triangle": {
        const h = s.size * 0.9;
        return (
          <polygon
            points={`0,${(-h / 2).toFixed(1)} ${(s.size / 2).toFixed(1)},${(h / 2).toFixed(1)} ${(-s.size / 2).toFixed(1)},${(h / 2).toFixed(1)}`}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      }
      case "star":
        return <path d={starPath(s.size / 2)} fill={s.color} opacity={0.9} />;
      case "squiggle":
        return (
          <path
            d={squigglePath(s.size * 1.4)}
            fill="none"
            stroke={s.color}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        );
      case "burst": {
        const r = s.size / 2;
        const lines = [];
        for (let k = 0; k < 8; k++) {
          const a = (Math.PI * k) / 4;
          lines.push(
            <line
              key={k}
              x1={Math.cos(a) * r * 0.35}
              y1={Math.sin(a) * r * 0.35}
              x2={Math.cos(a) * r}
              y2={Math.sin(a) * r}
              stroke={s.color}
              strokeWidth={sw}
              strokeLinecap="round"
            />
          );
        }
        return <g>{lines}</g>;
      }
    }
  };

  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {shapes.map((s, i) => {
        const startT = section.start + s.appear * dur * 0.85;
        const p = spring({ frame: (t - startT) * fps, fps, config: { damping: 12, mass: 0.6 } });
        if (p <= 0.001) return null;
        return (
          <g
            key={i}
            opacity={Math.min(1, p) * 0.8 * opacity}
            transform={`translate(${s.x.toFixed(1)},${s.y.toFixed(1)}) rotate(${s.rot.toFixed(1)}) scale(${p.toFixed(3)})`}
          >
            {renderShape(s)}
          </g>
        );
      })}
    </svg>
  );
};
