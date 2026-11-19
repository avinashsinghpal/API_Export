import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const dbPath = path.resolve(process.cwd(), "data", "app.db");
    if (!existsSync(dbPath)) {
      return NextResponse.json({ error: "Database file not found." }, { status: 404 });
    }

    const fileBuffer = readFileSync(dbPath);
    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="exportleads-backup-${dateStr}.db"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
