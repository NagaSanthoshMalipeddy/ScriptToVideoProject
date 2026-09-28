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
- [ ] How Time Zones Work [title: Why Time Zones Are So WEIRD — And Why India Has Just ONE ⏰] [both]
- [ ] Great Plains Shelterbelt [title: USA Planted a "Great Wall" of 220 Million Trees! 🌳] [both]
- [ ] Jet Streams and Transatlantic Flights [title: The Invisible Highway in the Sky That Makes Flights Faster ✈️] [both]
- [ ] Chile's Geography and Shape [title: Chile Is Longer Than India — But Super Thin! Why? 🇨🇱] [both]
- [ ] Wallace Line [title: Animals Refuse to Cross This Invisible Line! 🐅] [both]
- [ ] Country Closest to Space [title: Not Everest! This Country Is Closest to Space 🚀] [both]
- [ ] Märket Island Border [title: Sweden and Finland Share a Tiny Island With a Zig-Zag Border! 🏝️] [both]
- [ ] Strait of Gibraltar [title: Europe and Africa Are Only 14 km Apart — So Why No Bridge? 🌉] [both]
- [ ] Korean Peninsula Conflict [title: 70+ Years Later, North & South Korea Are STILL at War! 🇰🇷] [both]
- [ ] UAE, Dubai and Abu Dhabi [title: Dubai Is NOT a Country! UAE vs Dubai vs Abu Dhabi Explained 🇦🇪] [both]
- [ ] Oklahoma Panhandle [title: Why Oklahoma Has a Weird "Handle" on the Map 🗺️] [both]
- [ ] American Towns Surrounded by Canada [title: American Towns TRAPPED Inside Canada! 🇺🇸🇨🇦] [both]
- [ ] Longest Open-Water Swimming Route [title: The Longest Swim Without Touching Land — Is It Even Possible? 🌊] [both]
- [ ] Holland and the Netherlands [title: Holland Is NOT the Netherlands?! 🇳🇱] [both]
- [ ] Centralia Underground Fire [title: This Town Has Been Burning Underground for 60+ Years! 🔥] [both]
- [ ] New York and Washington Names in the USA [title: Why America Has TWO New Yorks and TWO Washingtons 🤔] [both]
- [ ] Gulf Stream and European Climate [title: Why Is Europe Warmer Than America? The Ocean Secret 🌊] [both]
- [ ] Greenland and Iceland Names [title: Greenland Is Ice, Iceland Is Green — The Great Name Mix-Up ❄️] [both]
- [ ] Bridges Across the Amazon River [title: World's Biggest River Has NO Bridges — Here's Why! 🌉] [both]
- [ ] Tornado Alley [title: Why the USA Gets More Tornadoes Than Any Other Country 🌪️] [both]
- [ ] Recursive Geography [title: An Island Inside a Lake Inside an Island Inside a Lake! 🤯] [both]
- [ ] Pistol Shrimp and Ocean Sound [title: This Tiny Shrimp Makes One of the Loudest Sounds on Earth! 🦐] [both]
- [ ] Great Britain, United Kingdom and England [title: England vs UK vs Great Britain — NOT the Same! 🇬🇧] [both]
- [ ] Ownership and Governance of Antarctica [title: Who Actually Owns Antarctica? (India Has Bases There!) 🐧] [both]
- [ ] International Phone Country Codes [title: Why Is India +91? The Secret Behind Phone Codes 📱] [both]
- [ ] Pan-American Highway [title: The 30,000 km Road From Alaska to Argentina! 🚗] [both]
- [ ] Niʻihau: Hawaii's Restricted Island [title: Hawaii's Forbidden Island — Outsiders Not Allowed! 🏝️] [both]
- [ ] Lake Tulare [title: California's Biggest Lake Vanished — Then Came Back! 💧] [both]
- [ ] Types of Weather Systems [title: Cyclone vs Hurricane vs Typhoon — Same Storm, Different Names! 🌀] [both]
- [ ] Penguins and the Equator [title: Why Are There No Penguins in the North? 🐧] [both]
- [ ] Events Happening Every Second on Earth [title: What Happens on Earth Every Second Will SHOCK You! 🌍] [both]
- [ ] Hundred Years' War [title: France vs England — The War That Lasted 116 Years! ⚔️] [both]
- [ ] USA–Canada Border [title: The World's Longest Border Is Between Two Best Friends 🇺🇸🇨🇦] [both]
- [ ] Sterile Insect Technique in Panama [title: USA Drops Millions of Flies on Panama Every Week! 🪰] [both]
- [ ] U.S. Interstate Highway Numbering [title: The Secret Code Behind America's Highway Numbers 🛣️] [both]
- [ ] Geography of the Hawaiian Islands [title: Hawaii Is WAY Bigger Than You Think! 🌋] [both]
- [ ] New York State vs New York City [title: New York Is NOT Just New York City! 🗽] [both]
- [ ] Louisiana Purchase [title: America Bought Half a Continent for 3 Cents an Acre! 💰] [both]
- [ ] International Date Line and New Year [title: Where New Year Comes FIRST — and LAST! 🎆] [both]
- [ ] Vatican City [title: A Whole Country Inside a City! Why Vatican Exists 🇻🇦] [both]
- [ ] Soviet Nuclear Canal Project [title: USSR Used Nuclear Bombs to Dig a Lake! ☢️] [both]
- [ ] Western and Eastern Europe [title: Why Europe Is Split Into East and West 🌍] [both]

