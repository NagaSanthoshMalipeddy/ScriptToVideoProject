import React from "react";
import { AbsoluteFill } from "remotion";
import { Character } from "../story/Character";
import { INK } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { MapView } from "../ukraine/GeoMap";
import { COUNTRIES, REF_LAT, WONDERS } from "./data";
import { WonderArt } from "./Art";
import { pinMover } from "./WondersExplainer";

// Static 9:16 (1080x1920) thumbnail. The Shorts feed shows only the middle ~1080x1560,
// so every important element sits inside y 300-1620; the edges are decoration only.
export const WondersThumbnailV: React.FC = () => {
  const mapW = 1000;
  const mapH = 470;
  const colored = new Map(WONDERS.map((w) => [w.iso, w.color]));
  const countries = COUNTRIES.map((c) => ({ geom: c.geom, fill: colored.get(c.iso) ?? "#f6ecd9", stroke: INK, strokeWidth: 0.8, draw: 1 }));
  const region = { lonMin: -118, lonMax: 150, latMin: -58, latMax: 76, refLat: REF_LAT, noWrap: true };
  const movers = WONDERS.map((w) => pinMover(w, 40));
  const collage = [
    { id: "chichen", size: 250, left: 30, top: 1130, rot: -6 },
    { id: "taj", size: 300, left: 250, top: 1090, rot: 3 },
    { id: "wall", size: 270, left: 530, top: 1110, rot: -3 },
    { id: "colosseum", size: 240, left: 800, top: 1140, rot: 6 },
  ];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 30%, #ffe29a 0%, #ffab5e 45%, #e0476b 100%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.13 }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const a = (i / 34) * Math.PI * 2;
          return <line key={i} x1={540} y1={640} x2={540 + Math.cos(a) * 1700} y2={640 + Math.sin(a) * 1700} stroke={INK} strokeWidth={26} />;
        })}
      </svg>

      <div style={{ position: "absolute", left: 0, right: 0, top: 310, textAlign: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 176, fontWeight: 800, color: "#fff", WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", lineHeight: 0.9, textShadow: `0 12px 0 ${INK}` }}>7 WONDERS</div>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: 70, fontWeight: 800, color: INK, marginTop: -40 }}>of the World</div>
      </div>

      <div style={{ position: "absolute", left: 40, top: 590, width: mapW, height: mapH, background: "#bfe3ff", border: `6px solid ${INK}`, borderRadius: 30, overflow: "hidden", boxShadow: `0 14px 0 ${INK}` }}>
        <MapView width={mapW} height={mapH} region={region} countries={countries} movers={movers} />
      </div>

      {collage.map((c) => (
        <div key={c.id} style={{ position: "absolute", left: c.left, top: c.top, transform: `rotate(${c.rot}deg)`, filter: `drop-shadow(0 12px 0 ${INK})` }}>
          <WonderArt id={c.id} size={c.size} />
        </div>
      ))}

      <div style={{ position: "absolute", left: 0, right: 0, top: 1440, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: "rotate(-3deg)", background: "#e63946", color: "#fff", border: `9px solid ${INK}`, borderRadius: 22, padding: "8px 34px", fontFamily: TE_DISPLAY, fontSize: 84, fontWeight: 800, boxShadow: `0 14px 0 ${INK}`, whiteSpace: "nowrap" }}>
          WHERE ARE THEY?
        </div>
      </div>

      <div style={{ position: "absolute", right: -10, top: 1380 }}>
        <Character expr="surprised" mouth="o" blink={0} armRaise={0.85} bob={0} skin="#ffffff" width={170} />
      </div>
    </AbsoluteFill>
  );
};
