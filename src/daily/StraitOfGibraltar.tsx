import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import {
  countryGeom,
  makeSatProjector,
  SatelliteMap,
  type SatView,
} from "../geo/SatelliteMap";
import type { Section, Timing } from "../types";

type Pt = [number, number];
type Kind =
  | "hook"
  | "strait"
  | "depth"
  | "bridge"
  | "shipping"
  | "currents"
  | "wind"
  | "seismic"
  | "history"
  | "tunnel"
  | "rail"
  | "ferry"
  | "network"
  | "nature"
  | "aha"
  | "cta";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const GOLD = "#ffd23f";
const CYAN = "#39c8ff";
const BLUE = "#1479d2";
const RED = "#ff5b5b";
const INK = "#071523";
const WHITE = "#ffffff";

const TARIFA: Pt = [-5.609, 36.001];
const CIRES: Pt = [-5.481, 35.907];
const GIBRALTAR: Pt = [-5.345, 36.141];
const JEBEL_MUSA: Pt = [-5.412, 35.9];
const ALGECIRAS: Pt = [-5.45, 36.13];
const TANGIER: Pt = [-5.82, 35.77];
const TUNNEL_SPAIN: Pt = [-5.96, 36.04];
const TUNNEL_MOROCCO: Pt = [-5.93, 35.72];

const V: Record<Kind, SatView> = {
  hook: { lon: -5.45, lat: 36.0, span: 28 },
  strait: { lon: -5.48, lat: 35.98, span: 2.5 },
  depth: { lon: -5.45, lat: 35.98, span: 4.6 },
  bridge: { lon: -5.48, lat: 35.98, span: 2.6 },
  shipping: { lon: -5.55, lat: 35.98, span: 5.2 },
  currents: { lon: -5.55, lat: 35.98, span: 4.5 },
  wind: { lon: -5.45, lat: 36.0, span: 5.4 },
  seismic: { lon: -5.1, lat: 35.7, span: 16 },
  history: { lon: -5.4, lat: 36.0, span: 4.4 },
  tunnel: { lon: -5.92, lat: 35.88, span: 3.2 },
  rail: { lon: -5.9, lat: 35.88, span: 5.2 },
  ferry: { lon: -5.63, lat: 35.94, span: 4.7 },
  network: { lon: -5.3, lat: 36.0, span: 28 },
  nature: { lon: -5.48, lat: 35.98, span: 5.6 },
  aha: { lon: -5.65, lat: 35.93, span: 7.0 },
  cta: { lon: -5.2, lat: 36.0, span: 30 },
};

const kindOf = (text: string): Kind => {
  const s = text.toLowerCase();
  if (s.includes("please like")) return "cta";
  if (s.includes("europe and africa are only 14 km apart")) return "hook";
  if (
    s.includes("that is the answer") ||
    s.includes("mystery makes sense") ||
    s.includes("surface number hides") ||
    s.includes("practical dream moved") ||
    s.includes("close enough to see") ||
    s.includes("smallest gaps") ||
    s.includes("short distances")
  )
    return "aha";
  if (s.includes("wildlife") || s.includes("living system") || s.includes("water and salt"))
    return "nature";
  if (
    s.includes("funding") ||
    s.includes("customs") ||
    s.includes("railways beyond") ||
    s.includes("transform trade") ||
    s.includes("study is not a promise")
  )
    return "network";
  if (s.includes("ferries") || s.includes("ferry") || s.includes("algeciras, tangier"))
    return "ferry";
  if (
    s.includes("rail tubes") ||
    s.includes("channel tunnel") ||
    s.includes("trains") ||
    s.includes("portals") ||
    s.includes("ventilation") ||
    s.includes("excavated rock")
  )
    return "rail";
  if (
    s.includes("railway tunnel") ||
    s.includes("camarinal") ||
    s.includes("undersea section") ||
    s.includes("workable rock") ||
    s.includes("tunnelling") ||
    s.includes("surveys and design") ||
    s.includes("tunnel")
  )
    return "tunnel";
  if (
    s.includes("thousands of years") ||
    s.includes("58 km") ||
    s.includes("43 km") ||
    s.includes("every route trades")
  )
    return "history";
  if (s.includes("earthquake") || s.includes("africa and eurasia") || s.includes("seismic"))
    return "seismic";
  if (s.includes("wind") || s.includes("levante")) return "wind";
  if (s.includes("flows east") || s.includes("flows west") || s.includes("two-layer"))
    return "currents";
  if (s.includes("shipping") || s.includes("ships") || s.includes("navigation lanes"))
    return "shipping";
  if (
    s.includes("bridge") ||
    s.includes("foundations") ||
    s.includes("piers") ||
    s.includes("clear spans") ||
    s.includes("giant spans") ||
    s.includes("possible") ||
    s.includes("multiply the cost")
  )
    return "bridge";
  if (s.includes("900") || s.includes("depth") || s.includes("underwater mountain"))
    return "depth";
  if (
    s.includes("strait of gibraltar") ||
    s.includes("spain sits") ||
    s.includes("point marroquí") ||
    s.includes("india already") ||
    s.includes("distance alone")
  )
    return "strait";
  return "hook";
};

