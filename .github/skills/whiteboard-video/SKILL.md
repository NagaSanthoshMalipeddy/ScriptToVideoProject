---
name: whiteboard-video
description: Turn a plain-text script into a narrated whiteboard animation video (handwriting drawn word-by-word, synced to a text-to-speech voiceover, exported as MP4). Use when the user asks to create a whiteboard / doodle / handwriting / explainer / narrated animation video from a script, text, topic, or paragraphs. Supports many languages and voices (edge-tts) and vertical / landscape / square output.
---

# Whiteboard Video

Generate a narrated whiteboard-animation MP4 from text. The pipeline lives in this
project (`whiteboard-studio`): edge-tts speaks the script and returns per-word
timings, then Remotion draws the words in a handwriting font with a marker that
follows the pen tip — perfectly synced to the voice.

**Project root:** `C:\Users\nmalipeddy\source\repos\Learn\whiteboard-studio`
Always run commands from that folder.

## When to use
Trigger this skill whenever the user wants a video made from words: "make a
whiteboard video", "turn this script into an explainer", "doodle/handwriting
animation", "narrated short from this text", etc.

## The one command

From the project root, run **one** command:

```powershell
node generate.mjs --file <script-path> [--voice <voice>] [--size <preset>] [--rate <rate>] [--out <path>]
```

It runs the whole pipeline (narration + timings -> typecheck -> render) and writes
the MP4. On success it prints `Done  ->  <absolute path>`.

### Options
| Flag | Meaning | Default |
|------|---------|---------|
| `--file <path>` | Script file. **Blank line = new board.** | — |
| `--text "..."` | Inline script; use `\n\n` between boards. | — |
| `--voice <voice>` | Any edge-tts voice. | `en-US-AndrewNeural` |
| `--rate <rate>` | Speaking speed, e.g. `-4%`, `+10%`. | `-4%` |
| `--size <preset>` | `vertical` (1080x1920), `landscape` (1920x1080), `square` (1080x1080). | `vertical` |
| `--out <path>` | Output MP4 path. | `out/video.mp4` |

If neither `--file` nor `--text` is given, the existing `script.txt` is used.

## How to run it (step by step)

1. **Write the script.** Turn the user's request into narration text, **one idea
   per paragraph**, separated by a blank line. Keep sentences short and spoken —
   they are read aloud. Save it to a file, e.g. `my-script.txt`, or pass `--text`.
2. **Pick voice / size** from the user's intent:
   - Language -> voice. Examples: English `en-US-AndrewNeural`,
     Telugu `te-IN-MohanNeural`, Hindi `hi-IN-MadhurNeural`,
     Spanish `es-ES-AlvaroNeural`. To list all: `python -m edge_tts --list-voices`.
   - Shorts/Reels/TikTok -> `vertical`; YouTube -> `landscape`.
3. **Generate:**
   ```powershell
   node generate.mjs --file my-script.txt --voice en-US-AndrewNeural --size vertical
   ```
   This takes ~1-3 minutes (renders every frame in headless Chrome).
4. **Report** the printed output path to the user (default `out/video.mp4`).

## First-time setup (only if it fails on a fresh machine)

Run these once, then retry the generate command:

```powershell
npm install                 # Node deps (Remotion, React)
python -m pip install edge-tts
```

- **A Chromium browser is required** (Chrome or Edge). Remotion's bundled Chrome
  download is often blocked; `remotion.config.ts` auto-detects an installed
  Chrome/Edge. To force one, add `"browserExecutable": "C:\\path\\to\\chrome.exe"`
  to `config.json`.

## Editing the look
`config.json` controls colors and font: `theme.background`, `theme.ink`
(handwriting color), `theme.accent` (marker color). Preview interactively with
`npm run studio`.

## Troubleshooting
- **"0 word timestamps"** — the voice returned only sentence boundaries. The
  pipeline requests per-word timing via `edge_tts.Communicate(..., boundary="WordBoundary")`
  in `pipeline/tts.py`; keep that argument.
- **"No browser found for rendering frames"** — set `browserExecutable` in
  `config.json` (see above).
- **Text overflows the frame** — it auto-shrinks to fit; if still tight, split the
  paragraph into two shorter boards.

## What the pieces are
- `generate.mjs` — this skill's entrypoint (script + options -> MP4).
- `pipeline/tts.py` — edge-tts -> `public/audio.mp3` + `public/timing.json`.
- `src/` — Remotion renderer (`Whiteboard.tsx`, `components/Board.tsx`, `components/Pen.tsx`).
- `config.json` — voice, size, and theme settings.
