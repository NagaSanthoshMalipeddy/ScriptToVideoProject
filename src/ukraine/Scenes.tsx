import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, clamp, ease } from "../airace/lib";
import { BigTitle, Chip, RevealText } from "../airace/components/ui";
import { BODY } from "../airace/fonts";
import { AidArrows, CommodityIcon, TwoSideTable } from "./extra";
import {
  MapArrow,
  MapMarker,
  MapView,
  Region,
  RUS_GEOM,
  UKR_GEOM,
  UKR_REGION,
  WIDE_REGION,
} from "./GeoMap";

type SceneProps = { dur: number };

const UKR_FILL = "#2f6bff";
const UKR_STROKE = "#5ea0ff";
const RUS_FILL = "#ff4d5e";
const RUS_STROKE = "#ff8088";

const Kicker: React.FC<{ children: string; color?: string }> = ({ children, color = COLORS.dim }) => (
  <div style={{ fontFamily: BODY, fontSize: 24, fontWeight: 800, letterSpacing: 4, color, textTransform: "uppercase" }}>
    {children}
  </div>
);

const MapFrame: React.FC<{
  frame: number;
  region: Region;
  countries: React.ComponentProps<typeof MapView>["countries"];
  markers?: MapMarker[];
  arrows?: MapArrow[];
  top?: number;
  scale?: number;
}> = ({ frame, region, countries, markers, arrows, top = 0.2, scale = 1 }) => {
  const { width, height } = useVideoConfig();
  const mapW = width - 120;
  const mapH = height * 0.54;
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.2);
  return (
    <div style={{ position: "absolute", left: 60, top: height * top, width: mapW, height: mapH, transform: `scale(${scale})`, transformOrigin: "center" }}>
      <MapView width={mapW} height={mapH} region={region} countries={countries} markers={markers} arrows={arrows} pulse={pulse} />
    </div>
  );
};

// 1 — Opening
export const OpeningScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const draw = clamp(t / 1.6);
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={WIDE_REGION}
        countries={[
          { geom: RUS_GEOM, fill: RUS_FILL, fillOpacity: clamp((t - 0.4) * 0.6) * 0.28, stroke: RUS_STROKE, draw: clamp((t - 0.3) / 1.6) },
          { geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: clamp((t - 0.8) * 0.7) * 0.42, stroke: UKR_STROKE, draw },
        ]}
        markers={[
          { lon: 45, lat: 57, label: "RUSSIA", color: RUS_STROKE, on: clamp((t - 1.6) * 2) },
          { lon: 31, lat: 48.4, label: "UKRAINE", color: UKR_STROKE, on: clamp((t - 1.9) * 2) },
          { lon: 30.52, lat: 50.45, label: "KYIV", color: "#eaf2ff", star: true, on: clamp((t - 2.2) * 2) },
        ]}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <Kicker>Explainer</Kicker>
        <div style={{ height: 10 }} />
        <BigTitle text="RUSSIA–UKRAINE" frame={frame} delay={6} size={88} glow={COLORS.cyan} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.08 }}>
        <RevealText text="How did we get here?" frame={frame} delay={30} size={44} weight={700} color={COLORS.white} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 2 — 2014
export const YearScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={UKR_REGION}
        top={0.22}
        countries={[{ geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: 0.32, stroke: UKR_STROKE, draw: clamp(t / 1.4) }]}
        markers={[
          { lon: 34.0, lat: 45.3, label: "CRIMEA — annexed", color: RUS_STROKE, on: clamp((t - 1.4) * 2) },
          { lon: 38.2, lat: 48.2, label: "DONBAS — fighting", color: "#ffd166", on: clamp((t - 2.4) * 2) },
        ]}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <Kicker>It goes back to</Kicker>
        <div style={{ height: 6 }} />
        <BigTitle text="2014" frame={frame} delay={4} size={130} glow={COLORS.blue} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.06 }}>
        <RevealText text="Minsk agreements — but no lasting peace" frame={frame} delay={Math.round(dur * fps * 0.7)} size={34} weight={700} color={COLORS.white} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 3 — EU & NATO
