import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { Character, Expr } from "../story/Character";
import { Button, Caption, INK, SectionPill, Title } from "../cartoon/ui";
import { TE_DISPLAY } from "../story/fonts";
import { MapView, type Region } from "../ukraine/GeoMap";
import { IND, LAC, LOC, PAK, CHN, ZONES, geomOf } from "./zones";
import { GEO } from "../india/data";

// Main map shows the north of India (so the country outline is recognisable) with the
// Kashmir zones overlaid; a locator inset shows where it sits on the full India map.
const MAIN_REGION: Region = { lonMin: 70.5, lonMax: 82, latMin: 29.8, latMax: 37.9 };
const INDIA_FULL: Region = { lonMin: 66, lonMax: 98, latMin: 6, latMax: 37.9 };

type KBeat = {
  bg: string;
  label: string;
  title: string;
  titleColor?: string;
  big?: boolean;
  caption?: string;
  expr: Expr;
  focus?: string[];
  line?: "loc" | "lac";
  badge?: string;
  badgeColor?: string;
  button?: string;
  sfx?: "pop" | "whoosh" | "ding" | "riser" | "boom";
};

const BEATS: KBeat[] = [
  { bg: "#ffe9c9", label: "DISPUTED", title: "JAMMU & KASHMIR", expr: "surprised", caption: "One of the world's most disputed regions", sfx: "pop" },
  { bg: "#e0d4f7", label: "WHY?", title: "Divided by 3 Nations", expr: "worried", caption: "India, Pakistan & China all hold parts" },
  { bg: "#dff0e2", label: "POJK", title: "Pakistan-Occupied J&K", titleColor: PAK, expr: "neutral", focus: ["ajk", "gilgit"], badge: "Pakistan-administered", badgeColor: PAK, caption: "Azad Kashmir + Gilgit-Baltistan" },
  { bg: "#eef1f4", label: "LoC", title: "Line of Control", titleColor: "#444", expr: "neutral", focus: ["ajk", "gilgit", "jk"], line: "loc", caption: "The India–Pakistan military line" },
  { bg: "#e6f2ff", label: "SIACHEN", title: "Siachen Glacier", titleColor: "#1e88e5", expr: "surprised", focus: ["siachen"], caption: "The world's highest battlefield" },
  { bg: "#fff0d6", label: "1984", title: "Operation Meghdoot", titleColor: IND, expr: "happy", focus: ["siachen"], badge: "Held by India", badgeColor: IND, big: true, caption: "India secured the Siachen heights", sfx: "boom" },
  { bg: "#eaf5ff", label: "NOW, EAST", title: "Look East", expr: "neutral", focus: ["ladakh", "aksai"], caption: "Towards Ladakh & Aksai Chin" },
  { bg: "#ffe0e0", label: "AKSAI CHIN", title: "Aksai Chin", titleColor: CHN, expr: "surprised", focus: ["aksai"], badge: "China-administered", badgeColor: CHN, caption: "India claims it as part of Ladakh" },
  { bg: "#eef1f4", label: "LAC", title: "Line of Actual Control", titleColor: "#444", expr: "neutral", focus: ["ladakh", "aksai"], line: "lac", caption: "The India–China military boundary" },
  { bg: "#ffe0e0", label: "SHAKSGAM", title: "Shaksgam Valley", titleColor: CHN, expr: "worried", focus: ["shaksgam"], badge: "Ceded to China, 1963", badgeColor: CHN, caption: "India does not recognise this transfer" },
  { bg: "#ffd9c2", label: "3 CLAIMS", title: "One Region, Three Claims", big: true, expr: "surprised", caption: "Competing territorial & military positions", sfx: "boom" },
  { bg: "#e0d4f7", label: "STRATEGIC", title: "Most Sensitive Zone", expr: "worried", caption: "One of the world's most strategic regions" },
  { bg: "#ffe9c9", label: "PART 2?", title: "Want Part 2?", titleColor: IND, expr: "happy", button: "FOLLOW", caption: "Follow for more", sfx: "ding" },
];

const ZONE_ORDER = ["gilgit", "shaksgam", "aksai", "ajk", "jk", "ladakh", "siachen"];

const Legend: React.FC = () => {
  const items = [
    { c: IND, t: "India" },
    { c: PAK, t: "Pakistan" },
    { c: CHN, t: "China" },
  ];
  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
      {items.map((it) => (
        <div key={it.t} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `3px solid ${INK}`, borderRadius: 12, padding: "4px 14px" }}>
          <div style={{ width: 22, height: 22, background: it.c, border: `2px solid ${INK}`, borderRadius: 5 }} />
          <span style={{ fontFamily: TE_DISPLAY, fontSize: 28, fontWeight: 800, color: INK }}>{it.t}</span>
        </div>
      ))}
    </div>
  );
};

