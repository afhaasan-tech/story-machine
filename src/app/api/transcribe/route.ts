import { extractSpark } from "@/lib/extract";
import { clientIp, rateLimited } from "@/lib/rateLimit";
import { validate } from "@/lib/validate";
import { DEFAULT_MODEL } from "@/config/models";

export const maxDuration = 60;

const MAX_BYTES = 2_000_000; // about a minute of speech
const LIMIT_PER_MINUTE = 6;

function fail(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

function fileName(type: string) {
  const ext = type.includes("mpeg") ? "mp3" : type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";
  return `spark.${ext}`;
}

// Groq's free Whisper (used first when its key exists, to save ElevenLabs credits).
async function viaGroq(audio: Blob, lang: string, key: string): Promise<string | null> {
  const out = new FormData();
  out.append("file", audio, fileName(audio.type));
  out.append("model", "whisper-large-v3-turbo");
  out.append("language", lang);
  out.append("response_format", "json");
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: out,
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return typeof data?.text === "string" ? data.text : null;
}

// ElevenLabs Scribe: same key as the narration voice.
async function viaElevenLabs(audio: Blob, lang: string, key: string): Promise<string | null> {
  const out = new FormData();
  out.append("file", audio, fileName(audio.type));
  out.append("model_id", "scribe_v1");
  out.append("language_code", lang);
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: out,
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => null);
  return typeof data?.text === "string" ? data.text : null;
}

export async function POST(request: Request) {
  const groqKey = process.env.GROQ_API_KEY ?? process.env.API_GROQ_KEY; // accepts either name
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (!groqKey && !elevenKey) return fail("not_configured", 503);
  if (rateLimited(`stt:${clientIp(request)}`, Date.now(), LIMIT_PER_MINUTE)) return fail("rate_limited", 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("invalid_input", 400);
  }
  const audio = form.get("audio");
  const lang = form.get("lang") === "en" ? "en" : "ar";
  if (!(audio instanceof Blob) || audio.size < 1000 || audio.size > MAX_BYTES) return fail("invalid_input", 400);

  let raw: string | null = null;
  if (groqKey) raw = await viaGroq(audio, lang, groqKey);
  if (raw === null && elevenKey) raw = await viaElevenLabs(audio, lang, elevenKey);
  if (raw === null) return fail("transcribe_failed", 502);

  const text = raw.trim().slice(0, 400);
  if (!text) return fail("no_speech", 422);

  // Split the sentence into name / animal / place with the story key (free models).
  const orKey = process.env.OPENROUTER_API_KEY;
  const spark = orKey ? await extractSpark(text, orKey) : null;
  // If no model could split the sentence, return empty fields; the page shows what we heard.
  const fields = spark ?? { name: "", subject: "", place: "" };

  // Same safety checks as typed input (use a valid dummy for the empty fields).
  const check = validate({
    lang,
    length: "short",
    model: DEFAULT_MODEL,
    name: fields.name || "x",
    subject: fields.subject || "x",
    place: fields.place,
  });
  if (!check.ok) return fail(check.code === "inappropriate" ? "inappropriate" : "invalid_input", 400);

  return Response.json({ text, ...fields }, { headers: { "Cache-Control": "no-store" } });
}