const activeSection = (sections: Section[], time: number) => {
  let active = 0;
  sections.forEach((section, index) => {
    if (time >= section.start) active = index;
  });
  return active;
};

const cameraAt = (sections: Section[], time: number): SatView => {
  const i = activeSection(sections, time);
  const section = sections[i] ?? sections[0];
  const from = V[kindOf(sections[Math.max(0, i - 1)]?.text ?? "")];
  const to = V[kindOf(section?.text ?? "")];
  const p = ease(clamp((time - (section?.start ?? 0)) / 1.6));
  const high = Math.max(from.span, to.span);
  const bump = high * (1 + 0.12 * Math.sin(Math.PI * p));
  const span =
    p < 0.5
      ? from.span * Math.pow(bump / from.span, p * 2)
      : bump * Math.pow(to.span / bump, (p - 0.5) * 2);
  return {
    lon: lerp(from.lon, to.lon, p),
    lat: lerp(from.lat, to.lat, p),
    span,
  };
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const makePlan = (sections: Section[]) => {
  const expected = [
    ["Europe and Africa are only 14 km apart"],
    ["900 metres", "900+ metres"],
    ["two directions", "flows east"],
    ["Africa and Eurasia"],
    ["railway tunnel", "rail tunnel"],
    ["Please like"],
  ];
  const missing = expected
    .filter(
      (alternatives) =>
        !alternatives.some((needle) =>
          sections.some((section) => section.text.toLowerCase().includes(needle.toLowerCase())),
        ),
    )
    .map((alternatives) => alternatives.join(" / "));
  const cta = sections.find((section) => section.text.toLowerCase().includes("please like"));
  const ctaT = cta?.start ?? sections[sections.length - 1]?.start ?? 0;
  const word = (needle: string) =>
    cta?.words.find((item) => norm(item.word).startsWith(needle))?.start ?? ctaT;
  return {
    ctaT,
    likeT: word("like"),
    shareT: word("share"),
    subT: word("subscribe"),
    missing,
  };
};

const copyFor = (kind: Kind): [string, string, string, string] => {
  const copy: Record<Kind, [string, string, string, string]> = {
    hook: ["EUROPE ↔ AFRICA", "ONLY 14 KM", "So why is there no bridge?", GOLD],
    strait: ["STRAIT OF GIBRALTAR", "14 KM AT THE PINCH", "Atlantic meets Mediterranean", CYAN],
    depth: ["THE HIDDEN DROP", "900+ METRES", "This is not a shallow river", BLUE],
    bridge: ["THE BRIDGE PROBLEM", "GIANT SPANS · GIANT COST", "Possible does not mean practical", GOLD],
    shipping: ["GLOBAL SEA GATEWAY", "KEEP THE LANE CLEAR", "Cargo ships, ferries and tankers", WHITE],
    currents: ["TWO-LAYER FLOW", "EAST ABOVE · WEST BELOW", "Atlantic in, Mediterranean out", CYAN],
    wind: ["THE LEVANTE", "WIND FUNNELS HERE", "Every safety margin grows", WHITE],
    seismic: ["MOVING GROUND", "AFRICA ↔ EURASIA", "Earthquake design is essential", RED],
    history: ["A LONG, UNEVEN STRAIT", "14 KM → 43 KM", "Every route trades one problem for another", GOLD],
    tunnel: ["THE UNDERSEA OPTION", "A LONGER RAIL TUNNEL", "Studies follow the Camarinal Sill", CYAN],
    rail: ["RAIL, NOT ROAD", "TWIN TUBES + SAFETY", "Gentle slopes need long approaches", GOLD],
    ferry: ["THE LINK THAT EXISTS", "FERRIES CROSS TODAY", "Flexible routes connect several ports", CYAN],
    network: ["A CONTINENTAL PROJECT", "MONEY · RULES · RAIL", "The tunnel is only one part", WHITE],
    nature: ["A LIVING STRAIT", "PROTECT THE WATERWAY", "Currents, habitats and migration", CYAN],
    aha: ["THE TRUE ANSWER", "14 KM ≠ EASY", "Geography is close. Geology is hard.", GOLD],
    cta: ["GLOBETALES", "TINY GAP · GIANT STORY", "A new map story every day", CYAN],
  };
  return copy[kind];
};

const ProgressLine: React.FC<{
  a: Pt;
  b: Pt;
  project: (lon: number, lat: number) => Pt;
  progress: number;
  color: string;
  label: string;
}> = ({ a, b, project, progress, color, label }) => {
  const [x1, y1] = project(a[0], a[1]);
  const [x2, y2] = project(b[0], b[1]);
  const x = lerp(x1, x2, progress);
  const y = lerp(y1, y2, progress);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={9}
        strokeDasharray="20 12"
        strokeLinecap="round"
      />
      <circle cx={x1} cy={y1} r={10} fill={color} stroke={WHITE} strokeWidth={4} />
      <circle cx={x2} cy={y2} r={10} fill={color} stroke={WHITE} strokeWidth={4} />
      <text
        x={(x1 + x2) / 2}
        y={(y1 + y2) / 2 - 34}
        textAnchor="middle"
        fill={WHITE}
        fontFamily={DISPLAY}
        fontSize={48}
        style={{ paintOrder: "stroke", stroke: INK, strokeWidth: 10 }}
      >
        {label}
      </text>
    </g>
  );
};

