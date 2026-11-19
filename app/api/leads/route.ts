import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { CreateLeadSchema, UpdateLeadSchema } from "@/lib/validations";
import { leadsStore } from "@/lib/leads-store";
import { validateEmailHygiene } from "@/lib/dns";
import { classifyLeadWithGemini } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || undefined;
    const filter = searchParams.get("filter") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = leadsStore.listLeads(auth.workspaceId, {
      search,
      filter,
      limit,
      offset,
    });

    return NextResponse.json({
      leads: result.leads,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      duplicatesBlocked: leadsStore.getDuplicatesBlockedCount(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const validated = CreateLeadSchema.parse(body);

    // Validate email hygiene
    const hygiene = await validateEmailHygiene(validated.email);

    // AI Classification
    const classification = await classifyLeadWithGemini({
      company: validated.company,
      website: validated.website,
    });

    const result = leadsStore.createLead(auth.workspaceId, {
      ...validated,
      emailValid: hygiene.isValid,
      emailValidationReason: hygiene.reason,
      aiClass: classification.classification === "unknown" ? null : classification.classification,
      aiConfidence: classification.confidence,
      aiReasoning: classification.reasoning,
    });

    if (result.duplicate) {
      return NextResponse.json({ error: result.reason, duplicate: true }, { status: 409 });
    }

    return NextResponse.json({ lead: result.lead }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create lead" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const updated = leadsStore.updateLead(id, auth.workspaceId, updates);
    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const count = leadsStore.deleteLeads([id], auth.workspaceId);
    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
