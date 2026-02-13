# Agentix MVP - Technical Status Brief

**For:** CEO, Tech Team, Stakeholders
**Date:** February 6, 2026
**Companion doc:** See `ceo_briefing.md` for the full vision, investor story, and demo script.

---

## TL;DR

**The MVP build is complete.** All 7 build threads are done. The full stack — backend API, ISV dashboard, split-screen demo app, database seeding, test scripts, and unit tests — is built and ready to run. The platform supports both AI commerce protocols (ACP for ChatGPT, UCP for Gemini) with a mock product catalog of 12 products. Real ISV platform adapters (Shopify/WooCommerce/Vendure) are stubbed — the mock adapter handles all demo scenarios.

**To run it:** Start Docker, push the schema, seed the database, start the API server, and launch the frontends. Full instructions below.

---

## Build Progress

| Component | Status | Details |
|-----------|--------|---------|
| Monorepo & Build System | Done | pnpm workspaces, Turborepo, TypeScript strict mode, all packages compile |
| Shared Types & Utils | Done | Product, checkout, order, tenant types, money conversion, ID generation |
| Core Services | Done | Prisma schema (8 models), tenant CRUD, API key auth, encryption, Redis cache, BullMQ queues, structured logging, error handling |
| Mock Adapter | Done | 12 products, inventory tracking with reservations, order creation, shipping rates |
| Shopify Adapter | Stub | Interface defined, methods not yet implemented |
| WooCommerce Adapter | Stub | Interface defined, methods not yet implemented |
| Vendure Adapter | Stub | GraphQL queries defined, methods not wired up |
| ACP Protocol (OpenAI/Stripe) | Done | All 5 endpoints: product search, checkout create/read/update/complete/cancel, full state machine, Zod validation |
| UCP Protocol (Google) | Done | All 6 endpoints: capabilities, catalog with page tokens, cart CRUD, order creation |
| API Server | Done | Express app, both protocols mounted, tenant routes, health checks, Socket.IO, rate limiting, error handling |
| ISV Dashboard | Done | 15 routes, onboarding flow, dashboard pages, settings, Clerk auth, TanStack Query hooks, shadcn/ui components. Currently displays demo data. |
| Demo App | Done | Split-screen with AI chat, merchant view, journey timeline, event log. Makes real ACP API calls. 4-step scripted scenario. |
| Database Seeding | Done | Seed script creates demo tenant ("Demo Store") with API key + 12 products with full details |
| Test Scripts | Done | `test-acp.sh` (10 tests), `test-ucp.sh` (8 tests), `generate-api-key.ts` utility |
| Unit Tests | Done | 23 tests across 3 files (checkout state machine, money utils, date utils) |
| Database Migrations | Not started | Using `db:push` (sufficient for MVP, migrations needed for production) |
| Deployment | Not started | Docker Compose for local dev only |

---

## How to Run the MVP

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker Desktop (for PostgreSQL and Redis)

### Step-by-step

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + Redis
docker-compose up -d

# 3. Copy environment template and configure
cp .env.example .env
# Edit .env with your ENCRYPTION_KEY (generate with: openssl rand -hex 32)

# 4. Push database schema
pnpm db:push

# 5. Seed the database (creates demo tenant + 12 products)
pnpm db:seed
# ⚠️  Save the API key printed to console — you'll need it

# 6. Build all packages
pnpm build

# 7. Start the API server (port 3001)
pnpm --filter @agentix/api dev

# 8. In a new terminal — start the dashboard (port 3000)
pnpm --filter @agentix/dashboard dev

# 9. In a new terminal — start the demo app (port 3002)
pnpm --filter @agentix/demo dev
```

### What you'll see
- **http://localhost:3000** — ISV Dashboard (onboarding, products, orders, settings)
- **http://localhost:3001** — API Server (health check at /api/health)
- **http://localhost:3002** — Demo App (landing page → split-screen demo)

### Validate the API

```bash
# Run the full ACP test suite (10 tests)
bash scripts/test-acp.sh <YOUR_API_KEY>

