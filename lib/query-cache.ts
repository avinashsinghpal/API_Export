import fs from "fs";
import path from "path";
import crypto from "crypto";

interface CacheEntry {
  queryHash: string;
  queryText: string;
  data: any;
  createdAt: number;
  expiresAt: number;
}

const CACHE_FILE = path.resolve(process.cwd(), "data", "query-cache.json");
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getHash(text: string): string {
  return crypto.createHash("sha256").update(text.toLowerCase().trim()).digest("hex");
}

function readCacheMap(): Map<string, CacheEntry> {
  const map = new Map<string, CacheEntry>();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      const list: CacheEntry[] = JSON.parse(raw);
      const now = Date.now();
      for (const item of list) {
        if (item.expiresAt > now) {
          map.set(item.queryHash, item);
        }
      }
    }
  } catch {
    // If invalid JSON, start fresh
  }
  return map;
}

function writeCacheMap(map: Map<string, CacheEntry>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write query cache:", err);
  }
}

export async function getCachedQuery(queryText: string): Promise<any | null> {
  const hash = getHash(queryText);
  const cache = readCacheMap();
  const entry = cache.get(hash);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  return null;
}

export async function setCachedQuery(queryText: string, data: any): Promise<void> {
  const hash = getHash(queryText);
  const cache = readCacheMap();
  const now = Date.now();
  cache.set(hash, {
    queryHash: hash,
    queryText,
    data,
    createdAt: now,
    expiresAt: now + TTL_MS,
  });
  writeCacheMap(cache);
}

export function clearExpiredCache(): void {
  const cache = readCacheMap();
  writeCacheMap(cache);
}
