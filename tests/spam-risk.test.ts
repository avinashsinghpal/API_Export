import { describe, it, expect } from "vitest";
import { calculateSpamRisk, mergePersonalizationTokens } from "@/lib/gmail";

describe("Spam Risk & Personalization Engine", () => {
  it("computes low spam risk for compliant B2B outreach", () => {
    const evalResult = calculateSpamRisk({
      subject: "Wholesale Singing Bowls Collection for Serenity Sound",
      body: "Dear Marcus,\n\nWe are direct manufacturers of handcrafted 7-chakra singing bowls.\n\nBest regards,\nAvinash",
      hasAttachment: true,
      attachmentSizeMB: 2.4,
      hasUnsubscribe: true,
    });

    expect(evalResult.level).toBe("Low");
    expect(evalResult.score).toBeLessThan(35);
  });

  it("flags spam risk for high trigger words and missing unsubscribe", () => {
    const evalResult = calculateSpamRisk({
      subject: "ACT NOW 100% FREE GUARANTEE WINNER",
      body: "Make money fast with no obligation!",
      hasAttachment: true,
      attachmentSizeMB: 6.5,
      hasUnsubscribe: false,
    });

    expect(evalResult.level).toBe("High");
    expect(evalResult.score).toBeGreaterThan(60);
    expect(evalResult.flags.length).toBeGreaterThan(2);
  });

  it("replaces merge tokens and detects unresolved variables", () => {
    const template = "Hello {{contact_name}} at {{company_name}}, review our {{product}} catalog.";
    const { merged, unresolved } = mergePersonalizationTokens(template, {
      company_name: "Pacific Imports",
      contact_name: "David Chen",
      product: "Singing Bowls",
      country: "US",
      sender_name: "Avinash",
    });

    expect(merged).toBe("Hello David Chen at Pacific Imports, review our Singing Bowls catalog.");
    expect(unresolved.length).toBe(0);
  });

  it("flags unresolved custom variables", () => {
    const template = "Dear {{contact_name}}, your discount code is {{discount_rate}}.";
    const { unresolved } = mergePersonalizationTokens(template, {
      company_name: "Pacific Imports",
      contact_name: "David Chen",
      product: "Singing Bowls",
      country: "US",
      sender_name: "Avinash",
    });

    expect(unresolved).toContain("{{discount_rate}}");
  });
});
