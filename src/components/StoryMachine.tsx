"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_MODEL, MODELS } from "@/config/models";
import type { Lang, Length } from "@/lib/prompt";
import { LANGS, translations } from "@/lib/translations";

type Story = { title: string; story: string };
type Screen = "start" | "story";

const STORAGE_KEY = "story-machine-lang";

// Fixed positions so server and client render the same stars.
const STARS = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 37 + 11) % 97,
  top: (i * 53 + 7) % 92,
  size: 3 + ((i * 7) % 4),
  delay: ((i * 13) % 30) / 10,
}));

function Stars() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle rounded-full bg-moon"
          style={{
            insetInlineStart: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function Moon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={className}>
      <path d="M40 8a24 24 0 1 0 16 42A19 19 0 0 1 40 8z" fill="#ffe08a" />
    </svg>
  );
}

const inputCls =
  "w-full rounded-2xl border-2 border-lavender-300/40 bg-night-800 px-4 py-3 text-lg text-ink placeholder:text-lavender-300/60 focus:border-moon";

export default function StoryMachine() {
  const [lang, setLang] = useState<Lang>("ar");
  const [screen, setScreen] = useState<Screen>("start");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [place, setPlace] = useState("");
  const [length, setLength] = useState<Length>("short");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [copied, setCopied] = useState(false);

  const t = translations[lang];
  const dir = useMemo(() => LANGS.find((l) => l.code === lang)!.dir, [lang]);

  // Restore saved language once.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ar" || saved === "en") setLang(saved);
    } catch {}
  }, []);

  // Keep <html> lang/dir in sync and remember the choice.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, [lang, dir]);

  async function generate() {
    if (!name.trim() || !subject.trim()) {
      setError("required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, name, subject, place, length, model }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "generation_failed");
      } else {
        setStory(data as Story);
        setScreen("story");
        window.scrollTo({ top: 0 });
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  }

  async function copyStory() {
    if (!story) return;
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.story}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const errorText = error ? (error === "required" ? t.required : (t.errors[error] ?? t.errors.generation_failed)) : null;
  const bigBtn =
    "rounded-full bg-moon px-8 py-4 text-xl font-bold text-moon-dark shadow-lg shadow-black/30 transition active:scale-95 hover:brightness-105 disabled:opacity-60";
  const softBtn =
    "rounded-full border-2 border-lavender-300/60 bg-night-800 px-6 py-3 text-lg font-bold text-lavender-200 transition active:scale-95 hover:bg-night-700 disabled:opacity-60";

  return (
    <div className="relative min-h-dvh">
      <Stars />

      <header className="relative z-10 mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Moon className="h-9 w-9 animate-float" />
          <span className="text-lg font-extrabold text-moon">{t.appName}</span>
        </div>
        <div role="group" aria-label={t.langToggleLabel} className="flex rounded-full bg-night-800 p-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              aria-pressed={lang === l.code}
              lang={l.code}
              className={`rounded-full px-4 py-1.5 text-base font-bold transition ${
                lang === l.code ? "bg-moon text-moon-dark" : "text-lavender-200 hover:bg-night-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-6">
        {screen === "start" && (
          <section className="animate-fade-in">
            <h1 className="text-center text-3xl font-extrabold leading-snug text-ink sm:text-4xl">{t.tagline}</h1>

            <form
              className="mt-8 space-y-5 rounded-3xl bg-night-700/70 p-5 shadow-xl shadow-black/20 backdrop-blur sm:p-7"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) generate();
              }}
            >
              <label className="block">
                <span className="mb-1 block text-start text-lg font-bold text-lavender-200">{t.nameLabel}</span>
                <input
                  className={inputCls}
                  value={name}
                  maxLength={30}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  autoComplete="off"
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-start text-lg font-bold text-lavender-200">{t.subjectLabel}</span>
                <input
                  className={inputCls}
                  value={subject}
                  maxLength={40}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t.subjectPlaceholder}
                  autoComplete="off"
                />
              </label>

              <div>
                <label className="block">
                  <span className="mb-1 block text-start text-lg font-bold text-lavender-200">
                    {t.placeLabel} <span className="text-base font-normal text-lavender-300">({t.placeHint})</span>
                  </span>
                  <input
                    className={inputCls}
                    value={place}
                    maxLength={50}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder={t.placePlaceholder}
                    autoComplete="off"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.chips.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPlace(c)}
                      className={`rounded-full border-2 px-4 py-1.5 text-base transition ${
                        place === c
                          ? "border-moon bg-moon text-moon-dark"
                          : "border-lavender-300/40 text-lavender-200 hover:bg-night-800"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset>
                <legend className="mb-1 block text-start text-lg font-bold text-lavender-200">{t.lengthLabel}</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["short", "medium"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={length === l}
                      onClick={() => setLength(l)}
                      className={`rounded-2xl border-2 px-3 py-3 text-lg font-bold transition ${
                        length === l
                          ? "border-moon bg-moon text-moon-dark"
                          : "border-lavender-300/40 text-lavender-200 hover:bg-night-800"
                      }`}
                    >
                      {t[l]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <details className="rounded-2xl border-2 border-lavender-300/20 px-4 py-2">
                <summary className="cursor-pointer text-start text-base font-bold text-lavender-300">
                  ⚙ {t.modelLabel}: {MODELS.find((m) => m.id === model)?.label}
                </summary>
                <select
                  aria-label={t.modelLabel}
                  className={`${inputCls} mt-3`}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </details>

              {errorText && (
                <div role="alert" className="rounded-2xl bg-night-900/70 p-4 text-start text-lg text-danger">
                  <p>{errorText}</p>
                  {error !== "required" && (
                    <button type="button" onClick={generate} disabled={loading} className={`${softBtn} mt-3`}>
                      {t.retry}
                    </button>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading} className={`${bigBtn} w-full`}>
                {loading ? t.loading : t.tell}
              </button>
              {loading && (
                <p role="status" className="animate-fade-in text-center text-xl text-moon">
                  ✨ {t.loading}
                </p>
              )}
            </form>
          </section>
        )}

        {screen === "story" && story && (
          <article className="animate-fade-in">
            <h1 className="text-center text-3xl font-extrabold leading-snug text-moon sm:text-4xl">{story.title}</h1>
            <div className="mt-6 space-y-5 rounded-3xl bg-night-700/70 p-5 text-start text-2xl leading-loose shadow-xl shadow-black/20 sm:p-8">
              {story.story
                .split(/\n\s*\n|\n/)
                .filter((p) => p.trim())
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>

            {errorText && (
              <p role="alert" className="mt-4 rounded-2xl bg-night-900/70 p-4 text-start text-lg text-danger">
                {errorText}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={generate} disabled={loading} className={bigBtn}>
                {loading ? t.loading : t.another}
              </button>
              <button type="button" onClick={() => setScreen("start")} disabled={loading} className={softBtn}>
                {t.change}
              </button>
              <button type="button" onClick={copyStory} className={softBtn}>
                {copied ? t.copied : t.copy}
              </button>
            </div>
            {loading && (
              <p role="status" className="animate-fade-in mt-4 text-center text-xl text-moon">
                ✨ {t.loading}
              </p>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
