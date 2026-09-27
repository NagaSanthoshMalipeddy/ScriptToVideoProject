import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { Character, Expr, Mouth } from "../story/Character";
import { TE_BODY, TE_DISPLAY } from "../story/fonts";
import { MapView, RUS_GEOM, UKR_GEOM, UKR_REGION, WIDE_REGION, type Region } from "../ukraine/GeoMap";
import { BigArrow, Button, Caption, DatePill, INK, SectionPill, Title } from "./ui";
import { LogoRow } from "./LogoRow";
import { Chart3D } from "./Chart3D";
import { VehicleIcon, VehicleKind } from "./Icons";
import { GEO } from "../india/data";
import { enterStyle, LaunchScene, RACERS, RaceTrack, racerFinishAt, shakeOffset, Speedometer, SpeedStreaks, TripHud, type Enter, type Hud } from "./Motion";

type MapKind = "intro" | "crimea" | "invasion" | "india";

const INDIA_REGION: Region = { lonMin: 66, lonMax: 98, latMin: 4, latMax: 37.8 };

export type CartoonBeat = {
  bg: string;
  label: string;
  darkLabel?: boolean;
  datePill?: string;
  title?: string;
  titleColor?: string;
  big?: boolean;
  caption?: string;
  chars?: { expr: Expr; skin?: string; label?: string; count?: number };
  logos?: string[];
  chart?: "layoffs" | "speeds";
  icon?: VehicleKind;
  route?: VehicleKind;
  map?: MapKind;
  button?: string;
  buttonColor?: string;
  arrow?: boolean;
  sfx?: "pop" | "whoosh" | "ding" | "riser" | "boom";
  compare?: CompareData;
  enter?: Enter;
  shake?: number;
  hud?: Hud;
  arc?: boolean;
  race?: boolean;
  launch?: boolean;
  slam?: boolean;
};

type CompareSide = { name: string; value?: number; display?: string; sub?: string; items?: string[]; color: string };
type CompareData = { metric: string; unit?: string; left: CompareSide; right: CompareSide; note?: string; winner?: "left" | "right" };

