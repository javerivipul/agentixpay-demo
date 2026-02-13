import { randomBytes } from 'crypto';

export function generateId(prefix?: string): string {
  const id = randomBytes(12).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

export function generateApiKey(): string {
  return `agx_${randomBytes(24).toString('hex')}`;
}

export function generateApiSecret(): string {
  return randomBytes(32).toString('hex');
}
