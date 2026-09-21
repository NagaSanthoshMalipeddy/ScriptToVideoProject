import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import type { Timing } from "../types";
import { Background } from "../airace/components/Background";
import {
  AidScene,
  ClosingScene,
  EndCardScene,
  FrontScene,
  InvasionScene,
  NatoScene,
  OpeningScene,
  PeaceScene,
  SanctionsScene,
  YearScene,
} from "./Scenes";

// One scene per narration paragraph — full script, nothing condensed.
const SCENES: React.FC<{ dur: number }>[] = [
  OpeningScene,
  YearScene,
  NatoScene,
  InvasionScene,
  FrontScene,
  AidScene,
  SanctionsScene,
  PeaceScene,
  ClosingScene,
  EndCardScene,
];

export const UkraineWar: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;
  const startOf = (i: number) => secs[i]?.start ?? 0;
  const endOf = (i: number) => secs[i]?.end ?? total;

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070f" }}>
      <Background />
      <Audio src={staticFile(timing.audio)} />
      {SCENES.map((Comp, i) => {
        const from = startOf(i);
        const endSec = i + 1 < SCENES.length ? Math.max(endOf(i), startOf(i + 1)) : total + 0.6;
        const startF = Math.round(from * fps);
        const durSec = Math.max(0.5, endSec - from);
        const lenF = Math.max(1, Math.round(durSec * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <Comp dur={durSec} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
