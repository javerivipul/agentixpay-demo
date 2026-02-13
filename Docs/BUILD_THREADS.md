# Agentix MVP - Build Threads

> Run each thread as a separate Claude Code conversation. Copy the prompt below into a new thread.
> Threads are ordered by dependency — finish earlier threads before starting ones that depend on them.

## What's Done

- [x] **Task #1** - Monorepo initialized (Turborepo, pnpm workspaces, 8 packages)
- [x] **Task #2** - `packages/shared` complete (types, utils, constants)

## Current State

```
agentix/
├── package.json, turbo.json, pnpm-workspace.yaml, docker-compose.yml  ✅
├── packages/
│   ├── shared/     ✅ Built - types, utils, constants
│   ├── core/       🔲 Scaffold only (empty src/index.ts)
│   ├── adapters/   🔲 Scaffold only (empty src/index.ts)
│   └── protocols/  🔲 Scaffold only (empty src/index.ts)
├── apps/
│   ├── api/        🔲 Scaffold only (placeholder index.ts)
│   ├── dashboard/  🔲 Scaffold only (placeholder page)
│   └── demo/       🔲 Scaffold only (placeholder page)
```

---

## Thread 1: Core Package (packages/core)

**Dependencies:** None (shared is done)
**Estimated effort:** Large

### Prompt

```
I'm building the Agentix MVP — a B2B SaaS middleware for AI commerce. The monorepo is set up at /Users/ejaz/Documents/Programming/Agentix with Turborepo + pnpm workspaces. The `@agentix/shared` package is complete with all types.

Read the CLAUDE.md and the build spec (the long message in the conversation history or re-read the spec doc) for full context.

Build out `packages/core` (@agentix/core). This package needs:

1. **Prisma Schema** (`packages/core/prisma/schema.prisma`)
   - All models: Tenant, Product, Checkout, CheckoutItem, CheckoutEvent, Order, OrderItem, SyncJob, ApiLog
   - All enums: Platform, TenantStatus, ProductStatus, InventoryPolicy, Protocol, CheckoutStatus, PaymentStatus, OrderStatus, FulfillmentStatus, SyncType, SyncJobStatus
   - Proper indexes and relations
   - Reference the schema in the build spec for exact fields

2. **Database Client** (`src/db/client.ts`)
   - Prisma client singleton pattern

3. **Tenant Service** (`src/tenant/tenant.service.ts`)
   - CRUD operations (create, getById, getByApiKey, update, delete)
   - Always scope queries by tenantId where applicable
   - Generate API key + secret on creation

4. **Auth** (`src/auth/`)
   - `api-key.middleware.ts` - Express middleware that validates X-API-Key header, attaches tenant to req
   - `api-key.service.ts` - Generate, hash, verify API keys
   - `encryption.ts` - Encrypt/decrypt platform credentials (AES-256-GCM using ENCRYPTION_KEY env var)

5. **Logger** (`src/logger/logger.ts`)
   - Pino-based structured logger

6. **Errors** (`src/errors/agentix-error.ts`)
   - Custom AgentixError class with code, statusCode, details

7. **Cache** (`src/cache/`)
   - Redis client singleton (ioredis)
   - Cache service with get/set/del/invalidate pattern, tenant-scoped keys

8. **Queue** (`src/queue/`)
   - BullMQ setup with connection config
   - Worker stubs for sync.worker.ts and webhook.worker.ts

9. **Index** (`src/index.ts`)
   - Re-export everything

After writing the code, run `npx turbo build --filter=@agentix/core` to verify it compiles. Fix any errors.

Start Docker containers first: `docker-compose up -d` (for PostgreSQL), then run `pnpm --filter @agentix/core db:push` to apply the schema.
```

---

## Thread 2: Adapters Package (packages/adapters)

**Dependencies:** Thread 1 (needs shared types, but those are done)
**Can run in parallel with:** Thread 1 (only depends on @agentix/shared which is done)
**Estimated effort:** Medium

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. The monorepo is set up with Turborepo + pnpm. `@agentix/shared` is complete with all types.

Read CLAUDE.md for full context. Also read the Demo_2 Vendure adapter for reference:
- /Users/ejaz/Documents/Programming/Agentix/Demo_2/agentix-vendure/middleware/src/adapters/vendure-adapter.ts

Build out `packages/adapters` (@agentix/adapters):

1. **Base Interface** (`src/base/adapter.interface.ts`)
   - ISVAdapter interface with all methods: connect, disconnect, testConnection, getProducts, getProduct, getProductBySku, searchProducts, syncProducts, checkInventory, reserveInventory, releaseInventory, createOrder, getOrder, updateOrderStatus, cancelOrder, getShippingRates
   - Use types from @agentix/shared (Product, ProductQueryParams, PaginatedResult, etc.)

