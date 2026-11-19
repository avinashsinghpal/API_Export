import { describe, it, expect } from "vitest";
import {
  normalizeDomain,
  normalizeCompanyName,
  normalizeEmail,
  normalizePhone,
  normalizeState,
  normalizeCountry,
} from "@/lib/normalizer";

describe("Normalizer utilities", () => {
  it("extracts canonical root domain from complex URLs", () => {
    expect(normalizeDomain("https://www.serenitysoundwholesale.com/catalog?item=7")).toBe(
      "serenitysoundwholesale.com"
    );
    expect(normalizeDomain("http://mystichome.co.uk/contact/")).toBe("mystichome.co.uk");
    expect(normalizeDomain("zenithlivingnyc.com:8080/path")).toBe("zenithlivingnyc.com");
  });

  it("normalizes company name whitespace and formatting", () => {
    expect(normalizeCompanyName('  "Aura   Crafts Exports" ')).toBe("Aura Crafts Exports");
  });

  it("normalizes emails to lowercase and trimmed", () => {
    expect(normalizeEmail("  BUYER@SerenityWholesale.COM  ")).toBe("buyer@serenitywholesale.com");
  });

  it("normalizes US phone numbers into E.164 format", () => {
    expect(normalizePhone("(512) 555-0142", "US")).toBe("+15125550142");
  });

  it("normalizes US state abbreviations to full state names", () => {
    expect(normalizeState("tx")).toBe("Texas");
    expect(normalizeState("CA")).toBe("California");
    expect(normalizeState("New York")).toBe("New York");
  });

  it("normalizes country codes to canonical names", () => {
    expect(normalizeCountry("usa")).toBe("United States");
    expect(normalizeCountry("US")).toBe("United States");
    expect(normalizeCountry("IN")).toBe("India");
  });
});
