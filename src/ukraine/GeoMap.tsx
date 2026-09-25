import React from "react";
import { clamp } from "../airace/lib";
import { BODY } from "../airace/fonts";
import ukrGeo from "./geo/ukr.json";
import rusGeo from "./geo/rus.json";

type Ring = [number, number][];
type Geom = { type: string; coordinates: unknown };

export const UKR_GEOM = (ukrGeo as any).features[0].geometry as Geom;
export const RUS_GEOM = (rusGeo as any).features[0].geometry as Geom;

export type Region = { lonMin: number; lonMax: number; latMin: number; latMax: number };

// Focus windows (Russia's far east is normalized past 180 and cropped out).
export const UKR_REGION: Region = { lonMin: 21, lonMax: 41, latMin: 43.5, latMax: 53 };
export const WIDE_REGION: Region = { lonMin: 20, lonMax: 64, latMin: 43, latMax: 60 };

const polygons = (geom: Geom): Ring[] => {
  if (geom.type === "Polygon") return geom.coordinates as Ring[];
  if (geom.type === "MultiPolygon") return (geom.coordinates as Ring[][]).flatMap((p) => p);
  return [];
};

const normLon = (lon: number) => (lon < -30 ? lon + 360 : lon);

const makeProjector = (region: Region, boxW: number, boxH: number) => {
  const midLat = (region.latMin + region.latMax) / 2;
  const cos = Math.cos((midLat * Math.PI) / 180);
  const rawX = (lon: number) => normLon(lon) * cos;
  const rawY = (lat: number) => -lat;
  const xmin = rawX(region.lonMin);
  const xmax = rawX(region.lonMax);
  const ymin = rawY(region.latMax);
  const ymax = rawY(region.latMin);
  const spanX = xmax - xmin;
  const spanY = ymax - ymin;
  const scale = Math.min(boxW / spanX, boxH / spanY);
  const offX = (boxW - spanX * scale) / 2;
  const offY = (boxH - spanY * scale) / 2;
  return (lon: number, lat: number): [number, number] => [
    offX + (rawX(lon) - xmin) * scale,
    offY + (rawY(lat) - ymin) * scale,
  ];
};

const ringToPath = (ring: Ring, project: (lon: number, lat: number) => [number, number]) => {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i][0], ring[i][1]);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d + "Z";
};

export type MapMarker = { lon: number; lat: number; label?: string; color: string; star?: boolean; on?: number; size?: number; textColor?: string };
export type MapArrow = { fromLon: number; fromLat: number; toLon: number; toLat: number; color: string; on: number };
export type MapCountry = { geom: Geom; fill: string; stroke: string; strokeWidth?: number; fillOpacity?: number; draw?: number };

export type MapMover = { lon: number; lat: number; w: number; h: number; el: React.ReactNode };
export type MapLine = { pts: [number, number][]; color: string; width?: number; dash?: boolean; on?: number };

/** Renders one or more country shapes (plus markers/arrows/movers) in a shared projection. */
export const MapView: React.FC<{
  width: number;
  height: number;
  region: Region;
  countries: MapCountry[];
  markers?: MapMarker[];
  arrows?: MapArrow[];
  movers?: MapMover[];
  lines?: MapLine[];
  pulse?: number;
}> = ({ width, height, region, countries, markers = [], arrows = [], movers = [], lines = [], pulse = 0 }) => {
  const project = makeProjector(region, width, height);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "hidden" }}>
      {countries.map((c, i) => {
        const d = polygons(c.geom).map((r) => ringToPath(r, project)).join(" ");
        return (
          <path
            key={i}
            d={d}
            fill={c.fill}
            fillOpacity={c.fillOpacity ?? 1}
            stroke={c.stroke}
            strokeWidth={c.strokeWidth ?? 3}
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - clamp(c.draw ?? 1)}
          />
        );
      })}

      {arrows.map((a, i) => {
        const [x1, y1] = project(a.fromLon, a.fromLat);
        const [x2, y2] = project(a.toLon, a.toLat);
        const on = clamp(a.on);
        const hx = x1 + (x2 - x1) * on;
        const hy = y1 + (y2 - y1) * on;
        const ang = Math.atan2(y2 - y1, x2 - x1);
        const ah = 16;
        const p1 = [hx - ah * Math.cos(ang - 0.4), hy - ah * Math.sin(ang - 0.4)];
        const p2 = [hx - ah * Math.cos(ang + 0.4), hy - ah * Math.sin(ang + 0.4)];
        return (
          <g key={i} opacity={clamp(on * 1.4)}>
            <line x1={x1} y1={y1} x2={hx} y2={hy} stroke={a.color} strokeWidth={6} strokeLinecap="round" />
            {on > 0.25 && <polygon points={`${hx},${hy} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={a.color} />}
          </g>
        );
      })}

      {lines.map((ln, i) => {
        const on = clamp(ln.on ?? 1);
        if (on <= 0.01) return null;
        const pts = ln.pts.map(([lo, la]) => project(lo, la));
        const n = Math.max(1, Math.ceil((pts.length - 1) * on));
        const shown = pts.slice(0, n + 1);
        const d = shown.map(([x, y], j) => `${j === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
        return (
          <path
            key={`ln${i}`}
            d={d}
            fill="none"
            stroke={ln.color}
            strokeWidth={ln.width ?? 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={ln.dash ? "12 10" : undefined}
            opacity={on}
          />
        );
      })}

      {markers.map((m, i) => {
        const [x, y] = project(m.lon, m.lat);
        const on = clamp(m.on ?? 1);
        if (on <= 0.01) return null;
        const r = 8 + pulse * 3;
        const fs = m.size ?? 24;
        return (
          <g key={i} opacity={on}>
            <circle cx={x} cy={y} r={r + 8} fill="none" stroke={m.color} strokeWidth={2} opacity={0.5} />
            {m.star ? (
              <text x={x} y={y + 7} textAnchor="middle" fontSize={26} fill={m.color}>
                ★
              </text>
            ) : (
              <circle cx={x} cy={y} r={7} fill={m.color} />
            )}
            {m.label && (
              <text
                x={x + 14}
                y={y + fs / 4}
                fontFamily={BODY}
                fontSize={fs}
                fontWeight={800}
                fill={m.textColor ?? "#eaf2ff"}
                style={{ paintOrder: "stroke", stroke: "#05070f", strokeWidth: 4 }}
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}

      {movers.map((m, i) => {
        const [x, y] = project(m.lon, m.lat);
        return (
          <foreignObject key={`mv${i}`} x={x - m.w / 2} y={y - m.h / 2} width={m.w} height={m.h} style={{ overflow: "visible" }}>
            <div style={{ width: m.w, height: m.h, display: "flex", alignItems: "center", justifyContent: "center" }}>{m.el}</div>
          </foreignObject>
        );
      })}
    </svg>
  );
};
