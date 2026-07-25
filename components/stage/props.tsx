"use client";

// Prop library — each prop draws inside a ~200x200 local box anchored at its
// base center (x=100, y=200). Deterministic ambient motion from `frame`.
// Organized in domain packs so most papers find their world here.

export type PropType =
  // general / nature
  | "tree" | "mountain" | "globe" | "rocket" | "dino" | "cloud_rain"
  // history
  | "building" | "dome" | "arch" | "scroll" | "crown" | "pillar"
  // science / biology
  | "flask" | "book" | "cell" | "dna" | "microscope" | "heart" | "virus"
  // tech
  | "laptop" | "robot" | "gear" | "lightbulb" | "phone" | "server"
  // economics
  | "coin" | "chart_board" | "factory" | "signpost";

export function Prop({ type, frame }: { type: PropType; frame: number }) {
  const sway = Math.sin(frame / 33) * 2.2;
  const pulse = 1 + Math.sin(frame / 16) * 0.04;

  switch (type) {
    // ── GENERAL / NATURE ─────────────────────────────────────────────────────
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
    case "mountain":
      return (
        <g>
          <path d="M 10 200 L 100 30 L 190 200 Z" fill="#4a5578" />
          <path d="M 100 30 L 128 82 L 112 76 L 100 92 L 88 74 L 74 84 Z" fill="#eef2ff" />
          <path d="M 60 200 L 130 96 L 190 200 Z" fill="#3a4363" opacity={0.85} />
        </g>
      );
    case "globe":
      return (
        <g transform={`translate(100 130)`}>
          <circle r={70} fill="#2a6fb0" />
          <path d="M -40 -40 Q 0 -60 35 -30 Q 10 -18 -12 -28 Q -30 -20 -40 -40 Z" fill="#3fae6a" />
          <path d="M -20 15 Q 15 0 45 25 Q 30 50 -5 42 Q -25 32 -20 15 Z" fill="#3fae6a" />
          {/* rotating meridians */}
          <ellipse rx={70} ry={70} fill="none" stroke="#ffffff22" strokeWidth={3} />
          <ellipse rx={Math.abs(Math.sin(frame / 40)) * 60 + 6} ry={70} fill="none" stroke="#ffffff33" strokeWidth={2.5} />
          <rect x={-8} y={68} width={16} height={64} fill="#8899aa" rx={6} />
        </g>
      );
    case "rocket": {
      const shake = Math.sin(frame / 3) * 1.4;
      const flame = 22 + Math.sin(frame / 4) * 9;
      return (
        <g transform={`translate(${shake} 0)`}>
          <path d="M 100 20 C 130 55 132 110 124 150 L 76 150 C 68 110 70 55 100 20 Z" fill="#e8edf5" />
          <circle cx={100} cy={80} r={16} fill="#38bdf8" stroke="#25455e" strokeWidth={4} />
          <path d="M 76 150 L 52 186 L 76 176 Z" fill="#ff6b6b" />
          <path d="M 124 150 L 148 186 L 124 176 Z" fill="#ff6b6b" />
          <path d={`M 88 152 Q 100 ${152 + flame * 2} 112 152 Z`} fill="#ffb703" />
          <path d={`M 93 152 Q 100 ${152 + flame} 107 152 Z`} fill="#ff5714" />
        </g>
      );
    }
    case "dino": {
      const neck = Math.sin(frame / 40) * 4;
      const tail = Math.sin(frame / 34) * 5;
      return (
        <g fill="#5aa564">
          {/* tail */}
          <path transform={`rotate(${tail} 60 168)`} d="M 60 160 Q 6 150 2 122 Q 26 146 64 152 Z" />
          {/* body */}
          <ellipse cx={104} cy={168} rx={52} ry={32} />
          {/* legs */}
          <rect x={70} y={182} width={16} height={20} rx={7} />
          <rect x={122} y={182} width={16} height={20} rx={7} />
          {/* neck + head, gently swaying */}
          <g transform={`rotate(${neck} 140 150)`}>
            <path d="M 132 156 Q 148 90 166 62 L 184 70 Q 166 100 156 160 Z" />
            <ellipse cx={176} cy={62} rx={20} ry={13} />
            <circle cx={182} cy={58} r={2.6} fill="#1a1a2e" />
          </g>
        </g>
      );
    }
    case "cloud_rain": {
      return (
        <g>
          <g fill="#8fa3c4">
            <ellipse cx={100} cy={70} rx={56} ry={26} />
            <ellipse cx={142} cy={80} rx={40} ry={20} />
            <ellipse cx={60} cy={82} rx={36} ry={18} />
          </g>
          {[0, 1, 2, 3].map(i => {
            const y = 100 + ((frame * 2.4 + i * 28) % 90);
            return <rect key={i} x={62 + i * 26} y={y} width={4} height={14} rx={2}
              fill="#7fb4e8" opacity={1 - (y - 100) / 90} />;
          })}
        </g>
      );
    }

    // ── HISTORY ──────────────────────────────────────────────────────────────
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
    case "dome":
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
    case "arch":
      return (
        <g>
          <rect x={30} y={60} width={140} height={140} fill="#c94f3d" />
          <path d="M 55 200 L 55 130 Q 100 84 145 130 L 145 200 Z" fill="#7a2e22" />
          <rect x={30} y={44} width={140} height={20} rx={6} fill="#e8d5b5" />
          {[0, 1, 2, 3, 4].map(i => (
            <circle key={i} cx={44 + i * 28} cy={54} r={5} fill="#c94f3d" />
          ))}
          <g transform={`rotate(${Math.sin(frame / 12) * 8} 100 18)`}>
            <rect x={98} y={8} width={4} height={38} fill="#8a6d3b" />
            <path d="M 102 10 L 132 18 L 102 26 Z" fill="#3fae6a" />
          </g>
        </g>
      );
    case "scroll":
      return (
        <g>
          <rect x={40} y={70} width={120} height={110} rx={6} fill="#f5ead3"
            transform={`rotate(${sway * 0.4} 100 125)`} />
          {[0, 1, 2, 3].map(i => (
            <rect key={i} x={56} y={92 + i * 22} width={i === 3 ? 54 : 88} height={5} rx={2.5}
              fill="#b3a17e" transform={`rotate(${sway * 0.4} 100 125)`} />
          ))}
          <rect x={30} y={56} width={140} height={18} rx={9} fill="#8a6d3b" />
          <rect x={30} y={176} width={140} height={18} rx={9} fill="#8a6d3b" />
        </g>
      );
    case "crown": {
      const spark = (Math.sin(frame / 9) + 1) / 2;
      return (
        <g>
          <path d="M 45 190 L 40 120 L 72 152 L 100 104 L 128 152 L 160 120 L 155 190 Z" fill="#ffd166" />
          <rect x={42} y={182} width={116} height={18} rx={8} fill="#e0a800" />
          <circle cx={70} cy={188} r={7} fill="#ff6b6b" />
          <circle cx={100} cy={188} r={7} fill="#2ec4b6" />
          <circle cx={130} cy={188} r={7} fill="#a78bfa" />
          <g opacity={spark}>
            <path d="M 100 84 L 104 94 L 114 96 L 104 100 L 100 110 L 96 100 L 86 96 L 96 94 Z" fill="#fff" />
          </g>
        </g>
      );
    }
    case "pillar":
      return (
        <g>
          <rect x={70} y={30} width={60} height={16} rx={4} fill="#e8e2d0" />
          <rect x={78} y={46} width={44} height={134} fill="#d8d0b8" />
          {[0, 1, 2].map(i => (
            <rect key={i} x={82 + i * 14} y={50} width={6} height={126} fill="#c4bA9e" />
          ))}
          <rect x={66} y={180} width={68} height={20} rx={4} fill="#e8e2d0" />
        </g>
      );

    // ── SCIENCE / BIOLOGY ────────────────────────────────────────────────────
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
    case "cell": {
      const wob = Math.sin(frame / 19) * 5;
      return (
        <g transform="translate(100 130)">
          <ellipse rx={72 + wob} ry={62 - wob * 0.6} fill="#8fd6a8" opacity={0.85} />
          <ellipse rx={60 + wob * 0.7} ry={50 - wob * 0.5} fill="#b7e8c8" />
          <circle cx={-8} cy={-4} r={22} fill="#4a8a5f" />
          <circle cx={-14} cy={-10} r={6} fill="#356847" />
          <circle cx={30} cy={18} r={8} fill="#69b585" />
          <circle cx={-38} cy={22} r={6} fill="#69b585" />
          <circle cx={22} cy={-28} r={5} fill="#69b585" />
        </g>
      );
    }
    case "dna":
      return (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const y = 30 + i * 20;
            const x = Math.sin(frame / 45 + i * 0.75) * 34;
            return (
              <g key={i}>
                <circle cx={100 + x} cy={y} r={8} fill="#38bdf8" />
                <circle cx={100 - x} cy={y} r={8} fill="#a78bfa" />
                <rect x={Math.min(100 + x, 100 - x)} y={y - 2.2}
                  width={Math.abs(2 * x)} height={4.4} fill="#ffffff44" rx={2.2} />
              </g>
            );
          })}
        </g>
      );
    case "microscope": {
      const beam = (Math.sin(frame / 22) + 1) / 2;
      return (
        <g>
          <rect x={50} y={186} width={100} height={14} rx={7} fill="#3a3260" />
          <rect x={88} y={130} width={16} height={60} rx={6} fill="#556" transform="rotate(18 100 160)" />
          <rect x={104} y={54} width={22} height={70} rx={9} fill="#8899aa" transform="rotate(18 115 90)" />
          <circle cx={140} cy={52} r={12} fill="#556" />
          <rect x={64} y={166} width={60} height={8} rx={4} fill="#8899aa" />
          <path d="M 108 118 L 84 168 L 116 168 Z" fill="#9ff0e8" opacity={0.25 + beam * 0.4} />
        </g>
      );
    }
    case "heart": {
      const beat = 1 + (Math.sin(frame / 8) > 0.6 ? 0.1 : 0);
      return (
        <g transform={`translate(100 130) scale(${beat})`}>
          <path d="M 0 48 C -60 8 -44 -52 -4 -34 C 0 -32 0 -30 0 -30 C 0 -30 0 -32 4 -34 C 44 -52 60 8 0 48 Z"
            fill="#ff5a6e" />
          <path d="M -18 -22 Q -30 -12 -26 4" stroke="#ff9fb0" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      );
    }
    case "virus": {
      return (
        <g transform={`translate(100 130) rotate(${frame / 6}) scale(${pulse})`}>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <g key={i}>
                <rect x={Math.cos(a) * 52 - 3} y={Math.sin(a) * 52 - 12} width={6} height={24} rx={3}
                  fill="#c084fc" transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 52} ${Math.sin(a) * 52})`} />
                <circle cx={Math.cos(a) * 64} cy={Math.sin(a) * 64} r={7} fill="#a855f7" />
              </g>
            );
          })}
          <circle r={46} fill="#9333ea" />
          <circle cx={-12} cy={-8} r={9} fill="#c084fc" opacity={0.7} />
          <circle cx={16} cy={10} r={6} fill="#c084fc" opacity={0.7} />
        </g>
      );
    }

    // ── TECH ─────────────────────────────────────────────────────────────────
    case "laptop": {
      const glow = 0.75 + (Math.sin(frame / 14) + 1) * 0.12;
      return (
        <g>
          <rect x={44} y={70} width={112} height={78} rx={8} fill="#3a3260" />
          <rect x={52} y={78} width={96} height={62} rx={4} fill="#38bdf8" opacity={glow} />
          {[0, 1, 2].map(i => (
            <rect key={i} x={60} y={88 + i * 15} width={i === 2 ? 40 : 76} height={6} rx={3} fill="#0b1026" opacity={0.6} />
          ))}
          <path d="M 30 172 L 44 148 L 156 148 L 170 172 Z" fill="#556" />
          <rect x={30} y={170} width={140} height={8} rx={4} fill="#445" />
        </g>
      );
    }
    case "robot": {
      const blink = (frame % 90) < 6 ? 0.15 : 1;
      const antenna = 0.4 + (Math.sin(frame / 10) + 1) * 0.3;
      return (
        <g>
          <rect x={97} y={44} width={6} height={22} fill="#8899aa" />
          <circle cx={100} cy={40} r={8} fill="#ff6b6b" opacity={antenna} />
          <rect x={58} y={64} width={84} height={64} rx={14} fill="#c3cbd9" />
          <ellipse cx={82} cy={94} rx={9} ry={11 * blink} fill="#1a1a2e" />
          <ellipse cx={118} cy={94} rx={9} ry={11 * blink} fill="#1a1a2e" />
          <rect x={66} y={132} width={68} height={56} rx={12} fill="#a9b3c4" />
          <rect x={80} y={144} width={40} height={22} rx={5} fill="#38bdf8" opacity={0.85} />
          <rect x={46} y={138} width={16} height={40} rx={8} fill="#8899aa"
            transform={`rotate(${Math.sin(frame / 20) * 10} 54 140)`} />
          <rect x={138} y={138} width={16} height={40} rx={8} fill="#8899aa"
            transform={`rotate(${-Math.sin(frame / 20) * 10} 146 140)`} />
          <rect x={74} y={188} width={20} height={14} rx={6} fill="#8899aa" />
          <rect x={106} y={188} width={20} height={14} rx={6} fill="#8899aa" />
        </g>
      );
    }
    case "gear":
      return (
        <g transform={`translate(100 120) rotate(${frame * 0.8})`}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={-9} y={-72} width={18} height={26} rx={5} fill="#8899aa"
              transform={`rotate(${i * 45})`} />
          ))}
          <circle r={52} fill="#a9b3c4" />
          <circle r={20} fill="#3a3260" />
        </g>
      );
    case "lightbulb": {
      const on = (Math.sin(frame / 26) + 1) / 2 > 0.3;
      return (
        <g>
          {on && (
            <g stroke="#ffd166" strokeWidth={5} strokeLinecap="round" opacity={0.8}>
              {Array.from({ length: 6 }, (_, i) => {
                const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                return <line key={i} x1={100 + Math.cos(a) * 62} y1={96 + Math.sin(a) * 62}
                  x2={100 + Math.cos(a) * 80} y2={96 + Math.sin(a) * 80} />;
              })}
            </g>
          )}
          <circle cx={100} cy={96} r={44} fill={on ? "#ffe28a" : "#c3cbd9"} />
          <path d="M 88 132 Q 100 116 112 132" stroke={on ? "#e0a800" : "#8899aa"} strokeWidth={4} fill="none" />
          <rect x={86} y={140} width={28} height={22} rx={5} fill="#8899aa" />
          <rect x={90} y={162} width={20} height={10} rx={5} fill="#667" />
        </g>
      );
    }
    case "phone": {
      const ping = (frame % 100) < 22;
      return (
        <g>
          <rect x={68} y={40} width={64} height={128} rx={12} fill="#3a3260" />
          <rect x={74} y={52} width={52} height={100} rx={6} fill="#0b1026" />
          {ping && (
            <g>
              <rect x={78} y={58} width={44} height={20} rx={6} fill="#2ec4b6" />
              <circle cx={86} cy={68} r={4} fill="#fff" />
              <rect x={94} y={64} width={22} height={3.6} rx={1.8} fill="#ffffffcc" />
              <rect x={94} y={70} width={16} height={3.6} rx={1.8} fill="#ffffff88" />
            </g>
          )}
          <circle cx={100} cy={160} r={5} fill="#556" />
        </g>
      );
    }
    case "server":
      return (
        <g>
          {[0, 1, 2].map(row => (
            <g key={row}>
              <rect x={52} y={60 + row * 48} width={96} height={40} rx={7} fill="#3a3260" />
              {[0, 1, 2, 3].map(i => {
                const lit = (Math.sin(frame / 9 + row * 2 + i * 1.3) + 1) / 2 > 0.5;
                return <circle key={i} cx={68 + i * 14} cy={80 + row * 48} r={4}
                  fill={lit ? "#2ec4b6" : "#1c2144"} />;
              })}
              <rect x={126} y={72 + row * 48} width={14} height={16} rx={3} fill="#556" />
            </g>
          ))}
        </g>
      );

    // ── ECONOMICS ────────────────────────────────────────────────────────────
    case "coin": {
      const spin = Math.abs(Math.cos(frame / 24));
      return (
        <g transform={`translate(100 120)`}>
          <ellipse rx={56 * Math.max(spin, 0.12)} ry={56} fill="#ffd166" />
          <ellipse rx={44 * Math.max(spin, 0.1)} ry={44} fill="#e0a800" />
          {spin > 0.5 && (
            <text x={0} y={2} textAnchor="middle" dominantBaseline="middle"
              fontSize={44} fontWeight={900} fill="#8a6d3b"
              fontFamily="system-ui" transform={`scale(${spin} 1)`}>$</text>
          )}
        </g>
      );
    }
    case "chart_board": {
      const grow = (Math.sin(frame / 50) + 1) / 2;
      return (
        <g>
          <rect x={36} y={40} width={128} height={96} rx={8} fill="#f5f7fb" />
          <rect x={36} y={40} width={128} height={96} rx={8} fill="none" stroke="#8a6d3b" strokeWidth={5} />
          {[0, 1, 2].map(i => (
            <rect key={i} x={54 + i * 32} y={124 - (28 + i * 22) * (0.55 + grow * 0.45)}
              width={22} height={(28 + i * 22) * (0.55 + grow * 0.45)} rx={4}
              fill={i === 2 ? "#2ec4b6" : "#a9c4e8"} />
          ))}
          <path d="M 60 200 L 90 138 M 140 200 L 110 138" stroke="#8a6d3b" strokeWidth={7} strokeLinecap="round" />
        </g>
      );
    }
    case "factory": {
      return (
        <g>
          <rect x={36} y={110} width={128} height={90} fill="#556" />
          <path d="M 36 110 L 76 84 L 76 110 L 116 84 L 116 110 L 156 84 L 156 110 Z" fill="#445" />
          <rect x={52} y={54} width={20} height={60} fill="#667" />
          {[0, 1, 2].map(i => {
            const t = ((frame * 0.9 + i * 40) % 120);
            return <circle key={i} cx={62 + Math.sin(t / 16) * 6} cy={48 - t * 0.55} r={8 + t * 0.1}
              fill="#c3cbd9" opacity={Math.max(0, 0.55 - t / 200)} />;
          })}
          {[0, 1, 2].map(i => (
            <rect key={i} x={54 + i * 36} y={132} width={22} height={26} rx={4}
              fill={(Math.sin(frame / 30 + i * 2) + 1) / 2 > 0.4 ? "#ffd166" : "#334"} />
          ))}
        </g>
      );
    }
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
