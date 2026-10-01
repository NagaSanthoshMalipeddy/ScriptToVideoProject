import React from "react";
import { AbsoluteFill, Audio, Easing, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { GlobeMark } from "../brand/GlobeTales";
import { SatelliteMap } from "../geo/SatelliteMap";

const BRAND = loadFredoka("normal", { weights: ["600", "700"] }).fontFamily;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const eo = Easing.out(Easing.cubic);
const GOLD = "#ffd23f";
const RED = "#ff3b4a";
const INK = "#0f2747";
export const INTRO_SECONDS = 33.4;

// Beat times (s) read from the voiceover's word timestamps.
const B = {
  wait: 0, follow: 1.84, everyDay: 3.4, newStory: 6.74, crazy: 10.26, incidents: 11.46, stories: 12.42, mysteries: 14.4, interesting: 15.2,
  boring: 17.52, notLong: 18.72, twoMin: 19.88, daily: 22.42, dayWord: 24.98, newThing: 26.02, followNow: 27.34, followTap: 28.52, tomorrow: 29.44, end: 32.0,
};
const THUMBS = ["bermuda", "escape", "diomede", "tibet", "chile", "space", "darien", "spain", "usa", "timezones", "jet", "wallace", "market", "trees", "gibraltar"];
const img = (k: string) => staticFile(`intro/${k}.jpg`);

const pop = (frame: number, fps: number, t: number, damping = 11) => spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } });
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min((T - a) / f, (b - T) / f));

