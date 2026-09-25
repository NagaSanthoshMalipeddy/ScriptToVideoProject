import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { INK } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { MapView, type Region } from "../ukraine/GeoMap";
import { GEO } from "../india/data";
import { CHN, IND, LAC, LOC, PAK, ZONES, geomOf } from "./zones";

const REGION: Region = { lonMin: 71, lonMax: 82, latMin: 30, latMax: 37.9 };
const ORDER = ["gilgit", "shaksgam", "aksai", "ajk", "jk", "ladakh", "siachen"];

// Static 9:16 (1080x1920) clickbait thumbnail for the Kashmir explainer.
export const KashmirThumbnailV: React.FC = () => {
  const mapW = 760;
  const mapH = 900;
  const countries = [
    { geom: GEO.india, fill: "#ffe6c4", fillOpacity: 1, stroke: INK, strokeWidth: 4, draw: 1 },
    ...ORDER.map((id) => ({ geom: geomOf(ZONES[id]), fill: ZONES[id].color, fillOpacity: 0.96, stroke: INK, strokeWidth: 3, draw: 1 })),
  ];
  const markers = [
    { lon: 73.6, lat: 36.1, label: "Gilgit-Baltistan", color: PAK, on: 1, size: 22 },
    { lon: 76.4, lat: 36.7, label: "Shaksgam", color: CHN, on: 1, size: 22 },
    { lon: 79.0, lat: 35.1, label: "Aksai Chin", color: CHN, on: 1, size: 22 },
    { lon: 72.2, lat: 33.4, label: "Azad Kashmir", color: PAK, on: 1, size: 22 },
    { lon: 74.8, lat: 32.7, label: "J&K", color: IND, on: 1, size: 22 },
    { lon: 77.4, lat: 33.6, label: "Ladakh", color: IND, on: 1, size: 22 },
    { lon: 76.5, lat: 35.6, label: "Siachen", color: "#333", on: 1, size: 20 },
  ];
  const lines = [
    { pts: LOC, color: "#111", width: 6, dash: true, on: 1 },
    { pts: LAC, color: "#111", width: 6, dash: true, on: 1 },
  ];
  const legend = [
    { c: IND, t: "INDIA" },
    { c: PAK, t: "PAKISTAN" },
    { c: CHN, t: "CHINA" },
  ];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 32%, #ffd27f 0%, #ff8b3d 44%, #7a1f6b 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.15 }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const a = (i / 34) * Math.PI * 2;
          return <line key={i} x1={540} y1={720} x2={540 + Math.cos(a) * 1700} y2={720 + Math.sin(a) * 1700} stroke={INK} strokeWidth={26} />;
        })}
      </svg>

      {/* Title */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 70, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 180, fontWeight: 800, color: "#fff", WebkitTextStroke: `13px ${INK}`, lineHeight: 0.9, textShadow: "0 12px 0 rgba(0,0,0,0.35)" }}>KASHMIR</div>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 82, fontWeight: 800, color: INK, lineHeight: 1.2 }}>3 Countries, 1 Region</div>
      </div>

      {/* Zone map */}
      <div style={{ position: "absolute", left: (1080 - mapW) / 2 - 60, top: 340, width: mapW, height: mapH, background: "#eaf5ff", border: `6px solid ${INK}`, borderRadius: 30, overflow: "hidden", boxShadow: `0 16px 0 ${INK}` }}>
        <MapView width={mapW} height={mapH} region={REGION} countries={countries} markers={markers} lines={lines} />
      </div>

      {/* Legend */}
      <div style={{ position: "absolute", right: 26, top: 420, display: "flex", flexDirection: "column", gap: 16 }}>
        {legend.map((l) => (
          <div key={l.t} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `4px solid ${INK}`, borderRadius: 14, padding: "8px 16px", boxShadow: `0 6px 0 ${INK}` }}>
            <div style={{ width: 34, height: 34, background: l.c, border: `3px solid ${INK}`, borderRadius: 7 }} />
            <span style={{ fontFamily: TE_DISPLAY, fontSize: 40, fontWeight: 800, color: INK }}>{l.t}</span>
          </div>
        ))}
      </div>

      {/* Banner */}
      <div style={{ position: "absolute", left: 40, bottom: 250, transform: "rotate(-4deg)", background: "#e63946", color: "#fff", border: `9px solid ${INK}`, borderRadius: 22, padding: "16px 40px", fontFamily: TE_DISPLAY, fontSize: 90, fontWeight: 800, boxShadow: `0 14px 0 ${INK}` }}>
        WHO OWNS IT?
      </div>

      {/* Character */}
      <div style={{ position: "absolute", right: 10, bottom: -30 }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.85} bob={0} skin="#ffffff" width={430} />
      </div>
    </AbsoluteFill>
  );
};
