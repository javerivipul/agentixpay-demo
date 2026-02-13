# AGENTIX MVP - CEO BRIEFING
## What We're Building, How It Works & Why It Will Wow Investors

---

## THE ONE-LINER

**Agentix lets online stores sell through ChatGPT, Claude, and other AI assistants — without building anything themselves.**

---

## THE PROBLEM WE SOLVE

Imagine you run an e-commerce platform with 500 merchants. Your merchants want to sell through ChatGPT (700M+ users), but:

- Building that integration yourself = **6-9 months** and **$200-400K**
- You'd need to do it again for Claude, Gemini, Perplexity...
- The technology keeps changing (new protocols every few months)

**That's painful. That's expensive. That's our opportunity.**

---

## WHAT AGENTIX DOES (Simple Version)

Think of Agentix like a **universal translator** between:

```
AI ASSISTANTS          AGENTIX              ONLINE STORES
(ChatGPT, Claude)  →   [Magic Box]    →    (Shopify, WooCommerce)
     ↑                                            ↓
     └──────────── Products & Orders ─────────────┘
```

**Before Agentix:** Each store platform needs to build separate integrations for each AI assistant. That's dozens of custom projects.

**With Agentix:** Connect once to Agentix → automatically work with ALL AI assistants. Done in minutes, not months.

---

## HOW THE MVP WORKS (The "Magic Box" Explained)

### The Three Layers

Think of Agentix like a building with three floors:

```
┌─────────────────────────────────────────────────────────────────┐
│  FLOOR 3: PROTOCOL LAYER                                        │
│  "Speaking the AI's Language"                                   │
│                                                                 │
│  When ChatGPT asks "what wallets do you have?" - this layer     │
│  understands the question and formats our answer correctly.     │
│                                                                 │
│  We support TWO languages:                                      │
│  • ACP (OpenAI/Stripe's protocol) ← ChatGPT uses this          │
│  • UCP (Google's protocol) ← Gemini will use this              │
│                                                                 │
│  More AI assistants = more "languages" we'll add                │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│  FLOOR 2: CORE ENGINE                                           │
│  "The Brain"                                                    │
│                                                                 │
│  • Manages all our ISV customers (multi-tenant)                 │
│  • Handles security & API keys                                  │
│  • Tracks orders, products, checkouts                           │
│  • Makes sure ISV #1 can't see ISV #2's data                   │
│                                                                 │
│  Think of it like a hotel: many guests (ISVs), each with        │
│  their own room (data), shared amenities (our platform).        │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│  FLOOR 1: ADAPTER LAYER                                         │
│  "Speaking the Store's Language"                                │
│                                                                 │
│  Each e-commerce platform has its own way of doing things.      │
│  We build "adapters" that know how to talk to each one:         │
│                                                                 │
│  • Shopify Adapter → Knows Shopify's API                       │
│  • WooCommerce Adapter → Knows WooCommerce's API               │
│  • Vendure Adapter → Knows Vendure's API                       │
│                                                                 │
│  Adding a new platform = building a new adapter (days, not      │
│  months). The rest of Agentix stays the same.                   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Architecture Matters

**For Investors:**
- "We don't rebuild everything for each new AI or each new store platform"
- "Adding OpenAI took us X. Adding Google takes the same. Adding Amazon will too."
- "This is how Stripe works — one integration, many payment methods"

**For Sales:**
- "Connect once, work everywhere"
- "We handle the complexity so you don't have to"

---

## THE COMPLETE FLOW (What Actually Happens)

Here's what happens when someone shops through ChatGPT:

```
STEP 1: ISV CONNECTS (One-Time Setup)
────────────────────────────────────────────────────────────────
ISV signs up → Clicks "Connect Shopify" → Authorizes access
                                              ↓
                              Agentix pulls their product catalog
                                              ↓
                              Products now "visible" to AI agents
                              
Time: ~2 minutes


STEP 2: CUSTOMER SEARCHES (Every Transaction)
────────────────────────────────────────────────────────────────
Customer in ChatGPT: "Find me a leather wallet under $100"
                                              ↓
ChatGPT asks Agentix: "GET /products?query=wallet&max_price=100"
                                              ↓
Agentix checks which ISVs have matching products
                                              ↓
Agentix returns: "Here are 5 wallets from 3 different stores"
                                              ↓
ChatGPT shows the options to the customer

Time: ~1 second


STEP 3: CUSTOMER BUYS (Every Transaction)
────────────────────────────────────────────────────────────────
Customer: "I'll take the brown one"
                                              ↓
