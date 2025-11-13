#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}WebSCADA Development Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or higher is required${NC}"
    echo "Current version: $(node -v)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm@8.12.0
fi

echo -e "${GREEN}✓ pnpm $(pnpm -v) detected${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Create environment files
echo -e "${YELLOW}Setting up environment files...${NC}"

if [ ! -f "apps/frontend/.env.local" ]; then
    cp apps/frontend/.env.example apps/frontend/.env.local
    echo -e "${GREEN}✓ Created apps/frontend/.env.local${NC}"
else
    echo -e "${YELLOW}apps/frontend/.env.local already exists${NC}"
fi

if [ ! -f "apps/backend/.env.local" ]; then
    cp apps/backend/.env.example apps/backend/.env.local
    echo -e "${GREEN}✓ Created apps/backend/.env.local${NC}"
else
    echo -e "${YELLOW}apps/backend/.env.local already exists${NC}"
fi

if [ ! -f "apps/simulator/.env.local" ]; then
    cp apps/simulator/.env.example apps/simulator/.env.local
    echo -e "${GREEN}✓ Created apps/simulator/.env.local${NC}"
else
    echo -e "${YELLOW}apps/simulator/.env.local already exists${NC}"
fi

echo ""

# Build shared packages
echo -e "${YELLOW}Building shared packages...${NC}"
pnpm --filter @webscada/shared-types build
pnpm --filter @webscada/utils build
pnpm --filter @webscada/protocols build

echo -e "${GREEN}✓ Shared packages built${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Development setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start databases: pnpm docker:up"
echo "2. Start development: pnpm dev"
echo ""
echo "Or run everything with Docker Compose:"
echo "  docker-compose up"
