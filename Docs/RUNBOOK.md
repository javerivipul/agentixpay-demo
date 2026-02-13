# Agentix T-Shirt Demo: Runbook

> Use this document to guide a fresh Claude Code session.
> Hand this to Claude and say: "Follow this runbook step by step."

---

## What Went Wrong (Don't Repeat These)

1. **Sub-agent produced broken output, wasn't verified.** An rsync sub-agent reported "success" but only created hollow directory structures. The commit was pushed to GitHub without checking that actual `.ts` files existed.

2. **Committed to GitHub without verification.** A simple `git ls-tree -r HEAD | grep '.ts$'` would have caught the missing files before pushing.

3. **Cascading fixes instead of starting fresh.** After discovering the broken rsync, multiple patch attempts were tried. Each got stuck or created new problems. Should have stopped and restarted clean.

4. **Working in two locations caused confusion.** Jumping between `/tmp/agentix-repo` (the GitHub clone) and the local project directory led to commands running in the wrong place.

5. **Path with spaces broke tools repeatedly.** The project path (`Documents - Ejaz's Laptop`) has spaces. The Read tool fails. Workaround: always use `"$(pwd)/relative/path"` in Bash commands.

6. **Assumed mock adapter = demo, but ACP handler uses the database.** `mock.data.ts` is used by the MockAdapter class (ISV platform simulator). But ACP endpoints (`/acp/v1/products`) query Postgres via Prisma. To serve t-shirts via the API, the database must be seeded with t-shirt products.

### Rules

- **Verify every sub-agent output** — check files exist before proceeding
- **Never commit without verifying** — `git diff --stat` and spot-check key files
- **One working directory only** — don't clone repos to /tmp
- **Checkpoint after each step** — confirm it worked before moving on
- **When something breaks, stop and reassess** — don't cascade fixes

---

## Current State of the Project

### What Exists (All source code is intact)

| Item | Status | Location |
|------|--------|----------|
| Full monorepo source code | Present | `apps/`, `packages/` |
| `mock.data.ts` (t-shirt products) | Updated — 16 t-shirt products | `packages/adapters/src/mock/mock.data.ts` |
| `seed.ts` (database seeder) | **OLD generic products** (headphones, etc.) | `packages/core/prisma/seed.ts` |
| Prisma schema | Present | `packages/core/prisma/schema.prisma` |
| Docker Compose | Present | `docker-compose.yml` |
| `.env` | Present with DB/Redis URLs | `.env` |
| Demo_1 / Demo_2 | Present (reference only, don't commit) | `Demo_1/`, `Demo_2/` |
| `node_modules/` | Present at root | May need `pnpm install` |

### What's NOT Done Yet

| Item | Needed |
|------|--------|
| Build artifacts (`dist/`) | Run `pnpm build` |
| Prisma client generated | Run `prisma generate` |
| Database schema pushed | Run `prisma db push` |
| Database seeded with t-shirts | Update `seed.ts`, then run seed |
| API server running | Run after above steps |

---

## Architecture (Key Insight)

```
ACP Request
  → apiKeyMiddleware (Prisma: looks up tenant by API key)
  → ACP getProducts handler (Prisma: queries products table)
  → JSON Response

Mock Adapter (separate concern — NOT used by ACP endpoints)
  → In-memory product data from mock.data.ts
  → Used to simulate ISV platform connections (Shopify, WooCommerce)
```

**The database is required for ACP endpoints. No shortcut.**

- Prisma: lazy connection (connects on first query, not at import)
- Redis: `lazyConnect: true` (won't block startup)
- Build order (Turborepo): shared → core → protocols → adapters → api

---

## Goal

Get the API running locally on port 3001, serving t-shirt products via ACP endpoints, testable with curl.

---

## Step-by-Step Instructions

### Prerequisites
- Node.js 20+
- pnpm
- Docker running with `docker-compose up -d` (Postgres on 5432, Redis on 6379)

### Step 1: Install dependencies
```bash
pnpm install
```
**Verify:** Exit code 0, no errors.

### Step 2: Build all packages
```bash
pnpm build
```
**Verify:** `ls apps/api/dist/index.js` — file exists.

### Step 3: Generate Prisma client
```bash
cd packages/core && pnpm exec prisma generate && cd ../..
```
**Verify:** `ls packages/core/node_modules/.prisma/client/index.js` — file exists.

### Step 4: Push schema to Postgres
```bash
cd packages/core && DATABASE_URL="postgresql://agentix:agentix@localhost:5432/agentix" pnpm exec prisma db push && cd ../..
```
**Verify:** Output says "Your database is now in sync with your Prisma schema".

### Step 5: Update seed.ts with t-shirt products
Replace the `MOCK_PRODUCTS` array in `packages/core/prisma/seed.ts` with t-shirt products. Source the data from `packages/adapters/src/mock/mock.data.ts`.

Keep the same seeding logic (create tenant + insert products). Just swap the product array.

All products should have:
- `productType: "T-Shirts"`
- Real Shopify CDN image URLs (from mock.data.ts)
- Prices in dollars (not cents)
- S/M/L/XL variant info in tags

### Step 6: Seed the database
```bash
cd packages/core && DATABASE_URL="postgresql://agentix:agentix@localhost:5432/agentix" pnpm exec prisma db seed && cd ../..
```
**Verify:** Output shows tenant name, API key, and product count. **Save the API key.**

### Step 7: Start the API server
```bash
node apps/api/dist/index.js
```
**Verify:** Console shows `Agentix API server running on port 3001`.

### Step 8: Test with curl
```bash
# Health check (no auth needed)
curl http://localhost:3001/api/health

# Get t-shirt products
curl http://localhost:3001/acp/v1/products -H "X-API-Key: <API_KEY_FROM_STEP_6>"
```
**Verify:** JSON response with t-shirt products, Shopify CDN image URLs, prices in cents.

---

## After Demo Works

1. **Create a fresh GitHub repo** (not the Python UCP demo repo)
2. **Commit only production code**: `packages/`, `apps/`, root configs, `scripts/`, `Docs/`
3. **Exclude**: `Demo_1/`, `Demo_2/`, `node_modules/`, `dist/`, `.env`
4. **Deployment**: Decide Vercel strategy later

---

## File Reference

| File | Purpose |
|------|---------|
| `apps/api/src/index.ts` | API entry point — creates Express server on port 3001 |
| `apps/api/src/app.ts` | Express app — mounts middleware and routes |
| `packages/core/src/auth/api-key.middleware.ts` | Validates API key against DB tenant table |
| `packages/protocols/src/acp/handlers/products.handler.ts` | ACP products endpoint — queries DB |
| `packages/protocols/src/acp/router.ts` | ACP route definitions |
| `packages/adapters/src/mock/mock.adapter.ts` | In-memory mock ISV adapter |
| `packages/adapters/src/mock/mock.data.ts` | T-shirt product data (16 products) |
| `packages/core/prisma/schema.prisma` | Database schema (11 models) |
| `packages/core/prisma/seed.ts` | Database seeder (**needs t-shirt update**) |
| `packages/core/src/db/client.ts` | Prisma client (lazy connect) |
| `packages/core/src/cache/redis.ts` | Redis client (lazy connect) |
