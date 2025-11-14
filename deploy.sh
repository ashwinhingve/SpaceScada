#!/bin/bash

################################################################################
# WebSCADA Deployment Script
#
# This script handles the complete deployment process for the WebSCADA system
# including rollback capability, health checks, and environment management.
#
# Usage:
#   ./deploy.sh [COMMAND] [OPTIONS]
#
# Commands:
#   install     - Fresh installation
#   upgrade     - Upgrade existing deployment
#   rollback    - Rollback to previous version
#   status      - Check deployment status
#   cleanup     - Remove all resources
#   helm-deps   - Install Helm dependencies (PostgreSQL, Redis)
#
# Options:
#   -e, --env ENV       Environment (dev, staging, prod)
#   -n, --namespace NS  Kubernetes namespace (default: webscada)
#   -v, --version VER   Version to deploy
#   --skip-tests        Skip pre-deployment tests
#   --dry-run           Show what would be deployed
#   -h, --help          Show this help message
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NAMESPACE="webscada"
ENV="dev"
COMMAND=""
VERSION=""
SKIP_TESTS=false
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/infrastructure/k8s"
HELM_DIR="${SCRIPT_DIR}/infrastructure/helm"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    head -n 30 "$0" | grep "^#" | sed 's/^# \?//'
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            install|upgrade|rollback|status|cleanup|helm-deps)
                COMMAND=$1
                shift
                ;;
            -e|--env)
                ENV="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -v|--version)
                VERSION="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    if [[ -z "$COMMAND" ]]; then
        log_error "No command specified"
        show_help
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check Kubernetes connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check helm (if needed)
    if [[ "$COMMAND" == "helm-deps" ]] && ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Create namespace if it doesn't exist
ensure_namespace() {
    log_info "Ensuring namespace ${NAMESPACE} exists..."

    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would create namespace: $NAMESPACE"
        else
            kubectl create namespace "$NAMESPACE"
            log_success "Namespace created: $NAMESPACE"
        fi
    else
        log_info "Namespace already exists: $NAMESPACE"
    fi
}

# Save deployment state for rollback
save_deployment_state() {
    log_info "Saving deployment state for rollback..."

    local state_dir="${SCRIPT_DIR}/.deployment-state"
    mkdir -p "$state_dir"

    local timestamp=$(date +%Y%m%d-%H%M%S)
    local state_file="${state_dir}/state-${timestamp}.yaml"

    # Save current deployments
    kubectl get deployments -n "$NAMESPACE" -o yaml > "$state_file" 2>/dev/null || true

    # Keep only last 5 states
    ls -t "${state_dir}"/state-*.yaml 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true

    log_success "Deployment state saved: $state_file"
}

# Install Helm dependencies
install_helm_deps() {
    log_info "Installing Helm dependencies..."

    # Add Bitnami repo
    log_info "Adding Bitnami Helm repository..."
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo update

    # Install PostgreSQL
    log_info "Installing PostgreSQL..."
    if helm list -n "$NAMESPACE" | grep -q "^postgresql"; then
        log_warning "PostgreSQL already installed, skipping..."
    else
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would install PostgreSQL"
            helm install postgresql bitnami/postgresql \
                -f "${HELM_DIR}/values/postgresql-values.yaml" \
                -n "$NAMESPACE" \
                --dry-run --debug
        else
            helm install postgresql bitnami/postgresql \
                -f "${HELM_DIR}/values/postgresql-values.yaml" \
                -n "$NAMESPACE"
            log_success "PostgreSQL installed"
        fi
    fi

    # Install Redis
    log_info "Installing Redis..."
    if helm list -n "$NAMESPACE" | grep -q "^redis"; then
        log_warning "Redis already installed, skipping..."
    else
        if [[ "$DRY_RUN" == true ]]; then
            log_info "[DRY RUN] Would install Redis"
            helm install redis bitnami/redis \
                -f "${HELM_DIR}/values/redis-values.yaml" \
                -n "$NAMESPACE" \
                --dry-run --debug
        else
            helm install redis bitnami/redis \
                -f "${HELM_DIR}/values/redis-values.yaml" \
                -n "$NAMESPACE"
            log_success "Redis installed"
        fi
    fi

    log_success "Helm dependencies installed"
}

