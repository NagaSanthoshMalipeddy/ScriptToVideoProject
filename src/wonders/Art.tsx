import React from "react";
import { INK } from "../cartoon/ui";

const S = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const Sky: React.FC<{ top: string; bottom: string }> = ({ top, bottom }) => (
  <>
    <defs>
      <linearGradient id={`sky${top.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={300} height={300} fill={`url(#sky${top.slice(1)})`} />
  </>
);

const ChichenItza = () => {
  const tiers = Array.from({ length: 5 }, (_, i) => {
    const y = 250 - (i + 1) * 28;
    const inset = i * 20;
    return <path key={i} d={`M${30 + inset} ${y + 28} L${270 - inset} ${y + 28} L${262 - inset} ${y} L${38 + inset} ${y} Z`} fill={i % 2 ? "#e0bc85" : "#d4a86a"} {...S} />;
  });
  return (
    <>
      <Sky top="#8fd3ff" bottom="#dff3ff" />
      <circle cx={240} cy={60} r={26} fill="#ffd34d" {...S} />
      <rect x={0} y={250} width={300} height={50} fill="#7cc36b" {...S} />
      {tiers}
      <path d="M128 250 L172 250 L162 110 L138 110 Z" fill="#c9985a" {...S} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={131 + i * 0.6} y1={236 - i * 14} x2={169 - i * 0.6} y2={236 - i * 14} stroke={INK} strokeWidth={3} />
      ))}
      <rect x={116} y={70} width={68} height={40} fill="#d4a86a" {...S} />
      <rect x={140} y={84} width={20} height={26} fill={INK} />
      <rect x={110} y={62} width={80} height={10} fill="#c9985a" {...S} />
    </>
  );
};

const MachuPicchu = () => (
  <>
    <Sky top="#9ad8ff" bottom="#eaf7ff" />
    <path d="M150 300 L205 70 Q225 40 240 70 L300 220 L300 300 Z" fill="#3f9a4f" {...S} />
    <path d="M0 300 L0 170 L70 110 L130 190 L150 300 Z" fill="#5bb36a" {...S} />
    <ellipse cx={80} cy={60} rx={40} ry={16} fill="#fff" {...S} />
    {[0, 1, 2, 3].map((i) => (
      <path key={i} d={`M0 ${300 - i * 22} L${200 - i * 30} ${300 - i * 22} L${200 - i * 30} ${282 - i * 22} L0 ${282 - i * 22} Z`} fill={i % 2 ? "#8fd07a" : "#79c267"} {...S} />
    ))}
    {[[40, 196], [80, 196], [120, 218], [60, 240]].map(([x, y], i) => (
      <g key={i}>
        <rect x={x} y={y} width={30} height={20} fill="#b9b3a8" {...S} strokeWidth={4} />
        <path d={`M${x - 3} ${y} L${x + 15} ${y - 14} L${x + 33} ${y} Z`} fill="#8a6a4a" {...S} strokeWidth={4} />
      </g>
    ))}
  </>
);

const ChristRedeemer = () => (
  <>
    <Sky top="#ffb37a" bottom="#ffe6c7" />
    <circle cx={150} cy={140} r={80} fill="#ffd79a" opacity={0.8} />
    <path d="M0 300 L0 250 Q80 190 150 215 Q220 190 300 250 L300 300 Z" fill="#4c9a5a" {...S} />
    <rect x={132} y={200} width={36} height={22} fill="#cfc9bd" {...S} />
    <path d="M136 200 L164 200 L158 96 L142 96 Z" fill="#efece6" {...S} />
    <rect x={50} y={96} width={200} height={20} rx={8} fill="#efece6" {...S} />
    <rect x={138} y={92} width={24} height={30} fill="#efece6" {...S} />
    <circle cx={150} cy={76} r={16} fill="#efece6" {...S} />
  </>
);