const MapCard: React.FC<{ frame: number; kind: MapKind; t: number; width: number; height: number }> = ({ frame, kind, t, width, height }) => {
  const w = width - 130;
  const h = height * 0.32;
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 14, mass: 0.7 } });

  if (kind === "india") {
    const mw = width - 110;
    const mh = Math.round(height * 0.46);
    const countries = [{ geom: GEO.india, fill: "#ffb865", stroke: INK, strokeWidth: 4, draw: clamp(t / 1.2) }];
    const markers = [
      { lon: 75, lat: 34, label: "Kashmir", color: "#ff5a1f", on: clamp((t - 1.7) * 3) },
      { lon: 77.5, lat: 8.2, label: "Kanyakumari", color: "#1e88e5", star: true, on: clamp((t - 2.4) * 3) },
    ];
    const lp = Easing.inOut(Easing.cubic)(clamp((t - 4.2) / 2.8));
    const tip: [number, number] = [75 + 2.5 * lp, 34 - 25.8 * lp];
    const lines = lp > 0 ? [{ pts: [[75, 34], tip] as [number, number][], color: "#e63946", width: 8 }] : [];
    const km = Math.round((3500 * lp) / 10) * 10;
    const bubble = (
      <div style={{ background: "#e63946", color: "#fff", border: `4px solid ${INK}`, borderRadius: 16, padding: "4px 14px", fontFamily: TE_DISPLAY, fontSize: 40, fontWeight: 800, whiteSpace: "nowrap", boxShadow: `0 6px 0 ${INK}`, transform: `scale(${lp >= 1 ? 1.15 : 1})` }}>
        {km.toLocaleString("en-US")} km
      </div>
    );
    const movers = lp > 0 ? [{ lon: tip[0] + 6.5, lat: tip[1] + 4.5, w: 240, h: 80, el: bubble }] : [];
    // Opens tight on Kashmir, then pulls out to reveal the whole country.
    const zoom = 1 + 0.9 * (1 - Easing.out(Easing.cubic)(clamp(t / 1.4)));
    return (
      <div style={{ width: mw, height: mh, borderRadius: 30, background: "#eaf5ff", overflow: "hidden", border: `4px solid ${INK}`, opacity: pop }}>
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "31% 12%" }}>
          <MapView width={mw} height={mh} region={INDIA_REGION} countries={countries} markers={markers} lines={lines} movers={movers} pulse={0.5 + 0.5 * Math.sin(frame * 0.2)} />
        </div>
      </div>
    );
  }

  const region = kind === "intro" ? WIDE_REGION : UKR_REGION;
  const countries = [
    { geom: RUS_GEOM, fill: "#e7ded0", stroke: INK, strokeWidth: 4, draw: 1 },
    { geom: UKR_GEOM, fill: "#3b6bff", stroke: INK, strokeWidth: 4, draw: clamp(t / 1.2) },
  ];
  const markers =
    kind === "intro"
      ? [
          { lon: 46, lat: 56, label: "RUSSIA", color: "#e7ded0", on: clamp((t - 0.8) * 2) },
          { lon: 31, lat: 48.6, label: "UKRAINE", color: "#3b6bff", on: clamp((t - 1.1) * 2) },
        ]
      : kind === "crimea"
      ? [{ lon: 34, lat: 45.3, label: "CRIMEA", color: "#ff4d5e", on: clamp((t - 0.6) * 2) }]
      : [{ lon: 30.52, lat: 50.45, label: "KYIV", color: "#3b6bff", star: true, on: clamp((t - 0.4) * 2) }];
  const arrows =
    kind === "invasion"
      ? [
          { fromLon: 28.5, fromLat: 52.2, toLon: 30.5, toLat: 50.6, color: "#ff4d5e", on: clamp((t - 0.8) * 1.6) },
          { fromLon: 40.5, fromLat: 49.8, toLon: 36.5, toLat: 49.2, color: "#ff4d5e", on: clamp((t - 1.3) * 1.6) },
          { fromLon: 34.2, fromLat: 45.2, toLon: 34.8, toLat: 47.2, color: "#ff4d5e", on: clamp((t - 1.8) * 1.6) },
        ]
      : [];
  return (
    <div style={{ width: w, height: h, borderRadius: 30, background: "#d7ecff", overflow: "hidden", border: `4px solid ${INK}`, transform: `scale(${0.85 + pop * 0.15})`, opacity: pop }}>
      <MapView width={w} height={h} region={region} countries={countries} markers={markers} arrows={arrows} pulse={0.5 + 0.5 * Math.sin(frame * 0.2)} />
    </div>
  );
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Each vehicle crosses the whole beat, but with a different acceleration curve so faster
// ones visibly launch harder — while never freezing at the bottom. Motion spans [0.06, 0.98]
// of the beat so it always starts and ends with the scene.
const TRAVEL_EASE: Record<VehicleKind, (v: number) => number> = {
  car: Easing.linear,
  train: Easing.inOut(Easing.ease),
  plane: Easing.out(Easing.cubic),
  jet: Easing.out(Easing.poly(4)),
  rocket: Easing.out(Easing.poly(6)),
};

const routeProgress = (kind: VehicleKind, t: number, travel: number, arc?: boolean) => {
  const raw = clamp((t - travel * 0.06) / Math.max(0.5, travel * 0.92));
  return arc ? Easing.inOut(Easing.cubic)(raw) : TRAVEL_EASE[kind](raw);
};

const R_START: [number, number] = [75, 34];
const R_END: [number, number] = [77.5, 8.2];
// Ballistic path bulges west over the Arabian Sea to read as a high arc.
const routeAt = (q: number, arc?: boolean): [number, number] => [
  R_START[0] + (R_END[0] - R_START[0]) * q - (arc ? 6 * Math.sin(Math.PI * q) : 0),
  R_START[1] + (R_END[1] - R_START[1]) * q,
];
const sampleRoute = (to: number, arc?: boolean) => Array.from({ length: 25 }, (_, i) => routeAt((i / 24) * to, arc));
const AIRBORNE: VehicleKind[] = ["plane", "jet", "rocket"];

