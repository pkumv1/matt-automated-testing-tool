#!/bin/bash

# MATT Production Deployment Script
# This script helps deploy MATT in production mode

echo "
╔══════════════════════════════════════════════════════════════╗
║     MATT - Production Deployment Script                       ║
╚══════════════════════════════════════════════════════════════╝
"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please create a .env file with required variables:"
    echo "  - DATABASE_URL"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - SESSION_SECRET"
    echo ""
    echo "You can copy .env.example as a template:"
    echo "  cp .env.example .env"
    exit 1
fi

print_status "Found .env file"

# Load environment variables from .env
print_status "Loading environment variables..."
set -a
source .env
set +a

# Verify required environment variables
MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    MISSING_VARS+=("ANTHROPIC_API_KEY")
fi

if [ -z "$SESSION_SECRET" ]; then
    MISSING_VARS+=("SESSION_SECRET")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_status "All required environment variables are set"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Build the application
print_status "Building the application..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Build completed successfully"

# Check if dist/public exists
if [ ! -d "dist/public" ]; then
    print_error "Build output directory dist/public not found!"
    exit 1
fi

# Initialize database if needed
if [ "$1" == "--init-db" ]; then
    print_status "Initializing database..."
    npm run db:push
    if [ $? -ne 0 ]; then
        print_error "Database initialization failed!"
        exit 1
    fi
    print_status "Database initialized successfully"
fi

# Start the application
echo ""
print_status "Starting MATT in production mode..."
echo ""

# Export all environment variables for the npm start command
export DATABASE_URL
export ANTHROPIC_API_KEY
export SESSION_SECRET
export NODE_ENV=production

# Start the application
npm start
