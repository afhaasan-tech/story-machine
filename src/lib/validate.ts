import { isAllowedModel } from "@/config/models";
import type { Lang, Length } from "./prompt";

export type Input = {
  lang: Lang;
  name: string;
  subject: string;
  place: string;
  length: Length;
  model: string;
};

export type ValidationResult =
  | { ok: true; input: Input }
  | { ok: false; code: "invalid_input" | "inappropriate" | "model_not_allowed" };

const MAX = { name: 30, subject: 40, place: 50 };
// Letters, numbers, spaces and light punctuation only (blocks markup and prompt tricks).
const SAFE = /^[\p{L}\p{M}\p{N}\s'’\-.,!?؟،]+$/u;

// Small blocklist (EN + AR). Not exhaustive: the system prompt also forbids scary content.
const BAD = [
  "kill", "murder", "blood", "gun", "weapon", "sex", "porn", "nude", "rape", "drug",
  "suicide", "terror", "bomb", "ghost", "demon", "devil", "fuck", "shit", "bitch",
  "قتل", "دم", "سلاح", "مسدس", "جنس", "عاري", "اغتصاب", "مخدر", "انتحار", "ارهاب",
  "إرهاب", "قنبلة", "شيطان", "عفريت", "لعنة",
];

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim();
  if (s.length > max) return null;
  return s;
}

export function validate(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") return { ok: false, code: "invalid_input" };
  const b = body as Record<string, unknown>;

  if (b.lang !== "ar" && b.lang !== "en") return { ok: false, code: "invalid_input" };
  if (b.length !== "short" && b.length !== "medium") return { ok: false, code: "invalid_input" };
  if (!isAllowedModel(b.model)) return { ok: false, code: "model_not_allowed" };

  const name = clean(b.name, MAX.name);
  const subject = clean(b.subject, MAX.subject);
  const place = clean(b.place ?? "", MAX.place);
  if (!name || !subject || place === null) return { ok: false, code: "invalid_input" };

  for (const f of [name, subject, place]) {
    if (f && !SAFE.test(f)) return { ok: false, code: "invalid_input" };
    const low = f.toLowerCase();
    if (BAD.some((w) => low.includes(w))) return { ok: false, code: "inappropriate" };
  }

  return {
    ok: true,
    input: { lang: b.lang, length: b.length, model: b.model, name, subject, place },
  };
}
