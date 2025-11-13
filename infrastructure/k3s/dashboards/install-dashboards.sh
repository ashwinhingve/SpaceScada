#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Installing WebSCADA Grafana Dashboards${NC}"
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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}Creating ConfigMaps for dashboards...${NC}"

# Create ConfigMap for each dashboard
for dashboard in "$SCRIPT_DIR"/*.json; do
    if [ -f "$dashboard" ]; then
        dashboard_name=$(basename "$dashboard" .json)
        echo -e "${YELLOW}  Installing: $dashboard_name${NC}"

        kubectl create configmap "grafana-dashboard-$dashboard_name" \
            --from-file="$dashboard" \
            --namespace=monitoring \
            --dry-run=client -o yaml | \
        kubectl label --local -f - grafana_dashboard=1 -o yaml | \
        kubectl apply -f -

        echo -e "${GREEN}  ✓ $dashboard_name installed${NC}"
    fi
done

# Restart Grafana to pick up new dashboards
echo ""
echo -e "${YELLOW}Restarting Grafana to load dashboards...${NC}"
kubectl rollout restart deployment/grafana -n monitoring
kubectl rollout status deployment/grafana -n monitoring --timeout=180s

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Dashboards Installed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Installed dashboards:"
ls -1 "$SCRIPT_DIR"/*.json | xargs -n1 basename | sed 's/.json$//'
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward -n monitoring svc/grafana 3000:80"
echo "  Then visit: http://localhost:3000"
echo ""
echo "Dashboards will be available in the 'WebSCADA' folder"
