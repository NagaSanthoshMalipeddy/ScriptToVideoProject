import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Section, Timing } from "../types";
import { geomPath, makeProjector, type Region } from "../ukraine/GeoMap";
import { BODY } from "../airace/fonts";
import { Billboard, cut, HudBlock, Legend, MapLabel } from "../warmap/WarMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Flag, type FlagKind } from "../korea/KoreaWar";
import {
  AIR_STRIKES, CHEM_SITES, GULF_LANE, IQ_MAIN, IQ_ROUTES, IR_COUNTER, IRANIAN_HELD, IRAQI_HELD, IRN, IRQ, OIL_SITES, OTHERS, SHATT, SWING_IRAN, SWING_IRAQ, type Pt,
} from "./data";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const lerpPt = (a: Pt, b: Pt, p: number): Pt => [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
const ease = Easing.inOut(Easing.cubic);
const win = (T: number, a: number, b: number, f = 0.5) => (Number.isFinite(a) && Number.isFinite(b) ? clamp(Math.min((T - a) / f, (b - T) / f)) : 0);

const REF_LAT = 32;
const COS = Math.cos((REF_LAT * Math.PI) / 180);
const C = {
  ocean: "#05080f",
  land: "#111722",
  landEdge: "#27324a",
  side: "#020306",
  irn: "#0f2a1c",
  irnEdge: "#34c77b",
  irq: "#2a1216",
  irqEdge: "#ff4d5e",
  red: "#ff3b4a",
  green: "#34c77b",
  hud: "#9fd8ff",
  gold: "#ffd23f",
  blue: "#4da3ff",
  water: "#4da3ff",
};

const TIGRIS: Pt[] = [[44.4, 33.3], [45.2, 32.9], [45.83, 32.5], [46.6, 32.0], [47.15, 31.84], [47.43, 31.0]];
const EUPHRATES: Pt[] = [[44.3, 32.0], [45.3, 31.4], [46.26, 31.04], [47.0, 30.95], [47.43, 31.0]];

type View = { lon: number; lat: number; span: number };
const V = {
  open: { lon: 47.5, lat: 31.5, span: 62 },
  both: { lon: 48.5, lat: 32.5, span: 38 },
  iraq: { lon: 44.6, lat: 33.0, span: 24 },
  shatt: { lon: 48.1, lat: 30.5, span: 8 },
  tehranW: { lon: 50.0, lat: 33.5, span: 26 },
  tehran: { lon: 51.4, lat: 35.2, span: 16 },
  baghdad: { lon: 44.6, lat: 33.0, span: 16 },
  border: { lon: 47.2, lat: 32.2, span: 18 },
  west: { lon: 46.6, lat: 32.8, span: 20 },
  air: { lon: 48.0, lat: 33.6, span: 30 },
  cross: { lon: 47.9, lat: 30.7, span: 9 },
  khuz: { lon: 47.9, lat: 31.5, span: 14 },
  counter: { lon: 48.3, lat: 31.1, span: 12 },
  basra: { lon: 47.9, lat: 30.7, span: 12 },
  attr: { lon: 47.8, lat: 31.3, span: 16 },
  oil: { lon: 49.0, lat: 30.3, span: 18 },
  gulf: { lon: 51.5, lat: 28.3, span: 24 },
  gulfW: { lon: 52.0, lat: 28.6, span: 34 },
  halabja: { lon: 46.2, lat: 34.6, span: 13 },
  un: { lon: 48.0, lat: 32.6, span: 40 },
  end: { lon: 48.3, lat: 32.0, span: 60 },
} satisfies Record<string, View>;

// ---- cues ---------------------------------------------------------------------------

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const makeCues = (secs: Section[]) => {
  const missing: string[] = [];
  // which: 0 = first match, -1 = last match, n = nth match
  const find = (phrase: string, which = 0) => {
    const p = phrase.toLowerCase();
    const list = secs.map((s, i) => (s.text.toLowerCase().includes(p) ? i : -1)).filter((i) => i >= 0);
    if (!list.length) missing.push(phrase);
    if (!list.length) return -1;
    return which < 0 ? list[list.length - 1] : list[Math.min(which, list.length - 1)];
  };
  const at = (phrase: string, off = 0, which = 0) => {
    const i = find(phrase, which);
    return i < 0 ? NaN : secs[i].start + off;
  };
  const word = (phrase: string, w: string, which = 0) => {
    const i = find(phrase, which);
    if (i < 0) return NaN;
    const x = secs[i].words.find((z) => norm(z.word) === norm(w)) ?? secs[i].words.find((z) => norm(z.word).startsWith(norm(w)));
    return x ? x.start : secs[i].start;
  };
  const end = (phrase: string, which = 0) => {
    const i = find(phrase, which);
    return i < 0 ? NaN : secs[Math.min(i + 1, secs.length - 1)].start;
  };
  return { at, word, end, missing };
};

// ---- plan types ---------------------------------------------------------------------

type K = { t: number; p: Pt | Pt[]; op?: number };
type FlagTrack = { kind: FlagKind | ((T: number) => FlagKind); label?: (T: number) => string | undefined; keys: K[] };
type Route = { pts: Pt[]; color: string; a: number; b: number; fade: number; thin?: boolean };
type Pulse = { p: Pt; t: number; color: string };
type Label = { text: string; p: Pt; a: number; b: number; color?: string; kind?: "country" | "city" | "region" };
type Block = { t: number; big: string | ((T: number) => string); accent?: string; lines?: [string, number, string?][] };
type Follow = { a: number; b: number; path: Pt[]; from: View; to: View };

export type Plan = {
  keys: [number, View][];
  follow: Follow[];
  flags: FlagTrack[];
  routes: Route[];
  pulses: Pulse[];
  labels: Label[];
  cityText: (name: string, T: number) => string | undefined;
  iqHeld: (T: number) => number;
  pockets: ((T: number) => number)[];
  rivers: (T: number) => number;
  gulf: (T: number) => number;
  oil: (T: number) => number;
  chem: (T: number) => number;
  borderGlow: (T: number) => number;
  flashes: number[];
  blocks: Block[];
  legend: { color: string; hatch?: boolean; text: string; at: number }[];
  ctaT: number;
  likeT: number;
  shareT: number;
  subT: number;
  sfx: [number, string, number, number?][];
  missing: string[];
  topLine: string;
};

const sortKeys = (raw: [number, View][]) => {
  const keys: [number, View][] = [];
  for (const [t, v] of raw.filter(([t]) => Number.isFinite(t))) keys.push([keys.length ? Math.max(t, keys[keys.length - 1][0] + 0.05) : t, v]);
  return keys;
};
const R = C.red, G = C.green, H = C.hud, Y = C.gold, B = C.blue;
const yearTicker = (a: number, b: number, y0: number, y1: number) => (T: number) => `${Math.round(lerp(y0, y1, ease(clamp((T - a) / Math.max(0.5, b - a)))))}`;
const irKind = (swapT: number) => (T: number): FlagKind => (T < swapT ? "IR_OLD" : "IR");

// ---- SHORT plan ---------------------------------------------------------------------

export const buildShortPlan = (secs: Section[], total: number): Plan => {
  const { at, word, missing } = makeCues(secs);
  const invasion = word("September 22", "invasion");
  const followA = at("Iraqi flag moves across");
  const followB = at("did not lead", -0.3);
  const shift = at("shifted back and forth");
  const shiftEnd = at("Both countries attacked");
  const ctaT = at("like, share");
  const revSwap = word("Islamic Revolution", "Revolution") + 0.6;

  return {
    missing,
    topLine: "IRAN – IRAQ WAR · EXPLAINED",
    keys: sortKeys([
      [0, V.open],
      [at("It happened between"), V.both],
      [at("Islamic Revolution"), V.tehran],
      [word("Islamic Revolution", "Saddam"), V.baghdad],
      [at("September 22"), V.border],
      [at("Watch the map"), V.border],
      [followB + 0.3, V.khuz],
      [at("Iran reorganized"), V.counter],
      [at("instead of ending"), V.attr],
      [shiftEnd, V.gulf],
      [at("chemical weapons"), V.halabja],
      [at("final phase"), V.attr],
      [at("UN-backed ceasefire"), V.un],
      [at("August 20, 1988"), V.both],
      [at("story doesn't end"), V.end],
      [total + 1, V.end],
    ]),
    follow: [{ a: followA, b: followB, path: IQ_MAIN, from: V.border, to: V.khuz }],
    flags: [
      {
        kind: irKind(revSwap),
        label: (T) => (T < at("The year was") ? "IRAN" : undefined),
        keys: [
          { t: 0, p: [50.4, 32.2], op: 0 },
          { t: at("It happened between"), p: [50.4, 32.2], op: 1 },
          { t: at("Iran reorganized"), p: [50.4, 32.2], op: 1 },
          { t: at("Iran reorganized", 1.5), p: IR_COUNTER[0].pts[0], op: 1 },
          { t: at("By 1982", 2), p: IR_COUNTER[0].pts, op: 1 },
          { t: shift + 1.5, p: [48.4, 30.05], op: 1 },
          { t: shiftEnd, p: [48.4, 30.5], op: 1 },
          { t: at("final phase", 2), p: [48.9, 31.2], op: 1 },
        ],
      },
      {
        kind: "IQ",
        label: (T) => (T < at("The year was") ? "IRAQ" : undefined),
        keys: [
          { t: 0, p: [45.0, 32.2], op: 0 },
          { t: at("It happened between"), p: [45.0, 32.2], op: 1 },
          { t: at("Watch the map"), p: IQ_MAIN[0], op: 1 },
          { t: followA, p: IQ_MAIN[0], op: 1 },
          { t: followB, p: IQ_MAIN, op: 1 },
          { t: at("Iran reorganized"), p: IQ_MAIN[IQ_MAIN.length - 1], op: 1 },
          { t: at("By 1982", 2), p: [47.5, 30.95], op: 1 },
          { t: shift + 1.5, p: [48.1, 31.3], op: 1 },
          { t: shiftEnd, p: [47.4, 30.9], op: 1 },
          { t: at("final phase", 2), p: [46.9, 31.8], op: 1 },
        ],
      },
      {
        kind: "UN",
        label: (T) => (T < at("August 20, 1988") ? "UN · RES. 598" : undefined),
        keys: [
          { t: at("UN-backed ceasefire"), p: [48.0, 33.4], op: 0 },
          { t: at("UN-backed ceasefire", 0.6), p: [48.0, 33.4], op: 1 },
          { t: at("Eight years."), p: [48.0, 33.4], op: 1 },
          { t: at("Eight years.", 0.8), p: [48.0, 33.4], op: 0 },
        ],
      },
    ],
    routes: [
      ...AIR_STRIKES.map((p, i) => ({ pts: p, color: C.gold, a: invasion + 0.3 + i * 0.3, b: invasion + 2.2 + i * 0.3, fade: at("Watch the map", 1), thin: true })),
      { pts: IQ_MAIN, color: R, a: followA, b: followB, fade: at("By 1982", 2) },
      ...IQ_ROUTES.map((r, i) => ({ pts: r.pts, color: R, a: followA + 1 + i * 0.4, b: followA + 3.5 + i * 0.4, fade: at("By 1982", 2) })),
      ...IR_COUNTER.map((r, i) => ({ pts: r.pts, color: G, a: at("Iran reorganized", 0.3 + i * 0.4), b: at("By 1982", 1), fade: at("instead of ending", 2) })),
      ...SWING_IRAQ.map((p, i) => ({ pts: p, color: G, a: shift + i * 0.3, b: shift + 1.2 + i * 0.3, fade: shift + 3.5 })),
      ...SWING_IRAN.map((p, i) => ({ pts: p, color: R, a: shift + 1.5 + i * 0.3, b: shift + 2.7 + i * 0.3, fade: shift + 4.5 })),
    ],
    pulses: [
      { p: [51.39, 35.69], t: at("Islamic Revolution", 0.3), color: G },
      { p: [44.37, 33.31], t: word("Islamic Revolution", "Saddam"), color: R },
      { p: [48.18, 30.44], t: followB - 0.8, color: R },
      { p: [48.18, 30.44], t: at("By 1982", 0.8), color: G },
      { p: [45.98, 35.18], t: at("chemical weapons", 1.5), color: Y },
    ],
    labels: [
      { text: "SHATT AL-ARAB", p: [49.2, 30.0], a: at("Watch the map"), b: at("did not lead"), color: H, kind: "region" },
      { text: "PERSIAN GULF", p: [51.0, 27.3], a: shiftEnd, b: at("chemical weapons", 0.5), color: H, kind: "region" },
      { text: "STRAIT OF HORMUZ", p: [56.3, 25.9], a: shiftEnd, b: at("chemical weapons", 0.5), color: H, kind: "region" },
      { text: "MAJNOON", p: [47.1, 31.4], a: shift + 0.6, b: at("final phase", 1.5), color: "#9ff0c4", kind: "region" },
      { text: "AL-FAW", p: [48.9, 29.85], a: shift + 1.2, b: at("final phase", 2), color: "#9ff0c4", kind: "region" },
      { text: "HALABJA · 1988", p: [45.98, 35.35], a: at("chemical weapons"), b: at("final phase", 0.5), color: Y, kind: "region" },
      { text: "PRE-WAR BORDER", p: [46.2, 33.7], a: at("finally over"), b: at("story doesn't end"), color: H, kind: "region" },
    ],
    cityText: (name, T) => {
      if (name === "TEHRAN" && T > at("Islamic Revolution") && T < word("Islamic Revolution", "Saddam")) return "TEHRAN · 1979 REVOLUTION";
      if (name === "BAGHDAD" && T > word("Islamic Revolution", "Saddam") && T < at("September 22")) return "BAGHDAD · SADDAM HUSSEIN";
      return undefined;
    },
    iqHeld: (T) => win(T, followA + 1.5, at("By 1982", 2.5), 1.2),
    pockets: [(T) => win(T, shift + 0.6, at("final phase", 1.5), 0.6), (T) => win(T, shift + 1.2, at("final phase", 2), 0.6)],
    rivers: (T) => win(T, at("Watch the map"), at("did not lead"), 0.6),
    gulf: (T) => win(T, shiftEnd, at("chemical weapons", 0.5), 0.8),
    oil: (T) => win(T, shiftEnd, at("chemical weapons", 0.5), 0.8),
    chem: (T) => win(T, at("chemical weapons"), at("final phase", 0.5), 0.6),
    borderGlow: (T) => win(T, at("finally over"), at("story doesn't end", 1), 0.8),
    flashes: [invasion],
    blocks: [
      { t: 0, big: "8 YEARS?", accent: H, lines: [["Two powerful neighbours at war", 1.6, H]] },
      { t: at("It happened between"), big: "IRAN VS IRAQ", accent: R },
      { t: at("The year was"), big: "1980", accent: R },
      { t: at("Islamic Revolution"), big: "1979", accent: G, lines: [["Iran: the Islamic Revolution", at("Islamic Revolution", 0.4), G], ["Saddam Hussein sees an opportunity", word("Islamic Revolution", "Saddam"), R]] },
      { t: at("September 22"), big: "SEP 22, 1980", accent: R, lines: [["Iraq invades Iran", invasion]] },
      { t: at("Watch the map"), big: "THE INVASION", accent: R, lines: [["Iraqi forces cross the border", followA], ["Attacks across western Iran", word("Iraqi flag moves across", "several")]] },
      { t: at("did not lead"), big: "NO QUICK WIN", accent: Y, lines: [["Oct 1980: Khorramshahr falls", at("did not lead", 0.6)]] },
      { t: at("Iran reorganized"), big: "PUSHBACK", accent: G, lines: [["Iranian counteroffensives", at("Iran reorganized", 0.5), G]] },
      { t: at("By 1982"), big: "1982", accent: G, lines: [["May 1982: Khorramshahr retaken", at("By 1982", 1), G], ["Iraq driven out of most of Iran", at("By 1982", 3), G]] },
      { t: at("instead of ending"), big: "WAR GOES ON", accent: Y },
      { t: shift, big: yearTicker(shift, shiftEnd - 0.3, 1982, 1988), accent: Y, lines: [["1984: Iran takes Majnoon", shift + 0.6, G], ["1986: Iran takes al-Faw", shift + 1.2, G]] },
      { t: shiftEnd, big: "TANKER WAR", accent: Y, lines: [["Oil & shipping targeted", word("Both countries attacked", "oil"), Y], ["1984–88: attacks on Gulf shipping", shiftEnd + 2.5, Y]] },
      { t: at("chemical weapons"), big: "CHEMICAL ARMS", accent: Y, lines: [["Used notably by Iraq", word("chemical weapons", "particularly"), Y], ["Halabja, March 1988", at("chemical weapons", 3), Y], ["Confirmed by UN investigators", at("chemical weapons", 4.2), Y]] },
      { t: at("final phase"), big: "1988", accent: B, lines: [["Iraq retakes al-Faw & Majnoon", at("final phase", 0.6), R]] },
      { t: at("UN-backed ceasefire"), big: "CEASEFIRE", accent: B, lines: [["UN Resolution 598", at("UN-backed ceasefire", 0.5), B], ["Accepted by both sides", at("UN-backed ceasefire", 3), B]] },
      { t: at("August 20, 1988"), big: "AUG 20, 1988", accent: H, lines: [["The ceasefire takes effect", at("August 20, 1988", 0.8), H], ["Borders back to pre-war lines", at("finally over"), H]] },
      { t: at("Eight years."), big: "8 YEARS", accent: Y, lines: [["Hundreds of thousands killed", at("Hundreds of thousands"), R], ["No clear battlefield victory", at("no clear battlefield"), Y]] },
      { t: at("story doesn't end"), big: "BUT…", accent: R },
      { t: at("changed the Middle East"), big: "MIDDLE EAST", accent: H, lines: [["Changed by this war", at("changed the Middle East", 0.8), H]] },
      { t: ctaT, big: "SUBSCRIBE", accent: R, lines: [["For more history on the map", ctaT + 0.4, H]] },
    ],
    legend: [
      { color: "rgba(52,199,123,0.7)", text: "Iran", at: 0.8 },
      { color: "rgba(255,59,74,0.7)", text: "Iraq", at: 0.9 },
      { color: "rgba(255,59,74,0.6)", hatch: true, text: "Iraqi-held areas in Iran, 1980–82 (approx.)", at: followA + 1.5 },
      { color: "rgba(52,199,123,0.6)", hatch: true, text: "Iranian-held areas in Iraq (approx.)", at: shift + 0.6 },
    ],
    ctaT,
    likeT: word("like, share", "like"),
    shareT: word("like, share", "share"),
    subT: word("like, share", "subscribe"),
    sfx: [
      [0.2, "riser", 0.15, 60],
      [invasion, "boom", 0.3, 60],
      [followA, "whoosh", 0.22],
      [at("Iran reorganized"), "whoosh", 0.22],
      [shift, "whoosh", 0.2],
      [shiftEnd, "whoosh", 0.2],
      [at("UN-backed ceasefire"), "ding", 0.25],
      [at("changed the Middle East"), "boom", 0.25, 60],
    ],
  };
};

// ---- LONG plan ----------------------------------------------------------------------

export const buildLongPlan = (secs: Section[], total: number): Plan => {
  const { at, word, missing } = makeCues(secs);
  const invT = at("September 22, 1980.");
  const followA = at("it starts moving east");
  const followB = at("Multiple Iraqi units", 1.8);
  const f2A = at("Iranian flag begins moving west");
  const f2B = at("By 1982, Iranian", -0.3);
  const revSwap = at("monarchy was overthrown", 2.5);
  const y82 = at("1982.");
  const y83 = at("1983.");
  const y84 = at("1984.");
  const y85 = at("1985.");
  const fMoves = at("The front line moves");
  const fBack = at("then moves back");
  const accept = at("Eventually, Iran accepted");
  const ctaT = at("like, share");
  const lastTitle = at("This was the Iran", 0, -1);

  return {
    missing,
    topLine: "THE IRAN – IRAQ WAR · THE 8-YEAR WAR THAT CHANGED THE MIDDLE EAST",
    keys: sortKeys([
      [0, V.open],
      [at("Cities bombed"), V.both],
      [at("Oil facilities attacked"), V.gulf],
      [at("longest and bloodiest"), V.both],
      [at("go back to 1980"), V.open],
      [at("Here is Iraq"), V.iraq],
      [at("directly to its east"), V.both],
      [at("Shatt al-Arab waterway"), V.shatt],
      [at("another major development"), V.tehranW],
      [at("In 1979, Iran experienced"), V.tehran],
      [at("Iraq's leader, Saddam"), V.baghdad],
      [at("Tensions rapidly"), V.border],
      [at("appears on the western side"), V.west],
      [followB + 0.3, V.khuz],
      [at("air strikes"), V.air],
      [at("Initially, Iraq made"), V.khuz],
      [at("Iran began mobilizing"), V.counter],
      [f2B + 0.3, V.khuz],
      [at("crossed into Iraqi territory"), V.basra],
      [at("long war of attrition"), V.attr],
      [at("Oil became extremely"), V.oil],
      [at("into the Persian Gulf"), V.gulf],
      [at("international crisis"), V.gulfW],
      [at("darkest aspects"), V.attr],
      [at("Halabja"), V.halabja],
      [at("late 1980s"), V.both],
      [at("United Nations pushed"), V.un],
      [at("August 20, 1988."), V.border],
      [at("guns finally became silent"), V.both],
      [at("pre-war international border"), V.border],
      [at("changed the Middle East permanently"), V.open],
      [lastTitle, V.both],
      [total + 1, V.end],
    ]),
    follow: [
      { a: followA, b: followB, path: IQ_MAIN, from: V.west, to: V.khuz },
      { a: f2A, b: f2B, path: IR_COUNTER[0].pts, from: V.counter, to: V.khuz },
    ],
    flags: [
      {
        kind: irKind(revSwap),
        label: (T) => (T < at("go back to 1980") ? "IRAN" : undefined),
        keys: [
          { t: 0, p: [50.4, 32.2], op: 0 },
          { t: at("Two neighboring"), p: [50.4, 32.2], op: 1 },
          { t: at("Iran began mobilizing"), p: [50.4, 32.2], op: 1 },
          { t: f2A, p: IR_COUNTER[0].pts[0], op: 1 },
          { t: f2B, p: IR_COUNTER[0].pts, op: 1 },
          { t: at("crossed into Iraqi territory", 2), p: [47.75, 30.62], op: 1 },
          { t: y83, p: [48.2, 30.55], op: 1 },
          { t: y84, p: [47.62, 31.12], op: 1 },
          { t: y85, p: [47.95, 30.9], op: 1 },
          { t: fMoves + 0.8, p: [48.45, 30.02], op: 1 },
          { t: fBack + 0.8, p: [48.3, 30.45], op: 1 },
          { t: accept, p: [48.3, 30.45], op: 1 },
          { t: at("Iraq also accepted"), p: [49.0, 31.25], op: 1 },
        ],
      },
      {
        kind: "IQ",
        label: (T) => (T < at("go back to 1980") ? "IRAQ" : undefined),
        keys: [
          { t: 0, p: [45.0, 32.2], op: 0 },
          { t: at("Two neighboring"), p: [45.0, 32.2], op: 1 },
          { t: at("appears on the western side"), p: [45.0, 32.2], op: 1 },
          { t: at("appears on the western side", 1), p: IQ_MAIN[0], op: 1 },
          { t: followA, p: IQ_MAIN[0], op: 1 },
          { t: followB, p: IQ_MAIN, op: 1 },
          { t: f2A, p: IQ_MAIN[IQ_MAIN.length - 1], op: 1 },
          { t: f2B + 1, p: [47.5, 30.95], op: 1 },
          { t: y83, p: [48.05, 31.3], op: 1 },
          { t: y84, p: [47.3, 31.0], op: 1 },
          { t: y85, p: [47.5, 30.8], op: 1 },
          { t: fBack + 0.8, p: [47.95, 30.35], op: 1 },
          { t: accept, p: [47.95, 30.35], op: 1 },
          { t: at("Iraq also accepted"), p: [46.9, 31.8], op: 1 },
        ],
      },
      {
        kind: "UN",
        label: (T) => (T < at("August 20, 1988.") ? "UN · RES. 598" : undefined),
        keys: [
          { t: at("United Nations pushed"), p: [48.0, 33.4], op: 0 },
          { t: at("United Nations pushed", 0.6), p: [48.0, 33.4], op: 1 },
          { t: at("guns finally became silent"), p: [48.0, 33.4], op: 1 },
          { t: at("guns finally became silent", 0.8), p: [48.0, 33.4], op: 0 },
        ],
      },
    ],
    routes: [
      ...AIR_STRIKES.map((p, i) => ({ pts: p, color: C.gold, a: at("air strikes", 0.2 + i * 0.3), b: at("air strikes", 2.2 + i * 0.3), fade: at("expectation", 1.5), thin: true })),
      { pts: IQ_MAIN, color: R, a: followA, b: followB, fade: f2B + 1.5 },
      ...IQ_ROUTES.map((r, i) => ({ pts: r.pts, color: R, a: at("Multiple Iraqi units", 0.3 + i * 0.4), b: at("Multiple Iraqi units", 2.8 + i * 0.4), fade: f2B + 1.5 })),
      ...IR_COUNTER.map((r, i) => ({ pts: r.pts, color: G, a: f2A + i * 0.4, b: f2B, fade: at("long war of attrition", 1) })),
      { pts: SWING_IRAQ[0], color: G, a: at("crossed into Iraqi territory"), b: at("crossed into Iraqi territory", 2), fade: y83 + 1 },
      { pts: SWING_IRAQ[0], color: G, a: y82, b: y82 + 1.1, fade: y82 + 3 },
      { pts: SWING_IRAN[0], color: R, a: y83, b: y83 + 1.1, fade: y83 + 3 },
      { pts: [[48.05, 31.25], [47.62, 31.12]], color: G, a: y84, b: y84 + 1.1, fade: y84 + 3 },
      { pts: SWING_IRAN[1], color: R, a: y85, b: y85 + 1.1, fade: y85 + 3 },
      { pts: SWING_IRAQ[1], color: G, a: fMoves, b: fMoves + 1.2, fade: fMoves + 3.5 },
      { pts: [[47.7, 30.45], [48.25, 30.15]], color: R, a: fBack, b: fBack + 1.2, fade: fBack + 3.5 },
    ],
    pulses: [
      { p: [51.39, 35.69], t: at("In 1979, Iran experienced", 0.3), color: G },
      { p: [44.37, 33.31], t: at("Iraq's leader, Saddam", 0.3), color: R },
      { p: [48.18, 30.44], t: at("Initially, Iraq made", 0.5), color: R },
      { p: [48.18, 30.44], t: at("By 1982, Iranian", 0.8), color: G },
      { p: [50.32, 29.25], t: at("So oil facilities"), color: Y },
      { p: [45.98, 35.18], t: at("Halabja", 1), color: Y },
    ],
    labels: [
      { text: "SHATT AL-ARAB", p: [49.2, 30.0], a: at("Shatt al-Arab waterway"), b: at("another major development"), color: H, kind: "region" },
      { text: "TIGRIS", p: [46.2, 32.55], a: at("Shatt al-Arab waterway", 1), b: at("another major development"), color: H, kind: "region" },
      { text: "EUPHRATES", p: [45.8, 30.75], a: at("Shatt al-Arab waterway", 1.5), b: at("another major development"), color: H, kind: "region" },
      { text: "PERSIAN GULF", p: [51.0, 27.3], a: at("Oil became extremely"), b: at("darkest aspects"), color: H, kind: "region" },
      { text: "STRAIT OF HORMUZ", p: [56.3, 25.9], a: at("into the Persian Gulf"), b: at("darkest aspects"), color: H, kind: "region" },
      { text: "MAJNOON", p: [47.1, 31.45], a: y84, b: accept, color: "#9ff0c4", kind: "region" },
      { text: "AL-FAW", p: [48.95, 29.8], a: fMoves, b: accept, color: "#9ff0c4", kind: "region" },
      { text: "HALABJA · 1988", p: [45.98, 35.35], a: at("Halabja"), b: at("late 1980s"), color: Y, kind: "region" },
      { text: "PRE-WAR BORDER", p: [46.2, 33.7], a: at("pre-war international border"), b: at("changed the Middle East permanently", 2), color: H, kind: "region" },
    ],
    cityText: (name, T) => {
      if (name === "TEHRAN" && T > at("In 1979, Iran experienced") && T < at("Iraq's leader, Saddam"))
        return T > word("monarchy was overthrown", "Khomeini") ? "TEHRAN · KHOMEINI" : "TEHRAN · 1979 REVOLUTION";
      if (name === "BAGHDAD" && T > at("Iraq's leader, Saddam") && T < invT) return "BAGHDAD · SADDAM HUSSEIN";
      return undefined;
    },
    iqHeld: (T) => win(T, at("Initially, Iraq made", -0.5), at("By 1982, Iranian", 2.5), 1.2),
    pockets: [(T) => win(T, y84, accept, 0.8), (T) => win(T, fMoves, accept, 0.8)],
    rivers: (T) => win(T, at("Shatt al-Arab waterway"), at("another major development"), 0.8),
    gulf: (T) => win(T, at("Oil became extremely"), at("darkest aspects"), 1),
    oil: (T) => Math.max(win(T, at("Oil facilities attacked"), at("longest and bloodiest"), 0.5), win(T, at("Oil became extremely"), at("darkest aspects"), 1)),
    chem: (T) => win(T, at("darkest aspects"), at("late 1980s"), 0.8),
    borderGlow: (T) => win(T, at("pre-war international border"), at("changed the Middle East permanently", 2), 0.8),
    flashes: [invT, at("Cities bombed")],
    blocks: [
      { t: 0, big: "IMAGINE…", accent: H },
      { t: at("eight years."), big: "8 YEARS", accent: R },
      { t: at("Two neighboring"), big: "8 YEARS", accent: R, lines: [["Two neighbouring countries", at("Two neighboring", 0.2), H], ["Millions affected", at("Millions of people"), H], ["Cities bombed", at("Cities bombed"), R], ["Oil facilities attacked", at("Oil facilities attacked"), Y]] },
      { t: at("longest and bloodiest"), big: "20TH CENTURY", accent: R, lines: [["One of its longest, bloodiest conventional wars", at("longest and bloodiest", 1), R]] },
      { t: at("This was the Iran"), big: "IRAN–IRAQ WAR", accent: R, lines: [["1980 – 1988", at("This was the Iran", 0.8), H]] },
      { t: at("why did Iraq invade"), big: "WHY?", accent: H, lines: [["Why did Iraq invade?", at("why did Iraq invade", 0.2), H], ["Why 8 years?", at("continue for eight years"), H], ["How did it end?", at("how did it finally end"), H]] },
      { t: at("go back to 1980"), big: "1980", accent: R },
      { t: at("understand the war"), big: "THE BORDER", accent: H, lines: [["Iraq", at("Here is Iraq"), R], ["Iran — directly to the east", at("directly to its east", 1), G], ["A long, strategic border", at("shared a long"), H]] },
      { t: at("Shatt al-Arab waterway"), big: "SHATT AL-ARAB", accent: H, lines: [["Where the Tigris & Euphrates meet", at("Shatt al-Arab waterway", 2), H], ["A long-disputed border waterway", at("disputed for years"), Y]] },
      { t: at("another major development"), big: "1979", accent: G, lines: [["Islamic Revolution in Iran", at("In 1979, Iran experienced"), G], ["Monarchy overthrown", at("monarchy was overthrown"), G], ["Islamic Republic under Khomeini", word("monarchy was overthrown", "Khomeini"), G]] },
      { t: at("Iraq's leader, Saddam"), big: "SADDAM HUSSEIN", accent: R, lines: [["Sees Iran as politically unsettled", at("Iraq's leader, Saddam", 1)], ["An opportunity for Iraq", at("strengthen Iraq")], ["Tensions rise", at("Tensions rapidly"), Y]] },
      { t: at("Iraq made its move"), big: "IRAQ MOVES", accent: R },
      { t: invT, big: "SEP 22, 1980", accent: R, lines: [["Iraq invades Iran", at("large-scale invasion")]] },
      { t: at("Multiple Iraqi units"), big: "INVASION", accent: R, lines: [["Multiple units cross the border", at("Multiple Iraqi units", 0.2)], ["Air strikes on Iranian airfields & infrastructure", at("air strikes"), Y]] },
      { t: at("The expectation was"), big: "THE GAMBLE", accent: Y, lines: [["Iraq expects a weak, divided Iran", at("The expectation was", 0.5), Y]] },
      { t: at("Initially, Iraq made"), big: "EARLY GAINS", accent: R, lines: [["Oct 1980: Khorramshahr falls", at("Initially, Iraq made", 1)], ["Iraqi-held areas in the west (approx.)", at("Initially, Iraq made", 2)]] },
      { t: at("did not go according to plan"), big: "IRAN RALLIES", accent: G, lines: [["Military & revolutionary forces mobilize", at("Iran began mobilizing"), G], ["Iran fights back", at("Iran fought back"), G]] },
      { t: at("Iraqi advance slowed"), big: "STALLED", accent: Y, lines: [["The advance slows…", at("Iraqi advance slowed", 0.2), Y], ["…then stops", at("Then it stopped"), Y]] },
      { t: f2A, big: "FIGHTING BACK", accent: G, lines: [["Iranian counteroffensives", at("Iran launched counteroffensives"), G]] },
      { t: at("By 1982, Iranian"), big: "1982", accent: G, lines: [["May 1982: Khorramshahr retaken", at("By 1982, Iranian", 1.2), G], ["Iraq pushed out of most of Iran", at("By 1982, Iranian", 3), G]] },
      { t: at("opportunity to end the conflict"), big: "PEACE?", accent: H, lines: [["Iraq could have ended it here", at("opportunity to end the conflict", 0.5), H], ["But the war continued", at("But the war continued"), Y], ["Iran's conditions for peace", at("Iran demanded"), G]] },
      { t: at("crossed into Iraqi territory"), big: "INTO IRAQ", accent: G, lines: [["Jul 1982: Iran attacks toward Basra", at("crossed into Iraqi territory", 0.8), G]] },
      { t: at("Instead of a short invasion"), big: "ATTRITION", accent: Y, lines: [["Both sides try to exhaust the other", at("exhaust the other"), Y], ["No decisive victory", at("neither side could easily"), Y]] },
      { t: y82, big: "1982", accent: Y, lines: [["Iran advances on Basra", y82 + 0.2, G]] },
      { t: y83, big: "1983", accent: Y, lines: [["Costly offensives, little change", y83 + 0.2, Y]] },
      { t: y84, big: "1984", accent: Y, lines: [["Iran takes the Majnoon islands", y84 + 0.2, G]] },
      { t: y85, big: "1985", accent: Y, lines: [["Offensive toward Basra fails", y85 + 0.2, R]] },
      { t: fMoves, big: "1986", accent: Y, lines: [["Feb 1986: Iran captures al-Faw", fMoves + 0.3, G], ["Iraq strikes back", fBack, R]] },
      { t: at("Neither side achieves"), big: "STALEMATE", accent: Y, lines: [["No breakthrough", at("Neither side achieves", 0.4), Y], ["Attacks on military positions", at("attacks against military positions"), Y]] },
      { t: at("wasn't limited to the battlefield"), big: "OIL", accent: Y, lines: [["Oil revenue: a lifeline for both", at("depended heavily"), Y], ["Oil sites & shipping targeted", at("So oil facilities"), Y]] },
      { t: at("into the Persian Gulf"), big: "TANKER WAR", accent: Y, lines: [["1984–88: attacks on Gulf shipping", at("Commercial shipping"), Y], ["Oil tankers under threat", at("Oil tankers came"), Y], ["Foreign navies escort tankers (1987)", at("other countries became"), B]] },
      { t: at("no longer just an Iran-Iraq problem"), big: "GLOBAL CRISIS", accent: B },
      { t: at("darkest aspects"), big: "CHEMICAL ARMS", accent: Y, lines: [["Used during the war — notably by Iraq", at("Chemical weapons were used"), Y], ["Iraq's use confirmed by UN investigators", at("severe injuries"), Y]] },
      { t: at("Halabja"), big: "HALABJA 1988", accent: Y, lines: [["Kurdish town hit with chemical agents", at("Halabja", 1), Y], ["March 1988", at("Halabja", 2.5), Y]] },
      { t: at("This period demonstrated"), big: "HUMAN COST", accent: R, lines: [["A prolonged, costly struggle", at("prolonged struggle"), R], ["Still no decisive victory", at("neither Iran nor Iraq"), Y]] },
      { t: at("late 1980s"), big: "EXHAUSTED", accent: Y, lines: [["1988: Iraq retakes al-Faw & Majnoon", at("late 1980s", 1), R], ["Economies drained", at("economy of both"), Y], ["Cities & infrastructure damaged", at("Cities and infrastructure"), Y]] },
      { t: at("United Nations pushed"), big: "UN RES. 598", accent: B, lines: [["Adopted July 1987", at("Security Council adopted"), B], ["Iran accepts (Jul 1988)", accept, G], ["Iraq accepts", at("Iraq also accepted"), R]] },
      { t: at("August 20, 1988."), big: "AUG 20, 1988", accent: H, lines: [["The ceasefire takes effect", at("ceasefire came into effect"), H], ["Both flags stop · the front freezes", at("front line freezes"), H]] },
      { t: at("no dramatic conquest"), big: "NO WINNER", accent: Y, lines: [["No conquest of Iran", at("no dramatic conquest", 0.2), Y], ["No decisive Iraqi victory", at("no decisive Iraqi"), Y], ["Iran did not conquer Iraq", at("did not conquer Iraq"), Y]] },
      { t: at("ended through a ceasefire"), big: "STATUS QUO", accent: H, lines: [["A ceasefire, not a victory", at("ended through a ceasefire", 0.3), H], ["Back to the pre-war border", at("pre-war international border"), H]] },
      { t: at("changed the Middle East permanently"), big: "LEGACY", accent: H, lines: [["A regional dispute became a global crisis", at("regional dispute"), H], ["Outside powers drawn in", at("drew in outside powers"), B], ["A key oil region threatened", at("oil-producing"), Y]] },
      { t: at("began with an Iraqi invasion"), big: "1980 → 1988", accent: R },
      { t: at("Eight years.", 0, -1), big: "8 YEARS", accent: R, lines: [["Two countries", at("Two countries.", 0, -1), H], ["One devastating war", at("One devastating war"), R], ["No clear winner", at("no clear winner"), Y]] },
      { t: lastTitle, big: "IRAN–IRAQ WAR", accent: R, lines: [["1980 – 1988", lastTitle + 0.8, H]] },
      { t: ctaT, big: "SUBSCRIBE", accent: R, lines: [["For more history on the map", ctaT + 0.4, H]] },
    ],
    legend: [
      { color: "rgba(52,199,123,0.7)", text: "Iran", at: 0.8 },
      { color: "rgba(255,59,74,0.7)", text: "Iraq", at: 0.9 },
      { color: "rgba(255,59,74,0.6)", hatch: true, text: "Iraqi-held areas in Iran, 1980–82 (approx.)", at: at("Initially, Iraq made") },
      { color: "rgba(52,199,123,0.6)", hatch: true, text: "Iranian-held areas in Iraq, 1984–88 (approx.)", at: y84 },
    ],
    ctaT,
    likeT: word("like, share", "like"),
    shareT: word("like, share", "share"),
    subT: word("like, share", "subscribe"),
    sfx: [
      [0.2, "riser", 0.15, 60],
      [at("Cities bombed"), "boom", 0.2, 60],
      [at("This was the Iran"), "boom", 0.28, 60],
      [invT, "boom", 0.3, 60],
      [followA, "whoosh", 0.22],
      [at("air strikes"), "whoosh", 0.2],
      [f2A, "whoosh", 0.22],
      [y82, "whoosh", 0.15],
      [y84, "whoosh", 0.15],
      [at("into the Persian Gulf"), "whoosh", 0.2],
      [at("United Nations pushed"), "ding", 0.25],
      [at("August 20, 1988."), "ding", 0.28],
    ],
  };
};

// ---- scene --------------------------------------------------------------------------

const endPt = (k: K): Pt => (Array.isArray(k.p[0]) ? (k.p as Pt[])[(k.p as Pt[]).length - 1] : (k.p as Pt));
const trackAt = (raw: K[], T: number) => {
  const keys = raw.filter((k) => Number.isFinite(k.t));
  if (!keys.length) return { pos: [0, 0] as Pt, op: 0 };
  if (T <= keys[0].t) return { pos: endPt(keys[0]), op: keys[0].op ?? 1 };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (T < b.t) {
      const q = ease(clamp((T - a.t) / Math.max(0.01, b.t - a.t)));
      return { pos: Array.isArray(b.p[0]) ? cut(b.p as Pt[], q).tip : lerpPt(endPt(a), b.p as Pt, q), op: lerp(a.op ?? 1, b.op ?? 1, q) };
    }
  }
  const l = keys[keys.length - 1];
  return { pos: endPt(l), op: l.op ?? 1 };
};

