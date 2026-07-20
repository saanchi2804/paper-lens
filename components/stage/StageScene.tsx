"use client";

// Composes one animated vector scene: environment → props → actors.
// Everything is a pure function of `frame` (Remotion-compatible).

import Character, { CharAction, Emotion, PALETTES } from "./Character";
import Environment, { EnvName } from "./Environment";
import { Prop, PropType } from "./props";

export interface StageActor {
  x: number;               // 0-100, % of stage width
  palette?: keyof typeof PALETTES;
  emotion?: Emotion;
  action?: CharAction;
  flip?: boolean;
  scale?: number;          // 1 = 260px tall
}

export interface StagePropSpec {
  type: PropType;
  x: number;               // 0-100
  scale?: number;
  y?: number;              // baseline offset from default ground line
}

export interface StageSpec {
  env: EnvName;
  actors: StageActor[];
  props?: StagePropSpec[];
}

const GROUND_Y = 620;  // where feet/prop bases sit

export default function StageScene({ stage, frame }: { stage: StageSpec; frame: number }) {
  return (
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{ display: "block" }}>
      <Environment env={stage.env} frame={frame} />

      {/* Props (behind actors) */}
      {(stage.props ?? []).map((p, i) => {
        const s = p.scale ?? 1;
        const px = (p.x / 100) * 1280;
        const py = GROUND_Y + (p.y ?? 0);
        return (
          <g key={`p${i}`} transform={`translate(${px - 100 * s} ${py - 200 * s}) scale(${s})`}>
            <Prop type={p.type} frame={frame + i * 13} />
          </g>
        );
      })}

      {/* Actors */}
      {stage.actors.map((a, i) => {
        const s = a.scale ?? 1;
        const ax = (a.x / 100) * 1280;
        return (
          <g key={`a${i}`} transform={`translate(${ax - 100 * s} ${GROUND_Y - 260 * s}) scale(${s})`}>
            <Character
              frame={frame}
              seed={i}
              palette={a.palette ?? (i === 0 ? "teal" : "coral")}
              emotion={a.emotion}
              action={a.action}
              flip={a.flip}
            />
          </g>
        );
      })}
    </svg>
  );
}
