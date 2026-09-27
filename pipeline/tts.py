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
import unicodedata

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


def _norm(s):
    # Letters, digits and combining marks only (keeps Telugu/Hindi vowel signs).
    return "".join(
        ch.lower() for ch in s if ch.isalnum() or unicodedata.category(ch).startswith("M")
    )


def assign_sections(section_texts, words):
    """Split the word stream into sections by locating each spoken word in the script.

    Falls back to character proportion for words that can't be matched.
    """
    if not words:
        return [
            {"text": s, "start": 0.0, "end": 0.0, "words": []} for s in section_texts
        ]

    normed = [_norm(s) for s in section_texts]
    bounds = []
    acc = 0
    for n in normed:
        bounds.append((acc, acc + len(n)))
        acc += len(n)
    full = "".join(normed)
    total_end = words[-1]["end"] or 1

    def section_of(pos):
        for i, (a, b) in enumerate(bounds):
            if pos < b:
                return i
        return len(bounds) - 1

    buckets = [[] for _ in section_texts]
    ptr = 0
    last = 0
    for w in words:
        token = _norm(w["word"])
        idx = full.find(token, ptr) if token else -1
        if idx != -1 and idx - ptr <= 120:
            ptr = idx + len(token)
            sec = section_of(idx)
        else:
            sec = section_of(int(len(full) * w["start"] / total_end))
        sec = max(sec, last)
        last = sec
        buckets[sec].append(w)

    sections = []
    prev_end = 0.0
    for i, bucket in enumerate(buckets):
        if bucket:
            s_start, s_end = bucket[0]["start"], bucket[-1]["end"]
        else:
            s_start = s_end = prev_end
        prev_end = s_end
        sections.append(
            {
                "text": section_texts[i],
                "start": round(s_start, 3),
                "end": round(s_end, 3),
                "words": bucket,
            }
        )

    # Switch boards at the first word of each section; the gap before it belongs to the previous board.
    for i in range(1, len(sections)):
        sections[i - 1]["end"] = sections[i]["start"]
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
