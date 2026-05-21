"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { PaperScript } from "@/types/script";

const VideoPlayer = dynamic(() => import("@/components/VideoPlayer"), { ssr: false });

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [script, setScript] = useState<PaperScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const LOAD_STEPS = [
    "Reading your paper…",
    "Building the lesson structure…",
    "Writing Saisha's narration…",
    "Adding examples and analogies…",
    "Finalising the script…",
  ];

  useEffect(() => {
    if (!loading) { setLoadStep(0); return; }
    const delays = [0, 4000, 12000, 22000, 35000];
    const timers = delays.map((d, i) => setTimeout(() => setLoadStep(i), d));
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    setFile(f);
    setError(null);
    setScript(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleExplain = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setScript(null);
    try {
      // Parse PDF in the browser using pdfjs-dist (browser-native)
      const pdfjsLib = await import("pdfjs-dist");
      // Try CDN worker; fall back to disabling the worker entirely if it fails
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      } catch {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";
      }
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let pdfText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfText += content.items.map((item: any) => item.str ?? "").join(" ") + "\n";
      }
      // Strip null bytes, control chars, and non-printable characters that break JSON / TTS
      pdfText = pdfText
        .replace(/\0/g, "")
        .replace(/[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 10000);

      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setScript(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate explanation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center px-6 py-16">
      <div className="max-w-2xl w-full flex flex-col items-center gap-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            PaperLens
          </h1>
          <p className="mt-3 text-lg text-gray-400">
            Upload a research paper. Get a visual story that explains it.
          </p>
        </div>

        {/* Upload area */}
        {!script && (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-all
              ${dragOver ? "border-violet-400 bg-violet-400/10" : "border-gray-700 hover:border-violet-500 hover:bg-white/5"}`}
          >
            <div className="text-5xl select-none">📄</div>
            {file ? (
              <div className="text-center">
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 font-medium">Drop your PDF here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
            )}
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Explain button */}
        {file && !script && (
          <button onClick={handleExplain} disabled={loading}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex flex-col items-center gap-2">
                <span className="flex items-center gap-3">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {LOAD_STEPS[loadStep]}
                </span>
                <span className="text-xs text-white/40 font-normal">This takes 30–60 seconds</span>
              </span>
            ) : "Explain this paper ✨"}
          </button>
        )}

        {/* Video Player */}
        {script && (
          <div className="w-full">
            <VideoPlayer script={script} />
            <button onClick={() => { setScript(null); setFile(null); }}
              className="mt-6 w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm"
            >
              Upload another paper
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
