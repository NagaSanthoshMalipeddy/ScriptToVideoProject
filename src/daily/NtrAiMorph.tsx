import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Chip, Stamp, Title } from "./PilotHero";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const GOLD = "#ffd23f";
const RED = "#ff2d4a";
const CYAN = "#2ad1ff";
const INK = "#0b0d14";

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  song: 3.95, now: 7.75, aiFake: 9.6, viral: 14.4, ntr: 17.12, react: 19.6, legal: 22.3, spread: 25.2, janhvi: 28.67, but: 31.04,
  tech: 33.84, realistic: 36.6, dont: 40.86, share: 44.0, because: 46.47, fake: 50.29, voiceEnd: 52.72, cta: 53.0,
};
export const NTR_SECONDS = 58.4;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const POSTER = staticFile("ntr/poster.png");
const TWEET = staticFile("ntr/tweet.png");

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

// ---- art -------------------------------------------------------------------------------------
export const BlurBg: React.FC<{ src: string; blur?: number; dim?: number; scale?: number }> = ({ src, blur = 26, dim = 0.55, scale = 1.15 }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    <Img src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(${blur}px) brightness(${1 - dim})`, transform: `scale(${scale})` }} />
  </AbsoluteFill>
);

export const BlurPoster: React.FC<{ w: number; blur?: number; scan?: number; tilt?: number }> = ({ w, blur = 16, scan = -1, tilt = 0 }) => {
  const h = (w * 597) / 335;
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: 28, overflow: "hidden", border: "10px solid #111", boxShadow: "0 30px 60px rgba(0,0,0,0.7)", transform: `rotate(${tilt}deg)` }}>
      <Img src={POSTER} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `blur(${blur}px) saturate(1.1)`, transform: "scale(1.12)" }} />
      {scan >= 0 && (
        <>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(42,209,255,0.18) 2px, transparent 2px), linear-gradient(90deg, rgba(42,209,255,0.18) 2px, transparent 2px)`, backgroundSize: "40px 40px", opacity: clamp(scan * 3) }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: `${(scan % 1) * 100}%`, height: 10, background: CYAN, boxShadow: `0 0 30px ${CYAN}` }} />
        </>
      )}
    </div>
  );
};

// Circular face crop: (cx, cy) is the face centre and fw the face width in source pixels.
export const FaceCircle: React.FC<{ src: string; iw: number; ih: number; cx: number; cy: number; fw: number; size: number; ring: string }> = ({ src, iw, ih, cx, cy, fw, size, ring }) => {
  const k = (size * 0.55) / fw;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", position: "relative", border: `10px solid ${ring}`, boxShadow: `0 16px 40px rgba(0,0,0,0.7), 0 0 40px ${ring}` }}>
      <Img src={src} style={{ position: "absolute", width: iw * k, height: ih * k, left: size / 2 - cx * k, top: size * 0.47 - cy * k }} />
    </div>
  );
};

export const TweetShot: React.FC<{ w: number; tilt?: number; glow?: number }> = ({ w, tilt = 0, glow = 0 }) => (
  <div style={{ width: w, height: (w * 251) / 201, borderRadius: 24, overflow: "hidden", border: "6px solid #2f3336", boxShadow: `0 30px 60px rgba(0,0,0,0.7)${glow ? `, 0 0 ${50 * glow}px rgba(255,45,74,${glow})` : ""}`, transform: `rotate(${tilt}deg)`, background: "#000" }}>
    <Img src={TWEET} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.1)" }} />
  </div>
);

// Crisp quote card in X-post style (text from the tweet screenshot).
export const Quote: React.FC<{ text: string; p: number; color?: string; size?: number }> = ({ text, p, color = "#fff", size = 58 }) => (
  <div style={{ background: "rgba(0,0,0,0.9)", border: "3px solid #2f3336", borderLeft: `14px solid ${RED}`, borderRadius: 22, padding: "22px 30px", transform: `scale(${p})`, opacity: clamp(p * 2), boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "#1d9bf0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#fff" }}>𝕏</div>
      <div>
        <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 32, color: "#e7e9ea" }}>Jr NTR <span style={{ color: "#1d9bf0" }}>✔</span></div>
        <div style={{ fontFamily: BODY, fontSize: 26, color: "#71767b" }}>@tarak9999</div>
      </div>
    </div>
    <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: size, lineHeight: 1.15, color }}>“{text}”</div>
  </div>
);

