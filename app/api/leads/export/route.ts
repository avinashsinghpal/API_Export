import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || undefined;

    const { leads } = leadsStore.listLeads(auth.workspaceId, {
      filter,
      limit: 5000,
    });

    const headers = [
      "Company",
      "Contact Person",
      "Email",
      "Phone",
      "Website",
      "City",
      "State",
      "Country",
      "Buyer Type",
      "AI Classification",
      "Email Status",
      "Created At",
    ];

    const rows = leads.map((l) => [
      `"${l.company.replace(/"/g, '""')}"`,
      `"${(l.contactName || "").replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone || ""}"`,
      `"${l.website || ""}"`,
      `"${l.city || ""}"`,
      `"${l.state || ""}"`,
      `"${l.country}"`,
      `"${l.buyerType}"`,
      l.aiClass ? l.aiClass.toUpperCase() : "UNCLASSIFIED",
      l.emailStatus,
      l.createdAt,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ExportLeads_US_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return new Response("Unauthorized", { status: 401 });
  }
}