const Title: React.FC<{ text: string; t: number; top: number; size?: number; color?: string; frame: number; fps: number; te?: boolean }> = ({ text, t, top, size = 110, color = "#fff", frame, fps, te = true }) => {
  const p = pop(frame, fps, t);
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top, textAlign: "center", transform: `scale(${0.5 + 0.5 * p}) rotate(${(1 - p) * -6}deg)`, opacity: clamp(p * 1.6) }}>
      <span style={{ fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.15, color, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}` }}>{text}</span>
    </div>
  );
};

const Card: React.FC<{ k: string; w: number; tilt?: number; glow?: string }> = ({ k, w, tilt = 0, glow }) => (
  <div style={{ width: w, height: w * 16 / 9, borderRadius: w * 0.07, overflow: "hidden", border: "6px solid #fff", boxShadow: `0 18px 40px rgba(0,0,0,0.55)${glow ? `, 0 0 40px ${glow}` : ""}`, transform: `rotate(${tilt}deg)` }}>
    <Img src={img(k)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </div>
);

const FollowButton: React.FC<{ T: number; tap: number; frame: number; fps: number; scale?: number }> = ({ T, tap, frame, fps, scale = 1 }) => {
  const done = T >= tap;
  const press = T > tap - 0.15 && T < tap + 0.1 ? 0.9 : 1;
  const hand = clamp((T - (tap - 0.8)) / 0.6);
  const burst = clamp((T - tap) / 0.5);
  return (
    <div style={{ position: "relative", display: "inline-block", transform: `scale(${scale * press})` }}>
      <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 64, letterSpacing: 4, color: done ? INK : "#fff", background: done ? GOLD : RED, border: `6px solid ${INK}`, borderRadius: 80, padding: "18px 64px", boxShadow: `0 10px 0 ${INK}` }}>
        {done ? "FOLLOWING ✓" : "+ FOLLOW"}
      </div>
      {burst > 0 && burst < 1 && Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 14, height: 14, borderRadius: "50%", background: i % 2 ? GOLD : "#fff", transform: `translate(${Math.cos((i / 10) * 6.28) * 220 * burst}px, ${Math.sin((i / 10) * 6.28) * 120 * burst}px)`, opacity: 1 - burst }} />
      ))}
      {!done && hand > 0 && <div style={{ position: "absolute", right: -30, bottom: -80, fontSize: 110, transform: `translate(${(1 - hand) * 160}px, ${(1 - hand) * 160}px)` }}>👆</div>}
    </div>
  );
};

export const IntroScene: React.FC<{ T: number; frame: number; cover?: boolean }> = ({ T, frame, cover = false }) => {
  const { fps } = useVideoConfig();
  const lon = -40 + T * 6;
  const flash = cover ? 0 : clamp(1 - T / 0.25);

  const sec = cover ? "cover" : T < B.follow - 0.3 ? "wait" : T < B.everyDay ? "follow" : T < B.crazy - 0.4 ? "daily" : T < B.notLong ? "cats" : T < B.daily ? "two" : T < B.followNow ? "wall" : T < B.tomorrow ? "followNow" : "tomorrow";

  return (
    <AbsoluteFill style={{ background: "#061226", overflow: "hidden" }}>
      <SatelliteMap view={{ lon, lat: 12, span: 150 }} width={1080} height={1920} darken={0.55} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(20,60,140,0.25) 0%, rgba(3,8,20,0.85) 80%)" }} />

      {(sec === "wait" || sec === "cover") && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(540 ${cover ? 1060 : 1000}) scale(${cover ? 1 : lerp(0.6, 1.05, eo(clamp(T / 0.8)))}) translate(-540 -1000)`}>
              <GlobeMark cx={540} cy={1000} r={260} id="i1" />
            </g>
          </svg>
          {!cover && <Title text="ఒక్కసారి ఆగండి!" t={0.05} top={440} size={120} color={GOLD} frame={frame} fps={fps} />}
        </>
      )}

      {sec === "follow" && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <GlobeMark cx={540} cy={820} r={170} id="i2" />
          </svg>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1060, textAlign: "center", fontFamily: BRAND, fontWeight: 700, fontSize: 150, color: "#fff", textShadow: `0 10px 0 ${INK}` }}>
            Globe<span style={{ color: GOLD }}>Tales</span>
          </div>
          <Title text="ఈ పేజీని FOLLOW చేయండి" t={B.follow - 0.25} top={400} size={84} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1330, textAlign: "center" }}>
            <FollowButton T={T} tap={B.follow + 1.1} frame={frame} fps={fps} />
          </div>
        </>
      )}

      {sec === "daily" && (
        <>
          <Title text="ప్రతి రోజూ" t={B.everyDay} top={330} size={110} color={GOLD} frame={frame} fps={fps} />
          <Title text="ఒక కొత్త STORY!" t={B.newStory - 0.2} top={470} size={110} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 290, top: 700, width: 500, height: 900, borderRadius: 60, background: "#0b0f17", border: "10px solid #1d2638", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", overflow: "hidden" }}>
            {THUMBS.slice(0, 6).map((k, i) => {
              const y = (i - (T - B.everyDay) * 1.3) * 880;
              return y > -900 && y < 900 ? (
                <div key={k} style={{ position: "absolute", left: 0, top: y, width: 480, height: 880 }}>
                  <Img src={img(k)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : null;
            })}
          </div>
          <div style={{ position: "absolute", left: 90, top: 1180, transform: `rotate(-10deg) scale(${pop(frame, fps, B.everyDay + 0.6)})`, background: "#fff", border: `6px solid ${INK}`, borderRadius: 18, width: 170, textAlign: "center", boxShadow: `0 8px 0 ${INK}` }}>
            <div style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 30, padding: "6px 0", borderRadius: "10px 10px 0 0" }}>DAY</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 96, color: INK }}>{1 + Math.floor(clamp((T - B.everyDay) / 5.5) * 29)}</div>
          </div>
        </>
      )}

      {sec === "cats" && (
        <>
          {([
            ["CRAZY INCIDENTS", B.crazy, "escape", -8, 230],
            ["TRUE STORIES", B.stories, "darien", 6, 560],
            ["MYSTERIES", B.mysteries, "bermuda", -5, 890],
            ["INTERESTING FACTS", B.interesting, "diomede", 7, 1220],
          ] as [string, number, string, number, number][]).map(([label, t, k, tilt, y], i) => {
            const p = pop(frame, fps, t);
            const x = i % 2 ? 120 : 660;
            return p > 0.01 ? (
              <React.Fragment key={label}>
                <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${(1 - p) * (i % 2 ? -500 : 500)}px)` }}>
                  <Card k={k} w={250} tilt={tilt} glow={i === 2 ? "rgba(255,59,74,0.6)" : undefined} />
                </div>
                <div style={{ position: "absolute", left: i % 2 ? 420 : 40, width: 600, top: y + 150, textAlign: i % 2 ? "left" : "right", transform: `scale(${p})`, transformOrigin: i % 2 ? "left center" : "right center" }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 76, lineHeight: 1, color: i % 2 ? GOLD : "#fff", textShadow: "0 6px 20px rgba(0,0,0,0.9)" }}>{label}</span>
                </div>
              </React.Fragment>
            ) : null;
          })}
          {T > B.boring - 0.1 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", transform: `rotate(-8deg) scale(${2 - pop(frame, fps, B.boring - 0.1)})`, background: "rgba(0,0,0,0.75)", border: `10px solid ${RED}`, padding: "6px 40px" }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 140, color: "#fff" }}>BORING</span>
                <svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                  <line x1={2} y1={36} x2={98} y2={4} stroke={RED} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.boring - 0.2) / 0.25)} />
                </svg>
              </div>
            </div>
          )}
        </>
      )}

      {sec === "two" && (
        <>
          <Title text="పెద్ద వీడియోలు కాదు…" t={B.notLong} top={380} size={96} frame={frame} fps={fps} />
          {(() => {
            const sweep = clamp((T - B.twoMin + 0.2) / 1.4);
            const secs = Math.round(sweep * 120);
            const a = sweep * Math.PI * 4 - Math.PI / 2;
            return (
              <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${pop(frame, fps, B.notLong + 0.6)})` }}>
                <svg width={520} height={560} viewBox="0 0 520 560">
                  <rect x={225} y={10} width={70} height={46} rx={10} fill={GOLD} stroke={INK} strokeWidth={8} />
                  <circle cx={260} cy={300} r={236} fill="#fff" stroke={INK} strokeWidth={14} />
                  <path d={`M260 300 L260 70 A230 230 0 ${sweep > 0.5 ? 1 : 0} 1 ${260 + 230 * Math.cos(sweep * Math.PI * 2 - Math.PI / 2)} ${300 + 230 * Math.sin(sweep * Math.PI * 2 - Math.PI / 2)} Z`} fill="rgba(255,210,63,0.45)" />
                  <line x1={260} y1={300} x2={260 + 190 * Math.cos(a)} y2={300 + 190 * Math.sin(a)} stroke={RED} strokeWidth={14} strokeLinecap="round" />
                  <circle cx={260} cy={300} r={18} fill={INK} />
                </svg>
                <div style={{ fontFamily: DISPLAY, fontSize: 150, color: "#fff", textShadow: "0 8px 24px rgba(0,0,0,0.9)", marginTop: -10 }}>
                  {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
                </div>
              </div>
            );
          })()}
          <Title text="JUST 2 MINUTES" t={B.twoMin} top={1440} size={110} color={GOLD} frame={frame} fps={fps} te={false} />
        </>
      )}

      {sec === "wall" && (
        <>
          <Title text="రోజుకి 2 నిమిషాలు" t={B.daily} top={300} size={100} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 460, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, padding: "0 30px", transform: `translateY(${-(T - B.daily) * 18}px)` }}>
            {THUMBS.map((k, i) => {
              const p = pop(frame, fps, B.daily + 0.15 + i * 0.12, 14);
              return (
                <div key={k} style={{ transform: `scale(${p}) rotate(${((i * 37) % 9) - 4}deg)` }}>
                  <Card k={k} w={180} />
                </div>
              );
            })}
          </div>
          <Title text="రోజూ ఒక కొత్త విషయం!" t={B.dayWord} top={1500} size={88} frame={frame} fps={fps} />
        </>
      )}

      {sec === "followNow" && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(540 760) rotate(${T * 20}) translate(-540 -760)`}>
              <GlobeMark cx={540} cy={760} r={200} id="i3" />
            </g>
          </svg>
          <Title text="సో, ఇప్పుడే" t={B.followNow} top={330} size={110} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 1080, textAlign: "center", transform: `scale(${pop(frame, fps, B.followNow + 0.2)})` }}>
            <FollowButton T={T} tap={B.followTap + 0.2} frame={frame} fps={fps} scale={1.25} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1300, textAlign: "center", fontFamily: BODY, fontWeight: 800, fontSize: 44, letterSpacing: 4, color: "#fff", textShadow: "0 3px 10px rgba(0,0,0,0.9)" }}>@GlobeTales · 1 VIDEO DAILY</div>
        </>
      )}

      {sec === "tomorrow" && (
        <>
          <Title text="రేపటి STORY" t={B.tomorrow} top={300} size={120} color={GOLD} frame={frame} fps={fps} />
          <Title text="మిస్ అవ్వకండి!" t={B.tomorrow + 0.8} top={450} size={110} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 660, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.tomorrow + 0.3)}) rotate(${Math.sin(T * 3) * 2}deg)` }}>
            <div style={{ position: "relative", width: 440, height: 782, borderRadius: 40, overflow: "hidden", border: "8px solid #fff", boxShadow: `0 0 60px rgba(255,210,63,0.55)` }}>
              <Img src={img("gibraltar")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(22px) brightness(0.6)" }} />
              <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 280, color: GOLD, textShadow: "0 10px 30px rgba(0,0,0,0.8)" }}>?</div>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: "#fff" }}>TOMORROW</div>
              </AbsoluteFill>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1500, textAlign: "center", fontFamily: BRAND, fontWeight: 700, fontSize: 80, color: "#fff", textShadow: `0 6px 0 ${INK}` }}>
            Globe<span style={{ color: GOLD }}>Tales</span>
          </div>
        </>
      )}

      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
    </AbsoluteFill>
  );
};

