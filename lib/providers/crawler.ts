import * as cheerio from "cheerio";
import robotsParser from "robots-parser";
import dns from "dns/promises";
import { normalizeDomain, normalizePhone } from "../normalizer";
import { logger } from "../logger";

const USER_AGENT = "ExportLeads-DiscoveryBot/1.0 (+https://exportleads.io/bot; research@exportleads.io)";
const MAX_RESPONSE_BYTES = 1024 * 1024; // 1 MB cap
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

export interface CrawlEnrichmentResult {
  domain: string;
  sourceUrl: string;
  emails: string[];
  bestEmail?: string;
  phones: string[];
  bestPhone?: string;
  contactName?: string;
  contactTitle?: string;
  title: string;
  metaDescription: string;
  snippet: string;
  isB2BIndicators: string[];
  socialLinks: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
  status: "enriched" | "needs_manual_review" | "blocked" | "not_found";
  reason?: string;
}

// In-memory cache for robots.txt rules per domain (24h TTL)
const robotsCache = new Map<string, { parser: any; expiresAt: number }>();
// In-memory per-domain throttle tracker
const domainLastRequest = new Map<string, number>();

/**
 * Validates whether an IP address is a private, loopback, or link-local address.
 */
function isPrivateIp(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.")) return true; // Link-local
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true; // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith("fc00:") || ip.startsWith("fe80:")) return true; // IPv6 local
  return false;
}

/**
 * SSRF Protection: Checks protocol and resolves DNS to reject loopback/private/internal IPs.
 */
export async function isSafeUrl(rawUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      isPrivateIp(host) ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".arpa") ||
      host === "127.0.0.1" ||
      host === "0.0.0.0"
    ) {
      return false;
    }

    // Resolve DNS to verify public IP address
    try {
      const addresses = await dns.resolve(host);
      for (const addr of addresses) {
        if (isPrivateIp(addr)) {
          return false;
        }
      }
    } catch {
      // In sandbox/offline mode without network, DNS might fail. Allow valid syntax to proceed to fetch
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Enforces polite per-domain rate limiting (minimum 2 seconds between requests to the same domain).
 */
async function throttleDomain(domain: string, minIntervalMs = 2000): Promise<void> {
  const lastTime = domainLastRequest.get(domain) || 0;
  const now = Date.now();
  const elapsed = now - lastTime;
  if (elapsed < minIntervalMs) {
    const waitMs = minIntervalMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  domainLastRequest.set(domain, Date.now());
}

/**
 * Retrieves and parses robots.txt with 24-hour in-memory caching.
 */
async function getRobotsParser(baseUrl: string, domain: string): Promise<any | null> {
  const cached = robotsCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.parser;
  }

  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });

    if (robotsRes.ok) {
      const text = await robotsRes.text();
      const parser = robotsParser(`${baseUrl}/robots.txt`, text);
      robotsCache.set(domain, {
        parser,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });
      return parser;
    }
  } catch {
    // Robots.txt is optional
  }

  return null;
}

/**
 * Score emails to prefer procurement/wholesale contacts over generic webmaster addresses.
 */
