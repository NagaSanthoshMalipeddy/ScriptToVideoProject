import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { BODY, DISPLAY } from "../airace/fonts";
import { makeSatProjector, SatelliteMap, type SatView } from "../geo/SatelliteMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";

type Pt = [number, number];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = Easing.inOut(Easing.cubic);
const RED = "#ff3b4a";
const GOLD = "#ffd23f";
const W = 1080;
const H = 1920;

const MIAMI: Pt = [-80.19, 25.76];
const BERMUDA: Pt = [-64.78, 32.3];
const SAN_JUAN: Pt = [-66.11, 18.47];
const TRI: Pt[] = [MIAMI, BERMUDA, SAN_JUAN, MIAMI];
const FT_LAUD: Pt = [-80.14, 26.12];
const BARBADOS: Pt = [-59.54, 13.1];
const BALTIMORE: Pt = [-76.61, 39.29];
const GULF: Pt[] = [[-81.6, 24.1], [-80.1, 25.0], [-79.8, 26.8], [-79.8, 28.8], [-79.4, 30.8], [-77.8, 32.8], [-75.2, 34.9], [-71.5, 37.2], [-66, 39]];
const TRENCH: Pt[] = [[-68.8, 19.6], [-66.5, 19.85], [-64.5, 19.8], [-62.5, 19.3]];

const V = {
  atlantic: { lon: -58, lat: 26, span: 110 },
  tri: { lon: -72.3, lat: 25.6, span: 34 },
  triWide: { lon: -72, lat: 25.6, span: 42 },
  florida: { lon: -78.2, lat: 26.9, span: 16 },
  cyclops: { lon: -68.5, lat: 26, span: 44 },
  gulf: { lon: -77.5, lat: 30.5, span: 24 },
  trench: { lon: -66, lat: 19.8, span: 13 },
  out: { lon: -62, lat: 26, span: 95 },
} satisfies Record<string, SatView>;

// ---- cues --------------------------------------------------------------------------------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const makeCues = (secs: Section[]) => {
  const missing: string[] = [];
  const idx = (p: string) => {
    const i = secs.findIndex((s) => s.text.toLowerCase().includes(p.toLowerCase()));
    if (i < 0) missing.push(p);
    return i;
  };
  const at = (p: string, off = 0) => {
    const i = idx(p);
    return i < 0 ? NaN : secs[i].start + off;
  };
  const word = (p: string, w: string) => {
    const i = idx(p);
    if (i < 0) return NaN;
    const x = secs[i].words.find((z) => norm(z.word) === norm(w)) ?? secs[i].words.find((z) => norm(z.word).startsWith(norm(w)));
    return x ? x.start : secs[i].start;
  };
  return { at, word, missing };
};

