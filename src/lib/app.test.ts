import { describe, expect, it } from "vitest";
import { MODELS } from "@/config/models";
import { rateLimited } from "./rateLimit";
import { matchesLanguage, parseStory, regroupParagraphs } from "./story";
import { validate } from "./validate";

const base = { lang: "en", name: "Sara", subject: "a bunny", place: "the moon", length: "short", model: MODELS[0].id };

describe("models", () => {
  it("are all :free", () => {
    for (const m of MODELS) expect(m.id.endsWith(":free")).toBe(true);
  });
});

describe("validate", () => {
  it("accepts a good spark", () => expect(validate(base).ok).toBe(true));
  it("rejects unknown models", () => {
    expect(validate({ ...base, model: "openai/gpt-4o" })).toEqual({ ok: false, code: "model_not_allowed" });
  });
  it("rejects a bad language", () => expect(validate({ ...base, lang: "fr" }).ok).toBe(false));
  it("rejects too-long names", () => expect(validate({ ...base, name: "x".repeat(31) }).ok).toBe(false));
  it("rejects markup", () => expect(validate({ ...base, place: "<script>" }).ok).toBe(false));
  it("rejects inappropriate words in both languages", () => {
    expect(validate({ ...base, subject: "a gun" })).toEqual({ ok: false, code: "inappropriate" });
    expect(validate({ ...base, lang: "ar", subject: "سلاح" })).toEqual({ ok: false, code: "inappropriate" });
  });
  it("accepts Arabic input", () => {
    expect(validate({ ...base, lang: "ar", name: "سارة", subject: "أرنب", place: "القمر" }).ok).toBe(true);
  });
});

describe("rate limit", () => {
  it("blocks the 11th request in a minute", () => {
    const results = Array.from({ length: 11 }, () => rateLimited("1.1.1.1", 1000));
    expect(results.slice(0, 10).every((r) => !r)).toBe(true);
    expect(results[10]).toBe(true);
  });
});

describe("story parsing", () => {
  const long = "word ".repeat(60);
  it("parses fenced JSON", () => {
    const s = parseStory("```json\n" + JSON.stringify({ title: "T", story: long }) + "\n```");
    expect(s?.title).toBe("T");
  });
  it("regroups one-sentence paragraphs", () => {
    const lines = Array.from({ length: 24 }, (_, i) => `Sentence number ${i}.`).join("\n\n");
    const out = regroupParagraphs(lines);
    expect(out.split("\n\n").length).toBe(6);
  });
  it("keeps real paragraphs", () => {
    const para = "This is a long paragraph with many words in it so the average stays high enough to keep it as is, really.";
    const text = Array.from({ length: 10 }, () => para).join("\n\n");
    expect(regroupParagraphs(text).split("\n\n").length).toBe(10);
  });
  it("rejects invalid JSON", () => expect(parseStory("hello")).toBeNull());
  it("checks language", () => {
    expect(matchesLanguage({ title: "Moon", story: long }, "en")).toBe(true);
    expect(matchesLanguage({ title: "Moon", story: long }, "ar")).toBe(false);
    expect(matchesLanguage({ title: "القمر", story: "ذهبت سارة إلى القمر ".repeat(20) }, "ar")).toBe(true);
  });
});
