// make_basemap.mjs: build the satellite basemap from NASA Blue Marble Next Generation
// (topography + bathymetry, July — summer, little snow; public domain, NASA Visible Earth).
//
//   node pipeline/make_basemap.mjs
//
// Writes public/basemap/world.jpg (5400×2700, whole world) and
// public/basemap/z1/<row>_<col>.jpg (10° × 10° tiles, 600 px each = 60 px/degree).
// Row 0 starts at 90°N, col 0 at 180°W.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, "pipeline", ".cache");
const OUT = path.join(ROOT, "public", "basemap");
const SRC_URL = "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x21600x10800.jpg";
const SRC = path.join(CACHE, "bmng-topo-bathy-200407-21600.jpg");
const TILE = 600;
const COLS = 36;
const ROWS = 18;

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(path.join(OUT, "z1"), { recursive: true });

if (!fs.existsSync(SRC)) {
  console.log("Downloading NASA Blue Marble (≈29 MB)…");
  const res = await fetch(SRC_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  fs.writeFileSync(SRC, Buffer.from(await res.arrayBuffer()));
}

const run = (args) => execFileSync(ffmpeg, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

run(["-i", SRC, "-vf", "scale=5400:2700:flags=lanczos", "-q:v", "3", path.join(OUT, "world.jpg")]);
console.log("world.jpg");

for (let r = 0; r < ROWS; r++) {
  const labels = Array.from({ length: COLS }, (_, c) => `[t${c}]`);
  const graph = `[0]crop=${COLS * TILE}:${TILE}:0:${r * TILE},split=${COLS}${Array.from({ length: COLS }, (_, c) => `[s${c}]`).join("")};` +
    Array.from({ length: COLS }, (_, c) => `[s${c}]crop=${TILE}:${TILE}:${c * TILE}:0${labels[c]}`).join(";");
  const outs = Array.from({ length: COLS }, (_, c) => ["-map", labels[c], "-q:v", "4", path.join(OUT, "z1", `${r}_${c}.jpg`)]).flat();
  run(["-i", SRC, "-filter_complex", graph, ...outs]);
  process.stdout.write(`row ${r + 1}/${ROWS}\r`);
}
console.log(`\nDone → ${OUT}`);
