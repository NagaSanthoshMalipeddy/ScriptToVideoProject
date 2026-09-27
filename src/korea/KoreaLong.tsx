import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { BODY } from "../airace/fonts";
import { Billboard, cut, HudBlock, Legend, MapLabel } from "../warmap/WarMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Flag, type FlagKind } from "./KoreaWar";
import { CN_EAST, CN_WEST, FRONTS, KOR, LONS, MDL, NK_EAST, NK_MAIN, OTHERS, PRK, UN_ARRIVE, UN_EAST, UN_INCHEON, YALU, type Pt } from "./data";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpPt = (a: Pt, b: Pt, p: number): Pt => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const ease = Easing.inOut(Easing.cubic);

const REF_LAT = 38;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const TILT = 28;
const PW = 2800;
const PH = 2400;
// Camera target on screen: right of the left-hand HUD column.
const FOCUS_X = 1260;
const FOCUS_Y = 560;

const C = {
  ocean: "#05080f",
  land: "#111722",
  landEdge: "#27324a",
  side: "#020306",
  korea: "#18202e",
  koreaEdge: "#d7e3f5",
  north: "rgba(255,59,74,",
  south: "rgba(77,163,255,",
  red: "#ff3b4a",
  blue: "#4da3ff",
  china: "#ff8a3d",
  hud: "#9fd8ff",
  gold: "#ffd23f",
  japan: "#e0556a",
};

const SEOUL: Pt = [126.98, 37.57];
const PYONG: Pt = [125.75, 39.03];
const BUSAN: Pt = [129.08, 35.18];
const INCHEON: Pt = [126.63, 37.46];
const PANMUNJOM: Pt = [126.68, 37.96];

type View = { lon: number; lat: number; span: number };
const V = {
  dawn: { lon: 127.6, lat: 38.4, span: 46 },
  cross: { lon: 126.6, lat: 38.2, span: 22 },
  seoul: { lon: 126.98, lat: 37.6, span: 13 },
  peninsula: { lon: 127.4, lat: 38.3, span: 34 },
  wide: { lon: 127.5, lat: 39.4, span: 72 },
  title: { lon: 127.6, lat: 38.6, span: 40 },
  dmz: { lon: 127.3, lat: 38.1, span: 18 },
  rewind: { lon: 127.6, lat: 38.6, span: 56 },
  japan: { lon: 131.0, lat: 37.6, span: 50 },
  p38: { lon: 127.2, lat: 38.1, span: 22 },
  south: { lon: 128.0, lat: 36.3, span: 26 },
  un: { lon: 129.6, lat: 36.1, span: 34 },
  pusan: { lon: 128.6, lat: 35.8, span: 20 },
  incheon: { lon: 126.4, lat: 37.35, span: 14 },
  north1: { lon: 126.4, lat: 38.8, span: 26 },
  pyong: { lon: 125.8, lat: 39.1, span: 16 },
  yalu: { lon: 126.4, lat: 40.6, span: 30 },
  china: { lon: 125.8, lat: 41.0, span: 50 },
  talks: { lon: 126.8, lat: 37.95, span: 12 },
  arm: { lon: 127.3, lat: 38.1, span: 22 },
  end: { lon: 128.2, lat: 38.2, span: 60 },
} satisfies Record<string, View>;

// ---- cue lookup ---------------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const makeCues = (secs: Section[]) => {
  const missing: string[] = [];
  const find = (phrase: string, last = false) => {
    const p = phrase.toLowerCase();
    const list = secs.map((s, i) => (s.text.toLowerCase().includes(p) ? i : -1)).filter((i) => i >= 0);
    if (!list.length) missing.push(phrase);
    return list.length ? list[last ? list.length - 1 : 0] : -1;
  };
  const at = (phrase: string, off = 0, last = false) => {
    const i = find(phrase, last);
    return i < 0 ? NaN : secs[i].start + off;
  };
  const word = (phrase: string, w: string, last = false) => {
    const i = find(phrase, last);
    if (i < 0) return NaN;
    const x = secs[i].words.find((z) => norm(z.word) === norm(w)) ?? secs[i].words.find((z) => norm(z.word).startsWith(norm(w)));
    return x ? x.start : secs[i].start;
  };
  const end = (phrase: string, last = false) => {
    const i = find(phrase, last);
    return i < 0 ? NaN : secs[Math.min(i + 1, secs.length - 1)].start;
  };
  return { at, word, end, missing };
};

// ---- tracks -------------------------------------------------------------------------

type K = { t: number; p: Pt | Pt[]; op?: number };
const endPt = (k: K): Pt => (Array.isArray(k.p[0]) ? (k.p as Pt[])[(k.p as Pt[]).length - 1] : (k.p as Pt));
// A key with a path moves along that path between the previous key and this one.
const trackAt = (raw: K[], T: number): { pos: Pt; op: number } => {
  const keys = raw.filter((k) => Number.isFinite(k.t));
  if (!keys.length) return { pos: [0, 0], op: 0 };
  if (T <= keys[0].t) return { pos: endPt(keys[0]), op: keys[0].op ?? 1 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (T < b.t) {
      const q = ease(clamp((T - a.t) / Math.max(0.01, b.t - a.t)));
      const pos = Array.isArray(b.p[0]) ? cut(b.p as Pt[], q).tip : lerpPt(endPt(a), b.p as Pt, q);
      return { pos, op: lerp(a.op ?? 1, b.op ?? 1, q) };
    }
  }
  const last = keys[keys.length - 1];
  return { pos: endPt(last), op: last.op ?? 1 };
};

const win = (T: number, a: number, b: number, fade = 0.5) => (Number.isFinite(a) && Number.isFinite(b) ? clamp(Math.min((T - a) / fade, (b - T) / fade)) : 0);

