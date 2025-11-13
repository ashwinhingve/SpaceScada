#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kubectl Configuration Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if K3s is installed
if ! command -v k3s &> /dev/null; then
    echo -e "${RED}K3s is not installed${NC}"
    exit 1
fi

# Get current user
CURRENT_USER="${SUDO_USER:-$USER}"
USER_HOME=$(getent passwd "$CURRENT_USER" | cut -d: -f6)

echo -e "${YELLOW}Setting up kubeconfig for user: ${CURRENT_USER}${NC}"

# Create .kube directory
mkdir -p "$USER_HOME/.kube"

# Copy K3s kubeconfig
if [ -f /etc/rancher/k3s/k3s.yaml ]; then
    cp /etc/rancher/k3s/k3s.yaml "$USER_HOME/.kube/config"
    chown -R "$CURRENT_USER:$CURRENT_USER" "$USER_HOME/.kube"
    chmod 600 "$USER_HOME/.kube/config"
    echo -e "${GREEN}✓ Kubeconfig copied to ${USER_HOME}/.kube/config${NC}"
else
    echo -e "${RED}K3s kubeconfig not found${NC}"
    exit 1
fi

# Set up bash completion
echo -e "${YELLOW}Setting up kubectl completion...${NC}"

# Check if kubectl completion is already in bashrc
if ! grep -q "kubectl completion bash" "$USER_HOME/.bashrc" 2>/dev/null; then
    cat >> "$USER_HOME/.bashrc" <<'EOF'

# Kubectl completion
if command -v kubectl &> /dev/null; then
    source <(kubectl completion bash)
    alias k=kubectl
    complete -F __start_kubectl k
fi
EOF
    echo -e "${GREEN}✓ kubectl completion added to .bashrc${NC}"
else
    echo -e "${YELLOW}kubectl completion already configured${NC}"
fi

# Install kubectl if not present
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}Installing kubectl...${NC}"

    # Detect architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        *)
            echo -e "${RED}Unsupported architecture: $ARCH${NC}"
            exit 1
            ;;
    esac

    # Download kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/

    echo -e "${GREEN}✓ kubectl installed${NC}"
fi

# Test kubectl access
echo -e "${YELLOW}Testing kubectl access...${NC}"
if su - "$CURRENT_USER" -c "kubectl get nodes" &>/dev/null; then
    echo -e "${GREEN}✓ kubectl is configured correctly${NC}"
else
    echo -e "${RED}kubectl test failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Kubectl Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Kubeconfig location: ${USER_HOME}/.kube/config"
echo ""
echo "Test your setup:"
echo "  kubectl get nodes"
echo "  kubectl get pods -A"
echo ""
echo "Reload your shell to enable bash completion:"
echo "  source ~/.bashrc"