// India map with a vehicle travelling Kashmir -> Kanyakumari, leaving a trail.
const RouteMap: React.FC<{ frame: number; t: number; p: number; travel: number; kind: VehicleKind; arc?: boolean; color: string; width: number; height: number }> = ({ frame, t, p, travel, kind, arc, color, width, height }) => {
  const w = width - 110;
  const h = Math.round(height * 0.48);
  const [lon, lat] = routeAt(p, arc);
  const q0 = p < 0.99 ? p : p - 0.01;
  const a0 = routeAt(q0, arc);
  const a1 = routeAt(q0 + 0.01, arc);
  const heading = (Math.atan2(-(a1[1] - a0[1]), (a1[0] - a0[0]) * Math.cos((lat * Math.PI) / 180)) * 180) / Math.PI;
  const air = AIRBORNE.includes(kind);
  const altitude = arc ? 1 + 0.35 * Math.sin(Math.PI * p) : 1;
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 14, mass: 0.7 } });
  const vehW = width * 0.18;
  const countries = [{ geom: GEO.india, fill: "#ffb865", fillOpacity: 0.9, stroke: INK, strokeWidth: 4, draw: 1 }];
  const markers = [
    { lon: 75, lat: 34, label: "Kashmir", color: "#ff5a1f", on: 1 },
    { lon: 77.5, lat: 8.2, label: "Kanyakumari", color: "#1e88e5", star: true, on: 1 },
  ];
  const lines = [
    { pts: sampleRoute(1, arc), color: "rgba(32,35,42,0.35)", width: 4, dash: true },
    ...(p > 0 ? [{ pts: sampleRoute(p, arc), color, width: 9 }] : []),
  ];
  const moving = p > 0.01 && p < 0.99;
  const el = (
    <div style={{ position: "relative", transform: air ? `rotate(${heading}deg) scale(${altitude})` : `translateY(${Math.sin(frame * 0.8) * 3}px)` }}>
      {air && moving && <SpeedStreaks frame={frame} size={vehW} color="#ffffff" strength={kind === "plane" ? 0.6 : 1.2} />}
      <VehicleIcon kind={kind} size={vehW} color={color} />
    </div>
  );
  const movers = [{ lon, lat, w: vehW, h: vehW * 0.75, el }];
  const push = 1 + 0.04 * clamp(t / Math.max(1, travel));
  return (
    <div style={{ width: w, height: h, borderRadius: 30, background: "#eaf5ff", overflow: "hidden", border: `4px solid ${INK}`, transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      <div style={{ transform: `scale(${push})` }}>
        <MapView width={w} height={h} region={INDIA_REGION} countries={countries} markers={markers} lines={lines} movers={movers} />
      </div>
    </div>
  );
};

const Crown: React.FC<{ size?: number }> = ({ size = 66 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 100 70">
    <path d="M8 60 L14 20 L34 44 L50 10 L66 44 L86 20 L92 60 Z" fill="#ffc93c" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={14} cy={18} r={6} fill="#ffc93c" stroke={INK} strokeWidth={4} />
    <circle cx={50} cy={8} r={6} fill="#ffc93c" stroke={INK} strokeWidth={4} />
    <circle cx={86} cy={18} r={6} fill="#ffc93c" stroke={INK} strokeWidth={4} />
    <rect x={8} y={60} width={84} height={8} fill="#ffc93c" stroke={INK} strokeWidth={4} />
  </svg>
);

// Decorative skyline that fills the bottom of a comparison panel.
const Skyline: React.FC<{ color: string; width: number }> = ({ color, width }) => {
  const hs = [30, 54, 40, 66, 46, 72, 38, 58, 34];
  const bw = width / hs.length;
  return (
    <svg width={width} height={80} style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.9 }}>
      {hs.map((h, i) => (
        <g key={i}>
          <rect x={i * bw + 2} y={80 - h} width={bw - 4} height={h} fill={color} stroke={INK} strokeWidth={3} />
          <rect x={i * bw + bw * 0.3} y={80 - h + 6} width={6} height={6} fill="#fff" opacity={0.7} />
          <rect x={i * bw + bw * 0.55} y={80 - h + 6} width={6} height={6} fill="#fff" opacity={0.7} />
        </g>
      ))}
    </svg>
  );
};

