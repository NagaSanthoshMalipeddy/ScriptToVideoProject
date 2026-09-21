import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import {
  COLORS,
  COUNTRIES,
  clamp,
  fibonacciSphere,
  latLonToVec,
  lerp,
  rotate,
} from "../lib";

export type Highlight = { id: string; intensity: number };

type Props = {
  cx: number;
  cy: number;
  radius: number;
  rotation: number;
  tilt?: number;
  frame?: number;
  highlights?: Highlight[];
  dotCount?: number;
  connect?: boolean;
};

export const Globe: React.FC<Props> = ({
  cx,
  cy,
  radius,
  rotation,
  tilt = -0.35,
  frame = 0,
  highlights = [],
  dotCount = 420,
  connect = false,
}) => {
  const points = useMemo(() => fibonacciSphere(dotCount), [dotCount]);
  const { width: frameW, height: frameH } = useVideoConfig();

  const rendered = points
    .map((p) => rotate(p, rotation, tilt))
    .map((p) => ({
      x: cx + p.x * radius,
      y: cy - p.y * radius,
      z: p.z,
    }));

  const markers = highlights
    .map((h) => {
      const c = COUNTRIES[h.id];
      if (!c) return null;
      const v = rotate(latLonToVec(c.lat, c.lon), rotation, tilt);
      return {
        id: h.id,
        color: c.color,
        intensity: h.intensity,
        x: cx + v.x * radius,
        y: cy - v.y * radius,
        z: v.z,
      };
    })
    .filter(Boolean) as {
    id: string;
    color: string;
    intensity: number;
    x: number;
    y: number;
    z: number;
  }[];

  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.15);

  return (
    <svg
      width={frameW}
      height={frameH}
      viewBox={`0 0 ${frameW} ${frameH}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      <defs>
        <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(30,90,200,0)" />
          <stop offset="88%" stopColor="rgba(53,224,255,0.18)" />
          <stop offset="100%" stopColor="rgba(53,224,255,0)" />
        </radialGradient>
      </defs>

      <circle cx={cx} cy={cy} r={radius * 1.18} fill="url(#atmo)" />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="rgba(8,16,40,0.55)"
        stroke="rgba(60,120,220,0.35)"
        strokeWidth={1.5}
      />

      {rendered.map((p, i) => {
        const front = (p.z + 1) / 2;
        const size = lerp(0.7, 2.4, front);
        const op = lerp(0.12, 0.85, front);
        const col = p.z > 0 ? COLORS.cyan : COLORS.blue;
        return <circle key={i} cx={p.x} cy={p.y} r={size} fill={col} opacity={op} />;
      })}

      {connect &&
        markers
          .filter((m) => m.z > -0.1)
          .map((m, i) =>
            markers
              .filter((n, j) => j > i && n.z > -0.1)
              .map((n) => (
                <line
                  key={`${m.id}-${n.id}`}
                  x1={m.x}
                  y1={m.y}
                  x2={n.x}
                  y2={n.y}
                  stroke="rgba(120,190,255,0.35)"
                  strokeWidth={1.2}
                />
              ))
          )}

      {markers.map((m) => {
        const visible = clamp((m.z + 0.15) / 0.4);
        const a = visible * m.intensity;
        if (a <= 0.02) return null;
        const ring = radius * (0.05 + 0.05 * pulse) * m.intensity;
        return (
          <g key={m.id} opacity={a}>
            <circle cx={m.x} cy={m.y} r={ring + 10} fill="none" stroke={m.color} strokeWidth={2} opacity={0.5} />
            <circle cx={m.x} cy={m.y} r={7} fill={m.color} />
            <circle cx={m.x} cy={m.y} r={16} fill={m.color} opacity={0.22} />
          </g>
        );
      })}
    </svg>
  );
};
