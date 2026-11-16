// Tells the browser which optional features are configured. Only booleans, never keys.
export async function GET() {
  return Response.json(
    {
      narration: Boolean(process.env.ELEVENLABS_API_KEY),
      dictation: Boolean(process.env.GROQ_API_KEY),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
