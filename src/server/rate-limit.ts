import "server-only";

/**
 * Limite simples em memória (um único servidor no EC2). Com mais de uma
 * instância, troque por um contador compartilhado (ex.: no próprio banco).
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  entry.count += 1;
  return entry.count > limit ? { ok: false, retryAfterMs: entry.resetAt - now } : { ok: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string) {
  hits.delete(key);
}
