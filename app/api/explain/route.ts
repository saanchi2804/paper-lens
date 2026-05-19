import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Scene } from "@/types/script";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel hobby plan max

function wordsToSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(60, Math.round((words / 110) * 60));
}

export async function POST(request: NextRequest) {
  try {
    const client = new Anthropic({
      apiKey: process.env.YALE_API_KEY,
      baseURL: "https://llm.kyle.pub/s/zai-coding",
    });

    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;
    if (!file) return Response.json({ error: "No PDF uploaded." }, { status: 400 });

    let pdfText: string;
    try {
      const { extractText } = await import("unpdf");
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { text } = await extractText(buffer, { mergePages: true });
      pdfText = text.slice(0, 10000);
    } catch (err) {
      console.error("[explain] PDF parse error:", err);
      return Response.json({ error: `Failed to read PDF: ${err instanceof Error ? err.message : String(err)}` }, { status: 422 });
    }

    const prompt = `You are Saisha, a passionate university professor creating a 15-minute instructional video. Your goal: a student who watches this will genuinely UNDERSTAND the concept — not just know what the paper found.

Return ONLY valid JSON, no markdown fences, no text outside the JSON.

SCENE SEQUENCE — exactly 13 scenes in this order:
intro, hook, prerequisite, prerequisite, example, concept, concept, analogy, worked_example, worked_example, finding, connection, summary

MANDATORY TEACHING RULES:
1. NEVER open with "This paper..." or "Researchers found..." — open with the real-world phenomenon or puzzle that makes the viewer lean forward.
2. prerequisite scenes: teach the background concept from scratch. Define it, give a concrete mini-example, explain why it matters.
3. In scene 5 (example), introduce ONE specific concrete case from the paper. Return to THIS SAME EXAMPLE in every scene that follows.
4. concept scenes: wrong assumption → why it fails → correct concept.
5. worked_example scenes: walk through the actual procedure step by step with real numbers from the paper.
6. finding scenes: cite exact statistics — means, percentages, p-values. NEVER say "performed better." Say "scored 7.3 versus 5.8, a 26% difference, p < .05."
7. Use rhetorical questions to pull students forward.
8. End each scene with one sentence of anticipation.

NARRATION: 130-160 words per scene. Speak like a professor at a whiteboard — natural, direct, short sentences.

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

    const response = await client.messages.create({
      model: "glm-4.5-air",
      max_tokens: 10000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    let script;
    try {
      let cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      script = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("[explain] raw response:", raw.slice(0, 1000));
      return Response.json({ error: `Failed to parse script from model. Raw: ${raw.slice(0, 300)}` }, { status: 500 });
    }

    script.scenes = script.scenes
      .filter((scene: Scene) => scene && typeof scene.narration === "string" && scene.narration.trim())
      .map((scene: Scene) => ({
        ...scene,
        duration_seconds: wordsToSeconds(scene.narration),
      }));

    return Response.json(script);
  } catch (err) {
    console.error("[explain] Unhandled error:", err);
    return Response.json({ error: `Server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