const Arrow: React.FC<{
  a: Pt;
  b: Pt;
  project: (lon: number, lat: number) => Pt;
  color: string;
  phase: number;
}> = ({ a, b, project, color, phase }) => {
  const [x1, y1] = project(a[0], a[1]);
  const [x2, y2] = project(b[0], b[1]);
  const p = (phase % 1 + 1) % 1;
  const x = lerp(x1, x2, p);
  const y = lerp(y1, y2, p);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={10} opacity={0.5} />
      <path
        d="M18 0 L-13 -13 L-6 0 L-13 13 Z"
        fill={color}
        stroke={INK}
        strokeWidth={2}
        transform={`translate(${x} ${y}) rotate(${angle})`}
      />
    </>
  );
};

const InfoCard: React.FC<{
  kind: Kind;
  reveal: number;
  wide: boolean;
}> = ({ kind, reveal, wide }) => {
  const [kicker, title, sub, accent] = copyFor(kind);
  return (
    <div
      style={{
        position: "absolute",
        left: wide ? 58 : 42,
        top: wide ? 48 : 310,
        width: wide ? 735 : 996,
        minHeight: wide ? 210 : 250,
        padding: wide ? "22px 32px" : "28px 34px 24px",
        borderRadius: 28,
        border: `6px solid ${INK}`,
        boxShadow: `0 13px 0 ${INK}`,
        background: "rgba(255,255,255,.95)",
        opacity: clamp(reveal * 1.8),
        transform: `translateY(${(1 - reveal) * -70}px)`,
      }}
    >
      <div
        style={{
          fontFamily: BODY,
          color: accent,
          fontWeight: 1000,
          fontSize: wide ? 22 : 27,
          letterSpacing: 3,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: DISPLAY,
          color: INK,
          fontSize: wide ? 65 : title.length > 20 ? 65 : 78,
          lineHeight: 0.95,
          marginTop: 5,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: BODY,
          color: "#405064",
          fontWeight: 850,
          fontSize: wide ? 27 : 32,
          lineHeight: 1.1,
          marginTop: 12,
        }}
      >
        {sub}
      </div>
    </div>
  );
};