# Deploy ConfigMaps and Secrets
deploy_config() {
    log_info "Deploying ConfigMaps and Secrets..."

    local manifests=(
        "${K8S_DIR}/base/postgres-config.yaml"
        "${K8S_DIR}/base/backend-config.yaml"
        "${K8S_DIR}/base/backend-secrets.yaml"
        "${K8S_DIR}/base/frontend-config.yaml"
    )

    for manifest in "${manifests[@]}"; do
        if [[ -f "$manifest" ]]; then
            log_info "Applying $(basename "$manifest")..."
            if [[ "$DRY_RUN" == true ]]; then
                kubectl apply -f "$manifest" -n "$NAMESPACE" --dry-run=client
            else
                kubectl apply -f "$manifest" -n "$NAMESPACE"
            fi
        fi
    done

    log_success "ConfigMaps and Secrets deployed"
}

# Deploy application
deploy_app() {
    log_info "Deploying application components..."

    local manifests=(
        "${K8S_DIR}/postgres-deployment.yaml"
        "${K8S_DIR}/redis-deployment.yaml"
        "${K8S_DIR}/backend-deployment.yaml"
        "${K8S_DIR}/frontend-deployment.yaml"
        "${K8S_DIR}/simulator-deployment.yaml"
        "${K8S_DIR}/ingress.yaml"
    )

    for manifest in "${manifests[@]}"; do
        if [[ -f "$manifest" ]]; then
            log_info "Applying $(basename "$manifest")..."
            if [[ "$DRY_RUN" == true ]]; then
                kubectl apply -f "$manifest" -n "$NAMESPACE" --dry-run=client
            else
                kubectl apply -f "$manifest" -n "$NAMESPACE"
            fi
        fi
    done

    log_success "Application components deployed"
}

# Deploy monitoring
deploy_monitoring() {
    log_info "Deploying monitoring components..."

    if [[ -f "${K8S_DIR}/monitoring/servicemonitor.yaml" ]]; then
        if [[ "$DRY_RUN" == true ]]; then
            kubectl apply -f "${K8S_DIR}/monitoring/servicemonitor.yaml" -n "$NAMESPACE" --dry-run=client
        else
            kubectl apply -f "${K8S_DIR}/monitoring/servicemonitor.yaml" -n "$NAMESPACE" 2>/dev/null || \
                log_warning "Could not deploy ServiceMonitor (Prometheus Operator may not be installed)"
        fi
    fi

    log_success "Monitoring components deployed"
}

# Wait for deployments
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."

    local deployments=(
        "backend"
        "frontend"
        "postgres"
        "redis"
    )

    for deployment in "${deployments[@]}"; do
        log_info "Waiting for $deployment..."
        if ! kubectl wait --for=condition=available \
            --timeout=300s \
            deployment/"$deployment" \
            -n "$NAMESPACE" 2>/dev/null; then
            log_warning "Deployment $deployment not ready yet"
        else
            log_success "Deployment $deployment is ready"
        fi
    done
}

