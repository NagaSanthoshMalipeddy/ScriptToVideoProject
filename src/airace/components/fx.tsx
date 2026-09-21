import React, { useMemo } from "react";
import { COLORS, clamp } from "../lib";
import { BODY } from "../fonts";

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
};

/** A cloud of nodes that appear and wire themselves together. */
export const NodeNetwork: React.FC<{
  width: number;
  height: number;
  progress: number;
  color: string;
  seed?: number;
  count?: number;
}> = ({ width, height, progress, color, seed = 7, count = 46 }) => {
  const nodes = useMemo(() => {
    const r = rng(seed);
    return new Array(count).fill(0).map(() => ({
      x: r() * width,
      y: r() * height,
      appear: r(),
    }));
  }, [width, height, seed, count]);

  const links = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.hypot(dx, dy) < width * 0.22) out.push([i, j]);
      }
    }
    return out;
  }, [nodes, width]);

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {links.map(([a, b], i) => {
        const app = Math.max(nodes[a].appear, nodes[b].appear);
        const on = clamp((progress - app * 0.6) * 3);
        return (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke={color}
            strokeWidth={1}
            opacity={on * 0.35}
          />
        );
      })}
      {nodes.map((n, i) => {
        const on = clamp((progress - n.appear * 0.6) * 4);
        return (
          <circle key={i} cx={n.x} cy={n.y} r={2.6 + on * 1.6} fill={color} opacity={on} />
        );
      })}
    </svg>
  );
};

/** Grid of chips lighting up — used for the Taiwan wafer and memory stacks. */
export const ChipGrid: React.FC<{
  cols: number;
  rows: number;
  cell: number;
  gap: number;
  progress: number;
  color: string;
}> = ({ cols, rows, cell, gap, progress, color }) => {
  const total = cols * rows;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cell}px)`,
        gap,
      }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const t = clamp(progress * total - i);
        return (
          <div
            key={i}
            style={{
              width: cell,
              height: cell,
              borderRadius: cell * 0.18,
              background: `${color}${Math.round(clamp(0.15 + t * 0.55) * 255)
                .toString(16)
                .padStart(2, "0")}`,
              border: `1px solid ${color}`,
              boxShadow: t > 0.5 ? `0 0 10px ${color}` : "none",
              opacity: 0.2 + t * 0.8,
            }}
          />
        );
      })}
    </div>
  );
};

/** Vertical processing pipeline with per-stage reveal + optional owner color. */
export const Pipeline: React.FC<{
  stages: { label: string; owner?: string }[];
  progress: number;
  width: number;
}> = ({ stages, progress, width }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
    {stages.map((s, i) => {
      const t = clamp(progress * stages.length - i);
      const owner = s.owner ?? COLORS.cyan;
      return (
        <React.Fragment key={s.label}>
          <div
            style={{
              width,
              padding: "20px 0",
              textAlign: "center",
              borderRadius: 16,
              background: "rgba(10,18,40,0.8)",
              border: `2px solid ${owner}`,
              boxShadow: `0 0 ${28 * t}px ${owner}66`,
              color: COLORS.white,
              fontFamily: BODY,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: 2,
              transform: `translateY(${(1 - t) * 24}px) scale(${0.9 + t * 0.1})`,
              opacity: t,
            }}
          >
            {s.label}
          </div>
          {i < stages.length - 1 && (
            <div
              style={{
                fontSize: 30,
                color: COLORS.cyan,
                opacity: clamp(progress * stages.length - i - 0.5),
              }}
            >
              ↓
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/** Minimal humanoid robot silhouette built from primitives. */
export const Robot: React.FC<{ size: number; color: string; progress: number }> = ({
  size,
  color,
  progress,
}) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 100 140" style={{ opacity: progress }}>
    <g fill="none" stroke={color} strokeWidth={3} filter={`drop-shadow(0 0 6px ${color})`}>
      <rect x="34" y="8" width="32" height="28" rx="8" />
      <circle cx="44" cy="22" r="3.5" fill={color} />
      <circle cx="56" cy="22" r="3.5" fill={color} />
      <line x1="50" y1="36" x2="50" y2="44" />
      <rect x="30" y="44" width="40" height="46" rx="10" />
      <line x1="30" y1="60" x2="12" y2="78" />
      <line x1="70" y1="60" x2="88" y2="78" />
      <line x1="40" y1="90" x2="38" y2="128" />
      <line x1="60" y1="90" x2="62" y2="128" />
      <rect x="42" y="56" width="16" height="16" rx="3" fill={`${color}33`} />
    </g>
  </svg>
);

/** A silicon wafer disc containing a lighting-up chip grid. */
export const Wafer: React.FC<{ size: number; progress: number; color: string }> = ({
  size,
  progress,
  color,
}) => {
  const cols = 12;
  const cell = size / (cols + 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `3px solid ${color}`,
        boxShadow: `0 0 40px ${color}55, inset 0 0 40px ${color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "rgba(8,14,34,0.7)",
      }}
    >
      <ChipGrid cols={cols} rows={cols} cell={cell} gap={cell * 0.22} progress={progress} color={color} />
    </div>
  );
};
