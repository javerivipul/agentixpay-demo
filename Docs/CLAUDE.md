# CLAUDE.md - Agentix Project Guide

> This file provides context for Claude Code when working on the Agentix project.
> Read this file first before making any changes to the codebase.

---

## PROJECT OVERVIEW

**Agentix** is a B2B SaaS middleware platform that enables e-commerce ISVs (Independent Software Vendors) to become compliant with AI commerce protocols without building custom integrations.

**One-liner:** "Stripe for AI Commerce" - ISVs connect once to Agentix, and their merchants can sell through ChatGPT, Claude, Gemini, and other AI agents.

**Business Model:**
- $2K/month per ISV
- 0.5-1% transaction fee on GMV
- Target: Mid-market ISVs serving 100-5,000 merchants each

---

## CURRENT STATE

### What Exists
- **Demo 2** (`/Demo_2/`) contains working proof-of-concept code:
  - `agentix-acp-demo/` - ACP protocol endpoints, checkout state machine, journey logger
  - `agentix-vendure/` - Real Vendure e-commerce adapter (working GraphQL integration)
- These are reference implementations, not production code

### What We're Building
- Production-ready multi-tenant SaaS
- Self-serve ISV onboarding
- Multiple ISV adapters (Shopify, WooCommerce, Vendure)
- Dual protocol support (ACP + UCP)
- Deployable infrastructure

---

## ARCHITECTURE PRINCIPLES

### 1. Multi-Tenant First
Every database query, every API call, every cache key MUST be tenant-scoped. Never build single-tenant and "add multi-tenancy later."

```typescript
// ✅ CORRECT - Always include tenantId
const products = await prisma.product.findMany({
  where: { tenantId: ctx.tenant.id, status: 'ACTIVE' }
});

// ❌ WRONG - Missing tenant scope
const products = await prisma.product.findMany({
  where: { status: 'ACTIVE' }
});
```

### 2. Adapter Pattern for ISV Platforms
All ISV platform interactions go through adapters. Never call Shopify/WooCommerce APIs directly from protocol handlers.

```typescript
// ✅ CORRECT - Use adapter
const products = await adapter.getProducts(query);

// ❌ WRONG - Direct API call
const products = await shopifyClient.products.list();
```

### 3. Protocol Abstraction
Protocol handlers (ACP, UCP) should not know about specific ISV platforms. They work with our internal data models.

```
Protocol Handler → Core Engine → Adapter → ISV Platform
```

### 4. Fail Gracefully with Demo Mode
When ISV credentials are missing or invalid, adapters should fall back to mock data. This enables demos without real connections.

```typescript
async getProducts(params: ProductQuery): Promise<Product[]> {
  if (!this.isConnected || this.demoMode) {
    return this.getMockProducts(params);
  }
  return this.fetchRealProducts(params);
}
```

---

## TECH STACK

### Backend
```yaml
Runtime: Node.js 20 LTS
Language: TypeScript 5.x (strict mode enabled)
Framework: Express.js
ORM: Prisma (PostgreSQL)
Validation: Zod
Cache/Queue: Redis + BullMQ
Testing: Vitest
```

### Frontend
```yaml
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
Components: shadcn/ui
State: TanStack Query
Auth: Clerk
```

### Infrastructure
```yaml
Hosting: Railway (MVP) → AWS/GCP (Production)
Database: PostgreSQL 16
Cache: Redis
Monitoring: Sentry
```

---

## PROJECT STRUCTURE

```
agentix/
├── CLAUDE.md                 # This file - read first!
├── package.json              # Workspace root (pnpm workspaces)
├── turbo.json                # Turborepo config
├── .env.example              # Environment template
├── docker-compose.yml        # Local development
│
├── packages/
│   ├── core/                 # Multi-tenant core
│   │   ├── src/
│   │   │   ├── tenant/       # Tenant CRUD, settings
│   │   │   ├── auth/         # API key auth, middleware
│   │   │   ├── db/           # Prisma client, models
│   │   │   ├── cache/        # Redis utilities
│   │   │   └── queue/        # BullMQ job definitions
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── protocols/            # ACP + UCP handlers
│   │   ├── src/
│   │   │   ├── acp/          # OpenAI/Stripe protocol
│   │   │   │   ├── handlers/ # Route handlers
│   │   │   │   ├── schemas/  # Zod validation
│   │   │   │   └── types/    # TypeScript types
│   │   │   ├── ucp/          # Google protocol
│   │   │   │   ├── handlers/
│   │   │   │   ├── schemas/
│   │   │   │   └── types/
│   │   │   └── shared/       # Shared utilities
│   │   └── package.json
│   │
│   ├── adapters/             # ISV platform adapters
│   │   ├── src/
│   │   │   ├── base/         # Base interface + abstract class
│   │   │   ├── shopify/      # Shopify adapter
│   │   │   ├── woocommerce/  # WooCommerce adapter
│   │   │   ├── vendure/      # Vendure adapter
│   │   │   ├── mock/         # Mock adapter for demos
│   │   │   └── registry.ts   # Adapter factory
│   │   └── package.json
│   │
│   └── shared/               # Shared types & utilities
│       ├── src/
│       │   ├── types/        # Shared TypeScript interfaces
│       │   ├── utils/        # Common utilities
│       │   └── constants/    # Shared constants
│       └── package.json
│
├── apps/
│   ├── api/                  # Main API server
│   │   ├── src/
│   │   │   ├── routes/       # Express route definitions
│   │   │   ├── middleware/   # Auth, validation, error handling
│   │   │   ├── services/     # Business logic
│   │   │   └── index.ts      # Server entry point
│   │   └── package.json
│   │
│   ├── dashboard/            # ISV Dashboard (Next.js)
│   │   ├── src/
│   │   │   ├── app/          # App router pages
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── lib/          # API client, utilities
│   │   └── package.json
│   │
│   └── demo/                 # Demo application
│       ├── src/
│       │   ├── app/          # Demo pages
│       │   └── components/   # Demo-specific components
│       └── package.json
│
├── scripts/                  # Development & deployment scripts
│   ├── seed.ts               # Database seeding
│   ├── test-acp.sh           # ACP endpoint testing
│   ├── test-ucp.sh           # UCP endpoint testing
│   └── deploy.sh             # Deployment script
│
└── docs/                     # Documentation
    ├── API.md                # API documentation
    ├── ADAPTERS.md           # How to build adapters
    └── DEPLOYMENT.md         # Deployment guide
```