const buildPlan = (secs: Section[], total: number) => {
  const { at, word, end, missing } = makeCues(secs);

  const hookCrossT = at("neighboring");
  const hookSeoulT = at("three days");
  const rewindT = at("go back to the beginning");
  const invT = at("North Korean forces crossed");
  const seoulFellT = at("Seoul fell");
  const zonesT = at("divided the Korean");
  const lastTitleT = at("This was the Korean War", 0, true);
  const ctaT = at("like, share");

  const camKeys: [number, View][] = [
    [0, V.dawn],
    [hookCrossT + 0.3, V.cross],
    [hookSeoulT, V.seoul],
    [at("another superpower"), V.peninsula],
    [at("confrontation involving", 0.5), V.wide],
    [at("This was the Korean War"), V.title],
    [at("how did North Korea"), V.peninsula],
    [at("70 years"), V.dmz],
    [rewindT, V.rewind],
    [at("one Korea"), V.peninsula],
    [at("Japanese rule"), V.japan],
    [at("Korea was liberated", 1), V.peninsula],
    [at("dividing line"), V.p38],
    [at("Soviet Union supported"), V.peninsula],
    [at("Now imagine the map"), V.peninsula],
    [at("right in between"), V.p38],
    [invT, V.cross],
    [seoulFellT + 0.6, V.seoul],
    [at("pushed farther"), V.south],
    [at("Instead, the United States"), V.un],
    [at("By August 1950"), V.pusan],
    [at("risky move"), V.incheon],
    [at("Seoul had been recaptured"), V.seoul],
    [at("crossed the 38th parallel and moved"), V.north1],
    [at("captured Pyongyang"), V.pyong],
    [at("moving deeper"), V.yalu],
    [at("Look at the map again"), V.china],
    [at("captured by communist"), { ...V.seoul, span: 18 }],
    [at("regrouped"), V.peninsula],
    [at("negotiations for an armistice"), V.talks],
    [at("soldiers continued"), V.arm],
    [at("Demilitarized Zone"), V.dmz],
    [at("remained divided"), V.peninsula],
    [at("So what started"), V.peninsula],
    [at("Two countries"), V.dmz],
    [lastTitleT, V.title],
    [total + 1, V.end],
  ];
  const keys: [number, View][] = [];
  for (const [t, v] of camKeys.filter(([t]) => Number.isFinite(t))) keys.push([keys.length ? Math.max(t, keys[keys.length - 1][0] + 0.05) : t, v]);

  // North Korean flag progress along the invasion route (main war).
  const nkMainP = (T: number) => ease(clamp((T - invT) / Math.max(1, seoulFellT + 0.6 - invT)));
  const nkHookP = (T: number) => ease(clamp((T - hookCrossT) / Math.max(1, hookSeoulT + 0.8 - hookCrossT)));

  const frontKeys: [number, number, string][] = (
    [
      [at("pushed farther"), 3, "south1"],
      [at("continued pushing south"), 3, "pusan"],
      [at("Seoul had been recaptured", -1.5), 3, "retake"],
      [at("crossed the 38th parallel and moved"), 3, "pyong"],
      [at("moving deeper"), 4, "north"],
      [at("UN forces were pushed back"), 3, "retake"],
      [at("captured by communist"), 2.5, "china"],
      [at("retook Seoul"), 2.5, "retake"],
      [at("moved north again"), 1.8, "retake2"],
      [at("And then south again"), 1.6, "china2"],
      [at("And then north again"), 1.6, "retake2"],
      [at("stabilized roughly"), 3, "armistice"],
      [at("North Korea invaded South Korea"), 2, "pusan"],
      [at("intervened"), 2, "retake"],
      [at("pushed into North Korea"), 2, "north"],
      [at("China entered the war."), 2, "china"],
      [at("back and forth"), 2.2, "retake2"],
      [at("went silent"), 2, "armistice"],
    ] as [number, number, string][]
  ).filter(([t]) => Number.isFinite(t));

  const stalemate: [number, number] = [at("For the next two years"), at("July 27, 1953")];

  const frontAt = (T: number): number[] => {
    if (T < rewindT) {
      const q = clamp((nkHookP(T) - 0.68) / 0.32);
      return FRONTS.p38.map((v, i) => lerp(v, FRONTS.seoul[i], q));
    }
    const first = T >= invT ? clamp((nkMainP(T) - 0.68) / 0.32) : 0;
    let cur = FRONTS.p38.map((v, i) => lerp(v, FRONTS.seoul[i], first));
    let last = "seoul";
    for (const [t, d, f] of frontKeys) {
      if (T < t) break;
      const q = ease(clamp((T - t) / d));
      cur = FRONTS[last].map((v, i) => lerp(v, FRONTS[f][i], q));
      last = f;
    }
    const wob = win(T, stalemate[0], stalemate[1], 1) * 0.1;
    return cur.map((v, i) => v + Math.sin(T * 1.3 + i * 0.9) * wob);
  };

  const hookOn = (T: number) => win(T, hookCrossT - 0.3, rewindT + 0.3, 0.5);

  // Flags
  const flags: { kind: FlagKind; label?: (T: number) => string | undefined; keys: K[] }[] = [
    {
      kind: "NK",
      keys: [
        { t: 0, p: NK_MAIN[0], op: 0 },
        { t: hookCrossT, p: NK_MAIN[0], op: 1 },
        { t: hookSeoulT + 0.8, p: NK_MAIN, op: 1 },
        { t: rewindT, p: SEOUL, op: 1 },
        { t: rewindT + 0.6, p: SEOUL, op: 0 },
        { t: rewindT + 0.7, p: PYONG, op: 0 },
        { t: at("In the north was"), p: PYONG, op: 0 },
        { t: at("In the north was", 0.8), p: PYONG, op: 1 },
        { t: invT, p: NK_MAIN[0], op: 1 },
        { t: seoulFellT + 0.6, p: NK_MAIN, op: 1 },
        { t: at("continued pushing south"), p: SEOUL, op: 1 },
        { t: at("continued pushing south", 3), p: [SEOUL, [127.4, 36.35], [128.2, 35.75]], op: 1 },
        { t: at("Seoul had been recaptured"), p: [128.2, 35.75], op: 1 },
        { t: at("army began retreating", 2), p: [126.5, 39.6], op: 1 },
        { t: at("captured Pyongyang", 1.5), p: [126.6, 40.6], op: 1 },
        { t: at("UN forces were pushed back", 2.5), p: [127.3, 38.9], op: 1 },
        { t: at("stabilized roughly", 2.5), p: [127.1, 38.85], op: 1 },
      ],
    },
    {
      kind: "SK",
      keys: [
        { t: at("In the south was"), p: [127.9, 36.6], op: 0 },
        { t: at("In the south was", 0.8), p: [127.9, 36.6], op: 1 },
        { t: seoulFellT + 1, p: [128.4, 36.2], op: 1 },
        { t: at("continued pushing south", 3), p: [128.9, 35.55], op: 1 },
        { t: at("main contributor"), p: [128.9, 35.55], op: 1 },
        { t: at("main contributor", 1), p: [128.9, 35.55], op: 0 },
        { t: at("July 27, 1953"), p: [127.7, 37.45], op: 0 },
        { t: at("July 27, 1953", 1), p: [127.7, 37.45], op: 1 },
      ],
    },
    {
      kind: "UN",
      label: (T) => (T < at("By August 1950") && T > at("Instead, the United States") ? "UN · LED BY US" : undefined),
      keys: [
        { t: at("another superpower"), p: [129.4, 35.6], op: 0 },
        { t: at("another superpower", 0.5), p: [129.4, 35.6], op: 1 },
        { t: rewindT, p: [129.4, 35.6], op: 1 },
        { t: rewindT + 0.6, p: [129.4, 35.6], op: 0 },
        { t: rewindT + 0.7, p: UN_ARRIVE[0], op: 0 },
        { t: at("Instead, the United States"), p: UN_ARRIVE[0], op: 0 },
        { t: at("Instead, the United States", 0.5), p: UN_ARRIVE[0], op: 1 },
        { t: at("American troops"), p: UN_ARRIVE[0], op: 1 },
        { t: at("American troops", 3), p: UN_ARRIVE, op: 1 },
        { t: at("By August 1950", 3), p: [128.95, 35.65], op: 1 },
        { t: at("amphibious landing"), p: [128.95, 35.65], op: 1 },
        { t: at("amphibious landing", 0.3), p: UN_INCHEON[0], op: 0 },
        { t: at("amphibious landing", 0.8), p: UN_INCHEON[0], op: 1 },
        { t: at("September 15"), p: UN_INCHEON.slice(0, 3), op: 1 },
        { t: at("pushed toward Seoul", 2), p: SEOUL, op: 1 },
        { t: at("crossed the 38th parallel and moved", 2.5), p: [126.3, 38.6], op: 1 },
        { t: at("captured Pyongyang", 1), p: PYONG, op: 1 },
        { t: at("moving deeper", 2.5), p: [125.8, 40.2], op: 1 },
        { t: at("closer and closer", 2), p: [126.2, 40.6], op: 1 },
        { t: at("UN forces were pushed back"), p: [126.2, 40.6], op: 1 },
        { t: at("UN forces were pushed back", 2.5), p: [127.4, 38.0], op: 1 },
        { t: at("captured by communist", 2), p: [127.7, 37.0], op: 1 },
        { t: at("retook Seoul", 2), p: [127.3, 37.6], op: 1 },
        { t: at("stabilized roughly", 2), p: [127.9, 37.75], op: 1 },
        { t: at("July 27, 1953"), p: [127.9, 37.75], op: 1 },
        { t: at("July 27, 1953", 1), p: [127.9, 37.75], op: 0 },
      ],
    },
    {
      kind: "CN",
      label: (T) => (T > at("Chinese forces entered") && T < at("regrouped") ? "CHINA" : undefined),
      keys: [
        { t: at("Then another."), p: [124.3, 41.0], op: 0 },
        { t: at("Then another.", 0.4), p: [124.3, 41.0], op: 1 },
        { t: rewindT, p: [124.3, 41.0], op: 1 },
        { t: rewindT + 0.6, p: [124.3, 41.0], op: 0 },
        { t: at("Chinese forces entered"), p: CN_WEST[0], op: 0 },
        { t: at("Chinese forces entered", 0.5), p: CN_WEST[0], op: 1 },
        { t: at("launched major attacks", 2.5), p: CN_WEST.slice(0, 3), op: 1 },
        { t: at("UN forces were pushed back", 2.5), p: [126.4, 38.4], op: 1 },
        { t: at("captured by communist", 2), p: SEOUL, op: 1 },
        { t: at("retook Seoul", 2), p: [126.6, 38.5], op: 1 },
        { t: at("stabilized roughly", 2), p: [126.4, 38.9], op: 1 },
        { t: at("July 27, 1953"), p: [126.4, 38.9], op: 1 },
        { t: at("July 27, 1953", 1), p: [126.4, 38.9], op: 0 },
      ],
    },
    {
      kind: "SU",
      label: (T) => (T < at("In the north was") ? "USSR" : undefined),
      keys: [
        { t: at("came the Cold War"), p: [126.2, 40.0], op: 0 },
        { t: at("came the Cold War", 0.6), p: [126.2, 40.0], op: 1 },
        { t: at("In the north was"), p: [126.2, 40.0], op: 1 },
        { t: at("In the north was", 0.8), p: [126.2, 40.0], op: 0 },
      ],
    },
    {
      kind: "US",
      label: (T) => (T < at("In the south was") ? "UNITED STATES" : undefined),
      keys: [
        { t: at("came the Cold War"), p: [128.0, 36.4], op: 0 },
        { t: at("came the Cold War", 0.6), p: [128.0, 36.4], op: 1 },
        { t: at("In the south was"), p: [128.0, 36.4], op: 1 },
        { t: at("In the south was", 0.8), p: [128.0, 36.4], op: 0 },
      ],
    },
    {
      kind: "JP",
      label: () => "JAPANESE RULE",
      keys: [
        { t: at("Japanese rule"), p: [127.6, 38.6], op: 0 },
        { t: at("Japanese rule", 0.5), p: [127.6, 38.6], op: 1 },
        { t: at("Korea was liberated"), p: [127.6, 38.6], op: 1 },
        { t: at("Korea was liberated", 0.8), p: [127.6, 38.6], op: 0 },
      ],
    },
  ];

  // Hook badges for the four powers, popping on each spoken name.
  const involve = at("confrontation involving");
  const badges: { kind: FlagKind; p: Pt; t: number }[] = [
    { kind: "US", p: [131.6, 36.4], t: word("confrontation involving", "United") },
    { kind: "CN", p: [123.0, 41.4], t: word("confrontation involving", "China") },
    { kind: "SU", p: [132.2, 43.2], t: word("confrontation involving", "Soviet") },
    { kind: "UN", p: [130.4, 33.6], t: word("confrontation involving", "Nations") },
  ];
  const badgesOff = at("This was the Korean War", 0.8);

  type R = { pts: Pt[]; color: string; a: number; b: number; fade: number };
  const routes: R[] = [
    { pts: NK_MAIN, color: C.red, a: hookCrossT, b: hookSeoulT + 0.8, fade: rewindT },
    ...NK_EAST.map((p, i) => ({ pts: p, color: C.red, a: hookCrossT + 0.4 + i * 0.3, b: hookSeoulT + 1, fade: rewindT })),
    ...NK_EAST.map((p, i) => ({ pts: p, color: C.red, a: invT + 1 + i * 0.3, b: at("advanced rapidly", 2.5), fade: at("Seoul had been recaptured") })),
    { pts: [SEOUL, [127.4, 36.35], [128.2, 35.75]], color: C.red, a: at("continued pushing south"), b: at("continued pushing south", 3), fade: at("Seoul had been recaptured") },
    { pts: UN_ARRIVE, color: C.blue, a: at("American troops"), b: at("American troops", 3), fade: at("amphibious landing") },
    { pts: UN_INCHEON, color: C.blue, a: at("amphibious landing", 0.5), b: at("pushed toward Seoul", 2), fade: at("UN forces were pushed back") },
    { pts: [[128.6, 35.9], [127.4, 36.8], [127.0, 37.55]], color: C.blue, a: at("pushed toward Seoul"), b: at("pushed toward Seoul", 3), fade: at("UN forces were pushed back") },
    { pts: [[126.95, 37.6], [126.2, 38.4], PYONG], color: C.blue, a: at("crossed the 38th parallel and moved"), b: at("captured Pyongyang", 1), fade: at("UN forces were pushed back") },
    { pts: [PYONG, [125.5, 39.9], [125.9, 40.5]], color: C.blue, a: at("moving deeper"), b: at("moving deeper", 3), fade: at("UN forces were pushed back") },
    { pts: UN_EAST, color: C.blue, a: at("moving deeper", 0.5), b: at("closer and closer", 2), fade: at("UN forces were pushed back") },
    { pts: CN_WEST, color: C.china, a: at("Chinese forces entered", 0.5), b: at("launched major attacks", 3), fade: at("regrouped") },
    { pts: CN_EAST, color: C.china, a: at("Chinese forces entered", 0.9), b: at("launched major attacks", 3), fade: at("regrouped") },
  ];

  const pulses: { p: Pt; t: number; color: string }[] = [
    { p: SEOUL, t: hookSeoulT, color: C.red },
    { p: SEOUL, t: seoulFellT, color: C.red },
    { p: SEOUL, t: at("Seoul had been recaptured"), color: C.blue },
    { p: PYONG, t: at("captured Pyongyang"), color: C.blue },
    { p: SEOUL, t: at("captured by communist"), color: C.red },
    { p: SEOUL, t: at("retook Seoul"), color: C.blue },
    { p: INCHEON, t: at("amphibious landing", 0.5), color: C.blue },
  ];

  type L = { text: string; p: Pt; a: number; b: number; color?: string; kind?: "country" | "city" | "region" };
  const labels: L[] = [
    { text: "KOREA", p: [127.6, 38.9], a: at("one Korea"), b: zonesT, kind: "country" },
    { text: "CHINA", p: [123.2, 43.4], a: at("Look at the map again"), b: at("regrouped"), kind: "country" },
    { text: "JAPAN", p: [135.5, 35.6], a: at("Japanese rule"), b: at("Korea was liberated", 1.5), kind: "country" },
    { text: "SOVIET ZONE", p: [127.7, 41.2], a: zonesT + 1, b: at("In the north was"), color: "#ff9aa3", kind: "region" },
    { text: "US ZONE", p: [128.1, 35.9], a: zonesT + 1, b: at("In the south was"), color: "#9fc8ff", kind: "region" },
    { text: "DPRK · KIM IL SUNG", p: [126.9, 41.0], a: at("In the north was", 0.5), b: at("Now imagine the map"), color: "#ff9aa3", kind: "region" },
    { text: "ROK · SYNGMAN RHEE", p: [128.1, 35.9], a: at("In the south was", 0.5), b: at("Now imagine the map"), color: "#9fc8ff", kind: "region" },
    { text: "NORTH KOREA", p: [126.9, 40.4], a: hookCrossT, b: rewindT, kind: "country" },
    { text: "SOUTH KOREA", p: [127.9, 36.3], a: hookCrossT, b: rewindT, kind: "country" },
    { text: "NORTH KOREA", p: [126.9, 40.4], a: at("Now imagine the map"), b: total + 5, kind: "country" },
    { text: "SOUTH KOREA", p: [127.9, 36.3], a: at("Now imagine the map"), b: total + 5, kind: "country" },
    { text: "38TH PARALLEL", p: [123.9, 38.02], a: at("dividing line"), b: at("stabilized roughly", 4), color: "#ffffff", kind: "region" },
    { text: "38TH PARALLEL", p: [123.9, 38.02], a: hookCrossT, b: rewindT, color: "#ffffff", kind: "region" },
    { text: "PUSAN PERIMETER", p: [129.9, 35.4], a: at("Pusan Perimeter"), b: at("amphibious landing"), color: C.hud, kind: "region" },
    { text: "SUPPLY LINES CUT", p: [127.6, 36.9], a: at("supply lines"), b: at("supply lines", 4), color: C.gold, kind: "region" },
    { text: "YALU RIVER", p: [124.6, 40.7], a: at("Yalu River"), b: at("Now the battlefield", 6), color: C.hud, kind: "region" },
    { text: "PANMUNJOM · TALKS", p: [PANMUNJOM[0] - 0.9, PANMUNJOM[1] + 0.25], a: at("negotiations for an armistice"), b: at("July 27, 1953", 6), color: C.gold, kind: "region" },
    { text: "DMZ", p: [128.9, 38.9], a: at("Demilitarized Zone", 1), b: total + 5, color: C.hud, kind: "region" },
    { text: "DMZ", p: [128.9, 38.9], a: at("70 years"), b: rewindT, color: C.hud, kind: "region" },
  ];

  return {
    at,
    word,
    end,
    missing,
    keys,
    frontAt,
    nkMainP,
    nkHookP,
    hookOn,
    flags,
    badges,
    involve,
    badgesOff,
    routes,
    pulses,
    labels,
    t: { hookCrossT, hookSeoulT, rewindT, invT, seoulFellT, zonesT, lastTitleT, ctaT },
  };
};
type Plan = ReturnType<typeof buildPlan>;

