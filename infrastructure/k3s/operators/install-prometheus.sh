#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Prometheus Operator Installation${NC}"
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
    echo -e "${YELLOW}Helm not found, installing...${NC}"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
fi

echo -e "${YELLOW}Adding Prometheus Helm repository...${NC}"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace monitoring name=monitoring --overwrite

echo -e "${YELLOW}Installing Prometheus Operator...${NC}"

# Create values file for Prometheus
cat > /tmp/prometheus-values.yaml <<EOF
# Prometheus Operator Configuration for WebSCADA

# Prometheus Server
prometheus:
  prometheusSpec:
    retention: 15d
    retentionSize: "15GB"

    resources:
      requests:
        cpu: 200m
        memory: 512Mi
      limits:
        cpu: 500m
        memory: 1Gi

    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: local-path
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 20Gi

    # Service monitors
    serviceMonitorSelectorNilUsesHelmValues: false
    serviceMonitorSelector: {}
    serviceMonitorNamespaceSelector: {}

    # Pod monitors
    podMonitorSelectorNilUsesHelmValues: false
    podMonitorSelector: {}
    podMonitorNamespaceSelector: {}

    # Additional scrape configs
    additionalScrapeConfigs:
      - job_name: 'webscada-backend'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - webscada-dev
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: backend
            action: keep
          - source_labels: [__meta_kubernetes_pod_ip]
            target_label: __address__
            replacement: '\${1}:3001'

      - job_name: 'webscada-simulator'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - webscada-dev
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            regex: simulator
            action: keep

# Alertmanager
alertmanager:
  enabled: true
  alertmanagerSpec:
    resources:
      requests:
        cpu: 50m
        memory: 128Mi
      limits:
        cpu: 100m
        memory: 256Mi

# Grafana - disabled here, will be installed separately
grafana:
  enabled: false

# Kube State Metrics
kubeStateMetrics:
  enabled: true

# Node Exporter
nodeExporter:
  enabled: true

# Prometheus Operator
prometheusOperator:
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi
EOF

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values /tmp/prometheus-values.yaml \
  --wait \
  --timeout 10m

echo -e "${GREEN}✓ Prometheus Operator installed${NC}"

# Wait for Prometheus to be ready
echo -e "${YELLOW}Waiting for Prometheus pods...${NC}"
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=prometheus -n monitoring --timeout=300s

# Create ServiceMonitor for WebSCADA backend
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webscada-backend
  namespace: webscada-dev
  labels:
    app: backend
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: webscada-frontend
  namespace: webscada-dev
  labels:
    app: frontend
spec:
  selector:
    matchLabels:
      app: frontend
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
EOF

echo -e "${GREEN}✓ ServiceMonitors created${NC}"

# Create PrometheusRule for WebSCADA alerts
cat <<EOF | kubectl apply -f -
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: webscada-alerts
  namespace: monitoring
  labels:
    prometheus: kube-prometheus
spec:
  groups:
    - name: webscada
      interval: 30s
      rules:
        - alert: WebSCADABackendDown
          expr: up{job="webscada-backend"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "WebSCADA Backend is down"
            description: "Backend service has been down for more than 1 minute"

        - alert: WebSCADAFrontendDown
          expr: up{job="webscada-frontend"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "WebSCADA Frontend is down"
            description: "Frontend service has been down for more than 1 minute"

        - alert: HighMemoryUsage
          expr: container_memory_usage_bytes{namespace="webscada-dev"} > 1073741824
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High memory usage detected"
            description: "Container is using more than 1GB of memory"

        - alert: HighCPUUsage
          expr: rate(container_cpu_usage_seconds_total{namespace="webscada-dev"}[5m]) > 0.8
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High CPU usage detected"
            description: "Container CPU usage is above 80%"
EOF

echo -e "${GREEN}✓ Alert rules created${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Prometheus Operator Installed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access Prometheus:"
echo "  kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "  Then visit: http://localhost:9090"
echo ""
echo "Access Alertmanager:"
echo "  kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093"
echo "  Then visit: http://localhost:9093"
echo ""
echo "Check status:"
echo "  kubectl get pods -n monitoring"
echo "  kubectl get servicemonitors -n webscada-dev"
