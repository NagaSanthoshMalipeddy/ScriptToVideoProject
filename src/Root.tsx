import React from "react";
import { Composition } from "remotion";
import { Whiteboard } from "./Whiteboard";
import timingJson from "../public/timing.json";
import configJson from "../config.json";
import type { Theme, Timing } from "./types";

const timing = timingJson as unknown as Timing;
const config = configJson as unknown as {
  fps: number;
  width: number;
  height: number;
  theme: Theme;
};

export const RemotionRoot: React.FC = () => {
  const durationInFrames = Math.max(
    1,
    Math.ceil((timing.durationSec + 0.6) * config.fps)
  );

  return (
    <Composition
      id="Whiteboard"
      component={Whiteboard}
      durationInFrames={durationInFrames}
      fps={config.fps}
      width={config.width}
      height={config.height}
      defaultProps={{ timing, theme: config.theme }}
    />
  );
};
