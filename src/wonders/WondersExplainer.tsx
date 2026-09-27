import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { Character, type Mouth } from "../story/Character";
import { Button, INK } from "../cartoon/ui";
import { TE_BODY, TE_DISPLAY } from "../story/fonts";
import { MapView, type Region } from "../ukraine/GeoMap";
import { VehicleIcon } from "../cartoon/Icons";
import { SpeedStreaks } from "../cartoon/Motion";
import { COUNTRIES, REF_LAT, WONDERS, WORLD_VIEW, type Wonder } from "./data";
import { Flag, WonderArt } from "./Art";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const OCEAN = "#bfe3ff";
const LAND = "#f6ecd9";

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(t)))).join(",")})`;
};

// ---- camera -------------------------------------------------------------------------

type Cam = { lon: number; lat: number; span: number; anchor: number };

// Region whose projection puts (lon, lat) at `anchor` of the frame height with `span` degrees of longitude across.
const camRegion = (c: Cam, W: number, H: number): Region => {
  const scale = W / (c.span * COS);
  const latMax = c.lat + (c.anchor * H) / scale;
  return { lonMin: c.lon - c.span / 2, lonMax: c.lon + c.span / 2, latMin: latMax - H / scale, latMax, refLat: REF_LAT, noWrap: true };
};

const WORLD_CAM: Cam = { ...WORLD_VIEW, anchor: 0.45 };
const OUTRO_CAM: Cam = { ...WORLD_VIEW, anchor: 0.36 };
const wonderCam = (w: Wonder, push: number): Cam => ({ lon: w.lon, lat: w.lat, span: w.span * (1 - 0.12 * push), anchor: 0.47 });

// Flight paths bow northward so they read as air routes.
const arcPt = (a: Wonder, b: Wonder, q: number): [number, number] => {
  const d = Math.hypot(b.lon - a.lon, b.lat - a.lat);
  return [lerp(a.lon, b.lon, q), lerp(a.lat, b.lat, q) + Math.sin(Math.PI * q) * d * 0.18];
};
const arcPts = (a: Wonder, b: Wonder, to: number) => Array.from({ length: 30 }, (_, i) => arcPt(a, b, (i / 29) * to));

const flyTime = (i: number) => (i === 1 || i === 8 ? 2.2 : 1.8);

const cameraAt = (i: number, t: number, dur: number): { cam: Cam; p: number } => {
  if (i === 0) return { cam: { ...WORLD_CAM, lon: WORLD_VIEW.lon - 6 + 12 * clamp(t / dur) }, p: 1 };
  const fly = flyTime(i);
  const from: Cam = i === 1 ? { ...WORLD_CAM, lon: WORLD_VIEW.lon + 6 } : wonderCam(WONDERS[i - 2], 1);
  const to: Cam = i === 8 ? OUTRO_CAM : wonderCam(WONDERS[i - 1], 0);
  const p = Easing.inOut(Easing.cubic)(clamp(t / fly));
  if (i <= 7 && p >= 1) return { cam: wonderCam(WONDERS[i - 1], clamp((t - fly) / Math.max(1, dur - fly))), p };
  const hop = i >= 2 && i <= 7;
  const [lon, lat] = hop ? arcPt(WONDERS[i - 2], WONDERS[i - 1], p) : [lerp(from.lon, to.lon, p), lerp(from.lat, to.lat, p)];
  const dist = Math.hypot(to.lon - from.lon, to.lat - from.lat);
  const bump = hop ? Math.min(120, dist * 0.9) * Math.sin(Math.PI * p) : 0;
  // Exponential span interpolation feels like a real zoom rather than a linear crawl.
  const span = from.span * Math.pow(to.span / from.span, p) + bump;
  return { cam: { lon, lat, span, anchor: lerp(from.anchor, to.anchor, p) }, p };
};

// ---- pins ---------------------------------------------------------------------------

const Pin: React.FC<{ num: number; color: string; size: number }> = ({ num, color, size }) => (
  <svg width={size} height={size * 1.3} viewBox="0 0 60 78" style={{ overflow: "visible" }}>
    <ellipse cx={30} cy={77} rx={10} ry={3} fill="rgba(0,0,0,0.25)" />
    <path d="M30 76 C30 76 4 46 4 28 A26 26 0 0 1 56 28 C56 46 30 76 30 76 Z" fill={INK} stroke="#ffffff" strokeWidth={3} strokeLinejoin="round" />
    <circle cx={30} cy={28} r={17} fill={color} stroke="#ffffff" strokeWidth={3} />
    <text x={30} y={36} textAnchor="middle" fontFamily={TE_DISPLAY} fontSize={22} fontWeight={800} fill="#ffffff">
      {num}
    </text>
  </svg>
);

// Container is twice the pin height so the pin's tip sits exactly on the mover's point.
export const pinMover = (w: Wonder, size: number, drop = 0, opacity = 1) => ({
  lon: w.lon,
  lat: w.lat,
  w: size,
  h: size * 2.6,
  el: (
    <div style={{ width: size, height: size * 2.6, position: "relative", opacity }}>
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${drop}px)` }}>
        <Pin num={w.num} color={w.color} size={size} />
      </div>
    </div>
  ),
});

