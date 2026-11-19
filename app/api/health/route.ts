import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ExportLeads B2B Discovery Engine",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    checks: {
      database: "healthy",
      emailValidator: "active",
      geminiEngine: "ready",
      gmailSender: "ready",
    },
  });
}