const cameraAt = (plan: Plan, T: number): View => {
  const { invT, seoulFellT, hookCrossT, hookSeoulT } = plan.t;
  // Follow the invading flag (hook preview and the main invasion).
  const follow = (p: number, from: View, to: View) => {
    const tip = cut(NK_MAIN, p).tip;
    const a = clamp(p * 3);
    const b = clamp((p - 0.85) / 0.15);
    return { lon: lerp(lerp(from.lon, tip[0], a), to.lon, b), lat: lerp(lerp(from.lat, tip[1], a), to.lat, b), span: from.span * Math.pow(to.span / from.span, p) };
  };
  if (T > invT && T < seoulFellT + 0.6) return follow(plan.nkMainP(T), V.cross, V.seoul);
  if (T > hookCrossT + 0.3 && T < hookSeoulT) return follow(plan.nkHookP(T) / Math.max(0.01, plan.nkHookP(hookSeoulT)), V.cross, V.seoul);
  const keys = plan.keys;
  let k = 0;
  while (k < keys.length - 2 && T >= keys[k + 1][0]) k++;
  const [t0, a] = keys[k];
  const [t1, b] = keys[k + 1];
  const p = ease(clamp((T - t0) / Math.max(0.01, t1 - t0)));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

const regionFor = (v: View): Region => {
  const scale = PW / (v.span * COS);
  const latMax = v.lat + (0.5 * PH) / scale;
  return { lonMin: v.lon - v.span / 2, lonMax: v.lon + v.span / 2, latMin: latMax - PH / scale, latMax, refLat: REF_LAT, noWrap: true };
};

// ---- scene --------------------------------------------------------------------------

export const KoreaLongScene: React.FC<{ timing: Timing; T: number; frame: number; hud?: boolean }> = ({ timing, T, frame, hud = true }) => {
  const { width, height } = useVideoConfig();
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const { at } = plan;
  const { rewindT, invT, zonesT } = plan.t;

  const cam = cameraAt(plan, T);
  const prev = cameraAt(plan, T - 1 / 30);
  const proj = makeProjector(regionFor(cam), PW, PH);
  const P = (lon: number, lat: number) => proj(lon, lat);
  const [cx, cy] = P(cam.lon, cam.lat);
  const [px, py] = makeProjector(regionFor(prev), PW, PH)(cam.lon, cam.lat);
  const blur = Math.min(5, Math.hypot(cx - px, cy - py) / 30 + Math.abs(Math.log(cam.span / prev.span)) * 60);
  const pts = (list: Pt[]) => list.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join(" ");

  const hookOn = plan.hookOn(T);
  const warOn = T >= invT ? 1 : 0;
  const zoneOn = clamp((T - zonesT) / 1.2);
  const shadeOn = Math.max(hookOn, zoneOn);
  const frontOn = Math.max(hookOn, warOn);
  const front = plan.frontAt(T);
  const frontPts: Pt[] = LONS.map((lo, i) => [lo, front[i]]);
  const northPoly = { type: "Polygon", coordinates: [[[LONS[0], 44], [LONS[LONS.length - 1], 44], ...[...frontPts].reverse()]] };
  const southPoly = { type: "Polygon", coordinates: [[[LONS[0], 32.5], [LONS[LONS.length - 1], 32.5], ...[...frontPts].reverse()]] };
  const northBoost = 1 + 0.8 * win(T, at("North Korea is at the top"), at("South Korea is at the bottom"));
  const southBoost = 1 + 0.8 * win(T, at("South Korea is at the bottom"), at("right in between"));
  const perimeterGlow = win(T, at("Pusan Perimeter"), at("amphibious landing"));
  const japanHatch = win(T, at("Japanese rule", 0.3), at("Korea was liberated", 1), 0.8);
  const claim = win(T, at("claimed to represent"), at("The stage was set", 1));
  const claimColor = Math.floor(T / 0.8) % 2 ? C.red : C.blue;
  const p38Op = Math.max(hookOn, clamp((T - at("dividing line")) / 1)) * (T > at("stabilized roughly", 4) ? 0.4 : 0.9) * (1 + 0.6 * win(T, at("right in between"), at("Then comes the date")));
  const yaluOn = clamp((T - at("Yalu River")) / 1) * (1 - 0.6 * clamp((T - at("Now the battlefield", 6)) / 2));
  const dmzOn = Math.max(win(T, at("70 years"), rewindT), clamp((T - at("Demilitarized Zone")) / 1.5));
  const desat = win(T, at("devastated"), at("But eventually, after years"), 0.8);
  const rewindFx = win(T, rewindT, at("one Korea"), 0.4);

  const bScale = clamp(24 / cam.span, 0.5, 1.15);
  const flagsOn = clamp((62 - cam.span) / 10);
  const citiesOn = clamp((42 - cam.span) / 6);
  const sw = cam.span > 50 ? 1.2 : 1.8;

  const glowLine = (id: string, list: Pt[], color: string, w: number, op: number, flow = true) => (
    <g key={id} opacity={op}>
      <polyline points={pts(list)} fill="none" stroke={color} strokeWidth={w * 2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#lglow)" opacity={0.5} />
      <polyline points={pts(list)} fill="none" stroke="#ffffff" strokeWidth={w * 0.8} strokeDasharray={flow ? "20 14" : undefined} strokeDashoffset={-frame * 2.5} strokeLinecap="round" opacity={0.85} />
    </g>
  );
  const bb = (lon: number, lat: number, node: React.ReactNode, op = 1, key?: string) => {
    const [x, y] = P(lon, lat);
    return op > 0.01 ? (
      <Billboard key={key} x={x} y={y} opacity={op} scale={bScale}>
        {node}
      </Billboard>
    ) : null;
  };

  const planeLeft = FOCUS_X - PW / 2;
  const planeTop = FOCUS_Y - PH / 2;
  const gridStep = cam.span > 45 ? 5 : 2;
  const gridN = Math.ceil((cam.span * 2.2) / gridStep);

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden", filter: desat > 0 || rewindFx > 0 ? `grayscale(${(desat * 0.7).toFixed(2)}) sepia(${(rewindFx * 0.5).toFixed(2)})` : undefined }}>
      <AbsoluteFill style={{ perspective: 1900, perspectiveOrigin: `${FOCUS_X}px ${FOCUS_Y}px` }}>
        <div style={{ position: "absolute", left: planeLeft, top: planeTop, width: PW, height: PH, transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d", filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="lglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="lkoreaLand">
                <path d={geomPath(PRK, P)} />
                <path d={geomPath(KOR, P)} />
              </clipPath>
              <pattern id="hatchJapan" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="14" height="14" fill="rgba(224,85,106,0.22)" />
                <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(224,85,106,0.85)" strokeWidth="5" />
              </pattern>
              <radialGradient id="llight" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="rgba(120,170,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            <rect width={PW} height={PH} fill={C.ocean} />
            {Array.from({ length: gridN }, (_, i) => {
              const lo = Math.floor((cam.lon - cam.span * 1.1) / gridStep) * gridStep + i * gridStep;
              const [x] = P(lo, cam.lat);
              return <line key={`lo${i}`} x1={x} y1={0} x2={x} y2={PH} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            {Array.from({ length: gridN }, (_, i) => {
              const la = Math.floor((cam.lat - cam.span * 1.1) / gridStep) * gridStep + i * gridStep;
              const [, y] = P(cam.lon, la);
              return <line key={`la${i}`} x1={0} y1={y} x2={PW} y2={y} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}

            <g transform="translate(0 12)">
              {OTHERS.map((c) => (
                <path key={`s${c.iso}`} d={geomPath(c.geom, P)} fill={C.side} />
              ))}
              <path d={geomPath(PRK, P)} fill={C.side} />
              <path d={geomPath(KOR, P)} fill={C.side} />
            </g>
            {OTHERS.map((c) => (
              <path key={c.iso} d={geomPath(c.geom, P)} fill={c.iso === "CHN" ? "#1f1618" : c.iso === "RUS" ? "#1a1922" : c.iso === "JPN" ? "#1d1a20" : C.land} stroke={c.iso === "CHN" ? "rgba(255,138,61,0.55)" : C.landEdge} strokeWidth={sw} strokeLinejoin="round" />
            ))}

            {/* One peninsula in every era: no modern internal border is drawn. */}
            <path d={geomPath(PRK, P)} fill="none" stroke={claim > 0 ? claimColor : C.koreaEdge} strokeWidth={6 + claim * 4} strokeLinejoin="round" filter="url(#lglow)" opacity={0.85} />
            <path d={geomPath(KOR, P)} fill="none" stroke={claim > 0 ? claimColor : C.koreaEdge} strokeWidth={6 + claim * 4} strokeLinejoin="round" filter="url(#lglow)" opacity={0.85} />
            <path d={geomPath(PRK, P)} fill={C.korea} stroke={C.korea} strokeWidth={2.5} />
            <path d={geomPath(KOR, P)} fill={C.korea} stroke={C.korea} strokeWidth={2.5} />

            <g clipPath="url(#lkoreaLand)">
              <path d={geomPath(northPoly, P)} fill={`${C.north}${(0.3 * shadeOn * northBoost).toFixed(3)})`} />
              <path d={geomPath(southPoly, P)} fill={`${C.south}${(0.3 * shadeOn * southBoost).toFixed(3)})`} />
              {japanHatch > 0 && <rect width={PW} height={PH} fill="url(#hatchJapan)" opacity={japanHatch} />}
              {frontOn > 0 && <polyline points={pts(frontPts)} fill="none" stroke={C.gold} strokeWidth={7 + perimeterGlow * 6} strokeLinejoin="round" filter="url(#lglow)" opacity={frontOn} />}
            </g>

            <line x1={P(123.3, 38)[0]} y1={P(123.3, 38)[1]} x2={P(131.8, 38)[0]} y2={P(131.8, 38)[1]} stroke="#ffffff" strokeWidth={4} strokeDasharray="16 12" opacity={clamp(p38Op)} />

            {yaluOn > 0 && glowLine("yalu", YALU, C.hud, 3, yaluOn, false)}
            {dmzOn > 0 && (
              <g opacity={dmzOn}>
                <polyline points={pts(cut(MDL, clamp(dmzOn * 1.2)).pts)} fill="none" stroke="rgba(159,216,255,0.35)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" filter="url(#lglow)" />
                <polyline points={pts(cut(MDL, clamp(dmzOn * 1.2)).pts)} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="10 8" />
              </g>
            )}

            {plan.routes.map((r, i) => {
              if (!Number.isFinite(r.a) || T < r.a) return null;
              const f = ease(clamp((T - r.a) / Math.max(0.1, r.b - r.a)));
              const op = 1 - clamp((T - r.fade) / 1.2);
              if (op <= 0.01) return null;
              const c = cut(r.pts, f);
              const [tx, ty] = P(c.tip[0], c.tip[1]);
              const [bx, by] = P(c.tip[0] - Math.cos(c.ang) * 0.01, c.tip[1] - Math.sin(c.ang) * 0.01);
              const a = Math.atan2(ty - by, tx - bx);
              return (
                <g key={`r${i}`} opacity={op}>
                  {glowLine(`rl${i}`, c.pts, r.color, 4, 1)}
                  <polygon points={`${tx + Math.cos(a) * 26},${ty + Math.sin(a) * 26} ${tx + Math.cos(a + 2.5) * 20},${ty + Math.sin(a + 2.5) * 20} ${tx + Math.cos(a - 2.5) * 20},${ty + Math.sin(a - 2.5) * 20}`} fill={r.color} filter="url(#lglow)" />
                </g>
              );
            })}

            {plan.pulses.map((pu, i) => {
              if (!Number.isFinite(pu.t) || T < pu.t - 0.3 || T > pu.t + 3) return null;
              const [sx, sy] = P(pu.p[0], pu.p[1]);
              return [0, 1, 2].map((k) => {
                const ph = ((T - pu.t) * 0.8 + k / 3 + 3) % 1;
                return <circle key={`p${i}${k}`} cx={sx} cy={sy} r={20 + ph * 180} fill="none" stroke={pu.color} strokeWidth={4} opacity={(1 - ph) * 0.8 * clamp((pu.t + 3 - T) * 2)} />;
              });
            })}

            <rect width={PW} height={PH} fill="url(#llight)" />
          </svg>

          {plan.labels.map((l, i) => {
            const minor = l.kind === "region";
            const op = win(T, l.a, l.b, 0.5) * (l.kind === "country" ? clamp((cam.span - 14) / 6) : minor ? clamp((60 - cam.span) / 10) : 1);
            return bb(l.p[0], l.p[1], <MapLabel text={l.text} kind={l.kind ?? "region"} color={l.color} />, op, `l${i}`);
          })}
          {[
            { n: "SEOUL", p: SEOUL },
            { n: "PYONGYANG", p: PYONG },
            { n: "BUSAN", p: BUSAN },
            ...(T > at("amphibious landing") && T < at("crossed the 38th parallel and moved") ? [{ n: "INCHEON", p: INCHEON }] : []),
          ].map((c) => bb(c.p[0], c.p[1], <MapLabel text={c.n} kind="city" />, citiesOn * (T > at("one Korea") || T < rewindT ? 1 : 0), c.n))}

          {plan.flags.map((f, i) => {
            const { pos, op } = trackAt(f.keys, T);
            return bb(pos[0], pos[1], <Flag kind={f.kind} frame={frame} label={f.label?.(T)} />, op * flagsOn, `f${i}`);
          })}
          {plan.badges.map((b, i) => bb(b.p[0], b.p[1], <Flag kind={b.kind} frame={frame} />, win(T, b.t, plan.badgesOff, 0.3), `b${i}`))}
        </div>
      </AbsoluteFill>

      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 197.3) % width;
        const y = (height - ((T * (12 + (i % 5) * 5) + i * 131) % (height + 40))) % height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: "#9fd8ff", opacity: 0.1 + (i % 4) * 0.05 }} />;
      })}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 62% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(3,5,10,0.92) 0%, rgba(3,5,10,0.7) 32%, rgba(3,5,10,0) 50%)" }} />
      {rewindFx > 0 && <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0 2px, transparent 2px 5px)", opacity: rewindFx * (0.5 + 0.5 * Math.abs(Math.sin(frame * 1.7))) }} />}

      {hud && <LongHud T={T} plan={plan} />}
    </AbsoluteFill>
  );
};

// ---- HUD ----------------------------------------------------------------------------

type Block = { t: number; big: string | ((T: number) => string); accent?: string; lines?: [string, number, string?][] };

const LongHud: React.FC<{ T: number; plan: Plan }> = ({ T, plan }) => {
  const { at, word, missing } = plan;
  const { rewindT, ctaT } = plan.t;
  const w = (p: string, x: string, last = false) => word(p, x, last);
  const R = "#ff3b4a", B = "#4da3ff", G = "#ffd23f", H = "#9fd8ff", O = "#ff8a3d";
  const blocks: Block[] = [
    { t: 0, big: "IMAGINE…", accent: H, lines: [["An army crosses your border", at("neighboring"), H]] },
    { t: at("three days"), big: "3 DAYS", lines: [["The capital falls", at("three days", 1)]] },
    { t: at("another superpower"), big: "ESCALATION", accent: O, lines: [["A superpower enters…", at("another superpower", 0.4), B], ["…then another", at("Then another."), O]] },
    { t: at("confrontation involving"), big: "COLD WAR CLASH", accent: H, lines: [["United States", w("confrontation involving", "United"), B], ["China", w("confrontation involving", "China"), O], ["Soviet Union", w("confrontation involving", "Soviet"), R], ["United Nations", w("confrontation involving", "Nations"), H]] },
    { t: at("This was the Korean War"), big: "THE KOREAN WAR", accent: R, lines: [["1950 – 1953", at("This was the Korean War", 0.8), H]] },
    { t: at("how did North Korea"), big: "WHY?", accent: H, lines: [["How did the two Koreas go to war?", at("how did North Korea", 0.4), H], ["…and why are they still technically at war?", at("70 years"), R]] },
    { t: rewindT, big: (T: number) => `${Math.round(lerp(2023, 1910, ease(clamp((T - rewindT) / Math.max(1, at("one Korea") - rewindT - 0.3)))))}`, accent: H, lines: [["Rewinding…", rewindT + 0.3, H]] },
    { t: at("one Korea"), big: "ONE KOREA", accent: H, lines: [["Before the split, one country", at("one Korea", 1), H]] },
    { t: at("Japanese rule"), big: "1910 – 1945", accent: "#e0556a", lines: [["Korea under Japanese rule", at("Japanese rule", 0.4), "#e0556a"]] },
    { t: at("World War II ended"), big: "1945", accent: G, lines: [["World War II ends", at("World War II ended", 1), G], ["Japan surrenders · Korea liberated", at("Korea was liberated"), G]] },
    { t: at("came the Cold War"), big: "COLD WAR", accent: H, lines: [["US & USSR divide Korea into two zones", at("divided the Korean", 0.5), H], ["Dividing line: the 38th parallel", at("dividing line"), "#ffffff"]] },
    { t: at("Soviet Union supported"), big: "TWO SYSTEMS", accent: H, lines: [["USSR backs a communist government in the north", at("Soviet Union supported", 0.4), R], ["US backs a separate government in the south", at("United States supported a separate"), B]] },
    { t: at("in 1948"), big: "1948", accent: G, lines: [["North: DPRK · Kim Il Sung", at("In the north was", 0.5), R], ["South: ROK · Syngman Rhee", at("In the south was", 0.5), B], ["Both claim all of Korea", at("claimed to represent"), G]] },
    { t: at("The stage was set"), big: "THE STAGE IS SET", accent: G },
    { t: at("Now imagine the map"), big: "THE 38TH PARALLEL", accent: H, lines: [["North Korea — top", at("North Korea is at the top"), R], ["South Korea — bottom", at("South Korea is at the bottom"), B]] },
    { t: at("Then comes the date"), big: "JUNE 25, 1950", accent: R },
    { t: at("North Korean forces crossed"), big: "INVASION", lines: [["North Korean forces cross the 38th parallel", at("North Korean forces crossed", 0.5)], ["South Korean forces retreat", at("caught off guard"), B]] },
    { t: at("first major target"), big: "SEOUL", lines: [["Jun 28, 1950: Seoul falls", at("Seoul fell")], ["The South is pushed south", at("pushed farther"), B]] },
    { t: at("one huge calculation"), big: "MISCALCULATION", accent: G, lines: [["North Korea expected a limited war", at("remain limited"), G], ["The US and UN enter", at("Instead, the United States"), B]] },
    { t: at("international crisis"), big: "UNITED NATIONS", accent: B, lines: [["Security Council: stop and withdraw", at("Security Council"), B], ["UN authorizes military help for the South", at("authorized"), B], ["US: the main contributor", at("main contributor"), B]] },
    { t: at("MacArthur was placed"), big: "MACARTHUR", accent: B, lines: [["Gen. Douglas MacArthur commands UN forces", at("MacArthur was placed", 0.5), B]] },
    { t: at("extremely difficult"), big: "RETREAT", lines: [["North Korean troops push south", at("continued pushing south")]] },
    { t: at("By August 1950"), big: "AUG 1950", accent: B, lines: [["The Pusan Perimeter", at("Pusan Perimeter"), B], ["UN holds only a small corner", at("relatively small"), G]] },
    { t: at("risky move"), big: "A RISKY MOVE", accent: G },
    { t: at("amphibious landing"), big: "INCHEON", accent: B, lines: [["Surprise amphibious landing", at("amphibious landing", 0.5), B], ["Sep 15, 1950", at("September 15"), B]] },
    { t: at("The plan worked"), big: "THE PLAN WORKS", accent: B, lines: [["North Korean supply lines cut", at("supply lines"), G], ["Sep 1950: Seoul recaptured", at("Seoul had been recaptured"), B]] },
    { t: at("changed direction"), big: "TURNING POINT", accent: B, lines: [["UN crosses the 38th parallel", at("crossed the 38th parallel and moved"), B], ["Oct 1950: Pyongyang captured", at("captured Pyongyang"), B]] },
    { t: at("no longer simply"), big: "INTO THE NORTH", accent: B, lines: [["Approaching the Chinese border", at("closer and closer"), O]] },
    { t: at("Look at the map again"), big: "THE YALU RIVER", accent: H, lines: [["The China – North Korea border", at("Yalu River"), H]] },
    { t: at("Chinese forces entered"), big: "CHINA ENTERS", accent: O, lines: [["Late 1950: Chinese forces cross the Yalu", at("Chinese forces entered", 0.5), O], ["UN forces pushed back", at("UN forces were pushed back"), O]] },
    { t: at("captured by communist"), big: "JAN 1951", lines: [["Seoul falls again", at("captured by communist", 0.8)], ["Mar 1951: UN retakes Seoul", at("retook Seoul"), B]] },
    { t: at("moved north again"), big: "BACK & FORTH", accent: G, lines: [["North…", at("moved north again"), B], ["…south…", at("And then south again"), R], ["…north again", at("And then north again"), B]] },
    { t: at("stabilized roughly"), big: "MID-1951", accent: G, lines: [["Front stabilizes near the 38th parallel", at("stabilized roughly", 0.6), G]] },
    { t: at("strangest phase"), big: "STALEMATE", accent: G, lines: [["No decisive victory", at("neither side"), G]] },
    { t: at("For the next two years"), big: "1951 – 1953", accent: G, lines: [["Armistice talks begin (Jul 1951)", at("negotiations for an armistice"), G], ["Key dispute: prisoners of war", at("prisoners of war"), G]] },
    { t: at("soldiers continued"), big: "THE FRONT", accent: R, lines: [["Artillery", at("Artillery.")], ["Air attacks", at("Air attacks")], ["Infantry battles", at("Infantry battles")]] },
    { t: at("bloodiest"), big: "MILLIONS", accent: R, lines: [["One of the bloodiest wars of the early Cold War", at("bloodiest", 0.5)], ["Millions dead, including civilians", at("Millions of people")], ["The peninsula devastated", at("devastated")]] },
    { t: at("But eventually, after years"), big: "AGREEMENT", accent: H },
    { t: at("July 27, 1953"), big: "JUL 27, 1953", accent: H, lines: [["Armistice signed", at("armistice was signed"), H], ["The fighting stops", at("fighting stopped"), H], ["New boundary near the 38th parallel", at("new boundary"), H], ["Demilitarized Zone (DMZ) created", at("Demilitarized Zone"), H]] },
    { t: at("shocking part"), big: "BUT…", accent: R },
    { t: at("not a peace treaty"), big: "NO PEACE TREATY", accent: R, lines: [["An armistice only stops the fighting", at("It was an armistice")], ["No permanent peace treaty — ever", at("never signed a permanent")]] },
    { t: at("remained divided"), big: "DIVIDED", accent: H, lines: [["North: communist state", at("communist state"), R], ["South: aligned with the US & allies", at("aligned with"), B], ["DMZ: one of the world's most militarized borders", at("heavily militarized"), H]] },
    { t: at("So what started"), big: "RECAP", accent: G, lines: [["1950 · North invades", at("North Korea invaded South Korea"), R], ["UN & US intervene", at("intervened"), B], ["UN pushes north · China enters", at("China entered the war."), O], ["1953 · the guns fall silent", at("went silent"), H]] },
    { t: at("never received a final peace"), big: "STILL DIVIDED", accent: R, lines: [["Two countries", at("Two countries"), H], ["One peninsula", at("One peninsula"), H], ["One guarded border", at("heavily guarded border"), H]] },
    { t: plan.t.lastTitleT, big: "THE KOREAN WAR", accent: R, lines: [["1950 – 1953 · never formally ended", plan.t.lastTitleT + 0.8, H]] },
    { t: ctaT, big: "SUBSCRIBE", accent: R, lines: [["For more history on the map", ctaT + 0.4, H]] },
  ].filter((b) => Number.isFinite(b.t)) as Block[];

  let cur = blocks[0];
  for (const b of blocks) if (T >= b.t && b.t >= cur.t) cur = b;
  const big = typeof cur.big === "function" ? cur.big(T) : cur.big;
  const lines = (cur.lines ?? []).filter(([, t]) => Number.isFinite(t)).map(([text, t, color]) => ({ text, at: t, color }));

  return (
    <>
      <div style={{ position: "absolute", left: 60, top: 50, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontSize: 22, fontWeight: 800, letterSpacing: 4, color: H }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: R, opacity: Math.sin(T * 6) > 0 ? 1 : 0.3 }} />
        THE KOREAN WAR · HOW NORTH KOREA INVADED THE SOUTH
      </div>
      <div style={{ position: "absolute", left: 0, top: -20, width: 820, height: 600 }}>
        <HudBlock key={cur.t} big={big} lines={lines} T={T} start={cur.t} accent={cur.accent ?? R} />
      </div>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 820, height: 400 }}>
        <Legend
          T={T}
          note="Front lines approximate · no post-1953 border shown before the armistice"
          items={[
            { color: "rgba(255,59,74,0.6)", text: "North Korea & allies (approx.)", at: at("divided the Korean", 1) },
            { color: "rgba(77,163,255,0.6)", text: "South Korea & UN (approx.)", at: at("divided the Korean", 1.2) },
            { color: "#ffffff", hatch: true, text: "38th parallel: 1945 division line", at: at("dividing line", 0.6) },
            { color: H, hatch: true, text: "DMZ / armistice line, 1953", at: at("Demilitarized Zone", 1) },
          ]}
        />
      </div>
      <SubscribeNudge T={T} until={ctaT} top={40} />
      {T >= ctaT && (
        <div style={{ position: "absolute", left: 820, right: 0, top: 0, bottom: 0 }}>
          <CtaCard T={T} top={640} likeT={at("like, share", 0.3)} shareT={w("like, share", "share")} subT={w("like, share", "subscribe")} />
        </div>
      )}
      {missing.length > 0 && <div style={{ position: "absolute", right: 20, bottom: 20, color: "#f00", fontFamily: BODY, fontSize: 22, background: "#000", padding: 8 }}>MISSING CUES: {missing.join(" | ")}</div>}
    </>
  );
};

