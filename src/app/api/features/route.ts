// Tells the browser which optional features are configured. Only booleans, never keys.
export async function GET() {
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY);
  // The free ElevenLabs plan can only use voices that live in your own account, so narration needs a voice id.
  const narrator = eleven && Boolean(process.env.ELEVENLABS_VOICE_ID);
  return Response.json(
    {
      narration: narrator,
      dictation: eleven || Boolean(process.env.GROQ_API_KEY ?? process.env.API_GROQ_KEY),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
