import { describe, it, expect } from "vitest";
import { jaroWinklerSimilarity, isFuzzyDuplicate } from "@/lib/dedupe";

describe("Deduplication & Fuzzy Matching", () => {
  it("identifies identical company names with score 1.0", () => {
    expect(jaroWinklerSimilarity("Serenity Sound Wholesale", "Serenity Sound Wholesale")).toBe(1.0);
  });

  it("calculates high similarity for minor typo variants", () => {
    const score = jaroWinklerSimilarity("Sedona Mystic Hearth & Home", "Sedona Mystic Hearth & Home LLC");
    expect(score).toBeGreaterThan(0.92);
  });

  it("flags fuzzy duplicate within candidate array", () => {
    const existing = [
      "Serenity Sound & Decor Wholesale",
      "Sedona Mystic Hearth",
      "Pacific Holistic Imports",
    ];

    const result = isFuzzyDuplicate("Serenity Sound & Decor Wholesale LLC", existing);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedWith).toBe("Serenity Sound & Decor Wholesale");
  });

  it("does not flag genuinely distinct companies", () => {
    const existing = ["Serenity Sound Wholesale", "Sedona Mystic Hearth"];
    const result = isFuzzyDuplicate("Rocky Mountain Sound Therapy Co.", existing);
    expect(result.isDuplicate).toBe(false);
  });
});
