import React from "react";
import {
  AbsoluteFill,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Caveat";
import { Board } from "./components/Board";
import type { Theme, Timing } from "./types";

const { fontFamily } = loadFont();

export const Whiteboard: React.FC<{ timing: Timing; theme: Theme }> = ({
  timing,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // The active board is the last section whose narration has started.
  let current = -1;
  for (let i = 0; i < timing.sections.length; i++) {
    if (t + 0.0001 >= timing.sections[i].start) {
      current = i;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <Audio src={staticFile(timing.audio)} />
      {current >= 0 && (
        <Board
          key={current}
          section={timing.sections[current]}
          theme={theme}
          fontFamily={fontFamily}
        />
      )}
    </AbsoluteFill>
  );
};
