#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Storage Configuration for WebSCADA${NC}"
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

# Storage configuration
STORAGE_PATH=${STORAGE_PATH:-"/var/lib/webscada"}
STORAGE_SIZE=${STORAGE_SIZE:-"50Gi"}

echo -e "${YELLOW}Configuring local storage...${NC}"
echo "  Path: $STORAGE_PATH"
echo "  Size: $STORAGE_SIZE"
echo ""

# Create storage directories
mkdir -p "$STORAGE_PATH"/{postgres,redis,prometheus,grafana,volumes}
chmod 777 "$STORAGE_PATH/volumes"

echo -e "${GREEN}✓ Storage directories created${NC}"

# Install local-path-provisioner
echo -e "${YELLOW}Installing local-path provisioner...${NC}"

kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.26/deploy/local-path-storage.yaml

# Wait for provisioner to be ready
kubectl wait --for=condition=ready pod -l app=local-path-provisioner -n local-path-storage --timeout=60s

# Configure storage class
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: rancher.io/local-path
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Retain
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: local-path-config
  namespace: local-path-storage
data:
  config.json: |-
    {
      "nodePathMap":[
        {
          "node":"DEFAULT_PATH_FOR_NON_LISTED_NODES",
          "paths":["${STORAGE_PATH}/volumes"]
        }
      ]
    }
  setup: |-
    #!/bin/sh
    set -eu
    mkdir -m 0777 -p "\$VOL_DIR"
  teardown: |-
    #!/bin/sh
    set -eu
    rm -rf "\$VOL_DIR"
  helperPod.yaml: |-
    apiVersion: v1
    kind: Pod
    metadata:
      name: helper-pod
    spec:
      containers:
      - name: helper-pod
        image: busybox
        imagePullPolicy: IfNotPresent
EOF

echo -e "${GREEN}✓ Storage class configured${NC}"

# Create PVCs for WebSCADA components
echo -e "${YELLOW}Creating persistent volume claims...${NC}"

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
  namespace: webscada-dev
  labels:
    app: postgres
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-data
  namespace: webscada-dev
  labels:
    app: redis
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 5Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-data
  namespace: webscada-dev
  labels:
    app: prometheus
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 20Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-data
  namespace: webscada-dev
  labels:
    app: grafana
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: local-path
  resources:
    requests:
      storage: 5Gi
EOF

echo -e "${GREEN}✓ Persistent volume claims created${NC}"

# Display storage info
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Storage Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Storage Classes:"
kubectl get storageclass
echo ""
echo "Persistent Volume Claims:"
kubectl get pvc -n webscada-dev 2>/dev/null || echo "  (Claims will be bound when pods are created)"
echo ""
echo "Storage Path: $STORAGE_PATH"
echo ""
echo "To check storage usage:"
echo "  du -sh ${STORAGE_PATH}/*"
