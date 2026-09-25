import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { Character, Expr } from "../story/Character";
import { Button, Caption, INK, SectionPill, Title } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { MapView } from "../ukraine/GeoMap";
import { BorderChart3D } from "./BorderChart3D";
import { GEO, INDIA_FILL, NEIGHBOURS, NEUTRAL_FILL, SOUTH_ASIA } from "./data";

type IBeat = {
  bg: string;
  label: string;
  title: string;
  titleColor?: string;
  big?: boolean;
  caption?: string;
  expr: Expr;
  focus?: string;
  highlightAll?: boolean;
  km?: number;
  coastline?: boolean;
  chart?: boolean;
  button?: string;
  sfx?: "pop" | "whoosh" | "ding" | "riser" | "boom";
};

const BEATS: IBeat[] = [
  { bg: "#ffe9c9", label: "DID YOU KNOW?", title: "7 NEIGHBOURS!", expr: "surprised", highlightAll: true, caption: "India shares land borders with 7 countries", sfx: "pop" },
  { bg: "#e0d4f7", label: "QUESTION", title: "Longest border?", expr: "worried", highlightAll: true, caption: "Can you guess which one?" },
  { bg: "#d7f0dd", label: "PAKISTAN", title: "PAKISTAN", titleColor: "#0a7c3a", expr: "neutral", focus: "pakistan", km: 3323, caption: "the western border" },
  { bg: "#ffdfe0", label: "NEPAL", title: "NEPAL", titleColor: "#DC143C", expr: "happy", focus: "nepal", km: 1751, caption: "along the Himalayas" },
  { bg: "#fff0cc", label: "BHUTAN", title: "BHUTAN", titleColor: "#c47a00", expr: "happy", focus: "bhutan", km: 699, caption: "the small northern neighbour" },
  { bg: "#ffd9c2", label: "SUSPENSE", title: "The longest…", expr: "surprised", big: true, caption: "wait for it…", sfx: "riser" },
  { bg: "#cdeede", label: "BANGLADESH", title: "BANGLADESH", titleColor: "#006a4e", expr: "happy", big: true, focus: "bangladesh", km: 4096, caption: "the LONGEST border!", sfx: "boom" },
  { bg: "#ffd6d6", label: "CHINA", title: "CHINA", titleColor: "#de2910", expr: "surprised", focus: "china", km: 3488, caption: "the northern frontier" },
  { bg: "#efe6da", label: "AFGHANISTAN", title: "AFGHANISTAN", titleColor: "#555555", expr: "surprised", focus: "afghanistan", km: 106, caption: "the SHORTEST land border" },
  { bg: "#dcf0dc", label: "MYANMAR", title: "MYANMAR", titleColor: "#2e9e2e", expr: "happy", focus: "myanmar", km: 1643, caption: "through forests & hills" },
  { bg: "#cfe8ff", label: "PLUS", title: "Not just land…", expr: "surprised", caption: "India's borders don't stop at land" },
  { bg: "#cbe7ff", label: "COASTLINE", title: "A massive coastline", expr: "happy", coastline: true, caption: "the sea border" },
  { bg: "#bfe0ff", label: "COASTLINE", title: "7,516 km!", titleColor: "#1e88e5", big: true, expr: "happy", chart: true, button: "FOLLOW", caption: "coastline vs land borders", sfx: "boom" },
];

const MapCard: React.FC<{ beat: IBeat; frame: number; width: number; height: number }> = ({ beat, frame, width, height }) => {
  const w = Math.round(width - 100);
  const h = Math.round(height * 0.42);
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 14, mass: 0.7 } });

  const countries = Object.entries(NEIGHBOURS).map(([key, nb]) => {
    const lit = beat.highlightAll || beat.focus === key;
    return { geom: GEO[key], fill: lit ? nb.color : NEUTRAL_FILL, fillOpacity: lit ? 0.9 : 0.55, stroke: INK, strokeWidth: 3, draw: 1 };
  });
  countries.push({ geom: GEO.india, fill: beat.coastline ? "#bcdcff" : INDIA_FILL, fillOpacity: 1, stroke: beat.coastline ? "#1e88e5" : INK, strokeWidth: beat.coastline ? 7 : 4, draw: 1 });

  const markers = [] as { lon: number; lat: number; label?: string; color: string; on?: number }[];
  markers.push({ lon: 79, lat: 22, label: "INDIA", color: INDIA_FILL, on: 1 });
  if (beat.focus) {
    const nb = NEIGHBOURS[beat.focus];
    markers.push({ lon: nb.lon, lat: nb.lat, label: nb.name, color: nb.color, on: 1 });
  } else if (beat.highlightAll) {
    Object.values(NEIGHBOURS).forEach((nb) => markers.push({ lon: nb.lon, lat: nb.lat, label: nb.name, color: nb.color, on: 1 }));
  }

  return (
    <div style={{ width: w, height: h, borderRadius: 28, background: "#eef5ff", overflow: "hidden", border: `4px solid ${INK}`, transform: `scale(${0.9 + pop * 0.1})`, opacity: pop }}>
      <MapView width={w} height={h} region={SOUTH_ASIA} countries={countries} markers={markers} />
    </div>
  );
};

