# ── Stage 1: Base ──────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── Stage 2: Install dependencies ─────────────────────────────
FROM base AS deps

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./

# Copy all package.json files for dependency resolution
COPY packages/shared/package.json packages/shared/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/protocols/package.json packages/protocols/package.json
COPY apps/api/package.json apps/api/package.json

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# ── Stage 3: Build ─────────────────────────────────────────────
FROM deps AS build

# Copy source code
COPY packages/ packages/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN pnpm --filter @agentix/core db:generate

# Build all packages the API depends on (turbo handles the graph)
RUN pnpm turbo build --filter=@agentix/api...

# ── Stage 4: Production ───────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

# Copy package manifests + lockfile for pnpm to resolve
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/protocols/package.json packages/protocols/package.json
COPY apps/api/package.json apps/api/package.json

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built output from all packages
COPY --from=build /app/packages/shared/dist/ packages/shared/dist/
COPY --from=build /app/packages/core/dist/ packages/core/dist/
COPY --from=build /app/packages/adapters/dist/ packages/adapters/dist/
COPY --from=build /app/packages/protocols/dist/ packages/protocols/dist/
COPY --from=build /app/apps/api/dist/ apps/api/dist/

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=build /app/packages/core/prisma/ packages/core/prisma/
COPY --from=build /app/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/ node_modules/.pnpm/@prisma+client@5.22.0/node_modules/.prisma/

# Copy seed script (runs at startup via entrypoint)
COPY --from=build /app/packages/core/prisma/seed.ts packages/core/prisma/seed.ts

# Install tsx globally for running the seed script
RUN pnpm add -g tsx

# Copy entrypoint script
COPY scripts/docker-entrypoint-api.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/docker-entrypoint.sh"]
