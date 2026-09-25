import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Mark } from "./LogoRow";
import { VehicleIcon, VehicleKind } from "./Icons";
import { INK } from "./ui";
import { TE_DISPLAY } from "../story/fonts";

type Datum = { key: string; value: number; top: string; bottom: string; color: string; slug?: string; icon?: VehicleKind };
type DatasetCfg = { max: number; scale: "linear" | "log"; spacing: number; data: Datum[] };

const DATASETS: Record<string, DatasetCfg> = {
  layoffs: {
    max: 21,
    scale: "linear",
    spacing: 1.7,
    data: [
      { key: "oracle", value: 21, top: "21K", bottom: "Oracle", color: "#C74634", slug: "oracle" },
      { key: "amazon", value: 17, top: "17K", bottom: "Amazon", color: "#FF9900", slug: "amazon" },
      { key: "dell", value: 11, top: "11K", bottom: "Dell", color: "#007DB8", slug: "dell" },
      { key: "meta", value: 10, top: "10K", bottom: "Meta", color: "#0467DF", slug: "meta" },
      { key: "microsoft", value: 4.8, top: "4.8K", bottom: "MSFT", color: "#00A4EF", slug: "microsoft" },
    ],
  },
  speeds: {
    max: 24700,
    scale: "log",
    spacing: 1.25,
    data: [
      { key: "car", value: 85, top: "~85", bottom: "Car", color: "#4ea3ff", icon: "car" },
      { key: "train", value: 110, top: "~110", bottom: "Train", color: "#2dd4bf", icon: "train" },
      { key: "flight", value: 875, top: "~875", bottom: "Flight", color: "#a78bfa", icon: "plane" },
      { key: "jet", value: 2350, top: "2,350", bottom: "Su-30", color: "#ff9933", icon: "jet" },
      { key: "brahmos", value: 3500, top: "3,500", bottom: "BrahMos", color: "#ff5a1f", icon: "rocket" },
      { key: "agni", value: 24700, top: "Mach 20+", bottom: "Agni-V", color: "#e63946", icon: "rocket" },
    ],
  },
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const barH = (cfg: DatasetCfg, v: number) =>
  (cfg.scale === "log" ? Math.log10(v) / Math.log10(cfg.max) : v / cfg.max) * 5 + 0.2;

const Bars: React.FC<{ t: number; cfg: DatasetCfg }> = ({ t, cfg }) => (
  <>
    <ambientLight intensity={0.8} />
    <directionalLight position={[5, 9, 6]} intensity={1.7} />
    <pointLight position={[-5, 4, 5]} intensity={0.7} color="#88bbff" />
    {cfg.data.map((d, i) => {
      const h = barH(cfg, d.value);
      const grow = clamp((t - i * 0.12) / 0.5);
      const x = (i - (cfg.data.length - 1) / 2) * cfg.spacing;
      return (
        <mesh key={d.key} position={[x, (h * grow) / 2, 0]} scale={[1, Math.max(0.001, grow), 1]}>
          <boxGeometry args={[0.85, h, 0.85]} />
          <meshStandardMaterial color={d.color} emissive={d.color} emissiveIntensity={0.18} metalness={0.35} roughness={0.35} />
        </mesh>
      );
    })}
  </>
);

/** Data-driven 3D bar chart (layoffs or speeds) with a 2D label row beneath. */
export const Chart3D: React.FC<{ width: number; height: number; dataset?: "layoffs" | "speeds" }> = ({ width, height, dataset = "layoffs" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cfg = DATASETS[dataset];
  const chartW = Math.round(width);
  const chartH = Math.round(height * 0.4);
  const card = cfg.data.length > 5 ? 96 : 84;

  return (
    <div style={{ width: chartW, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <ThreeCanvas width={chartW} height={chartH} camera={{ position: [0, 3.6, 9.5], fov: 45 }} style={{ position: "relative" }}>
        <Bars t={t} cfg={cfg} />
      </ThreeCanvas>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 6, flexWrap: "wrap", maxWidth: chartW }}>
        {cfg.data.map((d, i) => {
          const on = clamp((t - (0.25 + i * 0.12)) * 4);
          return (
            <div key={d.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: on, transform: `translateY(${(1 - on) * 12}px)` }}>
              <div style={{ width: card, height: card * 0.82, background: "#fff", border: `4px solid ${INK}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 5px 0 ${INK}`, padding: 8, boxSizing: "border-box" }}>
                {d.slug ? <Mark slug={d.slug} size={card * 0.55} /> : d.icon ? <VehicleIcon kind={d.icon} size={card * 0.7} color={d.color} /> : null}
              </div>
              <div style={{ fontFamily: TE_DISPLAY, fontSize: 26, fontWeight: 800, color: d.color, WebkitTextStroke: `1.2px ${INK}` }}>{d.top}</div>
              <div style={{ fontFamily: TE_DISPLAY, fontSize: 20, fontWeight: 800, color: INK }}>{d.bottom}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
