import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { MapView } from "../ukraine/GeoMap";
import { GEO } from "../india/data";
import { VehicleIcon } from "./Icons";
import { INK } from "./ui";
import { TE_DISPLAY } from "../story/fonts";

const REGION = { lonMin: 66, lonMax: 98, latMin: 6, latMax: 37.8 };

// Static 9:16 (1080x1920) clickbait thumbnail for the Kashmir->Kanyakumari speed short.
export const SpeedThumbnailV: React.FC = () => {
  const mapW = 620;
  const mapH = 1000;
  const countries = [{ geom: GEO.india, fill: "#ffb865", fillOpacity: 0.95, stroke: INK, strokeWidth: 6, draw: 1 }];
  const markers = [
    { lon: 75, lat: 34, label: "KASHMIR", color: "#ff5a1f", on: 1 },
    { lon: 77.5, lat: 8.2, label: "KANYAKUMARI", color: "#1e88e5", star: true, on: 1 },
  ];
  const arrows = [{ fromLon: 75, fromLat: 34, toLon: 77.5, toLat: 9, color: "#e63946", on: 1 }];
  const movers = [{ lon: 76.6, lat: 19, w: 260, h: 200, el: <VehicleIcon kind="rocket" size={260} color="#e63946" /> }];

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 34%, #ffd27f 0%, #ff8b3d 42%, #b5340a 100%)" }}>
      {/* speed lines */}
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.16 }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const a = (i / 34) * Math.PI * 2;
          return <line key={i} x1={540} y1={720} x2={540 + Math.cos(a) * 1700} y2={720 + Math.sin(a) * 1700} stroke={INK} strokeWidth={26} />;
        })}
      </svg>

      {/* distance tag */}
      <div style={{ position: "absolute", left: 60, top: 56, background: INK, color: "#ffe45e", fontFamily: TE_DISPLAY, fontSize: 70, fontWeight: 800, borderRadius: 20, padding: "6px 30px", transform: "rotate(-5deg)", boxShadow: `0 10px 0 rgba(0,0,0,0.35)` }}>
        3,500 KM
      </div>

      {/* Title top */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 240, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 150, fontWeight: 800, color: "#fff", WebkitTextStroke: `12px ${INK}`, lineHeight: 0.9, textShadow: "0 12px 0 rgba(0,0,0,0.35)" }}>
          KASHMIR
        </div>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 92, fontWeight: 800, color: INK, lineHeight: 1.1 }}>to KANYAKUMARI</div>
      </div>

      {/* India map with route + missile */}
      <div style={{ position: "absolute", left: 40, top: 560, width: mapW, height: mapH }}>
        <MapView width={mapW} height={mapH} region={REGION} countries={countries} markers={markers} arrows={arrows} movers={movers} />
      </div>

      {/* Big contrast: HOURS -> MINUTES */}
      <div style={{ position: "absolute", right: 40, top: 640, textAlign: "center", transform: "rotate(4deg)" }}>
        <div style={{ position: "relative", fontFamily: TE_DISPLAY, fontSize: 130, fontWeight: 800, color: INK, opacity: 0.85, lineHeight: 0.9 }}>
          44 HRS
          <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 16, background: "#e63946", transform: "rotate(-8deg)", borderRadius: 8 }} />
        </div>
        <div style={{ marginTop: 18, fontFamily: TE_DISPLAY, fontSize: 200, fontWeight: 800, color: "#ffe45e", WebkitTextStroke: `14px ${INK}`, lineHeight: 0.85, textShadow: "0 14px 0 rgba(0,0,0,0.4)" }}>
          MINS?!
        </div>
      </div>

      {/* Shocked character bottom-right */}
      <div style={{ position: "absolute", right: 24, bottom: 20 }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.9} bob={0} skin="#ffffff" width={520} />
      </div>

      {/* bottom red banner */}
      <div style={{ position: "absolute", left: 50, bottom: 120, transform: "rotate(-4deg)", background: "#e63946", color: "#fff", border: `9px solid ${INK}`, borderRadius: 22, padding: "14px 36px", fontFamily: TE_DISPLAY, fontSize: 82, fontWeight: 800, boxShadow: `0 14px 0 ${INK}` }}>
        SPEED SHOCK!
      </div>
    </AbsoluteFill>
  );
};
