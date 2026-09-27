"""
transcribe.py  —  User voiceover -> public/audio.mp3 + public/timing.json (word-synced).

Usage: python pipeline/transcribe.py <audio file> [out_script.txt] [model] [language]

Uses faster-whisper (local, CPU) with word timestamps. Sections are sentences,
so scene cuts land on the first word of each sentence, exactly like tts.py output.
"""

import json
import os
import shutil
import subprocess
import sys

from faster_whisper import WhisperModel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")


def main():
    src = sys.argv[1]
    script_out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "script.txt")
    model_name = sys.argv[3] if len(sys.argv) > 3 else "large-v3-turbo"
    language = sys.argv[4] if len(sys.argv) > 4 else None

    os.makedirs(PUBLIC, exist_ok=True)
    audio_out = os.path.join(PUBLIC, "audio.mp3")
    if src.lower().endswith(".mp3"):
        shutil.copyfile(src, audio_out)
    else:
        ff = subprocess.check_output(["node", "-e", "console.log(require('ffmpeg-static'))"], cwd=ROOT, text=True).strip()
        subprocess.check_call([ff, "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-b:a", "192k", audio_out])

    print(f"Transcribing {src} with faster-whisper '{model_name}' (CPU)...")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    prompt = os.environ.get("WHISPER_PROMPT")
    # No conditioning on previous text + sensitive VAD stops Whisper looping or skipping over music beds.
    segments, info = model.transcribe(
        src,
        word_timestamps=True,
        language=language,
        beam_size=5,
        condition_on_previous_text=False,
        repetition_penalty=1.15,
        no_repeat_ngram_size=4,
        vad_filter=True,
        vad_parameters={"threshold": 0.2, "min_silence_duration_ms": 350, "speech_pad_ms": 250},
        initial_prompt=prompt,
    )
    print(f"  language: {info.language} ({info.language_probability:.2f}), duration {info.duration:.1f}s")

    words = []
    for seg in segments:
        for w in seg.words or []:
            t = w.word.strip()
            if t:
                words.append({"word": t, "start": round(w.start, 3), "end": round(w.end, 3)})

    # One section per sentence.
    sections, cur = [], []
    for w in words:
        cur.append(w)
        if w["word"][-1] in ".?!…" and not w["word"].endswith("..") or w["word"].endswith("…"):
            sections.append(cur)
            cur = []
    if cur:
        sections.append(cur)

    out = []
    for ws in sections:
        out.append({"text": " ".join(x["word"] for x in ws), "start": ws[0]["start"], "end": ws[-1]["end"], "words": ws})
    for i in range(1, len(out)):
        out[i - 1]["end"] = out[i]["start"]

    duration = (words[-1]["end"] if words else info.duration) + 0.6
    with open(os.path.join(PUBLIC, "timing.json"), "w", encoding="utf-8") as f:
        json.dump({"audio": "audio.mp3", "durationSec": round(max(duration, info.duration), 3), "sections": out}, f, ensure_ascii=False, indent=2)
    with open(script_out, "w", encoding="utf-8") as f:
        f.write("\n\n".join(s["text"] for s in out) + "\n")
    print(f"  {len(words)} words, {len(out)} sections -> public/timing.json, {os.path.relpath(script_out, ROOT)}")


if __name__ == "__main__":
    main()
