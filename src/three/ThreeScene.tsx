import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";

const CUBE_COLORS = ["#ff4d5e", "#ffd166", "#2dd4bf", "#a78bfa", "#4ea3ff", "#ff8fab"];

const Scene: React.FC<{ t: number }> = ({ t }) => {
  const rot = t * 0.6;
  return (
    <>
      <ambientLight intensity={0.85} />
      <pointLight position={[6, 6, 6]} intensity={2.4} color="#ffffff" />
      <pointLight position={[-6, -3, 2]} intensity={1.1} color="#4ea3ff" />

      {/* Core globe */}
      <mesh rotation={[0.35, rot, 0]}>
        <sphereGeometry args={[2, 20, 20]} />
        <meshStandardMaterial color="#5ea0ff" wireframe />
      </mesh>
      <mesh rotation={[0.35, rot, 0]} scale={0.98}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial color="#16386f" emissive="#0a1c4a" emissiveIntensity={0.5} roughness={0.4} metalness={0.35} />
      </mesh>

      {/* Orbiting cubes */}
      {CUBE_COLORS.map((c, i) => {
        const a = rot * 1.4 + (i / CUBE_COLORS.length) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.4, Math.sin(a * 0.8) * 1.3, Math.sin(a) * 3.4]} rotation={[a, a * 1.3, 0]}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.25} roughness={0.25} metalness={0.5} />
          </mesh>
        );
      })}
    </>
  );
};

export const ThreeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const titleOp = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outro = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(120% 80% at 50% 30%, #0a1430 0%, #05070f 70%)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 8], fov: 50 }} style={{ position: "absolute" }}>
        <Scene t={t} />
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: height * 0.08, pointerEvents: "none", opacity: titleOp * outro }}>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: Math.min(96, width / 11), fontWeight: 900, color: "#eaf2ff", letterSpacing: 2, textShadow: "0 0 30px rgba(78,163,255,0.6)" }}>
          3D in Remotion
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
