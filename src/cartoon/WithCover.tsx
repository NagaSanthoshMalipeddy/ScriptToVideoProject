import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// Channel background bed: public/music/slow-motion-beat.mp3, looped very quietly under the voice.
export const BackgroundBeat: React.FC<{ volume?: number }> = ({ volume = 0.05 }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return <Audio src={staticFile("music/slow-motion-beat.mp3")} loop volume={(f) => volume * Math.max(0, Math.min(1, f / fps, (durationInFrames - f) / (2 * fps)))} />;
};

// Instagram ignores uploaded covers and uses frame 0, so 9:16 videos open on their thumbnail design.
export const COVER_S = 1.2;
const FADE = 8;
export const coverLeadFrames = (fps: number) => Math.round(COVER_S * fps) - FADE;

const HasCover = React.createContext(false);
export const useHasCover = () => React.useContext(HasCover);

export function withCover<P extends object>(Video: React.FC<P>, Thumb: React.FC<P>, opts: { beat?: number } = {}): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const lead = coverLeadFrames(fps);
    const op = Math.min(1, Math.max(0, (lead + FADE - frame) / FADE));
    const zoom = 1 + 0.04 * Math.min(1, frame / (lead + FADE));
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <BackgroundBeat volume={opts.beat} />
        <HasCover.Provider value>
          <Sequence from={lead}>
            <Video {...props} />
          </Sequence>
        </HasCover.Provider>
        {op > 0 && (
          <AbsoluteFill style={{ opacity: op, transform: `scale(${zoom})` }}>
            <Freeze frame={0}>
              <Thumb {...props} />
            </Freeze>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  };
  return Wrapped;
}
