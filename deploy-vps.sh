#!/bin/bash

################################################################################
# WebSCADA VPS Deployment Script
#
# This script automates the deployment of WebSCADA on an Ubuntu VPS
# with existing Nginx on ports 80/443
#
# Usage:
#   ./deploy-vps.sh [command]
#
# Commands:
#   setup       - Initial VPS setup (install Docker, configure)
#   deploy      - Deploy/update WebSCADA containers
#   start       - Start all services
#   stop        - Stop all services
#   restart     - Restart all services
#   logs        - Show container logs
#   status      - Show container status
#   backup      - Backup database and volumes
#   restore     - Restore from backup
#   clean       - Remove all containers and volumes (CAUTION!)
#   help        - Show this help message
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="webscada"
COMPOSE_FILE="docker-compose.vps.yml"
ENV_FILE=".env.production"
BACKUP_DIR="/var/backups/${APP_NAME}"
LOG_DIR="/var/log/${APP_NAME}"

################################################################################
# Helper Functions
################################################################################

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

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This command requires root privileges. Please run with sudo."
        exit 1
    fi
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found!"
        print_info "Please copy .env.production.example to .env.production and configure it."
        exit 1
    fi
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Run './deploy-vps.sh setup' first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Run './deploy-vps.sh setup' first."
        exit 1
    fi
}