const buildPlan = (secs: Section[], total: number) => {
  const { at, word, missing } = makeCues(secs);
  const t = {
    hook: at("Planes and ships vanish"), intro: at("This is the Bermuda"), miami: word("This is the Bermuda", "Miami"), bermuda: word("This is the Bermuda", "Bermuda,"), pr: word("This is the Bermuda", "Puerto"),
    area: at("1.3 million"), india: word("1.3 million", "India"), f19: at("In 1945"), never: at("never came back"), rescue: word("never came back", "rescue"),
    cyclops: at("USS Cyclops"), cycGone: word("USS Cyclops", "disappeared"), name: at("scary name"), blamed: at("people blamed aliens"), aliens: word("people blamed aliens", "aliens"),
    lost: word("people blamed aliens", "lost"), magnetic: word("people blamed aliens", "magnetic"), busy: at("busiest stretches"), gulf: at("Gulf Stream flows"), storms: at("Sudden storms"),
    trench: at("near Puerto Rico"), deep: word("near Puerto Rico", "8"), cursed: at("is it cursed"), no: word("is it cursed", "no"), real: at("real mystery"), check: at("cursed place"),
    cta: at("like, share"), like: word("like, share", "like"), share: word("like, share", "share"), sub: word("like, share", "subscribe"),
  };
  const keys: [number, SatView][] = ([
    [0, V.atlantic], [1.2, V.atlantic], [3.6, V.tri], [t.area, V.triWide], [t.f19, V.florida], [t.never + 1.5, { ...V.florida, span: 22, lon: -77.4 }],
    [t.cyclops, V.cyclops], [t.name, V.tri], [t.busy, V.triWide], [t.gulf, V.gulf], [t.storms, V.tri], [t.trench, V.trench], [t.cursed, V.triWide],
    [t.real, V.out], [t.cta, { ...V.out, span: 110 }], [total + 2, { ...V.out, span: 110 }],
  ] as [number, SatView][]).filter(([x]) => Number.isFinite(x));
  const pops: { t: number; big: string; sub?: string; color?: string }[] = ([
    { t: t.hook + 1.2, big: "BERMUDA TRIANGLE", color: RED },
    { t: t.intro, big: "MIAMI · BERMUDA · PUERTO RICO", color: "#fff" },
    { t: t.area, big: "≈ 1.3 MILLION KM²", sub: "about 40% of India's area", color: GOLD },
    { t: t.f19, big: "1945 · FLIGHT 19", sub: "5 US Navy planes", color: "#fff" },
    { t: t.never, big: "14 MEN · NEVER FOUND", sub: "a rescue plane was lost too", color: RED },
    { t: t.cyclops, big: "1918 · USS CYCLOPS", sub: "306 people on board", color: "#fff" },
    { t: t.name, big: "1964 · A SCARY NAME", color: RED },
    { t: t.blamed, big: "ALIENS? ATLANTIS? MAGNETS?", color: GOLD },
    { t: t.busy, big: "ONE OF THE BUSIEST SEAS", sub: "more traffic = more accidents", color: "#fff" },
    { t: t.gulf, big: "THE GULF STREAM", sub: "fast current carries wreckage away", color: "#7fdcff" },
    { t: t.storms, big: "SUDDEN STORMS", color: "#fff" },
    { t: t.trench, big: "8+ KM DEEP", sub: "Puerto Rico Trench", color: "#7fdcff" },
    { t: t.cursed, big: "CURSED?", color: RED },
    { t: t.real, big: "A LEGEND, NOT A CURSE", color: GOLD },
    { t: t.cta, big: "SUBSCRIBE", sub: "a new map story every day", color: RED },
  ] as { t: number; big: string; sub?: string; color?: string }[]).filter((p) => Number.isFinite(p.t));
  return { t, keys, pops, missing };
};
type Plan = ReturnType<typeof buildPlan>;

const cameraAt = (keys: [number, SatView][], T: number): SatView => {
  let k = 0;
  while (k < keys.length - 1 && T >= keys[k + 1][0]) k++;
  if (k === 0) return keys[0][1];
  const a = keys[k - 1][1];
  const [t0, b] = keys[k];
  const next = k + 1 < keys.length ? keys[k + 1][0] : t0 + 2.2;
  const p = ease(clamp((T - t0) / Math.max(0.01, Math.min(2.2, next - t0))));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const pathLen = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const along = (pts: Pt[], f: number): { p: Pt; ang: number } => {
  let left = pathLen(pts) * clamp(f);
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (left <= seg || i === pts.length - 1) {
      const q = seg ? clamp(left / seg) : 0;
      return { p: [lerp(pts[i - 1][0], pts[i][0], q), lerp(pts[i - 1][1], pts[i][1], q)], ang: Math.atan2(-(pts[i][1] - pts[i - 1][1]), pts[i][0] - pts[i - 1][0]) };
    }
    left -= seg;
  }
  return { p: pts[pts.length - 1], ang: 0 };
};

const Plane: React.FC<{ size: number; color?: string }> = ({ size, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="-20 -20 40 40">
    <path d="M18 0 L6 -2 L-2 -14 L-6 -14 L-1 -2 L-12 -2 L-16 -7 L-18 -7 L-15 0 L-18 7 L-16 7 L-12 2 L-1 2 L-6 14 L-2 14 L6 2 Z" fill={color} stroke="#111" strokeWidth={1.5} strokeLinejoin="round" />
  </svg>
);
const Ship: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size * 1.6} height={size} viewBox="0 0 64 40">
    <path d="M2 22 L62 22 L54 36 L10 36 Z" fill="#dfe6ef" stroke="#111" strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={20} y={8} width={22} height={14} fill="#c0cad6" stroke="#111" strokeWidth={2} />
    <rect x={26} y={2} width={4} height={8} fill="#555" />
  </svg>
);

const pop = (frame: number, fps: number, t: number) => (Number.isFinite(t) ? spring({ frame: frame - Math.round(t * fps), fps, config: { damping: 12, mass: 0.6 } }) : 0);
const win = (T: number, a: number, b: number, f = 0.4) => (Number.isFinite(a) && Number.isFinite(b) ? clamp(Math.min((T - a) / f, (b - T) / f)) : 0);

