#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}K3s Complete Uninstallation${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "${YELLOW}WARNING: This will remove:${NC}"
echo "  - K3s cluster and all resources"
echo "  - All persistent data"
echo "  - Storage directories"
echo "  - Configuration files"
echo "  - Installed tools (kubeseal)"
echo ""

read -p "Are you absolutely sure? Type 'yes' to continue: " -r
if [[ ! $REPLY = "yes" ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Starting uninstallation...${NC}"
echo ""

# Stop K3s if running
if systemctl is-active --quiet k3s 2>/dev/null; then
    echo -e "${YELLOW}Stopping K3s service...${NC}"
    sudo systemctl stop k3s
fi

# Uninstall K3s
if [ -f /usr/local/bin/k3s-uninstall.sh ]; then
    echo -e "${YELLOW}Uninstalling K3s...${NC}"
    sudo /usr/local/bin/k3s-uninstall.sh
    echo -e "${GREEN}✓ K3s uninstalled${NC}"
else
    echo -e "${YELLOW}K3s uninstall script not found${NC}"
fi

# Remove storage directories
echo -e "${YELLOW}Removing storage directories...${NC}"
sudo rm -rf /var/lib/webscada
sudo rm -rf /opt/local-path-provisioner
echo -e "${GREEN}✓ Storage directories removed${NC}"

# Remove kubeconfig
echo -e "${YELLOW}Removing kubeconfig...${NC}"
rm -f ~/.kube/config
echo -e "${GREEN}✓ Kubeconfig removed${NC}"

# Remove DNS configuration
echo -e "${YELLOW}Removing DNS configuration...${NC}"
if [ -f /etc/hosts ]; then
    sudo sed -i '/# WebSCADA Local DNS/,/# End WebSCADA/d' /etc/hosts
    echo -e "${GREEN}✓ /etc/hosts cleaned${NC}"
fi

if [ -f /etc/dnsmasq.d/webscada.conf ]; then
    sudo rm /etc/dnsmasq.d/webscada.conf
    if systemctl is-active --quiet dnsmasq; then
        sudo systemctl restart dnsmasq
    fi
    echo -e "${GREEN}✓ dnsmasq configuration removed${NC}"
fi

if [ -f /etc/systemd/resolved.conf.d/webscada.conf ]; then
    sudo rm /etc/systemd/resolved.conf.d/webscada.conf
    if systemctl is-active --quiet systemd-resolved; then
        sudo systemctl restart systemd-resolved
    fi
    echo -e "${GREEN}✓ systemd-resolved configuration removed${NC}"
fi

# Remove kubeseal CLI
if command -v kubeseal &> /dev/null; then
    echo -e "${YELLOW}Removing kubeseal CLI...${NC}"
    sudo rm -f /usr/local/bin/kubeseal
    echo -e "${GREEN}✓ kubeseal removed${NC}"
fi

# Remove helper scripts
if [ -f /usr/local/bin/create-sealed-secret ]; then
    echo -e "${YELLOW}Removing helper scripts...${NC}"
    sudo rm -f /usr/local/bin/create-sealed-secret
    echo -e "${GREEN}✓ Helper scripts removed${NC}"
fi

# Remove temporary files
echo -e "${YELLOW}Removing temporary files...${NC}"
rm -f /tmp/sealed-secrets-public.pem
rm -f /tmp/webscada-ca.crt
rm -f /tmp/*-sealed-secret.yaml
rm -f /tmp/prometheus-values.yaml
rm -f /tmp/grafana-values.yaml
echo -e "${GREEN}✓ Temporary files removed${NC}"

# Optional: Remove kubectl
read -p "Remove kubectl as well? (yes/no): " -r
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    if [ -f /usr/local/bin/kubectl ]; then
        sudo rm /usr/local/bin/kubectl
        echo -e "${GREEN}✓ kubectl removed${NC}"
    fi
fi

# Optional: Remove helm
read -p "Remove helm as well? (yes/no): " -r
if [[ $REPLY =~ ^[Hh][Ee][Ll][Mm]$ ]]; then
    if [ -f /usr/local/bin/helm ]; then
        sudo rm /usr/local/bin/helm
        echo -e "${GREEN}✓ helm removed${NC}"
    fi
fi

# Clean up bash history references (optional)
if [ -f ~/.bashrc ]; then
    if grep -q "kubectl completion bash" ~/.bashrc; then
        read -p "Remove kubectl completion from .bashrc? (yes/no): " -r
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            sed -i '/# Kubectl completion/,+5d' ~/.bashrc
            echo -e "${GREEN}✓ kubectl completion removed from .bashrc${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Uninstallation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "The following were removed:"
echo "  ✓ K3s cluster"
echo "  ✓ All Kubernetes resources"
echo "  ✓ Persistent data"
echo "  ✓ Storage directories"
echo "  ✓ DNS configuration"
echo "  ✓ kubeseal CLI"
echo ""
echo "To reinstall:"
echo "  make k3s-up"
