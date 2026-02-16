#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Vercel Deployment Script${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check Vercel login
echo -e "${YELLOW}Checking Vercel login...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

echo -e "${GREEN}Logged in as: $(vercel whoami)${NC}"
echo ""

# Get app directory from argument or default to demo
APP_DIR="${1:-apps/demo}"

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Directory $APP_DIR not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Deploying $APP_DIR to Vercel...${NC}"
cd "$APP_DIR"

# Remove old .vercel if exists (to re-link)
if [ -d ".vercel" ]; then
    echo "Removing old .vercel directory for fresh deploy..."
    rm -rf .vercel
fi

# Link to project (will prompt if needed)
vercel link --yes

# Deploy to production
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Your app is deployed to Vercel!"
echo ""
echo "To deploy other apps:"
echo "  ./scripts/deploy-vercel.sh apps/dashboard"
echo "  ./scripts/deploy-vercel.sh apps/api"