export const BermudaScene: React.FC<{ plan: Plan; T: number; frame: number; hud?: boolean }> = ({ plan, T, frame, hud = true }) => {
  const { fps } = useVideoConfig();
  const t = plan.t;
  const view = cameraAt(plan.keys, T);
  const { project: P, pxPerDeg } = makeSatProjector(view, W, H);
  const k = clamp(pxPerDeg / 40, 0.45, 1.6);
  const triDraw = ease(clamp((T - 1.6) / 2.2));
  const triFade = 1 - clamp((T - t.real - 1.5) / 2);
  const triPulse = 0.5 + 0.5 * Math.sin(T * 3);
  const triPath = TRI.map((p, i) => `${i ? "L" : "M"}${P(p[0], p[1]).map((v) => v.toFixed(1)).join(",")}`).join("");
  const darken = T > t.cta ? 0.35 : 0;

  // Flight 19: five planes head east from Fort Lauderdale, then vanish one by one.
  const f19 = Number.isFinite(t.f19) && T > t.f19 + 0.6 && T < t.cyclops;
  const f19p = clamp((T - t.f19 - 0.6) / 9);
  const vanish = (i: number) => clamp(1 - (T - (t.never + 0.4 + i * 0.5)) / 0.5);

  const cyc = Number.isFinite(t.cyclops) && T > t.cyclops && T < t.name + 0.5;
  const cycF = clamp((T - t.cyclops - 0.5) / Math.max(1, t.cycGone - t.cyclops)) * 0.55;
  const cycOp = 1 - clamp((T - t.cycGone - 0.3) / 0.6);
  const cycAt = along([BARBADOS, BALTIMORE], cycF);

  const traffic = win(T, t.busy, t.gulf, 0.6);
  const gulf = win(T, t.gulf, t.storms + 0.5, 0.6);
  const storm = win(T, t.storms, t.trench, 0.5);
  const trench = win(T, t.trench, t.cursed, 0.5);

  // Latest pop.
  let cur = plan.pops[0];
  for (const p of plan.pops) if (T >= p.t) cur = p;
  const pv = pop(frame, fps, cur?.t ?? 0);
  const showPop = cur && T >= cur.t;

  // Word-by-word caption (reference style).
  return (
    <AbsoluteFill>
      <SatelliteMap view={view} width={W} height={H} darken={darken}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="bglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          {triDraw > 0 && triFade > 0 && (
            <g opacity={triFade}>
              <path d={triPath + "Z"} fill={`rgba(255,40,60,${0.12 + 0.12 * triPulse * clamp(triDraw * 2 - 1)})`} />
              <path d={triPath} fill="none" stroke={RED} strokeWidth={14 * k} opacity={0.5} filter="url(#bglow)" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - triDraw} />
              <path d={triPath} fill="none" stroke="#ffd0d4" strokeWidth={4 * k} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - triDraw} />
            </g>
          )}
          {gulf > 0 && (
            <g opacity={gulf}>
              <path d={GULF.map((p, i) => `${i ? "L" : "M"}${P(p[0], p[1]).join(",")}`).join("")} fill="none" stroke="#39c8ff" strokeWidth={36 * k} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />
              <path d={GULF.map((p, i) => `${i ? "L" : "M"}${P(p[0], p[1]).join(",")}`).join("")} fill="none" stroke="#bff0ff" strokeWidth={6 * k} strokeDasharray={`${24 * k} ${22 * k}`} strokeDashoffset={-frame * 4} strokeLinecap="round" />
            </g>
          )}
          {trench > 0 && (
            <g opacity={trench}>
              <path d={TRENCH.map((p, i) => `${i ? "L" : "M"}${P(p[0], p[1]).join(",")}`).join("")} fill="none" stroke="#7fdcff" strokeWidth={5} strokeDasharray="14 10" />
            </g>
          )}
          {traffic > 0 &&
            Array.from({ length: 70 }, (_, i) => {
              const plane = i % 3 === 0;
              const lon0 = -84 + ((i * 37.3) % 26);
              const lat0 = 15 + ((i * 17.7) % 22);
              const dir = (i * 0.9) % (Math.PI * 2);
              const sp = plane ? 1.2 : 0.35;
              const lon = -84 + ((((lon0 + Math.cos(dir) * sp * T) - -84) % 26) + 26) % 26;
              const lat = 15 + ((((lat0 + Math.sin(dir) * sp * T) - 15) % 22) + 22) % 22;
              const [x, y] = P(lon, lat);
              return <circle key={i} cx={x} cy={y} r={plane ? 5 : 4} fill={plane ? GOLD : "#ffffff"} stroke="#111" strokeWidth={1.5} opacity={traffic} />;
            })}
        </svg>
        {triDraw > 0.9 &&
          triFade > 0 &&
          ([[MIAMI, "MIAMI", t.miami], [BERMUDA, "BERMUDA", t.bermuda], [SAN_JUAN, "PUERTO RICO", t.pr]] as [Pt, string, number][]).map(([p, label, at]) => {
            const [x, y] = P(p[0], p[1]);
            const o = Math.max(clamp((T - at) * 3), T > t.intro + 3 ? 1 : 0) * triFade;
            return o > 0 ? (
              <div key={label} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: o }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: RED, border: "4px solid #fff", boxShadow: "0 0 18px rgba(255,59,74,0.9)" }} />
                <div style={{ marginTop: 6, fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 30, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.9)", whiteSpace: "nowrap" }}>{label}</div>
              </div>
            ) : null;
          })}
        {f19 &&
          [0, 1, 2, 3, 4].map((i) => {
            const base = along([FT_LAUD, [-78.3, 26.4], [-77.4, 26.9]], f19p);
            const [x, y] = P(base.p[0] + (i - 2) * 0.12, base.p[1] + Math.abs(i - 2) * -0.12);
            const o = Math.min(clamp((T - t.f19 - 0.6) * 3), vanish(i));
            return o > 0 ? (
              <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${(-base.ang * 180) / Math.PI}deg)`, opacity: o }}>
                <Plane size={46 * k} />
              </div>
            ) : null;
          })}
        {f19 &&
          Number.isFinite(t.rescue) &&
          T > t.rescue &&
          (() => {
            const [x, y] = P(-79.3 + (T - t.rescue) * 0.25, 27.8);
            const o = clamp((T - t.rescue) * 3) * clamp(1 - (T - t.rescue - 1.6) / 0.6);
            return o > 0 ? (
              <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: o }}>
                <Plane size={52 * k} color={GOLD} />
              </div>
            ) : null;
          })()}
        {cyc &&
          (() => {
            const [x, y] = P(cycAt.p[0], cycAt.p[1]);
            const [bx, by] = P(BARBADOS[0], BARBADOS[1]);
            return (
              <>
                <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
                  <line x1={bx} y1={by} x2={x} y2={y} stroke="#ffffff" strokeWidth={4} strokeDasharray="10 10" opacity={0.8} />
                </svg>
                <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", opacity: cycOp }}>
                  <Ship size={46} />
                </div>
                {cycOp < 0.6 && <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)", fontFamily: DISPLAY, fontSize: 110, color: GOLD, textShadow: "0 4px 12px rgba(0,0,0,0.8)", opacity: 1 - cycOp }}>?</div>}
              </>
            );
          })()}
        {storm > 0 &&
          (() => {
            const [x, y] = P(-71.5, 26.5);
            return <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${-T * 90}deg)`, fontSize: 300 * k, opacity: storm * 0.9 }}>🌀</div>;
          })()}
        {trench > 0 &&
          (() => {
            const [x, y] = P(-65.5, 20.35);
            return <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-100%)", fontFamily: BODY, fontStyle: "italic", fontWeight: 800, fontSize: 34, color: "#bff0ff", textShadow: "0 2px 6px rgba(0,0,0,0.9)", opacity: trench, whiteSpace: "nowrap" }}>Puerto Rico Trench</div>;
          })()}
        {T > t.blamed &&
          T < t.busy &&
          ([["👽", t.aliens, [-75, 30]], ["🏛️", t.lost, [-68, 22]], ["🧲", t.magnetic, [-71, 28.5]]] as [string, number, Pt][]).map(([e, at, p]) => {
            const [x, y] = P(p[0], p[1]);
            const s = pop(frame, fps, at);
            return (
              <div key={e} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, fontSize: 110, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))" }}>
                {e}
                <span style={{ fontFamily: DISPLAY, fontSize: 70, color: GOLD, marginLeft: 6 }}>?</span>
              </div>
            );
          })}
      </SatelliteMap>
      {T > t.cursed && T < t.real + 1 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 92, color: RED, border: `10px solid ${RED}`, padding: "4px 30px", transform: `rotate(-7deg) scale(${2 - pop(frame, fps, t.no)})`, opacity: clamp(pop(frame, fps, t.no) * 1.5), background: "rgba(0,0,0,0.35)", textAlign: "center", lineHeight: 1.05 }}>
            NOT MORE
            <br />
            DANGEROUS
          </div>
        </div>
      )}
      {hud && (
        <>
          {showPop && (
            <div style={{ position: "absolute", left: 30, right: 30, top: 340, textAlign: "center", transform: `translateY(${(1 - pv) * 30}px)`, opacity: clamp(pv * 1.6) }}>
              <div style={{ fontFamily: DISPLAY, fontSize: cur.big.length > 20 ? 84 : 118, lineHeight: 1.05, color: cur.color, textShadow: "0 4px 18px rgba(0,0,0,0.9), 0 0 2px #000" }}>{cur.big}</div>
              {cur.sub && <div style={{ marginTop: 12, fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>{cur.sub}</div>}
            </div>
          )}
          <SubscribeNudge T={T} until={t.cta} top={1450} />
          {T >= t.cta && <CtaCard T={T} top={1150} likeT={t.like} shareT={t.share} subT={t.sub} />}
          {plan.missing.length > 0 && <div style={{ position: "absolute", left: 20, bottom: 20, color: "#f00", background: "#000", fontSize: 24, padding: 8 }}>MISSING CUES: {plan.missing.join(" | ")}</div>}
        </>
      )}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ secs: Section[]; T: number; ctaT: number }> = ({ secs, T, ctaT }) => {
  if (T >= ctaT) return null;
  const s = secs.find((x) => T >= x.start && T < x.end + 0.3);
  if (!s) return null;
  const said = s.words.filter((w) => w.start <= T);
  const words = said.slice(-4).map((w) => w.word);
  if (!words.length) return null;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1230, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 64, lineHeight: 1.15, color: "#fff", textShadow: "0 3px 12px rgba(0,0,0,0.9), 0 0 3px #000" }}>{words.join(" ")}</div>
  );
};

