import { describe, it, expect } from "vitest";
import { buildTargetedQueries } from "@/lib/providers/google-places";

describe("Google Places Targeted Query Builder", () => {
  it("builds multiple targeted search strings from buyer type chips", () => {
    const queries = buildTargetedQueries({
      product: "Singing Bowls",
      category: "Home Decor",
      country: "United States",
      state: "Texas",
      city: "Austin",
      buyerTypes: ["Wholesaler", "Showroom", "Importer"],
      providers: ["google_places"],
      resultCap: 20,
    });

    expect(queries.length).toBeGreaterThanOrEqual(3);
    expect(queries).toContain("wholesaler Singing Bowls Austin Texas United States");
    expect(queries).toContain("showroom Singing Bowls Austin Texas United States");
    expect(queries).toContain("importer Singing Bowls Austin Texas United States");
    expect(queries.some((q) => q.includes("Home Decor showroom"))).toBe(true);
  });

  it("handles missing city or state gracefully", () => {
    const queries = buildTargetedQueries({
      product: "Tibetan Bells",
      country: "United States",
      buyerTypes: ["Distributor"],
      providers: ["google_places"],
      resultCap: 10,
    });

    expect(queries).toContain("distributor Tibetan Bells United States");
  });
});