const BridgeGraphic: React.FC<{ wide: boolean; reveal: number }> = ({ wide, reveal }) => (
  <svg
    width={wide ? 750 : 930}
    height={wide ? 280 : 390}
    viewBox="0 0 900 360"
    style={{
      position: "absolute",
      left: "50%",
      bottom: wide ? 30 : 300,
      transform: `translateX(-50%) scale(${0.86 + reveal * 0.14})`,
      opacity: reveal,
      filter: "drop-shadow(0 10px 8px rgba(0,0,0,.55))",
    }}
  >
    <path d="M35 236 Q450 98 865 236" fill="none" stroke={WHITE} strokeWidth={12} />
    <path d="M35 246 H865" fill="none" stroke={GOLD} strokeWidth={18} />
    {[190, 710].map((x) => (
      <g key={x}>
        <path d={`M${x - 20} 300 L${x} 52 L${x + 20} 300`} fill="none" stroke={WHITE} strokeWidth={16} />
        <line x1={x} y1={54} x2={x} y2={246} stroke={WHITE} strokeWidth={8} />
      </g>
    ))}
    {Array.from({ length: 10 }, (_, i) => {
      const x = 70 + i * 84;
      return <line key={x} x1={x} y1={246} x2={x} y2={150 - 50 * Math.cos(((x - 450) / 415) * Math.PI)} stroke={WHITE} strokeWidth={4} />;
    })}
  </svg>
);

const DepthGraphic: React.FC<{ wide: boolean; reveal: number }> = ({ wide, reveal }) => (
  <div
    style={{
      position: "absolute",
      right: wide ? 90 : 70,
      bottom: wide ? 55 : 315,
      width: wide ? 360 : 500,
      height: wide ? 360 : 560,
      borderRadius: 28,
      overflow: "hidden",
      border: `6px solid ${WHITE}`,
      background: "linear-gradient(#39c8ff 0 12%,#063a69 12% 48%,#03182c)",
      boxShadow: "0 14px 30px rgba(0,0,0,.5)",
      opacity: reveal,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "12%",
        height: `${reveal * 78}%`,
        borderRight: `16px solid ${GOLD}`,
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 34,
        bottom: 28,
        color: WHITE,
        fontFamily: DISPLAY,
        fontSize: wide ? 62 : 82,
        textShadow: `0 4px 0 ${INK}`,
      }}
    >
      900+ m
    </div>
    <div
      style={{
        position: "absolute",
        left: 26,
        top: 20,
        color: INK,
        fontFamily: BODY,
        fontSize: wide ? 24 : 30,
        fontWeight: 900,
      }}
    >
      SEA LEVEL
    </div>
  </div>
);

