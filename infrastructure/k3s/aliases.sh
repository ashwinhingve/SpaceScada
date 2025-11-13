#!/bin/bash

# WebSCADA K3s Aliases and Functions
# Source this file in your .bashrc or .zshrc:
#   source ~/webscada/infrastructure/k3s/aliases.sh

# Basic kubectl aliases
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
alias kgn='kubectl get nodes'
alias kga='kubectl get all'

# Namespace aliases
alias kn='kubectl config set-context --current --namespace'
alias kws='kubectl -n webscada-dev'
alias kmon='kubectl -n monitoring'
alias ksys='kubectl -n kube-system'

# WebSCADA specific
alias ws='kubectl -n webscada-dev'
alias wsp='kubectl get pods -n webscada-dev'
alias wss='kubectl get svc -n webscada-dev'
alias wsl='kubectl logs -f -n webscada-dev'
alias wse='kubectl get events -n webscada-dev --sort-by=.lastTimestamp'

# Describe and logs
alias kdp='kubectl describe pod'
alias kdpws='kubectl describe pod -n webscada-dev'
alias kl='kubectl logs -f'
alias klws='kubectl logs -f -n webscada-dev'

# Quick pod access
alias backend-shell='kubectl exec -it -n webscada-dev $(kubectl get pod -n webscada-dev -l app=backend -o jsonpath="{.items[0].metadata.name}") -- /bin/sh'
alias frontend-shell='kubectl exec -it -n webscada-dev $(kubectl get pod -n webscada-dev -l app=frontend -o jsonpath="{.items[0].metadata.name}") -- /bin/sh'
alias simulator-shell='kubectl exec -it -n webscada-dev $(kubectl get pod -n webscada-dev -l app=simulator -o jsonpath="{.items[0].metadata.name}") -- /bin/sh'
alias postgres-shell='kubectl exec -it -n webscada-dev $(kubectl get pod -n webscada-dev -l app=postgres -o jsonpath="{.items[0].metadata.name}") -- /bin/sh'

# Port forwarding
alias pf-frontend='kubectl port-forward -n webscada-dev svc/frontend 3000:3000'
alias pf-backend='kubectl port-forward -n webscada-dev svc/backend 3001:3001'
alias pf-grafana='kubectl port-forward -n monitoring svc/grafana 3000:80'
alias pf-prometheus='kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090'

# Resource usage
alias ktopn='kubectl top nodes'
alias ktopp='kubectl top pods'
alias ktopws='kubectl top pods -n webscada-dev'

# Watch commands
alias watch-pods='watch -n 2 kubectl get pods -n webscada-dev'
alias watch-svc='watch -n 2 kubectl get svc -n webscada-dev'

# Debugging
alias kdebug='kubectl run debug-pod --rm -it --image=busybox --restart=Never -- /bin/sh'
alias kdebug-net='kubectl run debug-net --rm -it --image=nicolaka/netshoot --restart=Never -- /bin/bash'

# Functions

# Get pod by app label
kpod() {
    if [ -z "$1" ]; then
        echo "Usage: kpod <app-label> [namespace]"
        return 1
    fi
    local app=$1
    local namespace=${2:-webscada-dev}
    kubectl get pod -n "$namespace" -l "app=$app" -o jsonpath='{.items[0].metadata.name}'
}

# Quick logs by app
klapp() {
    if [ -z "$1" ]; then
        echo "Usage: klapp <app-label> [namespace]"
        return 1
    fi
    local app=$1
    local namespace=${2:-webscada-dev}
    kubectl logs -f -n "$namespace" -l "app=$app" --all-containers=true
}

