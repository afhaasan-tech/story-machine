import { describe, expect, it } from "vitest";
import { ageBand, ageProfile } from "./age";

describe("ageBand", () => {
  it("maps ages to bands at the edges", () => {
    expect(ageBand(3)).toBe("3-5");
    expect(ageBand(5)).toBe("3-5");
    expect(ageBand(6)).toBe("6-8");
    expect(ageBand(8)).toBe("6-8");
    expect(ageBand(9)).toBe("9-12");
    expect(ageBand(12)).toBe("9-12");
  });

  it("rejects unsupported or non-integer ages", () => {
    expect(() => ageBand(2)).toThrow(RangeError);
    expect(() => ageBand(13)).toThrow(RangeError);
    expect(() => ageBand(4.5)).toThrow(RangeError);
    expect(() => ageBand(Number.NaN)).toThrow(RangeError);
  });
});

describe("ageProfile", () => {
  it("gives younger children shorter pages", () => {
    expect(ageProfile(4).maxWordsPerPage).toBeLessThan(ageProfile(10).maxWordsPerPage);
  });
});
