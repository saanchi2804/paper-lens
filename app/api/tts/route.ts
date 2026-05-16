// TTS is now handled client-side via the Web Speech API (free, no quota).
// Re-enable this route and update VideoPlayer when switching back to ElevenLabs.
//
// Original voice: Rachel (ID 21m00Tcm4TlvDq8ikWAM), model eleven_turbo_v2_5

export async function POST() {
  return Response.json({ disabled: true }, { status: 501 });
}