const TunnelGraphic: React.FC<{ wide: boolean; reveal: number }> = ({ wide, reveal }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      bottom: wide ? 44 : 300,
      width: wide ? 820 : 930,
      height: wide ? 240 : 340,
      transform: `translateX(-50%) scale(${0.9 + reveal * 0.1})`,
      opacity: reveal,
      borderRadius: 30,
      border: `6px solid ${INK}`,
      boxShadow: `0 14px 0 ${INK}`,
      background: "linear-gradient(#9b7354,#4d3425)",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", left: "7%", right: "7%", top: "43%", height: "34%", border: `10px solid ${WHITE}`, borderRadius: 999, background: "#18222e" }} />
    <div style={{ position: "absolute", left: "7%", right: "7%", top: "64%", height: 6, background: GOLD }} />
    <div style={{ position: "absolute", left: "25%", right: "25%", top: "28%", height: "24%", border: `7px solid ${CYAN}`, borderRadius: 999, background: "#132235" }} />
    <div style={{ position: "absolute", left: 35, top: 20, fontFamily: DISPLAY, fontSize: wide ? 40 : 54, color: WHITE, textShadow: `0 3px 0 ${INK}` }}>RAIL TUBES UNDER ROCK</div>
  </div>
);

const Caption: React.FC<{ section: Section; time: number; wide: boolean; ctaT: number }> = ({
  section,
  time,
  wide,
  ctaT,
}) => {
  if (time >= ctaT) return null;
  const words = section.words.filter((word) => word.start <= time).slice(-5);
  if (!words.length) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: wide ? 390 : 60,
        right: wide ? 390 : 60,
        bottom: wide ? 22 : 92,
        textAlign: "center",
        color: WHITE,
        fontFamily: BODY,
        fontWeight: 900,
        fontSize: wide ? 38 : 54,
        lineHeight: 1.1,
        textShadow: "0 3px 12px rgba(0,0,0,.95),0 0 3px #000",
      }}
    >
      {words.map((word) => word.word).join(" ")}
    </div>
  );
};

