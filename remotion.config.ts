import { Config } from "@remotion/cli/config";
import fs from "node:fs";
import path from "node:path";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Required for @remotion/three (WebGL) rendering in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");

// Remotion's bundled Chrome download is blocked on some machines, so we point
// it at an already-installed Chromium browser. Set "browserExecutable" in
// config.json to override, otherwise we auto-detect Chrome then Edge.
let configured: string | undefined;
try {
  const cfg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "config.json"), "utf-8")
  );
  configured = cfg.browserExecutable || undefined;
} catch {
  configured = undefined;
}

const candidates = [
  configured,
  process.env.REMOTION_BROWSER,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter((p): p is string => Boolean(p));

const browser = candidates.find((p) => fs.existsSync(p));
if (browser) {
  Config.setBrowserExecutable(browser);
}