export const Scanlines: React.FC<{ o?: number }> = ({ o = 0.25 }) => (
  <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 2px, transparent 2px, transparent 5px)", opacity: o, pointerEvents: "none" }} />
);

export const Robot: React.FC<{ size: number; eye?: number }> = ({ size, eye = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200">
    <line x1={100} y1={18} x2={100} y2={44} stroke="#cfd6e2" strokeWidth={8} />
    <circle cx={100} cy={14} r={10} fill={RED} />
    <rect x={30} y={44} width={140} height={110} rx={28} fill="#1c2233" stroke="#cfd6e2" strokeWidth={8} />
    <circle cx={72} cy={96} r={18} fill={RED} opacity={eye} />
    <circle cx={128} cy={96} r={18} fill={RED} opacity={eye} />
    <rect x={66} y={126} width={68} height={10} rx={5} fill="#cfd6e2" />
    <rect x={14} y={80} width={16} height={40} rx={6} fill="#cfd6e2" />
    <rect x={170} y={80} width={16} height={40} rx={6} fill="#cfd6e2" />
  </svg>
);

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.song - 0.15], ["song", B.song - 0.15, B.now - 0.15], ["fake", B.now - 0.15, B.ntr - 0.15], ["ntr", B.ntr - 0.15, B.janhvi - 0.15],
  ["janhvi", B.janhvi - 0.15, B.but - 0.15], ["shock", B.but - 0.15, B.dont - 0.15], ["warn", B.dont - 0.15, 999],
];

