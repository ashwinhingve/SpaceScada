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
    print_info "Next steps:"
    print_info "1. Edit $ENV_FILE with your configuration"
    print_info "2. Configure Nginx: sudo cp infrastructure/nginx/webscada.conf /etc/nginx/sites-available/"
    print_info "3. Enable Nginx site: sudo ln -s /etc/nginx/sites-available/webscada.conf /etc/nginx/sites-enabled/"
    print_info "4. Test Nginx: sudo nginx -t"
    print_info "5. Reload Nginx: sudo systemctl reload nginx"
    print_info "6. Deploy application: sudo ./deploy-vps.sh deploy"
}

deploy_app() {
    print_header "Deploying WebSCADA"
    check_root
    check_docker
    check_env_file

    local COMPOSE_CMD=$(get_compose_command)

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

    print_success "Deployment complete!"
    print_info "Access your application at: https://$(grep DOMAIN $ENV_FILE | cut -d'=' -f2)"
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

    local COMPOSE_CMD=$(get_compose_command)
    $COMPOSE_CMD -f "$COMPOSE_FILE" down
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
    $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
}

show_status() {
    print_header "WebSCADA Service Status"
    check_docker

    local COMPOSE_CMD=$(get_compose_command)
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps

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
