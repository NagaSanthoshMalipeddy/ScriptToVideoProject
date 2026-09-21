# Whiteboard Studio

Turn a plain-text script into a **narrated whiteboard-animation video**. You write
the words; the tool speaks them, draws them in a handwriting font with a marker
that follows the pen tip, and exports a finished MP4 — with the drawing perfectly
synced to the voice.

```
script.txt  ->  npm run make  ->  out/video.mp4
```

---

## 1. Architecture at a glance

Two runtimes cooperate through two generated files in `public/`:

```
                    ┌───────────────────────── AUDIO / TIMING STAGE (Python) ─────────────────────────┐
                    │                                                                                  │
  script.txt  ──►   │   pipeline/tts.py  ──►  edge-tts (cloud neural TTS)                               │
  config.json ──►   │        │                    │                                                    │
                    │        │                    ├─ audio stream  ─────────────►  public/audio.mp3     │
                    │        │                    └─ WordBoundary events ────┐                          │
                    │        └─ group words into sections (paragraphs) ──────┴──►  public/timing.json   │
                    └──────────────────────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                    ┌───────────────────────── RENDER STAGE (Node / Remotion) ────────────────────────┐
                    │                                                                                  │
  public/audio.mp3   ─┐                                                                                │
  public/timing.json ─┴─►  src/Root.tsx  ──►  src/Whiteboard.tsx                                       │
  config.json        ───►     (composition)        │                                                  │
                    │                               ├─ @remotion/google-fonts  → handwriting font       │
                    │                               ├─ components/Board.tsx     → word-by-word reveal    │
                    │                               │     └─ @remotion/layout-utils → measure + wrap text│
                    │                               └─ components/Pen.tsx       → marker follows pen tip  │
                    │                                                                                  │
                    │   Remotion renders every frame in Chrome Headless, muxes audio  ──►  out/video.mp4 │
                    └──────────────────────────────────────────────────────────────────────────────────┘

  Orchestration:  make.mjs (npm run make)  or  generate.mjs (skill entrypoint, with options)
                  runs the two stages in order:  TTS  →  typecheck  →  render.
```

---

## 2. End-to-end flow (stage by stage)

| # | Stage | Entry point | Input | Output |
|---|-------|-------------|-------|--------|
| 0 | **Orchestrate** | `make.mjs` / `generate.mjs` | your command | runs stages 1–3 in order |
| 1 | **Narrate + time** | `pipeline/tts.py` | `script.txt`, `config.json` | `public/audio.mp3`, `public/timing.json` |
| 2 | **Typecheck** | `tsc --noEmit` | `src/**`, generated JSON | pass/fail (guards the slow render) |
| 3 | **Render** | `remotion render` | `public/*`, `config.json`, `src/**` | `out/video.mp4` |

**What happens in each stage:**

1. **Narrate + time (Python).**
   `tts.py` reads `script.txt` (each blank-line paragraph = one "board") and the
   voice settings from `config.json`. It streams the script to **edge-tts** once,
   asking for `WordBoundary` events. As audio bytes arrive they are written to
   `public/audio.mp3`; each `WordBoundary` gives a word's exact `start`/`end` time.
   Words are grouped back into sections by character proportion and saved to
   `public/timing.json`.

2. **Typecheck (TypeScript).**
   `tsc --noEmit` validates the React/Remotion code and the generated JSON shape
   **before** rendering, so a typo fails in ~2 s instead of after a minutes-long render.

3. **Render (Node / Remotion).**
   `Root.tsx` builds the composition (size + duration from `timing.json`).
   `Whiteboard.tsx` plays `audio.mp3` and shows the active board for the current
   time. `Board.tsx` lays out and reveals each word exactly when it is spoken;
   `Pen.tsx` parks the marker at the word being written. Remotion drives a
   **Chrome Headless** browser to screenshot every frame, then its bundled
   **ffmpeg** encodes the frames + audio into `out/video.mp4`.

---

## 3. Tools — what each one is and where it's used

| Tool | Type | Stage | Role in the pipeline |
|------|------|-------|----------------------|
| **Node.js** | Runtime | all | Runs the orchestrators (`make.mjs`, `generate.mjs`), Remotion, and npm. |
| **Python 3** | Runtime | 1 | Runs `pipeline/tts.py`. |
| **edge-tts** | Python pkg | 1 | Neural text-to-speech. Produces the MP3 **and** per-word timestamps via `WordBoundary` events — this is what makes drawing-to-voice sync possible (no Whisper/alignment model needed). |
| **TypeScript (`tsc`)** | Compiler | 2 | `--noEmit` typecheck as a fast gate before rendering. |
| **Remotion** (`remotion`, `@remotion/cli`) | Video framework | 3 | Turns React components into video frames; muxes audio; encodes the MP4. |
| **React** | UI library | 3 | The whiteboard is built as React components (`Whiteboard`, `Board`, `Pen`). |
| **@remotion/google-fonts** | Remotion pkg | 3 | Loads the **Caveat** handwriting font and blocks rendering until it's ready (so text measures correctly). |
| **@remotion/layout-utils** | Remotion pkg | 3 | `measureText()` measures each word so `Board.tsx` can wrap lines, auto-fit the font size, and place the pen tip precisely. |
| **Chrome Headless** | Browser | 3 | Remotion renders each frame by screenshotting the React app. Auto-detected from an installed Chrome/Edge (see `remotion.config.ts`). |
| **ffmpeg** (Remotion-bundled) | Encoder | 3 | Encodes frames + narration into the final `out/video.mp4`. No separate install needed. |

