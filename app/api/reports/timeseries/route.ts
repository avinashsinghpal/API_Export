import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { leads } = leadsStore.listLeads(auth.workspaceId, { limit: 10000 });

    if (leads.length === 0) {
      return NextResponse.json({
        timeseries: [
          { week: "W-3", discovered: 0, emailsSent: 0, replies: 0 },
          { week: "W-2", discovered: 0, emailsSent: 0, replies: 0 },
          { week: "W-1", discovered: 0, emailsSent: 0, replies: 0 },
          { week: "Current", discovered: 0, emailsSent: 0, replies: 0 },
        ],
      });
    }

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const buckets = [
      { week: "W-3", start: now - 4 * oneWeekMs, end: now - 3 * oneWeekMs, discovered: 0, emailsSent: 0, replies: 0 },
      { week: "W-2", start: now - 3 * oneWeekMs, end: now - 2 * oneWeekMs, discovered: 0, emailsSent: 0, replies: 0 },
      { week: "W-1", start: now - 2 * oneWeekMs, end: now - oneWeekMs, discovered: 0, emailsSent: 0, replies: 0 },
      { week: "Current", start: now - oneWeekMs, end: now + 86400000, discovered: 0, emailsSent: 0, replies: 0 },
    ];

    leads.forEach((l) => {
      const ts = new Date(l.createdAt).getTime();
      const bucket = buckets.find((b) => ts >= b.start && ts < b.end) || buckets[3];
      bucket.discovered++;
      if (l.emailStatus !== "not_sent") bucket.emailsSent++;
      if (l.emailStatus === "replied") bucket.replies++;
    });

    return NextResponse.json({
      timeseries: buckets.map((b) => ({
        week: b.week,
        discovered: b.discovered,
        emailsSent: b.emailsSent,
        replies: b.replies,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