2. **Base Adapter** (`src/base/base.adapter.ts`)
   - Abstract class implementing common logic
   - Demo mode fallback pattern (if not connected, return mock data)

3. **Mock Adapter** (`src/mock/mock.adapter.ts`)
   - Full implementation with in-memory data
   - 10+ realistic products with real Unsplash image URLs
   - Working product search, filtering, pagination
   - Working checkout and order creation
   - 3 shipping options (Standard $5.99, Express $14.99, Overnight $29.99)
   - This is the primary adapter for demos — it must work perfectly

4. **Mock Data** (`src/mock/mock.data.ts`)
   - Separate file with product data, shipping rates

5. **Shopify Adapter Skeleton** (`src/shopify/shopify.adapter.ts`)
   - Implement the interface but methods can throw "Not implemented" for now
   - Include types file and mapper stub

6. **WooCommerce Adapter Skeleton** (`src/woocommerce/woocommerce.adapter.ts`)
   - Same as Shopify — interface stub

7. **Vendure Adapter** (`src/vendure/vendure.adapter.ts`)
   - Port from Demo_2 reference code, adapted to the new interface
   - Include GraphQL queries

8. **Registry** (`src/registry.ts`)
   - Factory function: getAdapter(platform, credentials) → ISVAdapter
   - Returns MockAdapter as fallback

9. **Index** (`src/index.ts`) - Re-export everything

Verify with: `npx turbo build --filter=@agentix/adapters`
```

---

## Thread 3: Protocols Package (packages/protocols)

**Dependencies:** Threads 1 + 2 (needs core and adapters)
**Estimated effort:** Medium-Large

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. The monorepo has @agentix/shared (complete), @agentix/core (Prisma, tenant service, auth), and @agentix/adapters (ISV adapters with mock adapter) all built.

Read CLAUDE.md for architecture. Read Demo_2 ACP implementation for reference:
- /Users/ejaz/Documents/Programming/Agentix/Demo_2/agentix-acp-demo/backend/src/routes/acp.ts
- /Users/ejaz/Documents/Programming/Agentix/Demo_2/agentix-acp-demo/backend/src/services/checkout.ts
- /Users/ejaz/Documents/Programming/Agentix/Demo_2/agentix-acp-demo/backend/src/types/acp.ts

Build out `packages/protocols` (@agentix/protocols):

1. **ACP Types** (`src/acp/types/acp.types.ts`)
   - Request/response interfaces for all ACP endpoints
   - Match the ACP spec format (amounts in cents, specific field names)

2. **ACP Schemas** (`src/acp/schemas/`)
   - Zod validation schemas for all ACP requests
   - products.schema.ts - query params validation
   - checkouts.schema.ts - create, update, complete checkout validation

3. **ACP Handlers** (`src/acp/handlers/`)
   - products.handler.ts - GET /products (search, filter, paginate)
   - checkouts.handler.ts - POST /checkouts, GET /checkouts/:id, PUT /checkouts/:id, POST /checkouts/:id/complete, DELETE /checkouts/:id
   - Each handler receives (req, res) with req.tenant already set by middleware
   - Use adapter from registry to fetch real/mock data
   - Store checkouts in database via Prisma
   - Implement checkout state machine (use VALID_TRANSITIONS from @agentix/shared)

4. **ACP Router** (`src/acp/router.ts`)
   - Express router mounting all ACP handlers at correct paths

5. **UCP Types** (`src/ucp/types/ucp.types.ts`)
   - Request/response interfaces for UCP endpoints

6. **UCP Schemas** (`src/ucp/schemas/ucp.schemas.ts`)
   - Zod validation for UCP requests

7. **UCP Handlers** (`src/ucp/handlers/`)
   - capabilities.handler.ts - GET /capabilities
   - catalog.handler.ts - GET /catalog
   - carts.handler.ts - POST /carts, GET /carts/:id, PUT /carts/:id
   - orders.handler.ts - POST /orders, GET /orders/:id

8. **UCP Router** (`src/ucp/router.ts`)

9. **Shared Utils** (`src/shared/`)
   - validation.ts - common Zod middleware helper
   - formatting.ts - response formatting helpers

10. **Index** - Re-export routers and types

Verify with: `npx turbo build --filter=@agentix/protocols`
```

---

## Thread 4: API Server (apps/api)