const VersusPanel: React.FC<{ side: CompareSide; isWinner: boolean; maxV: number; grow: number; pop: number; panelH: number }> = ({ side, isWinner, maxV, grow, pop, panelH }) => {
  const bannerH = 74;
  const bodyH = panelH - bannerH;
  const barMax = bodyH * 0.5;
  const barH = side.value ? barMax * (side.value / maxV) * grow : 0;
  return (
    <div style={{ flex: 1, position: "relative", transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      {isWinner && (
        <div style={{ position: "absolute", top: -54, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 3 }}>
          <Crown />
        </div>
      )}
      <div style={{ height: panelH, borderRadius: 34, border: `6px solid ${INK}`, overflow: "hidden", background: `linear-gradient(180deg, #ffffff 0%, ${side.color}18 100%)`, boxShadow: `0 12px 0 ${INK}`, display: "flex", flexDirection: "column" }}>
        <div style={{ height: bannerH, background: side.color, color: "#fff", fontFamily: TE_DISPLAY, fontSize: 42, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `5px solid ${INK}`, textAlign: "center", lineHeight: 1 }}>
          {side.name}
        </div>
        <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "18px 14px", gap: 10 }}>
          {side.display && <div style={{ fontFamily: TE_DISPLAY, fontSize: 70, fontWeight: 800, color: INK, lineHeight: 0.95, textAlign: "center" }}>{side.display}</div>}
          {side.sub && <div style={{ fontFamily: TE_BODY, fontSize: 30, fontWeight: 700, color: "#555", textAlign: "center" }}>{side.sub}</div>}
          {side.items && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              {side.items.map((it) => (
                <div key={it} style={{ fontFamily: TE_BODY, fontSize: 30, fontWeight: 800, color: INK, background: "#fff", border: `4px solid ${INK}`, borderRadius: 14, padding: "6px 18px", boxShadow: `0 5px 0 ${INK}` }}>{it}</div>
              ))}
            </div>
          )}
          {side.value ? (
            <div style={{ width: "48%", height: barH, background: side.color, border: `5px solid ${INK}`, borderRadius: 14, marginTop: 8, boxShadow: `0 6px 0 ${INK}` }} />
          ) : null}
          <Skyline color={side.color} width={999} />
        </div>
      </div>
    </div>
  );
};

