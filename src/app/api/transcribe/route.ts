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

export async function POST(request: Request) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return fail("not_configured", 503);
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

  const type = audio.type || "audio/webm";
  const ext = type.includes("mp4") ? "mp4" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : "webm";

  const out = new FormData();
  out.append("file", audio, `spark.${ext}`);
  out.append("model", "whisper-large-v3-turbo");
  out.append("language", lang);
  out.append("response_format", "json");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}` },
    body: out,
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res || !res.ok) return fail("transcribe_failed", 502);

  const data = await res.json().catch(() => null);
  const text = typeof data?.text === "string" ? data.text.trim().slice(0, 400) : "";
  if (!text) return fail("no_speech", 422);

  // Split the sentence into name / animal / place with the story key (free models).
  const orKey = process.env.OPENROUTER_API_KEY;
  const spark = orKey ? await extractSpark(text, orKey) : null;
  const fields = spark ?? { name: "", subject: "", place: text.slice(0, 50) };

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