const Colosseum = () => {
  const row = (y: number, h: number, n: number, x0: number, x1: number) =>
    Array.from({ length: n }, (_, i) => {
      const w = (x1 - x0) / n;
      const x = x0 + i * w + w * 0.2;
      const aw = w * 0.6;
      return <path key={`${y}-${i}`} d={`M${x} ${y + h} L${x} ${y + aw / 2} A${aw / 2} ${aw / 2} 0 0 1 ${x + aw} ${y + aw / 2} L${x + aw} ${y + h} Z`} fill="#5a4630" />;
    });
  return (
    <>
      <Sky top="#8fd3ff" bottom="#e6f6ff" />
      <rect x={0} y={255} width={300} height={45} fill="#d9cdb4" {...S} />
      <path d="M20 255 L20 90 L180 70 L220 110 L250 130 L280 150 L280 255 Z" fill="#e2c290" {...S} />
      {[90, 145, 200].map((y) => (
        <line key={y} x1={20} y1={y + 52} x2={280} y2={y + 52} stroke={INK} strokeWidth={4} />
      ))}
      {row(100, 40, 7, 24, 200)}
      {row(152, 44, 8, 24, 276)}
      {row(206, 46, 8, 24, 276)}
    </>
  );
};

const Petra = () => (
  <>
    <rect x={0} y={0} width={300} height={300} fill="#e8866a" />
    <path d="M0 0 L300 0 L300 300 L0 300 Z" fill="#d9735a" {...S} />
    <path d="M60 300 L60 160 L240 160 L240 300 Z" fill="#f0a283" {...S} />
    <path d="M52 160 L150 118 L248 160 Z" fill="#f0a283" {...S} />
    {[76, 110, 190, 224].map((x) => (
      <rect key={x} x={x - 7} y={170} width={14} height={120} fill="#f7b89c" {...S} strokeWidth={4} />
    ))}
    <rect x={132} y={210} width={36} height={90} fill="#5a2e22" {...S} />
    <path d="M90 118 L90 60 L210 60 L210 118 Z" fill="#f0a283" {...S} />
    <rect x={130} y={36} width={40} height={82} fill="#f7b89c" {...S} />
    <path d="M126 36 L150 12 L174 36 Z" fill="#f0a283" {...S} />
    <path d="M84 60 L112 40 L112 60 Z" fill="#f0a283" {...S} />
    <path d="M216 60 L188 40 L188 60 Z" fill="#f0a283" {...S} />
  </>
);

const TajMahal = () => (
  <>
    <Sky top="#ffc6d9" bottom="#fff0e6" />
    <rect x={0} y={250} width={300} height={50} fill="#8fd0ff" {...S} />
    <rect x={20} y={232} width={260} height={20} fill="#f4f1ea" {...S} />
    {[38, 262].map((x) => (
      <g key={x}>
        <rect x={x - 7} y={110} width={14} height={122} fill="#fbfaf6" {...S} strokeWidth={4} />
        <circle cx={x} cy={104} r={10} fill="#fbfaf6" {...S} strokeWidth={4} />
      </g>
    ))}
    <rect x={70} y={150} width={160} height={82} fill="#fbfaf6" {...S} />
    <path d="M132 232 L132 186 Q150 160 168 186 L168 232 Z" fill="#cfd8e6" {...S} />
    <path d="M100 150 Q100 70 150 52 Q200 70 200 150 Z" fill="#fbfaf6" {...S} />
    <line x1={150} y1={52} x2={150} y2={30} stroke={INK} strokeWidth={4} />
    <circle cx={150} cy={28} r={4} fill="#ffc93c" />
    {[88, 212].map((x) => (
      <path key={x} d={`M${x - 16} 150 Q${x - 16} 118 ${x} 110 Q${x + 16} 118 ${x + 16} 150 Z`} fill="#fbfaf6" {...S} strokeWidth={4} />
    ))}
  </>
);

