#!/bin/bash

################################################################################
# WebSCADA VPS Compatibility Checker
#
# This script checks if your Ubuntu VPS is compatible with WebSCADA
# and identifies potential issues before deployment
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

ERRORS=0
WARNINGS=0

print_header "WebSCADA VPS Compatibility Check"

# Check OS
print_info "Checking operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "OS: $NAME $VERSION"

    if [[ "$ID" == "ubuntu" ]]; then
        if [[ "$VERSION_ID" == "22.04" ]] || [[ "$VERSION_ID" == "24.04" ]]; then
            print_success "Ubuntu $VERSION_ID is supported"
        else
            print_warning "Ubuntu $VERSION_ID - Recommended: 22.04 or 24.04"
            ((WARNINGS++))
        fi
    else
        print_warning "Not Ubuntu - WebSCADA is tested on Ubuntu 22.04/24.04"
        ((WARNINGS++))
    fi
else
    print_error "Cannot detect OS version"
    ((ERRORS++))
fi

# Check if running on WSL
print_info "Checking environment..."
if grep -qi microsoft /proc/version; then
    print_warning "Running on WSL - This check is for native Ubuntu VPS"
    print_info "WSL detected: $(uname -r)"
    ((WARNINGS++))
else
    print_success "Running on native Linux"
fi

# Check system resources
print_header "System Resources"

# RAM
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
echo "Total RAM: ${TOTAL_RAM}MB"
if [ "$TOTAL_RAM" -ge 2000 ]; then
    print_success "RAM: ${TOTAL_RAM}MB (meets minimum 2GB requirement)"
elif [ "$TOTAL_RAM" -ge 1500 ]; then
    print_warning "RAM: ${TOTAL_RAM}MB (below recommended 2GB, consider enabling swap)"
    ((WARNINGS++))
else
    print_error "RAM: ${TOTAL_RAM}MB (insufficient, minimum 2GB required)"
    ((ERRORS++))
fi

# CPU
CPU_CORES=$(nproc)
echo "CPU Cores: $CPU_CORES"
if [ "$CPU_CORES" -ge 2 ]; then
    print_success "CPU: $CPU_CORES cores (meets requirement)"
else
    print_warning "CPU: $CPU_CORES core (recommended: 2 cores)"
    ((WARNINGS++))
fi

# Disk space
DISK_AVAILABLE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
echo "Available Disk Space: ${DISK_AVAILABLE}GB"
if [ "$DISK_AVAILABLE" -ge 20 ]; then
    print_success "Disk: ${DISK_AVAILABLE}GB (meets minimum 20GB requirement)"
elif [ "$DISK_AVAILABLE" -ge 10 ]; then
    print_warning "Disk: ${DISK_AVAILABLE}GB (low space, recommended: 20GB+)"
    ((WARNINGS++))
else
    print_error "Disk: ${DISK_AVAILABLE}GB (insufficient, minimum 20GB required)"
    ((ERRORS++))
fi

# Check Docker
print_header "Docker Installation"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker installed: $DOCKER_VERSION"

    # Check if Docker is running
    if systemctl is-active --quiet docker 2>/dev/null; then
        print_success "Docker service is running"
    else
        print_error "Docker service is not running"
        print_info "Start with: sudo systemctl start docker"
        ((ERRORS++))
    fi
else
    print_warning "Docker is not installed"
    print_info "Run: sudo ./deploy-vps.sh setup"
    ((WARNINGS++))
fi

# Check Docker Compose
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose installed: $COMPOSE_VERSION"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose installed: $COMPOSE_VERSION"
else
    print_warning "Docker Compose is not installed"
    print_info "Run: sudo ./deploy-vps.sh setup"
    ((WARNINGS++))
fi

# Check network ports
print_header "Port Availability"

check_port() {
    PORT=$1
    NAME=$2
    if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
        print_error "Port $PORT ($NAME) is already in use"
        print_info "Process using port: $(sudo lsof -i :$PORT | tail -n 1 || echo 'Unknown')"
        ((ERRORS++))
        return 1
    else
        print_success "Port $PORT ($NAME) is available"
        return 0
    fi
}

# Check if netstat is available
if ! command -v netstat &> /dev/null; then
    print_warning "netstat not installed (installing net-tools recommended)"
    print_info "Install with: sudo apt install net-tools"
    ((WARNINGS++))
else
    check_port 3000 "Frontend"
    check_port 3001 "Backend API"
    check_port 3002 "Realtime Service"

    # Check Nginx ports if planning to use
    if command -v nginx &> /dev/null; then
        print_info "Nginx is installed"
        check_port 80 "HTTP"
        check_port 443 "HTTPS"
    fi
fi

# Check firewall
print_header "Firewall Configuration"

if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | head -1)
    echo "UFW Status: $UFW_STATUS"

    if echo "$UFW_STATUS" | grep -q "inactive"; then
        print_warning "Firewall (UFW) is inactive"
        print_info "Consider enabling: sudo ufw enable"
        ((WARNINGS++))
    else
        print_success "Firewall (UFW) is active"
        print_info "Ensure ports 80 and 443 are allowed for web access"
    fi
else
    print_warning "UFW firewall not installed"
    print_info "Install with: sudo apt install ufw"
    ((WARNINGS++))
fi

# Check required files
print_header "Required Files"

if [ -f "deploy-vps.sh" ]; then
    print_success "deploy-vps.sh found"
    if [ -x "deploy-vps.sh" ]; then
        print_success "deploy-vps.sh is executable"
    else
        print_warning "deploy-vps.sh is not executable"
        print_info "Run: chmod +x deploy-vps.sh"
        ((WARNINGS++))
    fi
else
    print_error "deploy-vps.sh not found"
    ((ERRORS++))
fi

if [ -f "docker-compose.vps.yml" ]; then
    print_success "docker-compose.vps.yml found"
else
    print_error "docker-compose.vps.yml not found"
    ((ERRORS++))
fi

if [ -f ".env.production" ]; then
    print_success ".env.production found"

    # Check for critical environment variables
    if grep -q "REDIS_PASSWORD=.*/" .env.production; then
        print_error "REDIS_PASSWORD contains '/' character - this will cause connection issues"
        print_info "Use only alphanumeric characters in REDIS_PASSWORD"
        ((ERRORS++))
    else
        print_success "REDIS_PASSWORD format looks good"
    fi
elif [ -f ".env.production.example" ]; then
    print_warning ".env.production not found (using example)"
    print_info "Copy and configure: cp .env.production.example .env.production"
    ((WARNINGS++))
else
    print_error ".env.production.example not found"
    ((ERRORS++))
fi

# Check internet connectivity
print_header "Network Connectivity"

if ping -c 1 8.8.8.8 &> /dev/null; then
    print_success "Internet connectivity OK"
else
    print_error "No internet connection"
    print_info "Internet required to pull Docker images"
    ((ERRORS++))
fi

# Summary
print_header "Summary"

echo ""
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    print_success "All checks passed! Your VPS is ready for WebSCADA deployment"
    echo ""
    print_info "Next steps:"
    echo "  1. Configure .env.production with your settings"
    echo "  2. Run: sudo ./deploy-vps.sh setup"
    echo "  3. Run: sudo ./deploy-vps.sh deploy"
elif [ $ERRORS -eq 0 ]; then
    print_warning "Checks passed with $WARNINGS warning(s)"
    print_info "Review warnings above before deployment"
    exit 0
else
    print_error "Found $ERRORS error(s) and $WARNINGS warning(s)"
    print_info "Please fix the errors above before deployment"
    exit 1
fi
