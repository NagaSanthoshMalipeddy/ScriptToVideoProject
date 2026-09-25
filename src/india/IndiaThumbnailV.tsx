import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { INK } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { MapView } from "../ukraine/GeoMap";
import { GEO, INDIA_FILL, NEIGHBOURS, SOUTH_ASIA } from "./data";

// Static 9:16 (1080x1920) thumbnail for the India Borders video, cartoon theme.
export const IndiaThumbnailV: React.FC = () => {
  const mapW = 940;
  const mapH = 760;
  const countries = Object.entries(NEIGHBOURS).map(([key, nb]) => ({
    geom: GEO[key],
    fill: nb.color,
    fillOpacity: 0.9,
    stroke: INK,
    strokeWidth: 3,
    draw: 1,
  }));
  countries.push({ geom: GEO.india, fill: INDIA_FILL, fillOpacity: 1, stroke: INK, strokeWidth: 5, draw: 1 });
  const markers = [
    { lon: 79, lat: 22, label: "INDIA", color: INDIA_FILL, on: 1 },
    ...Object.values(NEIGHBOURS).map((nb) => ({ lon: nb.lon, lat: nb.lat, label: nb.name, color: nb.color, on: 1 })),
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #ffe9c9 0%, #cbe7ff 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.12 }}>
        {Array.from({ length: 30 }).map((_, i) => {
          const a = (i / 30) * Math.PI * 2;
          return <line key={i} x1={540} y1={640} x2={540 + Math.cos(a) * 1600} y2={640 + Math.sin(a) * 1600} stroke={INK} strokeWidth={30} />;
        })}
      </svg>

      {/* Title */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 150, fontWeight: 800, color: INK, lineHeight: 0.95 }}>INDIA's</div>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 170, fontWeight: 800, color: "#fff", WebkitTextStroke: `12px ${INK}`, textShadow: "0 10px 0 #ff5a1f", lineHeight: 0.95 }}>7 BORDERS</div>
      </div>

      {/* Map */}
      <div style={{ position: "absolute", left: (1080 - mapW) / 2, top: 430, width: mapW, height: mapH, background: "#eef5ff", border: `6px solid ${INK}`, borderRadius: 34, overflow: "hidden", boxShadow: `0 14px 0 ${INK}` }}>
        <MapView width={mapW} height={mapH} region={SOUTH_ASIA} countries={countries} markers={markers} />
      </div>

      {/* Curiosity banner */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 1230,
          transform: "rotate(-4deg)",
          background: "#e63946",
          color: "#fff",
          border: `9px solid ${INK}`,
          borderRadius: 22,
          padding: "14px 36px",
          fontFamily: TE_DISPLAY,
          fontSize: 84,
          fontWeight: 800,
          whiteSpace: "nowrap",
          boxShadow: `0 14px 0 ${INK}`,
        }}
      >
        WHICH IS LONGEST?
      </div>

      {/* Coastline tag */}
      <div style={{ position: "absolute", left: 60, top: 1500, background: "#1e88e5", color: "#fff", fontFamily: TE_DISPLAY, fontSize: 60, fontWeight: 800, border: `6px solid ${INK}`, borderRadius: 18, padding: "8px 28px", transform: "rotate(-5deg)" }}>
        COAST 7,516 km
      </div>

      {/* Character */}
      <div style={{ position: "absolute", right: 10, bottom: -30 }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.85} bob={0} skin="#ffffff" width={430} />
      </div>
    </AbsoluteFill>
  );
};
