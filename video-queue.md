# Daily video queue

Add one topic per line as `- [ ] topic`. Each day the job takes the **first unchecked** topic and makes it.

Optional tags at the end of the line:
- `[short]` makes a 9:16 Short. This is the default.
- `[long]` makes a 16:9 documentary.
- `[both]` makes a Short plus a 16:9 documentary.
- Any other note in brackets is passed to the agent, e.g. `[Telugu voice]` or `[use my audio: C:\path\file.mp3]`.

The runner updates the status marks: `[ ]` pending, `[~]` running, `[x]` done, `[!]` failed (see `out/daily/logs/`).
To retry a failed topic, change `[!]` back to `[ ]`.

Example lines (these are ignored, because only lines that start with `- [ ]` count):
    - [ ] The Cuban Missile Crisis: 13 days on the brink [short]
    - [ ] Why Singapore left Malaysia in 1965 [both]
    - [ ] How the Suez Canal changed world trade [long]

## Queue
- [x] Longest Distance to Travel Around the World [title: It Takes 27 YEARS to Walk Around the World?! 🤯]  (done 2026-09-27 -> out/daily/2026-09-27-longest-distance-to-travel-around-the-world)
- [x] The Darien Gap [title: The Road That Just ENDS — Why No One Can Cross the Darien Gap 😨] [both]  (done 2026-09-28 -> out/daily/2026-09-27-the-darien-gap)
- [x] Spain's Unusual Borders [title: Spain's Borders Are CRAZY — A Spanish Town Inside France?! 🇪🇸] [both]  (done 2026-09-28 -> out/daily/2026-09-27-spain-s-unusual-borders)
- [x] Population Distribution in the USA [title: Half of America Lives in Just 9 States! 🇺🇸] [both]  (done 2026-09-28 -> out/daily/2026-09-27-population-distribution-in-the-usa)
- [x] US–Russia Distance and the Diomede Islands [title: USA and Russia Are Only 4 km Apart?! 😱] [both]  (done 2026-09-28 -> out/daily/2026-09-27-us-russia-distance-and-the-diomede-islands)
- [x] Why Planes Avoid Tibet [title: Why Pilots Avoid Flying Over Tibet — The Himalayan Danger ✈️] [both]  (done 2026-09-28 00:25 -> out/daily/2026-09-27-why-planes-avoid-tibet)
- [x] How Time Zones Work [title: Why Time Zones Are So WEIRD — And Why India Has Just ONE ⏰] [both]  (done 2026-09-28 14:54 -> out/daily/2026-09-28-how-time-zones-work)
- [x] Great Plains Shelterbelt [title: USA Planted a "Great Wall" of 220 Million Trees! 🌳] [both]  (done 2026-09-28 17:18 -> out/daily/2026-09-28-great-plains-shelterbelt)
- [x] Jet Streams and Transatlantic Flights [title: The Invisible Highway in the Sky That Makes Flights Faster ✈️] [short]  (done 2026-09-28 19:59 -> out/daily/2026-09-28-jet-streams-and-transatlantic-flights)
- [x] Chile's Geography and Shape [title: Chile Is Longer Than India — But Super Thin! Why? 🇨🇱] [short]  (done 2026-09-28 20:28 -> out/daily/2026-09-28-chile-s-geography-and-shape)
- [x] Wallace Line [title: Animals Refuse to Cross This Invisible Line! 🐅] [short]  (done 2026-09-28 20:47 -> out/daily/2026-09-28-wallace-line)
- [x] Country Closest to Space [title: Not Everest! This Country Is Closest to Space 🚀] [short]  (done 2026-09-28 21:09 -> out/daily/2026-09-28-country-closest-to-space)
- [x] Märket Island Border [title: Sweden and Finland Share a Tiny Island With a Zig-Zag Border! 🏝️] [short]  (done 2026-09-28 21:25 -> out/daily/2026-09-28-m-rket-island-border)
- [x] Bermuda Triangle [title: The Bermuda Triangle Mystery: SOLVED? 🔺😱] [short]  (done 2026-09-29 -> out/daily/2026-09-29-bermuda-triangle)
- [x] Strait of Gibraltar [title: Europe and Africa Are Only 14 km Apart — So Why No Bridge? 🌉] [both]  (done 2026-09-29 14:55 -> out/daily/2026-09-29-strait-of-gibraltar)
- [x] The Darien Gap [title: The Road That Just ENDS — Why No One Can Cross the Darien Gap 😨] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-27-the-darien-gap/the-darien-gap-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 15:13 -> out/daily/2026-09-29-the-darien-gap)
- [x] Spain's Unusual Borders [title: Spain's Borders Are CRAZY — A Spanish Town Inside France?! 🇪🇸] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-27-spain-s-unusual-borders/spain-s-unusual-borders-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 15:30 -> out/daily/2026-09-29-spain-s-unusual-borders)
- [x] Population Distribution in the USA [title: Half of America Lives in Just 9 States! 🇺🇸] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-27-population-distribution-in-the-usa/population-distribution-in-the-usa-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 15:50 -> out/daily/2026-09-29-population-distribution-in-the-usa)
- [x] US–Russia Distance and the Diomede Islands [title: USA and Russia Are Only 4 km Apart?! 😱] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-27-us-russia-distance-and-the-diomede-islands/us-russia-distance-and-the-diomede-islands-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 16:06 -> out/daily/2026-09-29-us-russia-distance-and-the-diomede-islands)
- [x] Why Planes Avoid Tibet [title: Why Pilots Avoid Flying Over Tibet — The Himalayan Danger ✈️] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-27-why-planes-avoid-tibet/why-planes-avoid-tibet-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 16:30 -> out/daily/2026-09-29-why-planes-avoid-tibet)
- [x] How Time Zones Work [title: Why Time Zones Are So WEIRD — And Why India Has Just ONE ⏰] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-how-time-zones-work/how-time-zones-work-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 16:48 -> out/daily/2026-09-29-how-time-zones-work)
- [x] Great Plains Shelterbelt [title: USA Planted a "Great Wall" of 220 Million Trees! 🌳] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-great-plains-shelterbelt/great-plains-shelterbelt-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 17:08 -> out/daily/2026-09-29-great-plains-shelterbelt)
- [x] Jet Streams and Transatlantic Flights [title: The Invisible Highway in the Sky That Makes Flights Faster ✈️] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-jet-streams-and-transatlantic-flights/jet-streams-and-transatlantic-flights-short-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 17:30 -> out/daily/2026-09-29-jet-streams-and-transatlantic-flights)
- [x] Chile's Geography and Shape [title: Chile Is Longer Than India — But Super Thin! Why? 🇨🇱] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-chile-s-geography-and-shape/chile-s-geography-and-shape-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 17:45 -> out/daily/2026-09-29-chile-s-geography-and-shape)
- [x] Wallace Line [title: Animals Refuse to Cross This Invisible Line! 🐅] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-wallace-line/wallace-line-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 18:01 -> out/daily/2026-09-29-wallace-line)
- [x] Country Closest to Space [title: Not Everest! This Country Is Closest to Space 🚀] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-country-closest-to-space/country-closest-to-space-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 18:20 -> out/daily/2026-09-29-country-closest-to-space)
- [x] Märket Island Border [title: Sweden and Finland Share a Tiny Island With a Zig-Zag Border! 🏝️] [short] [note: REMAKE in the current style: reuse the facts and narration from out/daily/2026-09-28-m-rket-island-border/m-rket-island-border-script.txt, keep it accurate; every map scene must use SatelliteMap + countryGeom; use new component and composition names ending in Sat so the old video stays untouched]  (done 2026-09-29 18:37 -> out/daily/2026-09-29-m-rket-island-border)
- [x] Korean Peninsula Conflict [title: 70+ Years Later, North & South Korea Are STILL at War! 🇰🇷] [both]  (done 2026-09-30 14:47 -> out/daily/2026-09-30-korean-peninsula-conflict)
- [x] Stalag Luft III Great Escape [title: The Prisoners Who Dug Their Way Out of a Nazi Camp ⛏️] [both]  (done 2026-10-01 14:35 -> out/daily/2026-10-01-stalag-luft-iii-great-escape)
- [x] UAE, Dubai and Abu Dhabi [title: Dubai Is NOT a Country! UAE vs Dubai vs Abu Dhabi Explained 🇦🇪] [both]  (done 2026-10-02 14:51 -> out/daily/2026-10-02-uae-dubai-and-abu-dhabi)
- [x] Oklahoma Panhandle [title: Why Oklahoma Has a Weird "Handle" on the Map 🗺️] [both]  (done 2026-10-03 14:47 -> out/daily/2026-10-03-oklahoma-panhandle)
- [x] Escape from Alcatraz 1962 [title: How 3 Prisoners Escaped Alcatraz on a Homemade Raft 🛶] [both]  (done 2026-10-04 15:05 -> out/daily/2026-10-04-escape-from-alcatraz-1962)
- [ ] American Towns Surrounded by Canada [title: American Towns TRAPPED Inside Canada! 🇺🇸🇨🇦] [both]
- [ ] Longest Open-Water Swimming Route [title: The Longest Swim Without Touching Land — Is It Even Possible? 🌊] [both]
- [ ] Holland and the Netherlands [title: Holland Is NOT the Netherlands?! 🇳🇱] [both]
- [ ] East German Balloon Escape 1979 [title: The Family Who Escaped East Germany in a Homemade Balloon 🎈] [both]
- [ ] Centralia Underground Fire [title: This Town Has Been Burning Underground for 60+ Years! 🔥] [both]
- [ ] New York and Washington Names in the USA [title: Why America Has TWO New Yorks and TWO Washingtons 🤔] [both]
- [ ] Gulf Stream and European Climate [title: Why Is Europe Warmer Than America? The Ocean Secret 🌊] [both]
- [ ] Colditz Castle Glider [title: The Prisoners Who Built a Glider Inside a Nazi Castle ✈️] [both]
- [ ] Greenland and Iceland Names [title: Greenland Is Ice, Iceland Is Green — The Great Name Mix-Up ❄️] [both]
- [ ] Bridges Across the Amazon River [title: World's Biggest River Has NO Bridges — Here's Why! 🌉] [both]
- [ ] Tornado Alley [title: Why the USA Gets More Tornadoes Than Any Other Country 🌪️] [both]
- [ ] Prison Escape by Helicopter [title: The Prisoner Who Escaped by Helicopter 🚁] [both] [note: tell one well-documented case, e.g. Pascal Payet (France)]
- [ ] Recursive Geography [title: An Island Inside a Lake Inside an Island Inside a Lake! 🤯] [both]
- [ ] Pistol Shrimp and Ocean Sound [title: This Tiny Shrimp Makes One of the Loudest Sounds on Earth! 🦐] [both]
- [ ] Great Britain, United Kingdom and England [title: England vs UK vs Great Britain — NOT the Same! 🇬🇧] [both]
- [ ] Prisoner Who Forged His Own Release [title: The Prisoner Who Forged His Own Release Papers 📝] [both] [note: use a verified case, e.g. Neil Moore (UK, 2015) who faked a court email ordering his release; adjust wording so it stays true]
- [ ] Ownership and Governance of Antarctica [title: Who Actually Owns Antarctica? (India Has Bases There!) 🐧] [both]
- [ ] International Phone Country Codes [title: Why Is India +91? The Secret Behind Phone Codes 📱] [both]
- [ ] Pan-American Highway [title: The 30,000 km Road From Alaska to Argentina! 🚗] [both]
- [x] Escape Through a Tiny Prison Opening [title: The Man Who Squeezed Through a Tiny Prison Vent 😱] [short]  (Short done 2026-09-28 -> out/daily/2026-09-28-escape-through-a-tiny-prison-opening)
- [ ] Niʻihau: Hawaii's Restricted Island [title: Hawaii's Forbidden Island — Outsiders Not Allowed! 🏝️] [both]
- [ ] Lake Tulare [title: California's Biggest Lake Vanished — Then Came Back! 💧] [both]
- [ ] Types of Weather Systems [title: Cyclone vs Hurricane vs Typhoon — Same Storm, Different Names! 🌀] [both]
- [ ] Escape by Mailing Yourself [title: The Man Who Escaped Prison by Mailing Himself Out 📦] [both] [note: only use a verified story; if no verified prison case exists, tell Henry Box Brown (1849), who mailed himself out of slavery in a wooden crate, and adjust the title so it stays true]
- [ ] Penguins and the Equator [title: Why Are There No Penguins in the North? 🐧] [both]
- [ ] Events Happening Every Second on Earth [title: What Happens on Earth Every Second Will SHOCK You! 🌍] [both]
- [ ] Hundred Years' War [title: France vs England — The War That Lasted 116 Years! ⚔️] [both]
- [ ] Greatest Prison Escape in History [title: The Greatest Prison Escape in History 🔓] [both] [note: pick a well-documented historic escape not covered by other queue topics (not Stalag Luft III, Alcatraz or Colditz), e.g. the 1864 Libby Prison tunnel escape]
- [ ] USA–Canada Border [title: The World's Longest Border Is Between Two Best Friends 🇺🇸🇨🇦] [both]
- [ ] Sterile Insect Technique in Panama [title: USA Drops Millions of Flies on Panama Every Week! 🪰] [both]
- [ ] U.S. Interstate Highway Numbering [title: The Secret Code Behind America's Highway Numbers 🛣️] [both]
- [ ] Geography of the Hawaiian Islands [title: Hawaii Is WAY Bigger Than You Think! 🌋] [both]
- [ ] Garbage Truck Prison Escape [title: The Prison Escape That Started With a Garbage Truck 🚛] [both] [note: use a verified, documented case; adjust the title if needed so it stays true]
- [ ] New York State vs New York City [title: New York Is NOT Just New York City! 🗽] [both]
- [ ] Louisiana Purchase [title: America Bought Half a Continent for 3 Cents an Acre! 💰] [both]
- [ ] International Date Line and New Year [title: Where New Year Comes FIRST — and LAST! 🎆] [both]
- [ ] Vatican City [title: A Whole Country Inside a City! Why Vatican Exists 🇻🇦] [both]
- [ ] Soviet Nuclear Canal Project [title: USSR Used Nuclear Bombs to Dig a Lake! ☢️] [both]
- [ ] Western and Eastern Europe [title: Why Europe Is Split Into East and West 🌍] [both]

