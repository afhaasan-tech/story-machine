import { MODELS } from "@/config/models";
import { SYSTEM_PROMPT, buildUserMessage } from "./prompt";
import type { Input } from "./validate";

export type Story = { title: string; story: string };

const MAX_TOKENS = 3000;
const FIRST_CALL_TIMEOUT_MS = 36_000;
const TOTAL_BUDGET_MS = 56_000; // Vercel function limit is 60s
const MIN_FALLBACK_MS = 8_000;
const MAX_ATTEMPTS = 3; // chosen model + up to 2 fallbacks, all within the 60s function limit

/** Models often put one short sentence per paragraph. Regroup them into paragraphs of 3 to 4 sentences. */
export function regroupParagraphs(story: string): string {
  const lines = story
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const avgWords = lines.reduce((n, l) => n + l.split(/\s+/).length, 0) / Math.max(lines.length, 1);
  if (lines.length <= 9 || avgWords > 14) return lines.join("\n\n");
  const groups: string[] = [];
  for (let i = 0; i < lines.length; i += 4) groups.push(lines.slice(i, i + 4).join(" "));
  return groups.join("\n\n");
}

/** Pull a {title, story} object out of whatever the model returned. */
export function parseStory(raw: string): Story | null {
  const text = raw.replace(/```(?:json)?/gi, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const o = JSON.parse(text.slice(start, end + 1));
    if (typeof o.title !== "string" || typeof o.story !== "string") return null;
    const title = o.title.trim();
    const story = regroupParagraphs(o.story.trim());
    if (!title || story.length < 200) return null;
    return { title, story };
  } catch {
    return null;
  }
}

/** The story must really be in the requested language. */
export function matchesLanguage(s: Story, lang: "ar" | "en"): boolean {
  const text = s.title + s.story;
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const total = arabic + latin;
  if (total === 0) return false;
  return lang === "ar" ? arabic / total > 0.9 : arabic / total < 0.05;
}

async function callModel(model: string, input: Input, key: string, timeoutMs: number): Promise<Story | null> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "Story Machine",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      temperature: 0.9,
      reasoning: { enabled: false },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(input) },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;
  const story = parseStory(content);
  return story && matchesLanguage(story, input.lang) ? story : null;
}

/** Try the chosen model first; if it fails or returns bad JSON, fall back to other free models. */
export async function generateStory(input: Input, key: string): Promise<Story | null> {
  const order = [input.model, ...MODELS.map((m) => m.id).filter((id) => id !== input.model)];
  const start = Date.now();
  for (const [i, model] of order.slice(0, MAX_ATTEMPTS).entries()) {
    const left = TOTAL_BUDGET_MS - (Date.now() - start);
    if (i > 0 && left < MIN_FALLBACK_MS) break;
    try {
      const s = await callModel(model, input, key, i === 0 ? Math.min(FIRST_CALL_TIMEOUT_MS, left) : left);
      if (s) return s;
    } catch {
      // timeout / network: try the next model
    }
  }
  return null;
}