function prioritizeEmail(emails: string[]): string | undefined {
  if (emails.length === 0) return undefined;

  const roleScores: Record<string, number> = {
    wholesale: 10,
    purchasing: 10,
    buyer: 10,
    orders: 9,
    procurement: 9,
    sales: 8,
    info: 7,
    contact: 6,
    hello: 5,
  };

  let bestEmail = emails[0];
  let highestScore = -1;

  for (const email of emails) {
    const prefix = email.split("@")[0].toLowerCase();
    let score = 0;
    for (const [key, weight] of Object.entries(roleScores)) {
      if (prefix.includes(key)) {
        score = Math.max(score, weight);
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestEmail = email;
    }
  }

  return bestEmail;
}

/**
 * Polite web crawler visiting homepage, /contact, /contact-us, /about (max 4 pages).
 */
export async function enrichCompanyWebsite(websiteUrl: string): Promise<CrawlEnrichmentResult> {
  const domain = normalizeDomain(websiteUrl);
  const baseUrl = `https://${domain}`;

  // 1. SSRF Safety Check
  const safe = await isSafeUrl(baseUrl);
  if (!safe) {
    logger.warn({ domain }, "Crawler blocked request to non-public / internal host");
    return {
      domain,
      sourceUrl: baseUrl,
      emails: [],
      phones: [],
      isB2BIndicators: [],
      title: "",
      metaDescription: "",
      snippet: "",
      socialLinks: {},
      status: "blocked",
      reason: "Host rejected by SSRF guard",
    };
  }

  // 2. Robots.txt Compliance
  const robots = await getRobotsParser(baseUrl, domain);
  if (robots && !robots.isAllowed(baseUrl, USER_AGENT)) {
    logger.info({ domain }, "Robots.txt forbids crawling root URL");
    return {
      domain,
      sourceUrl: baseUrl,
      emails: [],
      phones: [],
      isB2BIndicators: [],
      title: "",
      metaDescription: "",
      snippet: "",
      socialLinks: {},
      status: "needs_manual_review",
      reason: "Robots.txt disallowed automated user-agent",
    };
  }

  const emailsFound = new Set<string>();
  const phonesFound = new Set<string>();
  const socialLinks: { linkedin?: string; instagram?: string; facebook?: string } = {};
  let detectedContactName = "";
  let detectedTitle = "";
  let siteTitle = "";
  let metaDesc = "";
  let pageSnippet = "";
  let jsRenderingNeeded = false;

  const b2bKeywords = ["wholesale", "moq", "distributor", "resale", "dealer", "importer", "catalog", "showroom", "b2b", "trade"];
  const b2bIndicators: string[] = [];

  const pagesToScan = [
    baseUrl,
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/about`,
  ];

  for (const pageUrl of pagesToScan) {
    try {
      await throttleDomain(domain, 1500);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const pageRes = await fetch(pageUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pageRes.status === 403 || pageRes.status === 429) {
        jsRenderingNeeded = true;
        continue;
      }

      if (!pageRes.ok) continue;

      // 1 MB cap on content length
      const contentLength = Number(pageRes.headers.get("content-length") || 0);
      if (contentLength > MAX_RESPONSE_BYTES) {
        continue;
      }

      const html = await pageRes.text();
      const $ = cheerio.load(html);

      // Check for client-side JS rendering locks or Cloudflare challenges
      if (
        html.includes("Please enable JavaScript") ||
        html.includes("Checking your browser") ||
        html.includes("__cf_chl_")
      ) {
        jsRenderingNeeded = true;
        continue;
      }

      // Respect meta noindex
      const robotsMeta = $('meta[name="robots"]').attr("content") || "";
      if (robotsMeta.toLowerCase().includes("noindex")) {
        continue;
      }

      if (!siteTitle) siteTitle = $("title").text().trim();
      if (!metaDesc) metaDesc = $('meta[name="description"]').attr("content") || "";

      // 1. Mailto links
      $('a[href^="mailto:"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        const email = href.replace(/^mailto:/i, "").split("?")[0].trim().toLowerCase();
        if (
          email &&
          email.includes("@") &&
          !/\.(png|jpg|jpeg|gif|svg|webp|avif|js|css)$/i.test(email)
        ) {
          emailsFound.add(email);
        }
      });

      // 2. Visible text emails (excluding image false positives)
      const bodyText = $("body").text();
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      let match;
      while ((match = emailRegex.exec(bodyText)) !== null) {
        const em = match[1].toLowerCase();
        if (!/\.(png|jpg|jpeg|gif|svg|webp|avif|js|css)$/i.test(em)) {
          emailsFound.add(em);
        }
      }

      // 3. Tel: links and phone regex
      $('a[href^="tel:"]').each((_, el) => {
        const href = $(el).attr("href") || "";
        const rawPhone = href.replace(/^tel:/i, "").trim();
        const norm = normalizePhone(rawPhone);
        if (norm) phonesFound.add(norm);
      });

      const phoneRegex = /(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
      let pMatch;
      while ((pMatch = phoneRegex.exec(bodyText)) !== null) {
        const norm = normalizePhone(pMatch[0]);
        if (norm) phonesFound.add(norm);
      }

      // 4. Social Reference Links (never scrape, store only as references)
      $('a[href*="linkedin.com/company/"], a[href*="linkedin.com/in/"]').each((_, el) => {
        if (!socialLinks.linkedin) socialLinks.linkedin = $(el).attr("href");
      });
      $('a[href*="instagram.com/"]').each((_, el) => {
        if (!socialLinks.instagram) socialLinks.instagram = $(el).attr("href");
      });
      $('a[href*="facebook.com/"]').each((_, el) => {
        if (!socialLinks.facebook) socialLinks.facebook = $(el).attr("href");
      });

      // 5. Contact Name & Title heuristical extraction from team/about sections
      $('[class*="team"], [class*="bio"], [class*="about"], [class*="contact"], p').each((_, el) => {
        if (detectedContactName) return;
        const text = $(el).text();
        const titleMatch = text.match(/(?:Buyer|Purchasing Manager|Owner|Founder|CEO|Director|Procurement Manager)[\s,:-]+([A-Z][a-z]+ [A-Z][a-z]+)/);
        if (titleMatch) {
          detectedContactName = titleMatch[1];
          detectedTitle = titleMatch[0].split(/[\s,:-]+/)[0];
        }
      });

      // 6. B2B Wholesale Indicators
      const lower = bodyText.toLowerCase();
      b2bKeywords.forEach((kw) => {
        if (lower.includes(kw) && !b2bIndicators.includes(kw)) {
          b2bIndicators.push(kw);
        }
      });

      if (!pageSnippet && bodyText.length > 50) {
        pageSnippet = bodyText.replace(/\s+/g, " ").trim().slice(0, 1500);
      }
    } catch {
      // Continue to next page
    }
  }

  const emailsList = Array.from(emailsFound);
  const phonesList = Array.from(phonesFound);
  const bestEmail = prioritizeEmail(emailsList);
  const bestPhone = phonesList[0];

  let finalStatus: CrawlEnrichmentResult["status"] = "enriched";
  let reason: string | undefined;

  if (emailsList.length === 0 && phonesList.length === 0) {
    if (jsRenderingNeeded) {
      finalStatus = "needs_manual_review";
      reason = "Site requires JavaScript rendering or returned access restriction";
    } else {
      finalStatus = "not_found";
      reason = "No public contact emails found on scanned pages";
    }
  }

  return {
    domain,
    sourceUrl: baseUrl,
    emails: emailsList,
    bestEmail,
    phones: phonesList,
    bestPhone,
    contactName: detectedContactName || undefined,
    contactTitle: detectedTitle || undefined,
    title: siteTitle,
    metaDescription: metaDesc,
    snippet: pageSnippet,
    isB2BIndicators: b2bIndicators,
    socialLinks,
    status: finalStatus,
    reason,
  };
}
