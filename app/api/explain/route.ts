import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Scene } from "@/types/script";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel hobby limit with Fluid Compute; glm-4.6 needs ~2-3 min

function wordsToSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  // TTS voices typically speak at ~140-160 wpm; use 140 so Remotion slides
  // stay visible long enough even if TTS is faster than average.
  return Math.max(90, Math.round((words / 140) * 60));
}

export async function POST(request: NextRequest) {
  try {
    const client = new Anthropic({
      apiKey: process.env.YALE_API_KEY,
      baseURL: "https://llm.kyle.pub/s/zai-coding",
    });

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

    const prompt = `You are Saisha, a beloved university professor known for making even the hardest research papers click for students. You are recording a 12-15 minute lecture video. Your teaching style:

- You THINK OUT LOUD. You say things like "Now, here's the tricky part..." or "You might be wondering..." or "Let me slow down here because this is where most people get lost."
- You use EVERYDAY ANALOGIES before technical language. Introduce the intuition first, jargon second.
- You ANTICIPATE confusion and address it head-on: "This seems obvious, but actually it's not, because..."
- You REPEAT key ideas in different words: once with an example, once with an analogy, once as a principle.
- You speak in SHORT, PUNCHY sentences. No walls of text. Mix rhythm.
- You are genuinely EXCITED about the research. Your enthusiasm is contagious.

━━━ STORYTELLING RULES (this is what separates a lecture students love from one they endure) ━━━
1. ONE CONTINUOUS STORY, not 10 separate summaries. Before writing, invent a PROTAGONIST — a named person facing the exact problem this paper solves (e.g. "Maya, a new store manager in Ohio"). Open scene 1 inside her life. Return to her in EVERY scene: her confusion becomes the hook, her situation becomes the worked example, her outcome becomes the finding.
2. OPEN LOOPS. Every scene except the last ends mid-tension: a question raised but not answered, a promise of a twist, a number teased but not yet explained. The viewer should feel unable to stop watching.
3. CALLBACKS. At least 3 scenes must explicitly reference an earlier moment: "Remember that number from the beginning? Here's where it comes from."
4. STAKES. Early on, make the cost of the unsolved problem VISCERAL — money lost, careers stalled, patients harmed. The research must feel like a rescue, not a paper.
5. THE TURN. Somewhere in the middle (concept or deep_dive), there must be a genuine "wait, WHAT?" moment — the counterintuitive insight of the paper, delivered like a plot twist, not a bullet point.
6. PAYOFF. The summary resolves the protagonist's story AND answers the opening question, so the lecture lands like the last page of a good novel.

Return ONLY valid JSON, no markdown fences, no text outside the JSON.

SCENE SEQUENCE — exactly 10 scenes in this order:
intro, hook, prerequisite, example, concept, deep_dive, worked_example, finding, implication, summary

SCENE INSTRUCTIONS:
1. intro — Open with a real-world puzzle or surprising phenomenon that this paper solves. Never start with "This paper...". Hook the viewer in the first sentence.
2. hook — Show why the problem is HARD. What have people tried before? Why did it fail? Make the viewer feel the pain of the unsolved problem.
3. prerequisite — Teach the ONE background concept a student needs from absolute scratch. Use a concrete everyday example first, then a second example from a different domain. Don't assume anything.
4. example — Introduce ONE specific case, participant, dataset, or experiment from the paper. Be concrete: names, numbers, conditions. Refer back to this exact example in every scene that follows.
5. concept — Walk through the core idea. Start with the WRONG assumption most people make → explain exactly why it breaks down → reveal the correct concept. Use an analogy the student has never forgotten.
6. deep_dive — Go beneath the surface of the method. Explain the mechanism step by step: what inputs go in, what computation happens, what comes out. Explain WHY the authors made this design choice and what the alternatives were.
7. worked_example — Using the specific example from scene 4, walk through the method with real numbers. Show intermediate calculations. Make it concrete enough that a student could reproduce it on paper.
8. finding — Report the key results with EXACT statistics from the paper (e.g. "84.3% vs 71.2%, p < .001"). Then explain what those numbers actually mean for a practitioner — not just that it's better, but why that margin matters.
9. implication — What changes in the real world because of this paper? Who should act differently — a clinician, an engineer, a policymaker? What open questions remain? What would the next experiment be?
10. summary — Crystallize exactly 3 things the student must walk away knowing. Connect each back to the opening puzzle from scene 1. Resolve the protagonist's story. End with why this matters beyond the paper — NEVER tease a "next lecture" or content that doesn't exist.

NARRATION LENGTH: 190-230 words per scene (~13-15 min total at speaking pace). Count your words. Each scene should feel like a complete chapter of the story, not a bullet point read aloud.

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
    },
    {
      "id": 6,
      "type": "deep_dive",
      "narration": "...",
      "headline": "...",
      "key_terms": ["..."],
      "emoji": "🔬",
      "visual_type": "diagram",
      "visual_notes": ["Write: ...", "Arrow: from ... to ...", "Circle: ...", "Label: ..."]
    },
    {
      "id": 9,
      "type": "implication",
      "narration": "...",
      "headline": "...",
      "key_terms": ["..."],
      "emoji": "🌍",
      "visual_type": "chart",
      "chart_type": "comparison",
      "columns": [{"heading": "Before this research", "items": ["..."]}, {"heading": "After this research", "items": ["..."]}]
    }
  ]
}

Here is the research paper:

${pdfText}`;

    // glm-4.6 (full model) follows length + storytelling instructions far
    // better than glm-4.5-air; the expansion passes below remain as a safety
    // net and only fire for scenes that still come back short.
    const response = await client.messages.create({
      model: "glm-4.6",
      max_tokens: 16000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";

    let script;
    try {
      let cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      // Repair invalid escape sequences LLMs emit (e.g. "\$1,200" — \$ is not
      // valid JSON). Drop the backslash before any non-escapable character.
      cleaned = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "");
      script = JSON.parse(cleaned);
    } catch {
      console.error("[explain] raw response:", raw.slice(0, 500));
      return Response.json({ error: `Failed to parse script. Raw: ${raw.slice(0, 300)}` }, { status: 500 });
    }

    script.scenes = script.scenes
      .filter((scene: Scene) => scene && typeof scene.narration === "string" && scene.narration.trim())
      // The LLM sometimes puts a chart_type ("layers", "timeline", …) directly
      // into visual_type — normalize so the renderer recognizes it.
      .map((scene: Scene) => {
        const vt = scene.visual_type as string | undefined;
        if (vt && ["layers", "bar", "comparison", "stat", "timeline"].includes(vt)) {
          return { ...scene, visual_type: "chart" as const, chart_type: (scene.chart_type ?? vt) as Scene["chart_type"] };
        }
        return scene;
      });

    // ── Passes 2 & 3: Expand short narrations ────────────────────────────────
    // GLM Air writes ~100 words regardless of instructions. We run two focused
    // expansion passes. Each pass appends concrete additions to scenes still
    // under the target length — rather than asking for a full rewrite, we
    // instruct the model to ADD specific content types so it can't shorten.
    async function expandNarrations(scenes: Scene[], minWords: number): Promise<void> {
      const short = scenes.filter(
        s => s.narration.trim().split(/\s+/).length < minWords
      );
      if (short.length === 0) return;

      const sceneList = short.map(s =>
        `ID ${s.id} [${s.type}]: ${s.narration}`
      ).join("\n\n---\n\n");

      const expandPrompt = `You are Saisha, an enthusiastic professor. For each lecture excerpt below, ADD the following content AFTER the existing text (do not shorten or rewrite what's already there). Write as flowing prose — NO bullet labels, NO "A)", NO "B)" in the output:

- An everyday analogy using a non-academic comparison the student has experienced personally (2-3 sentences).
- A "You might be wondering..." moment addressing the most likely student confusion (2-3 sentences).
- A concrete specific detail — a number, name, or result from the research (1-2 sentences).
- A one-sentence bridge to what comes next.

Return ONLY a JSON array, no markdown:
[{"id": 1, "narration": "original text seamlessly extended with your additions"}, ...]

Excerpts:

${sceneList}`;

      try {
        const res = await client.messages.create({
          model: "glm-4.6",
          max_tokens: 8000,
          messages: [{ role: "user", content: expandPrompt }],
        });
        const raw = res.content[0].type === "text" ? res.content[0].text : "";
        let cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        const m = cleaned.match(/\[[\s\S]*\]/);
        if (m) cleaned = m[0];
        const expanded: { id: number; narration: string }[] = JSON.parse(cleaned);
        expanded.forEach(e => {
          const scene = scenes.find(s => s.id === e.id);
          if (scene && typeof e.narration === "string") {
            const cleaned = e.narration
              .replace(/\b[A-D]\)\s*/g, "")   // strip any A) B) C) D) labels
              .replace(/\s+/g, " ").trim();
            const ew = cleaned.split(/\s+/).length;
            if (ew > scene.narration.trim().split(/\s+/).length) {
              scene.narration = cleaned;
            }
          }
        });
      } catch (err) {
        console.warn("[explain] expansion pass failed:", err);
      }
    }

    await expandNarrations(script.scenes, 180);  // pass 2: expand anything under 180
    await expandNarrations(script.scenes, 220);  // pass 3: expand anything still under 220

    // Compute durations after final narrations are set
    script.scenes = script.scenes.map((scene: Scene) => ({
      ...scene,
      duration_seconds: wordsToSeconds(scene.narration),
    }));

    return Response.json(script);
  } catch (err) {
    console.error("[explain] Unhandled error:", err);
    return Response.json({ error: `Server error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