# Run the full UCP test suite (8 tests)
bash scripts/test-ucp.sh <YOUR_API_KEY>

# Run unit tests
pnpm test
```

### Generate additional tenants

```bash
npx tsx scripts/generate-api-key.ts "Store Name" "email@example.com" SHOPIFY
```

---

## Architecture (What's Built)

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTENDS                                  │
│                                                                    │
│   apps/dashboard (Next.js)          apps/demo (Next.js)           │
│   15 pages, Clerk auth,             Split-screen, AI chat,        │  DONE
│   onboarding, products,             merchant view, journey         │
│   orders, settings                  timeline, event log            │
│   [uses demo data]                  [calls real ACP API]           │
└───────────────────────────┬──────────────────────────────────────┘
                            │
               ┌────────────┴─────────────────────┐
               │         apps/api (Express)        │  DONE
               │  Health, Tenants, Rate Limiting   │
               │  Socket.IO for real-time events   │
               └────────────┬─────────────────────┘
                            │
               ┌────────────┴─────────────────────┐
               │                                    │
      ┌────────┴────────┐              ┌───────────┴──────────┐
      │  ACP Protocol   │              │    UCP Protocol      │
      │  (OpenAI/Stripe)│              │    (Google)          │  DONE
      │  5 endpoints    │              │    6 endpoints       │
      └────────┬────────┘              └───────────┬──────────┘
               │                                    │
               └────────────┬───────────────────────┘
                            │
               ┌────────────┴─────────────────────┐
               │       packages/core               │  DONE
               │  Prisma, Tenant Service, Auth,    │
               │  Cache, Queue, Logger, Errors     │
               └────────────┬─────────────────────┘
                            │
               ┌────────────┴─────────────────────┐
               │       packages/adapters           │
               │  Mock: DONE  |  Shopify: STUB     │  PARTIAL
               │  WooCommerce: STUB | Vendure: STUB│
               └──────────────────────────────────┘
```

---

## What the Dashboard Looks Like

The ISV dashboard is a complete Next.js 14 app with 15 routes:

**Authentication:** Sign-in and sign-up pages (Clerk — optional, bypassed if no key set)

**Onboarding flow (4 steps):**
1. Platform selection (Shopify / WooCommerce / Vendure)
2. Platform-specific connection forms (OAuth for Shopify, API keys for WooCommerce, GraphQL URL for Vendure)
3. Product sync progress page (animated)
4. Completion page with API credentials

**Dashboard pages:**
- Overview — stats cards (products, revenue, orders, connection status)
- Products — searchable/filterable product table
- Orders — order list with status badges
- Settings — general settings, API key management, platform connection

**Tech:** Tailwind + shadcn/ui (14 components), TanStack Query hooks for data fetching, collapsible sidebar navigation, warm neutral design theme.

**Current limitation:** Pages display hardcoded demo data. The API client and TanStack Query hooks are built and ready — wiring them to live API responses is a small next step.

---

## What the Demo App Looks Like

The demo is a split-screen experience designed for investor presentations:

**Left panel — AI Chat:**
- Simulated AI assistant conversation
- User asks to find products ("leather wallet under $100")
- AI responds with real product cards (from ACP API)
- User selects a product, completes checkout
- 4-step scripted scenario with typing indicators

**Right panel — Merchant View:**
- Live stats (orders, revenue, active agents, protocol version)
- Order feed that updates as purchases complete
- Journey timeline showing checkout stages (search → results → checkout → shipping → payment → complete)

**Bottom panel — Event Log:**
- Terminal-style protocol event stream
- Shows every ACP call in real-time (PRODUCT_SEARCH, CHECKOUT_INIT, INVENTORY_CHECK, etc.)

**Key detail:** The demo app makes **real API calls** to the ACP backend. It's not a mockup — it calls `GET /acp/v1/products`, `POST /acp/v1/checkouts`, and `POST /acp/v1/checkouts/:id/complete`.

