import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  COLORS,
  COUNTRIES,
  COUNTRY_ORDER,
  clamp,
  ease,
  lonToFrontRotation,
} from "./lib";
import { BODY, DISPLAY } from "./fonts";
import { Globe, Highlight } from "./components/Globe";
import { BigTitle, Chip, CodePill, RevealText } from "./components/ui";
import {
  ChipGrid,
  NodeNetwork,
  Pipeline,
  Robot,
  Wafer,
} from "./components/fx";

type SceneProps = { dur: number };

/** Small glowing dot that travels along a straight path — used for data flow. */
const FlowParticles: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  count: number;
  color: string;
  t: number;
  seed?: number;
}> = ({ from, to, count, color, t, seed = 1 }) => (
  <svg style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {Array.from({ length: count }).map((_, i) => {
      const phase = ((t * 0.6 + (i * 0.37 + seed * 0.11)) % 1 + 1) % 1;
      const x = from.x + (to.x - from.x) * phase;
      const y = from.y + (to.y - from.y) * phase;
      const op = Math.sin(phase * Math.PI);
      return <circle key={i} cx={x} cy={y} r={3.2} fill={color} opacity={op * 0.9} />;
    })}
  </svg>
);

const Label: React.FC<{ children: string; color?: string }> = ({
  children,
  color = COLORS.dim,
}) => (
  <div
    style={{
      fontFamily: BODY,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: 3,
      color,
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// [0:00-0:05] HOOK
// ---------------------------------------------------------------------------
export const HookScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const cx = width / 2;
  const cy = height * 0.44;
  const radius = ease(t, [0, 1.4], [110, 340]);
  const rotation = t * 0.35;

  const highlights: Highlight[] = COUNTRY_ORDER.map((id, i) => ({
    id,
    intensity: clamp((t - (1.2 + i * 0.25)) * 2.2),
  }));

  const titleIn = t > 2.2;
  const flashStart = 3.1;
  const flashIdx = Math.floor((t - flashStart) / 0.32);

  return (
    <AbsoluteFill>
      <Globe
        cx={cx}
        cy={cy}
        radius={radius}
        rotation={rotation}
        frame={frame}
        highlights={highlights}
        dotCount={460}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: height * 0.68,
        }}
      >
        {titleIn && (
          <BigTitle text="THE AI RACE" frame={frame} delay={66} size={128} glow={COLORS.cyan} />
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.14 }}>
        {t >= flashStart && flashIdx >= 0 && flashIdx < COUNTRY_ORDER.length && (
          <CodePill
            {...(() => {
              const c = COUNTRIES[COUNTRY_ORDER[flashIdx]];
              return { code: c.code, name: c.name, color: c.color };
            })()}
            progress={1}
            size={1.15}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [0:05-0:17] USA
// ---------------------------------------------------------------------------
export const UsaScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const c = COUNTRIES.usa;

  const cx = width * 0.34;
  const cy = height * 0.42;
  const radius = 300;
  const rotation = lonToFrontRotation(c.lon) + t * 0.03;

  const labels = ["AI MODELS", "CLOUD", "GPUs", "STARTUPS"];

  return (
    <AbsoluteFill>
      <Globe cx={cx} cy={cy} radius={radius} rotation={rotation} frame={frame} highlights={[{ id: "usa", intensity: 1 }]} dotCount={420} />

      <div style={{ position: "absolute", left: width * 0.52, top: height * 0.2, width: width * 0.44, height: height * 0.4 }}>
        <NodeNetwork width={width * 0.44} height={height * 0.4} progress={clamp(t / 2.4)} color={c.color} seed={4} count={40} />
      </div>

      <FlowParticles
        from={{ x: cx, y: cy }}
        to={{ x: width * 0.9, y: height * 0.3 }}
        count={10}
        color={COLORS.cyan}
        t={t}
        seed={2}
      />

      <div
        style={{
          position: "absolute",
          right: width * 0.06,
          top: height * 0.62,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "flex-end",
        }}
      >
        {labels.map((l, i) => (
          <Chip key={l} label={l} color={c.color} progress={clamp((t - (0.6 + i * 0.45)) * 3)} size={1.1} />
        ))}
      </div>

      <div style={{ position: "absolute", left: width * 0.08, bottom: height * 0.08 }}>
        <RevealText text="UNITED STATES" frame={frame} size={56} weight={800} align="left" letterSpacing={2} color={COLORS.white} />
        <div style={{ height: 10 }} />
        <Label color={c.color}>AI SOFTWARE ECOSYSTEM</Label>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [0:17-0:29] CHINA
// ---------------------------------------------------------------------------
export const ChinaScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const c = COUNTRIES.china;

  const cx = width * 0.64;
  const cy = height * 0.4;
  const radius = 300;
  const rotation = lonToFrontRotation(c.lon) + t * 0.03;

  const icons = [
    { label: "AI CHIP", show: 0.6 },
    { label: "SERVER RACK", show: 1.4 },
    { label: "ROBOTICS", show: 2.2 },
  ];

  return (
    <AbsoluteFill>
      <Globe cx={cx} cy={cy} radius={radius} rotation={rotation} frame={frame} highlights={[{ id: "china", intensity: 1 }]} dotCount={420} />

      <div style={{ position: "absolute", left: width * 0.04, top: height * 0.16, width: width * 0.44, height: height * 0.4 }}>
        <NodeNetwork width={width * 0.44} height={height * 0.4} progress={clamp(t / 2.4)} color={c.color} seed={9} count={42} />
      </div>

      <div style={{ position: "absolute", left: width * 0.08, top: height * 0.56 }}>
        <Robot size={150} color={c.color} progress={clamp((t - 1.6) * 2)} />
      </div>

      <div style={{ position: "absolute", right: width * 0.06, top: height * 0.6, display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
        {icons.map((ic) => (
          <Chip key={ic.label} label={ic.label} color={c.color} progress={clamp((t - ic.show) * 3)} size={1.1} />
        ))}
      </div>

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.07 }}>
        <RevealText text="AI + ROBOTICS + INFRASTRUCTURE" frame={frame} delay={Math.round(dur * fps * 0.4)} size={40} weight={800} letterSpacing={1} color={COLORS.white} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: width * 0.08, top: height * 0.09 }}>
        <RevealText text="CHINA" frame={frame} size={56} weight={800} align="left" letterSpacing={2} />
        <div style={{ height: 8 }} />
        <Label color={c.color}>INFRASTRUCTURE + LLMs</Label>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [0:29-0:39] TAIWAN
// ---------------------------------------------------------------------------
export const TaiwanScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const c = COUNTRIES.taiwan;

  // First ~2s: island on globe. Then zoom into a wafer.
  const zoom = clamp((t - 2) / 1.2);
  const waferSize = interpolate(zoom, [0, 1], [0, 620]);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.25);

  const chain = ["AI", "DATA CENTERS", "SMARTPHONES", "CARS"];

  return (
    <AbsoluteFill>
      {zoom < 1 && (
        <Globe
          cx={width / 2}
          cy={height * 0.42}
          radius={300}
          rotation={lonToFrontRotation(c.lon)}
          frame={frame}
          highlights={[{ id: "taiwan", intensity: 1 }]}
          dotCount={400}
        />
      )}

      {zoom > 0 && (
        <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: height * 0.16 }}>
          <div style={{ position: "relative", opacity: zoom }}>
            <div
              style={{
                position: "absolute",
                inset: -40 - pulse * 20,
                borderRadius: "50%",
                border: `2px solid ${c.color}`,
                opacity: 0.4 * (1 - pulse),
              }}
            />
            <Wafer size={waferSize} progress={clamp((t - 2.4) / 2)} color={c.color} />
          </div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.12 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", maxWidth: width * 0.9 }}>
          {chain.map((s, i) => (
            <React.Fragment key={s}>
              <Chip label={s} color={c.color} progress={clamp((t - (4 + i * 0.4)) * 3)} size={0.95} />
              {i < chain.length - 1 && (
                <span style={{ color: c.color, fontSize: 30, opacity: clamp((t - (4.2 + i * 0.4)) * 3) }}>→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.06, textAlign: "center" }}>
        <BigTitle text="TAIWAN" frame={frame} size={84} glow={c.color} />
        <div style={{ height: 8 }} />
        <div style={{ textAlign: "center" }}>
          <Label color={c.color}>THE WORLD'S CHIP FOUNDRY</Label>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [0:39-0:49] SOUTH KOREA & JAPAN
// ---------------------------------------------------------------------------
export const KoreaJapanScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const kr = COUNTRIES.korea;
  const jp = COUNTRIES.japan;

  const Half: React.FC<{ x: number; country: typeof kr; seed: number }> = ({ x, country, seed }) => (
    <div style={{ position: "absolute", left: x, top: 0, width: width / 2, height }}>
      <Globe
        cx={width / 4}
        cy={height * 0.34}
        radius={190}
        rotation={lonToFrontRotation(country.lon)}
        frame={frame}
        highlights={[{ id: country.id, intensity: 1 }]}
        dotCount={220}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.52, display: "flex", justifyContent: "center" }}>
        <ChipGrid cols={5} rows={4} cell={34} gap={8} progress={clamp((t - 1) / 2.2)} color={country.color} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.72, display: "flex", justifyContent: "center" }}>
        <Robot size={120} color={country.color} progress={clamp((t - 1.6) * 2)} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.1, textAlign: "center" }}>
        <CodePill code={country.code} name={country.name} color={country.color} progress={clamp((t - 0.2) * 2.5)} size={0.85} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill>
      <Half x={0} country={kr} seed={3} />
      <Half x={width / 2} country={jp} seed={8} />
      <div style={{ position: "absolute", left: "50%", top: height * 0.1, bottom: height * 0.1, width: 2, background: "rgba(120,170,255,0.25)", transform: "translateX(-1px)" }} />

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.05 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {["SEMICONDUCTORS", "MEMORY", "ROBOTICS"].map((l, i) => (
            <Chip key={l} label={l} color={i === 1 ? jp.color : kr.color} progress={clamp((t - (2 + i * 0.4)) * 3)} size={1} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [0:49-1:01] INDIA
// ---------------------------------------------------------------------------
export const IndiaScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const c = COUNTRIES.india;

  const pullback = ease(t, [dur - 2.2, dur], [0, 1]);
  const radius = interpolate(pullback, [0, 1], [320, 200]);

  return (
    <AbsoluteFill>
      <Globe
        cx={width / 2}
        cy={height * 0.4}
        radius={radius}
        rotation={lonToFrontRotation(c.lon) + t * 0.02}
        frame={frame}
        highlights={[{ id: "india", intensity: 1 }]}
        dotCount={440}
      />

      <div style={{ position: "absolute", left: width * 0.5 - width * 0.28, top: height * 0.24, width: width * 0.56, height: height * 0.34, opacity: 1 - pullback }}>
        <NodeNetwork width={width * 0.56} height={height * 0.34} progress={clamp(t / 2.6)} color={c.color} seed={5} count={64} />
      </div>

      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: height * 0.14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {["PEOPLE", "DATA", "COMPUTING", "AI"].map((l, i) => (
            <React.Fragment key={l}>
              <Chip label={l} color={c.color} progress={clamp((t - (1 + i * 0.5)) * 3)} size={0.95} />
              {i < 3 && <span style={{ color: c.color, fontSize: 28, opacity: clamp((t - (1.2 + i * 0.5)) * 3) }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.07, textAlign: "center" }}>
        <BigTitle text="INDIA" frame={frame} size={84} glow={c.color} />
        <div style={{ height: 8 }} />
        <div style={{ textAlign: "center" }}>
          <Label color={c.color}>TALENT + DIGITAL SCALE</Label>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [1:01-1:12] THE BIG PICTURE (pipeline)
// ---------------------------------------------------------------------------
export const PipelineScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const stages = [
    { label: "CHIPS", owner: COUNTRIES.taiwan.color, code: "TWN" },
    { label: "COMPUTING", owner: COUNTRIES.usa.color, code: "USA" },
    { label: "AI MODELS", owner: COUNTRIES.china.color, code: "CHN" },
    { label: "DATA", owner: COUNTRIES.india.color, code: "IND" },
    { label: "APPLICATIONS", owner: COLORS.cyan, code: "ALL" },
  ];

  const ownersIn = t > dur * 0.5;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", top: height * 0.06, left: 0, right: 0, textAlign: "center" }}>
        <RevealText text="THE AI STACK" frame={frame} size={44} weight={800} letterSpacing={4} color={COLORS.white} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <Pipeline stages={stages.map((s) => ({ label: s.label, owner: s.owner }))} progress={clamp(t / 3)} width={420} />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, opacity: ownersIn ? 1 : 0, transition: "opacity 0.3s" }}>
          {stages.map((s, i) => (
            <div key={s.code} style={{ height: 74, display: "flex", alignItems: "center", opacity: clamp((t - (dur * 0.5 + i * 0.25)) * 3) }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: s.owner, boxShadow: `0 0 12px ${s.owner}`, marginRight: 12 }} />
              <span style={{ fontFamily: BODY, fontSize: 26, fontWeight: 800, color: COLORS.white, letterSpacing: 2 }}>{s.code}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: height * 0.07, left: 0, right: 0, textAlign: "center" }}>
        <RevealText
          text="NO SINGLE COUNTRY OWNS IT ALL"
          frame={frame}
          delay={Math.round(dur * fps * 0.55)}
          size={34}
          weight={800}
          letterSpacing={1}
          color={COLORS.cyan}
        />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// [1:12-1:18] END
// ---------------------------------------------------------------------------
export const EndScene: React.FC<SceneProps> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const spin = t < dur - 2.6 ? t * 0.3 : (dur - 2.6) * 0.3; // freeze near the end
  const highlights: Highlight[] = COUNTRY_ORDER.map((id) => ({ id, intensity: 1 }));

  const titleIn = t > dur - 3;
  const cardIn = t > dur - 1.3;

  return (
    <AbsoluteFill>
      <Globe
        cx={width / 2}
        cy={height * 0.4}
        radius={260}
        rotation={spin}
        frame={frame}
        highlights={highlights}
        connect
        dotCount={440}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: height * 0.34 }}>
        {titleIn && (
          <div style={{ textAlign: "center", padding: "0 40px" }}>
            <BigTitle text="WHO WILL" frame={frame} delay={Math.round((dur - 3) * fps)} size={110} glow={COLORS.cyan} />
            <BigTitle text="CONTROL AI?" frame={frame} delay={Math.round((dur - 3) * fps) + 8} size={110} glow={COLORS.blue} />
          </div>
        )}
      </AbsoluteFill>

      {cardIn && (
        <div style={{ position: "absolute", bottom: height * 0.08, left: 0, right: 0, textAlign: "center", opacity: clamp((t - (dur - 1.3)) * 3) }}>
          <Label color={COLORS.white}>Follow for more tech &amp; AI stories</Label>
        </div>
      )}

      <AbsoluteFill style={{ background: "#02030a", opacity: clamp((t - (dur - 0.4)) * 4), pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
