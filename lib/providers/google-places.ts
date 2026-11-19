import { DiscoveryProvider } from "./types";
import { RawLead, DiscoverySearchInput } from "../validations";
import { logger } from "../logger";
import { getCachedQuery, setCachedQuery } from "../query-cache";
import { checkQuotaSafety, incrementQuotaUsage } from "../quota-manager";
import { prisma } from "../db";

export function buildTargetedQueries(input: DiscoverySearchInput): string[] {
  const product = input.product.trim();
  const location = [input.city, input.state, input.country].filter(Boolean).join(" ");
  const buyerTypes = input.buyerTypes && input.buyerTypes.length > 0
    ? input.buyerTypes
    : ["wholesaler", "importer", "showroom", "wellness store"];

  const queries: string[] = [];

  for (const bt of buyerTypes) {
    const typeLabel = bt.toLowerCase();
    queries.push(`${typeLabel} ${product} ${location}`.trim());
  }

  if (input.category && !queries.some((q) => q.includes(input.category!.toLowerCase()))) {
    queries.push(`${input.category} showroom ${location}`.trim());
  }

  return queries;
}

export class GooglePlacesProvider implements DiscoveryProvider {
  public id = "google_places";
  public name = "Google Places API (New)";

  public async *search(input: DiscoverySearchInput): AsyncIterable<RawLead> {
    // 1. Get real API key from environment or database setting
    let apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey || apiKey.length < 10 || apiKey.includes("your-google")) {
      try {
        const setting = await prisma.setting.findUnique({ where: { id: "default" } });
        if (setting?.googlePlacesApiKey) {
          apiKey = setting.googlePlacesApiKey;
        }
      } catch {}
    }

    if (!apiKey || apiKey.length < 10 || apiKey.includes("your-google")) {
      throw new Error(
        "Google Places API Key is missing. To fetch real buyers, please add your GOOGLE_PLACES_API_KEY in .env.local or enter it in the Settings section."
      );
    }

    const queries = buildTargetedQueries(input);

    logger.info(
      { queriesCount: queries.length, provider: this.id },
      "Executing real Google Places API search for buyers"
    );

    let totalYielded = 0;
    const maxLeads = input.resultCap || 20;

    for (const query of queries) {
      if (totalYielded >= maxLeads) break;

      // 2. Check 7-day Query Cache (avoids wasting Google API quota on duplicate searches)
      const cached = await getCachedQuery(query);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        logger.info({ query, count: cached.length }, "Serving cached real Google Places query results (7-day TTL)");
        for (const lead of cached) {
          if (totalYielded >= maxLeads) break;
          yield lead;
          totalYielded++;
        }
        continue;
      }

      // 3. Quota Safety Check
      const quotaCheck = await checkQuotaSafety("google_places", 1);
      if (!quotaCheck.allowed) {
        logger.warn({ message: quotaCheck.message }, "Halting search due to quota safety limit");
        throw new Error(quotaCheck.message);
      }

      // 4. Live Google Places (New) Text Search HTTP Request
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.websiteUri,places.nationalPhoneNumber,places.formattedAddress,places.location,places.types,places.businessStatus",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: Math.min(maxLeads - totalYielded, 20),
        }),
      });

      await incrementQuotaUsage("google_places", 1);

      if (!response.ok) {
        const errBody = await response.text();
        logger.error({ status: response.status, body: errBody }, "Google Places API returned error");
        throw new Error(`Google Places API error (${response.status}): ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const rawPlaces = data.places || [];
      const queryLeads: RawLead[] = [];

      for (const place of rawPlaces) {
        // Skip permanently closed businesses
        if (place.businessStatus === "CLOSED_PERMANENTLY") {
          continue;
        }

        // Infer buyer type based on place categories
        let inferredBuyerType: any = "WHOLESALER";
        const types = place.types || [];
        if (types.includes("wholesaler")) inferredBuyerType = "WHOLESALER";
        else if (types.includes("furniture_store") || types.includes("home_goods_store")) inferredBuyerType = "SHOWROOM";
        else if (types.includes("store")) inferredBuyerType = "RETAILER";

        const lead: RawLead = {
          company: place.displayName?.text || "Showroom Business",
          website: place.websiteUri || "",
          phone: place.nationalPhoneNumber || "",
          address: place.formattedAddress || "",
          city: input.city || "Austin",
          state: input.state || "Texas",
          country: input.country || "United States",
          source: "GOOGLE_PLACES",
          sourceRef: place.id ? `places:${place.id}` : `query:${query}`,
          buyerType: inferredBuyerType,
        };

        queryLeads.push(lead);
        yield lead;
        totalYielded++;
        if (totalYielded >= maxLeads) break;
      }

      // Store real results into 7-day cache
      if (queryLeads.length > 0) {
        await setCachedQuery(query, queryLeads);
      }
    }
  }
}
