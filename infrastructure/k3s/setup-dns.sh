#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}DNS Configuration for WebSCADA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Detect environment
IS_WSL=false
if grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
    IS_WSL=true
    echo -e "${YELLOW}WSL2 environment detected${NC}"
fi

# Get LoadBalancer IP for frontend service
echo -e "${YELLOW}Detecting service IPs...${NC}"

# Wait for services to have IPs
kubectl get service -n webscada-dev frontend &>/dev/null || true
kubectl get service -n webscada-dev backend &>/dev/null || true

FRONTEND_IP=$(kubectl get service -n webscada-dev frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
BACKEND_IP=$(kubectl get service -n webscada-dev backend -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_IP" ]; then
    FRONTEND_IP="192.168.1.240"
    echo -e "${YELLOW}Frontend service not found, using default IP: ${FRONTEND_IP}${NC}"
fi

if [ -z "$BACKEND_IP" ]; then
    BACKEND_IP="192.168.1.241"
    echo -e "${YELLOW}Backend service not found, using default IP: ${BACKEND_IP}${NC}"
fi

echo ""
echo "Service IPs:"
echo "  Frontend: $FRONTEND_IP"
echo "  Backend:  $BACKEND_IP"
echo ""

# Configure /etc/hosts
echo -e "${YELLOW}Configuring /etc/hosts...${NC}"

# Backup existing hosts file
cp /etc/hosts /etc/hosts.backup.$(date +%Y%m%d_%H%M%S)

# Remove old WebSCADA entries
sed -i '/# WebSCADA Local DNS/,/# End WebSCADA/d' /etc/hosts

# Add new entries
cat >> /etc/hosts <<EOF
# WebSCADA Local DNS - Auto-generated $(date)
${FRONTEND_IP}    webscada.local www.webscada.local
${FRONTEND_IP}    frontend.webscada.local
${BACKEND_IP}     api.webscada.local backend.webscada.local
${BACKEND_IP}     grafana.webscada.local
${BACKEND_IP}     prometheus.webscada.local
127.0.0.1         dashboard.webscada.local
# End WebSCADA
EOF

echo -e "${GREEN}✓ /etc/hosts configured${NC}"

# Check if dnsmasq is available
if command -v dnsmasq &> /dev/null; then
    echo -e "${YELLOW}dnsmasq detected, configuring wildcard DNS...${NC}"

    # Create dnsmasq configuration
    mkdir -p /etc/dnsmasq.d
    cat > /etc/dnsmasq.d/webscada.conf <<EOF
# WebSCADA DNS Configuration
address=/webscada.local/${FRONTEND_IP}
address=/frontend.webscada.local/${FRONTEND_IP}
address=/backend.webscada.local/${BACKEND_IP}
address=/api.webscada.local/${BACKEND_IP}
address=/grafana.webscada.local/${BACKEND_IP}
address=/prometheus.webscada.local/${BACKEND_IP}
EOF

    # Restart dnsmasq
    if systemctl is-active --quiet dnsmasq; then
        systemctl restart dnsmasq
        echo -e "${GREEN}✓ dnsmasq restarted${NC}"
    else
        echo -e "${YELLOW}dnsmasq is not running, please start it manually${NC}"
    fi
else
    echo -e "${YELLOW}dnsmasq not found, using /etc/hosts only${NC}"
    echo ""
    echo "To install dnsmasq:"
    if [ "$IS_WSL" = true ]; then
        echo "  sudo apt-get update && sudo apt-get install dnsmasq"
    else
        echo "  sudo apt-get install dnsmasq  # Debian/Ubuntu"
        echo "  sudo yum install dnsmasq      # RHEL/CentOS"
    fi
fi

# Configure systemd-resolved if present
if command -v resolvectl &> /dev/null; then
    echo -e "${YELLOW}Configuring systemd-resolved...${NC}"

    mkdir -p /etc/systemd/resolved.conf.d
    cat > /etc/systemd/resolved.conf.d/webscada.conf <<EOF
[Resolve]
DNS=127.0.0.1
Domains=~webscada.local
EOF

    if systemctl is-active --quiet systemd-resolved; then
        systemctl restart systemd-resolved
        echo -e "${GREEN}✓ systemd-resolved restarted${NC}"
    fi
fi

# Test DNS resolution
echo ""
echo -e "${YELLOW}Testing DNS resolution...${NC}"

test_dns() {
    local domain=$1
    if ping -c 1 -W 1 "$domain" &>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $domain"
        return 0
    else
        if getent hosts "$domain" &>/dev/null; then
            echo -e "  ${GREEN}✓${NC} $domain (hosts file)"
            return 0
        else
            echo -e "  ${RED}✗${NC} $domain"
            return 1
        fi
    fi
}

test_dns "webscada.local"
test_dns "frontend.webscada.local"
test_dns "api.webscada.local"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DNS Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Configured domains:"
echo "  Frontend:    http://webscada.local:3000"
echo "               http://frontend.webscada.local:3000"
echo "  Backend API: http://api.webscada.local:3001"
echo "               http://backend.webscada.local:3001"
echo "  Grafana:     http://grafana.webscada.local:3000"
echo "  Prometheus:  http://prometheus.webscada.local:9090"
echo "  Dashboard:   http://dashboard.webscada.local:8001"
echo ""

if [ "$IS_WSL" = true ]; then
    echo -e "${YELLOW}WSL2 Note:${NC}"
    echo "You may need to configure Windows hosts file for access from Windows:"
    echo "  C:\\Windows\\System32\\drivers\\etc\\hosts"
    echo ""
    echo "Add these lines:"
    echo "  ${FRONTEND_IP}  webscada.local"
    echo "  ${BACKEND_IP}   api.webscada.local"
fi

echo ""
echo "To update IPs after service changes:"
echo "  sudo ./setup-dns.sh"
