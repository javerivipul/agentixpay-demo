#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check for environment variables
if [ ! -f "apps/demo/.env.local" ]; then
    echo -e "${RED}Error: apps/demo/.env.local not found${NC}"
    echo "Creating from .env.example..."
    if [ -f "apps/demo/.env.example" ]; then
        cp apps/demo/.env.example apps/demo/.env.local
    else
        echo -e "${RED}Please create apps/demo/.env.local with required variables${NC}"
        exit 1
    fi
fi

# Configuration
BRANCH="${VERCEL_BRANCH:-vercel-deploy}"
APP_DIR="${1:-apps/demo}"

# Deploy demo app
echo -e "${YELLOW}Deploying $APP_DIR from branch '$BRANCH'...${NC}"
cd $APP_DIR
vercel --prod --yes --branch $BRANCH

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "To deploy other apps:"
echo "  cd apps/dashboard && vercel --prod"
echo "  cd apps/api && vercel --prod"
