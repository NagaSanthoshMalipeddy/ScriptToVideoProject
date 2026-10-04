import React from "react";
import { AbsoluteFill, Audio, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { TE_DISPLAY } from "../story/fonts";
import { BODY, DISPLAY } from "../airace/fonts";
import { countryGeom, SatelliteMap } from "../geo/SatelliteMap";
import { CtaCard, nudgeTimes, SubscribeNudge } from "../cartoon/Nudge";
import { Chip, Person, Stamp, Title, Tricolor } from "./PilotHero";
import { FaceCircle } from "./NtrAiMorph";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const GOLD = "#ffd23f";
const RED = "#ff3b4a";
const GREEN = "#2ecc71";
const SAFFRON = "#ff9933";
const BLUE = "#1e5aa8";
const INK = "#0d1220";

// Beat times (s) from pauses and word timestamps in the user's voiceover.
const B = {
  vote: 1.69, id: 4.01, missing: 5.75, shock: 8.16, nation: 11.68, crore: 15.43, really: 21.03, or: 23.91, twist: 26.55, check: 30.37,
  sir: 33.84, sirName: 38.41, verify: 42.47, cats: 46.8, dead: 51.28, shifted: 53.0, trace: 55.0, dup: 56.8, contro: 58.89, opp: 61.93,
  ec: 69.26, misleading: 73.49, figure: 78.14, notFinal: 83.0, question: 86.48, who: 91.42, final: 94.16, because: 97.38, checkName: 104.23,
  verdict: 109.3, safe: 113.92, voiceEnd: 122.62, cta: 123.0,
};
export const SIR_SECONDS = 128.5;
const CTA = { like: B.cta + 0.3, share: B.cta + 0.9, sub: B.cta + 1.5 };

const MODI = staticFile("politics/modi.jpg");
const RAHUL = staticFile("politics/rahul.png");

const pop = (frame: number, fps: number, t: number, damping = 11) => (frame < Math.round(t * fps) ? 0 : spring({ frame: frame - Math.round(t * fps), fps, config: { damping, mass: 0.6 } }));
const win = (T: number, a: number, b: number, f = 0.25) => clamp(Math.min(a <= 0 ? 1 : (T - a) / f, (b + f - T) / f));

const Modi: React.FC<{ size: number; ring?: string }> = ({ size, ring = SAFFRON }) => <FaceCircle src={MODI} iw={371} ih={463} cx={182} cy={150} fw={125} size={size} ring={ring} />;
const Rahul: React.FC<{ size: number; ring?: string }> = ({ size, ring = BLUE }) => <FaceCircle src={RAHUL} iw={960} ih={1040} cx={451} cy={350} fw={290} size={size} ring={ring} />;

// ---- art -------------------------------------------------------------------------------------
const VoterId: React.FC<{ w: number; stamp?: number; tilt?: number }> = ({ w, stamp = 0, tilt = 0 }) => (
  <div style={{ position: "relative", width: w, height: w * 0.62, borderRadius: w * 0.05, background: "linear-gradient(135deg, #fdf6e3, #e8eef8)", border: `${w * 0.012}px solid ${INK}`, boxShadow: "0 16px 40px rgba(0,0,0,0.5)", overflow: "hidden", transform: `rotate(${tilt}deg)` }}>
    <div style={{ height: w * 0.12, background: `linear-gradient(90deg, ${SAFFRON}, #fff, #138808)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY, fontWeight: 900, fontSize: w * 0.05, letterSpacing: w * 0.006, color: INK }}>ELECTION COMMISSION OF INDIA</div>
    <div style={{ display: "flex", gap: w * 0.05, padding: w * 0.05 }}>
      <div style={{ width: w * 0.24, height: w * 0.3, borderRadius: w * 0.02, background: "#c9d1dd", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}><Person size={w * 0.2} color="#7a869a" /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: w * 0.03, paddingTop: w * 0.02 }}>
        <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: w * 0.06, color: INK }}>VOTER ID</div>
        {[0.9, 0.7, 0.8].map((k, i) => <div key={i} style={{ height: w * 0.03, width: `${k * 100}%`, borderRadius: 4, background: "#9aa3ad" }} />)}
      </div>
    </div>
    {stamp > 0 && (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: w * 0.15, color: RED, border: `${w * 0.015}px solid ${RED}`, borderRadius: w * 0.03, padding: `0 ${w * 0.04}px`, background: "rgba(255,255,255,0.75)", transform: `rotate(-12deg) scale(${2 - stamp})`, opacity: clamp(stamp * 1.5) }}>DELETED?</span>
      </div>
    )}
  </div>
);

const VoterList: React.FC<{ w: number; rows?: number; missing?: number; scan?: number; strike?: number[] }> = ({ w, rows = 8, missing = -1, scan = -1, strike = [] }) => (
  <div style={{ position: "relative", width: w, background: "#fdfbf5", borderRadius: 20, border: `6px solid ${INK}`, boxShadow: "0 20px 50px rgba(0,0,0,0.55)", padding: "18px 26px", overflow: "hidden" }}>
    <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, letterSpacing: 4, color: "#55607a", marginBottom: 10 }}>ELECTORAL ROLL · PART 42</div>
    {Array.from({ length: rows }, (_, i) => {
      const gone = i === missing;
      return (
        <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 18, height: 56, borderBottom: "2px solid #e2e5ea" }}>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, color: "#8893a6", width: 40 }}>{101 + i}</span>
          <div style={{ height: 16, width: `${50 + ((i * 37) % 40)}%`, borderRadius: 6, background: gone ? "transparent" : "#b9c1cc", border: gone ? `3px dashed ${RED}` : "none" }} />
          {gone && <span style={{ marginLeft: "auto", fontFamily: DISPLAY, fontSize: 34, color: RED }}>YOUR NAME?</span>}
          {strike.includes(i) && <div style={{ position: "absolute", left: 50, right: 0, top: 26, height: 5, background: RED }} />}
        </div>
      );
    })}
    {scan >= 0 && <div style={{ position: "absolute", left: 0, right: 0, top: `${(scan % 1) * 100}%`, height: 8, background: "#2ad1ff", boxShadow: "0 0 26px #2ad1ff" }} />}
  </div>
);

// ---- scenes ----------------------------------------------------------------------------------
const SCENES: [string, number, number][] = [
  ["imagine", 0, B.nation - 0.15], ["nation", B.nation - 0.15, B.twist - 0.15], ["twist", B.twist - 0.15, B.sir - 0.15], ["sir", B.sir - 0.15, B.cats - 0.15],
  ["cats", B.cats - 0.15, B.contro - 0.15], ["contro", B.contro - 0.15, B.ec - 0.15], ["ec", B.ec - 0.15, B.question - 0.15], ["question", B.question - 0.15, B.checkName - 0.15],
  ["check", B.checkName - 0.15, B.safe - 0.15], ["safe", B.safe - 0.15, 999],
];

export const SirScene: React.FC<{ T: number; frame: number }> = ({ T, frame }) => {
  const { fps } = useVideoConfig();
  const o = (name: string) => {
    const s = SCENES.find((x) => x[0] === name)!;
    return win(T, s[1], s[2]);
  };
  const map = o("nation");

  return (
    <AbsoluteFill style={{ background: "#0a0f1c", overflow: "hidden" }}>
      <SatelliteMap view={{ lon: 80, lat: 22.5, span: 34 + 4 * Math.sin(T * 0.05) }} width={1080} height={1920} darken={0.1} highlights={[{ geom: countryGeom("IND"), fill: "rgba(255,153,51,0.18)", stroke: SAFFRON }]} />
      <AbsoluteFill style={{ background: `rgba(8,10,20,${0.7 - 0.5 * map})` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      {T < 0.25 && <AbsoluteFill style={{ background: "#fff", opacity: 1 - T / 0.25 }} />}

      {o("imagine") > 0 && (
        <AbsoluteFill style={{ opacity: o("imagine") }}>
          <Title text={T < B.missing ? "ఒక్కసారి ఊహించుకోండి…" : T < B.shock ? "లిస్ట్ లో మీ పేరే లేదు!" : "😱 నా ఓటు ఏమైంది?!"} t={T < B.missing ? 0.05 : T < B.shock ? B.missing : B.shock} top={310} size={T < B.missing ? 92 : 96} color={T < B.missing ? "#fff" : RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.vote - 0.3, 13)})` }}>
            <VoterList w={760} rows={8} missing={T > B.missing - 0.2 ? 4 : -1} />
          </div>
          <div style={{ position: "absolute", left: 120, top: 1080, transform: `translateY(${(1 - pop(frame, fps, B.id)) * 400}px)` }}>
            <VoterId w={520} tilt={-6} />
          </div>
          <div style={{ position: "absolute", right: 90, top: 1120, fontSize: 200, transform: `scale(${pop(frame, fps, B.shock)}) rotate(${Math.sin(T * 10) * 6}deg)` }}>😱</div>
        </AbsoluteFill>
      )}

      {o("nation") > 0 && (
        <AbsoluteFill style={{ opacity: o("nation") }}>
          <Title text="దేశవ్యాప్తంగా దుమారం!" t={B.nation} top={310} size={92} color={GOLD} frame={frame} fps={fps} />
          {T > B.crore - 0.2 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", transform: `scale(${pop(frame, fps, B.crore - 0.2, 9)})` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 300, lineHeight: 1, color: "#fff", textShadow: `0 14px 0 ${INK}, 0 0 50px rgba(255,59,74,0.7)` }}>{Math.round(clamp((T - B.crore) / 1.5) * 13)}</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 120, color: RED, WebkitTextStroke: `12px ${INK}`, paintOrder: "stroke fill", marginTop: -20 }}>కోట్ల ఓటర్లు</div>
            </div>
          )}
          {T > B.really - 0.2 && <Title text={T < B.or ? "నిజంగానే తీసేశారా? 🤔" : "లేక… అసలు ట్విస్ట్ ఉందా?"} t={T < B.or ? B.really : B.or} top={1250} size={80} frame={frame} fps={fps} />}
        </AbsoluteFill>
      )}

      {o("twist") > 0 && (
        <AbsoluteFill style={{ opacity: o("twist") }}>
          <Title text={"13 కోట్ల లెక్క వెనుక\nఅసలు ట్విస్ట్!"} t={B.twist} top={330} size={100} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.check)})` }}>
            <div style={{ width: 460, height: 640, borderRadius: 60, background: "#0b0f17", border: "12px solid #1d2638", padding: 30, boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 30, color: "#9fb3d1", letterSpacing: 3 }}>VOTER LIST</div>
              <div style={{ marginTop: 24, height: 80, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: BODY, fontWeight: 800, fontSize: 34, color: INK }}>
                🔍 {"YOUR NAME".slice(0, Math.max(0, Math.round((T - B.check - 0.5) * 8)))}
              </div>
              <div style={{ marginTop: 40, fontSize: 200, textAlign: "center" }}>🗳️</div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {o("sir") > 0 && (
        <AbsoluteFill style={{ opacity: o("sir") }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 310, textAlign: "center", transform: `scale(${pop(frame, fps, B.sir)})` }}>
            <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, color: "#9fb3d1" }}>🏛️ ELECTION COMMISSION</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 220, lineHeight: 1, color: GOLD, textShadow: `0 12px 0 ${INK}` }}>{T > B.sirName - 0.3 ? "S·I·R" : "???"}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 52, color: "#fff", opacity: clamp((T - B.sir - 1) * 2) }}>SPECIAL INTENSIVE REVISION</div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.verify - 0.4, 13)})` }}>
            <VoterList w={760} rows={7} scan={T > B.verify ? (T - B.verify) * 0.5 : -1} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", justifyContent: "center" }}>
            <Chip text="🔍 దేశవ్యాప్తంగా రీ-వెరిఫికేషన్" p={pop(frame, fps, B.verify + 0.6)} size={46} te />
          </div>
        </AbsoluteFill>
      )}

      {o("cats") > 0 && (
        <AbsoluteFill style={{ opacity: o("cats") }}>
          <Title text={"≈ 13 కోట్ల ఎంట్రీస్\n4 కేటగిరీస్ లో"} t={B.cats} top={300} size={88} color={GOLD} frame={frame} fps={fps} />
          {([["🕊️", "DEAD", "చనిపోయినవాళ్లు", B.dead], ["🚚", "SHIFTED", "వేరే ప్రాంతానికి", B.shifted], ["❓", "ABSENT", "ట్రేస్ కాలేదు", B.trace], ["👥", "DUPLICATE", "డూప్లికేట్ ఎంట్రీలు", B.dup]] as const).map(([e, en, te, t], i) => {
            const p = pop(frame, fps, t - 0.2);
            return p > 0.01 ? (
              <div key={en} style={{ position: "absolute", left: 70, right: 70, top: 560 + i * 210, height: 180, display: "flex", alignItems: "center", gap: 30, padding: "0 34px", background: "rgba(10,14,26,0.9)", border: `5px solid ${GOLD}`, borderRadius: 30, transform: `translateX(${(1 - p) * (i % 2 ? 900 : -900)}px)` }}>
                <span style={{ fontSize: 100 }}>{e}</span>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 64, color: GOLD, lineHeight: 1 }}>{en}</div>
                  <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 52, color: "#fff" }}>{te}</div>
                </div>
              </div>
            ) : null;
          })}
        </AbsoluteFill>
      )}

      {o("contro") > 0 && (
        <AbsoluteFill style={{ opacity: o("contro") }}>
          <Title text="కాంట్రవర్సీ మొదలు! 🔥" t={B.contro} top={300} size={96} color={RED} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", alignItems: "center", gap: 30 }}>
            <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.contro + 0.4)})` }}>
              <Rahul size={330} />
              <div style={{ marginTop: 10 }}><span style={{ fontFamily: DISPLAY, fontSize: 46, color: "#fff", background: BLUE, borderRadius: 12, padding: "0 18px" }}>OPPOSITION</span></div>
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 120, color: GOLD, transform: `scale(${pop(frame, fps, B.contro + 1, 8)})` }}>VS</div>
            <div style={{ textAlign: "center", transform: `scale(${pop(frame, fps, B.contro + 0.8)})` }}>
              <Modi size={330} />
              <div style={{ marginTop: 10 }}><span style={{ fontFamily: DISPLAY, fontSize: 46, color: "#000", background: SAFFRON, borderRadius: 12, padding: "0 18px" }}>BJP</span></div>
            </div>
          </div>
          {T > B.opp - 0.2 && (
            <div style={{ position: "absolute", left: 60, right: 60, top: 990, background: "rgba(10,14,26,0.92)", border: `5px solid ${BLUE}`, borderLeft: `16px solid ${BLUE}`, borderRadius: 26, padding: "24px 30px", transform: `scale(${pop(frame, fps, B.opp - 0.2)})` }}>
              <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 32, letterSpacing: 4, color: "#9fc1ff", marginBottom: 14 }}>OPPOSITION ALLEGES</div>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 60, color: "#fff", lineHeight: 1.25 }}>జెన్యూన్ ఓటర్ల పేర్లు కూడా పొరపాటున తొలగిపోయే ప్రమాదం!</div>
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("ec") > 0 && (
        <AbsoluteFill style={{ opacity: o("ec") }}>
          <Title text="ఎలక్షన్ కమిషన్ క్లారిఫికేషన్ 🏛️" t={B.ec} top={300} size={74} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 460, display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", fontFamily: DISPLAY, fontSize: 92, color: "#fff", background: "rgba(0,0,0,0.85)", border: "6px solid #fff", borderRadius: 24, padding: "14px 40px", textAlign: "center", lineHeight: 1.05, transform: `scale(${pop(frame, fps, B.misleading - 0.3)})` }}>
              “13 CRORE<br />VOTERS DELETED”
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
                <line x1={4} y1={90} x2={96} y2={10} stroke={RED} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp((T - B.misleading - 1.2) * 2)} />
              </svg>
            </div>
          </div>
          {T > B.misleading + 1.6 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 760, display: "flex", justifyContent: "center" }}>
              <Stamp text="MISLEADING" p={pop(frame, fps, B.misleading + 1.6)} color={RED} size={110} te={false} />
            </div>
          )}
          {T > B.figure - 0.2 && (
            <div style={{ position: "absolute", left: 70, right: 70, top: 1000, background: "rgba(10,14,26,0.92)", border: `5px solid ${GREEN}`, borderRadius: 26, padding: "22px 30px", transform: `scale(${pop(frame, fps, B.figure - 0.2)})` }}>
              <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 58, color: "#fff", lineHeight: 1.25 }}>13 కోట్లు = వెరిఫికేషన్ లో గుర్తించిన ఎంట్రీస్</div>
              {T > B.notFinal - 0.2 && <div style={{ marginTop: 10, fontFamily: DISPLAY, fontSize: 56, color: GREEN }}>NOT FINAL DELETIONS ✓</div>}
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("question") > 0 && (
        <AbsoluteFill style={{ opacity: o("question") }}>
          <Title text={T < B.who ? "అసలు ప్రశ్న…" : T < B.final ? "ఆ 13 కోట్లలో ఎవరున్నారు?" : T < B.because ? "ఫైనల్ లిస్ట్ లో ఎవరు?" : "ID ఉన్నా… పేరు లేకపోతే?"} t={T < B.who ? B.question : T < B.final ? B.who : T < B.because ? B.final : B.because} top={310} size={84} color={GOLD} frame={frame} fps={fps} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 500, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.question + 0.3, 13)})` }}>
            <VoterList w={760} rows={8} missing={T > B.because ? 3 : -1} strike={T > B.who ? [1, 5] : []} />
          </div>
          {T > B.because + 1 && (
            <>
              <div style={{ position: "absolute", left: 90, top: 1080, transform: `scale(${pop(frame, fps, B.because + 1)})` }}>
                <VoterId w={460} tilt={-5} />
              </div>
              <div style={{ position: "absolute", right: 70, top: 1140 }}>
                <Stamp text={"NO\nVOTE ❌"} p={pop(frame, fps, B.because + 3)} color={RED} size={84} te={false} />
              </div>
            </>
          )}
        </AbsoluteFill>
      )}

      {o("check") > 0 && (
        <AbsoluteFill style={{ opacity: o("check") }}>
          <Title text={T < B.verdict ? "మీ పేరు చెక్ చేసుకోండి! ✅" : "13 కోట్ల ఓట్లు పోయాయా?"} t={T < B.verdict ? B.checkName : B.verdict} top={300} size={84} color={GOLD} frame={frame} fps={fps} />
          {T < B.verdict ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.checkName + 0.3)})` }}>
              <div style={{ width: 520, height: 860, borderRadius: 60, background: "#0b0f17", border: "12px solid #1d2638", padding: 34, boxShadow: "0 30px 60px rgba(0,0,0,0.6)" }}>
                <div style={{ fontFamily: BODY, fontWeight: 900, fontSize: 28, color: "#9fb3d1", letterSpacing: 2 }}>electoralsearch.eci.gov.in</div>
                <div style={{ marginTop: 24, height: 84, borderRadius: 20, background: "#fff", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: BODY, fontWeight: 800, fontSize: 34, color: INK }}>
                  🔍 {"YOUR NAME / EPIC NO.".slice(0, Math.max(0, Math.round((T - B.checkName - 0.8) * 9)))}
                </div>
                {T > B.checkName + 3.2 && (
                  <div style={{ marginTop: 40, padding: 26, borderRadius: 24, background: "rgba(46,204,113,0.18)", border: `4px solid ${GREEN}`, transform: `scale(${pop(frame, fps, B.checkName + 3.2)})` }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 70, color: GREEN }}>✅ FOUND</div>
                    <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 44, color: "#fff" }}>మీ పేరు లిస్ట్ లో ఉంది</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center" }}>
              <Stamp text={"WRONG\nCLAIM ❌"} p={pop(frame, fps, B.verdict + 1.2)} color={RED} size={120} te={false} />
            </div>
          )}
        </AbsoluteFill>
      )}

      {o("safe") > 0 && (
        <AbsoluteFill style={{ opacity: o("safe") }}>
          <Title text={"మీ ఓటు సేఫ్ గా\nఉందా? 🗳️"} t={B.safe} top={330} size={110} color={GOLD} frame={frame} fps={fps} />
          {T < B.cta && (
            <>
              <div style={{ position: "absolute", left: 0, right: 0, top: 720, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.safe + 1)})` }}>
                <div style={{ position: "relative" }}>
                  <VoterId w={600} />
                  <div style={{ position: "absolute", right: -40, top: -50, width: 140, height: 140, borderRadius: "50%", background: GREEN, border: "8px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 90, color: "#fff", transform: `scale(${pop(frame, fps, B.safe + 3)})` }}>✓</div>
                </div>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 1170, display: "flex", justifyContent: "center", transform: `scale(${pop(frame, fps, B.safe + 4)})` }}>
                <Tricolor w={220} h={16} />
              </div>
              <Title text="ఇప్పుడే చెక్ చేసుకోండి!" t={B.safe + 5} top={1280} size={76} frame={frame} fps={fps} />
            </>
          )}
        </AbsoluteFill>
      )}

      {T >= B.cta && <AbsoluteFill style={{ background: "rgba(0,0,0,0.4)", opacity: clamp((T - B.cta) * 3) }} />}
      <SubscribeNudge T={T} until={B.cta} top={1480} />
      {T >= B.cta && <CtaCard T={T} top={1200} likeT={CTA.like} shareT={CTA.share} subT={CTA.sub} />}
    </AbsoluteFill>
  );
};