---

## Seed Data

The seed script (`pnpm db:seed`) creates:

**Demo Tenant:**
- Name: "Demo Store" / Company: "Agentix Demo Inc."
- Platform: CUSTOM (uses mock adapter)
- Protocols: ACP + UCP enabled
- API key generated and printed to console

**12 Products:**
| # | Product | Price | Stock |
|---|---------|-------|-------|
| 1 | Wireless Noise-Canceling Headphones | $199.99 | 42 |
| 2 | Organic Cotton T-Shirt | $29.99 | 200 |
| 3 | Pour-Over Coffee Maker | $44.99 | 75 |
| 4 | Urban Commuter Backpack | $79.99 | 38 |
| 5 | Smartwatch Pro | $299.99 | 25 |
| 6 | Non-Slip Yoga Mat | $34.99 | 90 |
| 7 | Lavender Soy Candle | $18.99 | 150 |
| 8 | Lightweight Running Sneakers | $119.99 | 60 |
| 9 | Leather-Bound Journal | $24.99 | 110 |
| 10 | Succulent Trio Set | $32.99 | 35 |
| 11 | USB-C Fast Charger 65W | $39.99 | 180 |
| 12 | Insulated Water Bottle 32oz | $27.99 | 95 |

Each product includes SKU, description, compareAtPrice, vendor, tags, productType, and Unsplash image URLs.

---

## Test Coverage

### Unit Tests (23 tests)

| File | Tests | What it covers |
|------|-------|----------------|
| `packages/shared/tests/checkout.test.ts` | 14 | State machine transitions — valid paths, terminal states, re-entry, retry flows |
| `packages/shared/tests/money.test.ts` | 5 | `centsToDollars`, `dollarsToCents`, floating point handling, `formatMoney`, line totals |
| `packages/shared/tests/date.test.ts` | 4 | `minutesFromNow`, `isExpired`, `toISO` |

Run with: `pnpm test`

### API Integration Scripts

| Script | Tests | What it covers |
|--------|-------|----------------|
| `scripts/test-acp.sh` | 10 | Health check, product search/filter, full checkout flow (create → get → update → complete), cancel flow, auth (missing/invalid key) |
| `scripts/test-ucp.sh` | 8 | Capabilities, catalog listing/search, full cart-to-order flow (create → get → update → order), order retrieval |

Run with: `bash scripts/test-acp.sh <API_KEY>` and `bash scripts/test-ucp.sh <API_KEY>`

### Not yet tested
- Core package (tenant service, encryption, cache, queue)
- Adapters (mock adapter, registry)
- Protocols (ACP/UCP handlers — covered by integration scripts, not unit tests)
- API server middleware

---

## Codebase Stats

| Metric | Value |
|--------|-------|
| Total packages | 7 (4 library packages, 3 apps) |
| Prisma models | 8 (Tenant, Product, Checkout, CheckoutItem, CheckoutEvent, Order, OrderItem, SyncJob, ApiLog) |
| ACP endpoints | 5 (products, checkout CRUD, complete) |
| UCP endpoints | 6 (capabilities, catalog, cart CRUD, orders) |
| Dashboard pages | 15 (auth, onboarding, dashboard, settings) |
| Demo components | 10 (chat, merchant view, journey, event log) |
| shadcn/ui components | 14 |
| TanStack Query hooks | 3 (tenants, products, orders) |
| Seeded products | 12 with full details |
| Source files | ~100 TypeScript files across all packages |
| Unit tests | 23 across 3 files |
| Integration test scripts | 2 (ACP: 10 checks, UCP: 8 checks) |
| Build output | All packages compile cleanly |

---

## Build Thread Status

The MVP was built in 7 parallel threads:

