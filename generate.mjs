// generate.mjs — the single "do everything" entrypoint for the whiteboard skill.
//
// Usage:
//   node generate.mjs --file path\to\script.txt [options]
//   node generate.mjs --text "First idea.\n\nSecond idea." [options]
//
// Options:
//   --file <path>     Read the narration script from a file (paragraphs = boards).
//   --text "<text>"   Inline script. Use \n\n to separate boards.
//   --voice <voice>   edge-tts voice (e.g. en-US-AndrewNeural, te-IN-MohanNeural).
//   --rate <rate>     Speaking rate, e.g. "-4%" or "+10%".
//   --size <preset>   vertical (1080x1920, default) | landscape (1920x1080) | square (1080x1080).
//   --out <path>      Output video path (default out/video.mp4).
//
// If neither --file nor --text is given, the existing script.txt is used.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = import.meta.dirname;
const CONFIG_PATH = path.join(ROOT, "config.json");
const SCRIPT_PATH = path.join(ROOT, "script.txt");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = val;
    }
  }
  return args;
}

const SIZES = {
  vertical: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

function run(label, command) {
  console.log(`\n\u25B6 ${label}`);
  const res = spawnSync(command, { stdio: "inherit", shell: true, cwd: ROOT });
  if (res.status !== 0) {
    console.error(`\n\u2717 Failed: ${label}`);
    process.exit(res.status ?? 1);
  }
}

const args = parseArgs(process.argv.slice(2));

// 1. Resolve the script source.
if (args.file) {
  const src = path.resolve(process.cwd(), args.file);
  if (!fs.existsSync(src)) {
    console.error(`Script file not found: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, SCRIPT_PATH);
  console.log(`Using script from ${src}`);
} else if (args.text) {
  const text = args.text.replace(/\\n/g, "\n");
  fs.writeFileSync(SCRIPT_PATH, text, "utf-8");
  console.log("Using inline --text script.");
} else {
  console.log("Using existing script.txt");
}

// 2. Apply config overrides.
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
if (args.voice) config.voice = args.voice;
if (args.rate) config.rate = args.rate;
if (args.size) {
  const preset = SIZES[args.size.toLowerCase()];
  if (!preset) {
    console.error(`Unknown --size "${args.size}". Use: vertical | landscape | square.`);
    process.exit(1);
  }
  config.width = preset.width;
  config.height = preset.height;
}
fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");

// 3. Run the pipeline: narration+timing -> typecheck -> render.
const outPath = args.out ? args.out.replace(/\\/g, "/") : "out/video.mp4";
const comp = args.comp || "Whiteboard";
fs.mkdirSync(path.dirname(path.resolve(ROOT, outPath)), { recursive: true });

run("[1/3] Narration + word timings (edge-tts)", "python pipeline/tts.py");
run("[2/3] Typecheck", "npx tsc --noEmit");
run("[3/3] Render whiteboard video", `npx remotion render src/index.ts ${comp} "${outPath}"`);

console.log(`\n\u2714 Done  ->  ${path.resolve(ROOT, outPath)}`);
