import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { WorkspaceSettingsSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const settings = leadsStore.getSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const validated = WorkspaceSettingsSchema.parse(body);

    const updated = leadsStore.updateSettings(validated);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 400 });
  }
}
