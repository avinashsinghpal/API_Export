import { describe, it, expect } from "vitest";
import { GeminiClassificationSchema } from "@/lib/validations";
import { classifyLeadWithGemini } from "@/lib/gemini";

describe("Gemini AI B2B Classification Engine", () => {
  it("validates structured JSON output conforming to GeminiClassificationSchema", () => {
    const validOutput = {
      classification: "b2b",
      buyerType: "wholesaler",
      confidence: 0.96,
      reasoning: "Established US wholesale LLC distributing meditation acoustics to showrooms.",
    };

    const parsed = GeminiClassificationSchema.parse(validOutput);
    expect(parsed.classification).toBe("b2b");
    expect(parsed.buyerType).toBe("wholesaler");
    expect(parsed.confidence).toBe(0.96);
  });

  it("rejects invalid confidence scores exceeding 1.0", () => {
    const invalidOutput = {
      classification: "b2b",
      buyerType: "importer",
      confidence: 1.5,
      reasoning: "Invalid score test",
    };

    expect(() => GeminiClassificationSchema.parse(invalidOutput)).toThrow();
  });

  it("classifies commercial showroom entities as B2B", async () => {
    const result = await classifyLeadWithGemini({
      company: "Austin Artisan Sound & Decor Showroom",
      website: "https://austinartisansound.com",
    });

    expect(result.classification).toBe("b2b");
    expect(result.buyerType).toBe("showroom");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("filters out personal consumer hobbyists to protect sender domain", async () => {
    const result = await classifyLeadWithGemini({
      company: "My Personal Meditation Blog & Fan Club",
      homepageText: "This is a personal collection of bells and hobby decor, not for sale.",
    });

    expect(result.classification).toBe("consumer");
    expect(result.buyerType).toBe("individual");
  });
});