export const StraitScene: React.FC<{
  timing: Timing;
  thumbnail?: boolean;
}> = ({ timing, thumbnail = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const wide = width > height;
  const time = thumbnail ? 1.8 : frame / fps;
  const i = activeSection(timing.sections, time);
  const section = timing.sections[i] ?? timing.sections[0];
  const kind = thumbnail ? "hook" : kindOf(section?.text ?? "");
  const view = thumbnail
    ? wide
      ? { lon: -5.45, lat: 36.0, span: 8.8 }
      : { lon: -5.45, lat: 36.0, span: 4.8 }
    : cameraAt(timing.sections, time);
  const { project } = makeSatProjector(view, width, height);
  const reveal = thumbnail ? 1 : ease(clamp((time - section.start) / 1.1));
  const plan = React.useMemo(() => makePlan(timing.sections), [timing.sections]);
  const distanceOn = ["hook", "strait", "bridge", "aha"].includes(kind);
  const tunnelOn = ["tunnel", "rail", "aha"].includes(kind);
  const [ax, ay] = project(ALGECIRAS[0], ALGECIRAS[1]);
  const [tx, ty] = project(TANGIER[0], TANGIER[1]);

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <SatelliteMap
        view={view}
        width={width}
        height={height}
        darken={thumbnail ? 0.2 : kind === "cta" ? 0.38 : 0.12}
        highlights={[
          {
            geom: countryGeom("ESP"),
            label: "Spain",
            labelAt: [-4.1, 37.2],
            fill: "rgba(255,190,20,.43)",
          },
          {
            geom: countryGeom("MAR"),
            label: "Morocco",
            labelAt: [-5.5, 34.8],
            fill: "rgba(255,190,20,.43)",
          },
        ]}
      >
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="straitGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          {distanceOn && (
            <ProgressLine
              a={TARIFA}
              b={CIRES}
              project={project}
              progress={reveal}
              color={GOLD}
              label="≈ 14 KM"
            />
          )}
          {tunnelOn && (
            <ProgressLine
              a={TUNNEL_SPAIN}
              b={TUNNEL_MOROCCO}
              project={project}
              progress={reveal}
              color={CYAN}
              label="~28 KM UNDERSEA"
            />
          )}
          {kind === "currents" && (
            <>
              {[-0.13, -0.04, 0.05, 0.14].map((dy, j) => (
                <Arrow
                  key={`e${dy}`}
                  a={[-6.2, 35.95 + dy]}
                  b={[-4.8, 35.95 + dy]}
                  project={project}
                  color={CYAN}
                  phase={time * 0.22 + j * 0.2}
                />
              ))}
              {[-0.11, 0.01, 0.12].map((dy, j) => (
                <Arrow
                  key={`w${dy}`}
                  a={[-4.8, 35.7 + dy]}
                  b={[-6.2, 35.7 + dy]}
                  project={project}
                  color={BLUE}
                  phase={time * 0.17 + j * 0.3}
                />
              ))}
            </>
          )}
          {kind === "wind" &&
            [-0.28, -0.14, 0, 0.14, 0.28].map((dy, j) => (
              <Arrow
                key={dy}
                a={[-4.7, 36 + dy]}
                b={[-6.2, 36 + dy]}
                project={project}
                color={WHITE}
                phase={time * 0.5 + j * 0.16}
              />
            ))}
          {kind === "shipping" &&
            Array.from({ length: 13 }, (_, j) => {
              const p = (time * 0.035 + j / 13) % 1;
              const lon = lerp(-6.4, -4.45, p);
              const lat = 35.87 + 0.16 * Math.sin(j * 2.4);
              const [x, y] = project(lon, lat);
              return (
                <g key={j} transform={`translate(${x} ${y}) rotate(${j % 2 ? 0 : 180})`}>
                  <path d="M-24 -8 L22 -8 L30 0 L22 8 L-24 8 Z" fill={j % 3 ? WHITE : GOLD} stroke={INK} strokeWidth={3} />
                </g>
              );
            })}
          {kind === "seismic" && (
            <>
              {[0, 1, 2].map((j) => {
                const [x, y] = project(-5.15, 35.7);
                const r = 50 + ((time * 80 + j * 90) % 270);
                return <circle key={j} cx={x} cy={y} r={r} fill="none" stroke={RED} strokeWidth={8} opacity={1 - (r - 50) / 270} />;
              })}
              <Arrow a={[-7.4, 33.8]} b={[-5.4, 35.3]} project={project} color={RED} phase={0.9} />
              <Arrow a={[-3.4, 38.0]} b={[-5.0, 36.2]} project={project} color={GOLD} phase={0.9} />
            </>
          )}
          {kind === "ferry" && (
            <>
              <path d={`M${ax},${ay} Q${(ax + tx) / 2 - 100},${(ay + ty) / 2} ${tx},${ty}`} fill="none" stroke={CYAN} strokeWidth={8} strokeDasharray="18 12" />
              {(() => {
                const p = (time * 0.08) % 1;
                const x = lerp(ax, tx, p) - 4 * 100 * p * (1 - p);
                const y = lerp(ay, ty, p);
                return <path d="M-34 -10 H24 L38 0 L24 10 H-34 Z" transform={`translate(${x} ${y})`} fill={WHITE} stroke={INK} strokeWidth={4} />;
              })()}
            </>
          )}
          {kind === "history" && (
            <>
              <ProgressLine a={GIBRALTAR} b={JEBEL_MUSA} project={project} progress={reveal} color={GOLD} label="PILLARS OF HERCULES" />
            </>
          )}
        </svg>

        {!thumbnail && <InfoCard kind={kind} reveal={reveal} wide={wide} />}
        {!thumbnail && kind === "depth" && <DepthGraphic wide={wide} reveal={reveal} />}
        {!thumbnail && kind === "bridge" && <BridgeGraphic wide={wide} reveal={reveal} />}
        {!thumbnail && ["tunnel", "rail"].includes(kind) && <TunnelGraphic wide={wide} reveal={reveal} />}
        {!thumbnail && <SubscribeNudge T={time} until={plan.ctaT} top={wide ? 760 : 1450} />}
        {!thumbnail && time >= plan.ctaT && (
          <CtaCard
            T={time}
            likeT={plan.likeT}
            shareT={plan.shareT}
            subT={plan.subT}
            top={wide ? 540 : 1120}
          />
        )}
        {!thumbnail && plan.missing.length > 0 && (
          <div style={{ position: "absolute", left: 20, bottom: 20, color: RED, background: INK, fontSize: 24, padding: 8 }}>
            MISSING CUES: {plan.missing.join(" | ")}
          </div>
        )}
        {!thumbnail && <Caption section={section} time={time} wide={wide} ctaT={plan.ctaT} />}

        {thumbnail && (
          <>
            <AbsoluteFill
              style={{
                background: wide
                  ? "linear-gradient(90deg,rgba(3,9,18,.95),rgba(3,9,18,.48) 58%,rgba(3,9,18,.08))"
                  : "linear-gradient(180deg,rgba(3,9,18,.92),rgba(3,9,18,.2) 58%,rgba(3,9,18,.88))",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: wide ? 70 : 48,
                right: wide ? 790 : 48,
                top: wide ? 90 : 330,
                color: WHITE,
                fontFamily: DISPLAY,
                fontSize: wide ? 132 : 122,
                lineHeight: 0.9,
                WebkitTextStroke: `${wide ? 7 : 9}px ${INK}`,
                paintOrder: "stroke fill",
                textShadow: `0 11px 0 ${INK}`,
              }}
            >
              EUROPE &amp; AFRICA
              <br />
              <span style={{ color: GOLD }}>ONLY 14 KM!</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: wide ? 82 : 64,
                bottom: wide ? 78 : 350,
                padding: "14px 24px",
                borderRadius: 18,
                background: RED,
                color: WHITE,
                border: `5px solid ${INK}`,
                boxShadow: `0 9px 0 ${INK}`,
                fontFamily: DISPLAY,
                fontSize: wide ? 58 : 66,
              }}
            >
              SO WHY NO BRIDGE?
            </div>
          </>
        )}
      </SatelliteMap>
    </AbsoluteFill>
  );
};

