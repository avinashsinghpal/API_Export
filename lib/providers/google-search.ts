import { DiscoveryProvider } from "./types";
import { RawLead, DiscoverySearchInput } from "../validations";
import { logger } from "../logger";

export class GoogleSearchProvider implements DiscoveryProvider {
  public id = "google_search";
  public name = "Google Programmable Search (Custom Search JSON API)";

  public async *search(input: DiscoverySearchInput): AsyncIterable<RawLead> {
    const apiKey = process.env.GOOGLE_CSE_KEY || process.env.GOOGLE_PLACES_API_KEY;
    const cseId = process.env.GOOGLE_CSE_ID;
    const q = `"${input.product}" (importers OR wholesalers OR distributors OR showroom) "${input.country}" ${input.state || ""}`.trim();

    logger.info({ query: q, provider: this.id }, "Executing Google Custom Search web discovery");

    if (!apiKey || !cseId || apiKey.includes("demo") || apiKey.includes("your-google")) {
      logger.info({ provider: this.id }, "Google Programmable Search credentials not configured, skipping CSE source");
      return;
    }

    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(q)}&num=10`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items || []) {
          yield {
            company: item.title?.split("-")[0]?.split("|")[0]?.trim() || "Web Discovery Lead",
            website: item.link || "",
            city: input.city || "Austin",
            state: input.state || "Texas",
            country: input.country || "United States",
            source: "GOOGLE",
            sourceRef: item.snippet || item.link,
            buyerType: "DISTRIBUTOR",
            snippet: item.snippet,
          };
        }
      } else {
        const err = await res.text();
        logger.warn({ status: res.status, error: err }, "Google CSE request returned error");
      }
    } catch (err: any) {
      logger.error({ error: err.message, provider: this.id }, "Google CSE request failed");
    }
  }
}
