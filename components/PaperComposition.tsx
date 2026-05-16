"use client";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence, Img } from "remotion";
import { PaperScript, Scene, SceneType } from "@/types/script";

const ACCENT: Record<SceneType, string> = {
  intro:          "#7c3aed",
  prerequisite:   "#2563eb",
  hook:           "#ea580c",
  example:        "#0284c7",
  concept:        "#7c3aed",
  analogy:        "#16a34a",
  worked_example: "#65a30d",
  finding:        "#059669",
  connection:     "#d97706",
  summary:        "#9333ea",
};

const LABEL: Record<SceneType, string> = {
  intro: "INTRO", prerequisite: "FOUNDATIONS", hook: "HOOK",
  example: "EXAMPLE", concept: "CONCEPT", analogy: "ANALOGY",
  worked_example: "WORKED EXAMPLE", finding: "FINDING",
  connection: "CONNECTION", summary: "SUMMARY",
};

// ─── DIAGRAM ─────────────────────────────────────────────────────────────────

function parseNotes(notes: string[]) {
  const writes: string[] = [];
  const arrows: { from: string; to: string }[] = [];
  const circles: string[] = [];
  const labels: string[] = [];
  for (const note of notes) {
    const m = note.match(/^(Write|Circle|Arrow|Label):\s*/i);
    if (!m) { writes.push(note); continue; }
    const prefix = m[1].toLowerCase();
    const content = note.slice(m[0].length).trim();
    if (prefix === "write") writes.push(content);
    else if (prefix === "circle") circles.push(content);
    else if (prefix === "label") labels.push(content);
    else if (prefix === "arrow") {
      const am = content.match(/from\s+(.+?)\s+to\s+(.+)/i);
      if (am) arrows.push({ from: am[1].trim(), to: am[2].trim() });
    }
  }
  return { writes, arrows, circles, labels };
}

