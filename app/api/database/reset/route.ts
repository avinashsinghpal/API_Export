import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadsStore } from "@/lib/leads-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body; // "clear" or "reset_seed"

    // Clear tables in SQLite
    await prisma.lead.deleteMany();
    await prisma.runLog.deleteMany();
    await prisma.discoveryRun.deleteMany();
    await prisma.activityLog.deleteMany();

    // Reset leadsStore
    leadsStore.resetStore();

    return NextResponse.json({
      success: true,
      message: action === "reset_seed" ? "Database reset to initial demo leads." : "All local data deleted successfully.",
      leadsCount: await prisma.lead.count(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
