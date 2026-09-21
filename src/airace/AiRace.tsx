import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Timing } from "../types";
import { Background } from "./components/Background";
import {
  ChinaScene,
  EndScene,
  HookScene,
  IndiaScene,
  KoreaJapanScene,
  PipelineScene,
  TaiwanScene,
  UsaScene,
} from "./Scenes";

// Each scene maps to one (or a span of) narration paragraph(s) in timing.json.
// `from`/`to` are section indices; the scene fills from its section's start up
// to the next scene's start so the ~1s TTS pauses never leave a blank frame.
const SCENES: { comp: React.FC<{ dur: number }>; from: number; to: number }[] = [
  { comp: HookScene, from: 0, to: 0 },
  { comp: UsaScene, from: 1, to: 1 },
  { comp: ChinaScene, from: 2, to: 2 },
  { comp: TaiwanScene, from: 3, to: 3 },
  { comp: KoreaJapanScene, from: 4, to: 4 },
  { comp: IndiaScene, from: 5, to: 5 },
  { comp: PipelineScene, from: 6, to: 7 },
  { comp: EndScene, from: 8, to: 8 },
];

export const AiRace: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;

  const startOf = (i: number) => secs[i]?.start ?? 0;
  const endOf = (i: number) => secs[i]?.end ?? total;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070f" }}>
      <Background />
      <Audio src={staticFile(timing.audio)} />
      {SCENES.map((s, i) => {
        const from = startOf(s.from);
        const next = SCENES[i + 1];
        const endSec = next ? Math.max(endOf(s.to), startOf(next.from)) : total + 0.6;
        const startF = Math.round(from * fps);
        const durSec = Math.max(0.5, endSec - from);
        const lenF = Math.max(1, Math.round(durSec * fps));
        const Comp = s.comp;
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <Comp dur={durSec} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
