# AGENTIXPAY.AI MVP SPECIFICATION
## What We're Actually Building to Get the First Paying Customer

**Created:** January 28, 2026  
**Updated:** January 31, 2026  
**Purpose:** Define the minimum viable product that an ISV would pay for  
**Status:** Pre-build Technical Specification  
**Domain:** AgentixPay.ai

---

## THE ONE QUESTION THAT MATTERS

**What would an ISV pay $2,000/month for?**

Not a demo. Not a proof-of-concept. A product that solves their actual problem better than alternatives.

---

## THE STRATEGIC INSIGHT: WHO WE'RE TARGETING

### ACP (ChatGPT): Targeting NON-Stripe Customers

**Why this matters:**

If you're already a Stripe customer, enabling ACP is trivial:
```javascript
// Stripe customer's ACP implementation
stripe.paymentIntents.create({
  ...existingConfig,
  payment_method_options: {
    shared_payment_token: { enabled: true }  // One line
  }
});
```

**But if you're NOT on Stripe** (PayPal, Adyen, Square, Checkout.com, Braintree, etc.):
- You have NO path to ChatGPT's 700M users
- ACP requires Stripe's Shared Payment Token (SPT)
- Your options are:
  1. Add Stripe as secondary processor (complexity, double fees, compliance burden)
  2. Build custom ACP implementation from scratch (6+ months)
  3. **Use AgentixPay** (we handle Stripe integration for ACP traffic only)

**This is our ACP wedge:** We unlock ChatGPT for non-Stripe merchants.

### UCP (Google/Gemini): Open to Everyone

UCP uses modular Payment Handlers—not tied to any specific processor. Any ISV can implement UCP regardless of their payment stack.

**Our UCP value prop is different:**
- Speed (2-3 days vs 2-4 weeks)
- Managed service (we handle protocol updates)
- Multi-protocol bundle (get ACP + UCP together)
- AEO optimization (better discoverability)

---

## THE ISV'S ALTERNATIVES TODAY

| Option | Cost | Time | Who Can Use It | Result |
|--------|------|------|----------------|--------|
| **Stripe native ACP** | Free | 1 day | Stripe customers only | ChatGPT only |
| **Build ACP in-house** | $100-200K | 3-6 months | Anyone (requires Stripe) | ChatGPT only |
| **Build UCP in-house** | $100-200K | 3-6 months | Anyone | Google only |
| **Fork Shopify UCP Proxy** | Free | 2-4 weeks | Anyone | UCP only, self-managed |
| **Use AgentixPay** | $2K/month | 2-3 days | **Anyone** | **Both protocols** |

**The gap:** 
- Non-Stripe customers have NO easy path to ACP
- Everyone wants both protocols but building both is expensive
- No one offers managed multi-protocol with payment orchestration

---

## THE MULTI-PROTOCOL STORY (WHY THIS MATTERS)

### The Protocol Wars Are Real

Two competing standards have emerged for AI-powered commerce, and they're NOT converging:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PROTOCOL LANDSCAPE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACP (Agentic Commerce Protocol)         UCP (Universal Commerce Proto) │
│  ─────────────────────────────────       ───────────────────────────── │
│  Developers: OpenAI + Stripe             Developers: Google + Shopify   │
│  Primary: ChatGPT Instant Checkout       Primary: Gemini, Google AI Mode│
│  Focus: Checkout-centric                 Focus: Full commerce journey   │
│  Payment: Stripe SPT (required)          Payment: Any handler (modular) │
│  Discovery: Centralized (OpenAI)         Discovery: Decentralized       │
│                                                                         │
│  700M weekly users                       Billions of daily queries      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  EMERGING PROTOCOLS (coming soon):                                      │
│  • AP2 (Agent Payments Protocol) - Visa/Mastercard                      │
│  • A2A (Agent-to-Agent) - Google                                        │
│  • MCP Commerce Extensions - Anthropic ecosystem                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Protocols Won't Converge

**From Checkout.com research:**
> "ACP and UCP are not intended to replace each other but instead to coexist—serving different moments of intent and different execution environments."

**From Koddi analysis:**
> "If these protocols do not converge, retailers face the burden of maintaining a 'double stack': a complex data infrastructure for Google's crawling/API needs (UCP) and a separate set of secure, tokenized payment rails for OpenAI's ecosystem (ACP)."

