// gen_sfx.mjs — synthesize small royalty-free sound effects into public/sfx/*.wav.
// Self-generated (no external assets) so they're free to use.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public", "sfx");
fs.mkdirSync(OUT, { recursive: true });
const RATE = 44100;

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, `${name}.wav`), buf);
}

const make = (dur, fn) => {
  const n = Math.floor(dur * RATE);
  const s = new Array(n);
  for (let i = 0; i < n; i++) s[i] = fn(i / RATE);
  return s;
};
const rnd = () => Math.random() * 2 - 1;

// pop — short blip for element pop-ins
writeWav("pop", make(0.14, (t) => {
  const f = 620 * Math.exp(-t * 16) + 180;
  return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 28) * 0.8;
}));

// whoosh — scene transition
let lp = 0;
writeWav("whoosh", make(0.42, (t) => {
  lp += 0.06 * (rnd() - lp);
  const env = Math.sin(Math.PI * Math.min(1, t / 0.42));
  return lp * env * 0.7;
}));

// ding — reveal / number
writeWav("ding", make(0.5, (t) => {
  const e = Math.exp(-t * 6);
  return (Math.sin(2 * Math.PI * 880 * t) * 0.6 + Math.sin(2 * Math.PI * 1320 * t) * 0.3 + Math.sin(2 * Math.PI * 1760 * t) * 0.15) * e * 0.7;
}));

// riser — suspense build
writeWav("riser", make(1.3, (t) => {
  const p = t / 1.3;
  const f = 180 + 1100 * p * p;
  return (Math.sin(2 * Math.PI * f * t) * 0.5 + rnd() * 0.25) * p * 0.6;
}));

// boom — big impact
writeWav("boom", make(0.6, (t) => {
  const f = 95 * Math.exp(-t * 4) + 45;
  const click = t < 0.012 ? rnd() * 0.6 : 0;
  return (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 4.5) + click) * 0.9;
}));

console.log("Wrote SFX:", fs.readdirSync(OUT).join(", "));