// Full-screen head-to-head comparison card.
const VersusCard: React.FC<{ frame: number; data: CompareData; face?: React.ReactNode; width: number; height: number }> = ({ frame, data, face, width, height }) => {
  const grow = spring({ frame: frame - 8, fps: 30, config: { damping: 16, mass: 0.8 } });
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 13, mass: 0.7 } });
  const maxV = Math.max(data.left.value ?? 0, data.right.value ?? 0, 1);
  const winner = data.winner ?? ((data.left.value ?? 0) >= (data.right.value ?? 0) ? "left" : "right");
  const showWinner = (data.left.value ?? 0) > 0 || (data.right.value ?? 0) > 0 || data.winner != null;
  const panelH = Math.round(height * 0.5);
  return (
    <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: height * 0.11 }}>
      <Title text={data.metric} frame={frame} delay={3} size={Math.min(84, width / 12)} color={INK} />
      {data.unit && <Caption text={data.unit} frame={frame} delay={6} />}
      <div style={{ position: "relative", width: width - 70, marginTop: 40, display: "flex", gap: 26, alignItems: "flex-start" }}>
        <VersusPanel side={data.left} isWinner={showWinner && winner === "left"} maxV={maxV} grow={grow} pop={pop} panelH={panelH} />
        <VersusPanel side={data.right} isWinner={showWinner && winner === "right"} maxV={maxV} grow={grow} pop={pop} panelH={panelH} />
        <div style={{ position: "absolute", left: "50%", top: panelH / 2, transform: `translate(-50%, -50%) scale(${0.6 + pop * 0.4})`, width: 118, height: 118, borderRadius: "50%", background: "#ffc93c", border: `7px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: TE_DISPLAY, fontSize: 54, fontWeight: 800, color: INK, boxShadow: `0 10px 0 ${INK}`, zIndex: 4 }}>VS</div>
      </div>
      {data.note && <div style={{ marginTop: 34 }}><Caption text={data.note} frame={frame} delay={14} /></div>}
      {face && <div style={{ position: "absolute", bottom: 24, left: 24 }}>{face}</div>}
    </AbsoluteFill>
  );
};

const talkingAt = (words: Section["words"], abs: number) => words.some((w) => abs >= w.start - 0.04 && abs < w.end + 0.04);

const CartoonBeatView: React.FC<{ section: Section; beat: CartoonBeat }> = ({ section, beat }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const abs = section.start + t;

  const talking = section.words.length ? talkingAt(section.words, abs) : t < (section.end - section.start) * 0.85;
  const mouth: Mouth = talking ? (Math.sin(frame * 2.1) > 0 ? "open" : "flat") : beat.chars?.expr === "happy" ? "smile" : "closed";
  const blinkPhase = t % 2.7;
  const blink = blinkPhase > 2.55 ? Math.sin(((blinkPhase - 2.55) / 0.15) * Math.PI) : 0;
  const bob = Math.sin(frame * 0.18) * 4;
  const excited = beat.chars?.expr === "happy" || beat.chars?.expr === "surprised";
  const armRaise = excited ? 0.4 + 0.4 * Math.max(0, Math.sin(frame * 0.5)) : 0;

  const count = beat.chars?.count ?? 1;
  const charW = width * (beat.big ? 0.34 : 0.4);
  const travel = section.end - section.start;
  const p = beat.route ? routeProgress(beat.route, t, travel, beat.arc) : 0;
  const corner = !!(beat.route || beat.map === "india" || beat.race || beat.launch || beat.slam);
  const shake = shakeOffset(beat.shake, frame);

  if (beat.compare) {
    const face = beat.chars ? (
      <Character expr={beat.chars.expr} mouth={mouth} blink={blink} armRaise={armRaise} bob={bob} skin={beat.chars.skin ?? "#ffffff"} width={width * 0.24} />
    ) : undefined;
    return (
      <AbsoluteFill style={{ background: beat.bg }}>
        <Audio src={staticFile(`sfx/${beat.sfx ?? "pop"}.wav`)} volume={0.35} />
        <SectionPill text={beat.label} frame={frame} dark={beat.darkLabel} />
        <VersusCard frame={frame} data={beat.compare} face={face} width={width} height={height} />
        {beat.button && (
          <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
            <Button text={beat.button} frame={frame} delay={8} bg={beat.buttonColor ?? "#3b6bff"} />
          </div>
        )}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: beat.bg }}>
      <Audio src={staticFile(`sfx/${beat.sfx ?? (beat.big ? "boom" : "whoosh")}.wav`)} volume={0.35} />
      {beat.logos || beat.chart ? (
        <Sequence from={10} durationInFrames={30}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.4} />
        </Sequence>
      ) : null}
      {beat.race &&
        RACERS.map((r) => (
          <Sequence key={r.name} from={Math.round(racerFinishAt(r.hours) * fps)} durationInFrames={20}>
            <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
          </Sequence>
        ))}
      <SectionPill text={beat.label} frame={frame} dark={beat.darkLabel} />

      {beat.big && (
        <svg width={width} height={height} style={{ position: "absolute", opacity: 0.1 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return <line key={i} x1={width / 2} y1={height * 0.36} x2={width / 2 + Math.cos(a) * width} y2={height * 0.36 + Math.sin(a) * width} stroke={INK} strokeWidth={20} />;
          })}
        </svg>
      )}

      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
      <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: beat.slam || beat.launch ? "center" : "flex-start", paddingTop: beat.slam || beat.launch ? 0 : height * 0.13, paddingLeft: 40, paddingRight: 40, gap: 30, ...enterStyle(beat.enter, frame, width, height) }}>
        {beat.datePill && <DatePill text={beat.datePill} frame={frame} delay={2} />}
        {beat.title && <Title text={beat.title} frame={frame} delay={5} size={beat.big ? Math.min(150, width / 7) : Math.min(96, width / 10.5)} color={beat.titleColor} />}

        {beat.chars && !corner && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {beat.chars.label && (
              <div style={{ fontFamily: TE_BODY, fontSize: 30, fontWeight: 800, color: INK, background: "#fff", border: `4px solid ${INK}`, borderRadius: 12, padding: "3px 16px" }}>{beat.chars.label}</div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ marginLeft: i ? -charW * 0.18 : 0 }}>
                  <Character
                    expr={beat.chars!.expr}
                    mouth={i === count - 1 ? mouth : "closed"}
                    blink={blink}
                    armRaise={i === count - 1 ? armRaise : 0}
                    bob={bob + i * 2}
                    skin={beat.chars!.skin ?? "#ffffff"}
                    width={charW / (count > 1 ? 1.5 : 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {beat.button && (
          <div>
            <Button text={beat.button} frame={frame} delay={8} bg={beat.buttonColor ?? "#3b6bff"} />
          </div>
        )}

        {beat.icon && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <VehicleIcon kind={beat.icon} size={width * 0.5} color={beat.titleColor ?? "#ff9933"} />
          </div>
        )}

        {beat.route && (
          <RouteMap frame={frame} t={t} p={p} travel={travel} kind={beat.route} arc={beat.arc} color={beat.titleColor ?? "#ff9933"} width={width} height={height} />
        )}

        {beat.route && beat.hud && <TripHud frame={frame} p={p} hud={beat.hud} color={beat.titleColor ?? INK} />}

        {beat.slam && (
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: width - 80, height: 46, backgroundImage: `repeating-linear-gradient(45deg, ${INK} 0 26px, #ffc93c 26px 52px)`, border: `4px solid ${INK}` }} />
            <div style={{ background: "#fff", border: `6px solid ${INK}`, borderRadius: 40, boxShadow: `0 12px 0 ${INK}`, padding: "20px 30px" }}>
              <Speedometer frame={frame} speed={30000} size={width * 0.8} label="OFF THE CHARTS" delay={3} jitter={clamp((t - 0.6) * 2) * 0.012} />
            </div>
            <div style={{ width: width - 80, height: 46, backgroundImage: `repeating-linear-gradient(-45deg, ${INK} 0 26px, #ffc93c 26px 52px)`, border: `4px solid ${INK}` }} />
          </div>
        )}

        {beat.launch && <LaunchScene frame={frame} t={t} width={width} height={height} />}

        {beat.race && <RaceTrack frame={frame} t={t} width={width} height={height} />}

        {beat.map && <MapCard frame={frame} kind={beat.map} t={t} width={width} height={height} />}

        {beat.logos && <LogoRow slugs={beat.logos} frame={frame} delay={10} />}

        {beat.chart && <Chart3D width={width - 100} height={height} dataset={beat.chart} />}

        {beat.arrow && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BigArrow width={width * 0.5} progress={clamp((t - 0.6) * 1.5)} />
          </div>
        )}

        {beat.caption && <Caption text={beat.caption} frame={frame} delay={12} />}
      </AbsoluteFill>
      </AbsoluteFill>

      {corner && beat.chars && (
        <div style={{ position: "absolute", right: 20, bottom: 10 }}>
          <Character expr={beat.chars.expr} mouth={mouth} blink={blink} armRaise={armRaise} bob={bob} skin={beat.chars.skin ?? "#ffffff"} width={width * 0.2} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const CartoonExplainer: React.FC<{ timing: Timing; beats: CartoonBeat[] }> = ({ timing, beats }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffe0c2" }}>
      <Audio src={staticFile(timing.audio)} />
      {secs.map((section, i) => {
        const beat = beats[Math.min(i, beats.length - 1)];
        const from = section.start;
        const endSec = i + 1 < secs.length ? secs[i + 1].start : total + 0.4;
        const startF = Math.round(from * fps);
        const lenF = Math.max(1, Math.round((endSec - from) * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <CartoonBeatView section={section} beat={beat} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
