# Story Machine · آلة الحكايات

A bilingual (Arabic / English) bedtime story website for children aged 3-7. A parent or child gives a "spark" (the child's name, a favorite animal or toy, and a place or mood) and an AI writes a gentle, complete bedtime story starring the child. Stories come from free [OpenRouter](https://openrouter.ai) models.

**Public URL:** _added after the first deploy (see the repository description)_

## Run it locally

```bash
npm install
cp .env.example .env.local   # on Windows: copy .env.example .env.local
# open .env.local and set OPENROUTER_API_KEY=your-key
npm run dev
```

Then open http://localhost:3000. The key is only read on the server (`src/app/api/story/route.ts`) and never reaches the browser. Never commit `.env.local`.

Other commands: `npm test` (unit tests), `npm run build` (production build). The scripts use webpack (`--webpack`) because Turbopack's PostCSS step crashes on some Windows setups.

## Change the models

Edit `src/config/models.ts`. It is the only list of models: the dropdown, the server allow-list and the fallback order all read from it. Every id **must end in `:free`** (a unit test checks this). The first entry is the default. If the chosen model fails or returns invalid output, the server automatically falls back to the next models in the list.

## Add a language

1. In `src/lib/prompt.ts`, add the code to `Lang` (for example `"fr"`).
2. In `src/lib/translations.ts`, add an entry to `LANGS` (code, label, `dir`) and a full dictionary in `translations`.
3. In `src/lib/validate.ts`, allow the new code, and in `src/lib/story.ts` extend `matchesLanguage` for its script.
4. Mention the language in the system prompt in `src/lib/prompt.ts`.

## Safety and limits

- Only models in the allow-list are accepted; anything else is rejected.
- Input is length-limited, restricted to letters, numbers and light punctuation, and screened for inappropriate words.
- Rate limit: 10 requests per minute per IP (in memory, per server instance).
- Output is capped at 3000 tokens per call.

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, `next/font` (Cairo for Arabic, Nunito for English). No database, accounts, voice or images.
