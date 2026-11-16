// Simple in-memory limiter: max N requests per minute per key (default 10).
// (Each serverless instance keeps its own counters, so this is a best-effort guard.)
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

export function rateLimited(key: string, now = Date.now(), limit = 10): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return false;
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