export const BermudaTriangle: React.FC<{ timing: Timing; captions?: boolean }> = ({ timing, captions = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const t = plan.t;
  const sfx: [number, string, number][] = [
    [0.1, "riser", 0.16], [1.6, "boom", 0.22], [t.intro, "whoosh", 0.18], [t.f19, "whoosh", 0.2], [t.never + 0.4, "pop", 0.16], [t.never + 1.4, "pop", 0.16],
    [t.cyclops, "whoosh", 0.2], [t.cycGone, "boom", 0.2], [t.name, "boom", 0.2], [t.aliens, "pop", 0.2], [t.lost, "pop", 0.2], [t.magnetic, "pop", 0.2],
    [t.busy, "whoosh", 0.2], [t.gulf, "whoosh", 0.18], [t.trench, "whoosh", 0.18], [t.no, "boom", 0.25], [t.real, "riser", 0.14],
  ];
  const cue = (time: number, name: string, vol: number, len = 45) =>
    Number.isFinite(time) ? (
      <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={len}>
        <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(t.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(t.sub + 1.2, "ding", 0.3)}
      <BermudaScene plan={plan} T={T} frame={frame} />
      {captions && <Caption secs={timing.sections} T={T} ctaT={t.cta} />}
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the video's opening cover) — title and details inside y 300–1480.
export const BermudaThumb: React.FC<{ timing: Timing }> = ({ timing }) => {
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const T = plan.t.intro + 3.5;
  return (
    <AbsoluteFill>
      <BermudaScene plan={plan} T={T} frame={Math.round(T * 30)} hud={false} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: "#fff", textShadow: "0 6px 26px rgba(0,0,0,0.95)" }}>BERMUDA</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: RED, textShadow: "0 6px 26px rgba(0,0,0,0.95)" }}>TRIANGLE</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 104, color: GOLD, textShadow: "0 6px 24px rgba(0,0,0,0.95)" }}>MYSTERY SOLVED?</div>
        <span style={{ display: "inline-block", marginTop: 14, fontFamily: BODY, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: "#fff", background: "rgba(255,59,74,0.92)", padding: "10px 26px" }}>5 PLANES VANISHED · 1945</span>
      </div>
    </AbsoluteFill>
  );
};
