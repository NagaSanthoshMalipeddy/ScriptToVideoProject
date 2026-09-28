---
name: viral-script-writer
description: Write a viral GlobeTales YouTube script (Short or long-form) from just a topic name or title, using the 5-part viral formula (Hook → Setup → Body with But/Therefore twists → Aha! climax → seamless CTA), the 3 golden rules (5th-grader simple, write visually with [bracketed] animation cues, short punchy sentences), accurate facts and India-relatable hooks. Use FIRST whenever the user (or the daily video job) gives only a topic/title and needs a narration script, or asks to "write a viral script", "script for GlobeTales", "use the 5-part formula". Output plugs straight into pipeline/tts.py (cues and headings are not spoken) and then shorts-animation-director / cartoon-explainer.
---

# Viral script writer (GlobeTales)

Turns a **topic name** (optionally a catchy title) into a ready-to-voice script that
hooks fast, keeps people watching, and ends on a subscribe. Channel: **GlobeTales**:
history, maps and stories from around the world, for a mainly **Indian audience**.

## Inputs
- **Topic** (required), e.g. "Diomede Islands".
- **Title / hook** (optional), e.g. "USA and Russia Are Only 4 km Apart?! 😱". The
  script must pay off the title's promise.
- **Format:** Short (9:16, default) or long (16:9). **Language:** English unless asked.

## Length targets (edge-tts ≈ 2.5 words/s at +0%)
| Format | Duration | Words | Beats (paragraphs) |
|---|---|---|---|
| Short | 60–100 s (hard max 3 min) | 150–250 | 14–24 |
| Long | 5–8 min | 750–1,200 | 60–130 |

## The 5-part viral formula

| Part | Short timing | Long timing | Job |
|---|---|---|---|
| 1. 🪝 **Hook** | 0–3 s | 0–10 s | Open with the mystery or action promised in the title/thumbnail. **Never** start with the channel name, "hi guys" or "in this video". |
| 2. 🌍 **Setup** | 3–12 s | 10–30 s | Why should *they* care? Stakes, urgency, curiosity or FOMO. Tie it to India / everyday life when it's true. |
| 3. 📖 **Body** | 12–50 s | 30 s – end−60 s | The story, told with the **But / Therefore** rule (below). 2–4 twists for a Short, 6–12 for a long video. |
| 4. 🤯 **Aha! climax** | last 10–15 s | last 30–60 s | Answer the hook's question clearly, with the single most surprising fact. The viewer should think "Wow, I never knew that!". |
| 5. 🔔 **Seamless CTA** | final 5 s | final 10 s | One bridge sentence that flows from the aha into subscribing, then the fixed CTA line. |

### Hook patterns (pick one, adapt to the title)
- **Shocking number:** "Russia and America? They're only 4 kilometres apart."
- **Impossible question:** "Why is there no bridge between Europe and Africa… when they're just 14 km apart?"
- **You-were-lied-to:** "Dubai is not a country. And most people get this wrong."
- **Countdown/visual action:** "Watch this line on the map. Animals will not cross it."
- **India twist:** "Chile is longer than India. But it's thinner than Hyderabad to Vijayawada." (only if true)

### The But / Therefore rule (the body)
Never chain "and then… and then…". Each beat must **cause** the next (THEREFORE)
or **flip** it (BUT). That gives you a plot twist every 5–10 seconds.
- ❌ "Spain owns Llívia. And then France grew around it. And then…"
- ✅ "In 1659 Spain gave France 33 villages. **But** Llívia was a *town*, not a village. **Therefore** it stayed Spanish, and today it's trapped inside France."
Use "but", "so", "that's why", "which means", "until…" as the spine words.

### The seamless CTA (always the last two paragraphs)
1. A bridge sentence tied to the topic, for example:
   - "The world is full of borders like this. And we map a new one every day."
   - "If this blew your mind, the next map will too."
2. Then exactly: `Please like, share and subscribe to my YouTube channel.`
   (The renderer keys the CtaCard and subscribe animations off this line. Keep it verbatim.)

