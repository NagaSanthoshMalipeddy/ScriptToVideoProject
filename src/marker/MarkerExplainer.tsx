import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Timing } from "../types";
import { Paper } from "./Paper";
import { HeroTitle, SectionLabel, Subtitle, TagRow } from "./components";

export type MarkerScene = {
  label: string;
  title: string;
  highlight?: boolean;
  circle?: boolean;
  color?: string;
  tags?: { text: string; bg: string; fg?: string }[];
  subtitle?: string;
};

// One title card per narration paragraph (system design in ~2 minutes).
export const SCENES: MarkerScene[] = [
  {
    label: "Hook",
    title: "DON'T SCROLL",
    highlight: true,
    circle: true,
    tags: [
      { text: "2 MINUTES", bg: "#ffd94a", fg: "#1c1c1c" },
      { text: "INTERVIEW", bg: "#2f6bff", fg: "#ffffff" },
    ],
    subtitle: "one system design concept",
  },
  {
    label: "The concept",
    title: "LOAD BALANCER",
    highlight: true,
    subtitle: "the traffic cop of the internet",
  },
  {
    label: "The problem",
    title: "TOO MANY USERS",
    highlight: true,
    subtitle: "one server can't handle them all",
  },
  {
    label: "The fix",
    title: "SPREAD THE LOAD",
    highlight: true,
    subtitle: "requests go to many servers",
  },
  {
    label: "Strategies",
    title: "HOW IT CHOOSES",
    tags: [
      { text: "ROUND ROBIN", bg: "#ffd94a", fg: "#1c1c1c" },
      { text: "LEAST CONN", bg: "#2f6bff", fg: "#ffffff" },
      { text: "IP HASH", bg: "#2fb56b", fg: "#ffffff" },
    ],
    subtitle: "three common methods",
  },
  {
    label: "Bonus",
    title: "AUTO FAILOVER",
    highlight: true,
    circle: true,
    subtitle: "a server dies, traffic reroutes",
  },
  {
    label: "Outro",
    title: "NOW YOU KNOW",
    highlight: true,
    circle: true,
    subtitle: "follow for daily system design",
  },
];

const Scene: React.FC<{ data: MarkerScene }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <SectionLabel text={data.label} frame={frame} />
      <AbsoluteFill
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: height * 0.24,
          gap: 48,
          padding: `${height * 0.24}px 90px 0`,
        }}
      >
        <HeroTitle
          text={data.title}
          frame={frame}
          maxWidth={width - 220}
          highlight={data.highlight}
          circle={data.circle}
          color={data.color}
        />
        {data.tags && <TagRow tags={data.tags} frame={frame} delay={26} />}
        {data.subtitle && <Subtitle text={data.subtitle} frame={frame} delay={34} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const MarkerExplainer: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;
  const startOf = (i: number) => secs[i]?.start ?? 0;
  const endOf = (i: number) => secs[i]?.end ?? total;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f6f5ef" }}>
      <Paper />
      <Audio src={staticFile(timing.audio)} />
      {SCENES.map((data, i) => {
        const from = startOf(i);
        const endSec = i + 1 < SCENES.length ? Math.max(endOf(i), startOf(i + 1)) : total + 0.6;
        const startF = Math.round(from * fps);
        const lenF = Math.max(1, Math.round((endSec - from) * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <Scene data={data} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
