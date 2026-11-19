import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadsStore } from "@/lib/leads-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check Prisma first
    const run = await prisma.discoveryRun.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { ts: "asc" },
        },
      },
    });

    if (run) {
      return NextResponse.json({ run });
    }

    // Check memory store fallback
    const memRun = leadsStore.getDiscoveryRun(id);
    if (memRun) {
      return NextResponse.json({ run: memRun });
    }

    return NextResponse.json({ error: "Discovery run not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
