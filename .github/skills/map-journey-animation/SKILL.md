---
name: map-journey-animation
description: Cinematic "map journey" animation style for YouTube Shorts. The full screen is a live world or country map and a camera flies between real places (following zoom, curved flight routes, a travelling plane), drops numbered pins at exact coordinates, colours each country, and slides up illustrated landmark cards with flags, coordinates and fact chips. Proven on the Seven Wonders video. Use whenever a script involves multiple places, countries, cities, landmarks, travel, "top N around the world", origins, trade routes, or any "where is it?" story, or when the user asks for "this kind of animation" / the wonders style. Works together with shorts-animation-director (plan) and cartoon-explainer (delivery package).
---

# Map Journey Animation

A premium motion-graphics style where **the map is the stage and the camera tells
the story**. Every scene is part of one continuous journey, so there are no hard
cuts. The camera flies from one place to the next, and information lands exactly
where it belongs on the map.

Reference build: `src/wonders/` (composition `Wonders`, thumbnail `WondersThumbnailV`).
Always start from it; don't rebuild the system from scratch.

**Project root:** `C:\Users\nmalipeddy\source\repos\Learn\whiteboard-studio`

---

## The signature look (keep all of these)

| Element | What it does | Where |
|---|---|---|
| **Full-screen live map** | Ocean background, cream land, thin ink borders. No card frame, so it fills the whole screen | `MapView` in `WondersExplainer.tsx` |
| **Camera flight** | Exponential zoom (`span = from * (to/from)^p`), eased with in-out cubic, with a **zoom-out bump mid-flight** that grows with distance. Feels like a real aerial flight | `cameraAt()` |
| **Follow camera** | The camera centre rides the same curved route as the plane, so the plane stays near the middle of the frame | `arcPt()` used for both |
| **Curved flight route** | The route bows toward the pole and draws on as the plane moves. Earlier legs stay as faded dashes | `arcPts()`, `lines` |
| **Plane** | Points along the tangent of the route, with speed streaks | `VehicleIcon` + `SpeedStreaks` |
| **Slow push-in** | After landing, the camera keeps pushing in about 12% so the frame never goes static | `wonderCam(w, push)` |
| **Pin drop** | Dark teardrop pin with a coloured number disc. It drops from above with a spring bounce, and its **tip sits exactly on the coordinate** | `pinMover()` |
| **Country fill** | The current country blends from cream to its colour when the plane lands; countries already visited stay lightly tinted | `mix()` fills |
| **Top title** | A gold "NUMBER n" badge spins in right away, and the name panel slides in just before landing | `TopTitle` |
| **Landmark card** | Slides up from the bottom after landing. It holds a flat cartoon drawing of the landmark (spring pop, slight tilt that settles, idle float, twinkling sparkles), the flag and country name, a **coordinates chip**, and fact chips that pop in as the narration mentions them | `WonderCard`, `Art.tsx` |
| **Hook** | World view pans slowly. All pins drop in sequence, each with a pop sound, while a matching row of flags pops in below. Big stroked title | beat `i === 0` |
| **Outro** | Pulls back to the world view with every pin and the full route, then a grid of all the illustrations, a question, and a FOLLOW button | beat `i === 8` |
| **Sound** | whoosh on each flight, pop on the pin drop, ding when the card lands, pops for the hook pins, and riser plus boom for the outro | `Sequence` + `public/sfx` |

Colour palette: ocean `#bfe3ff`, land `#f6ecd9`, ink `#20232a`, gold `#ffc93c`, one
colour per place, and white panels (94% opacity) with a thick ink border and a hard
drop shadow. Font: Baloo (`TE_DISPLAY`) for headings and Noto Sans Telugu (`TE_BODY`)
for chips.

---

## Accuracy rules (non-negotiable)

1. **Real coordinates.** Look up each place's actual latitude and longitude (WGS84,
   decimal degrees, west and south are negative). Never estimate them from the map.
   Show them on the card's coordinates chip.
2. **The correct India map.** `data.ts` removes Natural Earth's `IND` shape and
   appends the official outline (`src/india/geo/IND.json`, which includes PoK,
   Gilgit-Baltistan and Aksai Chin) **last**, so India draws on top. Keep this
   behaviour in any new world or Asia map.
3. **Real geography only.** Countries come from the `iso` field in `world.json`
   (Natural Earth 110m, 176 countries, Antarctica removed). Don't invent borders or
   positions.
4. Use `noWrap: true` and a fixed `refLat` on every camera `Region`. Without them,
   the Americas jump across the map and the aspect ratio shifts as the camera moves.

---

## How to make a new map-journey video

0. **Direct it first.** Use the shorts-animation-director skill. The storyboard
   should be: hook (all pins) → one flight per place → outro pull-back. Match the
   order of places to the narration.
