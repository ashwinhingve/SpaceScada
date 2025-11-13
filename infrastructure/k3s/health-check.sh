#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status indicators
CHECK="✓"
CROSS="✗"
WARN="⚠"

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Functions
check_command() {
    local cmd=$1
    local name=$2

    TOTAL=$((TOTAL + 1))
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}${CHECK}${NC} $name installed"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}${CROSS}${NC} $name not found"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_service() {
    local service=$1
    local name=$2

    TOTAL=$((TOTAL + 1))
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}${CHECK}${NC} $name is running"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}${CROSS}${NC} $name is not running"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_pods() {
    local namespace=$1
    local label=$2
    local name=$3

    TOTAL=$((TOTAL + 1))
    local ready=$(kubectl get pods -n "$namespace" -l "$label" -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' 2>/dev/null | grep -o "True" | wc -l)
    local total=$(kubectl get pods -n "$namespace" -l "$label" --no-headers 2>/dev/null | wc -l)

    if [ "$total" -eq 0 ]; then
        echo -e "${YELLOW}${WARN}${NC} $name: No pods found"
        WARNINGS=$((WARNINGS + 1))
        return 1
    elif [ "$ready" -eq "$total" ]; then
        echo -e "${GREEN}${CHECK}${NC} $name: $ready/$total pods ready"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}${CROSS}${NC} $name: $ready/$total pods ready"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

check_service_lb() {
    local namespace=$1
    local service=$2
    local name=$3

    TOTAL=$((TOTAL + 1))
    local ip=$(kubectl get svc -n "$namespace" "$service" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

    if [ -n "$ip" ]; then
        echo -e "${GREEN}${CHECK}${NC} $name LoadBalancer: $ip"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${YELLOW}${WARN}${NC} $name LoadBalancer: No IP assigned"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WebSCADA K3s Health Check${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}=== Prerequisites ===${NC}"
check_command "k3s" "K3s"
check_command "kubectl" "kubectl"
check_command "helm" "Helm"
echo ""

# Check K3s service
echo -e "${BLUE}=== K3s Service ===${NC}"
check_service "k3s" "K3s service"
echo ""

# Check kubectl connectivity
echo -e "${BLUE}=== Cluster Connectivity ===${NC}"
TOTAL=$((TOTAL + 1))
if kubectl get nodes &> /dev/null; then
    echo -e "${GREEN}${CHECK}${NC} kubectl can connect to cluster"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}${CROSS}${NC} kubectl cannot connect to cluster"
    FAILED=$((FAILED + 1))
fi
echo ""

# Check nodes
echo -e "${BLUE}=== Cluster Nodes ===${NC}"
TOTAL=$((TOTAL + 1))
READY_NODES=$(kubectl get nodes --no-headers 2>/dev/null | grep -c " Ready " || echo "0")
TOTAL_NODES=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo "0")

if [ "$READY_NODES" -eq "$TOTAL_NODES" ] && [ "$TOTAL_NODES" -gt 0 ]; then
    echo -e "${GREEN}${CHECK}${NC} All nodes ready: $READY_NODES/$TOTAL_NODES"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}${CROSS}${NC} Nodes ready: $READY_NODES/$TOTAL_NODES"
    FAILED=$((FAILED + 1))
fi
kubectl get nodes 2>/dev/null | grep -v "NAME" | while read -r line; do
    echo "  $line"
done
echo ""

# Check system pods
echo -e "${BLUE}=== System Pods ===${NC}"
check_pods "kube-system" "k8s-app=kube-dns" "CoreDNS"
check_pods "kube-system" "app=local-path-provisioner" "Local Path Provisioner"
echo ""

# Check MetalLB
echo -e "${BLUE}=== MetalLB ===${NC}"
check_pods "metallb-system" "app=metallb" "MetalLB"

TOTAL=$((TOTAL + 1))
if kubectl get ipaddresspool -n metallb-system &> /dev/null; then
    IP_RANGE=$(kubectl get ipaddresspool -n metallb-system -o jsonpath='{.items[0].spec.addresses[0]}' 2>/dev/null)
    echo -e "${GREEN}${CHECK}${NC} MetalLB IP Pool: $IP_RANGE"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}${WARN}${NC} MetalLB IP Pool not configured"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check storage
