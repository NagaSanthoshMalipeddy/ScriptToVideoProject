import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { Character, Expr, Mouth } from "./Character";
import { TE_BODY, TE_DISPLAY } from "./fonts";

type Who = "narrator" | "russia" | "ukraine";
type Beat = {
  bg: [string, string];
  expr: Expr;
  who: Who;
  caption: string;
  big?: boolean;
  accent?: string;
};

// One beat per narration paragraph (12). Character acts out; caption is punchy.
const BEATS: Beat[] = [
  { bg: ["#8ecae6", "#bde0fe"], expr: "happy", who: "narrator", caption: "రష్యా vs ఉక్రెయిన్" },
  { bg: ["#ffd6a5", "#ffb703"], expr: "surprised", who: "narrator", caption: "2014: ట్విస్ట్!", accent: "#e85d04" },
  { bg: ["#cdb4db", "#b8c0ff"], expr: "worried", who: "narrator", caption: "అక్కడితో ఆగిందా?" },
  { bg: ["#ff8fa3", "#ff4d6d"], expr: "annoyed", who: "narrator", caption: "నో ఛాన్స్!", big: true, accent: "#c1121f" },
  { bg: ["#ffb3c1", "#ff5c8a"], expr: "surprised", who: "narrator", caption: "2022: పెద్ద దాడి", accent: "#d00000" },
  { bg: ["#ffccd5", "#ff758f"], expr: "happy", who: "russia", caption: "\u201C2 రోజుల్లో అయిపోద్ది!\u201D", accent: "#d90429" },
  { bg: ["#a2d2ff", "#4ea3ff"], expr: "annoyed", who: "ukraine", caption: "\u201Cఅంత ఈజీ కాదు బాస్!\u201D", accent: "#1d4ed8" },
  { bg: ["#b7e4c7", "#52b788"], expr: "happy", who: "narrator", caption: "USA + యూరప్ సపోర్ట్", accent: "#1b9e5a" },
  { bg: ["#ffd6a5", "#fb8500"], expr: "happy", who: "narrator", caption: "2 DAYS → 4 YEARS!", big: true, accent: "#e85d04" },
  { bg: ["#a0a7e0", "#6d6fd6"], expr: "worried", who: "narrator", caption: "క్లైమాక్స్ ఇంకా రాలేదు" },
  { bg: ["#c8b6ff", "#9d4edd"], expr: "surprised", who: "narrator", caption: "ఎందుకు? NATO? పుతిన్?", accent: "#7b2cbf" },
  { bg: ["#ffba08", "#f48c06"], expr: "happy", who: "narrator", caption: "Part 2 కి రండి!", big: true, accent: "#dc2f02" },
];

const SKIN: Record<Who, string> = { narrator: "#ffffff", russia: "#ff8585", ukraine: "#7fb2ff" };
const WHO_LABEL: Record<Who, string | null> = { narrator: null, russia: "రష్యా", ukraine: "ఉక్రెయిన్" };

const talkingAt = (words: Section["words"], abs: number) =>
  words.some((w) => abs >= w.start - 0.04 && abs < w.end + 0.04);

const StoryBeat: React.FC<{ section: Section; beat: Beat }> = ({ section, beat }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const abs = section.start + frame / fps;

  const talking = section.words.length ? talkingAt(section.words, abs) : frame / fps < (section.end - section.start) * 0.85;
  const mouthOpen = Math.sin(frame * 2.1) > 0;
  const mouth: Mouth = talking ? (mouthOpen ? "open" : "flat") : beat.expr === "happy" ? "smile" : "closed";

  const blinkPhase = (frame / fps) % 2.7;
  const blink = blinkPhase > 2.55 ? Math.sin(((blinkPhase - 2.55) / 0.15) * Math.PI) : 0;
  const bob = Math.sin(frame * 0.18) * 5;
  const excited = beat.expr === "surprised" || beat.expr === "happy";
  const armRaise = excited ? 0.4 + 0.4 * Math.max(0, Math.sin(frame * 0.5)) : 0;

  const pop = spring({ frame: frame - 2, fps, config: { damping: 12, mass: 0.6 } });
  const capSize = beat.big ? Math.min(150, width / 8.5) : Math.min(84, width / 13);
  const shake = beat.big ? Math.sin(frame * 1.3) * 2 : 0;

  const label = WHO_LABEL[beat.who];

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${beat.bg[0]} 0%, ${beat.bg[1]} 100%)` }} />
      {/* floor */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: height * 0.26, background: "rgba(0,0,0,0.10)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: height * 0.26, height: 7, background: "#20232a", opacity: 0.5 }} />

      {/* radiating pop lines behind big captions */}
      {beat.big && (
        <svg width={width} height={height} style={{ position: "absolute", opacity: 0.14 }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return <line key={i} x1={width / 2} y1={height * 0.33} x2={width / 2 + Math.cos(a) * width} y2={height * 0.33 + Math.sin(a) * width} stroke="#fff" strokeWidth={22} />;
          })}
        </svg>
      )}

      {/* Caption */}
      <div style={{ position: "absolute", left: 0, right: 0, top: beat.big ? height * 0.24 : height * 0.1, display: "flex", justifyContent: "center", padding: "0 60px" }}>
        <div
          style={{
            transform: `scale(${0.6 + pop * 0.4}) rotate(${shake}deg)`,
            opacity: pop,
            fontFamily: TE_DISPLAY,
            fontSize: capSize,
            fontWeight: 800,
            color: "#fff",
            WebkitTextStroke: `${beat.big ? 8 : 5}px #20232a`,
            textAlign: "center",
            lineHeight: 1.15,
            textShadow: `0 6px 0 ${beat.accent ?? "#20232a"}`,
            paintOrder: "stroke fill",
          }}
        >
          {beat.caption}
        </div>
      </div>

      {/* Character(s) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: height * 0.05 }}>
        {label && (
          <div style={{ fontFamily: TE_BODY, fontSize: 34, fontWeight: 800, color: "#20232a", background: "#fff", border: "5px solid #20232a", borderRadius: 14, padding: "4px 18px", marginBottom: 10 }}>
            {label}
          </div>
        )}
        <Character expr={beat.expr} mouth={mouth} blink={blink} armRaise={armRaise} bob={bob} skin={SKIN[beat.who]} width={width * (beat.big ? 0.4 : 0.46)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const StoryVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;

  return (
    <AbsoluteFill style={{ backgroundColor: "#8ecae6" }}>
      <Audio src={staticFile(timing.audio)} />
      {secs.map((section, i) => {
        const beat = BEATS[Math.min(i, BEATS.length - 1)];
        const from = section.start;
        const endSec = i + 1 < secs.length ? secs[i + 1].start : total + 0.4;
        const startF = Math.round(from * fps);
        const lenF = Math.max(1, Math.round((endSec - from) * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <StoryBeat section={section} beat={beat} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
