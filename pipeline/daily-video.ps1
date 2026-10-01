# daily-video.ps1: make the next video from video-queue.md with the Copilot CLI agent + repo skills.
#
#   pwsh pipeline/daily-video.ps1            # run the next pending topic
#   pwsh pipeline/daily-video.ps1 -DryRun    # show the topic + prompt, change nothing
#
# Scheduled daily by pipeline/schedule-daily.ps1.
param(
  [switch]$DryRun,
  [string]$CopilotPath = $env:COPILOT_CLI,
  [string]$Deadline = "18:00",
  [int]$MaxContinues = 60
)
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
$Queue = Join-Path $Root "video-queue.md"
$Logs = Join-Path $Root "out/daily/logs"
New-Item -ItemType Directory -Force $Logs | Out-Null
$Lock = Join-Path $Logs ".running"
$Stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$Log = Join-Path $Logs "$Stamp.log"
function Say($m) { $line = "[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $m; Write-Host $line; if (-not $DryRun) { Add-Content $Log $line -Encoding utf8 } }

# `out/daily/logs/.stop` (younger than 8 h) cancels pending batch runs without touching the one in progress.
$Stop = Join-Path $Logs ".stop"
if (-not $DryRun -and (Test-Path $Stop) -and ((Get-Item $Stop).LastWriteTime -gt (Get-Date).AddHours(-8))) { Write-Host "Stop flag set; skipping."; exit 0 }

if ((Test-Path $Lock) -and ((Get-Item $Lock).LastWriteTime -gt (Get-Date).AddHours(-6))) { Say "Another run is in progress; exiting."; exit 0 }

$lines = [System.Collections.Generic.List[string]](Get-Content $Queue -Encoding utf8)
$idx = -1
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match '^- \[ \]\s+\S') { $idx = $i; break } }
if ($idx -lt 0) { Say "No pending topics in video-queue.md."; exit 0 }

$raw = ($lines[$idx] -replace '^- \[ \]\s+', '').Trim()
$format = "short"
if ($raw -match '\[(both)\]') { $format = "both" } elseif ($raw -match '\[(long)\]') { $format = "long" }
$notes = ([regex]::Matches($raw, '\[([^\]]+)\]') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -notin "short", "long", "both" }) -join "; "
$topic = ($raw -replace '\s*\[[^\]]+\]', '').Trim()
$slug = (($topic.ToLower() -replace '[^a-z0-9]+', '-').Trim('-'))
if ($slug.Length -gt 48) { $slug = $slug.Substring(0, 48).Trim('-') }
$name = "{0}-{1}" -f (Get-Date -Format "yyyy-MM-dd"), $slug
$outDir = "out/daily/$name"

$deliver = @()
if ($format -ne "long") { $deliver += "Short (9:16): $outDir/$slug-short.mp4, $outDir/$slug-short-thumbnail-9x16.png (key content inside y 300-1620), $outDir/$slug-short.te.srt, $outDir/$slug-short.youtube.md" }
if ($format -ne "short") { $deliver += "Long (16:9): $outDir/$slug-16x9.mp4, $outDir/$slug-16x9-thumbnail.jpg, $outDir/$slug-16x9.te.srt, $outDir/$slug-16x9.youtube.md (with chapters)" }

$prompt = @"
You are running UNATTENDED as the daily video job for this repo. No human is available: never ask questions, decide everything yourself.

TOPIC: $topic
FORMAT: $format
EXTRA NOTES: $(if ($notes) { $notes } else { "none" })
OUTPUT FOLDER: $outDir  (create it; put every deliverable there)

Do the complete job:
1. Write the narration script with the viral-script-writer skill (.github/skills/viral-script-writer): 5-part formula, But/Therefore twists, [visual cues], short punchy sentences, accurate facts (Short: 60-100 s; Long: 5-8 min). No gore or glorification of violence. End with the verbatim line "Please like, share and subscribe to my YouTube channel." Save it in the output folder and copy it to script.txt.
2. Follow the repo skills in .github/skills: plan with shorts-animation-director, then build with cartoon-explainer (default style), or map-journey-animation / the documentary map pattern (src/iraniraq/IraqDoc.tsx, src/korea/KoreaLong.tsx) when the topic is about countries, places, wars or history. Reuse existing components. Put any new code under src/daily/ and register compositions in src/Root.tsx. Use accurate maps (India with its official boundary). For every map use the satellite basemap: SatelliteMap + countryGeom from src/geo/SatelliteMap.tsx (NASA Blue Marble, Web Mercator, no borders, highlighted countries in translucent gold with a small italic label, as in SatMapDemo); run node pipeline/make_basemap.mjs first if public/basemap is missing. Do not use flat cartoon map fills.
3. Set config.json width/height for the format and use the channel narrator: voice en-US-ChristopherNeural, rate +0% (unless EXTRA NOTES ask for another voice or language). Run python pipeline/tts.py, check key stills (no MISSING CUES, no overlapping text), then render with npx remotion render. Run renders in the foreground and wait for them to finish; never end your turn while a render is still running.
4. Deliver the full package:
   - $($deliver -join "`n   - ")
   Every video ends with the like/share/subscribe CTA and shows the subscribe nudge every 20 s. Sound effects: only whoosh, pop, ding and boom from public/sfx; never use riser. Background music: withCover already adds public/music/slow-motion-beat.mp3 very quietly (BackgroundBeat, 5%); for 16:9 videos render <BackgroundBeat /> from src/cartoon/WithCover.tsx yourself.
   Every 9:16 video opens on its own thumbnail design: in src/Root.tsx register withCover(Video, Thumb) from src/cartoon/WithCover.tsx with durationInFrames + pad + coverLeadFrames(config.fps). The video holds the thumbnail for 1.2 s, then cross-fades into the hook, because Instagram uses frame 0 as the Reel cover. Keep the thumbnail's title and details inside y 300-1480, and check --frame=0 with crop=1080:1350:0:285. Because the cover delays the voice, build the 9:16 Telugu .srt with the offset: node pipeline/make_srt.mjs <cues.json> <out.srt> 0.9333