export const NatoScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={UKR_REGION}
        top={0.24}
        countries={[{ geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: 0.32, stroke: UKR_STROKE, draw: clamp(t / 1.4) }]}
        markers={[{ lon: 30.52, lat: 50.45, label: "KYIV", color: "#eaf2ff", star: true, on: clamp((t - 1) * 2) }]}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <BigTitle text="EU & NATO TIES" frame={frame} size={62} glow={COLORS.cyan} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.08 }}>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: width * 0.9 }}>
          <Chip label="EUROPEAN UNION" color="#ffd166" progress={clamp((t - 0.6) * 3)} size={1} />
          <Chip label="NATO" color="#4361ee" progress={clamp((t - 1.1) * 3)} size={1} />
          <Chip label="RUSSIA OPPOSED" color="#ff4d5e" progress={clamp((t - 1.8) * 3)} size={1} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 4 — Feb 24, 2022
export const InvasionScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const arrows: MapArrow[] = [
    { fromLon: 28.5, fromLat: 52.2, toLon: 30.5, toLat: 50.6, color: RUS_STROKE, on: clamp((t - 1.2) * 1.5) },
    { fromLon: 40.5, fromLat: 49.8, toLon: 36.5, toLat: 49.2, color: RUS_STROKE, on: clamp((t - 1.8) * 1.5) },
    { fromLon: 34.2, fromLat: 45.2, toLon: 34.8, toLat: 47.2, color: RUS_STROKE, on: clamp((t - 2.4) * 1.5) },
  ];
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={UKR_REGION}
        top={0.22}
        countries={[{ geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: 0.22, stroke: UKR_STROKE, draw: 1 }]}
        markers={[{ lon: 30.52, lat: 50.45, label: "KYIV", color: "#eaf2ff", star: true, on: clamp((t - 0.6) * 2) }]}
        arrows={arrows}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <Kicker color="#ff8088">February 24, 2022</Kicker>
        <div style={{ height: 6 }} />
        <BigTitle text="FULL-SCALE INVASION" frame={frame} size={54} glow={"#ff4d5e"} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.07 }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["FROM BELARUS", "FROM RUSSIA", "MULTIPLE FRONTS"].map((l, i) => (
            <Chip key={l} label={l} color="#ff4d5e" progress={clamp((t - (1.4 + i * 0.4)) * 3)} size={0.95} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 5 — Front lines
export const FrontScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={UKR_REGION}
        top={0.22}
        countries={[{ geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: 0.24, stroke: UKR_STROKE, draw: 1 }]}
        markers={[
          { lon: 30.52, lat: 50.45, label: "KYIV — held", color: "#5ea0ff", star: true, on: clamp((t - 0.6) * 2) },
          { lon: 38.4, lat: 48.4, label: "EAST", color: RUS_STROKE, on: clamp((t - 1.4) * 2) },
          { lon: 34.8, lat: 46.6, label: "SOUTH", color: RUS_STROKE, on: clamp((t - 2.0) * 2) },
        ]}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <BigTitle text="THE WAR SPREADS" frame={frame} size={58} glow={COLORS.cyan} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.07 }}>
        <RevealText text="Millions of civilians displaced" frame={frame} delay={Math.round(dur * fps * 0.7)} size={36} weight={700} color="#ffd166" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 6 — Western aid
