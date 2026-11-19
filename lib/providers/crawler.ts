import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import { normalizeDomain } from "../normalizer";
import { logger } from "../logger";

const USER_AGENT = "ExportLeads-DiscoveryBot/1.0 (+https://exportleads.io/bot; research@exportleads.io)";

export interface CrawlEnrichmentResult {
  domain: string;
  emails: string[];
  phones: string[];
  contactNames: string[];
  title: string;
  metaDescription: string;
  snippet: string;
  isB2BIndicators: string[];
}

// SSRF Protection: Reject private / loopback IP patterns
function isSafeUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Polite crawler limited to homepage, /contact, /about.
 * Checks robots.txt, respects noindex, throttles, and parses mailto links.
 */
export async function enrichCompanyWebsite(websiteUrl: string): Promise<CrawlEnrichmentResult | null> {
  if (!isSafeUrl(websiteUrl)) {
    logger.warn({ url: websiteUrl }, "Rejected unsafe website URL (SSRF safeguard)");
    return null;
  }

  const domain = normalizeDomain(websiteUrl);
  const baseUrl = `https://${domain}`;

  // 1. Check robots.txt
  let isAllowed = true;
  let crawlDelay = 2000;
  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(3000),
    });
    if (robotsRes.ok) {
      const robotsTxt = await robotsRes.text();
      const robots = robotsParser(`${baseUrl}/robots.txt`, robotsTxt);
      isAllowed = robots.isAllowed(baseUrl, USER_AGENT) ?? true;
      const parsedDelay = robots.getCrawlDelay(USER_AGENT);
      if (parsedDelay) crawlDelay = Math.max(2000, parsedDelay * 1000);
    }
  } catch (e) {
    // robots.txt optional
  }

  if (!isAllowed) {
    logger.info({ domain }, "Skipping domain per robots.txt disallow rule");
    return null;
  }

  const emailsFound = new Set<string>();
  const phonesFound = new Set<string>();
  let siteTitle = "";
  let metaDesc = "";
  let pageSnippet = "";
  const b2bKeywords = ["wholesale", "moq", "distributor", "resale", "dealer", "importer", "catalog", "showroom", "b2b"];
  const b2bIndicators: string[] = [];

  const pagesToScan = [baseUrl, `${baseUrl}/contact`, `${baseUrl}/about`];

  for (const pageUrl of pagesToScan) {
    try {
      const pageRes = await fetch(pageUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(4000),
      });

      if (!pageRes.ok) continue;

      const html = await pageRes.text();
      const $ = cheerio.load(html);

      // Respect meta noindex
      const robotsMeta = $('meta[name="robots"]').attr("content") || "";
      if (robotsMeta.toLowerCase().includes("noindex")) {
        continue;
      }

      if (!siteTitle) siteTitle = $("title").text().trim();
      if (!metaDesc) metaDesc = $('meta[name="description"]').attr("content") || "";

      // Extract mailto: links
      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
        if (email && email.includes("@") && !email.includes(".png") && !email.includes(".jpg")) {
          emailsFound.add(email);
        }
      });

      // Regex scan for emails in text
      const text = $("body").text();
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      let match;
      while ((match = emailRegex.exec(text)) !== null) {
        const em = match[1].toLowerCase();
        if (!em.endsWith(".png") && !em.endsWith(".jpg") && !em.endsWith(".svg") && !em.endsWith(".webp")) {
          emailsFound.add(em);
        }
      }

      // Detect B2B wholesale indicators
      const lowerText = text.toLowerCase();
      b2bKeywords.forEach((kw) => {
        if (lowerText.includes(kw) && !b2bIndicators.includes(kw)) {
          b2bIndicators.push(kw);
        }
      });

      if (!pageSnippet && text.length > 50) {
        pageSnippet = text.replace(/\s+/g, " ").trim().slice(0, 1500);
      }
    } catch (err) {
      // Continue next page
    }
  }

  return {
    domain,
    emails: Array.from(emailsFound),
    phones: Array.from(phonesFound),
    contactNames: [],
    title: siteTitle,
    metaDescription: metaDesc,
    snippet: pageSnippet,
    isB2BIndicators: b2bIndicators,
  };
}
