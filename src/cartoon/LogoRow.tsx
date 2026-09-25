import React from "react";
import { spring, useVideoConfig } from "remotion";
import { BRAND_GLYPHS } from "./logos";
import { INK } from "./ui";
import { TE_DISPLAY } from "../story/fonts";

const NAMES: Record<string, string> = {
  oracle: "Oracle",
  amazon: "amazon",
  microsoft: "Microsoft",
  dell: "Dell",
  meta: "Meta",
  paypal: "PayPal",
  adidas: "adidas",
};

export const Mark: React.FC<{ slug: string; size: number }> = ({ slug, size }) => {
  if (slug === "microsoft") {
    const s = size * 0.44;
    const gap = size * 0.05;
    const c = size / 2;
    const sq = (x: number, y: number, col: string) => <rect x={x} y={y} width={s} height={s} fill={col} />;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {sq(c - s - gap / 2, c - s - gap / 2, "#F25022")}
        {sq(c + gap / 2, c - s - gap / 2, "#7FBA00")}
        {sq(c - s - gap / 2, c + gap / 2, "#00A4EF")}
        {sq(c + gap / 2, c + gap / 2, "#FFB900")}
      </svg>
    );
  }
  if (slug === "oracle") {
    return <div style={{ fontFamily: TE_DISPLAY, fontSize: size * 0.3, fontWeight: 800, color: "#C74634", letterSpacing: 1 }}>ORACLE</div>;
  }
  if (slug === "amazon") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: TE_DISPLAY, fontSize: size * 0.34, fontWeight: 800, color: "#232F3E", lineHeight: 1 }}>amazon</div>
        <svg width={size * 0.72} height={size * 0.2} viewBox="0 0 100 24">
          <path d="M4 5 Q50 28 96 5" fill="none" stroke="#FF9900" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  const g = BRAND_GLYPHS[slug];
  if (g) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d={g.path} fill={g.hex} />
      </svg>
    );
  }
  return <div style={{ fontFamily: TE_DISPLAY, fontSize: size * 0.28, color: INK }}>{NAMES[slug] ?? slug}</div>;
};

/** A row of brand-logo cards that pop in one after another. */
export const LogoRow: React.FC<{ slugs: string[]; frame: number; delay?: number; size?: number }> = ({ slugs, frame, delay = 6, size = 118 }) => {
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: "94%" }}>
      {slugs.map((slug, i) => {
        const p = spring({ frame: frame - delay - i * 5, fps, config: { damping: 12, mass: 0.6 } });
        return (
          <div
            key={slug}
            style={{
              width: size,
              height: size,
              background: "#fff",
              border: `4px solid ${INK}`,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 0 ${INK}`,
              transform: `scale(${0.6 + p * 0.4})`,
              opacity: p,
              padding: 12,
              boxSizing: "border-box",
            }}
          >
            <Mark slug={slug} size={size * 0.6} />
          </div>
        );
      })}
    </div>
  );
};