**The reality:**
- OpenAI won't adopt Google's protocol (competitive)
- Google won't adopt OpenAI's protocol (competitive)
- Both have massive user bases (can't ignore either)
- More protocols are coming (AP2, A2A, MCP)

### Deep Dive: How ACP and UCP Actually Work

These aren't minor API differences—they're fundamentally different architectures:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACP (CHATGPT) ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DISCOVERY: Centralized via OpenAI                                           │
│  ├── Merchants apply to OpenAI merchant program                              │
│  ├── OpenAI indexes approved merchants                                       │
│  └── ChatGPT decides which merchants to show                                 │
│                                                                              │
│  CHECKOUT FLOW:                                                              │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│  │ ChatGPT │─────►│ Creates │─────►│ Merchant│─────►│ Stripe  │            │
│  │ "Buy    │      │ Stripe  │      │ verifies│      │ captures│            │
│  │  this"  │      │ SPT     │      │ SPT     │      │ payment │            │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘            │
│       │                │                │                │                  │
│       │         Payment token          Check SPT        Funds to            │
│       │         (amount-locked)         with Stripe     merchant            │
│       ▼                                                                      │
│  User's card is on file with OpenAI (via Stripe)                            │
│  User NEVER enters card during checkout                                      │
│                                                                              │
│  KEY REQUIREMENT: Stripe Shared Payment Token (SPT)                          │
│  ├── SPT is a Stripe-native feature                                          │
│  ├── Non-Stripe merchants CANNOT natively verify SPT                         │
│  └── This is why non-Stripe merchants are locked out                         │
│                                                                              │
│  ENDPOINTS (4 core):                                                         │
│  POST /checkouts           - Create checkout session                         │
│  PUT  /checkouts/:id       - Update with address/shipping                    │
│  POST /checkouts/:id/complete - Process payment via SPT                      │
│  GET  /products            - Product catalog feed                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           UCP (GOOGLE) ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DISCOVERY: Decentralized via /.well-known/ucp                               │
│  ├── Merchants publish capability profile at known URL                       │
│  ├── Google crawls and indexes these profiles                                │
│  └── Profile declares what merchant can do (checkout, inventory, etc.)       │
│                                                                              │
│  CHECKOUT FLOW:                                                              │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐            │
│  │ Google  │─────►│Negotiat │─────►│ Create  │─────►│ Payment │            │
│  │ AI Mode │      │capabili-│      │ checkout│      │ via     │            │
│  │ "Buy"   │      │ties     │      │ session │      │ handler │            │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘            │
│       │                │                │                │                  │
│       │         "What can you    "Here's the      Any supported             │
│       │          do? What         cart, who        payment method:          │
│       │          payments?"       pays how?"       GooglePay, Card, etc.    │
│       ▼                                                                      │
│  User authenticates payment at checkout time                                 │
│  Multiple payment methods supported via "Payment Handlers"                   │
│                                                                              │
│  KEY FEATURE: Modular Payment Handlers                                       │
│  ├── Google Pay handler                                                      │
│  ├── Card handler (any processor)                                            │
│  ├── PayPal handler                                                          │
│  └── Any PSP can implement a handler                                         │
│                                                                              │
│  ENDPOINTS (different from ACP):                                             │
│  GET  /.well-known/ucp     - Capability profile (discovery)                  │
│  POST /checkout-sessions   - Create checkout (different schema!)             │
│  POST /negotiate           - Capability negotiation                          │
│  Various transport support - REST, MCP, A2A                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Translation Problem

**Why you can't just "add UCP endpoints" to your ACP implementation:**

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    PROTOCOL DIFFERENCES MATRIX                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Aspect              │ ACP                      │ UCP                     │
│  ───────────────────────────────────────────────────────────────────────  │
│  Discovery           │ Centralized (OpenAI)     │ /.well-known/ucp        │
│  Checkout endpoint   │ POST /checkouts          │ POST /checkout-sessions │
│  Session ID format   │ UUID                     │ String (any format)     │
│  Payment auth        │ SPT (pre-authorized)     │ At checkout (async)     │
│  Payment processor   │ STRIPE REQUIRED          │ Any (modular handlers)  │
│  Capability declare  │ Not needed               │ Required (profile)      │
│  Line item schema    │ {sku, quantity}          │ {productId, quantity,   │
│                      │                          │  variantId, options}    │
│  Address format      │ ACP-specific             │ UCP-specific (differs!) │
│  Webhook format      │ ACP events               │ UCP notifications       │
│  Auth mechanism      │ Bearer token             │ OAuth 2.0 / API key     │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Example: Same product, different representations:**

```javascript
// ACP Product Format
{
  "id": "prod_123",
  "title": "Premium Yoga Mat",
  "description": "Extra thick, non-slip",
  "price": { "amount": 89.99, "currency": "USD" },
  "images": [{ "url": "https://..." }],
  "inventory": { "quantity": 47, "status": "in_stock" }
}

// UCP Product Format  
{
  "productId": "prod_123",
  "name": "Premium Yoga Mat",  // Different field name!
  "description": "Extra thick, non-slip",
  "pricing": {  // Different structure!
    "basePrice": { "value": 89.99, "currencyCode": "USD" }
  },
  "media": [{ "type": "image", "uri": "https://..." }],  // Different!
  "availability": {  // Different!
    "status": "IN_STOCK",
    "quantity": 47
  }
}
```

### How AgentixPay Solves This

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENTIXPAY UNIFIED MODEL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                    ┌─────────────────────────────┐                          │
│    ChatGPT ───────►│      ACP Handler            │                          │
│    (ACP)           │  • Validates ACP schema     │                          │
│                    │  • Handles SPT verification │──────┐                   │
│                    │  • Sends ACP webhooks       │      │                   │
│                    └─────────────────────────────┘      │                   │
│                                                         │                   │
│                                                         ▼                   │
│                                              ┌─────────────────────┐        │
│                                              │  UNIFIED COMMERCE   │        │
│                                              │       MODEL         │        │
│                                              │                     │        │
│                                              │  • Internal product │        │
│                                              │    representation   │        │
│                                              │  • Internal checkout│        │
│                                              │    state machine    │        │
│                                              │  • Internal order   │        │
│                                              │    format           │        │
│                                              └─────────────────────┘        │
│                                                         │                   │
│                    ┌─────────────────────────────┐      │                   │
│    Google AI ─────►│      UCP Handler            │      │                   │
│    (UCP)           │  • Serves /.well-known/ucp  │──────┘                   │
│                    │  • Handles capability nego  │                          │
│                    │  • Payment handler routing  │──────┐                   │
│                    └─────────────────────────────┘      │                   │
│                                                         │                   │
│                                                         ▼                   │
│                                              ┌─────────────────────┐        │
│                                              │   ISV ADAPTERS      │        │
│                                              │                     │        │
│                                              │  • Vendure          │        │
│                                              │  • WooCommerce      │        │
│                                              │  • Custom APIs      │        │
│                                              └─────────────────────┘        │
│                                                         │                   │
│                                                         ▼                   │
│                                              ┌─────────────────────┐        │
│                                              │   ISV PLATFORM      │        │
│                                              │   (any processor)   │        │
│                                              └─────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**The key insight:** ISV integrates ONCE with AgentixPay. We handle:
- Protocol translation (ACP ↔ UCP ↔ internal model)
- Payment orchestration (Stripe for ACP, ISV's processor for UCP)
- Schema mapping (different field names, structures)
- Discovery registration (OpenAI application + /.well-known/ucp)
- Webhook format conversion

### The Multi-Protocol Story: Elevator Pitch

**For investors (30 seconds):**
> "ChatGPT has 700 million users who can now buy products without leaving the chat—but only from Stripe merchants. Google AI Mode has billions of queries but uses a completely different protocol. We're building the infrastructure layer that lets ANY e-commerce platform sell on BOTH, regardless of their payment processor."

**For ISVs (1 minute):**
> "Your merchants are invisible to ChatGPT because you're not on Stripe. And even if you added Stripe, you'd still be invisible to Google AI Mode because that's a different protocol entirely. 
>
> AgentixPay solves both problems with one integration. We handle the Stripe integration for ChatGPT traffic, we handle the UCP implementation for Google, and your merchants don't have to change anything. They just start getting orders from AI agents."

**For developers (2 minutes):**
> "ACP and UCP aren't just different APIs—they're fundamentally different architectures. ACP is checkout-centric with pre-authorized Stripe payment tokens. UCP is journey-centric with modular payment handlers and capability negotiation.
>
> We've built a protocol abstraction layer that normalizes both into a unified commerce model. Your platform connects to us through a single adapter—we handle the protocol translation, the payment orchestration, and the schema mapping. When AP2 or MCP commerce extensions launch, we add support and your merchants are automatically enabled."

### Why "Multi-Protocol" Is THE Moat

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        COMPETITIVE MOAT ANALYSIS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MOAT LAYER 1: Payment Bridge (for ACP)                                      │
│  ├── Non-Stripe ISVs have NO alternative for ChatGPT access                  │
│  ├── We're the Stripe bridge—we do the SPT integration                       │
│  └── This creates immediate value + dependency                               │
│                                                                              │
│  MOAT LAYER 2: Protocol Abstraction                                          │
│  ├── Supporting one protocol is table stakes                                 │
│  ├── Supporting both protocols is real value                                 │
│  ├── Supporting FUTURE protocols locks in the customer                       │
│  └── Switching cost increases with each protocol we add                      │
│                                                                              │
│  MOAT LAYER 3: AEO (Agentic Engine Optimization)                             │
│  ├── More merchants = more data on what ranks well                           │
│  ├── Better optimization = higher GMV for merchants                          │
│  ├── Higher GMV = merchants won't switch                                     │
│  └── Network effects compound over time                                      │
│                                                                              │
│  MOAT LAYER 4: ISV Relationships                                             │
│  ├── Infrastructure partnerships are sticky (1-3 year contracts)             │
│  ├── Integration complexity creates switching costs                          │
│  ├── Proven results create trust                                             │
│  └── Referrals from happy ISVs drive growth                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Growth Flywheel

```
            ┌─────────────────────────────────────────┐
            │                                         │
            │   More ISVs join AgentixPay             │
            │                                         │
            └────────────────┬────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────────────┐
            │                                         │
            │   More merchant data for AEO            │
            │                                         │
            └────────────────┬────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────────────┐
            │                                         │
            │   Better ranking optimization           │
            │                                         │
            └────────────────┬────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────────────┐
            │                                         │
            │   Higher GMV for existing ISVs          │
            │                                         │
            └────────────────┬────────────────────────┘
                             │
                             ▼
            ┌─────────────────────────────────────────┐
            │                                         │
            │   Case studies + referrals              │
            │   attract more ISVs                     │
            │                                         │
            └────────────────┬────────────────────────┘
                             │
                             └──────────► (back to top)
```

### The Math: Why ISVs Need Both

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USER BASE COMPARISON                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ACP (ChatGPT)                                                          │
│  ├── 700M+ weekly active users                                          │
│  ├── 50M+ daily shopping-related queries                                │
│  ├── High purchase intent (users asking for specific products)          │
│  └── Instant Checkout = frictionless conversion                         │
│                                                                         │
│  UCP (Google AI Mode / Gemini)                                          │
│  ├── Billions of daily search queries                                   │
│  ├── Shopping queries increasingly answered by AI                       │
│  ├── Google Shopping integration                                        │
│  └── 20+ retail partners (Walmart, Target, Wayfair, etc.)              │
│                                                                         │
│  TOGETHER: ~80% of AI-assisted shopping interactions                    │
│                                                                         │
│  If you only support one protocol:                                      │
│  • ACP only = miss Google's billions of queries                         │
│  • UCP only = miss ChatGPT's high-intent shoppers                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### The N×M×P Problem

ISVs face a three-dimensional integration nightmare:

```
                         AI AGENTS (M)
            ┌───────────────────────────────────────┐
            │ ChatGPT  Gemini  Claude  Perplexity   │
            │ Copilot  Alexa   Siri    Future...    │
            └───────────────────────────────────────┘
                              │
                              │ Which protocol does each use?
                              ▼
                         PROTOCOLS (N)
            ┌───────────────────────────────────────┐
            │    ACP        UCP        AP2         │
            │    A2A        MCP        Future...   │
            └───────────────────────────────────────┘
                              │
                              │ Which PSP does each require?
                              ▼
                    PAYMENT PROCESSORS
            ┌───────────────────────────────────────┐
            │  Stripe    PayPal    Adyen    Square  │
            │  Checkout.com    Braintree   Future.. │
            └───────────────────────────────────────┘
                              │
                              │ Which platform is the ISV on?
                              ▼
                      ISV PLATFORMS (P)
            ┌───────────────────────────────────────┐
            │ Vendure  WooCommerce  Magento  Custom │
            │ Shift4Shop  Ecwid  BigCommerce  etc.  │
            └───────────────────────────────────────┘
```

**Without AgentixPay:**
- Build ACP implementation → requires adding Stripe
- Build UCP implementation → different spec entirely
- Maintain both → ongoing engineering burden
- Add new protocols → rebuild again
- Support multiple PSPs → even more complexity

**Cost estimate:** $400K-800K over 2 years to build and maintain

**With AgentixPay:**
- Single integration
- Both protocols included
- Payment orchestration handled (we integrate Stripe for ACP, any PSP for UCP)
- Protocol updates managed
- Future protocols added automatically

**Cost:** $24K/year

### The Payment Orchestration Angle

**This is key for non-Stripe ISVs:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│              WITHOUT AGENTIXPAY (Non-Stripe ISV)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ISV currently on PayPal/Adyen/Square                                   │
│                                                                         │
│  To enable ACP (ChatGPT):                                               │
│  ├── Option A: Add Stripe as second processor                           │
│  │   ├── New merchant account setup                                     │
│  │   ├── PCI compliance for second processor                            │
│  │   ├── Reconciliation complexity                                      │
│  │   ├── Double payment fees on ACP orders                              │
│  │   └── Ongoing maintenance of two payment stacks                      │
│  │                                                                       │
│  └── Option B: Build custom ACP + payment bridge                        │
│      ├── 6+ months engineering                                          │
│      ├── Stripe SPT integration from scratch                            │
│      ├── Payment routing logic                                          │
│      └── Ongoing protocol maintenance                                   │
│                                                                         │
│  Either way: Expensive, complex, time-consuming                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              WITH AGENTIXPAY (Non-Stripe ISV)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ISV stays on PayPal/Adyen/Square for regular orders                    │
│                                                                         │
│  For ACP (ChatGPT) orders:                                              │
│  ├── AgentixPay handles Stripe SPT verification                         │
│  ├── AgentixPay processes payment via our Stripe Connect                │
│  ├── Funds deposited to ISV (minus small fee)                           │
│  └── ISV keeps their existing PSP for all other orders                  │
│                                                                         │
│  For UCP (Google) orders:                                               │
│  ├── AgentixPay routes to ISV's existing PSP                            │
│  ├── UCP Payment Handler abstraction                                    │
│  └── No payment processor change needed                                 │
│                                                                         │
│  Result: Access to BOTH protocols without changing payment stack        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Concrete Example: The Non-Stripe ISV Journey

**Meet "FitCommerce" — A vertical SaaS for fitness studios**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FITCOMMERCE'S SITUATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Company: FitCommerce (hypothetical, but realistic)                     │
│  What they do: Commerce platform for 2,000 fitness studios              │
│  Payment processor: PayPal Commerce Platform (since 2018)               │
│  Annual GMV: $50M across all merchants                                  │
│  Tech team: 8 engineers                                                 │
│                                                                         │
│  Their merchants sell:                                                  │
│  • Class packages ($50-500)                                             │
│  • Memberships ($29-199/mo)                                             │
│  • Retail (apparel, supplements, equipment)                             │
│  • Digital content (workout videos)                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        THE OPPORTUNITY THEY SEE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User on ChatGPT:                                                       │
│  "I need a 10-class yoga package near downtown Austin under $200"       │
│                                                                         │
│  This is EXACTLY what their merchants sell.                             │
│  But their merchants DON'T appear in ChatGPT results.                   │
│  Instead, competitors using Shopify (on Stripe) DO appear.              │
│                                                                         │
│  User on Google AI Mode:                                                │
│  "Best spinning classes in Austin with flexible scheduling"             │
│                                                                         │
│  Same problem. Google shows Mindbody results (UCP enabled).            │
│  FitCommerce merchants are invisible.                                   │
│                                                                         │
│  The competition is eating their lunch.                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    WITHOUT AGENTIXPAY: THEIR OPTIONS                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  OPTION A: Migrate 2,000 merchants to Stripe                            │
│  ├── Timeline: 12-18 months                                             │
│  ├── Cost: $500K+ (engineering + support + merchant churn risk)         │
│  ├── Risk: 10-20% merchant churn during migration                       │
│  └── Result: ACP works, but massive disruption                          │
│                                                                         │
│  OPTION B: Build dual payment system                                    │
│  ├── Keep PayPal for existing flows                                     │
│  ├── Add Stripe for ACP-only transactions                               │
│  ├── Build routing logic, reconciliation, reporting                     │
│  ├── Timeline: 6 months                                                 │
│  ├── Cost: $200K + ongoing maintenance                                  │
│  └── Result: Complex but works (only for ACP)                           │
│                                                                         │
│  OPTION C: Build UCP from scratch (skip ChatGPT)                        │
│  ├── Fork Shopify's UCP Proxy                                           │
│  ├── Adapt for their platform (Go ≠ their stack)                        │
│  ├── Timeline: 2-3 months                                               │
│  ├── Cost: $100K                                                        │
│  └── Result: Google works, ChatGPT doesn't                              │
│                                                                         │
│  OPTION D: Build both protocols                                         │
│  ├── Option B + Option C                                                │
│  ├── Timeline: 9-12 months                                              │
│  ├── Cost: $300-400K                                                    │
│  └── Result: Works, but massive investment                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    WITH AGENTIXPAY: THE ALTERNATIVE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Week 1: Sign up for AgentixPay                                         │
│  ├── Provide FitCommerce API credentials                                │
│  ├── AgentixPay syncs merchant product catalog                          │
│  └── Configure shipping/tax rules                                       │
│                                                                         │
│  Week 2: Enable protocols                                               │
│  ├── ACP: AgentixPay uses its Stripe Connect for ChatGPT orders         │
│  ├── UCP: AgentixPay routes to PayPal for Google orders                 │
│  └── Submit to OpenAI for approval (AgentixPay helps)                   │
│                                                                         │
│  Week 3: Go live                                                        │
│  ├── Merchants start appearing in ChatGPT searches                      │
│  ├── Merchants start appearing in Google AI Mode                        │
│  └── Orders flow into FitCommerce like normal                           │
│                                                                         │
│  Ongoing:                                                               │
│  ├── AgentixPay: $2K/month + 0.5% transaction fee                       │
│  ├── No payment migration needed                                        │
│  ├── No protocol maintenance needed                                     │
│  └── Future protocols automatically included                            │
│                                                                         │
│  Annual cost: ~$35K (vs $300-400K to build themselves)                  │
│  Time to market: 3 weeks (vs 9-12 months)                               │
│  Risk: Near zero (vs major migration risk)                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### The Economic Argument

**For a mid-market ISV (1,000-5,000 merchants):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROI CALCULATION                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CONSERVATIVE ASSUMPTIONS:                                              │
│  • 1,000 merchants                                                      │
│  • $5,000 avg monthly GMV per merchant                                  │
│  • Total GMV: $5M/month                                                 │
│  • AI commerce captures 2% of GMV in Year 1 (conservative)              │
│  • AI channel GMV: $100K/month                                          │
│                                                                         │
│  COST OF AGENTIXPAY:                                                    │
│  • Platform fee: $2,000/month                                           │
│  • Transaction fee (0.5%): $500/month                                   │
│  • Total: $2,500/month = $30K/year                                      │
│                                                                         │
│  ALTERNATIVE (BUILD):                                                   │
│  • ACP implementation: $150K                                            │
│  • UCP implementation: $100K                                            │
│  • Ongoing maintenance: $50K/year                                       │
│  • Opportunity cost (9 months delay): ???                               │
│  • Total Year 1: $300K+                                                 │
│                                                                         │
│  AGENTIXPAY ADVANTAGE:                                                  │
│  • $270K savings in Year 1                                              │
│  • 9 months faster to market                                            │
│  • Zero engineering distraction                                         │
│  • Future protocols included                                            │
│                                                                         │
│  THE REAL KICKER:                                                       │
│  If AI commerce grows to 5% of GMV (likely by 2027):                    │
│  • AI channel GMV: $250K/month                                          │
│  • Missing 9 months = $2.25M in missed revenue                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why "Multi-Protocol" Is The Moat

**Single-protocol solutions are vulnerable:**

| Solution | ACP | UCP | Future | Lock-in Risk |
|----------|-----|-----|--------|--------------|
| Stripe native | ✅ | ❌ | ? | High (payment processor) |
| Shopify UCP Proxy | ❌ | ✅ | ? | Medium (self-managed) |
| PayPal (coming) | ✅* | ❌ | ? | High (payment processor) |
| **AgentixPay** | ✅ | ✅ | ✅ | **Low (protocol layer only)** |

**The multi-protocol story creates:**

1. **Switching costs** — Once integrated, ISV gets both protocols. Switching to single-protocol solution means losing half their AI commerce reach.

2. **Expansion revenue** — Start with ACP (the urgent need for non-Stripe ISVs), upsell UCP, then add future protocols.

3. **Data network effects** — More merchants = better AEO optimization data = higher rankings = more merchants.

4. **Platform gravity** — As we add more protocols (AP2, A2A, MCP), the value of AgentixPay compounds. Leaving means rebuilding N integrations.

### The Future-Proofing Argument

**Today (2026):**
- ACP powers ChatGPT
- UCP powers Google AI Mode

**Tomorrow (2027+):**
- AP2 might power Visa/Mastercard agent commerce
- A2A might enable agent-to-agent negotiations
- MCP extensions might power Claude shopping
- Amazon might release their own protocol
- Apple might join with Siri commerce

**For ISVs:**
- Each new protocol = potential 6-month engineering project
- Or subscribe to AgentixPay = we add protocols as they emerge

**This is the lock-in / retention story:**
- ISV integrates once with AgentixPay
- We continuously add new protocols
- Switching cost increases over time
- AgentixPay becomes essential infrastructure

### The Positioning Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AGENTIXPAY POSITIONING                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  "The multi-protocol commerce orchestration layer for ISVs"             │
│                                                                         │
│  For non-Stripe ISVs:                                                   │
│  "We unlock ChatGPT's 700M users without changing your payment stack"   │
│                                                                         │
│  For all ISVs:                                                          │
│  "One integration. Every AI shopping surface. Forever."                 │
│                                                                         │
│  The moat:                                                              │
│  1. Protocol abstraction (ACP + UCP + future)                           │
│  2. Payment orchestration (Stripe for ACP, any PSP for UCP)             │
│  3. AEO optimization (better discoverability)                           │
│  4. Network effects (more ISVs = better optimization data)              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MVP VALUE PROPOSITION

### The Pitch

> "Agentix is the only solution that gives ISVs access to BOTH ChatGPT (700M users via ACP) AND Google AI Mode (billions of queries via UCP) through a single integration."

### Why ISVs Will Pay

1. **Access to both user bases** — ChatGPT AND Google, not either/or
2. **Speed** — Live in days, not months
3. **Managed** — We handle protocol updates, compliance, operations
4. **Optimization** — AEO makes their merchants more discoverable
5. **Cost** — $24K/year vs $400K+ to build both in-house

---

## MVP SCOPE DEFINITION

### What's IN the MVP

| Component | Description | Priority |
|-----------|-------------|----------|
| **ACP Handler** | Full OpenAI/Stripe protocol support | MUST HAVE |
| **UCP Handler** | Full Google/Shopify protocol support | MUST HAVE |
| **Vendure Adapter** | Real ISV platform integration | MUST HAVE |
| **WooCommerce Adapter** | Second platform (larger market) | MUST HAVE |
| **Checkout Flow** | Product → Cart → Payment → Order | MUST HAVE |
| **Stripe SPT** | Payment token handling for ACP | MUST HAVE |
| **ISV Onboarding** | Self-service setup flow | MUST HAVE |
| **Basic Dashboard** | Products, orders, connection status | MUST HAVE |
| **AEO v1** | Basic semantic product enhancement | SHOULD HAVE |
| **Analytics** | Orders by protocol, revenue | SHOULD HAVE |

### What's NOT in the MVP

- ❌ Multiple payment processors (Stripe only)
- ❌ White-label / custom branding
- ❌ Advanced analytics / ML insights
- ❌ More than 2 ISV adapters
- ❌ Multi-currency / international
- ❌ Team accounts / RBAC
- ❌ API rate limiting / usage quotas (simple limits only)

---

## THE ISV INTEGRATION EXPERIENCE

### What the ISV Actually Does

```
Day 1: Onboarding
┌─────────────────────────────────────────────────────────────┐
│ 1. Sign up at agentix.com                                   │
│ 2. Select platform: "Vendure" or "WooCommerce"              │
│ 3. Provide API credentials:                                 │
│    - Vendure: GraphQL URL + auth token                      │
│    - WooCommerce: Store URL + consumer key/secret           │
│ 4. Agentix validates connection                             │
│ 5. Agentix syncs product catalog                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Day 2: Configuration
┌─────────────────────────────────────────────────────────────┐
│ 6. Connect Stripe account (for payment processing)          │
│ 7. Configure shipping options                               │
│ 8. Set tax rules (or connect tax service)                   │
│ 9. Review synced products                                   │
│ 10. Enable AEO optimization (optional)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
Day 3: Go Live
┌─────────────────────────────────────────────────────────────┐
│ 11. Agentix generates unique endpoint URLs:                 │
│     - ACP: api.agentix.com/v1/{isv_id}/acp/*               │
│     - UCP: api.agentix.com/v1/{isv_id}/ucp/*               │
│ 12. ISV submits to OpenAI (with Agentix's help)            │
│ 13. UCP discovery is auto-published                         │
│ 14. Start receiving orders!                                 │
└─────────────────────────────────────────────────────────────┘
```

### What the ISV Does NOT Do

- ❌ Read ACP or UCP specifications
- ❌ Write any protocol-specific code
- ❌ Implement payment token handling
- ❌ Build webhook endpoints
- ❌ Handle protocol updates
- ❌ Submit product feeds manually

---

## TECHNICAL ARCHITECTURE

### System Overview

```
                              INTERNET
                                  │
                  ┌───────────────┴───────────────┐
                  │      api.agentix.com          │
                  │      (Load Balancer)          │
                  └───────────────┬───────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
      ▼                           ▼                           ▼
┌───────────┐             ┌───────────┐             ┌───────────┐
│    ACP    │             │    UCP    │             │ Dashboard │
│  Handler  │             │  Handler  │             │   (Web)   │
│           │             │           │             │           │
│ /acp/v1/* │             │ /ucp/*    │             │ /app/*    │
└─────┬─────┘             └─────┬─────┘             └─────┬─────┘
      │                         │                         │
      └────────────┬────────────┴────────────┬────────────┘
                   │                         │
                   ▼                         │
         ┌─────────────────┐                 │
         │  AGENTIX CORE   │◄────────────────┘
         │                 │
         │ • Checkout svc  │
         │ • Product svc   │
         │ • Order svc     │
         │ • Webhook svc   │
         │ • AEO svc       │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐   ┌────────┐   ┌────────┐
│Vendure │   │  Woo   │   │  (N)   │
│Adapter │   │Adapter │   │Adapter │
└───┬────┘   └───┬────┘   └───┬────┘
    │            │            │
    ▼            ▼            ▼
┌────────┐   ┌────────┐   ┌────────┐
│ISV's   │   │ISV's   │   │ISV's   │
│Vendure │   │WooCom  │   │Custom  │
└────────┘   └────────┘   └────────┘
```

### Core Data Model

```typescript
// ═══════════════════════════════════════════════════════════════════
// TENANT (ISV)
// ═══════════════════════════════════════════════════════════════════
interface Tenant {
  id: string;                    // UUID
  name: string;                  // "Acme Commerce"
  email: string;                 // Primary contact
  status: 'onboarding' | 'active' | 'suspended';
  
  // Platform connection
  platform: {
    type: 'vendure' | 'woocommerce';
    config: VendureConfig | WooCommerceConfig;
    status: 'connected' | 'error' | 'syncing';
    lastSyncAt: Date;
  };
  
  // Protocol settings
  acp: {
    enabled: boolean;
    stripeAccountId: string;     // Connected Stripe account
    openaiMerchantId?: string;   // After OpenAI approval
    webhookSecret: string;
  };
  
  ucp: {
    enabled: boolean;
    capabilities: UCPCapabilities;
  };
  
  // API access
  apiKey: string;               // For programmatic access
  
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT (synced from ISV platform)
// ═══════════════════════════════════════════════════════════════════
interface Product {
  id: string;
  tenantId: string;
  
  // From ISV platform
  platformProductId: string;
  sku: string;
  title: string;
  description: string;
  
  // Pricing
  price: Money;
  compareAtPrice?: Money;
  
  // Images
  images: Array<{
    url: string;
    alt?: string;
  }>;
  
  // Inventory
  inventory: {
    quantity: number;
    status: 'in_stock' | 'out_of_stock' | 'preorder';
    trackInventory: boolean;
  };
  
  // Variants
  variants?: ProductVariant[];
  
  // AEO Enhancement
  aeo?: {
    enhancedTitle?: string;
    enhancedDescription?: string;
    semanticTags: string[];
    useCases: string[];
    score: number;
    enhancedAt: Date;
  };
  
  // Sync metadata
  syncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}

// ═══════════════════════════════════════════════════════════════════
// CHECKOUT (unified across protocols)
// ═══════════════════════════════════════════════════════════════════
interface Checkout {
  id: string;
  tenantId: string;
  
  // Protocol tracking
  protocol: 'acp' | 'ucp';
  protocolSessionId: string;    // ID from the AI agent
  
  // State machine
  status: 
    | 'created'
    | 'items_added'
    | 'address_set'
    | 'shipping_selected'
    | 'payment_pending'
    | 'completed'
    | 'cancelled'
    | 'failed';
  
  // Cart
  lineItems: LineItem[];
  
  // Customer
  customer: {
    email?: string;
    name?: string;
    phone?: string;
  };
  
  // Addresses
  shippingAddress?: Address;
  billingAddress?: Address;
  
  // Fulfillment
  shippingOption?: {
    id: string;
    carrier: string;
    service: string;
    price: Money;
    estimatedDays: number;
  };
  
  // Totals
  totals: {
    subtotal: Money;
    shipping: Money;
    tax: Money;
    discount: Money;
    total: Money;
  };
  
  // Payment
  payment?: {
    method: 'stripe_spt';
    stripePaymentIntentId: string;
    status: 'pending' | 'authorized' | 'captured' | 'failed';
  };
  
  // Platform reference
  platformCartId?: string;
  platformOrderId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// ═══════════════════════════════════════════════════════════════════
// ORDER (completed checkout)
// ═══════════════════════════════════════════════════════════════════
interface Order {
  id: string;
  tenantId: string;
  checkoutId: string;
  
  orderNumber: string;          // Human-readable "AG-12345"
  
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  
  // Denormalized from checkout
  customer: Customer;
  lineItems: LineItem[];
  shippingAddress: Address;
  totals: OrderTotals;
  
  // Payment
  payment: {
    stripePaymentIntentId: string;
    status: 'paid' | 'refunded' | 'partially_refunded';
    paidAt: Date;
  };
  
  // Platform reference
  platformOrderId: string;
  
  // Fulfillment
  fulfillment?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
    shippedAt: Date;
    deliveredAt?: Date;
  };
  
  // Webhooks sent
  webhooksSent: Array<{
    event: string;
    sentAt: Date;
    status: 'sent' | 'failed';
  }>;
  
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════
// SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════
interface Money {
  amount: number;       // In cents (e.g., 4999 = $49.99)
  currency: string;     // "USD"
}

interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;      // ISO 3166-1 alpha-2
}

interface LineItem {
  productId: string;
  variantId?: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: Money;
  totalPrice: Money;
  imageUrl?: string;
}
```

### API Endpoints

#### ACP Endpoints (OpenAI/Stripe Protocol)

```
# Product Feed
GET  /v1/{tenant_id}/acp/products
     Query: ?limit=50&offset=0&query=leather+wallet

# Checkout Flow
POST /v1/{tenant_id}/acp/checkouts
     Body: { items: [{ sku, quantity }], customer?: { email } }
     
GET  /v1/{tenant_id}/acp/checkouts/{id}

PUT  /v1/{tenant_id}/acp/checkouts/{id}
     Body: { fulfillment_address?: {...}, fulfillment_option_id?: "..." }
     
POST /v1/{tenant_id}/acp/checkouts/{id}/complete
     Body: { payment_token: { type: "shared_payment_token", token: "spt_..." } }
     
DELETE /v1/{tenant_id}/acp/checkouts/{id}
```

#### UCP Endpoints (Google/Shopify Protocol)

```
# Discovery
GET  /v1/{tenant_id}/.well-known/ucp
     Returns: capability profile, payment handlers, endpoints

# Checkout Flow
POST /v1/{tenant_id}/ucp/checkout-sessions
     Body: { line_items: [...], customer_info?: {...} }
     
GET  /v1/{tenant_id}/ucp/checkout-sessions/{id}

PUT  /v1/{tenant_id}/ucp/checkout-sessions/{id}
     Body: { shipping_address?: {...}, shipping_method?: {...} }
     
POST /v1/{tenant_id}/ucp/checkout-sessions/{id}/complete
     Body: { payment: { handler: "stripe", data: {...} } }
     
DELETE /v1/{tenant_id}/ucp/checkout-sessions/{id}
```

#### Dashboard/Management API

```
# Tenant Management
POST /v1/tenants                         # Create tenant
GET  /v1/tenants/{id}                    # Get tenant
PUT  /v1/tenants/{id}                    # Update tenant

# Platform Connection
POST /v1/tenants/{id}/connect            # Test & save connection
POST /v1/tenants/{id}/sync               # Trigger product sync

# Products
GET  /v1/tenants/{id}/products           # List products
GET  /v1/tenants/{id}/products/{pid}     # Get product
PUT  /v1/tenants/{id}/products/{pid}     # Update AEO settings

# Orders
GET  /v1/tenants/{id}/orders             # List orders
GET  /v1/tenants/{id}/orders/{oid}       # Get order

# Analytics
GET  /v1/tenants/{id}/analytics          # Basic stats
```

---

## ISV ADAPTER INTERFACE

### The Contract

```typescript
/**
 * Every ISV platform adapter must implement this interface.
 * This is how Agentix talks to Vendure, WooCommerce, etc.
 */
interface ISVAdapter {
  // ═══════════════════════════════════════════════════════════════
  // CONNECTION
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Test the connection to the ISV platform.
   * Called during onboarding to validate credentials.
   */
  testConnection(): Promise<ConnectionResult>;
  
  // ═══════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Fetch all products from the ISV platform.
   * Used for initial sync and periodic updates.
   */
  getProducts(params?: {
    limit?: number;
    offset?: number;
    updatedSince?: Date;
  }): Promise<PlatformProduct[]>;
  
  /**
   * Fetch a single product by SKU.
   * Used during checkout to verify product exists and get current price.
   */
  getProductBySku(sku: string): Promise<PlatformProduct | null>;
  
  /**
   * Search products by query.
   * Used when AI agent searches with natural language.
   */
  searchProducts(query: string, limit?: number): Promise<PlatformProduct[]>;
  
  // ═══════════════════════════════════════════════════════════════
  // INVENTORY
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Check current inventory for a product.
   * Called before adding to cart and before completing checkout.
   */
  checkInventory(sku: string): Promise<InventoryStatus>;
  
  // ═══════════════════════════════════════════════════════════════
  // CHECKOUT
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Get available shipping options for an address and cart.
   * Called when customer provides shipping address.
   */
  getShippingOptions(
    address: Address,
    items: CartItem[]
  ): Promise<ShippingOption[]>;
  
  /**
   * Calculate tax for a cart.
   * Called when calculating totals.
   */
  calculateTax(
    address: Address,
    items: CartItem[],
    shippingAmount: number
  ): Promise<TaxCalculation>;
  
  // ═══════════════════════════════════════════════════════════════
  // ORDERS
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Create an order in the ISV platform.
   * Called when checkout is completed and payment is successful.
   */
  createOrder(checkout: AgentixCheckout): Promise<PlatformOrder>;
  
  /**
   * Get an order from the ISV platform.
   * Used for order status sync.
   */
  getOrder(platformOrderId: string): Promise<PlatformOrder>;
  
  /**
   * Update order status (e.g., mark as shipped).
   * Called when we receive fulfillment updates.
   */
  updateOrderStatus(
    platformOrderId: string,
    status: OrderStatus,
    tracking?: TrackingInfo
  ): Promise<void>;
}
```

### Vendure Adapter Implementation (Sketch)

```typescript
class VendureAdapter implements ISVAdapter {
  private client: GraphQLClient;
  
  constructor(config: VendureConfig) {
    this.client = new GraphQLClient(config.apiUrl, {
      headers: { 'vendure-token': config.authToken }
    });
  }
  
  async testConnection(): Promise<ConnectionResult> {
    try {
      await this.client.request(gql`{ me { id } }`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getProducts(params): Promise<PlatformProduct[]> {
    const query = gql`
      query GetProducts($options: ProductListOptions) {
        products(options: $options) {
          items {
            id
            name
            slug
            description
            featuredAsset { source }
            variants {
              id
              sku
              name
              priceWithTax
              stockLevel
            }
          }
          totalItems
        }
      }
    `;
    
    const result = await this.client.request(query, {
      options: {
        take: params?.limit || 100,
        skip: params?.offset || 0
      }
    });
    
    return result.products.items.map(this.transformProduct);
  }
  
  async createOrder(checkout: AgentixCheckout): Promise<PlatformOrder> {
    // Vendure order creation flow:
    // 1. Create order (addItemToOrder for each item)
    // 2. Set customer (setCustomerForOrder)
    // 3. Set shipping address (setOrderShippingAddress)
    // 4. Set shipping method (setOrderShippingMethod)
    // 5. Add payment (addPaymentToOrder)
    // 6. Transition to state
    
    // ... implementation
  }
  
  private transformProduct(vendureProduct: any): PlatformProduct {
    return {
      id: vendureProduct.id,
      sku: vendureProduct.variants[0]?.sku,
      title: vendureProduct.name,
      description: vendureProduct.description,
      price: {
        amount: vendureProduct.variants[0]?.priceWithTax,
        currency: 'USD'
      },
      images: vendureProduct.featuredAsset 
        ? [{ url: vendureProduct.featuredAsset.source }]
        : [],
      inventory: {
        quantity: this.parseStockLevel(vendureProduct.variants[0]?.stockLevel),
        status: this.mapStockStatus(vendureProduct.variants[0]?.stockLevel)
      }
    };
  }
}
```

---

## CHECKOUT FLOW (DETAILED)

### Complete Purchase Journey

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT (ChatGPT/Gemini)                         │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 1. User: "Find me a leather wallet"
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ GET /v1/{tenant}/acp/products?query=leather+wallet                       │
│                                                                          │
│ Agentix:                                                                 │
│   1. Query products from local cache (synced from ISV)                   │
│   2. Apply AEO enhancement if enabled                                    │
│   3. Return ACP-formatted product feed                                   │
│                                                                          │
│ Response: { products: [{ id, title, description, price, images }] }      │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 2. User selects product
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ POST /v1/{tenant}/acp/checkouts                                          │
│ Body: { items: [{ sku: "wallet-001", quantity: 1 }] }                    │
│                                                                          │
│ Agentix:                                                                 │
│   1. Validate SKU exists in product catalog                              │
│   2. Check inventory via adapter                                         │
│   3. Create checkout record (status: 'created')                          │
│   4. Calculate initial totals (subtotal only)                            │
│                                                                          │
│ Response: {                                                              │
│   checkout: {                                                            │
│     id: "cs_abc123",                                                     │
│     status: "created",                                                   │
│     items: [{ sku, title, quantity, price }],                            │
│     totals: { subtotal, shipping: null, tax: null, total },              │
│     payment_methods: [{ type: "shared_payment_token" }]                  │
│   }                                                                      │
│ }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 3. User provides shipping address
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ PUT /v1/{tenant}/acp/checkouts/cs_abc123                                 │
│ Body: {                                                                  │
│   fulfillment_address: {                                                 │
│     name: "John Doe",                                                    │
│     line_one: "123 Main St",                                             │
│     city: "San Francisco",                                               │
│     state: "CA",                                                         │
│     postal_code: "94102",                                                │
│     country: "US"                                                        │
│   }                                                                      │
│ }                                                                        │
│                                                                          │
│ Agentix:                                                                 │
│   1. Save address to checkout                                            │
│   2. Call adapter.getShippingOptions(address, items)                     │
│   3. Call adapter.calculateTax(address, items, shipping)                 │
│   4. Update totals                                                       │
│   5. Update status to 'address_set'                                      │
│                                                                          │
│ Response: {                                                              │
│   checkout: {                                                            │
│     ...                                                                  │
│     fulfillment_options: [                                               │
│       { id: "std", title: "Standard", price: 5.99, days: 5-7 },          │
│       { id: "exp", title: "Express", price: 12.99, days: 2-3 }           │
│     ],                                                                   │
│     totals: { subtotal: 89.99, shipping: 5.99, tax: 7.68, total: 103.66 }│
│   }                                                                      │
│ }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 4. User selects shipping & confirms
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ AI Agent creates Stripe Shared Payment Token (SPT)                       │
│                                                                          │
│ The AI agent (ChatGPT) provisions a payment token through Stripe         │
│ using the user's saved payment method.                                   │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 5. Complete purchase
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ POST /v1/{tenant}/acp/checkouts/cs_abc123/complete                       │
│ Body: {                                                                  │
│   payment_token: {                                                       │
│     type: "shared_payment_token",                                        │
│     token: "spt_abc123xyz",                                              │
│     provider: "stripe"                                                   │
│   }                                                                      │
│ }                                                                        │
│                                                                          │
│ Agentix:                                                                 │
│   1. Verify SPT with Stripe                                              │
│      - stripe.paymentIntents.retrieve(token)                             │
│      - Verify amount matches checkout total                              │
│   2. Confirm payment                                                     │
│      - stripe.paymentIntents.confirm(token)                              │
│   3. Create order in ISV platform                                        │
│      - adapter.createOrder(checkout)                                     │
│   4. Update checkout status to 'completed'                               │
│   5. Create order record                                                 │
│   6. Send webhook to AI agent (order.created)                            │
│                                                                          │
│ Response: {                                                              │
│   order: {                                                               │
│     id: "ord_xyz789",                                                    │
│     order_number: "AG-10001",                                            │
│     status: "completed",                                                 │
│     items: [...],                                                        │
│     totals: {...},                                                       │
│     payment: { status: "paid" }                                          │
│   }                                                                      │
│ }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ 6. Webhooks (async)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ POST {ai_agent_webhook_url}                                              │
│ Body: {                                                                  │
│   event: "order.created",                                                │
│   order: { id, order_number, status }                                    │
│ }                                                                        │
│                                                                          │
│ Later, when ISV marks as shipped:                                        │
│                                                                          │
│ POST {ai_agent_webhook_url}                                              │
│ Body: {                                                                  │
│   event: "order.shipped",                                                │
│   order: { id, tracking_number, tracking_url }                           │
│ }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## BUILD TIMELINE

### 8-Week MVP Plan (With CTO)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 1-2: CORE INFRASTRUCTURE                                           │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 1:                                                                 │
│   □ Project setup (monorepo: packages/api, packages/dashboard)          │
│   □ Database schema + migrations (PostgreSQL)                           │
│   □ Tenant model + CRUD operations                                      │
│   □ Product model + sync service skeleton                               │
│   □ Basic auth middleware (API keys)                                    │
│                                                                         │
│ Week 2:                                                                 │
│   □ Checkout model + state machine                                      │
│   □ Order model                                                         │
│   □ ACP handler (all 5 endpoints)                                       │
│   □ ACP response formatting (per spec)                                  │
│   □ Unit tests for ACP compliance                                       │
│                                                                         │
│ Deliverable: ACP handler working with mock data                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 3-4: ISV INTEGRATION                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 3:                                                                 │
│   □ ISV adapter interface                                               │
│   □ Vendure adapter (full implementation)                               │
│     - Product sync                                                      │
│     - Inventory check                                                   │
│     - Order creation                                                    │
│   □ Product sync scheduler (cron job)                                   │
│   □ Integration tests with real Vendure instance                        │
│                                                                         │
│ Week 4:                                                                 │
│   □ Stripe SPT verification                                             │
│   □ Payment confirmation flow                                           │
│   □ Webhook service (outbound to AI agents)                             │
│   □ End-to-end test: ACP → Agentix → Vendure → Order                   │
│                                                                         │
│ Deliverable: Complete ACP flow with Vendure                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 5-6: UCP + SECOND ADAPTER                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 5:                                                                 │
│   □ UCP handler (all endpoints)                                         │
│   □ UCP capability profile (/.well-known/ucp)                           │
│   □ UCP ↔ internal model translation                                    │
│   □ Test with both protocols against Vendure                            │
│                                                                         │
│ Week 6:                                                                 │
│   □ WooCommerce adapter                                                 │
│     - Reference Shopify's adapter as guide                              │
│     - Product sync                                                      │
│     - Order creation                                                    │
│   □ Test both adapters with both protocols                              │
│                                                                         │
│ Deliverable: Both protocols working with both adapters                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 7-8: DASHBOARD + LAUNCH PREP                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Week 7:                                                                 │
│   □ Dashboard UI (Next.js)                                              │
│     - Onboarding flow                                                   │
│     - Platform connection                                               │
│     - Product list                                                      │
│     - Order list                                                        │
│   □ AEO service v1 (basic enhancement)                                  │
│                                                                         │
│ Week 8:                                                                 │
│   □ Basic analytics (orders, revenue, by protocol)                      │
│   □ Error handling + logging                                            │
│   □ Rate limiting                                                       │
│   □ Documentation                                                       │
│   □ Deploy to production                                                │
│   □ Onboard first pilot ISV                                             │
│                                                                         │
│ Deliverable: MVP ready for paying customers                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## TECH STACK

### Backend

```yaml
Runtime: Node.js 20 LTS
Language: TypeScript 5.x
Framework: Express.js (simple, battle-tested)
Database: PostgreSQL 16 (via Prisma ORM)
Cache: Redis (for rate limiting, sessions)
Queue: BullMQ (for async jobs: sync, webhooks)
```

### Frontend (Dashboard)

```yaml
Framework: Next.js 14 (App Router)
Styling: Tailwind CSS
Components: shadcn/ui
Auth: Clerk (or Auth0)
State: TanStack Query
```

### Infrastructure

```yaml
MVP Hosting: Railway ($20/month)
  - API service (auto-scale)
  - PostgreSQL (managed)
  - Redis (managed)
  
Production Hosting: AWS or GCP
  - ECS or Cloud Run
  - RDS PostgreSQL
  - ElastiCache Redis
  
Monitoring:
  - Sentry (errors)
  - Axiom (logs)
  - Better Uptime (status page)
```

---

## SUCCESS CRITERIA

### Technical Success

- [ ] ACP handler passes nekuda validator
- [ ] UCP handler returns valid capability profile
- [ ] Both protocols complete end-to-end checkout
- [ ] Orders appear in ISV platform (Vendure/WooCommerce)
- [ ] Webhooks delivered to AI agents
- [ ] 99.9% uptime over 30 days

### Business Success

- [ ] 3+ ISV LOIs before build starts
- [ ] 1 pilot ISV onboarded by week 8
- [ ] First real transaction by week 10
- [ ] First paying customer by week 12

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Can't find CTO in time | Start with contractor; reduce scope to ACP-only |
| ISVs won't wait 8 weeks | Get deposits/commitments; provide early access |
| Protocols change during build | Abstract protocol layer; monitor changelogs |
| Stripe SPT issues | Early Stripe partnership outreach; sandbox testing |
| UCP too complex | Start with ACP-only MVP; add UCP post-launch |
| WooCommerce adapter fails | Use Shopify's adapter as reference; fallback to Vendure-only |

---

## NEXT ACTIONS

### This Week

1. **Finalize CTO requirements** — What exactly do you need them to build?
2. **Create technical interview questions** — Focus on payment systems, API design
3. **Set up project skeleton** — Monorepo, basic CI/CD, deployment pipeline
4. **Document Vendure integration** — What you've already built

### Before CTO Starts

1. **Secure 3 ISV LOIs** — Use committed funding as leverage
2. **Get Stripe partnership** — Early access to SPT sandbox
3. **Apply to OpenAI merchant program** — Understand approval process
4. **Research UCP spec in detail** — Know what you're building

### With CTO (Week 1)

1. **Align on architecture** — Review this spec together
2. **Set up development environment** — Everyone can run locally
3. **Agree on coding standards** — TypeScript, testing, code review
4. **Create sprint plan** — Break down into 2-week sprints

---

## APPENDIX: WHAT YOU'VE ALREADY BUILT

Based on previous work:

```
✅ Mock ACP Server
   - Demonstrates ACP protocol compliance
   - 4 checkout endpoints working
   - Product feed endpoint working

✅ Vendure Adapter (partial)
   - GraphQL client configured
   - Product query working
   - Checkout flow (needs completion)

✅ Checkout State Machine
   - Status transitions defined
   - Basic validation

✅ Product Search
   - Query interface
   - Response formatting

❌ Not yet built:
   - UCP handler
   - Multi-tenant support  
   - Stripe SPT integration
   - Webhook delivery
   - WooCommerce adapter
   - Dashboard UI
   - Production infrastructure
```

This existing work gives you a 2-3 week head start on the ACP portion.

---

**Document Version:** 1.0  
**Last Updated:** January 28, 2026  
