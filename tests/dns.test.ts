import { describe, it, expect, vi, beforeEach } from "vitest";
import dns from "dns/promises";
import { validateEmailHygiene } from "@/lib/dns";

describe("Email Hygiene & DNS Validation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid RFC syntax", async () => {
    const res = await validateEmailHygiene("fake-email@@syntax-error..com");
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe("syntax_invalid");
  });

  it("rejects disposable domains", async () => {
    const res = await validateEmailHygiene("tester@tempmail.com");
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe("disposable_domain");
  });

  it("blocks hard-bounce role prefixes like noreply and postmaster", async () => {
    const res = await validateEmailHygiene("noreply@example.com");
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe("role_based_rejected");
  });

  it("allows flagged deliverable roles like info@ and purchasing@ when MX resolves", async () => {
    // Mock resolveMx so test passes in isolated/offline environments
    vi.spyOn(dns, "resolveMx").mockResolvedValue([
      { exchange: "smtp.google.com", priority: 10 },
    ]);

    const res = await validateEmailHygiene("info@google.com");
    expect(res.isValid).toBe(true);
    expect(res.isRole).toBe(true);
    expect(res.status).toBe("risky");
    expect(res.hasMxRecord).toBe(true);
  });

  it("marks domains with no MX records as invalid", async () => {
    vi.spyOn(dns, "resolveMx").mockRejectedValue(new Error("ENOTFOUND"));

    const res = await validateEmailHygiene("buyer@nonexistentdomain12345.com");
    expect(res.isValid).toBe(false);
    expect(res.status).toBe("invalid");
    expect(res.reason).toBe("no_mx_record");
  });
});
