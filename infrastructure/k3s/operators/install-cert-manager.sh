#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cert-Manager Installation${NC}"
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

CERT_MANAGER_VERSION=${CERT_MANAGER_VERSION:-"v1.13.3"}

echo -e "${YELLOW}Installing cert-manager ${CERT_MANAGER_VERSION}...${NC}"

# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/${CERT_MANAGER_VERSION}/cert-manager.crds.yaml

# Install cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version ${CERT_MANAGER_VERSION} \
  --set installCRDs=false \
  --set resources.requests.cpu=100m \
  --set resources.requests.memory=128Mi \
  --set resources.limits.cpu=200m \
  --set resources.limits.memory=256Mi \
  --wait \
  --timeout 5m

echo -e "${GREEN}✓ Cert-manager installed${NC}"

# Wait for cert-manager to be ready
echo -e "${YELLOW}Waiting for cert-manager pods...${NC}"
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=180s

# Create self-signed ClusterIssuer for development
echo -e "${YELLOW}Creating self-signed ClusterIssuer...${NC}"

cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: webscada-ca-issuer
spec:
  ca:
    secretName: webscada-ca-secret
EOF

# Create CA certificate for WebSCADA
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: webscada-ca
  namespace: cert-manager
spec:
  isCA: true
  commonName: webscada-ca
  secretName: webscada-ca-secret
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
    group: cert-manager.io
EOF

echo -e "${GREEN}✓ ClusterIssuers created${NC}"

# Wait for CA certificate to be ready
echo -e "${YELLOW}Waiting for CA certificate...${NC}"
sleep 5
kubectl wait --for=condition=ready certificate/webscada-ca -n cert-manager --timeout=60s

# Create certificates for WebSCADA services
echo -e "${YELLOW}Creating service certificates...${NC}"

cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: webscada-frontend-tls
  namespace: webscada-dev
spec:
  secretName: webscada-frontend-tls
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days
  commonName: frontend.webscada.local
  dnsNames:
    - frontend.webscada.local
    - webscada.local
    - www.webscada.local
  issuerRef:
    name: webscada-ca-issuer
    kind: ClusterIssuer
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: webscada-backend-tls
  namespace: webscada-dev
spec:
  secretName: webscada-backend-tls
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days
  commonName: backend.webscada.local
  dnsNames:
    - backend.webscada.local
    - api.webscada.local
  issuerRef:
    name: webscada-ca-issuer
    kind: ClusterIssuer
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: grafana-tls
  namespace: monitoring
spec:
  secretName: grafana-tls
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days
  commonName: grafana.webscada.local
  dnsNames:
    - grafana.webscada.local
  issuerRef:
    name: webscada-ca-issuer
    kind: ClusterIssuer
EOF

echo -e "${GREEN}✓ Service certificates created${NC}"

# Display CA certificate for installation in browsers
echo ""
echo -e "${YELLOW}Exporting CA certificate for browser installation...${NC}"

kubectl get secret -n cert-manager webscada-ca-secret -o jsonpath='{.data.tls\.crt}' | base64 -d > /tmp/webscada-ca.crt

echo -e "${GREEN}✓ CA certificate exported to /tmp/webscada-ca.crt${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cert-Manager Installed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "ClusterIssuers:"
kubectl get clusterissuers
echo ""
echo "Certificates:"
kubectl get certificates -A
echo ""
echo "To trust the CA certificate in your browser:"
echo "1. Import /tmp/webscada-ca.crt"
echo "2. Mark it as trusted for identifying websites"
echo ""
echo "For curl/wget:"
echo "  curl --cacert /tmp/webscada-ca.crt https://webscada.local"
echo ""
echo "For Chrome/Edge (Linux):"
echo "  certutil -d sql:\$HOME/.pki/nssdb -A -t 'C,,' -n 'WebSCADA CA' -i /tmp/webscada-ca.crt"
echo ""
echo "For Firefox:"
echo "  Settings > Privacy & Security > Certificates > View Certificates > Import"
echo ""
echo "Check certificate status:"
echo "  kubectl describe certificate -n webscada-dev"
echo "  kubectl get certificaterequests -A"
