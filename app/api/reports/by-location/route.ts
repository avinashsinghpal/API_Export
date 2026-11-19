import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 5000 });

    const stateCounts: Record<string, number> = {};
    leads.forEach((l) => {
      const st = l.state || "Other";
      stateCounts[st] = (stateCounts[st] || 0) + 1;
    });

    const locations = Object.entries(stateCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([state, count]) => ({ state, count }));

    return NextResponse.json({ locations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
