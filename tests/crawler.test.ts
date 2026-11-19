import { describe, it, expect } from "vitest";
import { isSafeUrl } from "@/lib/providers/crawler";
import * as cheerio from "cheerio";

describe("Polite Website Crawler & Extraction Engine", () => {
  it("blocks dangerous SSRF private and loopback targets", async () => {
    expect(await isSafeUrl("http://localhost:3000")).toBe(false);
    expect(await isSafeUrl("http://127.0.0.1/admin")).toBe(false);
    expect(await isSafeUrl("http://192.168.1.50/secret")).toBe(false);
    expect(await isSafeUrl("ftp://files.example.com")).toBe(false);
    expect(await isSafeUrl("http://internal-service.local")).toBe(false);
  });

  it("extracts mailto links and filters out image false positives", () => {
    const html = `
      <html>
        <body>
          <a href="mailto:purchasing@aurawholesale.com">Contact Wholesale Team</a>
          <a href="mailto:logo-icon@2x.png">Invalid Image</a>
          <p>For custom retail orders email us at buyer@aurawholesale.com or call (512) 555-0199.</p>
          <img src="banner.jpg" alt="test@domain.com.jpg" />
        </body>
      </html>
    `;

    const $ = cheerio.load(html);
    const emails: string[] = [];

    $('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
      if (email.includes("@") && !/\.(png|jpg|jpeg|gif|svg)$/i.test(email)) {
        emails.push(email);
      }
    });

    const bodyText = $("body").text();
    const regex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let m;
    while ((m = regex.exec(bodyText)) !== null) {
      const em = m[1].toLowerCase();
      if (!/\.(png|jpg|jpeg|gif|svg)$/i.test(em)) {
        emails.push(em);
      }
    }

    expect(emails).toContain("purchasing@aurawholesale.com");
    expect(emails).toContain("buyer@aurawholesale.com");
    expect(emails.some((e) => e.includes(".png"))).toBe(false);
  });
});