function ConceptDiagram({ notes, accent }: { notes: string[]; accent: string }) {
  const { writes, arrows, circles, labels } = parseNotes(notes);
  const W = 860, H = 260;

  const nodeSet = new Set<string>();
  writes.forEach(w => nodeSet.add(w));
  arrows.forEach(a => { if (a.from) nodeSet.add(a.from); if (a.to) nodeSet.add(a.to); });
  const nodes = Array.from(nodeSet).slice(0, 7);
  if (nodes.length === 0) return null;

  const edges = arrows.filter(a => nodeSet.has(a.from) && nodeSet.has(a.to));
  const circleSet = new Set(circles.map(c => c.trim().toLowerCase()));

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

  const PAD_X = 90, PAD_Y = 44;
  const pos = new Map<string, { x: number; y: number }>();
  byLayer.forEach((ln, li) => {
    const x = maxL === 0 ? W / 2 : PAD_X + (li / maxL) * (W - 2 * PAD_X);
    ln.forEach((n, ni) => {
      const spacing = Math.min(96, (H - 2 * PAD_Y) / Math.max(ln.length, 1));
      const y = H / 2 + (ni - (ln.length - 1) / 2) * spacing;
      pos.set(n, { x, y });
    });
  });

  const BH = 50;
  const bw = (l: string) => Math.min(180, Math.max(100, l.length * 9.5 + 28));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <marker id="dg-arrow" markerWidth={10} markerHeight={7} refX={9} refY={3.5} orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={accent} opacity={0.8} />
        </marker>
        <filter id="node-shadow" x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={accent} floodOpacity="0.15" />
        </filter>
      </defs>
      {edges.map((e, i) => {
        const p1 = pos.get(e.from), p2 = pos.get(e.to); if (!p1 || !p2) return null;
        const sameCol = Math.abs(p1.x - p2.x) < 10;
        const x1 = sameCol ? p1.x : p1.x + bw(e.from) / 2, y1 = sameCol ? p1.y + BH / 2 : p1.y;
        const x2 = sameCol ? p2.x : p2.x - bw(e.to) / 2,   y2 = sameCol ? p2.y - BH / 2 : p2.y;
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const d = sameCol
          ? `M${x1},${y1} C${x1+44},${my} ${x2+44},${my} ${x2},${y2}`
          : `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        return <path key={i} d={d} fill="none" stroke={accent} strokeWidth={2.2} opacity={0.65} markerEnd="url(#dg-arrow)" />;
      })}
      {nodes.map((n, i) => {
        const p = pos.get(n); if (!p) return null;
        const w = bw(n);
        const isKey = circleSet.has(n.toLowerCase());
        const isPrimary = writes.includes(n) && writes.indexOf(n) <= 1;
        const fs = Math.min(15, Math.max(10, Math.floor(150 / Math.max(n.length, 6))));
        return (
          <g key={i}>
            {isKey && <ellipse cx={p.x} cy={p.y} rx={w/2+14} ry={BH/2+14} fill={`${accent}12`} stroke={accent} strokeWidth={2.5} strokeDasharray="8,4" opacity={0.9} />}
            <rect x={p.x-w/2} y={p.y-BH/2} width={w} height={BH} rx={10}
              fill={isPrimary ? `${accent}1a` : "#ffffff"}
              stroke={accent} strokeWidth={isPrimary ? 2.2 : 1.6} filter="url(#node-shadow)" />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill="#111827" fontSize={fs}
              fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
              fontWeight={isPrimary ? "700" : "600"}>
              {n.length > 26 ? n.slice(0, 25) + "…" : n}
            </text>
          </g>
        );
      })}
      {labels.slice(0, 2).map((l, i) => (
        <text key={i} x={W/2} y={H - 8 - i * 16} textAnchor="middle" fill="#6b7280" fontSize={11.5}
          fontFamily="system-ui" fontStyle="italic">
          {l.length > 65 ? l.slice(0, 63) + "…" : l}
        </text>
      ))}
    </svg>
  );
}

// ─── CHART: LAYERS ────────────────────────────────────────────────────────────

function LayersChart({ title, layers, accent }: {
  title?: string;
  layers: { label: string; sublabel?: string }[];
  accent: string;
}) {
  const count = Math.min(layers.length, 6);
  const displayed = layers.slice(0, count);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 0, alignItems: "center" }}>
      {title && (
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          {title}
        </div>
      )}
      {displayed.map((layer, i) => {
        const depth = i / Math.max(count - 1, 1);
        const bg = `color-mix(in srgb, ${accent} ${8 + depth * 14}%, #ffffff)`;
        const borderColor = `color-mix(in srgb, ${accent} ${30 + depth * 40}%, transparent)`;
        return (
          <div key={i} style={{
            width: `${96 - i * 3}%`,
            background: bg,
            border: `1.8px solid ${borderColor}`,
            borderRadius: i === 0 ? "10px 10px 4px 4px" : i === count - 1 ? "4px 4px 10px 10px" : "4px",
            padding: "10px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: i < count - 1 ? -1 : 0,
            zIndex: count - i,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{layer.label}</span>
            {layer.sublabel && (
              <span style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>{layer.sublabel}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CHART: BAR ───────────────────────────────────────────────────────────────

function BarChart({ bars, accent }: {
  bars: { label: string; value: number; highlight?: boolean; unit?: string }[];
  accent: string;
}) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      {bars.map((bar, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 130, fontSize: 12, fontWeight: bar.highlight ? 700 : 500, color: bar.highlight ? "#111827" : "#4b5563", textAlign: "right", flexShrink: 0 }}>
            {bar.label}
          </div>
          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 6, height: 28, overflow: "hidden" }}>
            <div style={{
              width: `${(bar.value / max) * 100}%`,
              height: "100%",
              background: bar.highlight ? accent : `${accent}66`,
              borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "flex-end",
              paddingRight: 8,
              transition: "width 0.3s ease",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {bar.value}{bar.unit ?? ""}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHART: COMPARISON ────────────────────────────────────────────────────────

function ComparisonChart({ columns, accent }: {
  columns: { heading: string; items: string[] }[];
  accent: string;
}) {
  const cols = columns.slice(0, 2);
  return (
    <div style={{ width: "100%", display: "flex", gap: 12 }}>
      {cols.map((col, ci) => (
        <div key={ci} style={{
          flex: 1,
          border: `2px solid ${ci === 1 ? accent : "#e5e7eb"}`,
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <div style={{
            background: ci === 1 ? accent : "#f9fafb",
            color: ci === 1 ? "#fff" : "#374151",
            fontSize: 12, fontWeight: 700, textAlign: "center",
            padding: "7px 12px",
            borderBottom: `1px solid ${ci === 1 ? `${accent}44` : "#e5e7eb"}`,
          }}>
            {col.heading}
          </div>
          <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
            {col.items.slice(0, 5).map((item, ii) => (
              <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                <span style={{ color: ci === 1 ? accent : "#9ca3af", fontSize: 13, marginTop: 1 }}>
                  {ci === 1 ? "✓" : "·"}
                </span>
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHART: STAT ──────────────────────────────────────────────────────────────

function StatHighlight({ stat, context, accent, extraBars }: {
  stat: string; context?: string; accent: string;
  extraBars?: { label: string; value: number; highlight?: boolean; unit?: string }[];
}) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{
        textAlign: "center",
        background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
        border: `2.5px solid ${accent}`, borderRadius: 16,
        padding: "20px 40px",
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {stat.length > 18 ? stat.slice(0, 17) + "…" : stat}
        </div>
        {context && (
          <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8, fontWeight: 600 }}>{context}</div>
        )}
      </div>
      {extraBars && extraBars.length > 0 && (
        <div style={{ width: "100%" }}>
          <BarChart bars={extraBars} accent={accent} />
        </div>
      )}
    </div>
  );
}

// ─── CHART: TIMELINE ─────────────────────────────────────────────────────────

function TimelineChart({ events, accent }: { events: string[]; accent: string }) {
  const displayed = events.slice(0, 5);
  return (
    <div style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 0, overflowX: "hidden" }}>
      {displayed.map((evt, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {/* Connector line */}
          {i < displayed.length - 1 && (
            <div style={{
              position: "absolute", top: 16, left: "50%", width: "100%",
              height: 2, background: `${accent}44`,
              zIndex: 0,
            }} />
          )}
          {/* Dot */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: accent, color: "#fff",
            fontSize: 13, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1, flexShrink: 0,
            boxShadow: `0 0 0 4px ${accent}22`,
          }}>
            {i + 1}
          </div>
          {/* Label */}
          <div style={{
            marginTop: 8, fontSize: 11, fontWeight: 600, color: "#374151",
            textAlign: "center", padding: "0 6px", lineHeight: 1.3,
          }}>
            {evt.length > 40 ? evt.slice(0, 38) + "…" : evt}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── IMAGE PANEL ─────────────────────────────────────────────────────────────

function ImagePanel({ imageUrl, labels, accent }: {
  imageUrl: string; labels?: string[]; accent: string;
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: 8, overflow: "hidden" }}>
      <Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      {/* Label chips overlaid on the image */}
      {labels && labels.length > 0 && (
        <div style={{
          position: "absolute", bottom: 10, left: 10, right: 10,
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {labels.slice(0, 4).map((l, i) => (
            <span key={i} style={{
              background: "rgba(0,0,0,0.72)", color: "#fff",
              borderRadius: 6, padding: "4px 10px",
              fontSize: 11, fontWeight: 700,
              border: `1px solid ${accent}88`,
            }}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── VISUAL DISPATCHER ───────────────────────────────────────────────────────

function SceneVisual({ scene, imageUrl, accent }: {
  scene: Scene; imageUrl?: string; accent: string;
}) {
  const vt = scene.visual_type ?? "diagram";

  if (vt === "image" && imageUrl) {
    return <ImagePanel imageUrl={imageUrl} labels={scene.image_labels} accent={accent} />;
  }

  if (vt === "chart") {
    switch (scene.chart_type) {
      case "layers":
        return <LayersChart title={scene.chart_title} layers={scene.layers ?? []} accent={accent} />;
      case "bar":
        return <BarChart bars={scene.bars ?? []} accent={accent} />;
      case "comparison":
        return <ComparisonChart columns={scene.columns ?? []} accent={accent} />;
      case "stat":
        return <StatHighlight stat={scene.stat ?? ""} context={scene.stat_context} accent={accent} />;
      case "timeline":
        return <TimelineChart events={scene.timeline_events ?? []} accent={accent} />;
    }
  }

  // fallback to diagram
  const notes = scene.visual_notes ?? [];
  const { writes, arrows } = parseNotes(notes);
  if (writes.length === 0 && arrows.length === 0) return null;
  return <ConceptDiagram notes={notes} accent={accent} />;
}

// ─── SUBTITLE ─────────────────────────────────────────────────────────────────

function toLines(narration: string, wordsPerLine = 10): string[] {
  const words = narration.trim().split(/\s+/);
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine)
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  return lines;
}

// ─── SCENE VIEW ───────────────────────────────────────────────────────────────

function SceneView({ scene, localFrame, fps, totalFrames, sceneIndex, totalScenes, imageUrl }: {
  scene: Scene; localFrame: number; fps: number;
  totalFrames: number; sceneIndex: number; totalScenes: number;
  imageUrl?: string;
}) {
  const accent = ACCENT[scene.type];
  const label  = LABEL[scene.type];
  const progress = Math.min(1, localFrame / Math.max(1, totalFrames));

  const slideIn = interpolate(localFrame, [0, 18], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeIn  = interpolate(localFrame, [0, 18], [0, 1],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hlY     = interpolate(localFrame, [6, 24], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hlOp    = interpolate(localFrame, [6, 24], [0, 1],  { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lines = toLines(scene.narration);
  const currentLine = Math.min(lines.length - 1, Math.floor(progress * lines.length));
  const visibleStart = Math.max(0, currentLine - 1);
  const visibleLines = lines.slice(visibleStart, currentLine + 1);
  const lineProgress = (progress * lines.length) - currentLine;
  const currentLineWords = (lines[currentLine] ?? "").split(" ");
  const litWord = Math.min(currentLineWords.length - 1, Math.floor(lineProgress * currentLineWords.length));

  return (
    <AbsoluteFill style={{
      background: "#e8eaf0",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 32px 12px",
    }}>
      {/* White slide card */}
      <div style={{
        width: "100%", flex: 1,
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
        border: `2.5px solid ${accent}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        transform: `translateY(${slideIn}px)`,
        opacity: fadeIn,
      }}>
        {/* Accent bar */}
        <div style={{ height: 6, background: `linear-gradient(90deg, ${accent}, ${accent}88)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: "10px 22px 9px",
          borderBottom: `1.5px solid ${accent}22`,
          flexShrink: 0,
          transform: `translateY(${hlY}px)`,
          opacity: hlOp,
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: accent, letterSpacing: "0.15em", marginBottom: 4, textTransform: "uppercase" as const }}>
            {label} · {sceneIndex + 1} / {totalScenes}
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", lineHeight: 1.3 }}>
            {scene.headline}
          </div>
        </div>

        {/* Body — visual content */}
        <div style={{
          flex: 1, padding: "16px 20px 12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fafbff", overflow: "hidden",
        }}>
          <SceneVisual scene={scene} imageUrl={imageUrl} accent={accent} />
        </div>

        {/* Footer: key terms */}
        {(scene.key_terms ?? []).length > 0 && (
          <div style={{
            padding: "6px 18px 8px",
            borderTop: `1px solid ${accent}18`,
            display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
            flexShrink: 0,
          }}>
            {(scene.key_terms ?? []).slice(0, 7).map(t => (
              <span key={t} style={{
                background: `${accent}15`, border: `1px solid ${accent}44`,
                color: accent, borderRadius: 999,
                padding: "2px 11px", fontSize: 10, fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 3, background: `${accent}18`, flexShrink: 0 }}>
          <div style={{
            height: "100%", width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${accent}88, ${accent})`,
          }} />
        </div>
      </div>

      {/* Subtitles */}
      <div style={{
        marginTop: 10,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        minHeight: 52,
      }}>
        {visibleLines.map((line, li) => {
          const isCurrent = li === visibleLines.length - 1;
          if (!isCurrent) return (
            <div key={visibleStart + li} style={{
              background: "rgba(0,0,0,0.45)", borderRadius: 6, padding: "3px 14px",
              fontSize: 14, color: "rgba(255,255,255,0.4)",
            }}>{line}</div>
          );
          const words = line.split(" ");
          return (
            <div key={visibleStart + li} style={{
              background: "rgba(0,0,0,0.75)", borderRadius: 8, padding: "5px 18px",
              fontSize: 16, fontWeight: 600,
              display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 5px",
            }}>
              {words.map((w, wi) => (
                <span key={wi} style={{ color: wi <= litWord ? "#ffffff" : "rgba(255,255,255,0.28)" }}>{w}</span>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ─── COMPOSITION ──────────────────────────────────────────────────────────────

export default function PaperComposition({
  script,
  sceneImages = {},
}: {
  script: PaperScript;
  sceneImages?: Record<number, string>;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let offset = 0;
  return (
    <AbsoluteFill style={{ background: "#e8eaf0" }}>
      {script.scenes.map((scene, index) => {
        const startFrame = offset;
        const durationFrames = Math.round(scene.duration_seconds * fps);
        offset += durationFrames;
        return (
          <Sequence key={scene.id} from={startFrame} durationInFrames={durationFrames}>
            <SceneView
              scene={scene}
              localFrame={frame - startFrame}
              fps={fps}
              totalFrames={durationFrames}
              sceneIndex={index}
              totalScenes={script.scenes.length}
              imageUrl={sceneImages[scene.id]}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
