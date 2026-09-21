"""Generate short sample MP3s so you can hear different edge-tts voices.

Run:  python pipeline/voice_samples.py
Output: out/voice-samples/<voice>.mp3  (one clip per voice)
Edit the SAMPLES dict to add/remove voices.
"""
import asyncio
import os

import edge_tts

EN = "Hello. This is a sample voice for your explainer video, counting one, two, three."

SAMPLES = {
    # Telugu
    "te-IN-MohanNeural": "నమస్కారం, ఇది మీ వీడియో కోసం ఒక నమూనా వాయిస్. ఒకటి, రెండు, మూడు.",
    "te-IN-ShrutiNeural": "నమస్కారం, ఇది మీ వీడియో కోసం ఒక నమూనా వాయిస్. ఒకటి, రెండు, మూడు.",
    # Hindi
    "hi-IN-MadhurNeural": "नमस्ते, यह आपके वीडियो के लिए एक नमूना आवाज़ है। एक, दो, तीन।",
    "hi-IN-SwaraNeural": "नमस्ते, यह आपके वीडियो के लिए एक नमूना आवाज़ है। एक, दो, तीन।",
    # Indian English
    "en-IN-PrabhatNeural": EN,
    "en-IN-NeerjaNeural": EN,
    # US English
    "en-US-AndrewNeural": EN,
    "en-US-AriaNeural": EN,
    # UK English
    "en-GB-RyanNeural": EN,
    # Ukrainian / Russian (topic-relevant)
    "uk-UA-OstapNeural": EN,
    "ru-RU-DmitryNeural": EN,
}

OUT_DIR = os.path.join("out", "voice-samples")


async def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for voice, text in SAMPLES.items():
        path = os.path.join(OUT_DIR, f"{voice}.mp3")
        await edge_tts.Communicate(text, voice).save(path)
        print(f"wrote {path}")
    print(f"\nDone. {len(SAMPLES)} samples in {OUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
