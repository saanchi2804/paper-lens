# SVG Rig Engine — Design Doc

## Goal
Replace AI-generated stills with **programmatically animated vector scenes** —
the actual Kurzgesagt architecture (their After Effects rigs, rebuilt as
React/SVG components driven by Remotion frames). Characters blink, gesture,
and walk; environments have living props; every frame is crisp vector in one
locked house style.

## Why rigs beat AI stills
- **Motion**: characters act while the narration talks — the single biggest
  "this is animation, not slides" signal.
- **Consistency**: the same component renders the same character every time;
  no style drift between generations, no melted faces.
- **Free & instant**: no image API, no rate limits, no load latency.
- **Directable**: the LLM writes *stage directions* ("Dhannya points at the
  dome, looks worried"), which map 1:1 to rig parameters.

## Architecture

```
script JSON                     components/stage/
  scenes[].stage ──────────►    StageScene.tsx      (composes one scene)
    { env, actors, props }        ├─ Environment.tsx (sky/ground presets + ambient props)
                                  ├─ Character.tsx   (rigged actor: poses, emotions, actions)
                                  └─ props/*.tsx     (tree, cloud, star, building, flask…)
```

- **Character.tsx** — one parameterized "blob" character (Kurzgesagt-style
  simplified figure). Rig parameters: `palette`, `x/y/scale/flip`,
  `emotion` (neutral | happy | worried | surprised), `action`
  (idle | talk | wave | point | walk | jump). All motion is a pure function
  of `frame` (blink cycles, bobbing, gesture arcs) so it renders identically
  in the player and in exports.
- **Environment.tsx** — full-frame backdrop presets (`night`, `day`,
  `sunset`, `jungle`, `space`, `interior`) with built-in ambient motion
  (twinkling stars, drifting clouds).
- **StageScene.tsx** — takes a scene's `stage` spec + `localFrame`, lays out
  environment → props → actors, applies entrance/exit choreography.

## LLM contract (Phase 2)
Scenes gain an optional `stage` field; when present it replaces AI shots:

```json
"stage": {
  "env": "sunset",
  "actors": [
    { "role": "protagonist", "x": 30, "action": "point", "emotion": "surprised", "flip": false },
    { "role": "extra", "palette": "coral", "x": 70, "action": "idle" }
  ],
  "props": [ { "type": "building", "x": 78, "scale": 1.4 } ],
  "beats": [ { "at": 0.4, "actor": 0, "action": "wave" } ]
}
```

`beats` retarget an actor's action at a narration fraction — gestures land
as the words are spoken (and sync exactly once ElevenLabs timestamps arrive).

## Phases
- **Phase 0 (this session)** — PoC: Character + 3 environments + 6 props +
  StageScene, verified via /test-stage screenshots. No pipeline changes.
- **Phase 1** — Asset breadth: 4 character palettes, 6 environments,
  ~20 props (incl. domain packs: history, biology, tech, economics).
- **Phase 2** — LLM stage directions in /api/explain; renderer prefers
  `stage` over `shots`, falls back to AI stills for scenes needing imagery
  the prop library can't express (hybrid mode).
- **Phase 3** — Beat choreography synced to narration; walk-on/walk-off
  transitions that carry a character between scenes.
- **Phase 4** — Sound design: music bed + whoosh/pop SFX on beats.

## Risks
- Prop library breadth is the long pole — a dinosaur paper needs a dinosaur.
  Mitigation: hybrid mode (rig scenes when assets exist, AI still otherwise),
  and grow the library by watching real papers fail.
- Art quality depends on hand-tuned SVG. Mitigation: lock one palette and
  shape language (rounded, geometric, 2-3 tones per object) — Kurzgesagt's
  simplicity is the point.
