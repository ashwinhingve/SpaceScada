#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Sealed Secrets Installation${NC}"
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

SEALED_SECRETS_VERSION=${SEALED_SECRETS_VERSION:-"v0.24.5"}

echo -e "${YELLOW}Installing Sealed Secrets controller ${SEALED_SECRETS_VERSION}...${NC}"

# Install Sealed Secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/${SEALED_SECRETS_VERSION}/controller.yaml

# Wait for controller to be ready
echo -e "${YELLOW}Waiting for Sealed Secrets controller...${NC}"
kubectl wait --for=condition=ready pod -l name=sealed-secrets-controller -n kube-system --timeout=180s

echo -e "${GREEN}✓ Sealed Secrets controller installed${NC}"

# Install kubeseal CLI
echo -e "${YELLOW}Installing kubeseal CLI...${NC}"

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

# Download kubeseal
KUBESEAL_URL="https://github.com/bitnami-labs/sealed-secrets/releases/download/${SEALED_SECRETS_VERSION}/kubeseal-${SEALED_SECRETS_VERSION#v}-linux-${ARCH}.tar.gz"

curl -L "$KUBESEAL_URL" | tar xz -C /tmp
sudo mv /tmp/kubeseal /usr/local/bin/
sudo chmod +x /usr/local/bin/kubeseal

echo -e "${GREEN}✓ kubeseal CLI installed${NC}"

# Verify installation
KUBESEAL_VERSION=$(kubeseal --version 2>&1 | grep -oP '(?<=version: )[^ ]+' || echo "unknown")
echo -e "${GREEN}kubeseal version: ${KUBESEAL_VERSION}${NC}"

# Fetch public key
echo -e "${YELLOW}Fetching encryption public key...${NC}"
sleep 5

kubeseal --fetch-cert --controller-namespace=kube-system > /tmp/sealed-secrets-public.pem

echo -e "${GREEN}✓ Public key saved to /tmp/sealed-secrets-public.pem${NC}"

# Create example sealed secret for WebSCADA
echo -e "${YELLOW}Creating example sealed secrets...${NC}"

# Database credentials
kubectl create secret generic postgres-credentials \
  --from-literal=username=webscada \
  --from-literal=password=webscada_password_$(date +%s) \
  --namespace=webscada-dev \
  --dry-run=client -o yaml | \
kubeseal --format yaml --cert=/tmp/sealed-secrets-public.pem > /tmp/postgres-sealed-secret.yaml

# Redis password
kubectl create secret generic redis-credentials \
  --from-literal=password=redis_password_$(date +%s) \
  --namespace=webscada-dev \
  --dry-run=client -o yaml | \
kubeseal --format yaml --cert=/tmp/sealed-secrets-public.pem > /tmp/redis-sealed-secret.yaml

echo -e "${GREEN}✓ Example sealed secrets created in /tmp${NC}"

# Create helper script
cat > /tmp/create-sealed-secret.sh <<'EOFSCRIPT'
#!/bin/bash

# Helper script to create sealed secrets for WebSCADA

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ $# -lt 3 ]; then
    echo "Usage: $0 <secret-name> <namespace> <key=value> [<key=value> ...]"
    echo ""
    echo "Example:"
    echo "  $0 database-creds webscada-dev username=admin password=secret123"
    exit 1
fi

SECRET_NAME=$1
NAMESPACE=$2
shift 2

# Build --from-literal arguments
LITERALS=""
for arg in "$@"; do
    LITERALS="$LITERALS --from-literal=$arg"
done

echo -e "${YELLOW}Creating sealed secret: ${SECRET_NAME} in namespace ${NAMESPACE}${NC}"

# Create and seal the secret
kubectl create secret generic "$SECRET_NAME" \
    $LITERALS \
    --namespace="$NAMESPACE" \
    --dry-run=client -o yaml | \
kubeseal --format yaml --cert=/tmp/sealed-secrets-public.pem > "${SECRET_NAME}-sealed.yaml"

echo -e "${GREEN}✓ Sealed secret created: ${SECRET_NAME}-sealed.yaml${NC}"
echo ""
echo "To apply:"
echo "  kubectl apply -f ${SECRET_NAME}-sealed.yaml"
echo ""
echo "To verify:"
echo "  kubectl get sealedsecret -n ${NAMESPACE}"
echo "  kubectl get secret ${SECRET_NAME} -n ${NAMESPACE}"
EOFSCRIPT

chmod +x /tmp/create-sealed-secret.sh
sudo mv /tmp/create-sealed-secret.sh /usr/local/bin/create-sealed-secret

echo -e "${GREEN}✓ Helper script installed: create-sealed-secret${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Sealed Secrets Installed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Controller Status:"
kubectl get pods -n kube-system -l name=sealed-secrets-controller
echo ""
echo "Public Key Location: /tmp/sealed-secrets-public.pem"
echo ""
echo "Usage:"
echo ""
echo "1. Create a sealed secret:"
echo "   create-sealed-secret my-secret webscada-dev key1=value1 key2=value2"
echo ""
echo "2. Or manually:"
echo "   kubectl create secret generic my-secret \\"
echo "     --from-literal=key=value \\"
echo "     --namespace=webscada-dev \\"
echo "     --dry-run=client -o yaml | \\"
echo "   kubeseal --format yaml --cert=/tmp/sealed-secrets-public.pem > my-sealed-secret.yaml"
echo ""
echo "3. Apply the sealed secret:"
echo "   kubectl apply -f my-sealed-secret.yaml"
echo ""
echo "4. The controller will decrypt it automatically"
echo ""
echo "Example sealed secrets:"
echo "  /tmp/postgres-sealed-secret.yaml"
echo "  /tmp/redis-sealed-secret.yaml"
echo ""
echo "Check controller logs:"
echo "  kubectl logs -n kube-system -l name=sealed-secrets-controller -f"
