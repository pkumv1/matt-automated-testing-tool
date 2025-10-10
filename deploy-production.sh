#!/bin/bash

###############################################################################
# MATT Production Deployment Script
# 
# This script automates the deployment process for the MATT application
# Usage: ./deploy-production.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="matt-app"
PM2_CONFIG="ecosystem.config.cjs"
LOG_DIR="logs"

# Functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

print_header() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${CYAN}  MATT Production Deployment${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo ""
}

check_node() {
    log_info "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed!"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    log_success "Node.js $NODE_VERSION is installed"
}

check_npm() {
    log_info "Checking npm installation..."
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed!"
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    log_success "npm $NPM_VERSION is installed"
}

check_pm2() {
    log_info "Checking PM2 installation..."
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 is not installed. Installing PM2 globally..."
        npm install -g pm2
        log_success "PM2 installed successfully"
    else
        PM2_VERSION=$(pm2 --version)
        log_success "PM2 $PM2_VERSION is installed"
    fi
}

validate_environment() {
    log_info "Validating environment variables..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        log_error ".env file not found!"
        log_warning "Please create a .env file with required variables"
        log_warning "You can run: npm run setup"
        exit 1
    fi
    
    # Run validation script if it exists
    if [ -f "validate-env.js" ]; then
        node validate-env.js
        if [ $? -ne 0 ]; then
            log_error "Environment validation failed!"
            exit 1
        fi
    else
        log_warning "validate-env.js not found, skipping detailed validation"
        
        # Basic validation
        source .env 2>/dev/null || true
        
        if [ -z "$DATABASE_URL" ]; then
            log_error "DATABASE_URL is not set!"
            exit 1
        fi
        
        if [ -z "$ANTHROPIC_API_KEY" ]; then
            log_error "ANTHROPIC_API_KEY is not set!"
            exit 1
        fi
        
        if [ -z "$SESSION_SECRET" ]; then
            log_error "SESSION_SECRET is not set!"
            exit 1
        fi
    fi
    
    log_success "Environment variables validated"
}

install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "Dependencies installed"
    else
        log_info "node_modules exists, running npm ci for clean install..."
        npm ci
        log_success "Dependencies installed with npm ci"
    fi
}

build_application() {
    log_info "Building application..."
    
    # Clean old build
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "Cleaned old build directory"
    fi
    
    # Build
    npm run build
    
    if [ $? -ne 0 ]; then
        log_error "Build failed!"
        exit 1
    fi
    
    # Verify build output
    if [ ! -f "dist/index.js" ]; then
        log_error "Build output not found! dist/index.js does not exist"
        exit 1
    fi
    
    log_success "Application built successfully"
}

setup_logging() {
    log_info "Setting up logging directory..."
    
    if [ ! -d "$LOG_DIR" ]; then
        mkdir -p "$LOG_DIR"
        log_success "Created logs directory"
    fi
    
    # Set proper permissions
    chmod 755 "$LOG_DIR" 2>/dev/null || true
}

init_database() {
    if [ "$1" = "--init-db" ] || [ "$1" = "-i" ]; then
        log_info "Initializing database..."
        npm run db:push
        
        if [ $? -eq 0 ]; then
            log_success "Database initialized"
        else
            log_warning "Database initialization had issues (may already be initialized)"
        fi
    fi
}

deploy_with_pm2() {
    log_info "Deploying application with PM2..."
    
    # Check if PM2 config exists
    if [ ! -f "$PM2_CONFIG" ]; then
        log_error "PM2 configuration file not found: $PM2_CONFIG"
        exit 1
    fi
    
    # Stop existing instance if running
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        log_info "Stopping existing instance..."
        pm2 stop "$APP_NAME"
        pm2 delete "$APP_NAME"
        log_success "Stopped existing instance"
    fi
    
    # Start application
    pm2 start "$PM2_CONFIG"
    
    if [ $? -ne 0 ]; then
        log_error "Failed to start application with PM2!"
        exit 1
    fi
    
    # Save PM2 process list
    pm2 save
    
    log_success "Application deployed and running"
}

show_status() {
    echo ""
    log_info "Application Status:"
    pm2 status "$APP_NAME"
    
    echo ""
    log_info "Recent Logs:"
    pm2 logs "$APP_NAME" --lines 20 --nostream
}

print_completion() {
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}  Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo -e "${CYAN}Application is now running on:${NC}"
    echo -e "  ${YELLOW}http://localhost:5000${NC}"
    echo ""
    echo -e "${CYAN}Useful PM2 Commands:${NC}"
    echo -e "  ${YELLOW}pm2 status${NC}          - View application status"
    echo -e "  ${YELLOW}pm2 logs $APP_NAME${NC}  - View logs"
    echo -e "  ${YELLOW}pm2 restart $APP_NAME${NC} - Restart application"
    echo -e "  ${YELLOW}pm2 stop $APP_NAME${NC} - Stop application"
    echo -e "  ${YELLOW}pm2 monit${NC}           - Monitor application"
    echo ""
}

# Main deployment process
main() {
    print_header
    
    # Pre-flight checks
    check_node
    check_npm
    check_pm2
    
    echo ""
    log_info "Starting deployment process..."
    echo ""
    
    # Deployment steps
    validate_environment
    install_dependencies
    build_application
    setup_logging
    init_database "$@"
    deploy_with_pm2
    
    # Show results
    sleep 2  # Give PM2 time to stabilize
    show_status
    print_completion
}

# Run main function
main "$@"
