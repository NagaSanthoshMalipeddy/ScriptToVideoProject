import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BODY } from "../airace/fonts";
import { countryGeom, SatelliteMap } from "./SatelliteMap";

const geom = countryGeom;

// Style reference: satellite basemap, no borders, one highlighted country, centred caption.
export const SatMapDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const span = interpolate(frame, [0, 90, 150], [150, 150, 40], { extrapolateRight: "clamp" });
  const lon = interpolate(frame, [0, 90, 150], [-88, -88, -101], { extrapolateRight: "clamp" });
  const lat = interpolate(frame, [0, 90, 150], [18, 18, 24], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <SatelliteMap view={{ lon, lat, span }} width={1080} height={1920} highlights={[{ geom: geom("MEX"), label: "Mexico", labelAt: [-101.5, 23.5] }]} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1190, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 64, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.85)" }}>Most people</div>
    </AbsoluteFill>
  );
};