1. **Script** → `<slug>-script.txt`: a hook paragraph, one paragraph per place
   (start with "Number N. Name, Country." when it's a countdown), and an outro
   paragraph. Remove emoji and markdown.
2. **Copy the module**: `src/wonders/` → `src/<slug>/`. Rename the components
   (`<Slug>Explainer`, `<Slug>ThumbnailV`) and register both in `src/Root.tsx`.
3. **Data** (`data.ts`): one entry per place.
   ```ts
   { num, id, name, country, iso, lon, lat, color, span, facts: ["short", "chips"] }
   ```
   - `span` sets the camera zoom in degrees of longitude. Use about 22 for small
     countries (Jordan), about 26 for Italy, 36–45 for mid-size ones (Mexico,
     India), and 60+ for huge ones (Brazil, China, Russia).
   - `facts` should be 2 short chips taken **from the script**.
   - Set `WORLD_VIEW` (`lon`, `lat`, `span`) so the hook and outro frame every
     place. Crop empty ocean to make the map larger.
   - For a single-country journey (for example, cities of India), set
     `WORLD_VIEW` to that country and use smaller spans.
4. **Illustrations** (`Art.tsx`): one flat cartoon SVG per place on a 300×300
   viewBox. Use a gradient sky, ground, a landmark silhouette built from simple
   shapes, a 5px ink outline, and 2–3 flat colours. Add a flag in `FLAGS` for each
   new country (simple shapes, correct colours).
5. **Beat indices.** `BeatView` assumes hook = 0, places = 1..N, outro = N+1. If N
   isn't 7, update the `i === 8`, `i <= 7` and `prev = i === 8 ? 7 : ...` checks.
   Search for `8` and `7` in the file.
6. **Generate**:
   `node generate.mjs --file <slug>-script.txt --voice en-IN-PrabhatNeural --size vertical --comp <Comp> --out out/<slug>.mp4`
   `pipeline/tts.py` syncs scene cuts to each paragraph's first spoken word.
7. **Check stills** with `view_image` before the full render: the hook (about 4s),
   one frame after a landing, one mid-flight, a place in India (to confirm the
   outline), and the outro.
8. **Thumbnail**: adapt `WondersThumbnailV`. Use a big stroked title, the map with
   all pins, a collage of 3–4 illustrations at slight tilts with hard shadows, a
   curiosity banner and a surprised character. Check that nothing overlaps.
9. **Deliver** the full package (see cartoon-explainer): MP4, 9:16 thumbnail,
   Telugu `.srt` with cues split at sentence starts using the word timings in
   `public/timing.json`, and the YouTube package with chapters taken from section
   starts.

---

## Timing constants (tuned; change only with reason)

- Flight: 1.8s between places, 2.2s for the first zoom-in from the world view and
  the final pull-out.
- Pin drop: at the end of the flight, with a spring (damping 9, mass 0.6) falling
  about 220px.
- Card: slides up at flight + 0.15s. The illustration pops at flight + 0.4s. Fact
  chips appear at flight + 1.2s and at about 55% of the beat.
- Hook pins: at `1.0 + 0.45 × k` seconds.
- Push-in after landing: 12% over the rest of the beat.
- Mid-flight zoom-out: `min(120, distance × 0.9)` degrees.

---

## Documentary variant: dark 3D geopolitical map (wars, conflicts, borders)

Reference build: `src/warmap/` (composition `WarMap`, thumbnail `WarMapThumbnailV`).
Use it when the user asks for a serious, documentary, non-cartoon look.

- **Look:**
  - A dark map, tilted in 3D (`rotateX(30deg)` inside `perspective`).
  - Countries drawn as raised slabs: a dark side face offset 12px, then the top
    face.
  - Glowing borders (Russia red, Ukraine gold), a faint grid, drifting particles,
    a vignette, and HUD blocks with corner brackets that type text in.
  - Anton for headlines, Inter for labels.
- **Camera:**
  - One continuous camera built from word-synced keyframes (`buildKeys`), each
    shot cued to a spoken word ("while", "Belarus", "Crimea"…).
  - Exponential zoom, motion blur that grows with camera speed, and a flash plus
    a small shake on the key date.
  - The camera target sits at `FOCUS_Y` (between the headline and the legend).
- **Upright elements on the tilted map:**
  - Flags, labels and markers are HTML counter-rotated with `rotateX(-TILT)` so
    they stand up on the map.
  - They scale with the zoom (`bScale`) and fade in wide shots (`flagsOn`,
    `minorOn`) so they don't pile up.
- **Motion:**
  - Flags ride the tip of each route.
  - Routes are glowing polylines with a dash that flows along them and an
    arrowhead.
  - Areas light up after their route has drawn.
- **Accuracy (required):**
  - Use `src/warmap/europe.json`, built by `pipeline/make_europe.mjs` from Natural
    Earth 50m with internationally recognised borders: **Crimea is moved from
    Russia into Ukraine**, and India uses the official outline.
  - Natural Earth draws Crimea inside Russia, so never use raw Natural Earth
    RUS/UKR shapes for this topic.
  - Disputed or occupied areas are hatched and labelled. Shaded areas are marked
    "approx." and **clipped to the country's land** (`clipPath` `ukrLand`) so they
    never cover sea.
  - Never shade a whole country unless that actually happened. Show later events
    that matter, such as the withdrawal from the Kyiv region.
  - Keep an on-screen legend and a borders note.
  - No explosions, gore or casualties.
- **Word lookups:** `at()` prefers exact word matches, so "Russian" doesn't
  trigger a cue meant for "Russia".
- **Thumbnail:** reuse `WarScene` at the key moment with `hud={false}`, then add a
  flag VS flag row, a big title and a year strip.

### Historical-era variant: moving front lines (Korean War build, `src/korea/`)

- **Region data:**
  - Build it with
    `node pipeline/make_europe.mjs <out.json> lonMin lonMax latMin latMax`
    (Natural Earth 50m, recognised borders, the official India outline).
  - Set a finer simplification value in the script's `EPS` table for small
    countries you zoom into.
- **Period-correct borders:**
  - Don't show borders that didn't exist yet. Korea in 1950 is drawn as **one
    peninsula**: stroke both halves first, then fill them with a same-colour
    stroke to hide the modern border seam.
  - The only division is the 38th parallel. The armistice line appears only
    from 1953.
  - Use period names (USSR, not Russia).
- **Front line:**
  - One polyline, stored as a latitude for each fixed longitude (`LONS`, `FRONTS`).
  - It morphs between dated positions and extends past the coasts, then is clipped
    to land.
  - The areas north and south of it are tinted as "controlled (approx.)".
- **Motion tied to the narration:**
  - The first front move follows the invading flag's progress, so the front only
    moves once the flag crosses the parallel.
  - Split flag journeys at sentence boundaries (`nkProgress`) so each crossing
    happens during the sentence that mentions it.
- **Declutter:**
  - Give each side's flag its own anchor point, and fade superseded flags.
  - Fade country labels in close-ups (`span < 8`).
- **Documentary accent:** a brief sepia and scanline filter on the key
  historical beat (for example, Seoul captured).

## Adapting the style beyond maps

The same principles work for other topics. Keep one continuous stage, a
motivated camera, information landing on its subject, and cards that slide in.
- **Timeline:** a horizontal track instead of a map. The camera flies between
  years, pins become date markers, and cards show events.
- **Inside a country or city:** use the country's GeoJSON (for example
  `src/india/geo/`) as the stage, with the same camera and pins.
