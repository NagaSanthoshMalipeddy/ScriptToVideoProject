import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { BackgroundBeat } from "../cartoon/WithCover";
import { Chip, Stamp } from "./PilotHero";
import { BlurBg, BlurPoster, FaceCircle, Quote, Robot, Scanlines, TweetShot } from "./NtrAiMorph";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const GOLD = "#ffd23f";
const RED = "#ff2d4a";
const CYAN = "#2ad1ff";
const GREEN = "#2ecc71";
const INK = "#0b0d14";

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  viral: 3.55, believe: 7.8, but: 10.44, never: 12.38, janhvi: 16.01, song: 18.86, devara: 23.38, original: 28.55, morph: 31.61, indecent: 37.19,
  notThere: 41.44, ntr: 46.73, quote: 52.48, legal: 59.18, spread: 63.0, dont: 68.08, understand: 74.22, what: 76.49, simple: 79.03, face: 80.48,
  voice: 82.2, body: 83.0, ai: 84.0, notDone: 87.79, real: 92.27, behind: 95.03, danger: 99.21, past: 102.17, now: 108.96, tech: 110.11,
  expr: 112.75, vox: 113.9, lips: 114.6, natural: 115.79, think: 119.58, celeb: 121.6, voiceEnd: 123.59, cta: 124.0,
};
export const DEEPFAKE_SECONDS = 129.5;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const POSTER = staticFile("ntr/poster.png");
const NTR_IMG = staticFile("ntr/ntr.png");
const JANHVI_IMG = staticFile("ntr/janhvi.png");

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

const Ntr: React.FC<{ size: number; ring?: string }> = ({ size, ring = GOLD }) => <FaceCircle src={NTR_IMG} iw={202} ih={249} cx={100} cy={100} fw={80} size={size} ring={ring} />;
const Janhvi: React.FC<{ size: number; ring?: string }> = ({ size, ring = RED }) => <FaceCircle src={JANHVI_IMG} iw={480} ih={640} cx={225} cy={215} fw={150} size={size} ring={ring} />;

const Head: React.FC<{ text: string; t: number; left: number; top: number; width: number; size?: number; color?: string; frame: number; fps: number; te?: boolean; align?: "left" | "center" }> = ({ text, t, left, top, width, size = 90, color = "#fff", frame, fps, te = true, align = "left" }) => {
  const p = pop(frame, fps, t);
  return (
    <div style={{ position: "absolute", left, top, width, textAlign: align, transform: `translateY(${(1 - p) * 40}px)`, opacity: clamp(p * 1.6) }}>
      <span style={{ fontFamily: te ? TE_DISPLAY : DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.18, color, WebkitTextStroke: `10px ${INK}`, paintOrder: "stroke fill", textShadow: `0 8px 0 ${INK}`, whiteSpace: "pre-line" }}>{text}</span>
    </div>
  );
};

// Generic faceless bust used for the "real vs fake" frames.
const Bust: React.FC<{ w: number; color?: string }> = ({ w, color = "#d9dde6" }) => (
  <svg width={w} height={w * 1.1} viewBox="0 0 200 220">
    <circle cx={100} cy={78} r={48} fill={color} />
    <path d="M20 220 Q20 140 100 136 Q180 140 180 220 Z" fill={color} />
  </svg>
);

