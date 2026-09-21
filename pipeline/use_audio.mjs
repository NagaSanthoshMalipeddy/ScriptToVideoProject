// use_audio.mjs — swap in a custom narration file and build scene timings for it.
//
// Usage:
//   node pipeline/use_audio.mjs "<path to audio>" [scriptPath]
//
// It converts the audio to public/audio.mp3 and writes public/timing.json with
// one section per script paragraph, each section's length proportional to that
// paragraph's character count (an approximation, since the file has no word
// timings). Scene-based compositions (AiRace / Ukraine / Marker) sync to these.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const input = process.argv[2];
const scriptPath = process.argv[3] || path.join(ROOT, "script.txt");
const audioOut = path.join(ROOT, "public", "audio.mp3");

if (!input || !fs.existsSync(input)) {
  console.error(`Audio file not found: ${input}`);
  process.exit(1);
}

const parseDuration = (s) => {
  const m = s.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
};

// 1. Convert to a clean stereo mp3 the renderer can always decode.
const conv = spawnSync(
  `npx remotion ffmpeg -y -i "${input}" -ar 48000 -ac 2 -b:a 192k "${audioOut}"`,
  { shell: true, encoding: "utf-8" }
);
let dur = parseDuration((conv.stderr || "") + (conv.stdout || ""));

// 2. Fall back to probing the output if the convert log didn't include it.
if (!dur) {
  const probe = spawnSync(`npx remotion ffprobe "${audioOut}"`, { shell: true, encoding: "utf-8" });
  dur = parseDuration((probe.stderr || "") + (probe.stdout || ""));
}
if (!dur) {
  console.error("Could not determine audio duration.");
  process.exit(1);
}

// 3. Split the script into paragraphs and allocate time by text length.
const text = fs.readFileSync(scriptPath, "utf-8").replace(/\r/g, "");
const paras = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
const weights = paras.map((p) => Math.max(1, p.replace(/\s/g, "").length));
const totalW = weights.reduce((a, b) => a + b, 0);

let acc = 0;
const sections = paras.map((p, i) => {
  const start = (acc / totalW) * dur;
  acc += weights[i];
  const end = (acc / totalW) * dur;
  return { text: p, start: +start.toFixed(3), end: +end.toFixed(3), words: [] };
});

const timing = { audio: "audio.mp3", durationSec: +dur.toFixed(3), sections };
fs.writeFileSync(path.join(ROOT, "public", "timing.json"), JSON.stringify(timing, null, 2));
console.log(`Audio ${dur.toFixed(1)}s -> public/audio.mp3`);
console.log(`Wrote ${sections.length} sections -> public/timing.json`);
