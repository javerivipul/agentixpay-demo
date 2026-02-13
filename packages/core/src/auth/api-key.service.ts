import { createHash, randomBytes } from 'crypto';

export function generateApiKey(): string {
  return `agx_${randomBytes(24).toString('hex')}`;
}

export function generateApiSecret(): string {
  return randomBytes(32).toString('hex');
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function verifySecret(secret: string, hash: string): boolean {
  const computedHash = hashSecret(secret);
  return computedHash === hash;
}