const KashmirMap: React.FC<{ beat: KBeat; frame: number; width: number; height: number }> = ({ beat, frame, width, height }) => {
  const w = Math.round(width - 90);
  const h = Math.round(height * 0.44);
  const pop = spring({ frame: frame - 2, fps: 30, config: { damping: 14, mass: 0.7 } });
  const lit = (id: string) => !beat.focus || beat.focus.includes(id);

  const countries = [
    { geom: GEO.india, fill: "#ffe6c4", fillOpacity: 1, stroke: INK, strokeWidth: 3, draw: 1 },
    ...ZONE_ORDER.map((id) => {
      const z = ZONES[id];
      const on = lit(id);
      return { geom: geomOf(z), fill: z.color, fillOpacity: on ? 0.95 : 0.3, stroke: INK, strokeWidth: on ? 4 : 2, draw: 1 };
    }),
  ];

  const markers = ZONE_ORDER.filter(lit).map((id) => {
    const z = ZONES[id];
    return { lon: z.labelLon, lat: z.labelLat, label: z.name, color: z.color, on: 1, size: 24 };
  });

  const lines = [
    { pts: LOC, color: beat.line === "loc" ? "#111" : "rgba(20,20,20,0.4)", width: beat.line === "loc" ? 8 : 4, dash: true, on: 1 },
    { pts: LAC, color: beat.line === "lac" ? "#111" : "rgba(20,20,20,0.4)", width: beat.line === "lac" ? 8 : 4, dash: true, on: 1 },
  ];

  const iw = Math.round(w * 0.26);
  const ih = Math.round(h * 0.42);
  const insetCountries = [
    { geom: GEO.india, fill: IND, fillOpacity: 0.92, stroke: INK, strokeWidth: 2, draw: 1 },
  ];

  return (
    <div style={{ position: "relative", width: w, borderRadius: 28, background: "#dcefff", overflow: "hidden", border: `4px solid ${INK}`, transform: `scale(${0.92 + pop * 0.08})`, opacity: pop, paddingBottom: 14 }}>
      <div style={{ position: "relative", width: w, height: h, overflow: "hidden" }}>
        <MapView width={w} height={h} region={MAIN_REGION} countries={countries} markers={markers} lines={lines} />
        {/* India locator inset */}
        <div style={{ position: "absolute", right: 12, bottom: 12, width: iw, height: ih, background: "#eaf5ff", border: `3px solid ${INK}`, borderRadius: 14, overflow: "hidden", boxShadow: `0 6px 0 ${INK}` }}>
          <MapView width={iw} height={ih} region={INDIA_FULL} countries={insetCountries} markers={[{ lon: 76, lat: 34.6, color: "#e11d2e", on: 1 }]} />
          <div style={{ position: "absolute", top: 4, left: 0, right: 0, textAlign: "center", fontFamily: TE_DISPLAY, fontSize: 22, fontWeight: 800, color: INK }}>INDIA</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Legend />
      </div>
    </div>
  );
};

const Pill: React.FC<{ text: string; color: string; frame: number }> = ({ text, color, frame }) => {
  const p = spring({ frame: frame - 8, fps: 30, config: { damping: 12, mass: 0.6 } });
  return (
    <div style={{ transform: `scale(${0.6 + p * 0.4})`, opacity: p, background: color, color: "#fff", border: `5px solid ${INK}`, borderRadius: 18, padding: "8px 26px", fontFamily: TE_DISPLAY, fontSize: 46, fontWeight: 800, boxShadow: `0 8px 0 ${INK}`, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
};

const talkingAt = (words: Section["words"], abs: number) => words.some((w) => abs >= w.start - 0.04 && abs < w.end + 0.04);

const BeatView: React.FC<{ section: Section; beat: KBeat }> = ({ section, beat }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const abs = section.start + t;
  const talking = section.words.length ? talkingAt(section.words, abs) : t < (section.end - section.start) * 0.85;
  const mouth = talking ? (Math.sin(frame * 2.1) > 0 ? "open" : "flat") : beat.expr === "happy" ? "smile" : "closed";
  const blinkPhase = t % 2.7;
  const blink = blinkPhase > 2.55 ? Math.sin(((blinkPhase - 2.55) / 0.15) * Math.PI) : 0;
  const bob = Math.sin(frame * 0.18) * 4;
  const armRaise = beat.expr === "happy" || beat.expr === "surprised" ? 0.4 + 0.4 * Math.max(0, Math.sin(frame * 0.5)) : 0;

  return (
    <AbsoluteFill style={{ background: beat.bg }}>
      <Audio src={staticFile(`sfx/${beat.sfx ?? "whoosh"}.wav`)} volume={0.4} />
      {beat.badge ? (
        <Sequence from={9} durationInFrames={30}>
          <Audio src={staticFile("sfx/ding.wav")} volume={0.4} />
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

      <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: height * 0.11, gap: 18 }}>
        <Title text={beat.title} frame={frame} delay={4} size={beat.big ? Math.min(120, width / 8.5) : Math.min(84, width / 12)} color={beat.titleColor} />
        {beat.badge && <Pill text={beat.badge} color={beat.badgeColor ?? INK} frame={frame} />}
        <KashmirMap beat={beat} frame={frame} width={width} height={height} />
        {beat.caption && <Caption text={beat.caption} frame={frame} delay={12} />}
        {beat.button && <Button text={beat.button} frame={frame} delay={10} bg="#3b6bff" />}
      </AbsoluteFill>

      <div style={{ position: "absolute", right: 12, bottom: -20 }}>
        <Character expr={beat.expr} mouth={mouth} blink={blink} armRaise={armRaise} bob={bob} skin="#ffffff" width={width * 0.22} />
      </div>
    </AbsoluteFill>
  );
};

export const KashmirExplainer: React.FC<{ timing: Timing }> = ({ timing }) => {
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