# Quick shell by app
kshell() {
    if [ -z "$1" ]; then
        echo "Usage: kshell <app-label> [namespace] [shell]"
        return 1
    fi
    local app=$1
    local namespace=${2:-webscada-dev}
    local shell=${3:-/bin/sh}
    local pod=$(kubectl get pod -n "$namespace" -l "app=$app" -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$pod" ]; then
        echo "No pod found for app: $app in namespace: $namespace"
        return 1
    fi

    kubectl exec -it -n "$namespace" "$pod" -- "$shell"
}

# Delete pod by app
kdelpod() {
    if [ -z "$1" ]; then
        echo "Usage: kdelpod <app-label> [namespace]"
        return 1
    fi
    local app=$1
    local namespace=${2:-webscada-dev}
    kubectl delete pod -n "$namespace" -l "app=$app"
}

# Restart deployment
krestart() {
    if [ -z "$1" ]; then
        echo "Usage: krestart <deployment> [namespace]"
        return 1
    fi
    local deployment=$1
    local namespace=${2:-webscada-dev}
    kubectl rollout restart deployment/"$deployment" -n "$namespace"
    kubectl rollout status deployment/"$deployment" -n "$namespace"
}

# Get all resources in namespace
kgetall() {
    local namespace=${1:-webscada-dev}
    echo "=== Pods ==="
    kubectl get pods -n "$namespace"
    echo ""
    echo "=== Services ==="
    kubectl get svc -n "$namespace"
    echo ""
    echo "=== Deployments ==="
    kubectl get deployments -n "$namespace"
    echo ""
    echo "=== ConfigMaps ==="
    kubectl get configmaps -n "$namespace"
    echo ""
    echo "=== Secrets ==="
    kubectl get secrets -n "$namespace"
}

# Watch pod status
wpod() {
    local namespace=${1:-webscada-dev}
    watch -n 2 "kubectl get pods -n $namespace"
}

# Get pod events
kevents() {
    if [ -z "$1" ]; then
        echo "Usage: kevents <pod-name> [namespace]"
        return 1
    fi
    local pod=$1
    local namespace=${2:-webscada-dev}
    kubectl get events -n "$namespace" --field-selector involvedObject.name="$pod" --sort-by=.lastTimestamp
}

# Get all events in namespace
kgetevents() {
    local namespace=${1:-webscada-dev}
    kubectl get events -n "$namespace" --sort-by=.lastTimestamp
}

# Quick context switching
kctx() {
    if [ -z "$1" ]; then
        kubectl config current-context
    else
        kubectl config use-context "$1"
    fi
}

# Show current context and namespace
kinfo() {
    echo "Context: $(kubectl config current-context)"
    echo "Namespace: $(kubectl config view --minify --output 'jsonpath={..namespace}' 2>/dev/null || echo 'default')"
}

# WebSCADA status
wsstatus() {
    echo "=== WebSCADA Cluster Status ==="
    echo ""
    echo "Pods:"
    kubectl get pods -n webscada-dev
    echo ""
    echo "Services:"
    kubectl get svc -n webscada-dev
    echo ""
    echo "Resource Usage:"
    kubectl top pods -n webscada-dev 2>/dev/null || echo "Metrics not available"
}

# Help function
khelp() {
    echo "WebSCADA K3s Aliases and Functions"
    echo ""
    echo "Basic Aliases:"
    echo "  k          - kubectl"
    echo "  kgp        - kubectl get pods"
    echo "  kgs        - kubectl get svc"
    echo "  kgd        - kubectl get deployments"
    echo "  kn         - set namespace"
    echo ""
    echo "WebSCADA Aliases:"
    echo "  ws         - kubectl -n webscada-dev"
    echo "  wsp        - get pods in webscada-dev"
    echo "  wss        - get services in webscada-dev"
    echo "  wsl        - tail logs in webscada-dev"
    echo "  wsstatus   - show WebSCADA status"
    echo ""
    echo "Shell Access:"
    echo "  backend-shell    - shell into backend pod"
    echo "  frontend-shell   - shell into frontend pod"
    echo "  simulator-shell  - shell into simulator pod"
    echo ""
    echo "Port Forwarding:"
    echo "  pf-frontend    - forward port 3000"
    echo "  pf-backend     - forward port 3001"
    echo "  pf-grafana     - forward Grafana"
    echo "  pf-prometheus  - forward Prometheus"
    echo ""
    echo "Functions:"
    echo "  kpod <app>            - get pod name by app label"
    echo "  klapp <app>           - tail logs by app label"
    echo "  kshell <app>          - shell into pod by app label"
    echo "  krestart <deployment> - restart deployment"
    echo "  kgetall [namespace]   - get all resources"
    echo "  kevents <pod>         - get pod events"
    echo "  wsstatus              - WebSCADA status"
}

echo "WebSCADA K3s aliases loaded! Type 'khelp' for help."