export const ChannelIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0, "boom", 0.35], [B.follow - 0.3, "whoosh", 0.3], [B.follow + 1.1, "ding", 0.35], [B.everyDay, "whoosh", 0.3],
    [B.crazy, "pop", 0.35], [B.stories, "pop", 0.35], [B.mysteries, "pop", 0.35], [B.interesting, "pop", 0.35], [B.boring - 0.1, "boom", 0.3],
    [B.notLong, "whoosh", 0.3], [B.twoMin + 1.2, "ding", 0.3], [B.daily, "whoosh", 0.3], [B.followNow, "whoosh", 0.3], [B.followTap + 0.2, "ding", 0.4], [B.tomorrow, "boom", 0.25],
  ];
  return (
    <AbsoluteFill>
      <Audio src={staticFile("intro/voice.mp3")} />
      {sfx.map(([t, n, v]) => (
        <Sequence key={`${n}${t}`} from={Math.max(0, Math.round(t * fps))} durationInFrames={45}>
          <Audio src={staticFile(`sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
      <IntroScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 cover (frame 0 on Instagram): brand + promise, key content inside y 300–1480.
export const ChannelIntroThumb: React.FC = () => (
  <AbsoluteFill>
    <IntroScene T={0.6} frame={18} cover />
    <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center", fontFamily: BRAND, fontWeight: 700, fontSize: 170, lineHeight: 1, color: "#fff", textShadow: `0 12px 0 ${INK}` }}>
      Globe<span style={{ color: GOLD }}>Tales</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 530, textAlign: "center", fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 84, color: GOLD, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill" }}>ప్రతి రోజూ ఒక కొత్త STORY</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center", gap: 22 }}>
      {["bermuda", "escape", "diomede"].map((k, i) => (
        <Card key={k} k={k} w={150} tilt={(i - 1) * 7} />
      ))}
    </div>
  </AbsoluteFill>
);
