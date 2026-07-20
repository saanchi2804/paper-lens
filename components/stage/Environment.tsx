"use client";

// Full-frame environment presets (1280x720 space) with built-in ambient
// motion. Deterministic pseudo-random layouts keyed by index so every render
// is identical.

export type EnvName = "night" | "day" | "sunset" | "jungle" | "space" | "interior";

const SKY: Record<EnvName, [string, string]> = {
  night:    ["#0b1026", "#1b2350"],
  day:      ["#3a7bd5", "#8fc9f0"],
  sunset:   ["#2d1b4e", "#c4574f"],
  jungle:   ["#0e2a1c", "#1e5a38"],
  space:    ["#05060f", "#171a3a"],
  interior: ["#241f3d", "#3a3260"],
};

const GROUND: Record<EnvName, string> = {
  night: "#141b3c", day: "#3f9c5f", sunset: "#1f1436",
  jungle: "#123822", space: "#20244d", interior: "#191533",
};

export default function Environment({ env, frame }: { env: EnvName; frame: number }) {
  const [top, bottom] = SKY[env];
  const stars = env === "night" || env === "space";
  const clouds = env === "day" || env === "sunset";

  return (
    <g>
      <defs>
        <linearGradient id={`sky-${env}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width={1280} height={720} fill={`url(#sky-${env})`} />

      {/* Twinkling stars */}
      {stars && Array.from({ length: 26 }, (_, i) => {
        const x = (i * 337) % 1280;
        const y = ((i * 191) % 430) + 20;
        const tw = 0.35 + (Math.sin(frame / 17 + i * 2.4) + 1) * 0.3;
        return <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 3 : 1.8} fill="#ffffff" opacity={tw} />;
      })}

      {/* Sun / moon / planet */}
      {env === "day"    && <circle cx={1080} cy={120} r={56} fill="#ffe28a" />}
      {env === "sunset" && <circle cx={1000} cy={330} r={80} fill="#ff9e5e" opacity={0.9} />}
      {env === "night"  && <circle cx={1060} cy={130} r={44} fill="#f4f1de" opacity={0.92} />}
      {env === "space"  && (
        <g transform="translate(1030 160)">
          <circle r={70} fill="#c4574f" />
          <ellipse rx={110} ry={22} fill="none" stroke="#ffd166" strokeWidth={7}
            transform="rotate(-18)" opacity={0.85} />
        </g>
      )}

      {/* Drifting clouds */}
      {clouds && [0, 1, 2].map(i => {
        const x = ((frame * (0.25 + i * 0.12) + i * 460) % 1500) - 220;
        const y = 90 + i * 78;
        return (
          <g key={i} transform={`translate(${x} ${y})`} fill="#ffffff" opacity={env === "sunset" ? 0.28 : 0.85}>
            <ellipse cx={0} cy={0} rx={62} ry={26} />
            <ellipse cx={44} cy={8} rx={46} ry={20} />
            <ellipse cx={-42} cy={10} rx={40} ry={18} />
          </g>
        );
      })}

      {/* Jungle canopy silhouettes */}
      {env === "jungle" && [0, 1, 2, 3, 4].map(i => (
        <ellipse key={i} cx={i * 320 - 40} cy={110 - (i % 2) * 50} rx={230} ry={130}
          fill="#0a2115" opacity={0.75} />
      ))}

      {/* Interior: window + shelf */}
      {env === "interior" && (
        <g>
          <rect x={880} y={90} width={240} height={300} rx={18} fill="#141031" />
          <rect x={892} y={102} width={216} height={276} rx={12} fill="#0b1026" />
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx={920 + (i * 73) % 180} cy={140 + (i * 47) % 200} r={1.6}
              fill="#fff" opacity={0.4 + (Math.sin(frame / 19 + i) + 1) * 0.2} />
          ))}
          <rect x={120} y={200} width={300} height={16} rx={8} fill="#191533" />
          <rect x={150} y={150} width={26} height={50} rx={4} fill="#ff6b6b" />
          <rect x={184} y={158} width={26} height={42} rx={4} fill="#ffb703" />
          <rect x={218} y={146} width={26} height={54} rx={4} fill="#2ec4b6" />
        </g>
      )}

      {/* Ground */}
      <ellipse cx={640} cy={790} rx={900} ry={160} fill={GROUND[env]} />
    </g>
  );
}