const KmBadge: React.FC<{ km: number; color: string; frame: number }> = ({ km, color, frame }) => {
  const p = spring({ frame: frame - 8, fps: 30, config: { damping: 11, mass: 0.6 } });
  return (
    <div style={{ transform: `scale(${0.5 + p * 0.5})`, opacity: p, background: color, color: "#fff", border: `6px solid ${INK}`, borderRadius: 20, padding: "8px 30px", fontFamily: TE_DISPLAY, fontSize: 64, fontWeight: 800, boxShadow: `0 10px 0 ${INK}`, whiteSpace: "nowrap" }}>
      ≈ {km.toLocaleString()} km
    </div>
  );
};

const talkingAt = (words: Section["words"], abs: number) => words.some((w) => abs >= w.start - 0.04 && abs < w.end + 0.04);

const BeatView: React.FC<{ section: Section; beat: IBeat }> = ({ section, beat }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const abs = section.start + t;
  const talking = section.words.length ? talkingAt(section.words, abs) : t < (section.end - section.start) * 0.85;
  const mouth = talking ? (Math.sin(frame * 2.1) > 0 ? "open" : "flat") : beat.expr === "happy" ? "smile" : "closed";
  const blinkPhase = t % 2.7;
  const blink = blinkPhase > 2.55 ? Math.sin(((blinkPhase - 2.55) / 0.15) * Math.PI) : 0;
  const bob = Math.sin(frame * 0.18) * 4;
  const kmColor = beat.focus ? NEIGHBOURS[beat.focus].color : "#1e88e5";

  return (
    <AbsoluteFill style={{ background: beat.bg }}>
      <Audio src={staticFile(`sfx/${beat.sfx ?? "whoosh"}.wav`)} volume={0.4} />
      {beat.km ? (
        <Sequence from={9} durationInFrames={30}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.45} />
        </Sequence>
      ) : null}
      <SectionPill text={beat.label} frame={frame} />

      {beat.big && (
        <svg width={width} height={height} style={{ position: "absolute", opacity: 0.1 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return <line key={i} x1={width / 2} y1={height * 0.36} x2={width / 2 + Math.cos(a) * width} y2={height * 0.36 + Math.sin(a) * width} stroke={INK} strokeWidth={20} />;
          })}
        </svg>
      )}

      <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: height * 0.12, gap: 22 }}>
        <Title text={beat.title} frame={frame} delay={4} size={beat.big ? Math.min(140, width / 7.5) : Math.min(92, width / 11)} color={beat.titleColor} />
        {beat.km && <KmBadge km={beat.km} color={kmColor} frame={frame} />}
        {beat.chart ? (
          <BorderChart3D width={width - 90} height={height} />
        ) : (
          <MapCard beat={beat} frame={frame} width={width} height={height} />
        )}
        {beat.button && (
          <div style={{ marginTop: 4 }}>
            <Button text={beat.button} frame={frame} delay={12} bg="#1e88e5" />
          </div>
        )}
        {beat.caption && <Caption text={beat.caption} frame={frame} delay={14} />}
      </AbsoluteFill>

      {!beat.chart && (
        <div style={{ position: "absolute", right: 30, bottom: 20 }}>
          <Character expr={beat.expr} mouth={mouth} blink={blink} armRaise={beat.expr === "surprised" ? 0.6 : 0} bob={bob} skin="#ffffff" width={width * 0.26} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const IndiaBorders: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;
  return (
    <AbsoluteFill style={{ backgroundColor: "#ffe9c9" }}>
      <Audio src={staticFile(timing.audio)} />
      {secs.map((section, i) => {
        const beat = BEATS[Math.min(i, BEATS.length - 1)];
        const from = section.start;
        const endSec = i + 1 < secs.length ? secs[i + 1].start : total + 0.4;
        const startF = Math.round(from * fps);
        const lenF = Math.max(1, Math.round((endSec - from) * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <BeatView section={section} beat={beat} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
