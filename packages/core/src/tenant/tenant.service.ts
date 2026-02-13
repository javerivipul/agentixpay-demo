import { prisma } from '../db/client';
import { generateApiKey, generateApiSecret, hashSecret } from '../auth/api-key.service';
import { encrypt } from '../auth/encryption';
import { NotFoundError } from '../errors';
import type { Platform, TenantStatus, Prisma } from '@prisma/client';

export interface CreateTenantInput {
  name: string;
  email: string;
  companyName?: string;
  platform: Platform;
}

export interface UpdateTenantInput {
  name?: string;
  companyName?: string;
  platform?: Platform;
  platformConfig?: unknown;
  platformConnectedAt?: Date;
  settings?: Record<string, unknown>;
  status?: TenantStatus;
}

export interface CreateTenantResult {
  tenant: Awaited<ReturnType<typeof prisma.tenant.create>>;
  apiKey: string;
  apiSecret: string;
}

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const apiKey = generateApiKey();
  const apiSecret = generateApiSecret();
  const apiSecretHash = hashSecret(apiSecret);

  const tenant = await prisma.tenant.create({
    data: {
      name: input.name,
      email: input.email,
      companyName: input.companyName,
      platform: input.platform,
      apiKey,
      apiSecretHash,
    },
  });

  return { tenant, apiKey, apiSecret };
}

export async function getTenantById(id: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw new NotFoundError('Tenant', id);
  }
  return tenant;
}

export async function getTenantByApiKey(apiKey: string) {
  return prisma.tenant.findUnique({ where: { apiKey } });
}

export async function getTenantByEmail(email: string) {
  return prisma.tenant.findUnique({ where: { email } });
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  const data: Prisma.TenantUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.companyName !== undefined) data.companyName = input.companyName;
  if (input.platform !== undefined) data.platform = input.platform;
  if (input.status !== undefined) data.status = input.status;
  if (input.platformConnectedAt !== undefined) data.platformConnectedAt = input.platformConnectedAt;
  if (input.settings !== undefined) data.settings = input.settings as Prisma.InputJsonValue;

  if (input.platformConfig !== undefined) {
    data.platformConfig = encrypt(input.platformConfig) as unknown as Prisma.InputJsonValue;
  }

  const tenant = await prisma.tenant.update({
    where: { id },
    data,
  });

  return tenant;
}

export async function deleteTenant(id: string) {
  await prisma.tenant.delete({ where: { id } });
}

export async function listTenants(params?: {
  status?: TenantStatus;
  limit?: number;
  offset?: number;
}) {
  const where: Prisma.TenantWhereInput = {};
  if (params?.status) where.status = params.status;

  const [data, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    data,
    total,
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    hasMore: (params?.offset ?? 0) + data.length < total,
  };
}