- **Comparisons:** fly between two places and show a VS card (see the `compare`
  beat in cartoon-explainer).

---

## Channel call-to-action (standard on every video)

Every map-journey or documentary video ends the same way, without the user asking:
1. **Script:** append the final paragraph
   "Please like, share and subscribe to my YouTube channel."
2. **End card:** during that section, render `CtaCard` (`src/cartoon/Nudge.tsx`) with
   `likeT`, `shareT` and `subT` from the spoken word times. Place it `top` in empty
   sea or background (about 1380 on the dark maps), not over labels.
3. **Nudges:** render `<SubscribeNudge T={T} until={ctaStart} top={330} />` inside the
   HUD so the bell and Subscribe button appear every 20s. Add a `ding` at `t + 1.1`
   for each `nudgeTimes(ctaStart)`.
4. **HUD:** add a final HUD block (for example "SUBSCRIBE") for the CTA section.
5. **Subtitles:** add a Telugu cue: "దయచేసి నా YouTube ఛానెల్‌ని లైక్, షేర్, సబ్‌స్క్రైబ్ చేయండి!"
6. **Length:** keep the total under 3 minutes for Shorts.

Reference: `src/korea/KoreaWar.tsx`. Cartoon-style videos place it the same way.

## Pitfalls already hit (don't repeat them)

- **`mix()` returns `rgb(...)`.** Never pass its output back into `mix()`, or the
  fill turns black. Compute a single blend instead:
  `mix(LAND, color, 0.35 + 0.65 * t)`.
- **Pins disappear on same-coloured countries.** Keep pin bodies dark with a white
  outline and a coloured disc.
- **The pin tip must be the anchor.** The mover container is 2.6 × the pin size
  tall, so the pin's tip sits at the centre point.
- **Tall text panels.** Baloo has large ascenders, so add extra top padding (for
  example `26px 24px 8px`) so text looks vertically centred.
- **Big files.** The map changes every frame, so expect roughly 0.7 MB per second
  (a 112s video is about 80 MB). YouTube accepts this.
- **Don't edit source during a render.** Remotion bundles at the start, so edits
  made during a render don't show up in it.
