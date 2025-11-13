#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}K3s Installation for WebSCADA${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Check if K3s is already installed
if command -v k3s &> /dev/null; then
    echo -e "${YELLOW}K3s is already installed. Version: $(k3s --version | head -n1)${NC}"
    read -p "Do you want to reinstall? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
    echo -e "${YELLOW}Uninstalling existing K3s...${NC}"
    /usr/local/bin/k3s-uninstall.sh || true
fi

# Configuration
K3S_VERSION=${K3S_VERSION:-"v1.28.5+k3s1"}
INSTALL_K3S_SKIP_START=${INSTALL_K3S_SKIP_START:-false}

# K3s configuration directory
mkdir -p /etc/rancher/k3s

# Create K3s configuration file
cat > /etc/rancher/k3s/config.yaml <<EOF
# K3s Configuration for WebSCADA Development
# Optimized for SCADA workloads with 4 CPU, 8GB RAM

# Disable unnecessary components
disable:
  - traefik        # We'll use our own ingress
  - servicelb      # We'll use MetalLB
  - local-storage  # We'll configure our own

# Cluster settings
cluster-init: true
write-kubeconfig-mode: "0644"
tls-san:
  - "127.0.0.1"
  - "localhost"
  - "webscada.local"

# Resource limits for development
kube-apiserver-arg:
  - "max-requests-inflight=400"
  - "max-mutating-requests-inflight=200"

kube-controller-manager-arg:
  - "node-monitor-period=5s"
  - "node-monitor-grace-period=20s"

kubelet-arg:
  - "max-pods=110"
  - "eviction-hard=memory.available<500Mi"
  - "eviction-soft=memory.available<1Gi"
  - "eviction-soft-grace-period=memory.available=2m"
  - "system-reserved=cpu=500m,memory=512Mi"
  - "kube-reserved=cpu=500m,memory=512Mi"

# Container runtime settings
snapshotter: "overlayfs"

# Networking
flannel-backend: "vxlan"
cluster-cidr: "10.42.0.0/16"
service-cidr: "10.43.0.0/16"
cluster-dns: "10.43.0.10"

# Enable features
kube-apiserver-arg:
  - "feature-gates=EphemeralContainers=true"
EOF

echo -e "${GREEN}✓ K3s configuration created${NC}"

# Download and install K3s
echo -e "${YELLOW}Downloading and installing K3s ${K3S_VERSION}...${NC}"
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION="${K3S_VERSION}" sh -s - server

# Wait for K3s to be ready
echo -e "${YELLOW}Waiting for K3s to be ready...${NC}"
timeout=60
counter=0
until k3s kubectl get nodes &> /dev/null; do
    if [ $counter -eq $timeout ]; then
        echo -e "${RED}Timeout waiting for K3s to start${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done
echo ""

# Wait for system pods
echo -e "${YELLOW}Waiting for system pods...${NC}"
k3s kubectl wait --for=condition=ready pod --all -n kube-system --timeout=120s

echo -e "${GREEN}✓ K3s installed successfully${NC}"
echo ""

# Create kubeconfig for current user
REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

if [ -n "$REAL_USER" ] && [ "$REAL_USER" != "root" ]; then
    echo -e "${YELLOW}Setting up kubeconfig for user ${REAL_USER}...${NC}"

    mkdir -p "$REAL_HOME/.kube"
    cp /etc/rancher/k3s/k3s.yaml "$REAL_HOME/.kube/config"
    chown -R "$REAL_USER:$REAL_USER" "$REAL_HOME/.kube"
    chmod 600 "$REAL_HOME/.kube/config"

    echo -e "${GREEN}✓ Kubeconfig configured for ${REAL_USER}${NC}"
fi

# Create storage directories
echo -e "${YELLOW}Creating storage directories...${NC}"
mkdir -p /opt/local-path-provisioner
mkdir -p /var/lib/webscada/{postgres,redis,prometheus,grafana}
chown -R "$REAL_USER:$REAL_USER" /var/lib/webscada

echo -e "${GREEN}✓ Storage directories created${NC}"

# Display cluster info
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}K3s Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Cluster Information:"
k3s kubectl cluster-info
echo ""
echo "Nodes:"
k3s kubectl get nodes
echo ""
echo "System Pods:"
k3s kubectl get pods -n kube-system
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Configure MetalLB:    sudo ./setup-metallb.sh"
echo "2. Configure storage:    sudo ./setup-storage.sh"
echo "3. Configure DNS:        sudo ./setup-dns.sh"
echo "4. Install operators:    make operators"
echo ""
echo "Or run the complete setup:"
echo "  make k3s-up"
