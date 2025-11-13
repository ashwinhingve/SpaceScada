#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-webscada}
ENVIRONMENT=${ENVIRONMENT:-development}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}WebSCADA Kubernetes Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Namespace: ${NAMESPACE}"
echo "Environment: ${ENVIRONMENT}"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if we can connect to the cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f infrastructure/k8s/namespace.yaml

# Create ConfigMap from init-db.sql
echo -e "${YELLOW}Creating PostgreSQL init script ConfigMap...${NC}"
kubectl create configmap postgres-init-script \
    --from-file=init.sql=infrastructure/docker/init-db.sql \
    --namespace=${NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy infrastructure
echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
kubectl apply -f infrastructure/k8s/postgres-deployment.yaml

echo -e "${YELLOW}Deploying Redis...${NC}"
kubectl apply -f infrastructure/k8s/redis-deployment.yaml

# Wait for databases to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s

echo -e "${YELLOW}Waiting for Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s

# Deploy applications
echo -e "${YELLOW}Deploying Backend...${NC}"
kubectl apply -f infrastructure/k8s/backend-deployment.yaml

echo -e "${YELLOW}Deploying Frontend...${NC}"
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml

echo -e "${YELLOW}Deploying Simulator...${NC}"
kubectl apply -f infrastructure/k8s/simulator-deployment.yaml

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment/backend -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=available deployment/frontend -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=available deployment/simulator -n ${NAMESPACE} --timeout=300s

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Display service information
echo "Services:"
kubectl get services -n ${NAMESPACE}
echo ""

echo "Pods:"
kubectl get pods -n ${NAMESPACE}
echo ""

# Get the frontend service URL
FRONTEND_SERVICE=$(kubectl get service frontend -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$FRONTEND_SERVICE" ]; then
    FRONTEND_SERVICE=$(kubectl get service frontend -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
fi

if [ -n "$FRONTEND_SERVICE" ]; then
    echo -e "${GREEN}Frontend available at: http://${FRONTEND_SERVICE}:3000${NC}"
else
    echo -e "${YELLOW}Frontend service type is LoadBalancer, waiting for external IP...${NC}"
    echo "Run: kubectl get service frontend -n ${NAMESPACE} --watch"
fi

echo ""
echo "To view logs:"
echo "  kubectl logs -f deployment/backend -n ${NAMESPACE}"
echo "  kubectl logs -f deployment/frontend -n ${NAMESPACE}"
echo ""
echo "To port-forward services locally:"
echo "  kubectl port-forward service/frontend 3000:3000 -n ${NAMESPACE}"
echo "  kubectl port-forward service/backend 3001:3001 -n ${NAMESPACE}"