export const SirVotes: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const sfx: [number, string, number][] = [
    [0.05, "whoosh", 0.18], [B.vote - 0.3, "pop", 0.16], [B.id, "whoosh", 0.18], [B.missing, "boom", 0.24], [B.shock, "pop", 0.2], [B.nation, "whoosh", 0.2],
    [B.crore - 0.2, "boom", 0.26], [B.really, "pop", 0.18], [B.or, "pop", 0.18], [B.twist, "whoosh", 0.2], [B.check, "pop", 0.18], [B.sir, "whoosh", 0.2],
    [B.sirName - 0.3, "ding", 0.22], [B.verify, "whoosh", 0.16], [B.cats, "whoosh", 0.18], [B.dead - 0.2, "pop", 0.18], [B.shifted - 0.2, "pop", 0.18],
    [B.trace - 0.2, "pop", 0.18], [B.dup - 0.2, "pop", 0.18], [B.contro, "boom", 0.24], [B.contro + 1, "boom", 0.18], [B.opp - 0.2, "whoosh", 0.18],
    [B.ec, "whoosh", 0.2], [B.misleading - 0.3, "pop", 0.18], [B.misleading + 1.6, "boom", 0.24], [B.figure - 0.2, "whoosh", 0.16], [B.notFinal - 0.2, "ding", 0.22],
    [B.question, "whoosh", 0.18], [B.who, "pop", 0.18], [B.final, "pop", 0.18], [B.because + 1, "whoosh", 0.16], [B.because + 3, "boom", 0.22],
    [B.checkName, "whoosh", 0.18], [B.checkName + 3.2, "ding", 0.24], [B.verdict, "whoosh", 0.18], [B.verdict + 1.2, "boom", 0.22], [B.safe, "whoosh", 0.18],
    [B.safe + 3, "ding", 0.24],
  ];
  const cue = (time: number, name: string, vol: number) => (
    <Sequence key={`${name}${time.toFixed(2)}`} from={Math.max(0, Math.round(time * fps))} durationInFrames={45}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
  return (
    <AbsoluteFill>
      <Audio src={staticFile("politics/sir.mp3")} />
      {sfx.map(([time, n, v]) => cue(time, n, v))}
      {nudgeTimes(B.cta).map((time) => cue(time + 1.1, "ding", 0.18))}
      {cue(CTA.sub + 1.2, "ding", 0.3)}
      <SirScene T={T} frame={frame} />
    </AbsoluteFill>
  );
};