echo -e "${BLUE}=== Storage ===${NC}"
TOTAL=$((TOTAL + 1))
if kubectl get storageclass local-path &> /dev/null; then
    echo -e "${GREEN}${CHECK}${NC} StorageClass 'local-path' exists"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}${CROSS}${NC} StorageClass 'local-path' not found"
    FAILED=$((FAILED + 1))
fi

TOTAL=$((TOTAL + 1))
if [ -d "/var/lib/webscada" ]; then
    STORAGE_USAGE=$(du -sh /var/lib/webscada 2>/dev/null | cut -f1)
    echo -e "${GREEN}${CHECK}${NC} Storage directory exists (used: $STORAGE_USAGE)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}${WARN}${NC} Storage directory /var/lib/webscada not found"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check namespaces
echo -e "${BLUE}=== Namespaces ===${NC}"
for ns in webscada-dev monitoring cert-manager; do
    TOTAL=$((TOTAL + 1))
    if kubectl get namespace "$ns" &> /dev/null; then
        echo -e "${GREEN}${CHECK}${NC} Namespace '$ns' exists"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}${WARN}${NC} Namespace '$ns' not found"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Check WebSCADA applications
if kubectl get namespace webscada-dev &> /dev/null; then
    echo -e "${BLUE}=== WebSCADA Applications ===${NC}"
    check_pods "webscada-dev" "app=postgres" "PostgreSQL"
    check_pods "webscada-dev" "app=redis" "Redis"
    check_pods "webscada-dev" "app=backend" "Backend"
    check_pods "webscada-dev" "app=frontend" "Frontend"
    check_pods "webscada-dev" "app=simulator" "Simulator"

    echo ""
    echo -e "${BLUE}=== WebSCADA Services ===${NC}"
    check_service_lb "webscada-dev" "frontend" "Frontend"
    check_service_lb "webscada-dev" "backend" "Backend"
    echo ""
fi

# Check monitoring
if kubectl get namespace monitoring &> /dev/null; then
    echo -e "${BLUE}=== Monitoring Stack ===${NC}"
    check_pods "monitoring" "app.kubernetes.io/name=prometheus" "Prometheus"
    check_pods "monitoring" "app.kubernetes.io/name=grafana" "Grafana"
    check_pods "monitoring" "app.kubernetes.io/name=alertmanager" "Alertmanager"

    echo ""
    echo -e "${BLUE}=== Monitoring Services ===${NC}"
    check_service_lb "monitoring" "grafana" "Grafana"
    echo ""
fi

# Check cert-manager
if kubectl get namespace cert-manager &> /dev/null; then
    echo -e "${BLUE}=== Cert-Manager ===${NC}"
    check_pods "cert-manager" "app.kubernetes.io/instance=cert-manager" "Cert-Manager"

    TOTAL=$((TOTAL + 1))
    if kubectl get clusterissuer selfsigned-issuer &> /dev/null; then
        echo -e "${GREEN}${CHECK}${NC} ClusterIssuer 'selfsigned-issuer' exists"
        PASSED=$((PASSED + 1))
    else
        echo -e "${YELLOW}${WARN}${NC} ClusterIssuer 'selfsigned-issuer' not found"
        WARNINGS=$((WARNINGS + 1))
    fi
    echo ""
fi

# Check Sealed Secrets
echo -e "${BLUE}=== Sealed Secrets ===${NC}"
check_pods "kube-system" "name=sealed-secrets-controller" "Sealed Secrets Controller"
check_command "kubeseal" "kubeseal CLI"
echo ""

# DNS check
echo -e "${BLUE}=== DNS Resolution ===${NC}"
TOTAL=$((TOTAL + 1))
if getent hosts webscada.local &> /dev/null; then
    echo -e "${GREEN}${CHECK}${NC} webscada.local resolves"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}${WARN}${NC} webscada.local does not resolve"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Health Check Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Total Checks: $TOTAL"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${RED}Failed:${NC}   $FAILED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}${CHECK} All critical checks passed!${NC}"
    if [ "$WARNINGS" -gt 0 ]; then
        echo -e "${YELLOW}${WARN} Some optional components have warnings${NC}"
    fi
    exit 0
else
    echo -e "${RED}${CROSS} Some checks failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check logs: make logs"
    echo "  - Describe pods: make describe-pods"
    echo "  - View events: make events"
    echo "  - Read troubleshooting guide: cat TROUBLESHOOTING.md"
    exit 1
fi
