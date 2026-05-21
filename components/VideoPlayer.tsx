"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PaperScript, Scene, SceneType } from "@/types/script";
import PaperComposition from "./PaperComposition";

const FPS = 30;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getTotalFrames(script: PaperScript): number {
  return script.scenes.reduce((acc, s) => acc + Math.round(s.duration_seconds * FPS), 0);
}

function getSceneOffsets(script: PaperScript): number[] {
  const offsets: number[] = [];
  let off = 0;
  for (const s of script.scenes) {
    offsets.push(off);
    off += Math.round(s.duration_seconds * FPS);
  }
  return offsets;
}

function sceneAtFrame(frame: number, offsets: number[]): number {
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (frame >= offsets[i]) return i;
  }
  return 0;
}

function buildImagePrompt(scene: { type: string; narration: string; headline: string; image_prompt?: string }): string {
  if (scene.image_prompt) return scene.image_prompt;
  const firstSentence = scene.narration.split(/[.!?]/)[0].trim().slice(0, 120);
  const styleByType: Record<string, string> = {
    intro:          "teacher introducing a topic, welcoming slide with topic title and overview",
    prerequisite:   "prerequisite concepts diagram, labeled building blocks, foundational knowledge map",
    hook:           "surprising fact or question visualized, attention-grabbing diagram showing the problem",
    example:        "concrete example diagram with labeled steps, showing the specific example being explained",
    concept:        "concept explanation diagram with labeled components and connecting arrows, like a textbook figure",
    analogy:        "side-by-side analogy comparison, two labeled panels showing real-world parallel",
    worked_example: "step-by-step worked example, showing each calculation or logic step numbered and labeled",
    finding:        "results comparison chart with actual numbers, bar chart or table showing improvement",
    connection:     "concept map showing connections between ideas, labeled relationship diagram",
    summary:        "summary slide with key takeaways listed, what was learned overview",
  };
  const style = styleByType[scene.type] ?? "educational teaching diagram, labeled components";
  return `${scene.headline}: ${firstSentence}, ${style}`;
}

const SLIDE_ACCENT: Record<SceneType, string> = {
  intro:          "#a78bfa",
  prerequisite:   "#60a5fa",
  hook:           "#fb923c",
  example:        "#38bdf8",
  concept:        "#c084fc",
  analogy:        "#4ade80",
  worked_example: "#a3e635",
  finding:        "#34d399",
  connection:     "#fbbf24",
  summary:        "#e879f9",
};

const SLIDE_LABEL: Record<SceneType, string> = {
  intro: "INTRO", prerequisite: "FOUNDATIONS", hook: "HOOK",
  example: "EXAMPLE", concept: "CONCEPT", analogy: "ANALOGY",
  worked_example: "WORKED EXAMPLE", finding: "FINDING",
  connection: "CONNECTION", summary: "SUMMARY",
};

function parseNotes(notes: string[]) {
  const writes: string[] = [];
  const arrows: { from: string; to: string }[] = [];
  const circles: string[] = [];
  const labels: string[] = [];
  for (const note of notes) {
    const m = note.match(/^(Write|Circle|Arrow|Label):\s*/i);
    if (!m) { writes.push(note); continue; }     // treat bare text as Write
    const prefix = m[1].toLowerCase();
    const content = note.slice(m[0].length).trim();
    if (prefix === "write") writes.push(content);
    else if (prefix === "circle") circles.push(content);
    else if (prefix === "label") labels.push(content);
    else if (prefix === "arrow") {
      const am = content.match(/from\s+(.+?)\s+to\s+(.+)/i);
      if (am) arrows.push({ from: am[1].trim(), to: am[2].trim() });
      else arrows.push({ from: content, to: "…" });
    }
  }
  return { writes, arrows, circles, labels };
}

// ─── SVG DIAGRAM ────────────────────────────────────────────────────────────
// Auto-lays out Write: nodes + Arrow: edges into a left-to-right flow diagram.
// Circle: draws an annotation ring. Label: appears as a caption.