// 9:16 thumbnail (also the opening cover) — title and details inside y 300–1480.
export const SirVotesThumb: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a0f1c", overflow: "hidden" }}>
    <SatelliteMap view={{ lon: 80, lat: 22.5, span: 34 }} width={1080} height={1920} darken={0.3} highlights={[{ geom: countryGeom("IND"), fill: "rgba(255,59,74,0.25)", stroke: RED }]} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,15,0.9) 0%, rgba(60,0,10,0.4) 45%, rgba(5,5,15,0.92) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
      <span style={{ background: RED, color: "#fff", fontFamily: BODY, fontWeight: 900, fontSize: 40, letterSpacing: 6, padding: "6px 24px" }}>🚨 SIR VOTER LIST ROW</span>
    </div>
    <div style={{ position: "absolute", left: 30, top: 400 }}>
      <Rahul size={330} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -24, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 44, color: "#fff", background: BLUE, border: "4px solid #fff", borderRadius: 12, padding: "0 18px" }}>RAHUL GANDHI</span>
      </div>
    </div>
    <div style={{ position: "absolute", right: 30, top: 400 }}>
      <Modi size={330} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: -24, display: "flex", justifyContent: "center" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 44, color: "#000", background: SAFFRON, border: "4px solid #000", borderRadius: 12, padding: "0 18px" }}>PM MODI</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 520, textAlign: "center", fontFamily: DISPLAY, fontSize: 110, color: GOLD, textShadow: `0 8px 0 ${INK}` }}>VS</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 770, textAlign: "center" }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 240, lineHeight: 1, color: "#fff", textShadow: `8px 0 0 ${RED}, 0 14px 0 ${INK}` }}>13</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 108, lineHeight: 1.3, color: GOLD, WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}` }}>కోట్ల ఓట్లు</div>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 124, lineHeight: 1.3, color: RED, WebkitTextStroke: `14px ${INK}`, paintOrder: "stroke fill", textShadow: `0 10px 0 ${INK}` }}>మాయం?!</div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 1370, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: TE_DISPLAY, fontWeight: 700, fontSize: 64, color: INK, background: GOLD, border: `6px solid ${INK}`, borderRadius: 22, padding: "0 34px", transform: "rotate(-2deg)", boxShadow: "0 14px 34px rgba(0,0,0,0.7)" }}>🗳️ మీ పేరు లిస్ట్ లో ఉందా?</div>
    </div>
  </AbsoluteFill>
);