ChatGPT creates checkout → Agentix creates checkout
                                              ↓
Customer enters shipping → Agentix calculates tax/shipping
                                              ↓
Customer pays (via Stripe) → Agentix confirms payment
                                              ↓
Agentix creates order in the actual Shopify store
                                              ↓
ISV sees new order in both Agentix dashboard AND Shopify

Time: ~30 seconds


STEP 4: ORDER FULFILLMENT (Business as Usual)
────────────────────────────────────────────────────────────────
ISV fulfills order from their normal Shopify workflow
Nothing changes about how they ship products
They just got a new sales channel (AI) without doing anything
```

---

## WHAT THE MVP INCLUDES

### 1. Self-Serve Onboarding Portal

**What the ISV experiences:**
1. Go to agentix.com → Click "Get Started"
2. Create account (email/password)
3. Select platform: Shopify / WooCommerce / Vendure
4. Click "Connect" → Redirected to Shopify → Click "Authorize"
5. Redirected back → See products syncing
6. Get API credentials → Done

**Why it matters:** No sales calls. No implementation projects. No waiting.

### 2. ISV Dashboard

**What they can see and do:**
- **Home:** Orders today, revenue, products synced, connection status
- **Products:** All synced products, search/filter
- **Orders:** Every order from AI agents, which AI it came from
- **Settings:** Reconnect platform, manage API keys, configure options

**Why it matters:** Professional, production-ready feel. "This is a real product."

### 3. Protocol Endpoints (The Technical Magic)

**ACP (OpenAI's Protocol):**
- Product search endpoint
- Checkout creation/update/complete
- Order status

**UCP (Google's Protocol):**
- Same capabilities, different format
- Shows we're not locked to one AI company

**Why it matters:** We support BOTH major protocols. Future-proof.

### 4. Live Demo Mode

**Split-screen view for presentations:**
- Left side: AI chat interface (simulating ChatGPT)
- Right side: ISV dashboard showing real-time updates

**The "wow moment":** 
- Type a search on the left → Products appear
- Complete a purchase on the left → Order appears on the right instantly

---

## THE INVESTOR STORY

### What Makes This Compelling

**1. Timing is Perfect**
- OpenAI launched shopping in ChatGPT (Nov 2024)
- Google announced their commerce protocol (Jan 2025)
- Major retailers (Shopify, Walmart, Target) are racing to integrate
- ISVs are panicking — they need a solution NOW

**2. "Protocol Wars" = Our Moat**
- OpenAI has ACP (with Stripe)
- Google has UCP (with Shopify)
- More protocols coming from Amazon, Meta, Apple...
- **Each new protocol makes Agentix MORE valuable, not less**

**3. Clear Business Model**
- $2K/month per ISV (they'd pay $200K+ to build it themselves)
- Transaction fees on top (0.5-1% of GMV)
- Land-and-expand: Start with one protocol, upsell more

**4. Defensible Position**
- First-mover in the "middleware" space
- Network effects: More ISVs = better data = better service
- Switching costs: Once integrated, ISVs don't leave

---

## BUILD TIMELINE

| Phase | Duration | What Gets Built | Demo Capability |
|-------|----------|-----------------|-----------------|
| **Foundation** | Days 1-3 | Core platform, database, Shopify adapter | Can connect real Shopify store |
| **Protocols** | Days 4-6 | ACP + UCP endpoints, validation | AI agents can search & buy |
| **Dashboard** | Days 7-10 | Onboarding, orders, settings pages | Full self-serve experience |
| **Polish** | Days 11-14 | Demo view, deployment, testing | Investor-ready presentation |

**Total: ~2 weeks to demo-ready MVP**

---

## THE "MIC DROP" DEMO

### Setup (Before the Meeting)
- Agentix deployed and running
- Shopify test store with ~20 products ready
- Split-screen demo page loaded

### The Demo Script (2-3 minutes)

**Opening (30 sec):**
> "Let me show you what happens when an ISV wants to enable AI commerce today..."

**The Pain (30 sec):**
> "They'd need to build integrations for ChatGPT, Claude, Gemini... each one costs $200K and takes 6 months. That's not sustainable."

**Live Demo - Part 1: Connect (60 sec):**
> "Watch this. I'm signing up as a new ISV right now..."
> 
> [Create account → Select Shopify → Click Authorize → Products sync]
> 
> "That took 90 seconds. The store is now AI-ready."

**Live Demo - Part 2: Purchase (60 sec):**
> "Now let's see what a customer experiences..."
> 
> [Switch to split-screen → Search "leather wallet" → Select product → Complete checkout]
> 
> "See that? The order just appeared in the dashboard AND in Shopify."

**The Punch (15 sec):**
> "What used to take 6 months and $200K just happened in 2 minutes. That's Agentix."

**The Business (30 sec):**
> "We charge $2K/month. ISVs would pay 100x that to build it themselves. And every new AI protocol — Google, Amazon, Meta — makes us more valuable, not less."

---

## WHAT WE'RE NOT BUILDING (YET)

To stay focused and ship fast, these are explicitly **out of scope** for MVP:

| Not Now | Why | When |
|---------|-----|------|
| Advanced analytics | Nice-to-have, not demo-critical | Phase 2 |
| AEO optimization (AI product enhancement) | Complex feature, separate value prop | Phase 2 |
| Shopify App Store listing | Requires app review process | After MVP validates |
| White-label / custom branding | Enterprise feature | Phase 3 |
| Mobile app | Web-first is fine | Much later |

---

## TECHNICAL DECISIONS (Simplified)

For the technically curious, but explained simply:

| Decision | What We Chose | Why |
|----------|---------------|-----|
| **Database** | PostgreSQL | Industry standard, reliable, scales well |
| **Hosting** | Railway | Easy to deploy, affordable for MVP, can migrate later |
| **Auth** | Clerk or Auth0 | Don't build login ourselves, it's solved |
| **Payments** | Stripe (test mode) | Industry standard, already integrated with ACP |
| **Code Structure** | Monorepo | All code in one place, easier to manage |

---

## RISKS & MITIGATIONS

| Risk | How Bad? | Mitigation |
|------|----------|------------|
| Shopify API issues during demo | Medium | Test store verified working; demo mode fallback |
| Protocol specs change mid-build | Low | Our architecture isolates protocol code; easy to update |
| Demo crashes during pitch | High | Pre-recorded backup video ready; practiced recovery |
| Investors want revenue proof | Medium | Focus on LOIs; show 10x ROI math clearly |
| "Why can't ISVs build this?" | Low | Cost/time comparison: $2K/mo vs $200K one-time |

---

## SUCCESS CRITERIA

### Technical (Dev Team Validates)
- [ ] Shopify adapter connects and syncs real products
- [ ] ACP endpoints pass protocol validation
- [ ] UCP endpoints return valid responses  
- [ ] Multi-tenant: ISV #1 cannot see ISV #2's data
- [ ] Deployed and accessible via public URL

### Demo (CEO Validates)
- [ ] Can connect Shopify store in under 2 minutes (live)
- [ ] Products searchable immediately after connection
- [ ] Complete purchase flow works without errors
- [ ] Split-screen shows real-time order updates
- [ ] Can run demo 5+ times without issues

### Business (Investors Validate)
- [ ] "This is a real product, not just a prototype"
- [ ] "The integration really is that simple"
- [ ] "They understand the market timing"
- [ ] "Clear path to revenue"
- [ ] "I want to learn more"

---

## NEXT STEPS

1. **Review this briefing** — Questions? Concerns? Gaps?
2. **Confirm Shopify test store** — URL, credentials, products populated
3. **Development kicks off** — 2-week sprint starts
4. **Mid-sprint check-in** — Day 7, verify core flow works
5. **Demo rehearsal** — Day 12, full dry-run with CEO
6. **Ready for investors** — Day 14

---

## APPENDIX: EVOLUTION FROM DEMOS TO MVP

### What We Built Before (Context)

**Demo 1: "The Pain Visualizer"**
- Showed how many steps it takes WITHOUT Agentix
- Early exploration, throwaway code
- **Learning:** The comparison story resonates

**Demo 2: "Proof It Works"**
- Real ACP protocol endpoints
- Real Vendure e-commerce integration
- Split-screen demo view
- **Learning:** The adapter pattern works; checkout state machine is solid

### What MVP Adds

| Demo 2 Had | MVP Adds |
|------------|----------|
| Single tenant (one ISV) | Multi-tenant (many ISVs) |
| Vendure only | Shopify + WooCommerce + Vendure |
| ACP only | ACP + UCP |
| No onboarding | Self-serve signup flow |
| Basic dashboard | Full dashboard with settings |
| Local only | Deployed to cloud |

**The MVP is Demo 2 grown up into a real product.**

---

*Document Version: 2.0*  
*Last Updated: January 31, 2026*
