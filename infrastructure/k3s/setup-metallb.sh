#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MetalLB Setup for WebSCADA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    if command -v k3s &> /dev/null; then
        alias kubectl='k3s kubectl'
    else
        echo -e "${RED}kubectl not found${NC}"
        exit 1
    fi
fi

# MetalLB version
METALLB_VERSION=${METALLB_VERSION:-"v0.13.12"}

# Detect IP range for MetalLB
echo -e "${YELLOW}Detecting network configuration...${NC}"

# Get the primary network interface
DEFAULT_INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
if [ -z "$DEFAULT_INTERFACE" ]; then
    DEFAULT_INTERFACE="eth0"
fi

# Get IP address and calculate range
HOST_IP=$(ip -4 addr show "$DEFAULT_INTERFACE" | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -n1)

if [ -z "$HOST_IP" ]; then
    # Fallback for WSL2
    HOST_IP=$(hostname -I | awk '{print $1}')
fi

# Calculate IP range (use last 10 IPs in the subnet)
IP_PREFIX=$(echo "$HOST_IP" | cut -d. -f1-3)
IP_START="${IP_PREFIX}.240"
IP_END="${IP_PREFIX}.250"

echo -e "${GREEN}Detected network:${NC}"
echo "  Interface: $DEFAULT_INTERFACE"
echo "  Host IP:   $HOST_IP"
echo "  IP Range:  $IP_START - $IP_END"
echo ""

read -p "Use this IP range? (yes/no/custom): " -r
if [[ $REPLY =~ ^[Cc][Uu][Ss][Tt][Oo][Mm]$ ]]; then
    read -p "Enter start IP: " IP_START
    read -p "Enter end IP: " IP_END
elif [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Configuration cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Installing MetalLB ${METALLB_VERSION}...${NC}"

# Install MetalLB
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/${METALLB_VERSION}/config/manifests/metallb-native.yaml

# Wait for MetalLB to be ready
echo -e "${YELLOW}Waiting for MetalLB pods...${NC}"
kubectl wait --for=condition=ready pod -l app=metallb -n metallb-system --timeout=120s

# Create IPAddressPool
cat <<EOF | kubectl apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: webscada-pool
  namespace: metallb-system
spec:
  addresses:
  - ${IP_START}-${IP_END}
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: webscada-l2
  namespace: metallb-system
spec:
  ipAddressPools:
  - webscada-pool
EOF

echo -e "${GREEN}✓ MetalLB installed successfully${NC}"
echo ""

# Test LoadBalancer
echo -e "${YELLOW}Testing LoadBalancer...${NC}"

# Create test service
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: metallb-test
  labels:
    app: metallb-test
spec:
  containers:
  - name: nginx
    image: nginx:alpine
    ports:
    - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: metallb-test
spec:
  type: LoadBalancer
  selector:
    app: metallb-test
  ports:
  - port: 80
    targetPort: 80
EOF

echo -e "${YELLOW}Waiting for LoadBalancer IP...${NC}"
timeout=60
counter=0
until kubectl get service metallb-test -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null | grep -q .; do
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}Timeout waiting for LoadBalancer IP${NC}"
        kubectl delete pod metallb-test --ignore-not-found
        kubectl delete service metallb-test --ignore-not-found
        exit 1
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done
echo ""

LB_IP=$(kubectl get service metallb-test -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo -e "${GREEN}✓ LoadBalancer IP assigned: ${LB_IP}${NC}"

# Test connectivity
if curl -s --connect-timeout 5 "http://${LB_IP}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ LoadBalancer is accessible${NC}"
else
    echo -e "${YELLOW}⚠ LoadBalancer IP assigned but not accessible (this may be normal in some environments)${NC}"
fi

# Cleanup test resources
kubectl delete pod metallb-test
kubectl delete service metallb-test

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}MetalLB Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configuration:"
echo "  IP Range: ${IP_START} - ${IP_END}"
echo "  Pool Name: webscada-pool"
echo ""
echo "Services with type=LoadBalancer will now get IPs from this range."