const GreatWall = () => {
  const wall = "M-10 250 Q40 200 80 215 T160 150 T230 170 T310 110";
  return (
    <>
      <Sky top="#a6dcff" bottom="#eef9ff" />
      <path d="M0 300 L0 190 Q60 150 120 180 Q180 110 240 140 Q280 120 300 130 L300 300 Z" fill="#6fb36b" {...S} />
      <path d="M0 300 L0 250 Q90 220 160 250 Q230 210 300 240 L300 300 Z" fill="#4f9a55" {...S} />
      <path d={wall} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" />
      <path d={wall} fill="none" stroke="#c9b79a" strokeWidth={18} strokeLinecap="round" />
      <path d={wall} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="6 8" transform="translate(0 -10)" />
      {[[80, 200], [160, 136], [262, 132]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 16} y={y - 14} width={32} height={30} fill="#d8c7a8" {...S} strokeWidth={4} />
          <rect x={x - 5} y={y} width={10} height={16} fill={INK} />
        </g>
      ))}
    </>
  );
};

const ART: Record<string, React.FC> = { chichen: ChichenItza, machu: MachuPicchu, christ: ChristRedeemer, colosseum: Colosseum, petra: Petra, taj: TajMahal, wall: GreatWall };

export const WonderArt: React.FC<{ id: string; size: number }> = ({ id, size }) => {
  const Art = ART[id];
  return (
    <svg width={size} height={size} viewBox="0 0 300 300" style={{ display: "block" }}>
      <clipPath id={`clip-${id}`}>
        <rect x={0} y={0} width={300} height={300} rx={28} />
      </clipPath>
      <g clipPath={`url(#clip-${id})`}>
        <Art />
      </g>
      <rect x={2.5} y={2.5} width={295} height={295} rx={28} fill="none" stroke={INK} strokeWidth={6} />
    </svg>
  );
};

const star = (cx: number, cy: number, r: number) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return pts.join(" ");
};

const V3: React.FC<{ a: string; b: string; c: string }> = ({ a, b, c }) => (
  <>
    <rect x={0} y={0} width={30} height={60} fill={a} />
    <rect x={30} y={0} width={30} height={60} fill={b} />
    <rect x={60} y={0} width={30} height={60} fill={c} />
  </>
);

const FLAGS: Record<string, React.FC> = {
  MEX: () => (
    <>
      <V3 a="#006847" b="#ffffff" c="#ce1126" />
      <circle cx={45} cy={30} r={7} fill="#8c5a2b" />
    </>
  ),
  PER: () => <V3 a="#d91023" b="#ffffff" c="#d91023" />,
  BRA: () => (
    <>
      <rect width={90} height={60} fill="#009c3b" />
      <polygon points="45,6 84,30 45,54 6,30" fill="#ffdf00" />
      <circle cx={45} cy={30} r={13} fill="#002776" />
    </>
  ),
  ITA: () => <V3 a="#009246" b="#ffffff" c="#ce2b37" />,
  JOR: () => (
    <>
      <rect width={90} height={20} fill="#000000" />
      <rect y={20} width={90} height={20} fill="#ffffff" />
      <rect y={40} width={90} height={20} fill="#007a3d" />
      <polygon points="0,0 42,30 0,60" fill="#ce1126" />
      <polygon points={star(14, 30, 5)} fill="#ffffff" />
    </>
  ),
  IND: () => (
    <>
      <rect width={90} height={20} fill="#ff9933" />
      <rect y={20} width={90} height={20} fill="#ffffff" />
      <rect y={40} width={90} height={20} fill="#138808" />
      <circle cx={45} cy={30} r={7} fill="none" stroke="#000080" strokeWidth={2} />
      <circle cx={45} cy={30} r={1.5} fill="#000080" />
    </>
  ),
  CHN: () => (
    <>
      <rect width={90} height={60} fill="#de2910" />
      <polygon points={star(16, 16, 9)} fill="#ffde00" />
      {[[30, 6], [36, 12], [36, 21], [30, 27]].map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 3)} fill="#ffde00" />
      ))}
    </>
  ),
};

export const Flag: React.FC<{ iso: string; width: number }> = ({ iso, width }) => {
  const F = FLAGS[iso];
  return (
    <svg width={width} height={(width * 2) / 3} viewBox="0 0 90 60" style={{ display: "block" }}>
      <F />
      <rect x={1.5} y={1.5} width={87} height={57} fill="none" stroke={INK} strokeWidth={3} rx={4} />
    </svg>
  );
};