---

## KEY INTERFACES

### Tenant
```typescript
interface Tenant {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  apiSecretHash: string;
  platform: 'shopify' | 'woocommerce' | 'vendure' | 'custom';
  platformCredentials: EncryptedJSON;
  settings: {
    protocols: ('acp' | 'ucp')[];
    webhookUrl?: string;
    aeoEnabled: boolean;
    rateLimit: number;
  };
  status: 'onboarding' | 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}
```

### ISV Adapter Interface
```typescript
interface ISVAdapter {
  // Identity
  readonly platform: string;
  readonly version: string;
  
  // Connection
  connect(credentials: PlatformCredentials): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  
  // Products
  getProducts(params: ProductQueryParams): Promise<PaginatedResult<Product>>;
  getProduct(id: string): Promise<Product | null>;
  searchProducts(query: string, filters?: ProductFilters): Promise<Product[]>;
  syncProducts(): Promise<SyncResult>;
  
  // Inventory
  checkInventory(sku: string): Promise<InventoryStatus>;
  reserveInventory(sku: string, quantity: number, ttl?: number): Promise<Reservation>;
  releaseInventory(reservationId: string): Promise<void>;
  
  // Orders
  createOrder(checkout: Checkout): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>;
  cancelOrder(id: string, reason?: string): Promise<Order>;
  
  // Webhooks
  registerWebhooks(callbackUrl: string): Promise<WebhookRegistration[]>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookResult>;
}
```

### ACP Endpoints (OpenAI Protocol)
```typescript
// GET /acp/v1/products
interface ACPProductsRequest {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

// POST /acp/v1/checkouts
interface ACPCreateCheckoutRequest {
  items: Array<{
    sku: string;
    quantity: number;
  }>;
  metadata?: Record<string, unknown>;
}

// PUT /acp/v1/checkouts/:id
interface ACPUpdateCheckoutRequest {
  items?: Array<{ sku: string; quantity: number }>;
  shipping_address?: ShippingAddress;
  shipping_method?: string;
}

// POST /acp/v1/checkouts/:id/complete
interface ACPCompleteCheckoutRequest {
  payment_token: {
    type: 'stripe_spt';
    token: string;
  };
}
```

---

## CODING CONVENTIONS

### TypeScript
- Strict mode enabled (`"strict": true`)
- No `any` types - use `unknown` and type guards
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation at API boundaries

### Naming
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Database columns: `snake_case`

### Error Handling
```typescript
// Use custom error classes
class AgentixError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AgentixError';
  }
}

// Always catch and wrap external errors
try {
  await shopifyClient.products.list();
} catch (error) {
  throw new AgentixError(
    'Failed to fetch products from Shopify',
    'ADAPTER_ERROR',
    502,
    { originalError: error.message }
  );
}
```

### Logging
```typescript
// Use structured logging
import { logger } from '@agentix/core';

logger.info('Product sync started', { 
  tenantId: tenant.id, 
  platform: tenant.platform 
});

logger.error('Checkout failed', { 
  checkoutId, 
  error: error.message,
  stack: error.stack 
});
```

### API Responses
```typescript
// Success
res.json({
  success: true,
  data: { ... }
});

// Error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid checkout items',
    details: zodError.errors
  }
});
```

---

## COMMON PATTERNS

### Tenant Context Middleware
```typescript
// Every API request gets tenant context
app.use('/api', async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }
  
  const tenant = await getTenantByApiKey(apiKey);
  if (!tenant) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  req.tenant = tenant;
  next();
});
```

### Adapter Factory
```typescript
// Get the right adapter for a tenant
function getAdapter(tenant: Tenant): ISVAdapter {
  const credentials = decrypt(tenant.platformCredentials);
  
  switch (tenant.platform) {
    case 'shopify':
      return new ShopifyAdapter(credentials);
    case 'woocommerce':
      return new WooCommerceAdapter(credentials);
    case 'vendure':
      return new VendureAdapter(credentials);
    default:
      return new MockAdapter();
  }
}
```

