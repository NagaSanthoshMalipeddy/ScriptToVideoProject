import React from "react";
import { Composition } from "remotion";
import { Whiteboard } from "./Whiteboard";
import { AiRace } from "./airace/AiRace";
import { MarkerExplainer } from "./marker/MarkerExplainer";
import { UkraineWar } from "./ukraine/UkraineWar";
import { StoryDemo } from "./story/Story";
import { StoryVideo } from "./story/StoryVideo";
import { CartoonExplainer, type CartoonBeat } from "./cartoon/CartoonExplainer";
import { ThreeScene } from "./three/ThreeScene";
import { Thumbnail } from "./cartoon/Thumbnail";
import { ThumbnailV } from "./cartoon/ThumbnailV";
import { SpeedThumbnailV } from "./cartoon/SpeedThumbnailV";
import { IndiaBorders } from "./india/IndiaBorders";
import { KashmirExplainer } from "./kashmir/KashmirExplainer";
import { KashmirThumbnailV } from "./kashmir/KashmirThumbnailV";
import { IndiaThumbnailV } from "./india/IndiaThumbnailV";
import timingJson from "../public/timing.json";
import beatsJson from "../public/beats.json";
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
    <>
      <Composition
        id="Whiteboard"
        component={Whiteboard}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing, theme: config.theme }}
      />
      <Composition
        id="AiRace"
        component={AiRace}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Marker"
        component={MarkerExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Ukraine"
        component={UkraineWar}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Story"
        component={StoryDemo}
        durationInFrames={7 * config.fps}
        fps={config.fps}
        width={config.width}
        height={config.height}
      />
      <Composition
        id="StoryVideo"
        component={StoryVideo}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Cartoon"
        component={CartoonExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing, beats: beatsJson as unknown as CartoonBeat[] }}
      />
      <Composition
        id="IndiaBorders"
        component={IndiaBorders}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Kashmir"
        component={KashmirExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Three"
        component={ThreeScene}
        durationInFrames={6 * config.fps}
        fps={config.fps}
        width={config.width}
        height={config.height}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={config.fps}
        width={1280}
        height={720}
      />
      <Composition
        id="ThumbnailV"
        component={ThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="IndiaThumbnailV"
        component={IndiaThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="SpeedThumbnailV"
        component={SpeedThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="KashmirThumbnailV"
        component={KashmirThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
    </>
  );
};