export const AidScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.08, textAlign: "center" }}>
        <BigTitle text="WESTERN SUPPORT" frame={frame} size={58} glow={COLORS.cyan} />
      </div>
      <div style={{ position: "absolute", left: width * 0.1, top: height * 0.24, width: width * 0.8, height: height * 0.42 }}>
        <AidArrows
          width={width * 0.8}
          height={height * 0.42}
          progress={clamp(t / 2.4)}
          target="UKRAINE"
          sources={[
            { label: "UNITED STATES", color: "#4361ee" },
            { label: "EUROPE", color: "#ffd166" },
            { label: "PARTNERS", color: "#2dd4bf" },
          ]}
        />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.12 }}>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["MILITARY", "FINANCIAL", "HUMANITARIAN"].map((l, i) => (
            <Chip key={l} label={l} color={COLORS.cyan} progress={clamp((t - (2 + i * 0.4)) * 3)} size={1} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 7 — Global impact
export const SanctionsScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BigTitle text="GLOBAL IMPACT" frame={frame} size={64} glow={COLORS.cyan} />
      <div style={{ marginTop: 24 }}>
        <Chip label="SANCTIONS ON RUSSIA" color="#ff4d5e" progress={clamp((t - 0.4) * 3)} size={1.15} />
      </div>
      <div style={{ marginTop: height * 0.06, display: "flex", gap: 26, justifyContent: "center", flexWrap: "wrap", maxWidth: width * 0.9 }}>
        <CommodityIcon kind="energy" label="ENERGY" color="#ffd166" progress={clamp((t - 1.2) * 3)} />
        <CommodityIcon kind="grain" label="GRAIN" color="#f4a261" progress={clamp((t - 1.6) * 3)} />
        <CommodityIcon kind="shipping" label="SHIPPING" color="#4ea3ff" progress={clamp((t - 2.0) * 3)} />
        <CommodityIcon kind="market" label="MARKETS" color="#2dd4bf" progress={clamp((t - 2.4) * 3)} />
      </div>
    </AbsoluteFill>
  );
};

// 8 — Peace talks
export const PeaceScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <BigTitle text="PEACE TALKS STALL" frame={frame} size={58} glow={COLORS.cyan} />
      <div style={{ marginTop: height * 0.06, width: width - 120 }}>
        <TwoSideTable
          width={width - 120}
          progress={clamp(t / (dur * 0.85))}
          left={{ title: "UKRAINE", color: "#4ea3ff", items: ["Security guarantees", "Territorial integrity"] }}
          right={{ title: "RUSSIA", color: "#ff4d5e", items: ["Territory", "Military status", "Security terms"] }}
        />
      </div>
    </AbsoluteFill>
  );
};

// 9 — Closing
export const ClosingScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const zoom = ease(t, [0, dur], [1.0, 1.14]);
  const q = t > dur - 3;
  return (
    <AbsoluteFill>
      <MapFrame
        frame={frame}
        region={WIDE_REGION}
        top={0.16}
        scale={zoom}
        countries={[
          { geom: RUS_GEOM, fill: RUS_FILL, fillOpacity: 0.22, stroke: RUS_STROKE, draw: 1 },
          { geom: UKR_GEOM, fill: UKR_FILL, fillOpacity: 0.36, stroke: UKR_STROKE, draw: 1 },
        ]}
        markers={[{ lon: 30.52, lat: 50.45, color: "#eaf2ff", star: true, on: 1 }]}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.05, textAlign: "center" }}>
        <BigTitle text="4+ YEARS ON" frame={frame} size={66} glow={COLORS.blue} />
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.12 }}>
        {q && (
          <div style={{ textAlign: "center", padding: "18px 40px", background: "rgba(5,7,15,0.6)", borderRadius: 20 }}>
            <BigTitle text="HOW & WHEN" frame={frame} delay={Math.round((dur - 3) * fps)} size={84} glow={COLORS.cyan} />
            <BigTitle text="WILL IT END?" frame={frame} delay={Math.round((dur - 3) * fps) + 8} size={84} glow={"#ff4d5e"} />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 10 — End screen
export const EndCardScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const fade = interpolate(t, [dur - 0.4, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <BigTitle text="FOLLOW" frame={frame} delay={4} size={130} glow={COLORS.cyan} />
      <div style={{ height: 26 }} />
      <RevealText text="World events • Geopolitics • Tech • Finance" frame={frame} delay={20} size={38} weight={700} color={COLORS.white} />
      <AbsoluteFill style={{ background: "#02030a", opacity: fade, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
