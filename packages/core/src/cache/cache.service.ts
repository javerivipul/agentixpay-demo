import { redis } from './redis';

const DEFAULT_TTL = 300; // 5 minutes

function tenantKey(tenantId: string, key: string): string {
  return `agx:${tenantId}:${key}`;
}

export async function cacheGet<T>(tenantId: string, key: string): Promise<T | null> {
  const raw = await redis.get(tenantKey(tenantId, key));
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function cacheSet(
  tenantId: string,
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  await redis.set(tenantKey(tenantId, key), JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(tenantId: string, key: string): Promise<void> {
  await redis.del(tenantKey(tenantId, key));
}

export async function cacheInvalidatePrefix(tenantId: string, prefix: string): Promise<void> {
  const pattern = tenantKey(tenantId, `${prefix}*`);
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
