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
}

export interface PaperScript {
  title: string;
  summary: string;
  scenes: Scene[];
}
