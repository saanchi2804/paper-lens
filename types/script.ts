export type SceneType =
  | "intro"
  | "prerequisite"
  | "hook"
  | "example"
  | "concept"
  | "analogy"
  | "deep_dive"
  | "worked_example"
  | "finding"
  | "connection"
  | "implication"
  | "summary";

export type RenderVisualType = "diagram" | "chart" | "image";
export type ChartType = "layers" | "bar" | "comparison" | "stat" | "timeline";

export interface ChartLayer {
  label: string;
  sublabel?: string;
}

export interface ChartBar {
  label: string;
  value: number;
  highlight?: boolean;
  unit?: string;
}

export interface ChartColumn {
  heading: string;
  items: string[];
}

export interface Scene {
  id: number;
  type: SceneType;
  narration: string;
  headline: string;
  key_terms?: string[];
  emoji: string;
  duration_seconds: number;

  // Visual spec — LLM picks the right type per scene
  visual_type?: RenderVisualType;

  // diagram: boxes and arrows
  visual_notes?: string[];

  // chart: structured data visual
  chart_type?: ChartType;
  chart_title?: string;
  layers?: ChartLayer[];            // for "layers"
  bars?: ChartBar[];                // for "bar"
  columns?: ChartColumn[];          // for "comparison"
  stat?: string;                    // for "stat"
  stat_context?: string;            // for "stat"
  timeline_events?: string[];       // for "timeline"

  // image: AI-generated illustration
  image_prompt?: string;
  image_labels?: string[];

  // TED-Ed style shot sequence: full-screen illustrations that crossfade as
  // the narration progresses. Each shot's `start` is a fraction (0–0.85) of
  // the scene at which it takes over.
  shots?: Shot[];

  // kinetic text: the scene's single most striking phrase, flashed big
  // mid-scene (e.g. "847% ROI", "8 reports max")
  punch_line?: string;
}

export interface Shot {
  // 15-25 word illustration prompt; includes the protagonist description
  // verbatim when the protagonist appears, for visual continuity
  image_prompt: string;
  // 0-6 word overlay caption, empty/omitted for pure visual moments
  caption?: string;
  // fraction of the scene (0–0.85) at which this shot takes over
  start: number;
}

export interface PaperScript {
  title: string;
  summary: string;
  // single emoji representing the story's protagonist/setting, shown as a
  // persistent badge for visual continuity across scenes
  motif_emoji?: string;
  // 15-25 word physical description of the recurring protagonist, repeated
  // verbatim inside shot prompts so the character looks the same everywhere
  protagonist_description?: string;
  scenes: Scene[];
}
