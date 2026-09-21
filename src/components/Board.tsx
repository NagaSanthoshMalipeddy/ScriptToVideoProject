import React, { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { PALETTE, Shapes } from "./Shapes";
import type { Section, Theme } from "../types";

type Placed = {
  word: string;
  start: number;
  end: number;
  x: number;
  width: number;
  line: number;
};

const MARGIN_X = 96;
const MARGIN_Y = 240;
const FONT_WEIGHT = 600;

export const Board: React.FC<{
  section: Section;
  theme: Theme;
  fontFamily: string;
}> = ({ section, theme, fontFamily }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const layout = useMemo(() => {
    const contentWidth = width - MARGIN_X * 2;
    const maxHeight = height - MARGIN_Y * 2;

    const measure = (text: string, fontSize: number) =>
      measureText({ text, fontFamily, fontSize, fontWeight: FONT_WEIGHT }).width;

    let chosen: {
      fontSize: number;
      placed: Placed[];
      lineHeight: number;
      totalHeight: number;
      lineCount: number;
    } | null = null;

    for (let fontSize = 96; fontSize >= 40; fontSize -= 6) {
      const spaceW = measure("\u00A0", fontSize);
      const placed: Placed[] = [];
      let x = 0;
      let line = 0;
      for (const w of section.words) {
        const ww = measure(w.word, fontSize);
        if (x > 0 && x + ww > contentWidth) {
          line += 1;
          x = 0;
        }
        placed.push({
          word: w.word,
          start: w.start,
          end: w.end,
          x,
          width: ww,
          line,
        });
        x += ww + spaceW;
      }
      const lineCount = (placed[placed.length - 1]?.line ?? 0) + 1;
      const lineHeight = fontSize * 1.5;
      const totalHeight = lineCount * lineHeight;
      chosen = { fontSize, placed, lineHeight, totalHeight, lineCount };
      if (totalHeight <= maxHeight) {
        break;
      }
    }

    return chosen!;
  }, [section, width, height, fontFamily]);

  const blockTop = (height - layout.totalHeight) / 2;

  const boardOpacity = interpolate(t - section.start, [0, 0.25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: boardOpacity }}>
      <Shapes section={section} />
      {layout.placed.map((p, i) => {
        if (t < p.start) {
          return null;
        }
        const dur = Math.max(0.12, p.end - p.start);
        const progress = interpolate(t, [p.start, p.start + dur], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: MARGIN_X + p.x,
              top: blockTop + p.line * layout.lineHeight,
              fontFamily,
              fontSize: layout.fontSize,
              fontWeight: FONT_WEIGHT,
              color: PALETTE[i % PALETTE.length],
              whiteSpace: "pre",
              lineHeight: 1,
              clipPath: `inset(-25% ${(1 - progress) * 100}% -25% -5%)`,
            }}
          >
            {p.word}
          </div>
        );
      })}
    </div>
  );
};