5. Finally restore config.json to width 1080, height 1920, rate +0%, voice en-US-ChristopherNeural, and make sure npx tsc --noEmit passes.

Rules:
- Do NOT run git commands that change the repo or remote (no commit, push, stash, checkout, restore, reset, clean, add).
- Do not delete or overwrite existing files outside $outDir, src/daily/, script.txt, config.json, public/timing.json, public/audio.mp3 and src/Root.tsx.
- If EXTRA NOTES contain "title: ...", use that as the video's hook and as the first YouTube title option. The channel is "GlobeTales".
- Do not edit video-queue.md (the runner updates it).
- $(if ($Deadline -eq "none") { "There is no fixed deadline; work efficiently and finish everything." } else { "Everything must be finished before $Deadline today. If time runs short, finish the Short first and skip polish." })
- End your final message with exactly one line: RESULT: OK <deliverable paths>  or  RESULT: FAILED <reason>
"@

Say "Topic: $topic  | format: $format  | out: $outDir"
if ($DryRun) { Write-Host "`n----- PROMPT -----`n$prompt"; exit 0 }

if (-not $CopilotPath) { $CopilotPath = (Get-Command copilot -ErrorAction Stop).Source }
$lines[$idx] = "- [~] $raw  (started $(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
Set-Content $Queue $lines -Encoding utf8
Set-Content $Lock $PID

try {
  # The CLI kills background tasks (e.g. long renders) after 600 s by default.
  $env:COPILOT_TASK_WAIT_TIMEOUT_SECONDS = "14400"
  $deny = "git push", "git commit", "git stash", "git checkout", "git restore", "git reset", "git clean", "git add", "git rebase", "git merge" | ForEach-Object { "--deny-tool=shell($_)" }
  $cliArgs = @("-p", $prompt, "--mode", "autopilot", "--max-autopilot-continues", "$MaxContinues", "--allow-all-tools", "--no-ask-user", "--share=$Logs/$Stamp-session.md") + $deny
  Say "Starting Copilot CLI: $CopilotPath"
  & $CopilotPath @cliArgs 2>&1 | ForEach-Object { $_ | Out-String -Stream } | Tee-Object -FilePath $Log -Append | Out-Null
  $mp4s = @(Get-ChildItem $outDir -Filter *.mp4 -ErrorAction SilentlyContinue)
  $expected = if ($format -eq "both") { 2 } else { 1 }
  $ok = $mp4s.Count -ge $expected
} catch {
  Say "ERROR: $($_.Exception.Message)"
  $ok = $false
} finally {
  Remove-Item $Lock -ErrorAction SilentlyContinue
}

$lines = [System.Collections.Generic.List[string]](Get-Content $Queue -Encoding utf8)
$j = $lines.FindIndex([Predicate[string]] { param($l) $l.StartsWith("- [~] $raw") })
if ($j -lt 0) { $j = $idx }
$lines[$j] = if ($ok) { "- [x] $raw  (done $(Get-Date -Format 'yyyy-MM-dd HH:mm') -> $outDir)" } else { "- [!] $raw  (failed $(Get-Date -Format 'yyyy-MM-dd HH:mm'), see out/daily/logs/$Stamp.log)" }
Set-Content $Queue $lines -Encoding utf8

$msg = if ($ok) { "Daily video ready: $topic -> $outDir" } else { "Daily video FAILED: $topic (see $Log)" }
Say $msg
Set-Content (Join-Path $Root "out/daily/LATEST.txt") $msg -Encoding utf8
if (Get-Command msg.exe -ErrorAction SilentlyContinue) { msg.exe $env:USERNAME /TIME:3600 $msg 2>$null }
if (-not $ok) { exit 1 }
