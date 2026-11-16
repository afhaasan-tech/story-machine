import { clientIp, rateLimited } from "@/lib/rateLimit";

export const maxDuration = 60;

// Free ElevenLabs plans give ~10 minutes a month, so keep requests small and rare.
const MAX_CHARS = 3200;
const LIMIT_PER_MINUTE = 3;
// A calm multilingual voice. Override with ELEVENLABS_VOICE_ID if you like another one.
const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM";

function fail(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return fail("not_configured", 503);
  if (rateLimited(`speak:${clientIp(request)}`, Date.now(), LIMIT_PER_MINUTE)) return fail("rate_limited", 429);

  let text = "";
  try {
    const body = await request.json();
    text = typeof body?.text === "string" ? body.text.trim() : "";
  } catch {
    return fail("invalid_input", 400);
  }
  if (!text) return fail("invalid_input", 400);
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);

  const voice = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.7, similarity_boost: 0.75, style: 0, speed: 0.9 },
    }),
    signal: AbortSignal.timeout(50_000),
  }).catch(() => null);

  if (!res || !res.ok || !res.body) return fail("speak_failed", 502);
  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
