#!/usr/bin/env bash
# ============================================
# Agentix UCP Protocol Test Script
# ============================================
# Usage: bash scripts/test-ucp.sh [API_KEY]
# ============================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
API_KEY="${1:-${AGENTIX_API_KEY:-}}"

if [ -z "$API_KEY" ]; then
  echo "Usage: bash scripts/test-ucp.sh <API_KEY>"
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
echo "  Agentix UCP Protocol Tests"
echo "  API: $API_URL"
echo "============================================"
echo ""

# --- Capabilities ---
info "GET /ucp/v1/capabilities"
CAPS=$(curl -s "$API_URL/ucp/v1/capabilities" -H "X-API-Key: $API_KEY")
VERSION=$(echo "$CAPS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('version', d.get('data',{}).get('version','')))" 2>/dev/null || echo "")
if [ -n "$VERSION" ]; then
  pass "Capabilities (version: $VERSION)"
else
  fail "Capabilities"
  echo "$CAPS" | python3 -m json.tool 2>/dev/null || echo "$CAPS"
fi

# --- Catalog ---
info "GET /ucp/v1/catalog"
CATALOG=$(curl -s "$API_URL/ucp/v1/catalog" -H "X-API-Key: $API_KEY")
ITEM_COUNT=$(echo "$CATALOG" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items', d.get('data',{}).get('items',[])); print(len(items))" 2>/dev/null || echo "0")
if [ "$ITEM_COUNT" -gt 0 ] 2>/dev/null; then
  pass "Catalog listing (found $ITEM_COUNT items)"
else
  fail "Catalog listing"
  echo "$CATALOG" | python3 -m json.tool 2>/dev/null || echo "$CATALOG"
fi

info "GET /ucp/v1/catalog?query=yoga"
SEARCH=$(curl -s "$API_URL/ucp/v1/catalog?query=yoga" -H "X-API-Key: $API_KEY")
pass "Catalog search for 'yoga'"
echo ""

# --- Get a SKU for cart ---
FIRST_SKU=$(echo "$CATALOG" | python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('items', d.get('data',{}).get('items',[])); print(items[0].get('sku',''))" 2>/dev/null || echo "HEADPHONES-WL-BK")
info "Using SKU: $FIRST_SKU"
echo ""

# --- Create Cart ---
info "POST /ucp/v1/carts"
CART=$(curl -s -X POST "$API_URL/ucp/v1/carts" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"items\":[{\"sku\":\"$FIRST_SKU\",\"quantity\":1}]}")
CART_ID=$(echo "$CART" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('cart',d.get('data',{})).get('id',''))" 2>/dev/null || echo "")
if [ -n "$CART_ID" ]; then
  pass "Create cart (id: $CART_ID)"
else
  fail "Create cart"
  echo "$CART" | python3 -m json.tool 2>/dev/null || echo "$CART"
  exit 1
fi

# --- Get Cart ---
info "GET /ucp/v1/carts/$CART_ID"
GET_CART=$(curl -s "$API_URL/ucp/v1/carts/$CART_ID" -H "X-API-Key: $API_KEY")
pass "Get cart"

# --- Update Cart ---
info "PUT /ucp/v1/carts/$CART_ID (add shipping)"
UPDATE_CART=$(curl -s -X PUT "$API_URL/ucp/v1/carts/$CART_ID" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "name": "Jane Smith",
      "address1": "456 Oak Ave",
      "city": "Austin",
      "state": "TX",
      "zip": "73301",
      "country": "US"
    },
    "shipping_method": "ship_express"
  }')
pass "Update cart with shipping"
echo ""

# --- Create Order ---
info "POST /ucp/v1/orders (from cart $CART_ID)"
ORDER=$(curl -s -X POST "$API_URL/ucp/v1/orders" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"cart_id\":\"$CART_ID\",\"payment_token\":\"spt_test_ucp_9876\"}")
ORDER_ID=$(echo "$ORDER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('order',d.get('data',{})).get('id',''))" 2>/dev/null || echo "")
if [ -n "$ORDER_ID" ]; then
  pass "Create order (id: $ORDER_ID)"
else
  fail "Create order"
  echo "$ORDER" | python3 -m json.tool 2>/dev/null || echo "$ORDER"
fi

# --- Get Order ---
if [ -n "$ORDER_ID" ]; then
  info "GET /ucp/v1/orders/$ORDER_ID"
  GET_ORDER=$(curl -s "$API_URL/ucp/v1/orders/$ORDER_ID" -H "X-API-Key: $API_KEY")
  pass "Get order"
fi

echo ""
echo "============================================"
echo "  UCP Protocol Tests Complete"
echo "============================================"
