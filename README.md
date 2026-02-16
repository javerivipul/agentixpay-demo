# Agentix

**AI Commerce Infrastructure** — the Stripe for AI Commerce.

Agentix lets e-commerce merchants expose their catalog, checkout, and order management to AI agents through standardized protocols (ACP and UCP). Connect any platform (Shopify, WooCommerce, Vendure) and let AI agents browse products, create checkouts, and place orders on behalf of customers.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Demo App  │     │  Dashboard  │     │  AI Agents  │
│  :3002      │     │  :3000      │     │  (external) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┘───────────────────┘
                   │
           ┌───────▼───────┐
           │   API Server  │
           │   :3001       │
           │               │
           │  ┌─────────┐  │
           │  │   ACP   │  │  Agentic Commerce Protocol
           │  │   UCP   │  │  Universal Commerce Protocol
           │  └────┬────┘  │
           │       │       │
           │  ┌────▼────┐  │
           │  │Protocols│  │  Route handlers, validation, mapping
           │  └────┬────┘  │
           │       │       │
           │  ┌────▼────┐  │
           │  │Adapters │  │  Shopify, WooCommerce, Vendure, Mock
           │  └────┬────┘  │
           │       │       │
           │  ┌────▼────┐  │
           │  │  Core   │  │  Prisma, auth, cache, queues
           │  └────┬────┘  │
           │       │       │
           │  ┌────▼────┐  │
           │  │ Shared  │  │  Types, constants, utilities
           │  └─────────┘  │
           └───────────────┘
                   │
          ┌────────┼────────┐
          │        │        │
     PostgreSQL  Redis   Platform APIs
       :5432     :6379   (Shopify, etc.)
```

## Monorepo Structure

```
agentix/
├── apps/
│   ├── api/          → Express API server (port 3001)
│   ├── dashboard/    → Next.js admin portal (port 3000)
│   └── demo/         → Interactive ACP demo (port 3002)
├── packages/
│   ├── shared/       → Types, constants, price utils
│   ├── core/         → Prisma, auth, cache, queues, logger
│   ├── adapters/     → ISV platform adapters (Shopify, Woo, Vendure)
│   └── protocols/    → ACP + UCP handlers and routers
├── scripts/
│   ├── generate-api-key.ts   → Create tenant credentials
│   ├── test-acp.sh           → Test ACP endpoints
│   └── test-ucp.sh           → Test UCP endpoints
├── docker-compose.yml        → PostgreSQL + Redis
└── .env.example              → Environment template
```

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 8
- **Docker** (for PostgreSQL and Redis)

### 1. Clone and install

```bash
git clone <repo-url> && cd agentix
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env
```

Generate a real encryption key:

```bash
# Replace the placeholder in .env with this output
openssl rand -hex 32
```

All other defaults work out of the box for local development.

### 3. Start infrastructure

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (user: `agentix`, password: `agentix`, db: `agentix`)
- **Redis 7** on port 6379

### 4. Initialize the database

```bash
pnpm db:push    # Sync Prisma schema to PostgreSQL
pnpm db:seed    # Create demo tenant + sample products
```

The seed script outputs an **API Key** — save it. You'll need it for the demo app and API testing.

### 5. Configure the demo app

```bash
# apps/demo/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_API_KEY=agx_<your-key-from-seed>
```

### 6. Start everything

```bash
pnpm dev
```

This starts all services concurrently via Turborepo:

| Service     | URL                     | Description              |
|-------------|-------------------------|--------------------------|
| API         | http://localhost:3001   | Backend + protocol routes |
| Dashboard   | http://localhost:3000   | Admin portal              |
| Demo        | http://localhost:3002   | Interactive ACP demo      |

## API Protocols

All protocol endpoints require the `X-API-Key` header.

### ACP (Agentic Commerce Protocol)

Base path: `/acp/v1`

| Method | Endpoint                      | Description                |
|--------|-------------------------------|----------------------------|
| GET    | `/products`                   | Search/list products       |
| GET    | `/products/:id`               | Get product by ID          |
| POST   | `/checkouts`                  | Create a checkout          |
| GET    | `/checkouts/:id`              | Get checkout details       |
| PUT    | `/checkouts/:id`              | Update checkout (address, buyer) |
| POST   | `/checkouts/:id/complete`     | Complete with payment token |

```bash
# Example: Browse products
curl http://localhost:3001/acp/v1/products \
  -H "X-API-Key: agx_your_key_here"