| Thread | What | Status |
|--------|------|--------|
| 1 | Core package (Prisma, tenant, auth, cache, queue, logger) | Done |
| 2 | Adapters package (base interface, mock adapter, platform stubs) | Done |
| 3 | Protocols package (ACP + UCP handlers, schemas, types) | Done |
| 4 | API server (Express, routes, middleware, Socket.IO) | Done |
| 5 | ISV Dashboard (Next.js, 15 pages, onboarding, Clerk auth) | Done |
| 6 | Demo app (split-screen, AI chat, merchant view, journey) | Done |
| 7 | Dev tooling (seed data, test scripts, unit tests) | Done |

**All 7 threads complete.**

---

## What's Next (Post-MVP)

The MVP build is done. These are the next priorities to go from "demoable" to "deployable":

| Priority | Task | Why |
|----------|------|-----|
| High | Wire dashboard to live API | Dashboard currently shows demo data; hooks and API client are ready, just need connecting |
| High | Deploy to Railway | Get a public URL for demos and investor meetings |
| High | First real adapter (Vendure or Shopify) | Prove the platform works with real e-commerce data |
| Medium | Expand test coverage | Core, adapters, and protocol packages have no unit tests |
| Medium | Proper Prisma migrations | Currently using `db:push`; need migration files for production |
| Medium | CI/CD pipeline | Automated build + test on push |
| Low | Dashboard orders hook fix | `use-orders.ts` calls the wrong endpoint |
| Low | Socket.IO integration | Installed but unused; needed for real-time dashboard updates |
| Low | API documentation (API.md) | Formal endpoint documentation |

---

## Reference Implementation

A working proof-of-concept exists in `Demo_2/` that validates the architecture:

- `Demo_2/agentix-acp-demo/` — Working ACP backend with checkout state machine and journey logger
- `Demo_2/agentix-vendure/` — Real Vendure e-commerce adapter with GraphQL integration
- `Demo_2/agentix-acp-demo/frontend/` — Demo UI with split-screen view

This is reference code, not production, but it proves the architecture works with real data.

---

## FAQ

### General

**Q: What is Agentix?**
A B2B SaaS middleware platform — "Stripe for AI Commerce." It lets e-commerce ISVs (companies running platforms like Shopify apps, WooCommerce plugins, or custom storefronts) become compatible with AI shopping agents (ChatGPT, Claude, Gemini) without building custom integrations. ISVs connect once to Agentix, and their merchants can sell through any AI agent.

**Q: Who are the customers?**
Mid-market e-commerce ISVs — companies that build platforms or tools serving 100-5,000 merchants each. Think Shopify app developers, WooCommerce plugin makers, or custom commerce platforms like Vendure. One ISV customer can unlock thousands of merchants.

**Q: What's the business model?**
$2K/month per ISV + 0.5-1% transaction fee on GMV (gross merchandise value). An ISV would spend $200-400K building this themselves, so $2K/month is a no-brainer.

**Q: What are ACP and UCP?**
ACP (AI Commerce Protocol) is the OpenAI/Stripe standard for how AI agents discover products, create checkouts, and complete purchases. UCP (Universal Commerce Protocol) is Google's equivalent. They're similar in concept but differ in API design. Agentix supports both through a single integration — that's a key differentiator.

**Q: Why do we need both protocols?**
Different AI assistants use different protocols. ChatGPT uses ACP, Gemini will use UCP. More protocols are expected from Amazon, Meta, and Apple. Each new protocol makes Agentix more valuable — ISVs don't want to build integrations for each one.

**Q: What's the competitive landscape?**
Most ISVs are trying to build this in-house (expensive, slow) or ignoring AI commerce entirely (risky). There's no established "middleware for AI commerce" player yet. First-mover advantage is real — once ISVs integrate, switching costs are high.

### Technical

**Q: Can I run the demo right now?**
Yes. Start Docker, run `pnpm db:push && pnpm db:seed`, then start the API server and demo app. The demo makes real API calls against the seeded data. Full instructions are in the "How to Run the MVP" section above.