function ConceptDiagram({ writes, arrows, circles, labels, accent }: {
  writes: string[]; arrows: { from: string; to: string }[]; circles: string[];
  labels: string[]; accent: string;
}) {
  const W = 640, H = 240;

  // Build complete node set
  const nodeSet = new Set<string>();
  writes.forEach(w => nodeSet.add(w));
  arrows.forEach(a => { if (a.from) nodeSet.add(a.from); if (a.to) nodeSet.add(a.to); });
  const nodes = Array.from(nodeSet).slice(0, 7);
  if (nodes.length === 0) return null;

  const edges = arrows.filter(a => nodeSet.has(a.from) && nodeSet.has(a.to));
  const circleSet = new Set(circles.map(c => c.trim().toLowerCase()));

  // BFS layer assignment
  const incoming = new Map<string, number>(nodes.map(n => [n, 0]));
  edges.forEach(e => incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1));
  const sources = nodes.filter(n => (incoming.get(n) ?? 0) === 0);
  if (sources.length === 0) sources.push(nodes[0]);

  const layerMap = new Map<string, number>();
  sources.forEach(s => layerMap.set(s, 0));
  const q = [...sources]; let qi = 0;
  while (qi < q.length) {
    const cur = q[qi++];
    edges.filter(e => e.from === cur).forEach(e => {
      if (!layerMap.has(e.to)) { layerMap.set(e.to, (layerMap.get(cur) ?? 0) + 1); q.push(e.to); }
    });
  }
  nodes.forEach(n => { if (!layerMap.has(n)) layerMap.set(n, 0); });

  const maxL = Math.max(...Array.from(layerMap.values()), 0);
  const byLayer: string[][] = Array.from({ length: maxL + 1 }, () => []);
  nodes.forEach(n => byLayer[layerMap.get(n) ?? 0].push(n));

  // Node positions
  const PAD_X = 80, PAD_Y = 38;
  const pos = new Map<string, { x: number; y: number }>();
  byLayer.forEach((ln, li) => {
    const x = maxL === 0 ? W / 2 : PAD_X + (li / maxL) * (W - 2 * PAD_X);
    ln.forEach((n, ni) => {
      const spacing = Math.min(88, (H - 2 * PAD_Y) / Math.max(ln.length, 1));
      const y = H / 2 + (ni - (ln.length - 1) / 2) * spacing;
      pos.set(n, { x, y });
    });
  });

  const BH = 46;
  const bw = (label: string) => Math.min(165, Math.max(88, label.length * 9 + 26));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <marker id="dg-arrow" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={accent} opacity={0.85} />
        </marker>
        <filter id="node-shadow" x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={accent} floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Edges — cubic bezier for smooth curves */}
      {edges.map((e, i) => {
        const p1 = pos.get(e.from), p2 = pos.get(e.to);
        if (!p1 || !p2) return null;
        const sameCol = Math.abs(p1.x - p2.x) < 10;
        const x1 = sameCol ? p1.x : p1.x + bw(e.from) / 2;
        const y1 = sameCol ? p1.y + BH / 2 : p1.y;
        const x2 = sameCol ? p2.x : p2.x - bw(e.to) / 2;
        const y2 = sameCol ? p2.y - BH / 2 : p2.y;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const d = sameCol
          ? `M${x1},${y1} C${x1 + 40},${my} ${x2 + 40},${my} ${x2},${y2}`
          : `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        return (
          <path key={i} d={d} fill="none" stroke={accent} strokeWidth={2.2}
            opacity={0.7} markerEnd="url(#dg-arrow)" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const p = pos.get(n); if (!p) return null;
        const w = bw(n);
        const isKey = circleSet.has(n.toLowerCase());
        const isPrimary = writes.includes(n) && writes.indexOf(n) <= 1;
        const fs = Math.min(15, Math.max(10, Math.floor(140 / Math.max(n.length, 6))));
        return (
          <g key={i}>
            {/* Circle annotation ring */}
            {isKey && (
              <ellipse cx={p.x} cy={p.y} rx={w / 2 + 15} ry={BH / 2 + 15}
                fill={`${accent}10`} stroke={accent} strokeWidth={2.5}
                strokeDasharray="9,4" opacity={0.95}
              />
            )}
            {/* Box */}
            <rect x={p.x - w / 2} y={p.y - BH / 2} width={w} height={BH} rx={11}
              fill={isPrimary ? `${accent}1e` : "#f8f9ff"}
              stroke={accent} strokeWidth={isPrimary ? 2.2 : 1.5}
              filter="url(#node-shadow)"
            />
            {/* Label inside box */}
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill="#111827" fontSize={fs}
              fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
              fontWeight={isPrimary ? "700" : "600"}
            >
              {n.length > 24 ? n.slice(0, 23) + "…" : n}
            </text>
          </g>
        );
      })}

      {/* Labels */}
      {labels.slice(0, 2).map((l, i) => (
        <text key={i} x={W / 2} y={H - 6 - i * 15}
          textAnchor="middle" fill="#6b7280" fontSize={11}
          fontFamily="system-ui" fontStyle="italic"
        >{l.length > 60 ? l.slice(0, 58) + "…" : l}</text>
      ))}
    </svg>
  );
}

// ─── SCENE SLIDE ─────────────────────────────────────────────────────────────
// White academic slide. Diagram fills the main content area; image appears in
// a right-hand panel when available. Finding scenes get a giant-stat layout.

function SceneSlide({ scene, imageUrl }: { scene: Scene; imageUrl?: string }) {
  const accent = SLIDE_ACCENT[scene.type];
  const label  = SLIDE_LABEL[scene.type];
  const { writes, arrows, circles, labels } = parseNotes(scene.visual_notes ?? []);

  // ── Finding: extract the headline statistic ──────────────────────────────
  const isFinding = scene.type === "finding";
  let heroStat = "", heroRest = "";
  if (isFinding) {
    const raw = (scene.visual_notes ?? [])
      .find(n => /^Write:/i.test(n))
      ?.replace(/^Write:\s*/i, "") ?? writes[0] ?? "";
    const m = raw.match(/(\d[\d,]*(?:\.\d+)?\s*(?:vs\.?|versus)\s*\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?%|\d[\d,]*(?:\.\d+)?\s*(?:points?|times?|\bx\b))/i);
    heroStat  = m ? m[0] : raw.split(/[,;]/)[0].trim();
    heroRest  = raw.replace(heroStat, "").replace(/^[\s,;:]+/, "");
  }

  const hasNodes = writes.length > 0 || arrows.length > 0;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ top: "6%", bottom: "6%", left: "3%", right: "3%", zIndex: 10 }}
    >
      <style>{`@keyframes imgFade { from { opacity:0 } to { opacity:1 } }`}</style>
      {/* White academic slide card */}
      <div style={{
        width: "100%", height: "100%",
        background: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 10px 60px rgba(0,0,0,0.45)",
        border: `3px solid ${accent}`,
        display: "flex", flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, 'Helvetica Neue', sans-serif",
        overflow: "hidden",
      }}>

        {/* Top colour bar */}
        <div style={{ height: 7, background: `linear-gradient(90deg, ${accent}, ${accent}88)`, flexShrink: 0 }} />

        {/* Header: type label + headline */}
        <div style={{ padding: "8px 20px 7px", borderBottom: `1.5px solid ${accent}22`, flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: "0.14em", marginBottom: 3, textTransform: "uppercase" as const }}>
            {label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>
            {scene.headline}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

          {/* ── FINDING: hero stat layout ── */}
          {isFinding ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 24px" }}>
              <div style={{
                textAlign: "center",
                background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
                border: `2.5px solid ${accent}`, borderRadius: 16,
                padding: "18px 32px",
              }}>
                <div style={{ fontSize: 58, fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-0.03em" }}>
                  {heroStat.length > 18 ? heroStat.slice(0, 18) + "…" : heroStat}
                </div>
                {heroRest && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6, fontWeight: 600 }}>{heroRest}</div>}
              </div>
              {writes.slice(1).map((w, i) => (
                <div key={i} style={{
                  width: "100%", background: `${accent}0f`,
                  border: `1.5px solid ${accent}44`, borderLeft: `4px solid ${accent}`,
                  borderRadius: 8, padding: "8px 16px",
                  fontSize: 13, fontWeight: 700, color: "#374151",
                }}>{w}</div>
              ))}
            </div>

          ) : (
            /* ── DIAGRAM + optional image ── */
            <>
              {/* Left: concept diagram */}
              <div style={{
                flex: 1, padding: "10px 14px 6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: 0,
                background: hasNodes ? "#fafbff" : "#ffffff",
              }}>
                {hasNodes
                  ? <ConceptDiagram writes={writes} arrows={arrows} circles={circles} labels={labels} accent={accent} />
                  : <div style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>—</div>
                }
              </div>

              {/* Right: Pollinations image panel */}
              {imageUrl && (
                <div style={{
                  width: 196, flexShrink: 0,
                  borderLeft: `2px solid ${accent}22`,
                  background: "#f9fafb",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <img src={imageUrl} alt="" style={{
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    animation: "imgFade 0.8s ease",
                  }} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer: diagram labels + key terms */}
        {((labels.length > 0 && !isFinding) || (scene.key_terms ?? []).length > 0) && (
          <div style={{
            padding: "5px 18px 7px",
            borderTop: `1px solid ${accent}18`,
            display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
            flexShrink: 0,
          }}>
            {!isFinding && labels.map((l, i) => (
              <span key={i} style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic", marginRight: 6 }}>{l}</span>
            ))}
            {(scene.key_terms ?? []).slice(0, 6).map(t => (
              <span key={t} style={{
                background: `${accent}16`, border: `1px solid ${accent}44`,
                color: accent, borderRadius: 999,
                padding: "2px 10px", fontSize: 10, fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getPollinationsUrl(prompt: string): string {
  const styled = `${prompt}, no text, no letters, no words, clean technical illustration, white background`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(styled)}?width=800&height=450&nologo=true`;
}

export default function VideoPlayer({ script }: { script: PaperScript }) {
  const playerRef      = useRef<PlayerRef>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef   = useRef(false);
  const activeSceneRef = useRef(0);
  const speedRef       = useRef(1);

  const [isPlaying,     setIsPlaying]     = useState(false);
  const [activeScene,   setActiveScene]   = useState(0);
  const [currentFrame,  setCurrentFrame]  = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioReady,    setAudioReady]    = useState(false);
  const [audioLoading,  setAudioLoading]  = useState(true);
  const [loadedCount,   setLoadedCount]   = useState(0);
  const [ttsError,      setTtsError]      = useState<string | null>(null);
  const [sceneAudios,   setSceneAudios]   = useState<Record<number, string>>({});
  const [sceneImages,   setSceneImages]   = useState<Record<number, string>>({});

  const totalFrames  = getTotalFrames(script);
  const sceneOffsets = useMemo(() => getSceneOffsets(script), [script]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = playbackSpeed; }, [playbackSpeed]);

  // Pre-fetch Pollinations images for image-type scenes
  useEffect(() => {
    const imageScenes = script.scenes.filter(s => s.visual_type === "image" && s.image_prompt);
    if (imageScenes.length === 0) return;
    const updates: Record<number, string> = {};
    imageScenes.forEach(s => { updates[s.id] = getPollinationsUrl(s.image_prompt!); });
    setSceneImages(updates);
  }, [script]);

  // Fetch Gemini TTS audio for all scenes (3 at a time)
  useEffect(() => {
    let cancelled = false;
    const blobUrls: string[] = [];

    async function loadAll() {
      setAudioLoading(true);
      setLoadedCount(0);
      const loaded: Record<number, string> = {};
      const scenes = script.scenes;
      const BATCH = 3;

      for (let i = 0; i < scenes.length; i += BATCH) {
        const batch = scenes.slice(i, i + BATCH);
        await Promise.all(batch.map(async (scene) => {
          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: scene.narration }),
            });
            if (!res.ok) throw new Error(`TTS ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            blobUrls.push(url);
            loaded[scene.id] = url;
          } catch (e) {
            console.warn("[tts] scene", scene.id, e);
          }
          if (!cancelled) setLoadedCount(c => c + 1);
        }));
        if (cancelled) break;
      }

      if (!cancelled) {
        setSceneAudios(loaded);
        setAudioLoading(false);
        setAudioReady(Object.keys(loaded).length > 0);
        if (Object.keys(loaded).length === 0) setTtsError("Narration failed to load.");
      }
    }

    loadAll();
    return () => {
      cancelled = true;
      blobUrls.forEach(u => URL.revokeObjectURL(u));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ""; };
  }, []);

  // Drive Remotion frames from audio time
  useEffect(() => {
    if (!audioReady) return;
    const id = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || !isPlayingRef.current) return;
      const sceneIdx = activeSceneRef.current;
      const elapsed = audio.currentTime;
      const targetFrame = Math.round(sceneOffsets[sceneIdx] + elapsed * FPS);
      const actualFrame = playerRef.current?.getCurrentFrame() ?? 0;
      setCurrentFrame(actualFrame);
      if (Math.abs(targetFrame - actualFrame) > FPS * 0.5) {
        playerRef.current?.seekTo(Math.min(targetFrame, totalFrames - 1));
      }
    }, 500);
    return () => clearInterval(id);
  }, [audioReady, sceneOffsets, totalFrames]);

  const playScene = useCallback((sceneIdx: number, offsetSec = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    const scene = script.scenes[sceneIdx];
    const url = sceneAudios[scene.id];
    if (!url) return;

    audio.src = url;
    audio.currentTime = offsetSec;
    audio.playbackRate = speedRef.current;
    audio.onended = () => {
      const next = sceneIdx + 1;
      if (next < script.scenes.length) {
        activeSceneRef.current = next;
        setActiveScene(next);
        playerRef.current?.seekTo(sceneOffsets[next]);
        playScene(next, 0);
      } else {
        setIsPlaying(false);
        isPlayingRef.current = false;
        playerRef.current?.pause();
      }
    };
    audio.play().catch(() => {});
    playerRef.current?.seekTo(sceneOffsets[sceneIdx] + Math.round(offsetSec * FPS));
    playerRef.current?.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneAudios, sceneOffsets, script.scenes]);

  const handlePlay = useCallback(() => {
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    const sceneIdx = sceneAtFrame(frame, sceneOffsets);
    const offsetSec = (frame - sceneOffsets[sceneIdx]) / FPS;
    activeSceneRef.current = sceneIdx;
    setActiveScene(sceneIdx);
    playScene(sceneIdx, offsetSec);
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [playScene, sceneOffsets]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    playerRef.current?.pause();
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const handleRestart = useCallback(() => {
    activeSceneRef.current = 0;
    setActiveScene(0);
    setCurrentFrame(0);
    playScene(0, 0);
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [playScene]);

  const handleRewind = useCallback(() => {
    const frame = playerRef.current?.getCurrentFrame() ?? 0;
    const newFrame = Math.max(0, frame - 10 * FPS);
    const sceneIdx = sceneAtFrame(newFrame, sceneOffsets);
    const offsetSec = (newFrame - sceneOffsets[sceneIdx]) / FPS;
    activeSceneRef.current = sceneIdx;
    setActiveScene(sceneIdx);
    playerRef.current?.seekTo(newFrame);
    if (isPlayingRef.current) {
      playScene(sceneIdx, offsetSec);
    } else {
      const audio = audioRef.current;
      if (audio && sceneAudios[script.scenes[sceneIdx].id]) {
        audio.src = sceneAudios[script.scenes[sceneIdx].id];
        audio.currentTime = offsetSec;
      }
    }
  }, [playScene, sceneOffsets, sceneAudios, script.scenes]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    speedRef.current = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetFrame = Math.round(ratio * totalFrames);
    const sceneIdx = sceneAtFrame(targetFrame, sceneOffsets);
    const offsetSec = (targetFrame - sceneOffsets[sceneIdx]) / FPS;
    activeSceneRef.current = sceneIdx;
    setActiveScene(sceneIdx);
    setCurrentFrame(targetFrame);
    playerRef.current?.seekTo(targetFrame);
    if (isPlayingRef.current) {
      playScene(sceneIdx, offsetSec);
    } else {
      const audio = audioRef.current;
      if (audio && sceneAudios[script.scenes[sceneIdx].id]) {
        audio.src = sceneAudios[script.scenes[sceneIdx].id];
        audio.currentTime = offsetSec;
      }
    }
  }, [totalFrames, sceneOffsets, playScene, sceneAudios, script.scenes]);


  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{script.title}</h2>
        <p className="text-gray-400 mt-1 text-sm">{script.summary}</p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative" style={{ aspectRatio: "16/9" }}>
        {audioReady ? (
          <>
            <Player
              ref={playerRef}
              component={PaperComposition}
              inputProps={{ script, sceneImages }}
              durationInFrames={totalFrames}
              compositionWidth={1280}
              compositionHeight={720}
              fps={FPS}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              loop={false}
              clickToPlay={false}
              playbackRate={playbackSpeed}
              acknowledgeRemotionLicense
            />
          </>
        ) : (
          <div className="w-full h-full bg-[#0d0d2b] flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-violet-400 rounded-full mx-auto mb-3" />
              <p className="text-sm">{audioLoading ? `Generating narration… (${loadedCount}/${script.scenes.length})` : "Loading…"}</p>
            </div>
          </div>
        )}
      </div>

      {ttsError && (
        <div className="text-red-400 text-sm text-center px-4 py-2 bg-red-500/10 rounded-lg border border-red-500/20">
          Narration unavailable: {ttsError}
        </div>
      )}

      {/* Progress bar */}
      {audioReady && (
        <div className="w-full flex flex-col gap-1">
          <div
            className="w-full h-2 bg-white/10 rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-none relative"
              style={{ width: `${totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentFrame / FPS)}</span>
            <span>{formatTime(totalFrames / FPS)}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={handleRestart} disabled={!audioReady}
            className="px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            ↺
          </button>
          <button onClick={handleRewind} disabled={!audioReady}
            className="px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            ⏪ 10s
          </button>
          <button onClick={isPlaying ? handlePause : handlePlay} disabled={!audioReady}
            className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            {audioLoading ? "Loading…" : isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              disabled={!audioReady}
              className={`px-2 py-1 rounded text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                playbackSpeed === speed
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>

      {/* Scene list */}
      <div className="grid gap-2">
        {script.scenes.map((scene, i) => (
          <div
            key={scene.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all ${
              i === activeScene && isPlaying
                ? "bg-white/10 border-white/20"
                : "bg-white/5 border-white/5"
            }`}
          >
            <span className="text-xl mt-0.5">{scene.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{scene.headline}</p>
              <p className="text-gray-500 text-xs mt-0.5 uppercase tracking-wide">
                {scene.type} · scene {i + 1}
              </p>
              {i === activeScene && isPlaying && (
                <p className="text-gray-400 text-xs mt-1.5 leading-relaxed line-clamp-3 italic">
                  {scene.narration}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
