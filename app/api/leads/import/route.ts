import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";
import { normalizeDomain, normalizeEmail, normalizePhone } from "@/lib/normalizer";
import { validateEmailHygiene } from "@/lib/dns";
import { classifyLeadWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    const text = await file.text();
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    const rows: any[] = parseResult.data;
    let importedCount = 0;
    let duplicatesCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const company = row.Company || row.company || row["Company Name"] || row.name;
      const email = row.Email || row.email || row["Contact Email"];
      const website = row.Website || row.website || row.URL || row.url || "";
      const contactName = row.Contact || row.contact || row["Contact Name"] || row.Person || "";
      const phone = row.Phone || row.phone || row.Telephone || "";
      const city = row.City || row.city || "Austin";
      const state = row.State || row.state || "Texas";

      if (!company || !email) {
        errors.push(`Row ${i + 1}: Missing required company name or email.`);
        continue;
      }

      const domain = normalizeDomain(website || email.split("@")[1]);
      const cleanEmail = normalizeEmail(email);

      // Deduplication check
      const dup = leadsStore.findDuplicate(auth.workspaceId, cleanEmail, domain);
      if (dup) {
        duplicatesCount++;
        continue;
      }

      // Email hygiene check
      const hygiene = await validateEmailHygiene(cleanEmail);

      // AI Classification
      const ai = await classifyLeadWithGemini({ company, website });

      const res = leadsStore.createLead(auth.workspaceId, {
        company,
        website: website ? (website.startsWith("http") ? website : `https://${website}`) : `https://${domain}`,
        contactName: contactName || "Purchasing Team",
        email: cleanEmail,
        phone: normalizePhone(phone),
        city,
        state,
        country: "United States",
        source: "IMPORT_CSV",
        buyerType: ai.buyerType.toUpperCase() as any,
        emailValid: hygiene.isValid,
        emailValidationReason: hygiene.reason,
        aiClass: ai.classification === "unknown" ? null : ai.classification,
        aiConfidence: ai.confidence,
        aiReasoning: ai.reasoning,
        emailStatus: "not_sent",
      });

      if (res.lead) {
        importedCount++;
      } else if (res.duplicate) {
        duplicatesCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      duplicatesCount,
      errors,
      message: `Successfully imported ${importedCount} leads. Blocked ${duplicatesCount} duplicates.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to parse import file" }, { status: 400 });
  }
}