**Q: Why mock data? When do we get real integrations?**
The mock adapter lets us validate the full protocol flow without needing real Shopify/WooCommerce credentials. It also serves as the demo-mode fallback — the system gracefully degrades when ISV credentials are missing (a design requirement). Real adapter work is the next priority after MVP; Vendure is the easiest first target since reference code already has working GraphQL queries.

**Q: How is multi-tenancy handled?**
It's baked into every layer from day one. Every database query is scoped by `tenantId`, every API call authenticates via API key to a specific tenant, cache keys are tenant-prefixed, and the adapter registry instantiates per-tenant adapters with per-tenant credentials. This isn't bolted on — it's foundational.

**Q: How production-ready is the code?**
The architecture is solid — proper error handling, Zod validation at API boundaries, structured logging, custom error classes, clean separation of concerns (protocol → core → adapter). The frontends are polished with proper component libraries and responsive design. Unit tests cover shared utilities, and integration scripts validate both protocols end-to-end. For production: needs expanded test coverage, proper migrations, and real platform adapters.

**Q: What's the tech stack?**
Backend: Node.js 20, TypeScript (strict mode), Express, Prisma (PostgreSQL), Redis, BullMQ for queues, Zod for validation, Vitest for testing. Frontend: Next.js 14, Tailwind CSS, shadcn/ui, Clerk for auth, TanStack Query for data fetching. Infrastructure: Docker Compose for local dev, Railway for deployment.

**Q: What's the deployment story?**
Docker Compose handles local development (Postgres + Redis). Railway is the target for production deployment. The monorepo builds all packages via Turborepo with proper dependency ordering. CI/CD pipeline is a post-MVP task.

**Q: How does the checkout state machine work?**
Checkouts follow a strict state progression: `created → items_added → shipping_set → payment_pending → completed`. Invalid transitions are rejected. Checkouts can be `cancelled` or `expired` from most states. This maps to ACP protocol statuses (`not_ready_for_payment`, `ready_for_payment`, `completed`, `canceled`).

### Risks & Gaps

**Q: What are the remaining technical gaps?**
1. **Dashboard not wired to live API** — pages display demo data; the hooks and API client exist, just need connecting.
2. **No real platform adapter** — Shopify/WooCommerce/Vendure are stubs. Mock adapter covers all demo use cases.
3. **Limited test coverage** — shared utilities are tested; core, adapters, and protocols need tests.
4. **No deployment** — runs locally only. Railway deployment is the next infrastructure step.

**Q: What was built first and why in this order?**
Shared types → Core (database, auth, tenant) → Adapters (interfaces + mock) → Protocols (ACP + UCP handlers) → API server → Dashboard → Demo app → Dev tooling. This bottom-up approach means each layer is testable independently and the protocols don't depend on any specific ISV platform — they work through the adapter abstraction. Frontends were built last because they depend on the API layer. Tooling was last because it depends on everything else existing.

**Q: How long until we can demo this to an investor?**
The backend and demo app work today with seeded data. For investor demos: deploy to Railway (public URL), rehearse the split-screen demo flow, and optionally wire the dashboard to live API data. The demo script in `ceo_briefing.md` outlines the 2-3 minute pitch.

**Q: What if the ACP or UCP specs change?**
Protocol logic is isolated in `packages/protocols/` with clean interfaces to the core. Updating a protocol means changing one package — the adapters, core, and API server don't need to change. This is a deliberate architectural decision.

**Q: Can we add a new e-commerce platform later?**
Yes — that's the whole point of the adapter pattern. A new adapter implements the `ISVAdapter` interface (products, inventory, orders, webhooks) and registers itself. The protocols and core don't change. The mock adapter serves as the reference implementation.

**Q: Why isn't the dashboard connected to real API data yet?**
The build prioritized getting every piece built and functional independently. The dashboard has the API client and TanStack Query hooks ready — they're currently pointed at demo data. Connecting them is a wiring task, not a build task. This keeps the dashboard demoable even when the API server isn't running.

---

*Last Updated: February 6, 2026*
