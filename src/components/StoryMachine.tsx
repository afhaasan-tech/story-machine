"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [storyLang, setStoryLang] = useState<Lang>("ar");
  const [copied, setCopied] = useState(false);
  const [voice, setVoice] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [voiceError, setVoiceError] = useState(false);
  const [features, setFeatures] = useState({ narration: false, dictation: false });
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micHeard, setMicHeard] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakAbort = useRef<AbortController | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const autoStop = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [voiceMissing, setVoiceMissing] = useState(false);

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
        setStoryLang(lang);
        setScreen("story");
        window.scrollTo({ top: 0 });
      }
    } catch {
      setError("network");
    } finally {
      setLoading(false);
    }
  }

  // ---------- Narration (listen to the story) ----------
  function stopSpeaking() {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = "";
      audioRef.current = null;
    }
    speakAbort.current?.abort();
    speakAbort.current = null;
    setVoice("idle");
  }

  // Fallback: the browser's own voices (free; quality depends on the device).
  function speakWithBrowser() {
    if (!story || !("speechSynthesis" in window)) {
      setVoiceMissing(true);
      setVoice("idle");
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = synth.getVoices();
    // Prefer the most natural voice the device offers (Edge "Natural", Google, Apple "Enhanced"/"Premium").
    const quality = (v: SpeechSynthesisVoice) =>
      (/natural|neural|online/i.test(v.name) ? 3 : 0) +
      (/google|enhanced|premium/i.test(v.name) ? 2 : 0) +
      (v.localService ? 0 : 1);
    const found = voices
      .filter((v) => v.lang.toLowerCase().startsWith(storyLang))
      .sort((a, b) => quality(b) - quality(a))[0];
    if (!found && storyLang === "ar" && voices.length > 0) {
      setVoiceMissing(true);
      setVoice("idle");
      return;
    }
    setVoiceMissing(false);
    const parts = [story.title, ...story.story.split(/\n+/)].filter((p) => p.trim());
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = found?.lang ?? (storyLang === "ar" ? "ar-SA" : "en-US");
      if (found) u.voice = found;
      u.rate = 0.85;
      if (i === parts.length - 1) {
        u.onend = () => setVoice("idle");
        u.onerror = () => setVoice("idle");
      }
      synth.speak(u);
    });
    setVoice("playing");
  }

  async function startNarration() {
    if (!story) return;
    setVoiceMissing(false);
    setVoiceError(false);
    if (!features.narration) {
      speakWithBrowser();
      return;
    }
    setVoice("loading");
    const ctrl = new AbortController();
    speakAbort.current = ctrl;
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${story.title}.\n\n${story.story}` }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      audio.onended = () => setVoice("idle");
      await audio.play();
      setVoice("playing");
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      // Quota used up or service busy: fall back to the browser voice.
      setVoiceError(true);
      speakWithBrowser();
    }
  }

  function togglePause() {
    const a = audioRef.current;
    if (a) {
      if (a.paused) {
        a.play();
        setVoice("playing");
      } else {
        a.pause();
        setVoice("paused");
      }
      return;
    }
    const synth = window.speechSynthesis;
    if (voice === "playing") {
      synth.pause();
      setVoice("paused");
    } else {
      synth.resume();
      setVoice("playing");
    }
  }

  useEffect(() => {
    if (screen !== "story" || loading) stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, loading]);
  useEffect(() => stopSpeaking, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    fetch("/api/features")
      .then((r) => r.json())
      .then((f) => setFeatures({ narration: !!f.narration, dictation: !!f.dictation }))
      .catch(() => {});
  }, []);

  // ---------- Dictation (say the spark out loud) ----------
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    setMicError(null);
    setMicHeard("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        clearTimeout(autoStop.current);
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob);
          fd.append("lang", lang);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMicError(typeof data.error === "string" ? data.error : "transcribe_failed");
          } else {
            setMicHeard(typeof data.text === "string" ? data.text : "");
            if (!data.name && !data.subject && !data.place) {
              setMicError("not_understood");
            } else {
              if (data.name) setName(data.name);
              if (data.subject) setSubject(data.subject);
              if (data.place) setPlace(data.place);
              setError(null);
            }
          }
        } catch {
          setMicError("network");
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
      autoStop.current = setTimeout(() => rec.state === "recording" && rec.stop(), 20_000);
    } catch {
      setMicError("mic_denied");
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
              {features.dictation && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    disabled={transcribing || loading}
                    aria-pressed={recording}
                    className={`${softBtn} ${recording ? "!border-moon !text-moon" : ""}`}
                  >
                    <span aria-hidden>{recording ? "⏹" : "🎤"}</span>{" "}
                    {transcribing ? t.transcribing : recording ? t.recording : t.sayIt}
                  </button>
                  <p className="mt-2 text-base text-lavender-300">{t.sayItHint}</p>
                  {micHeard && (
                    <p className="mt-2 text-base text-lavender-200">
                      {t.heard} “{micHeard}”
                    </p>
                  )}
                  {micError && (
                    <p role="alert" className="mt-2 text-base text-danger">
                      {t.errors[micError] ?? t.errors.transcribe_failed}
                    </p>
                  )}
                </div>
              )}

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
          <article
            className="animate-fade-in"
            lang={storyLang}
            dir={LANGS.find((l) => l.code === storyLang)!.dir}
          >
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
              <button
                type="button"
                disabled={voice === "loading"}
                onClick={voice === "idle" ? startNarration : togglePause}
                className={`${bigBtn} flex items-center gap-2`}
              >
                <span aria-hidden>{voice === "playing" ? "⏸" : "🔊"}</span>
                {voice === "idle" ? t.listen : voice === "loading" ? t.preparingVoice : voice === "playing" ? t.pause : t.resume}
              </button>
              {(voice === "playing" || voice === "paused") && (
                <button type="button" onClick={stopSpeaking} className={softBtn}>
                  ⏹ {t.stopListening}
                </button>
              )}
            </div>
            {voiceMissing && (
              <p role="status" className="mt-3 text-center text-lg text-lavender-200">
                {t.noVoice}
              </p>
            )}
            {voiceError && !voiceMissing && (
              <p role="status" className="mt-3 text-center text-base text-lavender-300">
                {t.voiceFallback}
              </p>
            )}

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={generate} disabled={loading} className={softBtn}>
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
