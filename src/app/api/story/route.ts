import { clientIp, rateLimited } from "@/lib/rateLimit";
import { generateStory } from "@/lib/story";
import { validate } from "@/lib/validate";

export const maxDuration = 60;

function fail(code: string, status: number) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (rateLimited(`story:${clientIp(request)}`)) return fail("rate_limited", 429);

  const text = await request.text();
  if (text.length > 4000) return fail("invalid_input", 400);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fail("invalid_input", 400);
  }

  const v = validate(body);
  if (!v.ok) return fail(v.code, 400);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return fail("generation_failed", 500);

  const story = await generateStory(v.input, key);
  if (!story) return fail("generation_failed", 502);
  return Response.json(story, { headers: { "Cache-Control": "no-store" } });
}
