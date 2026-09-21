// One command: script.txt -> out/video.mp4
// Steps: 1) edge-tts narration + timings  2) typecheck  3) Remotion render
import { spawnSync } from "node:child_process";

function run(label, command) {
  console.log(`\n\u25B6 ${label}`);
  const res = spawnSync(command, { stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`\n\u2717 Failed: ${label}`);
    process.exit(res.status ?? 1);
  }
}

run("[1/3] Narration + word timings (edge-tts)", "python pipeline/tts.py");
run("[2/3] Typecheck", "npx tsc --noEmit");
run(
  "[3/3] Render whiteboard video",
  "npx remotion render src/index.ts Whiteboard out/video.mp4"
);

console.log("\n\u2714 Done  ->  out/video.mp4");
