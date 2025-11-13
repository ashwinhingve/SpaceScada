#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Grafana Installation with SCADA Dashboards${NC}"
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

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}Helm is required but not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}Adding Grafana Helm repository...${NC}"
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Admin password
GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-"admin"}

echo -e "${YELLOW}Installing Grafana...${NC}"

# Create values file for Grafana
cat > /tmp/grafana-values.yaml <<EOF
# Grafana Configuration for WebSCADA

# Admin credentials
adminUser: admin
adminPassword: ${GRAFANA_PASSWORD}

# Resources
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 300m
    memory: 512Mi

# Persistence
persistence:
  enabled: true
  storageClassName: local-path
  size: 5Gi

# Service
service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

# Data sources
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-kube-prometheus-prometheus.monitoring:9090
        access: proxy
        isDefault: true
        editable: true

# Dashboard providers
dashboardProviders:
  dashboardproviders.yaml:
    apiVersion: 1
    providers:
      - name: 'webscada'
        orgId: 1
        folder: 'WebSCADA'
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/webscada

# Sidecar for dashboard auto-discovery
sidecar:
  dashboards:
    enabled: true
    label: grafana_dashboard
    folder: /tmp/dashboards
    folderAnnotation: grafana_folder
    provider:
      foldersFromFilesStructure: true

# Plugins
plugins:
  - grafana-piechart-panel
  - grafana-worldmap-panel
  - grafana-clock-panel

# Environment variables
env:
  GF_EXPLORE_ENABLED: "true"
  GF_PANELS_DISABLE_SANITIZE_HTML: "true"
  GF_LOG_LEVEL: "info"
  GF_SERVER_ROOT_URL: "http://grafana.webscada.local"

# Ingress - disabled, using LoadBalancer
ingress:
  enabled: false
EOF

helm upgrade --install grafana grafana/grafana \
  --namespace monitoring \
  --values /tmp/grafana-values.yaml \
  --wait \
  --timeout 5m

echo -e "${GREEN}✓ Grafana installed${NC}"

# Wait for Grafana to be ready
echo -e "${YELLOW}Waiting for Grafana pod...${NC}"
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=grafana -n monitoring --timeout=180s

# Get Grafana LoadBalancer IP
echo -e "${YELLOW}Getting Grafana service details...${NC}"
sleep 5
GRAFANA_IP=$(kubectl get service -n monitoring grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

if [ -z "$GRAFANA_IP" ]; then
    echo -e "${YELLOW}LoadBalancer IP not yet assigned${NC}"
    GRAFANA_IP="<pending>"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Grafana Installed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Grafana Access:"
echo "  URL:      http://${GRAFANA_IP}"
echo "  Username: admin"
echo "  Password: ${GRAFANA_PASSWORD}"
echo ""
echo "Or use port-forward:"
echo "  kubectl port-forward -n monitoring svc/grafana 3000:80"
echo "  Then visit: http://localhost:3000"
echo ""
echo "Next steps:"
echo "1. Install SCADA dashboards: ../dashboards/install-dashboards.sh"
echo "2. Configure datasource connections"
echo "3. Set up alerting channels"
echo ""
echo "Check status:"
echo "  kubectl get pods -n monitoring -l app.kubernetes.io/name=grafana"
echo "  kubectl logs -n monitoring -l app.kubernetes.io/name=grafana -f"
