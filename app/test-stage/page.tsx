"use client";

// Dev harness for the SVG rig engine. ?f=N freezes at a frame (screenshots);
// without it, the stage plays live at 30fps. ?demo=1|2|3 picks a scene.

import { useEffect, useState } from "react";
import StageScene, { StageSpec } from "@/components/stage/StageScene";

const DEMOS: Record<string, StageSpec> = {
  // Dhannya at the Red Fort — the Mughal paper's opening beat
  "1": {
    env: "sunset",
    actors: [
      { x: 26, palette: "teal", emotion: "surprised", action: "point", flip: false },
    ],
    props: [
      { type: "dome", x: 72, scale: 1.9 },
      { type: "dome", x: 92, scale: 1.1 },
      { type: "tree", x: 52, scale: 0.8 },
    ],
  },
  // Two characters talking in a jungle — "dinosaur paper" placeholder world
  "2": {
    env: "jungle",
    actors: [
      { x: 30, palette: "gold", emotion: "happy", action: "talk" },
      { x: 62, palette: "violet", emotion: "worried", action: "idle", flip: true },
    ],
    props: [{ type: "tree", x: 84, scale: 1.6 }, { type: "tree", x: 10, scale: 1.2 }],
  },
  // Night lab scene
  "3": {
    env: "interior",
    actors: [{ x: 62, palette: "coral", emotion: "happy", action: "wave", flip: true }],
    props: [{ type: "flask", x: 26, scale: 1.1 }, { type: "book", x: 42, scale: 0.9 }],
  },
};

export default function TestStage() {
  const [frame, setFrame] = useState(0);
  const [spec, setSpec] = useState<StageSpec | null>(null);
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSpec(DEMOS[params.get("demo") ?? "1"] ?? DEMOS["1"]);
    const f = params.get("f");
    if (f !== null) { setFrame(parseInt(f, 10)); setFrozen(true); }
  }, []);

  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => setFrame(f => f + 1), 1000 / 30);
    return () => clearInterval(id);
  }, [frozen]);

  if (!spec) return <div>loading…</div>;
  return (
    <div style={{ width: 1280, height: 720 }}>
      <StageScene stage={spec} frame={frame} />
    </div>
  );
}
