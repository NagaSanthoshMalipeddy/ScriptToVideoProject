// make_srt.mjs — build an .srt subtitle track from public/timing.json + a cues file.
//
// Usage:
//   node pipeline/make_srt.mjs <cues.json> <out.srt>
//
// The cues file is an array with one entry per narration section (same count as
// timing.json sections). Each entry is an array of short caption lines. Each
// section's [start,end] is split across its lines proportionally to text length,
// so the translated captions line up with the spoken audio.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const cuesPath = process.argv[2];
const outPath = process.argv[3] || "out/subtitles.srt";

if (!cuesPath || !fs.existsSync(cuesPath)) {
  console.error(`Cues file not found: ${cuesPath}`);
  process.exit(1);
}

const timing = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "timing.json"), "utf-8"));
const cues = JSON.parse(fs.readFileSync(path.resolve(ROOT, cuesPath), "utf-8"));
const sections = timing.sections;

if (cues.length !== sections.length) {
  console.warn(`Warning: ${cues.length} cue groups vs ${sections.length} sections. Using min.`);
}

const pad = (n, w = 2) => String(n).padStart(w, "0");
const tc = (sec) => {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
};

const entries = [];
const n = Math.min(cues.length, sections.length);
for (let i = 0; i < n; i++) {
  const sec = sections[i];
  const lines = cues[i];
  const total = sec.end - sec.start;
  const weights = lines.map((l) => Math.max(1, l.replace(/\s/g, "").length));
  const sum = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let j = 0; j < lines.length; j++) {
    const start = sec.start + (acc / sum) * total;
    acc += weights[j];
    const end = sec.start + (acc / sum) * total;
    entries.push({ start, end, text: lines[j] });
  }
}

const srt = entries
  .map((e, i) => `${i + 1}\n${tc(e.start)} --> ${tc(e.end)}\n${e.text}\n`)
  .join("\n");

fs.mkdirSync(path.dirname(path.resolve(ROOT, outPath)), { recursive: true });
fs.writeFileSync(path.resolve(ROOT, outPath), srt, "utf-8");
console.log(`Wrote ${entries.length} cues -> ${outPath}`);
