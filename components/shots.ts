import { PaperScript } from "@/types/script";

// A shot with its image resolved to a concrete URL, ready for the renderer
export type ResolvedShot = { url: string; caption?: string; start: number };

// One locked style suffix for every illustration — the consistent art
// direction is what makes 40 generated images feel like one film.
const STYLE_SUFFIX =
  "flat vector illustration, TED-Ed educational animation style, bold simple shapes, " +
  "warm textured gradients, cinematic composition, muted background, no text, no letters, no words";

export function getPollinationsUrl(prompt: string, seed: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(`${prompt}, ${STYLE_SUFFIX}`)}?width=1280&height=720&nologo=true&seed=${seed}`;
}

// Resolve every scene's storyboard into concrete image URLs. Scenes from
// older scripts (no "shots" array) fall back to a single full-scene shot
// built from image_prompt, so legacy scripts still render full-bleed art.
export function buildSceneShots(script: PaperScript): Record<number, ResolvedShot[]> {
  const out: Record<number, ResolvedShot[]> = {};
  for (const s of script.scenes) {
    const raw = s.shots?.length
      ? s.shots
      : [{ image_prompt: s.image_prompt?.trim() || `${s.headline}, illustrated story scene`, start: 0 }];
    const resolved = raw
      .filter(sh => sh.image_prompt && sh.image_prompt.trim())
      .map((sh, i) => ({
        url: getPollinationsUrl(sh.image_prompt, 1000 + s.id * 17 + i * 3),
        caption: sh.caption,
        start: Math.max(0, Math.min(0.85, sh.start ?? 0)),
      }))
      .sort((a, b) => a.start - b.start);
    if (resolved.length > 0) resolved[0].start = 0;
    out[s.id] = resolved;
  }
  return out;
}

// Warm the browser cache so images are ready when their scene starts
export function preloadShots(shots: Record<number, ResolvedShot[]>) {
  Object.values(shots).flat().forEach(sh => { const img = new Image(); img.src = sh.url; });
}
