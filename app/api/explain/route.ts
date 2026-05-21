import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Scene } from "@/types/script";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel hobby plan max

function wordsToSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(60, Math.round((words / 110) * 60));
}

export async function POST(request: NextRequest) {
  try {
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { text } = await request.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "No text provided." }, { status: 400 });
    }
    const pdfText = text
      .replace(/\0/g, "")
      .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 10000);

    const prompt = `You are Saisha, a university professor creating an 8-minute instructional video explaining a research paper. Be clear, concrete, and engaging.

Return ONLY valid JSON, no markdown fences, no text outside the JSON.

SCENE SEQUENCE — exactly 8 scenes in this order:
intro, hook, prerequisite, example, concept, worked_example, finding, summary

RULES:
1. Open with a real-world puzzle or phenomenon — never "This paper..."
2. prerequisite: teach the background concept from scratch with a concrete mini-example
3. example: introduce ONE specific case/participant/condition from the paper — return to it in every later scene
4. concept: wrong assumption → why it fails → correct concept
5. worked_example: walk through the actual method step by step with real numbers
6. finding: cite exact statistics — never "performed better", say "scored 7.3 vs 5.8, p < .05"
7. End each scene with one sentence of anticipation

NARRATION: 70-90 words per scene. Natural, direct, short sentences.

━━━ VISUAL SPECIFICATION ━━━
For each scene choose the visual type that BEST ILLUSTRATES the concept. The visual must explain and illuminate — not echo the words. Ask: what would a professor draw on a whiteboard to make this click?

"visual_type": "diagram"
  Use for: relationships, mechanisms, cause-effect, concept maps
  "visual_notes": exactly 4 strings:
    "Write: [2-5 word label]" — short concept box label (e.g. "Working Memory", "Attention Head")
    "Arrow: from [X] to [Y]" — directed edge (X and Y must match Write: labels exactly)
    "Circle: [label]" — highlight the KEY concept (must match a Write: label)
    "Label: [3-8 word note]" — annotation (e.g. "increases by 26%", "p < .05")

"visual_type": "chart"
  Use for: layered structures, data comparisons, sequences, before/after
  "chart_type" must be one of:

  "layers" — tech stacks, neural net layers, hierarchical pipelines
    "chart_title": "short title"
    "layers": [{"label": "Top Layer", "sublabel": "optional detail"}, ...] top-to-bottom, 3-6 layers

  "bar" — comparing numeric values (use EXACT numbers from the paper)
    "bars": [{"label": "Condition A", "value": 72, "highlight": false, "unit": "%"}, ...] 2-5 bars

  "comparison" — before/after, with/without, A vs B
    "columns": [{"heading": "Without X", "items": ["bullet 1", "bullet 2", "bullet 3"]}, {"heading": "With X", "items": [...]}]

  "stat" — single striking finding that deserves to stand alone
    "stat": "73%"
    "stat_context": "improvement over the baseline model"

  "timeline" — steps in a process, sequence of events
    "timeline_events": ["Step 1: description", "Step 2: description", ...] 3-5 events

"visual_type": "image"
  Use for: real-world phenomena, physical structures, things that need illustration not diagrams
  "image_prompt": 15-25 words describing the concept as a clean illustration, NO TEXT in the image, technical diagram style
  "image_labels": ["Label 1", "Label 2", "Label 3"] up to 3 short labels to overlay

━━━ JSON STRUCTURE ━━━
{
  "title": "...",
  "summary": "...",
  "scenes": [
    {
      "id": 1,
      "type": "intro",
      "narration": "...",
      "headline": "...",
      "key_terms": ["term1", "term2"],
      "emoji": "👩‍🏫",
      "visual_type": "diagram",
      "visual_notes": ["Write: ...", "Write: ...", "Arrow: from ... to ...", "Circle: ..."]
    },
    {
      "id": 2,
      "type": "hook",
      "narration": "...",
      "headline": "...",
      "key_terms": ["..."],
      "emoji": "🎯",
      "visual_type": "chart",
      "chart_type": "layers",
      "chart_title": "...",
      "layers": [{"label": "...", "sublabel": "..."}, ...]
    }
  ]
}

Here is the research paper:

${pdfText}`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { maxOutputTokens: 6000 },
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let script;
    try {
      let cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      script = JSON.parse(cleaned);
    } catch {
      console.error("[explain] raw response:", raw.slice(0, 500));
      return Response.json({ error: `Failed to parse script. Raw: ${raw.slice(0, 300)}` }, { status: 500 });
    }

    script.scenes = script.scenes
      .filter((scene: Scene) => scene && typeof scene.narration === "string" && scene.narration.trim())
      .map((scene: Scene) => ({ ...scene, duration_seconds: wordsToSeconds(scene.narration) }));

    return Response.json(script);
  } catch (err) {
    console.error("[explain] Unhandled error:", err);
    return Response.json({ error: `Server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
