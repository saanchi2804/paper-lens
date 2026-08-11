import { StageSpec as StageSpecJSON } from "@/types/script";
import { StageSpec, StageActor, StagePropSpec } from "./StageScene";
import { PALETTES } from "./Character";
import type { Emotion, CharAction } from "./Character";
import type { EnvName } from "./Environment";
import type { PropType } from "./props";

const ENVS = new Set(["night", "day", "sunset", "jungle", "space", "interior"]);
const EMOTIONS = new Set(["neutral", "happy", "worried", "surprised"]);
const ACTIONS = new Set(["idle", "talk", "wave", "point", "walk", "jump"]);
const PROPS = new Set([
  "tree", "mountain", "globe", "rocket", "dino", "cloud_rain",
  "building", "dome", "arch", "scroll", "crown", "pillar",
  "flask", "book", "cell", "dna", "microscope", "heart", "virus",
  "laptop", "robot", "gear", "lightbulb", "phone", "server",
  "coin", "chart_board", "factory", "signpost",
]);

const clamp = (v: number, lo: number, hi: number) =>
  Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;

export interface ValidatedStage {
  spec: StageSpec;
  beats: { at: number; actor: number; action?: CharAction; emotion?: Emotion }[];
}

// Sanitize an LLM-emitted stage into renderer-safe input.
// Returns null when the stage is unusable (renderer then falls back to shots).
export function validateStage(raw: StageSpecJSON | undefined): ValidatedStage | null {
  if (!raw || typeof raw !== "object") return null;
  if (!Array.isArray(raw.actors) || raw.actors.length === 0) return null;
  // An unfamiliar env (e.g. "kitchen") shouldn't throw away a good stage —
  // fall back to a neutral one rather than dropping to a blank frame.
  const env: EnvName = (ENVS.has(raw.env) ? raw.env : "interior") as EnvName;

  const actors: StageActor[] = raw.actors.slice(0, 3).map((a, i) => ({
    x: clamp(Number(a?.x), 5, 95),
    palette: (a?.palette && a.palette in PALETTES ? a.palette : i === 0 ? "teal" : "coral") as StageActor["palette"],
    emotion: (EMOTIONS.has(a?.emotion ?? "") ? a!.emotion : "neutral") as Emotion,
    action: (ACTIONS.has(a?.action ?? "") ? a!.action : "idle") as CharAction,
    flip: !!a?.flip,
    scale: clamp(Number(a?.scale ?? 1), 0.5, 1.6),
  }));

  const props: StagePropSpec[] = (Array.isArray(raw.props) ? raw.props : [])
    .filter(p => p && PROPS.has(p.type))
    .slice(0, 5)
    .map(p => ({
      type: p.type as PropType,
      x: clamp(Number(p.x), 2, 98),
      scale: clamp(Number(p.scale ?? 1), 0.4, 2.2),
    }));

  const beats = (Array.isArray(raw.beats) ? raw.beats : [])
    .filter(b => b && Number.isFinite(Number(b.at)) && Number.isInteger(b.actor)
      && b.actor >= 0 && b.actor < actors.length)
    .slice(0, 6)
    .map(b => ({
      at: clamp(Number(b.at), 0, 1),
      actor: b.actor,
      action: ACTIONS.has(b.action ?? "") ? (b.action as CharAction) : undefined,
      emotion: EMOTIONS.has(b.emotion ?? "") ? (b.emotion as Emotion) : undefined,
    }))
    .sort((a, b) => a.at - b.at);

  return { spec: { env, actors, props }, beats };
}

// Apply the latest fired beat per actor for the current scene progress.
export function applyBeats(v: ValidatedStage, progress: number): StageSpec {
  if (v.beats.length === 0) return v.spec;
  const actors = v.spec.actors.map(a => ({ ...a }));
  for (const b of v.beats) {
    if (b.at <= progress) {
      if (b.action) actors[b.actor].action = b.action;
      if (b.emotion) actors[b.actor].emotion = b.emotion;
    }
  }
  return { ...v.spec, actors };
}
