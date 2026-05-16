import { NextRequest } from "next/server";

const FLUX_URL = "https://fal.run/fal-ai/flux/schnell";

export async function POST(request: NextRequest) {
  const key = process.env.FAL_KEY;
  if (!key) return Response.json({ url: null });

  const { narration, headline, type } = await request.json();

  // Ask for abstract diagram shapes only — we overlay real text labels ourselves
  const diagramStyles: Record<string, string> = {
    intro:          "concentric glowing circles radiating outward, soft light, abstract",
    prerequisite:   "layered building blocks stacked upward, glowing edges, abstract 3D",
    hook:           "single bright spotlight on a dark stage, dramatic, abstract",
    example:        "flowing path with distinct nodes connected by lines, glowing, abstract",
    concept:        "interlocking geometric shapes forming a structure, glowing, abstract",
    analogy:        "two mirrored forms side by side, soft glow, symmetric abstract",
    worked_example: "sequential steps along a path, numbered glowing markers, abstract",
    finding:        "abstract bar shapes of different heights glowing in dark space",
    connection:     "web of interconnected glowing nodes, network structure, abstract",
    summary:        "convergent lines meeting at a central bright point, abstract",
  };
  const diagramStyle = diagramStyles[type as string] ?? "abstract flowing geometric diagram, glowing, dark background";
  const prompt = `${diagramStyle}, no text, no letters, no words, cinematic lighting, ultra high quality`;

  try {
    const res = await fetch(FLUX_URL, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!res.ok) return Response.json({ url: null });
    const data = await res.json();
    return Response.json({ url: data.images?.[0]?.url ?? null });
  } catch {
    return Response.json({ url: null });
  }
}
