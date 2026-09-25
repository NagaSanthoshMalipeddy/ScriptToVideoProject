import React from "react";
import { INK } from "./ui";

export type VehicleKind = "car" | "train" | "plane" | "jet" | "rocket";

/** Simple flat-cartoon vehicle icons with thick outlines. */
export const VehicleIcon: React.FC<{ kind: VehicleKind; size: number; color: string }> = ({ kind, size, color }) => {
  const sw = 5;
  const common = { fill: color, stroke: INK, strokeWidth: sw, strokeLinejoin: "round" as const };
  switch (kind) {
    case "car":
      return (
        <svg width={size} height={size * 0.7} viewBox="0 0 120 84">
          <rect x="8" y="36" width="104" height="26" rx="13" {...common} />
          <path d="M30 36 L46 18 L82 18 L98 36 Z" {...common} />
          <rect x="50" y="20" width="28" height="16" rx="3" fill="#bfe0ff" stroke={INK} strokeWidth={3} />
          <circle cx="34" cy="64" r="12" fill={INK} />
          <circle cx="34" cy="64" r="5" fill="#fff" />
          <circle cx="88" cy="64" r="12" fill={INK} />
          <circle cx="88" cy="64" r="5" fill="#fff" />
        </svg>
      );
    case "train":
      return (
        <svg width={size} height={size * 0.75} viewBox="0 0 120 90">
          <rect x="16" y="16" width="88" height="50" rx="16" {...common} />
          <rect x="28" y="28" width="26" height="18" rx="3" fill="#bfe0ff" stroke={INK} strokeWidth={3} />
          <rect x="66" y="28" width="26" height="18" rx="3" fill="#bfe0ff" stroke={INK} strokeWidth={3} />
          <rect x="38" y="52" width="44" height="10" rx="4" fill={INK} />
          <circle cx="40" cy="74" r="9" fill={INK} />
          <circle cx="80" cy="74" r="9" fill={INK} />
        </svg>
      );
    case "plane":
      return (
        <svg width={size} height={size * 0.75} viewBox="0 0 120 90">
          <path d="M8 46 Q30 36 84 38 L110 30 Q116 30 113 39 L100 46 L113 53 Q116 62 110 60 L84 54 Q30 56 8 46 Z" {...common} />
          <path d="M40 44 L30 18 L46 18 L62 42 Z" {...common} />
          <path d="M40 48 L30 74 L46 74 L62 50 Z" {...common} />
          <circle cx="26" cy="46" r="3.5" fill="#bfe0ff" />
          <circle cx="40" cy="46" r="3.5" fill="#bfe0ff" />
        </svg>
      );
    case "jet":
      return (
        <svg width={size} height={size * 0.75} viewBox="0 0 120 90">
          <path d="M112 46 L26 34 L48 46 L26 58 Z" {...common} />
          <path d="M52 46 L34 20 L62 42 Z" {...common} />
          <path d="M52 46 L34 72 L62 50 Z" {...common} />
          <path d="M20 46 L6 36 L16 46 L6 56 Z" {...common} />
        </svg>
      );
    case "rocket":
      return (
        <svg width={size} height={size * 0.7} viewBox="0 0 130 90">
          <path d="M40 32 L46 18 L54 32 Z" {...common} />
          <path d="M40 58 L46 72 L54 58 Z" {...common} />
          <path d="M30 34 L92 34 Q118 34 124 45 Q118 56 92 56 L30 56 Z" {...common} />
          <circle cx="98" cy="45" r="5" fill="#bfe0ff" />
          <path d="M30 37 L8 45 L30 53 Z" fill="#ff7a00" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
          <path d="M24 41 L6 45 L24 49 Z" fill="#ffd166" />
        </svg>
      );
  }
};
