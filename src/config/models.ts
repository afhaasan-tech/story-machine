// The ONLY place to change which models the site offers.
// Every id MUST end in ":free". The API route rejects anything not listed here.
export type StoryModel = { id: string; label: string };

export const MODELS: StoryModel[] = [
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra" },
  { id: "inclusionai/ling-3.2-flash:free", label: "Ling 3.2 Flash" },
];

export const DEFAULT_MODEL = MODELS[0].id;

export function isAllowedModel(id: unknown): id is string {
  return typeof id === "string" && MODELS.some((m) => m.id === id);
}
