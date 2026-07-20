"use client";

// Rigged Kurzgesagt-style "blob" character. All motion is a pure function of
// `frame`, so it renders identically in the live player and any export.
// Coordinate space: the character is drawn in a 200x260 local box with feet
// at y=260; StageScene positions/scales it.

export type Emotion = "neutral" | "happy" | "worried" | "surprised";
export type CharAction = "idle" | "talk" | "wave" | "point" | "walk" | "jump";

export interface CharacterProps {
  frame: number;
  palette?: keyof typeof PALETTES;
  emotion?: Emotion;
  action?: CharAction;
  flip?: boolean;      // face left instead of right
  seed?: number;       // de-syncs blink/bob between actors
}

export const PALETTES = {
  teal:   { body: "#2ec4b6", belly: "#9ff0e8", limb: "#1b9c90", cheek: "#ff9f9f" },
  coral:  { body: "#ff6b6b", belly: "#ffd3d3", limb: "#d94f4f", cheek: "#ffb3b3" },
  gold:   { body: "#ffb703", belly: "#ffe8b0", limb: "#d99a02", cheek: "#ff9f9f" },
  violet: { body: "#a78bfa", belly: "#ddd2ff", limb: "#8465e0", cheek: "#ffb3d9" },
} as const;

export default function Character({
  frame, palette = "teal", emotion = "neutral", action = "idle",
  flip = false, seed = 0,
}: CharacterProps) {
  const c = PALETTES[palette];
  const t = frame + seed * 29;

  // ── Idle life: breathing bob + blink ───────────────────────────────────────
  const bob = Math.sin(t / 21) * 4;
  const breathe = 1 + Math.sin(t / 21) * 0.012;
  // Blink: ~every 3.5s, eyes closed for 4 frames
  const blinkPhase = (t + seed * 47) % 105;
  const blink = blinkPhase < 4 ? 0.1 : 1;

  // ── Action-driven limbs ────────────────────────────────────────────────────
  // Arm angles in degrees; 0 = hanging down at the side
  let frontArm = 8 + Math.sin(t / 25) * 4;   // subtle idle sway
  let backArm  = -8 - Math.sin(t / 25) * 4;
  let hopY = 0;
  let legSwing = 0;

  if (action === "wave") {
    frontArm = -130 + Math.sin(t / 6) * 18;  // raised, oscillating
  } else if (action === "point") {
    frontArm = -75 + Math.sin(t / 30) * 3;   // held out, near-steady
  } else if (action === "walk") {
    legSwing = Math.sin(t / 9) * 16;
    frontArm = 20 + Math.sin(t / 9) * 22;
    backArm  = -20 - Math.sin(t / 9) * 22;
    hopY = Math.abs(Math.sin(t / 9)) * -4;
  } else if (action === "jump") {
    const cycle = (t % 70) / 70;
    hopY = cycle < 0.35 ? -Math.sin((cycle / 0.35) * Math.PI) * 34 : 0;
    frontArm = cycle < 0.35 ? -100 : frontArm;
    backArm  = cycle < 0.35 ?  100 : backArm;
  }

  // Talk: gentle beak/mouth open-close
  const talkOpen = action === "talk" ? (Math.sin(t / 7) + 1) * 2.6 : 0;

  // ── Emotion: brows + mouth ────────────────────────────────────────────────
  // brow: [dx1,dy1,dx2,dy2] relative to eye centers; mouth path varies
  const browTilt = emotion === "worried" ? 6 : emotion === "surprised" ? -5 : 0;
  const browRaise = emotion === "surprised" ? -7 : 0;
  const mouth =
    emotion === "happy"     ? "M 86 118 Q 100 132 114 118"
    : emotion === "worried" ? "M 88 126 Q 100 116 112 126"
    : emotion === "surprised" ? "" // surprised uses an ellipse mouth
    : "M 90 122 Q 100 128 110 122";

  return (
    <g transform={`${flip ? "scale(-1,1) translate(-200,0)" : ""}`}>
      <g transform={`translate(0 ${bob + hopY})`}>
        {/* Back arm (behind body) */}
        <g transform={`rotate(${backArm} 62 150)`}>
          <rect x={50} y={140} width={24} height={74} rx={12} fill={c.limb} />
        </g>

        {/* Legs */}
        <g transform={`rotate(${legSwing} 82 232)`}>
          <rect x={72} y={216} width={20} height={44} rx={10} fill={c.limb} />
        </g>
        <g transform={`rotate(${-legSwing} 118 232)`}>
          <rect x={108} y={216} width={20} height={44} rx={10} fill={c.limb} />
        </g>

        {/* Body (breathing scale around its center) */}
        <g transform={`translate(100 160) scale(${breathe}) translate(-100 -160)`}>
          <ellipse cx={100} cy={150} rx={64} ry={86} fill={c.body} />
          <ellipse cx={100} cy={178} rx={42} ry={52} fill={c.belly} />

          {/* Eyes */}
          <g transform={`translate(0 ${browRaise * 0.4})`}>
            <ellipse cx={80} cy={96} rx={13} ry={16 * blink} fill="#ffffff" />
            <ellipse cx={120} cy={96} rx={13} ry={16 * blink} fill="#ffffff" />
            {blink > 0.5 && (
              <>
                <circle cx={83} cy={98} r={5.5} fill="#1a1a2e" />
                <circle cx={123} cy={98} r={5.5} fill="#1a1a2e" />
                <circle cx={85} cy={96} r={1.8} fill="#ffffff" />
                <circle cx={125} cy={96} r={1.8} fill="#ffffff" />
              </>
            )}
          </g>

          {/* Brows */}
          <g stroke="#1a1a2e" strokeWidth={4} strokeLinecap="round" fill="none">
            <path d={`M 68 ${76 + browRaise} L 92 ${76 + browRaise - browTilt}`} />
            <path d={`M 108 ${76 + browRaise - browTilt} L 132 ${76 + browRaise}`} />
          </g>

          {/* Cheeks */}
          <ellipse cx={68} cy={116} rx={8} ry={5} fill={c.cheek} opacity={0.55} />
          <ellipse cx={132} cy={116} rx={8} ry={5} fill={c.cheek} opacity={0.55} />

          {/* Mouth */}
          {emotion === "surprised" || talkOpen > 0.5 ? (
            <ellipse cx={100} cy={124} rx={7} ry={5 + talkOpen} fill="#1a1a2e" />
          ) : (
            mouth && <path d={mouth} stroke="#1a1a2e" strokeWidth={4} fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* Front arm (over body) */}
        <g transform={`rotate(${frontArm} 138 150)`}>
          <rect x={126} y={140} width={24} height={78} rx={12} fill={c.limb} />
          {/* pointing hand */}
          {action === "point" && <circle cx={138} cy={222} r={13} fill={c.limb} />}
        </g>
      </g>
    </g>
  );
}