> **Design note:** the original idea used `faster-whisper` + `NumPy` to align a
> transcript to audio. We removed both — edge-tts already returns exact per-word
> timings in the same pass, which is lighter, faster, and more accurate.

---

## 4. Usage

### One command (uses current `script.txt` + `config.json`)
```powershell
npm run make          # -> out/video.mp4
```

### Skill / flexible entry point (pass a script + options)
```powershell
node generate.mjs --file my-script.txt --voice en-US-AndrewNeural --size vertical
```
| Flag | Meaning | Default |
|------|---------|---------|
| `--file <path>` | Script file (blank line = new board) | — |
| `--text "..."` | Inline script; `\n\n` between boards | — |
| `--voice <voice>` | Any edge-tts voice | `en-US-AndrewNeural` |
| `--rate <rate>` | Speaking speed, e.g. `-4%`, `+10%` | `-4%` |
| `--size <preset>` | `vertical` / `landscape` / `square` | `vertical` |
| `--out <path>` | Output MP4 path | `out/video.mp4` |

### Live preview (scrub the timeline, no full render)
```powershell
npm run studio
```

### Run a single stage
```powershell
npm run tts        # stage 1 only: regenerate audio + timings
npm run typecheck  # stage 2 only
npm run render     # stage 3 only (reuses existing public/ assets)
```

---

## 5. Configuration — `config.json`

```json
{
  "voice": "en-US-AndrewNeural",   // any edge-tts voice
  "rate": "-4%",                    // speaking speed
  "pitch": "+0Hz",
  "fps": 30,
  "width": 1080,                    // 1080x1920 = vertical (Shorts/Reels)
  "height": 1920,
  "theme": {
    "background": "#fbfbf5",
    "ink": "#1f2430",               // handwriting color
    "accent": "#e63946",            // marker nib color
    "font": "Caveat"
  }
}
```

- **List voices:** `python -m edge_tts --list-voices`
  (e.g. Telugu `te-IN-MohanNeural`, Hindi `hi-IN-MadhurNeural`, Spanish `es-ES-AlvaroNeural`)
- **Orientation:** `vertical` 1080×1920, `landscape` 1920×1080, `square` 1080×1080.
- **Force a browser:** add `"browserExecutable": "C:\\path\\to\\chrome.exe"`.
  Otherwise `remotion.config.ts` auto-detects an installed Chrome/Edge.

---

## 6. Use it as a Copilot skill

`.github/skills/whiteboard-video/SKILL.md` lets an AI agent run the whole thing.
Add the project so the CLI loads the skill:

```
/add-dir C:\Users\nmalipeddy\source\repos\Learn\whiteboard-studio
```

Then just ask, e.g. *"make a whiteboard video explaining photosynthesis, vertical."*
The model writes the script and runs `generate.mjs` for you. Verify it's loaded
with `/skills`.

---

## 7. Requirements

- **Node.js + npm** — run `npm install` once (Remotion, React).
- **Python 3** with **edge-tts** — `python -m pip install edge-tts`.
- **A Chromium browser** (Chrome or Edge) for Remotion's frame rendering.

---

## 8. Project layout

```
script.txt                     your input text (paragraph = board)
config.json                    voice, size, and theme settings
make.mjs                       one-command orchestrator (npm run make)
generate.mjs                   skill entrypoint (script + options -> MP4)
remotion.config.ts             render settings + Chrome/Edge auto-detect
tsconfig.json                  TypeScript config
pipeline/
  tts.py                       STAGE 1: edge-tts -> audio.mp3 + timing.json
src/
  index.ts                     Remotion entry (registerRoot)
  Root.tsx                     composition: size + duration
  Whiteboard.tsx               picks the active board, plays the audio
  types.ts                     shared types (Timing, Section, Word, Theme)
  components/
    Board.tsx                  layout + word-by-word writing reveal
    Pen.tsx                    the marker that follows the pen tip
public/
  audio.mp3                    (generated) narration track
  timing.json                  (generated) sections + per-word timings
out/
  video.mp4                    (generated) the finished video
.github/skills/whiteboard-video/SKILL.md   the reusable Copilot skill
```

---

## 9. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `0 word timestamps` | The voice returned only sentence boundaries. `tts.py` requests per-word timing with `edge_tts.Communicate(..., boundary="WordBoundary")` — keep that argument. |
| `No browser found for rendering frames` | Remotion's Chrome download was blocked. Set `browserExecutable` in `config.json`, or install Chrome/Edge (auto-detected). |
| Text overflows the frame | It auto-shrinks to fit; if still tight, split the paragraph into two shorter boards. |
| Render is slow | Every frame is screenshotted in Chrome. Shorter scripts render faster; use `npm run studio` to iterate on visuals without a full render. |
