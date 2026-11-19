import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { PIPELINE_WEEKLY_TREND } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    return NextResponse.json({ timeseries: PIPELINE_WEEKLY_TREND });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