get_compose_command() {
    if docker compose version &> /dev/null 2>&1; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

check_nginx() {
    if ! command -v nginx &> /dev/null; then
        print_error "Nginx is not installed!"
        print_info "Install it with: sudo apt-get install nginx"
        exit 1
    fi
}

check_nginx_running() {
    if ! systemctl is-active --quiet nginx; then
        print_warning "Nginx is not running"
        print_info "Start it with: sudo systemctl start nginx"
        return 1
    fi
    return 0
}

check_ssl_certificates() {
    local domain="$1"
    local cert_path="/etc/letsencrypt/live/${domain}/fullchain.pem"
    local key_path="/etc/letsencrypt/live/${domain}/privkey.pem"
    
    if [ ! -f "$cert_path" ] || [ ! -f "$key_path" ]; then
        print_warning "SSL certificates not found for ${domain}"
        print_info "You need to obtain SSL certificates before deployment."
        print_info ""
        print_info "Option 1: Use Certbot (Recommended)"
        print_info "  1. Install certbot: sudo apt install certbot python3-certbot-nginx"
        print_info "  2. Get certificate: sudo certbot --nginx -d ${domain}"
        print_info ""
        print_info "Option 2: Use existing certificates"
        print_info "  - Place fullchain.pem at: ${cert_path}"
        print_info "  - Place privkey.pem at: ${key_path}"
        print_info ""
        return 1
    fi
    
    print_success "SSL certificates found for ${domain}"
    return 0
}

test_nginx_config() {
    print_info "Testing Nginx configuration..."
    if nginx -t 2>&1 | tee /tmp/nginx-test.log; then
        print_success "Nginx configuration is valid"
        return 0
    else
        print_error "Nginx configuration test failed!"
        cat /tmp/nginx-test.log
        return 1
    fi
}

install_nginx_config() {
    local config_file="infrastructure/nginx/webscada.conf"
    local sites_available="/etc/nginx/sites-available/webscada.conf"
    local sites_enabled="/etc/nginx/sites-enabled/webscada.conf"
    
    if [ ! -f "$config_file" ]; then
        print_error "Nginx config file not found: $config_file"
        exit 1
    fi
    
    # Backup existing config if it exists
    if [ -f "$sites_available" ]; then
        print_info "Backing up existing Nginx config..."
        cp "$sites_available" "${sites_available}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Copy config to sites-available
    print_info "Installing Nginx configuration..."
    cp "$config_file" "$sites_available"
    print_success "Config copied to $sites_available"
    
    # Test configuration before enabling
    if ! test_nginx_config; then
        print_error "Nginx configuration test failed!"
        print_warning "Config file copied but NOT enabled"
        print_info "Fix the errors and run: sudo nginx -t"
        return 1
    fi
    
    # Enable site if not already enabled
    if [ ! -L "$sites_enabled" ]; then
        print_info "Enabling site..."
        ln -s "$sites_available" "$sites_enabled"
        print_success "Site enabled"
    else
        print_success "Site already enabled"
    fi
    
    # Test again after enabling
    if ! test_nginx_config; then
        print_error "Nginx configuration test failed after enabling!"
        print_warning "Removing symlink..."
        rm -f "$sites_enabled"
        return 1
    fi
    
    print_success "Nginx configuration installed and tested successfully"
    print_warning "Configuration is ready but NOT yet active"
    print_info "To activate, run: sudo systemctl reload nginx"
    print_info "To rollback, run: sudo rm $sites_enabled && sudo systemctl reload nginx"
    
    return 0
}

################################################################################
# Command Functions
################################################################################

setup_vps() {
    print_header "Setting up VPS for WebSCADA"
    check_root

    # Update system
    print_info "Updating system packages..."
    apt-get update && apt-get upgrade -y
    print_success "System updated"

    # Install Docker if not present
    if ! command -v docker &> /dev/null; then
        print_info "Installing Docker..."
        apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
        add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io
        systemctl enable docker
        systemctl start docker
        print_success "Docker installed"
    else
        print_success "Docker already installed"
    fi

    # Install Docker Compose if not present
    if ! docker compose version &> /dev/null 2>&1 && ! command -v docker-compose &> /dev/null; then
        print_info "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        print_success "Docker Compose installed"
    else
        print_success "Docker Compose already installed"
    fi

    # Create directories
    print_info "Creating directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "/var/lib/${APP_NAME}"
    print_success "Directories created"

    # Setup log rotation
    print_info "Setting up log rotation..."
    cat > /etc/logrotate.d/${APP_NAME} <<EOF
${LOG_DIR}/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 root root
}
EOF
    print_success "Log rotation configured"

    # Check if Nginx is installed
    if command -v nginx &> /dev/null; then
        print_success "Nginx is installed"
        print_info "Please configure Nginx using infrastructure/nginx/webscada.conf"
    else
        print_warning "Nginx is not installed. Install it with: sudo apt-get install nginx"
    fi

    # Create environment file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "$ENV_FILE not found"
        print_info "Copying .env.production.example to $ENV_FILE"
        cp .env.production.example "$ENV_FILE"
        print_warning "Please edit $ENV_FILE and configure all required values"
    fi

    print_success "VPS setup complete!"
    
    # Get domain from env file
    local domain="webscada.spaceautotech.com"
    if [ -f "$ENV_FILE" ]; then
        domain=$(grep "^DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    fi
    
    # Check and setup Nginx
    if command -v nginx &> /dev/null; then
        print_success "Nginx is installed"
        
        # Check if Nginx is running
        if check_nginx_running; then
            print_success "Nginx is running"
        fi
        
        # Check SSL certificates
        print_info "Checking SSL certificates for ${domain}..."
        if ! check_ssl_certificates "$domain"; then
            print_warning "SSL certificates not found. Please obtain them before proceeding."
            print_info ""
            print_info "Quick SSL Setup:"
            print_info "  sudo apt install certbot python3-certbot-nginx"
            print_info "  sudo certbot --nginx -d ${domain}"
            print_info ""
        fi
        
        # Install Nginx configuration
        print_info "Installing Nginx configuration..."
        if install_nginx_config; then
            print_success "Nginx configuration installed successfully"
            print_info ""
            print_warning "IMPORTANT: Nginx configuration is installed but NOT active yet"
            print_info "This ensures your existing websites are not affected"
            print_info ""
            print_info "To activate WebSCADA:"
            print_info "  1. Verify your existing sites still work"
            print_info "  2. Run: sudo systemctl reload nginx"
            print_info "  3. Test WebSCADA: curl -I https://${domain}/"
            print_info ""
            print_info "To rollback if needed:"
            print_info "  sudo rm /etc/nginx/sites-enabled/webscada.conf"
            print_info "  sudo systemctl reload nginx"
        else
            print_error "Failed to install Nginx configuration"
            print_info "Please check the errors above and try again"
        fi
    else
        print_warning "Nginx is not installed. Install it with: sudo apt-get install nginx"
    fi
    
    print_info ""
    print_success "Setup complete!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Edit $ENV_FILE with your configuration (if not done already)"
    print_info "2. Ensure SSL certificates are installed for ${domain}"
    print_info "3. Reload Nginx: sudo systemctl reload nginx"
    print_info "4. Deploy application: sudo ./deploy-vps.sh deploy"
    print_info "5. Verify existing sites still work"
    print_info "6. Test WebSCADA: https://${domain}/"
}

deploy_app() {
    print_header "Deploying WebSCADA"
    check_root
    check_docker
    check_env_file

    local COMPOSE_CMD=$(get_compose_command)
    
    # Get domain from env file
    local domain=$(grep "^DOMAIN=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    # Pre-deployment checks
    print_info "Running pre-deployment checks..."
    
    # Check if Nginx is installed and running
    if ! command -v nginx &> /dev/null; then
        print_error "Nginx is not installed!"
        print_info "Install it with: sudo apt-get install nginx"
        exit 1
    fi
    
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx is not running!"
        print_info "Start it with: sudo systemctl start nginx"
        exit 1
    fi
    
    # Check SSL certificates
    print_info "Checking SSL certificates for ${domain}..."
    if ! check_ssl_certificates "$domain"; then
        print_error "SSL certificates not found!"
        print_info "Please obtain SSL certificates before deployment"
        print_info "Run: sudo certbot --nginx -d ${domain}"
        exit 1
    fi
    
    # Check if Nginx config is installed
    if [ ! -f "/etc/nginx/sites-available/webscada.conf" ]; then
        print_error "Nginx configuration not found!"
        print_info "Run './deploy-vps.sh setup' first to install Nginx configuration"
        exit 1
    fi
    
    # Test Nginx configuration
    if ! test_nginx_config; then
        print_error "Nginx configuration is invalid!"
        print_info "Fix the configuration and try again"
        exit 1
    fi
    
    print_success "Pre-deployment checks passed"
    print_info ""

    # Pull latest images
    print_info "Pulling Docker images..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

    # Build images
    print_info "Building Docker images..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --no-cache

    # Stop existing containers
    print_info "Stopping existing containers..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down

    # Start containers
    print_info "Starting containers..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 10

    # Show status
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    
    # Post-deployment verification
    print_info ""
    print_info "Running post-deployment verification..."
    
    # Check if containers are running
    local frontend_running=$(docker ps --filter "name=webscada-frontend" --filter "status=running" -q)
    local backend_running=$(docker ps --filter "name=webscada-backend" --filter "status=running" -q)
    
    if [ -z "$frontend_running" ]; then
        print_error "Frontend container is not running!"
        print_info "Check logs with: docker logs webscada-frontend"
    else
        print_success "Frontend container is running"
    fi
    
    if [ -z "$backend_running" ]; then
        print_error "Backend container is not running!"
        print_info "Check logs with: docker logs webscada-backend"
    else
        print_success "Backend container is running"
    fi
    
    # Verify port bindings (should be localhost only)
    print_info "Verifying port bindings..."
    if netstat -tlnp 2>/dev/null | grep -E "127.0.0.1:(3000|3001|3002)" > /dev/null; then
        print_success "Containers are bound to localhost only (secure)"
    else
        print_warning "Could not verify port bindings. Check with: netstat -tlnp | grep -E ':(3000|3001|3002)'"
    fi
    
    # Test health endpoint
    print_info "Testing backend health endpoint..."
    sleep 5
    if curl -f http://127.0.0.1:3001/health &> /dev/null; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed. Service may still be starting up."
        print_info "Check logs with: docker logs webscada-backend"
    fi

    print_info ""
    print_success "Deployment complete!"
    print_info ""
    print_info "Access your application at: https://${domain}"
    print_info ""
    print_info "Verify deployment:"
    print_info "  1. Check existing sites still work"
    print_info "  2. Visit: https://${domain}"
    print_info "  3. Monitor logs: ./deploy-vps.sh logs"
    print_info ""
    print_info "If you encounter issues:"
    print_info "  - Check container logs: docker logs webscada-frontend"
    print_info "  - Check Nginx logs: tail -f /var/log/nginx/webscada_error.log"
    print_info "  - Verify Nginx config: nginx -t"
}

start_services() {
    print_header "Starting WebSCADA Services"
    check_root
    check_docker
    check_env_file

    local COMPOSE_CMD=$(get_compose_command)
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
    print_success "Services started"
}

stop_services() {
    print_header "Stopping WebSCADA Services"
    check_root
    check_docker
    check_env_file

    local COMPOSE_CMD=$(get_compose_command)
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    print_success "Services stopped"
}

restart_services() {
    print_header "Restarting WebSCADA Services"
    stop_services
    sleep 2
    start_services
}

show_logs() {
    check_docker

    local COMPOSE_CMD=$(get_compose_command)
    print_info "Showing logs (Ctrl+C to exit)..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f
}

show_status() {
    print_header "WebSCADA Service Status"
    check_docker

    local COMPOSE_CMD=$(get_compose_command)
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

    echo ""
    print_info "Docker container stats:"
    docker stats --no-stream
}

backup_data() {
    print_header "Backing up WebSCADA Data"
    check_root
    check_docker

    local TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    local BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz"

    print_info "Creating backup at $BACKUP_FILE..."

    # Backup database
    print_info "Backing up PostgreSQL database..."
    docker exec webscada-postgres pg_dump -U webscada webscada > "${BACKUP_DIR}/db_${TIMESTAMP}.sql"

    # Backup volumes
    print_info "Backing up Docker volumes..."
    docker run --rm \
        -v webscada_postgres_data:/data/postgres \
        -v webscada_redis_data:/data/redis \
        -v webscada_mosquitto_data:/data/mosquitto \
        -v "${BACKUP_DIR}:/backup" \
        alpine tar czf "/backup/volumes_${TIMESTAMP}.tar.gz" /data

    # Combine backups
    tar czf "$BACKUP_FILE" -C "$BACKUP_DIR" "db_${TIMESTAMP}.sql" "volumes_${TIMESTAMP}.tar.gz"
    rm "${BACKUP_DIR}/db_${TIMESTAMP}.sql" "${BACKUP_DIR}/volumes_${TIMESTAMP}.tar.gz"

    print_success "Backup created: $BACKUP_FILE"

    # Clean old backups (keep last 7 days)
    print_info "Cleaning old backups..."
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
    print_success "Old backups cleaned"
}

restore_data() {
    print_header "Restoring WebSCADA Data"
    check_root
    check_docker

    # List available backups
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/backup_*.tar.gz 2>/dev/null || true

    read -p "Enter backup filename (or full path): " BACKUP_FILE

    if [ ! -f "$BACKUP_FILE" ]; then
        BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    read -p "This will overwrite existing data. Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        print_warning "Restore cancelled"
        exit 0
    fi

    # Stop services
    print_info "Stopping services..."
    stop_services

    # Extract backup
    print_info "Extracting backup..."
    tar xzf "$BACKUP_FILE" -C "$BACKUP_DIR"

    # Restore database
    print_info "Restoring database..."
    local DB_FILE=$(ls -t "${BACKUP_DIR}"/db_*.sql | head -1)
    docker exec -i webscada-postgres psql -U webscada webscada < "$DB_FILE"

    # Restore volumes
    print_info "Restoring volumes..."
    local VOL_FILE=$(ls -t "${BACKUP_DIR}"/volumes_*.tar.gz | head -1)
    docker run --rm \
        -v webscada_postgres_data:/data/postgres \
        -v webscada_redis_data:/data/redis \
        -v webscada_mosquitto_data:/data/mosquitto \
        -v "${BACKUP_DIR}:/backup" \
        alpine tar xzf "/backup/$(basename $VOL_FILE)" -C /

    # Start services
    print_info "Starting services..."
    start_services

    print_success "Restore complete!"
}

clean_all() {
    print_header "Cleaning WebSCADA Installation"
    check_root
    check_docker

    print_warning "This will remove all containers, volumes, and data!"
    read -p "Are you sure? Type 'DELETE' to confirm: " CONFIRM

    if [ "$CONFIRM" != "DELETE" ]; then
        print_warning "Clean cancelled"
        exit 0
    fi

    local COMPOSE_CMD=$(get_compose_command)

    print_info "Stopping and removing containers..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" down -v

    print_info "Removing images..."
    docker images | grep webscada | awk '{print $3}' | xargs -r docker rmi -f

    print_success "Clean complete"
}

show_help() {
    cat <<EOF
WebSCADA VPS Deployment Script

Usage: ./deploy-vps.sh [command]

Commands:
    setup       - Initial VPS setup (install Docker, configure)
    deploy      - Deploy/update WebSCADA containers
    start       - Start all services
    stop        - Stop all services
    restart     - Restart all services
    logs        - Show container logs
    status      - Show container status
    backup      - Backup database and volumes
    restore     - Restore from backup
    clean       - Remove all containers and volumes (CAUTION!)
    help        - Show this help message

Examples:
    sudo ./deploy-vps.sh setup
    sudo ./deploy-vps.sh deploy
    ./deploy-vps.sh logs
    sudo ./deploy-vps.sh backup

For more information, see: documents/operations/deploy.md
EOF
}

################################################################################
# Main Script
################################################################################

case "${1:-help}" in
    setup)
        setup_vps
        ;;
    deploy)
        deploy_app
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