const cameraAt = (plan: Plan, T: number): View => {
  for (const f of plan.follow) {
    if (Number.isFinite(f.a) && T > f.a && T < f.b) {
      const p = ease(clamp((T - f.a) / Math.max(0.5, f.b - f.a)));
      const tip = cut(f.path, p).tip;
      const a = clamp(p * 2);
      return { lon: lerp(f.from.lon, tip[0], a), lat: lerp(f.from.lat, tip[1], a), span: f.from.span * Math.pow(f.to.span / f.from.span, p) };
    }
  }
  // Each key starts a move (≤2.4s) from the previous view to its own view at its cue time.
  const keys = plan.keys;
  let k = 0;
  while (k < keys.length - 1 && T >= keys[k + 1][0]) k++;
  if (k === 0) return keys[0][1];
  const a = keys[k - 1][1];
  const [t0, b] = keys[k];
  const next = k + 1 < keys.length ? keys[k + 1][0] : t0 + 2.4;
  const p = ease(clamp((T - t0) / Math.max(0.01, Math.min(2.4, next - t0))));
  return { lon: lerp(a.lon, b.lon, p), lat: lerp(a.lat, b.lat, p), span: a.span * Math.pow(b.span / a.span, p) };
};

type Side = "left" | "right" | "center";
const CITIES: { name: string; p: Pt; side: Side }[] = [
  { name: "TEHRAN", p: [51.39, 35.69], side: "center" },
  { name: "BAGHDAD", p: [44.37, 33.31], side: "center" },
  { name: "BASRA", p: [47.78, 30.51], side: "left" },
  { name: "KHORRAMSHAHR", p: [48.18, 30.44], side: "right" },
  { name: "AHVAZ", p: [48.67, 31.32], side: "right" },
];

