.PHONY: help k3s-up k3s-down k3s-reset k3s-dashboard operators verify deploy-scada monitor logs clean

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo '$(BLUE)=======================================$(NC)'
	@echo '$(BLUE)WebSCADA K3s Development Environment$(NC)'
	@echo '$(BLUE)=======================================$(NC)'
	@echo ''
	@echo 'Usage:'
	@echo '  make $(YELLOW)<target>$(NC)'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-18s$(NC) %s\n", $$1, $$2}'
	@echo ''

k3s-up: ## Install and start K3s cluster with all components
	@echo '$(BLUE)Starting K3s cluster setup...$(NC)'
	@sudo ./install-k3s.sh
	@echo ''
	@echo '$(BLUE)Setting up MetalLB...$(NC)'
	@sudo ./setup-metallb.sh
	@echo ''
	@echo '$(BLUE)Configuring storage...$(NC)'
	@sudo ./setup-storage.sh
	@echo ''
	@echo '$(BLUE)Creating namespace...$(NC)'
	@kubectl apply -f namespaces/webscada-dev.yaml
	@echo ''
	@echo '$(GREEN)K3s cluster is ready!$(NC)'
	@echo 'Next steps:'
	@echo '  make operators      - Install monitoring and security operators'
	@echo '  make deploy-scada   - Deploy WebSCADA applications'
	@echo '  make verify         - Verify all components'

k3s-down: ## Stop K3s cluster (keeps data)
	@echo '$(YELLOW)Stopping K3s cluster...$(NC)'
	@sudo systemctl stop k3s || true
	@echo '$(GREEN)K3s stopped$(NC)'

k3s-up-only: ## Start existing K3s cluster
	@echo '$(BLUE)Starting K3s cluster...$(NC)'
	@sudo systemctl start k3s
	@sleep 5
	@kubectl wait --for=condition=ready pod --all -n kube-system --timeout=120s
	@echo '$(GREEN)K3s started$(NC)'

k3s-reset: ## Complete cleanup and removal
	@echo '$(YELLOW)This will delete ALL K3s data and configurations!$(NC)'
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo '$(YELLOW)Removing K3s...$(NC)'; \
		sudo /usr/local/bin/k3s-uninstall.sh || true; \
		sudo rm -rf /var/lib/webscada /opt/local-path-provisioner; \
		echo '$(GREEN)K3s removed$(NC)'; \
	else \
		echo 'Cancelled'; \
	fi

k3s-dashboard: ## Deploy Kubernetes dashboard
	@echo '$(BLUE)Installing Kubernetes Dashboard...$(NC)'
	@kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
	@echo '$(GREEN)Dashboard installed$(NC)'
	@echo ''
	@echo 'Create admin user:'
	@kubectl apply -f - <<< 'apiVersion: v1\nkind: ServiceAccount\nmetadata:\n  name: admin-user\n  namespace: kubernetes-dashboard\n---\napiVersion: rbac.authorization.k8s.io/v1\nkind: ClusterRoleBinding\nmetadata:\n  name: admin-user\nroleRef:\n  apiGroup: rbac.authorization.k8s.io\n  kind: ClusterRole\n  name: cluster-admin\nsubjects:\n- kind: ServiceAccount\n  name: admin-user\n  namespace: kubernetes-dashboard'
	@echo ''
	@echo 'Get access token:'
	@echo '  kubectl -n kubernetes-dashboard create token admin-user'
	@echo ''
	@echo 'Start proxy:'
	@echo '  kubectl proxy'
	@echo ''
	@echo 'Access dashboard at:'
	@echo '  http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/'

operators: ## Install all operators (Prometheus, Grafana, cert-manager, Sealed Secrets)
	@echo '$(BLUE)Installing operators...$(NC)'
	@./operators/install-prometheus.sh
	@echo ''
	@./operators/install-grafana.sh
	@echo ''
	@./operators/install-cert-manager.sh
	@echo ''
	@./operators/install-sealed-secrets.sh
	@echo ''
	@./dashboards/install-dashboards.sh
	@echo ''
	@./setup-dns.sh
	@echo ''
	@echo '$(GREEN)All operators installed!$(NC)'

verify: ## Verify all components are running
	@echo '$(BLUE)Verifying K3s components...$(NC)'
	@./health-check.sh

deploy-scada: ## Deploy WebSCADA applications
	@echo '$(BLUE)Deploying WebSCADA stack...$(NC)'
	@kubectl apply -f manifests/base/
	@kubectl apply -f manifests/postgres-deployment.yaml
	@kubectl apply -f manifests/redis-deployment.yaml
	@echo '$(YELLOW)Waiting for databases...$(NC)'
	@kubectl wait --for=condition=ready pod -l app=postgres -n webscada-dev --timeout=300s
	@kubectl wait --for=condition=ready pod -l app=redis -n webscada-dev --timeout=300s
	@kubectl apply -f manifests/backend-deployment.yaml
	@kubectl apply -f manifests/frontend-deployment.yaml
	@kubectl apply -f manifests/simulator-deployment.yaml
	@kubectl apply -f manifests/ingress.yaml
	@echo '$(YELLOW)Waiting for applications...$(NC)'
	@kubectl wait --for=condition=available deployment --all -n webscada-dev --timeout=300s
	@echo ''
	@echo '$(GREEN)WebSCADA deployed successfully!$(NC)'
	@echo ''
	@make status

