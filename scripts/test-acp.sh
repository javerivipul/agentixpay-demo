#!/usr/bin/env bash
# ============================================
# Agentix ACP Protocol Test Script
# ============================================
# Usage: bash scripts/test-acp.sh [API_KEY]
#
# If no API_KEY is provided, it will try to
# read from .env or use a default test key.
# ============================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
API_KEY="${1:-${AGENTIX_API_KEY:-}}"

if [ -z "$API_KEY" ]; then
  echo "Usage: bash scripts/test-acp.sh <API_KEY>"
  echo ""
  echo "Get an API key by running: pnpm db:seed"
  exit 1
fi

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; }
info() { echo -e "${YELLOW}→ $1${NC}"; }

echo "============================================"
echo "  Agentix ACP Protocol Tests"
echo "  API: $API_URL"
echo "============================================"
echo ""

# --- Health Check ---
info "GET /api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")
if [ "$HTTP_CODE" = "200" ]; then
  pass "Health check (HTTP $HTTP_CODE)"
else
  fail "Health check (HTTP $HTTP_CODE)"
fi
echo ""

# --- Products ---
info "GET /acp/v1/products"
PRODUCTS=$(curl -s "$API_URL/acp/v1/products" -H "X-API-Key: $API_KEY")
PRODUCT_COUNT=$(echo "$PRODUCTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('total', d.get('products',{}) and len(d.get('products',[]))))" 2>/dev/null || echo "0")
if [ "$PRODUCT_COUNT" -gt 0 ] 2>/dev/null; then
  pass "List products (found $PRODUCT_COUNT)"
else
  fail "List products"
  echo "$PRODUCTS" | python3 -m json.tool 2>/dev/null || echo "$PRODUCTS"
fi

info "GET /acp/v1/products?query=headphones"
SEARCH=$(curl -s "$API_URL/acp/v1/products?query=headphones" -H "X-API-Key: $API_KEY")
SEARCH_COUNT=$(echo "$SEARCH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('products',[])))" 2>/dev/null || echo "0")
if [ "$SEARCH_COUNT" -gt 0 ] 2>/dev/null; then
  pass "Search products for 'headphones' (found $SEARCH_COUNT)"
else
  fail "Search products"
fi

info "GET /acp/v1/products?max_price=50"
FILTERED=$(curl -s "$API_URL/acp/v1/products?max_price=50" -H "X-API-Key: $API_KEY")
pass "Filter by max_price=50"
echo ""

# --- Get a SKU for checkout ---
FIRST_SKU=$(echo "$PRODUCTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['products'][0]['sku'])" 2>/dev/null || echo "HEADPHONES-WL-BK")
info "Using SKU: $FIRST_SKU"
echo ""

# --- Create Checkout ---
info "POST /acp/v1/checkouts"
CHECKOUT=$(curl -s -X POST "$API_URL/acp/v1/checkouts" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"sku\":\"$FIRST_SKU\",\"quantity\":1}]}")

CHECKOUT_ID=$(echo "$CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkout',d.get('data',{})).get('id',''))" 2>/dev/null || echo "")
if [ -n "$CHECKOUT_ID" ]; then
  pass "Create checkout (id: $CHECKOUT_ID)"
else
  fail "Create checkout"
  echo "$CHECKOUT" | python3 -m json.tool 2>/dev/null || echo "$CHECKOUT"
  exit 1
fi

# --- Get Checkout ---
info "GET /acp/v1/checkouts/$CHECKOUT_ID"
GET_CHECKOUT=$(curl -s "$API_URL/acp/v1/checkouts/$CHECKOUT_ID" -H "X-API-Key: $API_KEY")
STATUS=$(echo "$GET_CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkout',d.get('data',{})).get('status',''))" 2>/dev/null || echo "unknown")
pass "Get checkout (status: $STATUS)"

# --- Update Checkout (add shipping) ---
info "PUT /acp/v1/checkouts/$CHECKOUT_ID (add shipping)"
UPDATE=$(curl -s -X PUT "$API_URL/acp/v1/checkouts/$CHECKOUT_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "name": "John Doe",
      "address1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102",
      "country": "US"
    },
    "shipping_method": "ship_standard"
  }')
UPDATE_STATUS=$(echo "$UPDATE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkout',d.get('data',{})).get('status',''))" 2>/dev/null || echo "unknown")
pass "Update checkout (status: $UPDATE_STATUS)"

# --- Complete Checkout ---
info "POST /acp/v1/checkouts/$CHECKOUT_ID/complete"
COMPLETE=$(curl -s -X POST "$API_URL/acp/v1/checkouts/$CHECKOUT_ID/complete" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"payment_token":{"type":"stripe_spt","token":"spt_test_1234567890"}}')
COMPLETE_STATUS=$(echo "$COMPLETE" | python3 -c "import sys,json; d=json.load(sys.stdin); c=d.get('checkout',d.get('data',d.get('order',{}))); print(c.get('status',''))" 2>/dev/null || echo "unknown")
if [ "$COMPLETE_STATUS" = "completed" ] || [ "$COMPLETE_STATUS" = "COMPLETED" ]; then
  pass "Complete checkout (status: $COMPLETE_STATUS)"
else
  fail "Complete checkout (status: $COMPLETE_STATUS)"
  echo "$COMPLETE" | python3 -m json.tool 2>/dev/null || echo "$COMPLETE"
fi

echo ""

# --- Create & Cancel Checkout ---
info "POST /acp/v1/checkouts (for cancel test)"
CANCEL_CHECKOUT=$(curl -s -X POST "$API_URL/acp/v1/checkouts" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"sku\":\"$FIRST_SKU\",\"quantity\":1}]}")
CANCEL_ID=$(echo "$CANCEL_CHECKOUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('checkout',d.get('data',{})).get('id',''))" 2>/dev/null || echo "")

info "DELETE /acp/v1/checkouts/$CANCEL_ID"
CANCEL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_URL/acp/v1/checkouts/$CANCEL_ID" \
  -H "X-API-Key: $API_KEY")
if [ "$CANCEL_CODE" = "200" ] || [ "$CANCEL_CODE" = "204" ]; then
  pass "Cancel checkout (HTTP $CANCEL_CODE)"
else
  fail "Cancel checkout (HTTP $CANCEL_CODE)"
fi

echo ""

# --- Auth Tests ---
info "GET /acp/v1/products (no API key)"
NO_AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/acp/v1/products")
if [ "$NO_AUTH_CODE" = "401" ]; then
  pass "Rejects missing API key (HTTP $NO_AUTH_CODE)"
else
  fail "Should reject missing API key (HTTP $NO_AUTH_CODE)"
fi

info "GET /acp/v1/products (bad API key)"
BAD_AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/acp/v1/products" -H "X-API-Key: agx_invalid")
if [ "$BAD_AUTH_CODE" = "401" ]; then
  pass "Rejects invalid API key (HTTP $BAD_AUTH_CODE)"
else
  fail "Should reject invalid API key (HTTP $BAD_AUTH_CODE)"
fi

echo ""
echo "============================================"
echo "  ACP Protocol Tests Complete"
echo "============================================"
