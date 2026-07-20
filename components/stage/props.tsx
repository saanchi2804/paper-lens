"use client";

// Prop library — each prop draws inside a ~200x200 local box anchored at its
// base center (x=100, y=200). Deterministic ambient motion from `frame`.

export type PropType = "tree" | "building" | "dome" | "flask" | "book" | "signpost";

export function Prop({ type, frame }: { type: PropType; frame: number }) {
  const sway = Math.sin(frame / 33) * 2.2;

  switch (type) {
    case "tree":
      return (
        <g>
          <rect x={92} y={130} width={16} height={70} rx={7} fill="#6b4a2b" />
          <g transform={`rotate(${sway} 100 130)`}>
            <circle cx={100} cy={92} r={52} fill="#2f9e57" />
            <circle cx={66} cy={116} r={34} fill="#278a4a" />
            <circle cx={134} cy={116} r={34} fill="#38b264" />
          </g>
        </g>
      );
    case "building":
      return (
        <g>
          <rect x={48} y={40} width={104} height={160} rx={8} fill="#3a3260" />
          {Array.from({ length: 9 }, (_, i) => {
            const lit = (Math.sin(frame / 40 + i * 1.7) + 1) / 2 > 0.35;
            return (
              <rect key={i} x={62 + (i % 3) * 28} y={56 + Math.floor(i / 3) * 42}
                width={18} height={26} rx={3}
                fill={lit ? "#ffd166" : "#241f3d"} />
            );
          })}
        </g>
      );
    case "dome": // Mughal-style dome building — for the history papers
      return (
        <g>
          <rect x={40} y={120} width={120} height={80} rx={6} fill="#e8d5b5" />
          <path d="M 100 18 C 146 40 152 86 148 122 L 52 122 C 48 86 54 40 100 18 Z" fill="#f5ead3" />
          <rect x={97} y={0} width={6} height={22} rx={3} fill="#d4af37" />
          <path d="M 88 200 L 88 152 Q 100 138 112 152 L 112 200 Z" fill="#5b4a35" />
          <rect x={26} y={60} width={10} height={140} rx={5} fill="#e8d5b5" />
          <rect x={164} y={60} width={10} height={140} rx={5} fill="#e8d5b5" />
          <circle cx={31} cy={56} r={9} fill="#f5ead3" />
          <circle cx={169} cy={56} r={9} fill="#f5ead3" />
        </g>
      );
    case "flask": {
      const bubbleY = 160 - ((frame * 0.7) % 46);
      return (
        <g>
          <path d="M 88 60 L 88 110 L 58 176 Q 52 200 76 200 L 124 200 Q 148 200 142 176 L 112 110 L 112 60 Z"
            fill="#bfe6ff" opacity={0.9} />
          <path d="M 70 150 L 130 150 L 142 176 Q 148 200 124 200 L 76 200 Q 52 200 58 176 Z" fill="#2ec4b6" />
          <circle cx={100} cy={bubbleY > 120 ? bubbleY + 30 : 200} r={5} fill="#9ff0e8" opacity={0.8} />
          <rect x={82} y={48} width={36} height={12} rx={6} fill="#8899aa" />
        </g>
      );
    }
    case "book":
      return (
        <g>
          <path d="M 30 90 Q 100 68 170 90 L 170 176 Q 100 154 30 176 Z" fill="#f5ead3" />
          <path d="M 100 76 L 100 162" stroke="#c9b896" strokeWidth={4} />
          {[0, 1, 2].map(i => (
            <path key={i} d={`M 44 ${104 + i * 18} Q 72 ${96 + i * 18} 92 ${106 + i * 18}`}
              stroke="#b3a17e" strokeWidth={3} fill="none" />
          ))}
          <path d="M 30 90 L 30 176 Q 100 154 170 176 L 170 90" stroke="#8a6d3b" strokeWidth={6} fill="none" />
        </g>
      );
    case "signpost":
      return (
        <g>
          <rect x={94} y={70} width={12} height={130} rx={6} fill="#6b4a2b" />
          <g transform={`rotate(${sway * 0.6} 100 90)`}>
            <path d="M 40 66 L 150 66 L 172 88 L 150 110 L 40 110 Z" fill="#ffb703" />
          </g>
        </g>
      );
  }
}
