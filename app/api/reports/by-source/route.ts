import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 5000 });

    const sourceStats: Record<string, { total: number; sent: number; replied: number }> = {
      Google: { total: 0, sent: 0, replied: 0 },
      LinkedIn: { total: 0, sent: 0, replied: 0 },
      Directories: { total: 0, sent: 0, replied: 0 },
      Websites: { total: 0, sent: 0, replied: 0 },
      Facebook: { total: 0, sent: 0, replied: 0 },
    };

    leads.forEach((l) => {
      let key = "Google";
      const s = l.source.toLowerCase();
      if (s.includes("linkedin") || s.includes("apollo")) key = "LinkedIn";
      else if (s.includes("directory") || s.includes("import_csv")) key = "Directories";
      else if (s.includes("website")) key = "Websites";
      else if (s.includes("facebook")) key = "Facebook";

      sourceStats[key].total += 1;
      if (l.emailStatus !== "not_sent") {
        sourceStats[key].sent += 1;
        if (l.emailStatus === "replied") {
          sourceStats[key].replied += 1;
        }
      }
    });

    const sources = Object.entries(sourceStats).map(([name, s]) => ({
      name,
      count: s.total,
      sent: s.sent,
      replied: s.replied,
      replyRate: s.sent > 0 ? Math.round((s.replied / s.sent) * 100) : 0,
      percentage: leads.length > 0 ? Math.round((s.total / leads.length) * 100) : 0,
    }));

    return NextResponse.json({ sources });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