// Dot sits exactly on the anchor; text goes above-left / above-right / above.
const CityLabel: React.FC<{ text: string; side: Side; color?: string }> = ({ text, side, color }) => (
  <div style={{ position: "relative", width: 12, height: 12 }}>
    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: "0 0 12px #9fd8ff" }} />
    <div
      style={{
        position: "absolute",
        bottom: 14,
        ...(side === "left" ? { right: 2 } : side === "right" ? { left: 2 } : { left: 6, transform: "translateX(-50%)" }),
        fontFamily: BODY,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 3,
        color: color ?? "#e8f1ff",
        textShadow: "0 0 12px rgba(0,0,0,0.9), 0 2px 4px #000",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  </div>
);
const COUNTRY_LABELS: { name: string; p: Pt }[] = [
  { name: "IRAN", p: [53.5, 32.4] },
  { name: "IRAQ", p: [43.2, 32.6] },
  { name: "KUWAIT", p: [47.6, 29.25] },
  { name: "SAUDI ARABIA", p: [44.5, 27.3] },
  { name: "SYRIA", p: [38.8, 35.2] },
  { name: "TURKEY", p: [38.5, 38.9] },
];

const Tanker: React.FC = () => (
  <svg width={120} height={44} viewBox="0 0 70 26">
    <path d="M2 12 L64 12 L58 23 L8 23 Z" fill="#c9d3e3" stroke="#0b0f17" strokeWidth={2.5} strokeLinejoin="round" />
    <rect x={46} y={4} width={12} height={8} fill="#e7edf7" stroke="#0b0f17" strokeWidth={2} />
    <line x1={8} y1={12} x2={44} y2={12} stroke="#ff8a3d" strokeWidth={3} />
  </svg>
);
const Derrick: React.FC = () => (
  <svg width={34} height={40} viewBox="0 0 34 40">
    <path d="M17 2 L6 38 M17 2 L28 38 M9 26 L25 26 M11 18 L23 18" stroke="#ffd23f" strokeWidth={3} fill="none" strokeLinecap="round" />
    <circle cx={17} cy={4} r={3} fill="#ffd23f" />
  </svg>
);
const Hazard: React.FC = () => (
  <svg width={64} height={56} viewBox="0 0 70 62">
    <path d="M35 4 L66 58 L4 58 Z" fill="#ffd23f" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
    <rect x={32} y={20} width={6} height={22} rx={2} fill="#111" />
    <circle cx={35} cy={49} r={3.6} fill="#111" />
  </svg>
);

export const IraqDocScene: React.FC<{ plan: Plan; T: number; frame: number; landscape: boolean; hud?: boolean }> = ({ plan, T, frame, landscape, hud = true }) => {
  const { width, height } = useVideoConfig();
  const L = landscape
    ? { PW: 2800, PH: 2400, FX: 1260, FY: 560, tilt: 28, scale: 2.0, persp: 1900 }
    : { PW: 1900, PH: 3300, FX: width / 2, FY: 1000, tilt: 30, scale: 1.0, persp: 1800 };
  const base = cameraAt(plan, T);
  const prevBase = cameraAt(plan, T - 1 / 30);
  const cam = { ...base, span: base.span * L.scale };
  const prev = { ...prevBase, span: prevBase.span * L.scale };
  const regionFor = (v: View): Region => {
    const scale = L.PW / (v.span * COS);
    const latMax = v.lat + (0.5 * L.PH) / scale;
    return { lonMin: v.lon - v.span / 2, lonMax: v.lon + v.span / 2, latMin: latMax - L.PH / scale, latMax, refLat: REF_LAT, noWrap: true };
  };
  const proj = makeProjector(regionFor(cam), L.PW, L.PH);
  const P = (lon: number, lat: number) => proj(lon, lat);
  const [cx, cy] = P(cam.lon, cam.lat);
  const [px, py] = makeProjector(regionFor(prev), L.PW, L.PH)(cam.lon, cam.lat);
  const blur = hud ? Math.min(5, Math.hypot(cx - px, cy - py) / 30 + Math.abs(Math.log(cam.span / prev.span)) * 60) : 0;
  const pts = (list: Pt[]) => list.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(",")).join(" ");

  const bScale = clamp(14 / base.span, 0.5, 1.15);
  const flagsOn = clamp((55 - base.span) / 10);
  const citiesOn = clamp((30 - base.span) / 6);
  const iqHeld = plan.iqHeld(T);
  const pockets = plan.pockets.map((f) => f(T));
  const borderGlow = plan.borderGlow(T);
  const rivers = plan.rivers(T);
  const gulf = plan.gulf(T);
  const oil = plan.oil(T);
  const chem = plan.chem(T);
  const flash = Math.max(0, ...plan.flashes.filter(Number.isFinite).map((f) => clamp(1 - Math.abs(T - f - 0.05) / 0.3)));
  const shakeT = plan.flashes.find((f) => Number.isFinite(f) && T > f && T < f + 0.5);
  const shake = shakeT !== undefined ? Math.sin(T * 90) * 5 * (1 - (T - shakeT) / 0.5) : 0;

  const glowLine = (id: string, list: Pt[], color: string, w: number, op: number, dashed = true) => (
    <g key={id} opacity={op}>
      <polyline points={pts(list)} fill="none" stroke={color} strokeWidth={w * 2.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#dglow)" opacity={0.5} />
      <polyline points={pts(list)} fill="none" stroke="#ffffff" strokeWidth={w * 0.8} strokeDasharray={dashed ? "20 14" : undefined} strokeDashoffset={-frame * 2.5} strokeLinecap="round" opacity={0.85} />
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
  const planeLeft = L.FX - L.PW / 2;
  const planeTop = L.FY - L.PH / 2;
  const gridStep = cam.span > 50 ? 5 : 2;
  const gridN = Math.ceil((cam.span * 2.2) / gridStep);

  return (
    <AbsoluteFill style={{ background: C.ocean, overflow: "hidden", filter: chem > 0 ? `brightness(${(1 - 0.3 * chem).toFixed(2)}) saturate(${(1 - 0.4 * chem).toFixed(2)})` : undefined }}>
      <AbsoluteFill style={{ perspective: L.persp, perspectiveOrigin: `${L.FX}px ${L.FY}px`, transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <div style={{ position: "absolute", left: planeLeft, top: planeTop, width: L.PW, height: L.PH, transform: `rotateX(${L.tilt}deg)`, transformStyle: "preserve-3d", filter: blur > 0.6 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
          <svg width={L.PW} height={L.PH} viewBox={`0 0 ${L.PW} ${L.PH}`} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <filter id="dglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="dirnLand">
                <path d={geomPath(IRN, P)} />
              </clipPath>
              <clipPath id="dirqLand">
                <path d={geomPath(IRQ, P)} />
              </clipPath>
              <radialGradient id="dlight" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor="rgba(120,170,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            <rect width={L.PW} height={L.PH} fill={C.ocean} />
            {Array.from({ length: gridN }, (_, i) => {
              const lo = Math.floor((cam.lon - cam.span * 1.1) / gridStep) * gridStep + i * gridStep;
              const [x] = P(lo, cam.lat);
              return <line key={`lo${i}`} x1={x} y1={0} x2={x} y2={L.PH} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            {Array.from({ length: gridN }, (_, i) => {
              const la = Math.floor((cam.lat - cam.span * 1.1) / gridStep) * gridStep + i * gridStep;
              const [, y] = P(cam.lon, la);
              return <line key={`la${i}`} x1={0} y1={y} x2={L.PW} y2={y} stroke="rgba(90,150,220,0.07)" strokeWidth={1.5} />;
            })}
            <g transform="translate(0 12)">
              {OTHERS.map((c) => (
                <path key={`s${c.iso}`} d={geomPath(c.geom, P)} fill={C.side} />
              ))}
              <path d={geomPath(IRN, P)} fill={C.side} />
              <path d={geomPath(IRQ, P)} fill={C.side} />
            </g>
            {OTHERS.map((c) => (
              <path key={c.iso} d={geomPath(c.geom, P)} fill={C.land} stroke={C.landEdge} strokeWidth={1.8} strokeLinejoin="round" />
            ))}
            <path d={geomPath(IRN, P)} fill={C.irn} stroke={C.irnEdge} strokeWidth={3 + borderGlow * 4} strokeLinejoin="round" filter="url(#dglow)" />
            <path d={geomPath(IRQ, P)} fill={C.irq} stroke={C.irqEdge} strokeWidth={3 + borderGlow * 4} strokeLinejoin="round" filter="url(#dglow)" />

            {rivers > 0 && (
              <g opacity={rivers}>
                <polyline points={pts(TIGRIS)} fill="none" stroke={C.water} strokeWidth={4} strokeLinejoin="round" opacity={0.8} />
                <polyline points={pts(EUPHRATES)} fill="none" stroke={C.water} strokeWidth={4} strokeLinejoin="round" opacity={0.8} />
                {glowLine("shatt", SHATT, C.water, 4, 1, false)}
              </g>
            )}

            <g clipPath="url(#dirnLand)" opacity={iqHeld}>
              {IRAQI_HELD.map((g, i) => (
                <path key={`qh${i}`} d={geomPath(g, P)} fill="rgba(255,59,74,0.4)" stroke="rgba(255,90,100,0.9)" strokeWidth={2.5} strokeDasharray="10 8" />
              ))}
            </g>
            <g clipPath="url(#dirqLand)">
              {IRANIAN_HELD.map((g, i) => (
                <path key={`rh${i}`} d={geomPath(g, P)} fill="rgba(52,199,123,0.4)" stroke="rgba(52,199,123,0.95)" strokeWidth={2.5} strokeDasharray="10 8" opacity={pockets[i] ?? 0} />
              ))}
            </g>

            {gulf > 0 && (
              <g opacity={gulf}>
                <polyline points={pts(GULF_LANE)} fill="none" stroke="rgba(159,216,255,0.55)" strokeWidth={4} strokeDasharray="14 12" strokeDashoffset={-frame * 1.5} />
                {[0.45, 0.62, 0.8].map((f, i) => {
                  const ph = ((T * 0.6 + i * 0.33) % 1);
                  const [x, y] = P(...cut(GULF_LANE, f).tip);
                  return <circle key={`atk${i}`} cx={x} cy={y} r={12 + ph * 70} fill="none" stroke={C.red} strokeWidth={3} opacity={(1 - ph) * 0.7} />;
                })}
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
                  {glowLine(`rl${i}`, c.pts, r.color, r.thin ? 2.2 : 4, 1)}
                  {!r.thin && <polygon points={`${tx + Math.cos(a) * 26},${ty + Math.sin(a) * 26} ${tx + Math.cos(a + 2.5) * 20},${ty + Math.sin(a + 2.5) * 20} ${tx + Math.cos(a - 2.5) * 20},${ty + Math.sin(a - 2.5) * 20}`} fill={r.color} filter="url(#dglow)" />}
                  {r.thin && f >= 1 && <circle cx={tx} cy={ty} r={10 + 8 * Math.abs(Math.sin(frame * 0.3))} fill="none" stroke={r.color} strokeWidth={3} />}
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
            <rect width={L.PW} height={L.PH} fill="url(#dlight)" />
          </svg>

          {COUNTRY_LABELS.map((c) => bb(c.p[0], c.p[1], <MapLabel text={c.name} kind="country" />, clamp((base.span - 10) / 6) * clamp((T - 0.4) * 2), c.name))}
          {CITIES.map((c) => {
            const txt = plan.cityText(c.name, T);
            return bb(c.p[0], c.p[1], <CityLabel text={txt ?? c.name} side={c.side} color={txt ? "#ffd9a0" : undefined} />, txt ? 1 : citiesOn, c.name);
          })}
          {plan.labels.map((l, i) => bb(l.p[0], l.p[1], <MapLabel text={l.text} kind={l.kind ?? "region"} color={l.color} />, win(T, l.a, l.b, 0.5), `l${i}`))}
          {oil > 0 && OIL_SITES.map((s) => bb(s.p[0], s.p[1], <Derrick />, oil, `oil${s.name}`))}
          {gulf > 0 &&
            [0, 1, 2, 3].map((k) => {
              const f = (T * 0.025 + k * 0.25) % 1;
              const tip = cut(GULF_LANE, f).tip;
              return bb(tip[0], tip[1] + 0.12, <Tanker />, gulf, `tk${k}`);
            })}
          {chem > 0 && CHEM_SITES.map((s, i) => bb(s[0], s[1], <Hazard />, chem * clamp((chem - i * 0.15) * 2), `hz${i}`))}
          {plan.flags.map((f, i) => {
            const { pos, op } = trackAt(f.keys, T);
            const kind = typeof f.kind === "function" ? f.kind(T) : f.kind;
            return bb(pos[0], pos[1], <Flag kind={kind} frame={frame} label={f.label?.(T)} />, op * flagsOn, `f${i}`);
          })}
        </div>
      </AbsoluteFill>

      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 197.3) % width;
        const y = (height - ((T * (12 + (i % 5) * 5) + i * 131) % (height + 40))) % height;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: 3 + (i % 3), height: 3 + (i % 3), borderRadius: "50%", background: "#9fd8ff", opacity: 0.1 + (i % 4) * 0.05 }} />;
      })}
      <AbsoluteFill style={{ background: landscape ? "radial-gradient(ellipse at 62% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)" : "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: landscape ? "linear-gradient(90deg, rgba(3,5,10,0.92) 0%, rgba(3,5,10,0.7) 36%, rgba(3,5,10,0) 54%)" : "linear-gradient(180deg, rgba(3,5,10,0.85) 0%, rgba(3,5,10,0) 22%, rgba(3,5,10,0) 70%, rgba(3,5,10,0.92) 100%)" }} />
      {chem > 0 && <AbsoluteFill style={{ boxShadow: `inset 0 0 ${220 * chem}px rgba(255,210,63,${(0.25 * chem).toFixed(2)})` }} />}
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.8 }} />
      {hud && <DocHud plan={plan} T={T} landscape={landscape} />}
    </AbsoluteFill>
  );
};

const DocHud: React.FC<{ plan: Plan; T: number; landscape: boolean }> = ({ plan, T, landscape }) => {
  const blocks = plan.blocks.filter((b) => Number.isFinite(b.t));
  let cur = blocks[0];
  for (const b of blocks) if (T >= b.t && b.t >= cur.t) cur = b;
  const big = typeof cur.big === "function" ? cur.big(T) : cur.big;
  const lines = (cur.lines ?? []).filter(([, t]) => Number.isFinite(t)).map(([text, t, color]) => ({ text, at: t, color }));
  const legend = plan.legend.filter((l) => Number.isFinite(l.at));
  const cta = T >= plan.ctaT && Number.isFinite(plan.ctaT);
  return (
    <>
      <div style={{ position: "absolute", left: 60, top: landscape ? 50 : 60, right: 60, display: "flex", alignItems: "center", gap: 14, fontFamily: BODY, fontSize: landscape ? 22 : 24, fontWeight: 800, letterSpacing: 4, color: C.hud }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.red, opacity: Math.sin(T * 6) > 0 ? 1 : 0.3 }} />
        {plan.topLine}
      </div>
      {landscape ? (
        <>
          <div style={{ position: "absolute", left: 0, top: -20, width: 960, height: 600 }}>
            <HudBlock key={cur.t} big={big} lines={lines} T={T} start={cur.t} accent={cur.accent ?? C.red} />
          </div>
          <div style={{ position: "absolute", left: 0, bottom: 0, width: 900, height: 400 }}>
            <Legend T={T} note="Internationally recognised borders · held areas approximate" items={legend} />
          </div>
          <SubscribeNudge T={T} until={plan.ctaT} top={40} />
          {cta && (
            <div style={{ position: "absolute", left: 900, right: 0, top: 0, bottom: 0 }}>
              <CtaCard T={T} top={640} likeT={plan.likeT} shareT={plan.shareT} subT={plan.subT} />
            </div>
          )}
        </>
      ) : (
        <>
          <HudBlock key={cur.t} big={big} lines={lines} T={T} start={cur.t} accent={cur.accent ?? C.red} />
          <Legend T={T} note="Internationally recognised borders · held areas approximate" items={legend} />
          <SubscribeNudge T={T} until={plan.ctaT} top={330} />
          {cta && <CtaCard T={T} top={1380} likeT={plan.likeT} shareT={plan.shareT} subT={plan.subT} />}
        </>
      )}
      {plan.missing.length > 0 && <div style={{ position: "absolute", right: 20, bottom: 20, color: "#f00", fontFamily: BODY, fontSize: 22, background: "#000", padding: 8, maxWidth: 900 }}>MISSING CUES: {plan.missing.join(" | ")}</div>}
    </>
  );
};

const Doc: React.FC<{ timing: Timing; mode: "short" | "long" }> = ({ timing, mode }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const plan = React.useMemo(() => (mode === "short" ? buildShortPlan : buildLongPlan)(timing.sections, timing.durationSec), [timing, mode]);
  const cue = (t: number, sfx: string, vol: number, len = 45) =>
    Number.isFinite(t) ? (
      <Sequence key={`${sfx}${t.toFixed(2)}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={len}>
        <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
      </Sequence>
    ) : null;
  return (
    <AbsoluteFill>
      <Audio src={staticFile(timing.audio)} />
      {plan.sfx.map(([t, s, v, l]) => cue(t, s, v, l))}
      {nudgeTimes(plan.ctaT).map((t) => cue(t + 1.1, "ding", 0.22))}
      {cue(plan.subT + 1.2, "ding", 0.3)}
      <IraqDocScene plan={plan} T={T} frame={frame} landscape={mode === "long"} />
    </AbsoluteFill>
  );
};

export const IraqShort: React.FC<{ timing: Timing }> = ({ timing }) => <Doc timing={timing} mode="short" />;
export const IraqLong: React.FC<{ timing: Timing }> = ({ timing }) => <Doc timing={timing} mode="long" />;
