#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION=${VERSION:-latest}
REGISTRY=${REGISTRY:-}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building Docker Images${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Version: ${VERSION}"
if [ -n "$REGISTRY" ]; then
    echo "Registry: ${REGISTRY}"
fi
echo ""

# Function to build and optionally push image
build_image() {
    local name=$1
    local dockerfile=$2
    local image_name="${REGISTRY:+$REGISTRY/}webscada/${name}:${VERSION}"

    echo -e "${YELLOW}Building ${name}...${NC}"
    docker build -t "${image_name}" -f "${dockerfile}" .

    if [ -n "$REGISTRY" ]; then
        echo -e "${YELLOW}Pushing ${name} to registry...${NC}"
        docker push "${image_name}"
    fi

    echo -e "${GREEN}✓ ${name} built successfully${NC}"
    echo ""
}

# Build all images
build_image "frontend" "infrastructure/docker/frontend.Dockerfile"
build_image "backend" "infrastructure/docker/backend.Dockerfile"
build_image "simulator" "infrastructure/docker/simulator.Dockerfile"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All images built successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Display built images
echo "Images:"
docker images | grep webscada