### Checkout State Machine
```typescript
const VALID_TRANSITIONS: Record<CheckoutStatus, CheckoutStatus[]> = {
  CREATED: ['ITEMS_ADDED', 'CANCELLED', 'EXPIRED'],
  ITEMS_ADDED: ['SHIPPING_SET', 'ITEMS_ADDED', 'CANCELLED', 'EXPIRED'],
  SHIPPING_SET: ['PAYMENT_PENDING', 'SHIPPING_SET', 'CANCELLED', 'EXPIRED'],
  PAYMENT_PENDING: ['COMPLETED', 'CANCELLED', 'EXPIRED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

function canTransition(from: CheckoutStatus, to: CheckoutStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

---

## ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/agentix"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."

# Encryption (for platform credentials)
ENCRYPTION_KEY="32-byte-hex-key"

# Stripe (for payment token validation)
STRIPE_SECRET_KEY="sk_test_..."

# Shopify App (for OAuth)
SHOPIFY_CLIENT_ID="..."
SHOPIFY_CLIENT_SECRET="..."
SHOPIFY_SCOPES="read_products,write_orders,read_inventory"

# WooCommerce (optional, for testing)
WOOCOMMERCE_STORE_URL="https://test.myshopify.com"
WOOCOMMERCE_CONSUMER_KEY="ck_..."
WOOCOMMERCE_CONSUMER_SECRET="cs_..."

# Vendure (optional, for testing)
VENDURE_API_URL="http://localhost:3000/admin-api"
VENDURE_AUTH_TOKEN="..."

# Feature Flags
ENABLE_UCP=true
ENABLE_AEO=false
DEMO_MODE=false
```

---

## RUNNING LOCALLY

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL and Redis)
- Shopify Partner account (for OAuth testing)

### Setup
```bash
# Clone and install
git clone <repo>
cd agentix
pnpm install

# Start infrastructure
docker-compose up -d

# Setup database
pnpm db:push
pnpm db:seed

# Start development
pnpm dev
```

### URLs
- API: http://localhost:3001
- Dashboard: http://localhost:3000
- Demo: http://localhost:3002

---

## TESTING

### Unit Tests
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage
```

### ACP Protocol Validation
```bash
# Install nekuda validator
npm install -g @nekuda-ai/acp-validator-cli

# Run validation
acp-validate http://localhost:3001/acp/v1
```

### Manual Testing
```bash
# Test product endpoint
curl http://localhost:3001/acp/v1/products \
  -H "X-API-Key: test_api_key"

# Create checkout
curl -X POST http://localhost:3001/acp/v1/checkouts \
  -H "X-API-Key: test_api_key" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"sku": "test-001", "quantity": 1}]}'
```

---

## DEPLOYMENT

### Railway (MVP)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Environment Setup
1. Create PostgreSQL service
2. Create Redis service
3. Set environment variables
4. Deploy API, Dashboard, Demo as separate services

---

## REFERENCE CODE

When building features, reference these working implementations from Demo 2:

| Feature | Location | Notes |
|---------|----------|-------|
| ACP Endpoints | `Demo_2/agentix-acp-demo/backend/src/routes/acp.ts` | All 5 endpoints implemented |
| Checkout State Machine | `Demo_2/agentix-acp-demo/backend/src/services/checkout.ts` | State transitions, validation |
| Journey Logger | `Demo_2/agentix-acp-demo/backend/src/services/journey.ts` | Real-time event tracking |
| Vendure Adapter | `Demo_2/agentix-vendure/src/adapters/vendure.ts` | GraphQL operations |
| Product Service | `Demo_2/agentix-acp-demo/backend/src/services/products.ts` | Search, filtering |
| Split-Screen Demo | `Demo_2/agentix-acp-demo/frontend/src/app/demo/` | Demo UI components |

---

## DO NOT

1. **Don't skip tenant scoping** - Every query needs `tenantId`
2. **Don't store credentials in plain text** - Always encrypt
3. **Don't call ISV APIs directly** - Use adapters
4. **Don't ignore rate limits** - Shopify = 40/sec, WooCommerce = varies
5. **Don't build features not in spec** - Check with product before adding
6. **Don't break the demo** - Test the full flow after every change

---

## GETTING HELP

- **Architecture questions**: Check this file and `/docs/`
- **Protocol specs**: See ACP/UCP documentation links below
- **Stuck on implementation**: Reference Demo 2 code
- **Need clarification**: Ask before assuming

### External Documentation
- ACP Spec: https://github.com/anthropics/acp
- Shopify Admin API: https://shopify.dev/docs/api/admin-rest
- WooCommerce API: https://woocommerce.github.io/woocommerce-rest-api-docs/
- Vendure GraphQL: https://docs.vendure.io/reference/graphql-api/
- Prisma: https://www.prisma.io/docs
- Clerk: https://clerk.com/docs

---

*Last Updated: January 31, 2026*