# Example: Search for graphic tees
curl "http://localhost:3001/acp/v1/products?query=graphic" \
  -H "X-API-Key: agx_your_key_here"
```

**Checkout status flow:**
```
CREATED → ITEMS_ADDED → SHIPPING_SET → PAYMENT_PENDING → COMPLETED
                                                       → CANCELLED
                                                       → EXPIRED
```

### UCP (Universal Commerce Protocol)

Base path: `/ucp/v1` (enabled via `ENABLE_UCP=true`)

| Method | Endpoint                      | Description                |
|--------|-------------------------------|----------------------------|
| GET    | `/catalog`                    | Browse catalog (page_token pagination) |
| POST   | `/carts`                      | Create a cart              |
| GET    | `/carts/:id`                  | Get cart details           |
| PUT    | `/carts/:id`                  | Update cart                |
| POST   | `/orders`                     | Create order from cart     |
| GET    | `/orders/:id`                 | Get order details          |

### Price Convention

- **Database / Adapters**: Dollars as `Decimal` (e.g., `29.99`)
- **ACP / UCP responses**: Cents as `integer` (e.g., `2999`)
- Use `dollarsToCents()` / `centsToDollars()` from `@agentix/shared` for conversion

## Common Commands

```bash
# Development
pnpm dev                    # Start all services
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm clean                  # Clean build artifacts

# Database
pnpm db:push                # Sync schema (no migration files)
pnpm db:migrate             # Create + run migrations
pnpm db:seed                # Seed demo data
pnpm db:studio              # Visual database browser

# Individual services
pnpm --filter @agentix/api dev
pnpm --filter @agentix/dashboard dev
pnpm --filter @agentix/demo dev

# Generate API key for a new tenant
npx tsx scripts/generate-api-key.ts "Store Name" "email@example.com" SHOPIFY

# Test protocol endpoints
bash scripts/test-acp.sh agx_your_key_here
bash scripts/test-ucp.sh agx_your_key_here
```

## Adding a New Tenant

```bash
npx tsx scripts/generate-api-key.ts "My Store" "me@example.com" SHOPIFY
```

Supported platforms: `SHOPIFY`, `WOOCOMMERCE`, `VENDURE`, `CUSTOM`

This outputs the API Key and Secret. The **secret is only shown once** — save it securely.

## Package Dependency Chain

```
@agentix/shared        (zero deps — types, constants, utils)
       ↓
@agentix/core          (Prisma, auth, cache, queues, logger)
       ↓
@agentix/adapters      (Shopify, WooCommerce, Vendure, Mock)
       ↓
@agentix/protocols     (ACP + UCP handlers and Express routers)
       ↓
apps/api               (Express server, middleware, Socket.IO)
apps/dashboard         (Next.js 14, Tailwind, shadcn/ui, Clerk)
apps/demo              (Next.js 14, interactive ACP demo)
```

When modifying a package, everything downstream rebuilds automatically via Turborepo.

## Key Technical Notes

- **Multi-tenant**: Every database query is scoped by `tenantId`. Never query without it.
- **`noUncheckedIndexedAccess`** is enabled: `req.params['id']` returns `string | undefined`. Use `!` assertion for router-guaranteed params.
- **Prisma Decimal fields** return `Decimal` objects — wrap in `Number()` before doing math.
- **Clerk auth is optional**: If `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is not set, the dashboard bypasses auth entirely.
- **Socket.IO**: The API server streams checkout and order events in real-time to connected clients.
- **Redis**: Used for caching and BullMQ job queues. The API runs without it (degraded mode) but caching and async sync won't work.

## Troubleshooting

**"No products found" in the demo**
→ Make sure Docker containers are running: `docker start agentix-postgres agentix-redis`

**API returns `INTERNAL_ERROR`**
→ Check `curl http://localhost:3001/api/health` — if database shows `error`, restart PostgreSQL: `docker start agentix-postgres`

**API returns `AUTHENTICATION_ERROR`**
→ The API key in `apps/demo/.env.local` must match what's in the database. Re-run `pnpm db:seed` and update the key.

**Port conflicts**
→ Default ports: API=3001, Dashboard=3000, Demo=3002. Kill conflicts with `lsof -i :PORT` then `kill PID`.

**pnpm install errors with `workspace:*`**
→ Quote it in zsh: `pnpm add "@agentix/shared@workspace:*"`
# Auto-deployment test
test
