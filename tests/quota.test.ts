import { describe, it, expect } from "vitest";
import { getCurrentMonth } from "@/lib/quota-manager";

describe("Monthly API Quota Counter & Cache", () => {
  it("formats current month as YYYY-MM", () => {
    const month = getCurrentMonth();
    expect(month).toMatch(/^\d{4}-\d{2}$/);
    const now = new Date();
    const expectedYear = now.getFullYear();
    expect(month.startsWith(expectedYear.toString())).toBe(true);
  });
});
