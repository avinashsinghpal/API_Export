import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ProviderCredentialInputSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { encryptSecret } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    const hasPlacesKey = Boolean(placesKey && placesKey.length > 10 && !placesKey.includes("your-google"));

    const geminiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = Boolean(geminiKey && geminiKey.length > 10 && !geminiKey.includes("your-gemini"));

    const providers = [
      {
        id: "google_places",
        name: "Google Places API (New)",
        hasKey: hasPlacesKey,
        maskedKey: hasPlacesKey ? `${placesKey?.slice(0, 6)}••••••••${placesKey?.slice(-4)}` : "",
        isActive: hasPlacesKey,
        monthlyBudget: parseInt(process.env.MONTHLY_PLACES_REQUEST_LIMIT || "100", 10),
        creditsUsed: 8,
      },
      {
        id: "gemini",
        name: "Google Gemini 1.5 Flash",
        hasKey: hasGeminiKey,
        maskedKey: hasGeminiKey ? `${geminiKey?.slice(0, 6)}••••••••${geminiKey?.slice(-4)}` : "",
        isActive: hasGeminiKey,
        monthlyBudget: 50,
        creditsUsed: 12,
      },
      {
        id: "crawler",
        name: "Polite Website Crawler (Cheerio)",
        hasKey: true,
        maskedKey: "Local Cheerio Engine",
        isActive: true,
        monthlyBudget: 1000,
        creditsUsed: 36,
      },
      {
        id: "dns_validator",
        name: "DNS MX & RFC Email Hygiene",
        hasKey: true,
        maskedKey: "Local Node.js DNS Resolver",
        isActive: true,
        monthlyBudget: 5000,
        creditsUsed: 36,
      },
      {
        id: "apollo",
        name: "Apollo.io API (Optional)",
        hasKey: false,
        maskedKey: "",
        isActive: false,
        monthlyBudget: 100,
        creditsUsed: 0,
      },
    ];

    return NextResponse.json({ providers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const input = ProviderCredentialInputSchema.parse(body);

    const encryptedKey = input.apiKey ? encryptSecret(input.apiKey) : undefined;
    const encryptedSecret = input.apiSecret ? encryptSecret(input.apiSecret) : undefined;

    leadsStore.saveCredential(input.provider, {
      apiKey: encryptedKey,
      apiSecret: encryptedSecret,
      isActive: input.isActive,
      budget: input.monthlyCreditBudget,
    });

    return NextResponse.json({
      success: true,
      message: `Updated and encrypted credentials for ${input.provider}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update integration" }, { status: 400 });
  }
}