const VideoFrame: React.FC<{ w: number; label: string; color: string; children: React.ReactNode; p?: number; tilt?: number }> = ({ w, label, color, children, p = 1, tilt = 0 }) => (
  <div style={{ transform: `scale(${p}) rotate(${tilt}deg)`, opacity: clamp(p * 2), textAlign: "center" }}>
    <div style={{ position: "relative", width: w, height: w * 0.62, borderRadius: 22, overflow: "hidden", background: "#11141d", border: `8px solid ${color}`, boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
      <div style={{ position: "absolute", left: 16, bottom: 12, right: 16, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.25)" }}>
        <div style={{ width: "45%", height: "100%", borderRadius: 4, background: RED }} />
      </div>
    </div>
    <div style={{ marginTop: 14, fontFamily: DISPLAY, fontSize: 54, color }}>{label}</div>
  </div>
);

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["hook", 0, B.viral - 0.15], ["viral", B.viral - 0.15, B.but - 0.15], ["never", B.but - 0.15, B.janhvi - 0.15], ["song", B.janhvi - 0.15, B.original - 0.15],
  ["morph", B.original - 0.15, B.ntr - 0.15], ["ntr", B.ntr - 0.15, B.dont - 0.15], ["dont", B.dont - 0.15, B.understand - 0.15], ["what", B.understand - 0.15, B.real - 0.15],
  ["danger", B.real - 0.15, B.now - 0.15], ["now", B.now - 0.15, B.think - 0.15], ["end", B.think - 0.15, 999],
];

export const DeepfakeScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const glitch = (T < 0.8 || (T > B.morph && T < B.morph + 0.5) || (T > B.never && T < B.never + 0.4) || (T > B.danger && T < B.danger + 0.4)) ? Math.sin(T * 97) * 16 : 0;

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <BlurBg src={POSTER} blur={40} dim={0.68} scale={1.3} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(42,209,255,0.06) 2px, transparent 2px), linear-gradient(90deg, rgba(42,209,255,0.06) 2px, transparent 2px)", backgroundSize: "80px 80px" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.75) 100%)" }} />
      <Scanlines o={0.14} />
      {T < 0.25 && <AbsoluteFill style={{ background: RED, opacity: 1 - T / 0.25 }} />}

      {o("hook") > 0 && (
        <AbsoluteFill style={{ opacity: o("hook") }}>
          <div style={{ position: "absolute", left: 180, top: 260, transform: `translateX(${glitch}px) scale(${pop(frame, fps, 0.1, 9)})` }}>
            <Robot size={460} eye={0.6 + 0.4 * Math.sin(T * 12)} />
          </div>
          <div style={{ position: "absolute", left: 760, top: 210, transform: `translateX(${-glitch}px)` }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 260, lineHeight: 1, color: RED, textShadow: `8px 0 0 ${CYAN}, -8px 0 0 #fff, 0 14px 0 #000` }}>AI</span>
          </div>
          <Head text={"ఇంత దారుణంగా\nవాడుతున్నారా?!"} t={0.8} left={760} top={500} width={1100} size={110} color={GOLD} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("viral") > 0 && (
        <AbsoluteFill style={{ opacity: o("viral") }}>
          <Head text={"స్టార్ హీరోయిన్ వీడియో\nవైరల్!"} t={B.viral} left={110} top={200} width={1040} size={88} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 120, top: 520, display: "flex", gap: 18, flexWrap: "wrap", width: 820 }}>
            {["❤️ LIKES", "↗ SHARES", "💬 COMMENTS", "📈 TRENDING"].map((t, i) => (
              <Chip key={t} text={t} p={pop(frame, fps, B.viral + 1.2 + i * 0.35)} size={40} bg={i === 3 ? "rgba(255,45,74,0.92)" : "rgba(0,0,0,0.8)"} border={i === 3 ? "#fff" : GOLD} />
            ))}
          </div>
          <Head text="👀 చాలామంది నిజమే అనుకున్నారు" t={B.believe} left={110} top={780} width={900} size={62} color={CYAN} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 1180, top: 120, width: 460, height: 840, borderRadius: 60, background: "#0b0f17", border: "12px solid #1d2638", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", overflow: "hidden", transform: `scale(${pop(frame, fps, B.viral + 0.3, 13)}) rotate(3deg)` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BlurPoster w={440} blur={28} />
            </div>
            <div style={{ position: "absolute", left: "50%", top: "50%", width: 130, height: 130, marginLeft: -65, marginTop: -65, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={60} height={60} viewBox="0 0 24 24"><path d="M7 4 L20 12 L7 20 Z" fill="#fff" /></svg>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {o("never") > 0 && (
        <AbsoluteFill style={{ opacity: o("never") }}>
          <Head text="కానీ అసలు విషయం…" t={B.but} left={0} top={170} width={1920} size={110} color={GOLD} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", gap: 30, transform: `translateX(${glitch}px)` }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ position: "relative", width: 330, height: 220, borderRadius: 14, overflow: "hidden", border: "6px solid #222", transform: `scale(${pop(frame, fps, B.never - 0.4 + i * 0.15)})` }}>
                <BlurBg src={POSTER} blur={22} dim={0.3} scale={1.4} />
                <svg width={330} height={220} viewBox="0 0 330 220" style={{ position: "absolute", inset: 0 }}>
                  <path d="M20 20 L310 200 M310 20 L20 200" stroke={RED} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.never - 0.6 - i * 0.2) * 2.5)} />
                </svg>
              </div>
            ))}
          </div>
          {T > B.never + 1.0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center" }}>
              <Stamp text="ఆ సీన్స్ ఎప్పుడూ జరగలేదు!" p={pop(frame, fps, B.never + 1.0)} color={RED} size={96} tilt={-3} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("song") > 0 && (
        <AbsoluteFill style={{ opacity: o("song") }}>
          <div style={{ position: "absolute", left: 130, top: 230, textAlign: "center", transform: `scale(${pop(frame, fps, B.janhvi)})` }}>
            <Janhvi size={420} />
            <div style={{ marginTop: 16 }}><span style={{ fontFamily: DISPLAY, fontSize: 58, color: "#fff", background: RED, borderRadius: 14, padding: "0 22px" }}>JANHVI KAPOOR</span></div>
          </div>
          <div style={{ position: "absolute", right: 130, top: 230, textAlign: "center", transform: `scale(${pop(frame, fps, B.song + 0.6)})` }}>
            <Ntr size={420} />
            <div style={{ marginTop: 16 }}><span style={{ fontFamily: DISPLAY, fontSize: 58, color: "#000", background: GOLD, borderRadius: 14, padding: "0 22px" }}>JR NTR</span></div>
          </div>
          <Head text={T < B.song ? "జాన్వీ కపూర్ విషయంలో…" : "చుట్టమల్లె సాంగ్ గుర్తుందా? 🎵"} t={T < B.song ? B.janhvi + 0.3 : B.song} left={0} top={80} width={1920} size={84} color={GOLD} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.song + 0.2, 13)})` }}>
            <BlurPoster w={280} blur={24} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 920, display: "flex", justifyContent: "center" }}>
            <Chip text="DEVARA: PART 1 · 2024 · SUPER HIT 🔥" p={pop(frame, fps, B.devara)} size={44} />
          </div>
        </AbsoluteFill>
      )}

      {o("morph") > 0 && (
        <AbsoluteFill style={{ opacity: o("morph") }}>
          <Head text={T < B.morph ? "అదే ఒరిజినల్ ఫుటేజ్ తీసుకుని…" : T < B.indecent ? "AI తో పూర్తిగా మార్చేశారు!" : T < B.notThere ? "అసభ్యకరంగా మార్పులు!" : "లేనిది ఉన్నట్టుగా చూపించారు!"} t={T < B.morph ? B.original : T < B.indecent ? B.morph : T < B.notThere ? B.indecent : B.notThere} left={0} top={90} width={1920} size={86} color={T < B.morph ? "#fff" : RED} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 0, right: 0, top: 260, display: "flex", justifyContent: "center", alignItems: "center", gap: 70 }}>
            <VideoFrame w={620} label="ORIGINAL ✓" color={GREEN} p={pop(frame, fps, B.original + 0.3)}>
              <BlurBg src={POSTER} blur={30} dim={0.2} scale={1.2} />
            </VideoFrame>
            <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.morph)})` }}>
              <Robot size={190} eye={0.6 + 0.4 * Math.sin(T * 12)} />
              <div style={{ fontFamily: DISPLAY, fontSize: 90, color: CYAN, marginTop: -10 }}>→</div>
            </div>
            <VideoFrame w={620} label="AI MORPHED ✗" color={RED} p={pop(frame, fps, B.morph + 0.8)}>
              <div style={{ position: "absolute", inset: 0, transform: `translateX(${glitch}px)` }}><BlurBg src={POSTER} blur={40} dim={0.4} scale={1.3} /></div>
              <AbsoluteFill style={{ background: `repeating-linear-gradient(90deg, rgba(255,45,74,0.25) 0 6px, transparent 6px 18px)` }} />
              {T > B.indecent - 0.2 && <div style={{ position: "relative", fontFamily: BODY, fontWeight: 900, fontSize: 56, letterSpacing: 8, color: "#fff", background: "#000", padding: "10px 40px", transform: `scale(${pop(frame, fps, B.indecent - 0.2)})` }}>CENSORED</div>}
            </VideoFrame>
          </div>
          {T > B.notThere + 1 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 860, display: "flex", justifyContent: "center" }}>
              <Chip text="📈 VIRAL ON SOCIAL MEDIA · 100% FAKE" p={pop(frame, fps, B.notThere + 1)} size={44} bg="rgba(255,45,74,0.92)" border="#fff" />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("ntr") > 0 && (
        <AbsoluteFill style={{ opacity: o("ntr") }}>
          <div style={{ position: "absolute", left: 90, top: 200, textAlign: "center", transform: `scale(${pop(frame, fps, B.ntr)})` }}>
            <Ntr size={400} />
            <div style={{ marginTop: 16 }}><span style={{ fontFamily: DISPLAY, fontSize: 56, color: "#000", background: GOLD, borderRadius: 14, padding: "0 22px" }}>JR NTR ON 𝕏</span></div>
          </div>
          <div style={{ position: "absolute", left: 590, top: 150, transform: `scale(${pop(frame, fps, B.ntr + 1.2, 13)})` }}>
            <TweetShot w={420} tilt={-2} glow={0.6} />
          </div>
          <Head text="తీవ్రంగా స్పందించారు 🔥" t={B.ntr + 0.5} left={1080} top={110} width={800} size={70} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 1080, top: 300, width: 780 }}>
            {T < B.legal - 0.3 ? (
              <Quote text="Disgusting, Sick and Shameless." p={pop(frame, fps, B.quote)} color={RED} size={64} />
            ) : T < B.spread ? (
              <Quote text="I will not spare any of you." p={pop(frame, fps, B.legal - 0.3)} color={GOLD} size={64} />
            ) : (
              <Quote text="I will take every possible legal action against those who created it and those who are spreading it." p={pop(frame, fps, B.spread)} size={44} />
            )}
          </div>
          {T > B.legal + 1.5 && (
            <div style={{ position: "absolute", left: 1080, top: 760, display: "flex", gap: 16, flexWrap: "wrap", width: 780 }}>
              <Chip text="⚖️ CREATORS" p={pop(frame, fps, B.legal + 1.5)} size={42} bg="rgba(255,45,74,0.92)" border="#fff" />
              <Chip text="⚖️ SPREADERS" p={pop(frame, fps, B.spread + 1.5)} size={42} bg="rgba(255,45,74,0.92)" border="#fff" />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("dont") > 0 && (
        <AbsoluteFill style={{ opacity: o("dont") }}>
          <Head text="ప్రజలకు రిక్వెస్ట్ 🙏" t={B.dont} left={0} top={120} width={1920} size={100} color={GOLD} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", gap: 90 }}>
            {([["👁️", "WATCH", "చూడొద్దు"], ["↗", "SHARE", "షేర్ చేయొద్దు"], ["💬", "ENGAGE", "ఎంగేజ్ అవ్వొద్దు"]] as const).map(([e, en, te], i) => {
              const t = B.dont + 0.6 + i * 1.3;
              return (
                <div key={en} style={{ textAlign: "center", transform: `scale(${pop(frame, fps, t)})` }}>
                  <div style={{ position: "relative", width: 300, height: 300, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "6px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 150, color: "#fff" }}>
                    {e}
                    <svg width={300} height={300} viewBox="0 0 100 100" style={{ position: "absolute", inset: -6 }}>
                      <circle cx={50} cy={50} r={46} fill="none" stroke={RED} strokeWidth={7} />
                      <line x1={18} y1={18} x2={82} y2={82} stroke={RED} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - t - 0.3) * 3)} />
                    </svg>
                  </div>
                  <div style={{ marginTop: 18, fontFamily: DISPLAY, fontSize: 60, color: RED }}>{en}</div>
                  <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 48, color: "#fff" }}>{te}</div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}

      {o("what") > 0 && (
        <AbsoluteFill style={{ opacity: o("what") }}>
          <Head text={T < B.what ? "ఒక విషయం అర్థం చేసుకోవాలి…" : "అసలు DEEPFAKE అంటే ఏంటి? 🤔"} t={T < B.what ? B.understand : B.what} left={0} top={90} width={1920} size={92} color={GOLD} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 120, top: 330, display: "flex", flexDirection: "column", gap: 26 }}>
            {([["😐", "FACE", "ముఖం", B.face], ["🎙️", "VOICE", "వాయిస్", B.voice], ["🧍", "BODY", "బాడీ", B.body]] as const).map(([e, en, te, t]) => (
              <div key={en} style={{ display: "flex", alignItems: "center", gap: 22, padding: "14px 30px", background: "rgba(0,0,0,0.8)", border: `4px solid ${CYAN}`, borderRadius: 24, transform: `translateX(${(1 - pop(frame, fps, t)) * -700}px)` }}>
                <span style={{ fontSize: 80 }}>{e}</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 60, color: "#fff" }}>{en}</span>
                <span style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 46, color: CYAN }}>{te}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 720, top: 400, textAlign: "center", transform: `scale(${pop(frame, fps, B.ai)})` }}>
            <Robot size={220} eye={0.6 + 0.4 * Math.sin(T * 12)} />
            <div style={{ fontFamily: DISPLAY, fontSize: 120, color: CYAN, lineHeight: 0.8 }}>→</div>
          </div>
          <div style={{ position: "absolute", left: 1080, top: 340 }}>
            <VideoFrame w={700} label={T > B.notDone + 2 ? "= DEEPFAKE" : "ANOTHER VIDEO"} color={T > B.notDone + 2 ? RED : CYAN} p={pop(frame, fps, B.ai + 1)}>
              <Bust w={260} color={T > B.notDone ? "#ff8a9a" : "#d9dde6"} />
            </VideoFrame>
          </div>
          {T > B.notDone - 0.2 && <Head text="చేయని పని చేసినట్టుగా!" t={B.notDone} left={1060} top={880} width={760} size={62} color={RED} frame={frame} fps={fps} align="center" />}
        </AbsoluteFill>
      )}

      {o("danger") > 0 && (
        <AbsoluteFill style={{ opacity: o("danger") }}>
          <Head text={T < B.danger ? "నిజమే అనిపిస్తుంది… కానీ?" : T < B.past ? "⚠️ అందుకే డీప్‌ఫేక్ ప్రమాదం!" : "కొన్నేళ్ల క్రితం…"} t={T < B.danger ? B.real : T < B.past ? B.danger : B.past} left={0} top={90} width={1920} size={92} color={T < B.danger ? "#fff" : T < B.past ? RED : GOLD} frame={frame} fps={fps} align="center" />
          {T < B.past ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, display: "flex", justifyContent: "center", gap: 110, transform: `translateX(${glitch}px)` }}>
              <VideoFrame w={620} label={T > B.behind + 1 ? "REAL?" : "??"} color="#fff" p={pop(frame, fps, B.real + 0.3)} tilt={-2}>
                <Bust w={250} />
              </VideoFrame>
              <VideoFrame w={620} label={T > B.behind + 1 ? "FAKE?" : "??"} color={T > B.behind + 1 ? RED : "#fff"} p={pop(frame, fps, B.real + 0.7)} tilt={2}>
                <Bust w={250} />
              </VideoFrame>
            </div>
          ) : (
            <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", alignItems: "center", gap: 60 }}>
              <VideoFrame w={700} label="OLD FAKES: EASY TO SPOT 🧐" color={GREEN} p={pop(frame, fps, B.past + 0.3)}>
                <div style={{ position: "relative" }}>
                  <Bust w={240} />
                  <div style={{ position: "absolute", left: 40, top: 30, width: 160, height: 120, background: "#c9d1dd", transform: "rotate(14deg) translateX(30px)", border: "4px dashed #ff9900" }} />
                </div>
              </VideoFrame>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 56, color: "#fff", width: 520, lineHeight: 1.3, opacity: clamp((T - B.past - 2.5) * 2) }}>ఎడిట్ చేశారని<br />సులభంగా తెలిసేది ✓</div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("now") > 0 && (
        <AbsoluteFill style={{ opacity: o("now") }}>
          <Head text={T < B.tech ? "కానీ ఇప్పుడు…" : "టెక్నాలజీ చాలా ముందుకు వెళ్లింది! 🚀"} t={T < B.tech ? B.now : B.tech} left={0} top={90} width={1920} size={92} color={GOLD} frame={frame} fps={fps} align="center" />
          <div style={{ position: "absolute", left: 160, top: 320, display: "flex", flexDirection: "column", gap: 30 }}>
            {([["FACE EXPRESSIONS", B.expr], ["VOICE", B.vox], ["LIP MOVEMENTS", B.lips]] as const).map(([t, at]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 26, transform: `translateX(${(1 - pop(frame, fps, at)) * -800}px)` }}>
                <div style={{ width: 90, height: 90, borderRadius: 20, background: GREEN, border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, color: "#fff", fontFamily: DISPLAY }}>✓</div>
                <span style={{ fontFamily: DISPLAY, fontSize: 78, color: "#fff", textShadow: "0 6px 0 #000" }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", left: 1150, top: 320, width: 620, transform: `scale(${pop(frame, fps, B.natural - 0.3)})` }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 4, color: "#fff", marginBottom: 14 }}>LOOKS NATURAL</div>
            <div style={{ height: 60, borderRadius: 30, background: "rgba(255,255,255,0.15)", border: "4px solid #fff", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${lerp(20, 99, clamp((T - B.natural) / 2.5))}%`, background: `linear-gradient(90deg, ${CYAN}, ${RED})` }} />
            </div>
            <div style={{ marginTop: 14, fontFamily: DISPLAY, fontSize: 120, color: RED, textAlign: "right" }}>{Math.round(lerp(20, 99, clamp((T - B.natural) / 2.5)))}%</div>
          </div>
          <Head text="అన్నీ నాచురల్ గా!" t={B.natural} left={160} top={800} width={900} size={74} color={CYAN} frame={frame} fps={fps} />
        </AbsoluteFill>
      )}

      {o("end") > 0 && (
        <AbsoluteFill style={{ opacity: o("end") }}>
          <Head text="ఒక్కసారి ఆలోచించండి…" t={B.think} left={0} top={150} width={1920} size={110} color={GOLD} frame={frame} fps={fps} align="center" />
          {T < B.cta && (
            <>
              <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.celeb)})` }}>
                <VideoFrame w={720} label="నిజమేనా? 🤔" color={RED}>
                  <Bust w={260} />
                </VideoFrame>
              </div>
            </>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.45)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={40} />
      {T >= B.cta && <CtaCard T={T} top={560} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const DeepfakeExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "boom", 0.26], [0.8, "whoosh", 0.18], [B.viral, "whoosh", 0.18], [B.viral + 1.2, "pop", 0.14], [B.viral + 1.9, "pop", 0.14], [B.viral + 2.6, "pop", 0.14],
    [B.believe, "whoosh", 0.16], [B.but, "boom", 0.22], [B.never + 1.0, "boom", 0.22], [B.janhvi, "whoosh", 0.18], [B.song, "pop", 0.18], [B.devara, "ding", 0.2],
    [B.original, "whoosh", 0.18], [B.morph, "boom", 0.24], [B.indecent - 0.2, "boom", 0.2], [B.notThere + 1, "pop", 0.18], [B.ntr, "whoosh", 0.2],
    [B.quote, "boom", 0.24], [B.legal - 0.3, "pop", 0.2], [B.spread, "pop", 0.18], [B.dont, "whoosh", 0.18], [B.dont + 0.9, "pop", 0.18], [B.dont + 2.2, "pop", 0.18],
    [B.dont + 3.5, "pop", 0.18], [B.understand, "whoosh", 0.18], [B.what, "ding", 0.2], [B.face, "pop", 0.18], [B.voice, "pop", 0.18], [B.body, "pop", 0.18],
    [B.notDone + 2, "boom", 0.22], [B.real, "whoosh", 0.18], [B.danger, "boom", 0.24], [B.past, "whoosh", 0.16], [B.now, "whoosh", 0.18], [B.expr, "ding", 0.18],
    [B.vox, "ding", 0.18], [B.lips, "ding", 0.18], [B.think, "whoosh", 0.18], [B.celeb, "boom", 0.2],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <BackgroundBeat />
      <Audio src={staticFile("ntr/deepfake.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <DeepfakeScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 16:9 YouTube thumbnail.
export const DeepfakeExplainerThumb: React.FC = () => (
  <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
    <BlurBg src={POSTER} blur={30} dim={0.5} scale={1.4} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(120,0,20,0.55) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.75) 60%, rgba(60,40,0,0.5) 100%)" }} />
    <Scanlines o={0.18} />
    <div style={{ position: "absolute", left: 745, top: 150, transform: "rotate(-2deg)" }}>
      <div style={{ position: "relative" }}>
        <BlurPoster w={430} blur={5} />
        <div style={{ position: "absolute", inset: 10, borderRadius: 20, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.6) 100%)" }} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 60, top: 170 }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: 0, opacity: 0.6, filter: "hue-rotate(160deg)" }}><Janhvi size={560} ring={CYAN} /></div>
        <Janhvi size={560} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -40, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 62, color: "#fff", background: RED, border: "5px solid #fff", borderRadius: 14, padding: "0 24px", transform: "rotate(-4deg)" }}>JANHVI KAPOOR</span>
      </div>
    </div>
    <div style={{ position: "absolute", right: 60, top: 300 }}>
      <Ntr size={460} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -40, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 60, color: "#000", background: GOLD, border: "5px solid #000", borderRadius: 14, padding: "0 24px", transform: "rotate(4deg)" }}>JR NTR 😡</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 640, right: 540, top: 70, textAlign: "center" }}>
      <span style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, padding: "6px 22px" }}>⚠️ AI SHOCK</span>
      <div style={{ marginTop: 10, fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.9, color: "#fff", textShadow: `7px 0 0 ${RED}, -7px 0 0 ${CYAN}, 0 12px 0 #000` }}>DEEP</div>
      <div style={{ fontFamily: DISPLAY, fontSize: 170, lineHeight: 0.9, color: RED, textShadow: `7px 0 0 #fff, -7px 0 0 ${CYAN}, 0 12px 0 #000` }}>FAKE!</div>
      <div style={{ marginTop: 20, fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 76, lineHeight: 1.15, color: GOLD, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", textShadow: "0 8px 0 #000" }}>చుట్టమల్లె వీడియో<br />నిజం కాదు!</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 50, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 70, color: "#000", background: GOLD, border: "7px solid #000", borderRadius: 22, padding: "4px 40px", transform: "rotate(-1.5deg)", boxShadow: "0 14px 34px rgba(0,0,0,0.7)" }}>“I WILL NOT SPARE ANY OF YOU”</div>
    </div>
  </AbsoluteFill>
);