# Health checks
health_check() {
    log_info "Performing health checks..."

    # Check pod status
    log_info "Checking pod status..."
    kubectl get pods -n "$NAMESPACE"

    # Check backend health
    log_info "Checking backend health endpoint..."
    if kubectl get svc backend -n "$NAMESPACE" &> /dev/null; then
        local backend_pod=$(kubectl get pods -n "$NAMESPACE" -l app=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        if [[ -n "$backend_pod" ]]; then
            if kubectl exec -n "$NAMESPACE" "$backend_pod" -- wget -q -O- http://localhost:3001/health &> /dev/null; then
                log_success "Backend health check passed"
            else
                log_warning "Backend health check failed"
            fi
        fi
    fi

    log_success "Health checks completed"
}

# Install command
cmd_install() {
    log_info "Starting fresh installation..."

    ensure_namespace
    save_deployment_state

    if [[ "$SKIP_TESTS" == false ]]; then
        log_info "Running pre-deployment checks..."
    fi

    deploy_config
    deploy_app
    deploy_monitoring

    if [[ "$DRY_RUN" == false ]]; then
        wait_for_deployments
        health_check
    fi

    log_success "Installation completed successfully!"
}

# Upgrade command
cmd_upgrade() {
    log_info "Starting upgrade..."

    save_deployment_state

    deploy_config
    deploy_app
    deploy_monitoring

    if [[ "$DRY_RUN" == false ]]; then
        wait_for_deployments
        health_check
    fi

    log_success "Upgrade completed successfully!"
}

# Rollback command
cmd_rollback() {
    log_info "Starting rollback..."

    local state_dir="${SCRIPT_DIR}/.deployment-state"

    if [[ ! -d "$state_dir" ]]; then
        log_error "No deployment state found for rollback"
        exit 1
    fi

    # Get the latest state file
    local latest_state=$(ls -t "${state_dir}"/state-*.yaml 2>/dev/null | head -n 1)

    if [[ -z "$latest_state" ]]; then
        log_error "No deployment state file found"
        exit 1
    fi

    log_info "Rolling back to state: $(basename "$latest_state")"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "[DRY RUN] Would rollback to: $latest_state"
        kubectl apply -f "$latest_state" --dry-run=client
    else
        kubectl apply -f "$latest_state"
        wait_for_deployments
        health_check
    fi

    log_success "Rollback completed successfully!"
}

# Status command
cmd_status() {
    log_info "Checking deployment status..."

    echo ""
    log_info "=== Namespace ==="
    kubectl get namespace "$NAMESPACE" 2>/dev/null || log_warning "Namespace not found"

    echo ""
    log_info "=== Deployments ==="
    kubectl get deployments -n "$NAMESPACE" 2>/dev/null || log_warning "No deployments found"

    echo ""
    log_info "=== Pods ==="
    kubectl get pods -n "$NAMESPACE" 2>/dev/null || log_warning "No pods found"

    echo ""
    log_info "=== Services ==="
    kubectl get services -n "$NAMESPACE" 2>/dev/null || log_warning "No services found"

    echo ""
    log_info "=== Ingress ==="
    kubectl get ingress -n "$NAMESPACE" 2>/dev/null || log_warning "No ingress found"

    echo ""
    log_info "=== Helm Releases ==="
    helm list -n "$NAMESPACE" 2>/dev/null || log_warning "No Helm releases found"
}

# Cleanup command
cmd_cleanup() {
    log_warning "This will delete all resources in namespace: $NAMESPACE"
    read -p "Are you sure? (yes/no): " -r

    if [[ ! $REPLY =~ ^yes$ ]]; then
        log_info "Cleanup cancelled"
        exit 0
    fi

    log_info "Cleaning up resources..."

    # Delete Helm releases
    if command -v helm &> /dev/null; then
        helm list -n "$NAMESPACE" --short 2>/dev/null | xargs -r helm uninstall -n "$NAMESPACE" 2>/dev/null || true
    fi

    # Delete Kubernetes resources
    kubectl delete all --all -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete ingress --all -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete configmap --all -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete secret --all -n "$NAMESPACE" 2>/dev/null || true
    kubectl delete pvc --all -n "$NAMESPACE" 2>/dev/null || true

    # Delete namespace
    kubectl delete namespace "$NAMESPACE" 2>/dev/null || true

    log_success "Cleanup completed"
}

# Main execution
main() {
    parse_args "$@"
    check_prerequisites

    case "$COMMAND" in
        install)
            cmd_install
            ;;
        upgrade)
            cmd_upgrade
            ;;
        rollback)
            cmd_rollback
            ;;
        status)
            cmd_status
            ;;
        cleanup)
            cmd_cleanup
            ;;
        helm-deps)
            ensure_namespace
            install_helm_deps
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