## The 3 golden rules
1. **5th-grader rule.** Explain it to a 10-year-old. Swap jargon for plain words:
   | Instead of | Say |
   |---|---|
   | bilateral economic sanctions | they cut off their money |
   | territorial sovereignty | who the land belongs to |
   | geopolitical tensions | the two sides didn't trust each other |
   | exclave | a piece of a country stuck inside another |
   | armistice | they agreed to stop shooting, but never made peace |
2. **Write visually.** Put the animation idea in `[brackets]` on its own line **above**
   the words it goes with. Use the cue vocabulary below so the director and builder
   skills can map it straight to components.
3. **Short, punchy sentences.** 12 words or fewer on average, one idea each, 1–3
   sentences per paragraph. Fragments are fine ("Four kilometres. That's it."). Put
   numbers in digits the voice reads well ("4 km", "1867", "220 million").

## Visual cue vocabulary (use inside [ ])
`[MAP: zoom to Bering Strait]` · `[PIN: Big Diomede 🇷🇺 / Little Diomede 🇺🇸]` · `[ROUTE: glowing line London → Delhi]`
`[FLAG: Iraqi flag moves east]` · `[ARROW: from Spain into France]` · `[BORDER GLOW: US–Canada]`
`[TEXT POP: "4 km"]` · `[COUNTER: 0 → 220,000,000 trees]` · `[VS CARD: Holland vs Netherlands]`
`[CHART: bars — population by state]` · `[CHARACTER: shocked face]` · `[CROWD: people cheering]`
`[CLOCK: 23:59 → 00:00]` · `[SPLIT SCREEN: today / tomorrow]` · `[SFX: whoosh | boom | ding | pop]`
`[LOGO: company]` · `[TIMELINE: 1934 → 1942]` · `[CAMERA: fast zoom out to globe]`

## File format (plugs into pipeline/tts.py)
```text
# HOOK
[MAP: zoom from space to the Bering Strait]
[TEXT POP: "4 km"]
Russia and America. Enemies for decades.
But their borders are only 4 kilometres apart.

# SETUP
[PIN: Big Diomede (Russia) · Little Diomede (USA)]
Two tiny islands. Two superpowers. One icy strait.

# BODY
...

# AHA
...

# CTA
Every border on Earth has a story like this. And we map a new one every day.

Please like, share and subscribe to my YouTube channel.
```
- **One spoken beat per paragraph**, separated by a blank line. Each paragraph becomes
  one timed section.
- `#` heading lines and `[bracket]` cues are **stripped by tts.py** and never spoken.
  A paragraph that holds only cues disappears. So keep the cue in the same
  paragraph as its words.
- Save the file as `<slug>-script.txt` (the daily job saves it in its output folder),
  then copy it to `script.txt` for TTS.

## Accuracy & safety (non-negotiable)
- **Accuracy:** every number, date and distance must be real. When unsure, round
  honestly ("about", "nearly") or pick another fact. Clickbait must be **true**
  clickbait, meaning the video actually pays off the title.
- **Neutrality:** stay neutral on politics, wars and religion. No gore, and no
  glorifying violence. Describe the human cost respectfully.
- **Maps of India:** use the official boundary (see cartoon-explainer "India map rules").
- **India angles:** use them only when true (e.g. IST is one time zone, +91, Indian
  Antarctic stations Maitri and Bharati).

## Self-check before saving
- [ ] The first sentence delivers the title's promise. There's no intro or greeting.
- [ ] The setup says why the viewer should care within 12 s (Short) or 30 s (long).
- [ ] There are at least 2 BUT and 1 THEREFORE turns (Short), or at least 6 turns (long).
- [ ] The aha answers the hook's exact question with one big fact.
- [ ] The last two paragraphs are a bridge sentence plus the verbatim CTA line.
- [ ] Every beat has a [visual cue]. Sentences are short. There's no jargon.
- [ ] The word count fits the format. The facts are double-checked.

## Hand-off
Next, run **shorts-animation-director**, which turns the [cues] into the storyboard.
Then build with **cartoon-explainer** or **map-journey-animation**, and write the
**youtube-upload-package**, using the given title as option 1.
