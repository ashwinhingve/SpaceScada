#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-webscada-dev}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}WebSCADA K3s Cleanup${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "This will delete all resources in namespace: ${NAMESPACE}"
echo ""

read -p "Are you sure you want to continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${YELLOW}Deleting deployments...${NC}"
kubectl delete -f infrastructure/k3s/manifests/simulator-deployment.yaml --ignore-not-found=true
kubectl delete -f infrastructure/k3s/manifests/frontend-deployment.yaml --ignore-not-found=true
kubectl delete -f infrastructure/k3s/manifests/backend-deployment.yaml --ignore-not-found=true

echo -e "${YELLOW}Deleting databases...${NC}"
kubectl delete -f infrastructure/k3s/manifests/redis-deployment.yaml --ignore-not-found=true
kubectl delete -f infrastructure/k3s/manifests/postgres-deployment.yaml --ignore-not-found=true

echo -e "${YELLOW}Deleting configuration...${NC}"
kubectl delete -f infrastructure/k3s/manifests/base/ --ignore-not-found=true

echo -e "${YELLOW}Deleting namespace...${NC}"
kubectl delete namespace ${NAMESPACE} --ignore-not-found=true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cleanup completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
