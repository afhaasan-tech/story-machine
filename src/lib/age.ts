export type AgeBand = "3-5" | "6-8" | "9-12";

export interface AgeProfile {
  band: AgeBand;
  /** Upper bound on words per story page. */
  maxWordsPerPage: number;
  /** Upper bound on pages in one story. */
  maxPages: number;
}

const PROFILES: Record<AgeBand, Omit<AgeProfile, "band">> = {
  "3-5": { maxWordsPerPage: 40, maxPages: 8 },
  "6-8": { maxWordsPerPage: 80, maxPages: 12 },
  "9-12": { maxWordsPerPage: 140, maxPages: 16 },
};

/** Maps a child's age in years to a content band. Throws outside 3..12. */
export function ageBand(age: number): AgeBand {
  if (!Number.isInteger(age) || age < 3 || age > 12) {
    throw new RangeError("Story Machine supports ages 3 to 12");
  }
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  return "9-12";
}

export function ageProfile(age: number): AgeProfile {
  const band = ageBand(age);
  return { band, ...PROFILES[band] };
}