// ---- overlays -----------------------------------------------------------------------

const panel: React.CSSProperties = { background: "rgba(255,255,255,0.94)", border: `5px solid ${INK}`, borderRadius: 28, boxShadow: `0 10px 0 ${INK}` };

const Sparkles: React.FC<{ frame: number; size: number }> = ({ frame, size }) => (
  <>
    {[[-0.06, 0.1], [0.95, 0.05], [0.9, 0.85]].map(([x, y], i) => {
      const s = 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.12 + i * 2));
      return (
        <svg key={i} width={36} height={36} viewBox="0 0 20 20" style={{ position: "absolute", left: x * size, top: y * size, transform: `scale(${s})` }}>
          <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill="#ffc93c" stroke={INK} strokeWidth={1.5} />
        </svg>
      );
    })}
  </>
);

const WonderCard: React.FC<{ w: Wonder; frame: number; t: number; fly: number; dur: number }> = ({ w, frame, t, fly, dur }) => {
  const slide = spring({ frame: frame - Math.round((fly + 0.15) * 30), fps: 30, config: { damping: 15, mass: 0.8 } });
  const art = spring({ frame: frame - Math.round((fly + 0.4) * 30), fps: 30, config: { damping: 8, mass: 0.6 } });
  const chipAt = [fly + 1.2, Math.max(fly + 2.4, dur * 0.55)];
  const artSize = 360;
  return (
    <div style={{ position: "absolute", left: 36, right: 36, bottom: 70, ...panel, padding: 22, display: "flex", gap: 26, alignItems: "center", transform: `translateY(${(1 - slide) * 700}px)` }}>
      <div style={{ position: "relative", transform: `scale(${art}) rotate(${(1 - art) * -10}deg) translateY(${Math.sin(frame * 0.08) * 4}px)` }}>
        <WonderArt id={w.id} size={artSize} />
        <Sparkles frame={frame} size={artSize} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Flag iso={w.iso} width={120} />
          <span style={{ fontFamily: TE_DISPLAY, fontSize: 50, fontWeight: 800, color: INK, lineHeight: 1 }}>{w.country}</span>
        </div>
        <div style={{ alignSelf: "flex-start", background: INK, color: "#fff", borderRadius: 12, padding: "4px 14px", fontFamily: TE_BODY, fontSize: 26, fontWeight: 800, opacity: clamp((t - fly - 0.6) * 3) }}>
          {`${Math.abs(w.lat).toFixed(2)}°${w.lat >= 0 ? "N" : "S"}, ${Math.abs(w.lon).toFixed(2)}°${w.lon >= 0 ? "E" : "W"}`}
        </div>
        {w.facts.map((f, k) => {
          const s = spring({ frame: frame - Math.round(chipAt[k] * 30), fps: 30, config: { damping: 12, mass: 0.5 } });
          return (
            <div key={f} style={{ alignSelf: "flex-start", transform: `scale(${s})`, transformOrigin: "left center", opacity: s, background: w.color, color: "#fff", border: `4px solid ${INK}`, borderRadius: 16, padding: "6px 16px", fontFamily: TE_BODY, fontSize: 32, fontWeight: 800, boxShadow: `0 5px 0 ${INK}` }}>
              {f}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TopTitle: React.FC<{ w: Wonder; frame: number; fly: number }> = ({ w, frame, fly }) => {
  const badge = spring({ frame: frame - 3, fps: 30, config: { damping: 9, mass: 0.6 } });
  const name = spring({ frame: frame - Math.round((fly - 0.3) * 30), fps: 30, config: { damping: 13, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 36, right: 36, top: 60, display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 150, height: 150, flexShrink: 0, borderRadius: "50%", background: "#ffc93c", border: `7px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${badge}) rotate(${(1 - badge) * -40}deg)` }}>
        <span style={{ fontFamily: TE_BODY, fontSize: 20, fontWeight: 800, color: INK, lineHeight: 1, marginTop: -6 }}>NUMBER</span>
        <span style={{ fontFamily: TE_DISPLAY, fontSize: 76, fontWeight: 800, color: INK, lineHeight: 1, marginTop: 10, marginBottom: -14 }}>{w.num}</span>
      </div>
      <div style={{ ...panel, flex: 1, padding: "26px 24px 8px", transform: `translateX(${(1 - name) * 700}px)`, opacity: name }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: w.name.length > 14 ? 58 : 72, fontWeight: 800, color: INK, lineHeight: 1.02 }}>{w.name}</div>
      </div>
    </div>
  );
};

const BigHeading: React.FC<{ text: string; sub?: string; frame: number }> = ({ text, sub, frame }) => {
  const s = spring({ frame: frame - 2, fps: 30, config: { damping: 11, mass: 0.7 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 90, textAlign: "center", transform: `scale(${0.6 + 0.4 * s})`, opacity: s }}>
      <div style={{ fontFamily: TE_DISPLAY, fontSize: 150, fontWeight: 800, color: "#fff", WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", lineHeight: 0.95, textShadow: `0 10px 0 ${INK}` }}>{text}</div>
      {sub && <div style={{ display: "inline-block", marginTop: 18, ...panel, padding: "16px 28px 0", fontFamily: TE_DISPLAY, fontSize: 50, fontWeight: 800, color: INK }}>{sub}</div>}
    </div>
  );
};

const talkingAt = (words: Section["words"], abs: number) => words.some((w) => abs >= w.start - 0.04 && abs < w.end + 0.04);

// ---- beat ---------------------------------------------------------------------------

const pinTime = (k: number) => 1.0 + 0.45 * k;

const BeatView: React.FC<{ i: number; section: Section; dur: number }> = ({ i, section, dur }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const { cam, p } = cameraAt(i, t, dur);
  const region = camRegion(cam, width, height);
  const fly = flyTime(i);
  const current = i >= 1 && i <= 7 ? WONDERS[i - 1] : null;
  const landed = current ? spring({ frame: frame - Math.round(fly * 30), fps, config: { damping: 9, mass: 0.6 } }) : 0;
  const sw = cam.span > 150 ? 0.9 : cam.span > 70 ? 1.5 : 2.4;

  const countries = COUNTRIES.map((c) => {
    const k = WONDERS.findIndex((w) => w.iso === c.iso);
    let fill = LAND;
    if (k >= 0) {
      const w = WONDERS[k];
      if (i === 0) fill = mix(LAND, w.color, clamp((t - pinTime(k)) * 2) * 0.55);
      else if (i === 8) fill = mix(LAND, w.color, 0.75);
      else if (k === i - 1) fill = mix(LAND, w.color, 0.35 + 0.65 * clamp(landed));
      else if (k < i - 1) fill = mix(LAND, w.color, 0.35);
    }
    return { geom: c.geom, fill, stroke: INK, strokeWidth: sw, draw: 1 };
  });

  const lines = [] as { pts: [number, number][]; color: string; width: number; dash?: boolean }[];
  const done = i === 8 ? 6 : Math.max(0, i - 2);
  for (let k = 1; k <= done; k++) lines.push({ pts: arcPts(WONDERS[k - 1], WONDERS[k], 1), color: "rgba(32,35,42,0.55)", width: 4, dash: true });
  if (i >= 2 && i <= 7 && p > 0) lines.push({ pts: arcPts(WONDERS[i - 2], WONDERS[i - 1], p), color: INK, width: 5, dash: true });

  const movers = [] as ReturnType<typeof pinMover>[];
  if (i === 0) {
    WONDERS.forEach((w, k) => {
      const s = spring({ frame: frame - Math.round(pinTime(k) * 30), fps, config: { damping: 9, mass: 0.6 } });
      if (t >= pinTime(k)) movers.push(pinMover(w, 40, -(1 - s) * 140, clamp(s * 3)));
    });
  } else {
    const prev = i === 8 ? 7 : i - 1;
    for (let k = 0; k < prev; k++) movers.push(pinMover(WONDERS[k], i === 8 ? 42 : 40));
    if (current && t >= fly) movers.push(pinMover(current, 66, -(1 - landed) * 220, clamp(landed * 3)));
  }
  if (i >= 2 && i <= 7 && p > 0 && p < 1) {
    const [lon, lat] = arcPt(WONDERS[i - 2], WONDERS[i - 1], p);
    const q = Math.min(p, 0.98);
    const a = arcPt(WONDERS[i - 2], WONDERS[i - 1], q);
    const b = arcPt(WONDERS[i - 2], WONDERS[i - 1], q + 0.02);
    const heading = (Math.atan2(-(b[1] - a[1]), (b[0] - a[0]) * COS) * 180) / Math.PI;
    movers.push({
      lon,
      lat,
      w: 120,
      h: 90,
      el: (
        <div style={{ position: "relative", transform: `rotate(${heading}deg)` }}>
          <SpeedStreaks frame={frame} size={120} color="#ffffff" strength={0.8} />
          <VehicleIcon kind="plane" size={120} color="#ffffff" />
        </div>
      ),
    });
  }

  const abs = section.start + t;
  const talking = section.words.length ? talkingAt(section.words, abs) : false;
  const mouth: Mouth = talking ? (Math.sin(frame * 2.1) > 0 ? "open" : "flat") : "smile";
  const blink = t % 2.7 > 2.55 ? Math.sin((((t % 2.7) - 2.55) / 0.15) * Math.PI) : 0;

  return (
    <AbsoluteFill style={{ background: OCEAN }}>
      <Audio src={staticFile(`sfx/${i === 8 ? "riser" : "whoosh"}.wav`)} volume={0.35} />
      {i === 0 &&
        WONDERS.map((w, k) => (
          <Sequence key={w.id} from={Math.round(pinTime(k) * 30)} durationInFrames={20}>
            <Audio src={staticFile("sfx/pop.wav")} volume={0.35} />
          </Sequence>
        ))}
      {current && (
        <>
          <Sequence from={Math.round(fly * 30)} durationInFrames={20}>
            <Audio src={staticFile("sfx/pop.wav")} volume={0.45} />
          </Sequence>
          <Sequence from={Math.round((fly + 0.4) * 30)} durationInFrames={30}>
            <Audio src={staticFile("sfx/ding.wav")} volume={0.35} />
          </Sequence>
        </>
      )}
      {i === 8 && (
        <Sequence from={Math.round(2.2 * 30)} durationInFrames={40}>
          <Audio src={staticFile("sfx/boom.wav")} volume={0.35} />
        </Sequence>
      )}

      <AbsoluteFill>
        <MapView width={width} height={height} region={region} countries={countries} lines={lines} movers={movers} />
      </AbsoluteFill>

      {current && (
        <>
          <TopTitle w={current} frame={frame} fly={fly} />
          <WonderCard w={current} frame={frame} t={t} fly={fly} dur={dur} />
        </>
      )}

      {i === 0 && (
        <>
          <BigHeading text="7 WONDERS" sub="Which countries are they in?" frame={frame} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1250, display: "flex", justifyContent: "center", gap: 14 }}>
            {WONDERS.map((w, k) => {
              const s = spring({ frame: frame - Math.round(pinTime(k) * 30), fps, config: { damping: 10, mass: 0.5 } });
              return (
                <div key={w.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transform: `scale(${s})` }}>
                  <span style={{ fontFamily: TE_DISPLAY, fontSize: 38, fontWeight: 800, color: INK }}>#{w.num}</span>
                  <Flag iso={w.iso} width={118} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {i === 8 && (
        <>
          <BigHeading text="7 WONDERS" sub="The New Seven Wonders" frame={frame} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1070, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, padding: "0 90px" }}>
            {WONDERS.map((w, k) => {
              const s = spring({ frame: frame - Math.round((0.8 + k * 0.12) * 30), fps, config: { damping: 10, mass: 0.5 } });
              return (
                <div key={w.id} style={{ position: "relative", transform: `scale(${s})` }}>
                  <WonderArt id={w.id} size={196} />
                  <div style={{ position: "absolute", left: -10, top: -12, width: 56, height: 56, borderRadius: "50%", background: w.color, border: `4px solid ${INK}`, color: "#fff", fontFamily: TE_DISPLAY, fontSize: 32, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{w.num}</div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <div style={{ ...panel, padding: "16px 30px 0", fontFamily: TE_DISPLAY, fontSize: 52, fontWeight: 800, color: INK }}>Which one would you visit?</div>
            <Button text="FOLLOW" frame={frame} delay={40} bg="#3b6bff" />
          </div>
        </>
      )}

      {(i === 0 || i === 8) && (
        <div style={{ position: "absolute", right: 16, bottom: i === 8 ? 0 : 20 }}>
          <Character expr={i === 0 ? "surprised" : "happy"} mouth={mouth} blink={blink} armRaise={0.4 + 0.4 * Math.max(0, Math.sin(frame * 0.5))} bob={Math.sin(frame * 0.18) * 4} skin="#ffffff" width={width * (i === 8 ? 0.17 : 0.22)} />
        </div>
      )}
    </AbsoluteFill>
  );
};

export const WondersExplainer: React.FC<{ timing: Timing }> = ({ timing }) => {
  const { fps } = useVideoConfig();
  const secs = timing.sections;
  const total = timing.durationSec;
  return (
    <AbsoluteFill style={{ backgroundColor: OCEAN }}>
      <Audio src={staticFile(timing.audio)} />
      {secs.map((section, i) => {
        const endSec = i + 1 < secs.length ? secs[i + 1].start : total + 0.4;
        const startF = Math.round(section.start * fps);
        const lenF = Math.max(1, Math.round((endSec - section.start) * fps));
        return (
          <Sequence key={i} from={startF} durationInFrames={lenF}>
            <BeatView i={Math.min(i, 8)} section={section} dur={endSec - section.start} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