status: ## Show status of all components
	@echo '$(BLUE)=======================================$(NC)'
	@echo '$(BLUE)WebSCADA Cluster Status$(NC)'
	@echo '$(BLUE)=======================================$(NC)'
	@echo ''
	@echo '$(YELLOW)Namespaces:$(NC)'
	@kubectl get namespaces | grep -E 'NAME|webscada|monitoring|cert-manager|metallb'
	@echo ''
	@echo '$(YELLOW)WebSCADA Pods:$(NC)'
	@kubectl get pods -n webscada-dev
	@echo ''
	@echo '$(YELLOW)Services:$(NC)'
	@kubectl get svc -n webscada-dev
	@echo ''
	@echo '$(YELLOW)Monitoring:$(NC)'
	@kubectl get pods -n monitoring -l 'app.kubernetes.io/name in (prometheus,grafana)'
	@echo ''

monitor: ## Open Grafana in browser
	@echo '$(BLUE)Opening Grafana...$(NC)'
	@GRAFANA_IP=$$(kubectl get svc -n monitoring grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo ""); \
	if [ -n "$$GRAFANA_IP" ]; then \
		echo "Grafana URL: http://$$GRAFANA_IP"; \
		xdg-open "http://$$GRAFANA_IP" 2>/dev/null || open "http://$$GRAFANA_IP" 2>/dev/null || echo "Please open: http://$$GRAFANA_IP"; \
	else \
		echo '$(YELLOW)LoadBalancer IP not available, using port-forward$(NC)'; \
		echo 'Grafana will be available at http://localhost:3000'; \
		kubectl port-forward -n monitoring svc/grafana 3000:80; \
	fi

logs: ## Tail logs from all WebSCADA pods
	@echo '$(BLUE)Tailing WebSCADA logs...$(NC)'
	@kubectl logs -f -n webscada-dev --all-containers=true --max-log-requests=10 -l 'app in (frontend,backend,simulator)'

logs-backend: ## Tail backend logs
	@kubectl logs -f -n webscada-dev -l app=backend --all-containers=true

logs-frontend: ## Tail frontend logs
	@kubectl logs -f -n webscada-dev -l app=frontend --all-containers=true

logs-simulator: ## Tail simulator logs
	@kubectl logs -f -n webscada-dev -l app=simulator --all-containers=true

port-forward: ## Port forward all services
	@echo '$(BLUE)Setting up port forwarding...$(NC)'
	@echo 'Frontend: http://localhost:3000'
	@echo 'Backend:  http://localhost:3001'
	@echo 'Grafana:  http://localhost:3002'
	@echo ''
	@echo 'Press Ctrl+C to stop'
	@kubectl port-forward -n webscada-dev svc/frontend 3000:3000 & \
	kubectl port-forward -n webscada-dev svc/backend 3001:3001 & \
	kubectl port-forward -n monitoring svc/grafana 3002:80 & \
	wait

shell-backend: ## Open shell in backend pod
	@kubectl exec -it -n webscada-dev $$(kubectl get pod -n webscada-dev -l app=backend -o jsonpath='{.items[0].metadata.name}') -- /bin/sh

shell-frontend: ## Open shell in frontend pod
	@kubectl exec -it -n webscada-dev $$(kubectl get pod -n webscada-dev -l app=frontend -o jsonpath='{.items[0].metadata.name}') -- /bin/sh

describe-pods: ## Describe all pods in webscada-dev namespace
	@kubectl describe pods -n webscada-dev

events: ## Show recent events
	@kubectl get events -n webscada-dev --sort-by='.lastTimestamp'

top: ## Show resource usage
	@echo '$(BLUE)Resource Usage:$(NC)'
	@kubectl top nodes 2>/dev/null || echo "Metrics server not available"
	@echo ''
	@kubectl top pods -n webscada-dev 2>/dev/null || echo "Metrics server not available"

clean-pods: ## Delete all WebSCADA pods (they will be recreated)
	@echo '$(YELLOW)Deleting WebSCADA pods...$(NC)'
	@kubectl delete pods --all -n webscada-dev
	@echo '$(GREEN)Pods deleted, waiting for recreation...$(NC)'
	@kubectl wait --for=condition=ready pod --all -n webscada-dev --timeout=300s

clean: ## Clean up WebSCADA deployments (keeps cluster running)
	@echo '$(YELLOW)Cleaning WebSCADA deployments...$(NC)'
	@kubectl delete all --all -n webscada-dev || true
	@echo '$(GREEN)Cleanup complete$(NC)'

info: ## Show cluster information
	@echo '$(BLUE)=======================================$(NC)'
	@echo '$(BLUE)Cluster Information$(NC)'
	@echo '$(BLUE)=======================================$(NC)'
	@echo ''
	@kubectl cluster-info
	@echo ''
	@echo '$(YELLOW)K3s Version:$(NC)'
	@k3s --version | head -n1
	@echo ''
	@echo '$(YELLOW)Kubeconfig:$(NC)'
	@echo "  $$HOME/.kube/config"
	@echo ''
	@echo '$(YELLOW)Storage:$(NC)'
	@kubectl get storageclass
	@echo ''
	@echo '$(YELLOW)MetalLB IP Pool:$(NC)'
	@kubectl get ipaddresspool -n metallb-system -o yaml 2>/dev/null | grep -A2 "addresses:" || echo "  Not configured"