**Dependencies:** Threads 1, 2, 3 (needs all packages)
**Estimated effort:** Medium

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. All packages are built: @agentix/shared, @agentix/core, @agentix/adapters, @agentix/protocols.

Read CLAUDE.md for patterns. Build out `apps/api` (@agentix/api) — the main Express API server:

1. **Config** (`src/config.ts`)
   - Load env vars with defaults, validate required vars

2. **App** (`src/app.ts`)
   - Express app setup: cors, helmet, JSON parsing, request ID middleware
   - Mount protocol routers: /acp/v1/* and /ucp/v1/*
   - Mount management routes: /api/tenants, /api/health
   - Error handling middleware (catches AgentixError, returns proper format)

3. **Middleware** (`src/middleware/`)
   - auth.middleware.ts - API key validation using @agentix/core auth
   - tenant.middleware.ts - Load tenant context, attach to req
   - error.middleware.ts - Global error handler
   - rate-limit.middleware.ts - Simple in-memory rate limiter (or Redis-based)
   - request-id.middleware.ts - Attach unique request ID to each request

4. **Routes** (`src/routes/`)
   - health.routes.ts - GET /api/health (DB + Redis connectivity check)
   - tenant.routes.ts - CRUD endpoints for tenant management (used by dashboard)
   - product.routes.ts - GET /api/tenants/:id/products (dashboard use)
   - order.routes.ts - GET /api/tenants/:id/orders (dashboard use)

5. **Socket** (`src/socket/`)
   - Socket.IO setup for real-time events (journey events, order notifications)
   - Events: journey:event, order:created, sync:progress

6. **Server Entry** (`src/index.ts`)
   - Load dotenv, create HTTP server, attach Socket.IO, start listening
   - Log startup info

Make sure the ACP protocol routes use the tenant auth middleware. The protocol routers from @agentix/protocols should be mounted with the API key middleware applied.

Test by starting: `pnpm --filter @agentix/api dev` (after docker-compose up -d for Postgres/Redis)
Verify build: `npx turbo build --filter=@agentix/api`
```

---

## Thread 5: Dashboard (apps/dashboard)

**Dependencies:** Thread 4 (needs API running)
**Estimated effort:** Large
**UI Style:** Clean, polished, Anthropic/Claude-inspired (warm neutrals, clean typography, subtle shadows, generous whitespace)

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. The API server is built and running.

Read CLAUDE.md for context. Build out `apps/dashboard` (@agentix/dashboard) — the ISV-facing Next.js dashboard.

**Design style:** Clean and polished, inspired by Anthropic/Claude aesthetic — warm neutrals (beige/cream backgrounds, not pure white), clean sans-serif typography, subtle shadows, generous whitespace, rounded corners, muted accent colors. Think professional SaaS, not flashy.

1. **Tailwind + shadcn/ui Setup**
   - tailwind.config.js with custom color palette (warm neutrals + brand accent)
   - Install and configure shadcn/ui components (button, card, input, table, badge, dialog, dropdown-menu, tabs, toast)
   - Global CSS with the warm neutral theme
   - next.config.js pointing API_URL to localhost:3001

2. **Layout** (`src/app/layout.tsx`)
   - Root layout with Clerk provider, TanStack Query provider
   - Global font (Inter or similar clean sans-serif)

3. **Auth Pages**
   - sign-in/[[...sign-in]]/page.tsx
   - sign-up/[[...sign-up]]/page.tsx
   - Clerk components with custom styling

4. **Onboarding Flow** (`src/app/onboarding/`)
   - page.tsx - Platform selection (Shopify, WooCommerce, Vendure cards)
   - connect/shopify/page.tsx - Shopify OAuth initiation
   - connect/woocommerce/page.tsx - WooCommerce API key form
   - connect/vendure/page.tsx - Vendure API URL + token form
   - sync/page.tsx - Product sync progress bar
   - complete/page.tsx - Shows API key + secret, copy buttons

5. **Dashboard** (`src/app/dashboard/`)
   - layout.tsx - Sidebar navigation + header
   - page.tsx - Home with stats cards (products synced, orders today, revenue, active checkouts)
   - products/page.tsx - Filterable product table
   - orders/page.tsx - Order list with status badges
   - settings/page.tsx - General settings
   - settings/api-keys/page.tsx - API key management
   - settings/connection/page.tsx - Platform connection status

6. **Components** - Reusable UI components for stats cards, tables, sidebar, etc.

7. **Hooks** - use-tenant.ts, use-products.ts, use-orders.ts with TanStack Query

8. **API Client** (`src/lib/api.ts`) - Fetch wrapper pointing to API server

Verify: `pnpm --filter @agentix/dashboard dev` should show the dashboard at localhost:3000
```

---

## Thread 6: Demo App (apps/demo)

**Dependencies:** Thread 4 (needs API running)
**Can run in parallel with:** Thread 5
**Estimated effort:** Medium

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. The API server is built.

Read CLAUDE.md. Reference Demo_2 frontend for patterns:
- /Users/ejaz/Documents/Programming/Agentix/Demo_2/agentix-acp-demo/frontend/src/

Build `apps/demo` (@agentix/demo) — the investor demo application with a split-screen view.

**Design style:** Same Anthropic/Claude-inspired warm neutrals as the dashboard, but more dramatic for demo impact. Dark mode event log panel.

1. **Tailwind Setup** - Same theme as dashboard

2. **Demo Landing** (`src/app/page.tsx`)
   - Clean landing with "Launch Demo" button
   - Brief explanation of what the demo shows

3. **Split-Screen Demo** (`src/app/demo/page.tsx`)
   - Left half: AI Chat Simulator (looks like ChatGPT)
     - Pre-scripted conversation flow the presenter can step through
     - User messages and AI responses with product cards
     - "Find me a leather wallet under $100" → shows products
     - "I'll take the Premium Leather Wallet" → creates checkout
     - Shipping selection → payment → order confirmation
   - Right half: Merchant Dashboard Preview
     - Shows real-time stats updating
     - Order feed with new orders appearing live
   - Bottom right: Event Log (dark panel)
     - Real-time journey events streaming in
     - Timestamps, event types, colored badges

4. **Components**
   - split-screen.tsx - The two-panel layout
   - ai-chat/chat-interface.tsx - Chat bubble UI
   - ai-chat/message-bubble.tsx - Individual messages
   - ai-chat/product-card.tsx - Product display in chat
   - merchant-view/dashboard-preview.tsx - Mini dashboard
   - merchant-view/order-feed.tsx - Live order list
   - merchant-view/event-log.tsx - Scrolling event log
   - journey/journey-timeline.tsx - Event timeline

5. **Demo Scenarios** (`src/lib/scenarios.ts`)
   - Pre-built conversation scripts that call the real API
   - Each step triggers real ACP API calls behind the scenes

6. **Socket Integration** - Connect to API for real-time events

The demo must be presenter-friendly: click through steps, everything animates smoothly, no errors.

Verify: `pnpm --filter @agentix/demo dev` at localhost:3002
```

---

## Thread 7: Dev Tooling & Testing

**Dependencies:** Threads 1-4
**Can run in parallel with:** Threads 5 + 6
**Estimated effort:** Small-Medium

### Prompt

```
I'm building the Agentix MVP at /Users/ejaz/Documents/Programming/Agentix. Core packages and API are built.

Build the dev tooling and testing infrastructure:

1. **Database Seed** (`packages/core/prisma/seed.ts`)
   - Create a demo tenant with platform=CUSTOM (mock adapter)
   - Generate API key for the demo tenant
   - Seed 10+ products using the mock adapter data
   - Print the API key and tenant ID to console

2. **Test Scripts** (`scripts/`)
   - test-acp.sh - curl commands testing all ACP endpoints with the seeded API key
   - test-ucp.sh - curl commands testing all UCP endpoints
   - generate-api-key.ts - Standalone script to create a new tenant + API key

3. **Vitest Config** - Set up vitest.config.ts at workspace root
   - Unit tests for:
     - packages/shared (money utils, checkout state transitions)
     - packages/core (tenant service, encryption)
     - packages/adapters (mock adapter product search)

4. **Docker Compose** - Already exists, verify it works:
   - `docker-compose up -d` starts Postgres + Redis
   - `pnpm db:push` applies schema
   - `pnpm db:seed` seeds data

Verify: `docker-compose up -d && pnpm db:push && pnpm db:seed` then `bash scripts/test-acp.sh` should return product data
```

---

## Execution Order

```
Thread 1 (Core) ─────────┐
                         ├──→ Thread 3 (Protocols) ──→ Thread 4 (API) ──┬──→ Thread 5 (Dashboard)
Thread 2 (Adapters) ─────┘                                              ├──→ Thread 6 (Demo)
                                                                        └──→ Thread 7 (Tooling)
```

**Parallel opportunities:**
- Threads 1 + 2 can run simultaneously (both only need @agentix/shared)
- Threads 5 + 6 + 7 can run simultaneously (all only need API done)

**Minimum sequential path:** Thread 1 → Thread 3 → Thread 4 → Thread 5