export const NtrScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const glitch = (T < 0.8 || (T > B.aiFake && T < B.aiFake + 0.5) || (T > B.but && T < B.but + 0.4)) ? Math.sin(T * 97) * 16 : 0;
  const tweetBg = Math.max(o("ntr"), o("janhvi"), o("warn") * 0.7);

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BlurBg src={POSTER} blur={30} dim={0.6} />
      {tweetBg > 0 && <AbsoluteFill style={{ opacity: tweetBg }}><BlurBg src={TWEET} blur={10} dim={0.7} scale={1.05} /></AbsoluteFill>}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 100%)" }} />
      <Scanlines o={0.18} />
      {T < 0.25 && <AbsoluteFill style={{ background: RED, opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", transform: `translateX(${glitch}px) scale(${pop(frame, fps, 0.1, 9)})` }}>
            <Robot size={380} eye={0.6 + 0.4 * Math.sin(T * 12)} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 760, textAlign: "center", transform: `translateX(${-glitch}px)` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 220, lineHeight: 1, color: RED, textShadow: `8px 0 0 ${CYAN}, -8px 0 0 #fff, 0 14px 0 #000` }}>AI</span>
          </div>
          <Title text={"ఇంత దారుణంగా\nవాడుతున్నారా?!"} t={0.9} top={1030} size={100} color={GOLD} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("song") > 0 && (
        <AbsoluteFill style={{ opacity: o("song") }}>
          <Title text="చుట్టమల్లె సాంగ్ గుర్తుందా? 🎵" t={B.song} top={300} size={84} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.song + 0.3, 13)})` }}>
            <BlurPoster w={500} blur={20} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center" }}>
            <Chip text="DEVARA: PART 1 · 2024" p={pop(frame, fps, B.song + 1.2)} size={40} />
          </div>
        </AbsoluteFill>
      )}

      {o("fake") > 0 && (
        <AbsoluteFill style={{ opacity: o("fake") }}>
          <Title text="AI తో మార్చేసి…" t={B.now} top={300} size={100} color={CYAN} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", transform: `translateX(${glitch}px)` }}>
            <BlurPoster w={500} blur={22} scan={T > B.now + 0.3 ? (T - B.now - 0.3) * 0.6 : -1} />
          </div>
          {T > B.aiFake - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
              <Stamp text="AI MORPHED · FAKE" p={pop(frame, fps, B.aiFake - 0.2)} color={RED} size={84} te={false} />
            </div>
          )}
          {T > B.viral - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1340, display: "flex", justifyContent: "center", gap: 18, alignItems: "center" }}>
              <Chip text="📈 VIRAL ON SOCIAL MEDIA" p={pop(frame, fps, B.viral - 0.2)} size={42} bg="rgba(255,45,74,0.92)" border="#fff" />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("ntr") > 0 && (
        <AbsoluteFill style={{ opacity: o("ntr") }}>
          <Title text="జూ. ఎన్టీఆర్ తీవ్ర స్పందన 🔥" t={B.ntr} top={300} size={80} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 440, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.ntr + 0.4, 13)})` }}>
            <TweetShot w={460} tilt={-2} glow={0.5} />
          </div>
          <div style={{ position: "absolute", left: 50, right: 50, top: 1040, display: "flex", flexDirection: "column", gap: 20 }}>
            {T < B.legal - 0.2 ? (
              <Quote text="Disgusting, Sick and Shameless." p={pop(frame, fps, B.react)} color={RED} size={60} />
            ) : T < B.spread - 0.2 ? (
              <Quote text="I will not spare any of you." p={pop(frame, fps, B.legal - 0.2)} color={GOLD} size={64} />
            ) : (
              <Quote text="Legal action against those who created it and those who are spreading it." p={pop(frame, fps, B.spread - 0.2)} size={46} />
            )}
          </div>
        </AbsoluteFill>
      )}

      {o("janhvi") > 0 && (
        <AbsoluteFill style={{ opacity: o("janhvi") }}>
          <Title text={"జాన్వీ కపూర్ కూడా\nస్పందించింది"} t={B.janhvi} top={560} size={100} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 900, display: "flex", justifyContent: "center" }}>
            <Chip text="BOTH STARS CONDEMN THE DEEPFAKE" p={pop(frame, fps, B.janhvi + 0.8)} size={40} bg="rgba(255,45,74,0.92)" border="#fff" />
          </div>
        </AbsoluteFill>
      )}

      {o("shock") > 0 && (
        <AbsoluteFill style={{ opacity: o("shock") }}>
          <Title text="అసలు షాకింగ్ విషయం…" t={B.but} top={300} size={92} color={RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", gap: 40 }}>
            {(["REAL 🎥", "AI 🤖"] as const).map((label, i) => (
              <div key={label} style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.tech + i * 0.4)}) rotate(${i ? 3 : -3}deg)` }}>
                <div style={{ position: "relative" }}>
                  <BlurPoster w={380} blur={20} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 220, color: "#fff", textShadow: "0 0 30px #000" }}>?</div>
                </div>
                <div style={{ marginTop: 14, fontFamily: DISPLAY, fontSize: 60, color: i ? RED : "#fff" }}>{T > B.realistic + 1.5 ? label : "???"}</div>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 120, right: 120, top: 1330 }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 34, letterSpacing: 4, color: "#fff", marginBottom: 10 }}>AI REALISM</div>
            <div style={{ height: 44, borderRadius: 22, background: "rgba(255,255,255,0.15)", border: "3px solid #fff", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${lerp(10, 99, clamp((T - B.realistic) / 2.5))}%`, background: `linear-gradient(90deg, ${CYAN}, ${RED})` }} />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {o("warn") > 0 && (
        <AbsoluteFill style={{ opacity: o("warn") }}>
          <Title text={"వెంటనే నమ్మి\nSHARE చేయకండి!"} t={B.dont} top={300} size={96} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 300, height: 300, transform: `scale(${pop(frame, fps, B.share - 0.4)})` }}>
              <div style={{ position: "absolute", inset: 30, borderRadius: "50%", background: "#1d9bf0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width={130} height={130} viewBox="0 0 24 24"><path d="M14 4l8 8-8 8v-5c-6 0-9.5 2-12 6 1-6 4-11 12-12V4z" fill="#fff" /></svg>
              </div>
              <svg width={300} height={300} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
                <circle cx={50} cy={50} r={44} fill="none" stroke={RED} strokeWidth={9} />
                <line x1={19} y1={19} x2={81} y2={81} stroke={RED} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.share) * 3)} />
              </svg>
            </div>
          </div>
          {T > B.because - 0.2 && <Title text={"👁️ మీరు చూస్తున్నది\nనిజం కాకపోవచ్చు"} t={B.because} top={960} size={76} frame={frame} fps={fps} />}
          {T > B.fake - 0.2 && T < B.cta && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 1240, display: "flex", justifyContent: "center", transform: `translateX(${Math.sin(T * 60) * 4 * clamp(1 - (T - B.fake))}px)` }}>
              <Stamp text="AI FAKE కావచ్చు!" p={pop(frame, fps, B.fake - 0.2)} color={RED} size={90} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1200} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const NtrAiMorph: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.26], [0.9, "whoosh", 0.18], [B.song, "whoosh", 0.18], [B.song + 1.2, "pop", 0.16], [B.now, "whoosh", 0.18], [B.aiFake - 0.2, "boom", 0.24],
    [B.viral - 0.2, "pop", 0.18], [B.ntr, "whoosh", 0.2], [B.react, "boom", 0.22], [B.legal - 0.2, "pop", 0.2], [B.spread - 0.2, "pop", 0.18],
    [B.janhvi, "whoosh", 0.18], [B.but, "boom", 0.24], [B.tech, "pop", 0.18], [B.tech + 0.4, "pop", 0.18], [B.realistic + 1.5, "ding", 0.2],
    [B.dont, "whoosh", 0.2], [B.share, "boom", 0.2], [B.because, "whoosh", 0.16], [B.fake - 0.2, "boom", 0.24],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("ntr/voice.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <NtrScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const NtrAiMorphThumb: React.FC = () => (
  <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
    <BlurBg src={POSTER} blur={22} dim={0.45} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(80,0,15,0.35) 45%, rgba(0,0,0,0.9) 100%)" }} />
    <Scanlines o={0.2} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
      <span style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, padding: "6px 24px" }}>⚠️ JR NTR WARNING</span>
      <div style={{ marginTop: 16, marginBottom: 12, fontFamily: DISPLAY, fontSize: 150, lineHeight: 0.92, color: "#fff", textShadow: `6px 0 0 ${RED}, -6px 0 0 ${CYAN}, 0 12px 0 #000` }}>AI FAKE</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 96, lineHeight: 1.1, color: GOLD, WebkitTextStroke: `12px #000`, paintOrder: "stroke fill", textShadow: "0 8px 0 #000" }}>చుట్టమల్లె వీడియో!</div>
    </div>
    <div style={{ position: "absolute", left: 30, top: 690, textAlign: "center" }}>
      <FaceCircle src={staticFile("ntr/ntr.png")} iw={202} ih={249} cx={100} cy={100} fw={80} size={300} ring={GOLD} />
      <div style={{ marginTop: 12 }}><span style={{ fontFamily: DISPLAY, fontSize: 48, color: "#000", background: GOLD, borderRadius: 12, padding: "0 18px" }}>JR NTR</span></div>
    </div>
    <div style={{ position: "absolute", right: 30, top: 690, textAlign: "center" }}>
      <FaceCircle src={staticFile("ntr/janhvi.png")} iw={480} ih={640} cx={225} cy={215} fw={150} size={300} ring={RED} />
      <div style={{ marginTop: 12 }}><span style={{ fontFamily: DISPLAY, fontSize: 44, color: "#fff", background: RED, borderRadius: 12, padding: "0 16px" }}>JANHVI KAPOOR</span></div>
    </div>
    <div style={{ position: "absolute", left: 375, top: 670 }}>
      <TweetShot w={330} tilt={3} glow={0.7} />
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1130, display: "flex", justifyContent: "center", transform: "rotate(-6deg)" }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 96, color: RED, border: `10px solid ${RED}`, borderRadius: 16, padding: "0 30px", background: "rgba(0,0,0,0.75)" }}>AI MORPHED · FAKE</span>
    </div>
    <div style={{ position: "absolute", left: 40, right: 40, top: 1310, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 64, color: "#000", background: GOLD, border: "6px solid #000", borderRadius: 20, padding: "6px 30px", transform: "rotate(-2deg)", boxShadow: "0 14px 34px rgba(0,0,0,0.7)", textAlign: "center" }}>“I WILL NOT SPARE ANY OF YOU”</div>
    </div>
  </AbsoluteFill>
);
