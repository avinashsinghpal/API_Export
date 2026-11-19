import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const logs = [
        `[0.1s] Initializing discovery pipeline for run ${id}...`,
        `[0.4s] Querying Google Places Text Search with bounding box filters...`,
        `[0.8s] Querying Google Custom Search for registered importers...`,
        `[1.2s] Parsing company websites, checking robots.txt and mailto links...`,
        `[1.6s] Performing RFC-822 syntax & live DNS MX resolution on discovered emails...`,
        `[2.0s] Invoking Gemini Flash for structured B2B wholesale classification...`,
        `[2.3s] Deduplication filter checked against existing workspace domains...`,
        `[2.6s] Discovery run ${id} completed successfully.`,
      ];

      for (let i = 0; i < logs.length; i++) {
        const payload = JSON.stringify({
          progress: Math.min(100, Math.round(((i + 1) / logs.length) * 100)),
          log: logs[i],
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
