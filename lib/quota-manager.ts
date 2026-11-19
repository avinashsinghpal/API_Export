import { prisma } from "./db";

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // e.g. "2026-11"
}

export async function getMonthlyLimit(provider = "google_places"): Promise<number> {
  try {
    const setting = await prisma.setting.findUnique({ where: { id: "default" } });
    if (setting?.monthlyPlacesLimit) {
      return setting.monthlyPlacesLimit;
    }
  } catch {
    // Graceful fallback to env var
  }
  return parseInt(process.env.MONTHLY_PLACES_REQUEST_LIMIT || "100", 10);
}

export async function getQuotaStatus(provider = "google_places"): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetDate: string;
}> {
  const month = getCurrentMonth();
  const limit = await getMonthlyLimit(provider);
  let current = 0;

  try {
    const record = await prisma.apiUsage.findUnique({
      where: {
        provider_month: {
          provider,
          month,
        },
      },
    });
    if (record) {
      current = record.requestCount;
    }
  } catch {
    // If DB check fails, default to 0
  }

  // Next month calculation
  const [year, m] = month.split("-").map(Number);
  const nextMonthDate = new Date(year, m, 1).toISOString().split("T")[0];

  return {
    current,
    limit,
    remaining: Math.max(0, limit - current),
    resetDate: nextMonthDate,
  };
}

export async function checkQuotaSafety(
  provider = "google_places",
  neededRequests = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number; message?: string }> {
  const status = await getQuotaStatus(provider);

  if (status.current + neededRequests > status.limit) {
    return {
      allowed: false,
      current: status.current,
      limit: status.limit,
      remaining: status.remaining,
      message: `Monthly Places API quota safety reached: ${status.current}/${status.limit} requests used. Requested ${neededRequests} additional calls. Increase limit in Settings or retry next month (${status.resetDate}).`,
    };
  }

  return {
    allowed: true,
    current: status.current,
    limit: status.limit,
    remaining: status.remaining,
  };
}

export async function incrementQuotaUsage(provider = "google_places", count = 1): Promise<number> {
  const month = getCurrentMonth();
  try {
    const updated = await prisma.apiUsage.upsert({
      where: {
        provider_month: {
          provider,
          month,
        },
      },
      update: {
        requestCount: { increment: count },
      },
      create: {
        provider,
        month,
        requestCount: count,
      },
    });
    return updated.requestCount;
  } catch (err) {
    console.error("Failed to increment quota in SQLite:", err);
    return count;
  }
}