export const StraitOfGibraltarVideo: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const plan = React.useMemo(() => makePlan(timing.sections), [timing.sections]);
  const first = (kind: Kind) =>
    timing.sections.find((section) => kindOf(section.text) === kind)?.start ?? Number.NaN;
  const sfx: [number, string, number][] = [
    [0.1, "riser", 0.15],
    [1.1, "boom", 0.22],
    [first("strait"), "whoosh", 0.17],
    [first("depth"), "boom", 0.18],
    [first("shipping"), "whoosh", 0.14],
    [first("currents"), "whoosh", 0.16],
    [first("wind"), "whoosh", 0.15],
    [first("seismic"), "boom", 0.18],
    [first("tunnel"), "ding", 0.2],
    [first("ferry"), "whoosh", 0.15],
    [first("aha"), "boom", 0.21],
  ];
  const sound = (at: number, name: string, volume: number) =>
    Number.isFinite(at) ? (
      <Sequence key={`${name}-${at}`} from={Math.max(0, Math.round(at * fps))} durationInFrames={75}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([at, name, volume]) => sound(at, name, volume))}
      {nudgeTimes(plan.ctaT).map((at) => sound(at + 1.1, "ding", 0.14))}
      {sound(plan.subT + 1.2, "ding", 0.25)}
      <StraitScene timing={timing} />
    </AbsoluteFill>
  );
};

export const StraitOfGibraltarThumb: React.FC<{ timing: Timing }> = ({ timing }) => (
  <StraitScene timing={timing} thumbnail />
);
