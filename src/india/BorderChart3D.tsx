import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { INK } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { BORDER_DATA } from "./data";

const MAXV = 7516;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const Bars: React.FC<{ t: number }> = ({ t }) => {
  const spacing = 1.15;
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 9, 6]} intensity={1.7} />
      <pointLight position={[-5, 4, 5]} intensity={0.7} color="#88bbff" />
      {BORDER_DATA.map((d, i) => {
        const h = (d.value / MAXV) * 5.2 + 0.15;
        const grow = clamp((t - i * 0.12) / 0.5);
        const x = (i - (BORDER_DATA.length - 1) / 2) * spacing;
        return (
          <mesh key={d.label} position={[x, (h * grow) / 2, 0]} scale={[1, Math.max(0.001, grow), 1]}>
            <boxGeometry args={[0.8, h, 0.8]} />
            <meshStandardMaterial color={d.color} emissive={d.color} emissiveIntensity={0.18} metalness={0.35} roughness={0.35} />
          </mesh>
        );
      })}
    </>
  );
};

/** 3D bar chart of India's border lengths + coastline, with a 2D label row. */
export const BorderChart3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const chartW = Math.round(width);
  const chartH = Math.round(height * 0.4);

  return (
    <div style={{ width: chartW, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <ThreeCanvas width={chartW} height={chartH} camera={{ position: [0, 3.6, 9.5], fov: 45 }} style={{ position: "relative" }}>
        <Bars t={t} />
      </ThreeCanvas>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 6, flexWrap: "wrap", maxWidth: chartW }}>
        {BORDER_DATA.map((d, i) => {
          const on = clamp((t - (0.25 + i * 0.12)) * 4);
          return (
            <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 116, opacity: on, transform: `translateY(${(1 - on) * 10}px)` }}>
              <div style={{ fontFamily: TE_DISPLAY, fontSize: 26, fontWeight: 800, color: d.color, WebkitTextStroke: `1.2px ${INK}` }}>{d.value.toLocaleString()}</div>
              <div style={{ fontFamily: TE_DISPLAY, fontSize: 22, fontWeight: 800, color: INK }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
