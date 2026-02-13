/**
 * Generate a new tenant with API credentials.
 *
 * Usage: npx tsx scripts/generate-api-key.ts [name] [email] [platform]
 *
 * Example:
 *   npx tsx scripts/generate-api-key.ts "My Store" "me@example.com" SHOPIFY
 */

import { PrismaClient, Platform } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

const prisma = new PrismaClient();

const name = process.argv[2] || 'Test Tenant';
const email = process.argv[3] || `test-${Date.now()}@agentix.dev`;
const platform = (process.argv[4] as Platform) || 'CUSTOM';

async function main() {
  const apiKey = `agx_${randomBytes(24).toString('hex')}`;
  const apiSecret = randomBytes(32).toString('hex');
  const apiSecretHash = createHash('sha256').update(apiSecret).digest('hex');

  const tenant = await prisma.tenant.create({
    data: {
      name,
      email,
      platform,
      apiKey,
      apiSecretHash,
      status: 'ACTIVE',
      settings: {
        protocols: ['acp', 'ucp'],
        aeoEnabled: false,
        rateLimit: 100,
      },
    },
  });

  console.log('');
  console.log('Tenant created:');
  console.log(`  ID:         ${tenant.id}`);
  console.log(`  Name:       ${tenant.name}`);
  console.log(`  Email:      ${tenant.email}`);
  console.log(`  Platform:   ${tenant.platform}`);
  console.log(`  API Key:    ${apiKey}`);
  console.log(`  API Secret: ${apiSecret}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
