import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 60;

function pcmToWav(pcm: Buffer, sampleRate = 24000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);              // PCM
  header.writeUInt16LE(1, 22);              // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32);              // block align
  header.writeUInt16LE(16, 34);             // 16-bit
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "No text provided." }, { status: 400 });
    }

    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.trim() }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const audioBase64 = (part as { inlineData?: { data?: string; mimeType?: string } })?.inlineData?.data;
    if (!audioBase64) {
      return Response.json({ error: "No audio returned from Gemini TTS." }, { status: 500 });
    }

    const pcm = Buffer.from(audioBase64, "base64");
    const wav = pcmToWav(pcm, 24000);

    return new Response(wav.buffer as ArrayBuffer, {
      headers: { "Content-Type": "audio/wav", "Content-Length": String(wav.length) },
    });
  } catch (err) {
    console.error("[tts] error:", err);
    return Response.json({ error: `TTS failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
