"""
tts.py  —  Script -> narration + per-word timings.

Reads:   config.json  (voice, rate, pitch)
         script.txt   (paragraphs separated by blank lines = one board each)
Writes:  public/audio.mp3     (single narration track)
         public/timing.json   (sections + per-word start/end in seconds)

Timing comes from edge-tts's native WordBoundary events, so no Whisper /
alignment model is needed. Section boundaries are placed by character
proportion (speech rate is ~constant), and each word keeps its exact
edge-tts timestamp for the on-screen writing sync.
"""

import asyncio
import json
import os
import sys

import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(ROOT, "config.json")
SCRIPT_PATH = os.path.join(ROOT, "script.txt")
PUBLIC_DIR = os.path.join(ROOT, "public")
AUDIO_NAME = "audio.mp3"


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_sections():
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        raw = f.read().replace("\r\n", "\n").replace("\r", "\n")
    blocks = []
    for block in raw.split("\n\n"):
        text = " ".join(line.strip() for line in block.split("\n") if line.strip())
        if text:
            blocks.append(text)
    return blocks


async def synthesize(text, voice, rate, pitch, out_path):
    """Stream audio to disk and collect WordBoundary events."""
    communicate = edge_tts.Communicate(
        text, voice=voice, rate=rate, pitch=pitch, boundary="WordBoundary"
    )
    words = []
    with open(out_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 1e7
                end = (chunk["offset"] + chunk["duration"]) / 1e7
                words.append(
                    {
                        "word": chunk["text"],
                        "start": round(start, 3),
                        "end": round(end, 3),
                    }
                )
    return words


def assign_sections(section_texts, words):
    """Split the flat word stream into sections by character proportion."""
    if not words:
        return [
            {"text": s, "start": 0.0, "end": 0.0, "words": []} for s in section_texts
        ]

    total_end = words[-1]["end"]
    total_chars = sum(len(s) for s in section_texts) or 1

    # Time range for each section based on cumulative character share.
    ranges = []
    acc = 0
    for s in section_texts:
        start_frac = acc / total_chars
        acc += len(s)
        end_frac = acc / total_chars
        ranges.append((start_frac * total_end, end_frac * total_end))

    sections = []
    for i, (r_start, r_end) in enumerate(ranges):
        is_last = i == len(ranges) - 1
        bucket = [
            w
            for w in words
            if w["start"] >= r_start - 1e-6 and (w["start"] < r_end or is_last)
        ]
        if bucket:
            s_start = bucket[0]["start"]
            s_end = bucket[-1]["end"]
        else:
            s_start, s_end = r_start, r_end
        sections.append(
            {
                "text": section_texts[i],
                "start": round(s_start, 3),
                "end": round(s_end, 3),
                "words": bucket,
            }
        )

    # Guarantee contiguous, non-overlapping board switch times.
    for i in range(1, len(sections)):
        sections[i]["start"] = sections[i - 1]["end"]
    return sections


async def main():
    config = load_config()
    section_texts = load_sections()
    if not section_texts:
        print("script.txt is empty — add some text first.", file=sys.stderr)
        sys.exit(1)

    os.makedirs(PUBLIC_DIR, exist_ok=True)
    audio_path = os.path.join(PUBLIC_DIR, AUDIO_NAME)

    full_text = "\n\n".join(section_texts)
    print(f"Synthesizing {len(section_texts)} section(s) with voice {config['voice']}...")
    words = await synthesize(
        full_text,
        config["voice"],
        config.get("rate", "+0%"),
        config.get("pitch", "+0Hz"),
        audio_path,
    )
    print(f"  got {len(words)} word timestamps.")

    sections = assign_sections(section_texts, words)
    duration = (words[-1]["end"] if words else 0.0) + 0.6

    timing = {
        "audio": AUDIO_NAME,
        "durationSec": round(duration, 3),
        "sections": sections,
    }
    with open(os.path.join(PUBLIC_DIR, "timing.json"), "w", encoding="utf-8") as f:
        json.dump(timing, f, ensure_ascii=False, indent=2)

    print(f"Wrote {audio_path}")
    print(f"Wrote {os.path.join(PUBLIC_DIR, 'timing.json')}  (duration {duration:.1f}s)")


if __name__ == "__main__":
    asyncio.run(main())