export const KoreaLong: React.FC<{ timing: Timing }> = ({ timing }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const plan = React.useMemo(() => buildPlan(timing.sections, timing.durationSec), [timing]);
  const { at } = plan;
  const cue = (t: number, sfx: string, vol = 0.3, len = 45) =>
    Number.isFinite(t) ? (
      <Sequence key={`${sfx}${t.toFixed(2)}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
        <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
      </Sequence>
    ) : null;
  const { ctaT } = plan.t;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {cue(0, "riser", 0.18, 60)}
      {cue(plan.t.hookCrossT, "whoosh", 0.25)}
      {cue(plan.t.hookSeoulT, "boom", 0.3, 60)}
      {cue(at("This was the Korean War"), "boom", 0.3, 60)}
      {cue(plan.t.rewindT, "riser", 0.2, 60)}
      {cue(at("dividing line"), "whoosh", 0.22)}
      {cue(plan.t.invT, "boom", 0.3, 60)}
      {cue(plan.t.seoulFellT, "whoosh", 0.22)}
      {cue(at("American troops"), "whoosh", 0.22)}
      {cue(at("amphibious landing"), "whoosh", 0.25)}
      {cue(at("captured Pyongyang"), "whoosh", 0.22)}
      {cue(at("Chinese forces entered"), "boom", 0.3, 60)}
      {cue(at("July 27, 1953"), "ding", 0.3)}
      {cue(at("not a peace treaty"), "boom", 0.3, 60)}
      {nudgeTimes(ctaT).map((t) => cue(t + 1.1, "ding", 0.25))}
      {cue(plan.word("like, share", "subscribe") + 1.2, "ding", 0.3)}
      <KoreaLongScene timing={timing} T={T} frame={frame} />
    </AbsoluteFill>
  );
};
