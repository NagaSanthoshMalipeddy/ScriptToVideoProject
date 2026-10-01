import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { geomPath } from "../ukraine/GeoMap";
import world50 from "./world50.json";

// Satellite basemap (NASA Blue Marble, July, topo + bathymetry) in Web Mercator.
// Build the images once with `node pipeline/make_basemap.mjs`.
export type SatView = { lon: number; lat: number; span: number };
type Geom = { type: string; coordinates: unknown };
export type Highlight = { geom: Geom; label?: string; labelAt?: [number, number]; fill?: string; stroke?: string; labelSize?: number };

// 1:50m outlines (recognised borders, official India outline) — use these for highlights on the detailed imagery.
export const countryGeom = (iso: string): Geom => {
  const c = (world50 as unknown as { countries: { iso: string; geometry: Geom }[] }).countries.find((x) => x.iso === iso);
  if (!c) throw new Error(`No outline for ${iso}`);
  return c.geometry;
};

const RAD = Math.PI / 180;
const MAX_LAT = 85;
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * RAD) / 2));
const invMerc = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RAD;

// view.span = degrees of longitude across the frame width; view.lat/lon sit at (width/2, height*anchorY).
export const makeSatProjector = (view: SatView, width: number, height: number, anchorY = 0.5) => {
  const s = width / view.span;
  const k = s / RAD;
  const y0 = merc(view.lat);
  const project = (lon: number, lat: number): [number, number] => [width / 2 + (lon - view.lon) * s, height * anchorY - (merc(lat) - y0) * k];
  const bounds = {
    lonMin: view.lon - width / 2 / s,
    lonMax: view.lon + width / 2 / s,
    latMax: invMerc(y0 + (height * anchorY) / k),
    latMin: invMerc(y0 - (height * (1 - anchorY)) / k),
  };
  return { project, pxPerDeg: s, bounds };
};

// An equirectangular image strip [latTop..latBot] drawn in horizontal bands so it follows the Mercator stretch.
const Banded: React.FC<{ src: string; lon0: number; lon1: number; latTop: number; latBot: number; bands: number; project: (lon: number, lat: number) => [number, number]; clipTop: number; clipBot: number }> = ({ src, lon0, lon1, latTop, latBot, bands, project, clipTop, clipBot }) => {
  const step = (latTop - latBot) / bands;
  const out: React.ReactNode[] = [];
  for (let b = 0; b < bands; b++) {
    const a = latTop - b * step;
    const z = a - step;
    if (z > clipTop || a < clipBot || z >= MAX_LAT || a <= -MAX_LAT) continue;
    const [x0, yA] = project(lon0, a);
    const [x1, yZ] = project(lon1, z);
    const h = yZ - yA;
    if (h < 0.5) continue;
    out.push(
      <div key={b} style={{ position: "absolute", left: x0, top: yA, width: x1 - x0 + 1, height: h + 1, overflow: "hidden" }}>
        <Img src={src} style={{ position: "absolute", left: 0, top: -b * h, width: x1 - x0 + 1, height: h * bands + 1 }} />
      </div>,
    );
  }
  return <>{out}</>;
};

export const SatelliteMap: React.FC<{
  view: SatView;
  width: number;
  height: number;
  anchorY?: number;
  highlights?: Highlight[];
  darken?: number;
  children?: React.ReactNode;
}> = ({ view, width, height, anchorY = 0.5, highlights = [], darken = 0, children }) => {
  const { project, pxPerDeg, bounds } = makeSatProjector(view, width, height, anchorY);
  const offsets = [-360, 0, 360].filter((o) => bounds.lonMax > -180 + o && bounds.lonMin < 180 + o);
  const images: React.ReactNode[] = [];
  if (pxPerDeg < 24) {
    for (const o of offsets)
      images.push(<Banded key={`w${o}`} src={staticFile("basemap/world.jpg")} lon0={-180 + o} lon1={180 + o} latTop={90} latBot={-90} bands={72} project={project} clipTop={bounds.latMax + 3} clipBot={bounds.latMin - 3} />);
  } else {
    const r0 = Math.max(0, Math.floor((90 - bounds.latMax) / 10));
    const r1 = Math.min(17, Math.floor((90 - bounds.latMin) / 10));
    for (const o of offsets) {
      const c0 = Math.max(0, Math.floor((bounds.lonMin - o + 180) / 10));
      const c1 = Math.min(35, Math.floor((bounds.lonMax - o + 180) / 10));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const lon0 = -180 + c * 10 + o;
          const latTop = 90 - r * 10;
          images.push(<Banded key={`${o}_${r}_${c}`} src={staticFile(`basemap/z1/${r}_${c}.jpg`)} lon0={lon0} lon1={lon0 + 10} latTop={latTop} latBot={latTop - 10} bands={5} project={project} clipTop={bounds.latMax + 1} clipBot={bounds.latMin - 1} />);
        }
    }
  }
  const lw = Math.max(1.5, Math.min(4, pxPerDeg / 12));
  return (
    <AbsoluteFill style={{ background: "#0b2a44", overflow: "hidden" }}>
      {images}
      {darken > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${darken})` }} />}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        {highlights.map((h, i) =>
          offsets.map((o) => (
            <path key={`${i}${o}`} d={geomPath(h.geom as never, (lo, la) => project(lo + o, la))} fill={h.fill ?? "rgba(255,190,20,0.72)"} stroke={h.stroke ?? "#ffd23f"} strokeWidth={lw} strokeLinejoin="round" />
          )),
        )}
      </svg>
      {highlights.map((h, i) => {
        if (!h.label || !h.labelAt) return null;
        const o = offsets.reduce((b, x) => (Math.abs(h.labelAt![0] + x - view.lon) < Math.abs(h.labelAt![0] + b - view.lon) ? x : b), 0);
        const [x, y] = project(h.labelAt[0] + o, h.labelAt[1]);
        return (
          <div key={`l${i}`} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", fontFamily: "Inter, Arial, sans-serif", fontStyle: "italic", fontWeight: 700, fontSize: h.labelSize ?? Math.max(14, Math.min(40, pxPerDeg * 1.1)), color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>
            {h.label}
          </div>
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
