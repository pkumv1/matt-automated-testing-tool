#!/bin/bash

# MATT Database Setup Script
# This script helps set up the database for MATT

echo "
╔══════════════════════════════════════════════════════════════╗
║           MATT - Database Setup Script                      ║
╚══════════════════════════════════════════════════════════════╝
"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        print_status "Created .env file from .env.example"
    else
        print_error ".env.example not found!"
        exit 1
    fi
else
    print_status "Found existing .env file"
fi

# Load environment variables
print_info "Loading environment variables..."
set -a
source .env
set +a

# Function to update .env file
update_env_var() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env; then
        # Key exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${key}=.*|${key}=${value}|" .env
        else
            # Linux
            sed -i "s|^${key}=.*|${key}=${value}|" .env
        fi
    else
        # Key doesn't exist, add it
        echo "${key}=${value}" >> .env
    fi
}

# Check PostgreSQL connection
print_info "Checking PostgreSQL connection..."

# Default database URL for development
DEFAULT_DB_URL="postgresql://postgres:postgres@localhost:5432/matt_database"

# If DATABASE_URL is empty or default, try to set up a working one
if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://postgres:post123@localhost:5432/postgres" ]; then
    print_warning "DATABASE_URL needs configuration"
    
    # Try common PostgreSQL setups
    echo "Testing common PostgreSQL configurations..."
    
    # Test URLs to try
    TEST_URLS=(
        "postgresql://postgres:postgres@localhost:5432/postgres"
        "postgresql://postgres:@localhost:5432/postgres"
        "postgresql://postgres:password@localhost:5432/postgres"
        "postgresql://postgres:admin@localhost:5432/postgres"
    )
    
    WORKING_URL=""
    for url in "${TEST_URLS[@]}"; do
        print_info "Testing: $(echo $url | sed 's/:.*@/:****@/')"
        if psql "$url" -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "Connection successful!"
            WORKING_URL="$url"
            break
        fi
    done
    
    if [ -n "$WORKING_URL" ]; then
        # Create matt_database if it doesn't exist
        DB_NAME="matt_database"
        BASE_URL=$(echo "$WORKING_URL" | sed 's|/[^/]*$||')
        NEW_URL="${BASE_URL}/${DB_NAME}"
        
        print_info "Creating database: $DB_NAME"
        psql "$WORKING_URL" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_warning "Database might already exist"
        
        # Test new database connection
        if psql "$NEW_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "Database $DB_NAME is ready"
            update_env_var "DATABASE_URL" "$NEW_URL"
            export DATABASE_URL="$NEW_URL"
        else
            print_warning "Using default postgres database"
            update_env_var "DATABASE_URL" "$WORKING_URL"
            export DATABASE_URL="$WORKING_URL"
        fi
    else
        print_error "Could not connect to PostgreSQL!"
        echo ""
        echo "Please ensure PostgreSQL is installed and running:"
        echo "  • Install PostgreSQL: https://postgresql.org/download/"
        echo "  • Start PostgreSQL service"
        echo "  • Create a user: createuser -s postgres"
        echo "  • Set password: psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
        echo ""
        echo "Or manually set DATABASE_URL in .env file"
        exit 1
    fi
else
    # Test existing DATABASE_URL
    print_info "Testing existing DATABASE_URL..."
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_error "Cannot connect to database with current DATABASE_URL"
        echo "Please check your DATABASE_URL in .env file"
        exit 1
    fi
fi

# Set up other required environment variables
if [ -z "$ANTHROPIC_API_KEY" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-api03-xxxxx" ]; then
    print_warning "ANTHROPIC_API_KEY needs to be set"
    echo "Please get your API key from: https://console.anthropic.com/"
    echo "Then update ANTHROPIC_API_KEY in .env file"
fi

if [ "$SESSION_SECRET" = "your-secret-change-this-in-production" ]; then
    # Generate a random session secret
    RANDOM_SECRET=$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    update_env_var "SESSION_SECRET" "$RANDOM_SECRET"
    print_status "Generated random SESSION_SECRET"
fi

# Ensure NODE_ENV is set
if [ -z "$NODE_ENV" ]; then
    update_env_var "NODE_ENV" "development"
    print_status "Set NODE_ENV to development"
fi

# Initialize database schema
print_info "Setting up database schema..."
npm run db:push

if [ $? -eq 0 ]; then
    print_status "Database schema created successfully"
else
    print_error "Failed to create database schema"
    echo "You may need to:"
    echo "  • Check DATABASE_URL is correct"
    echo "  • Ensure PostgreSQL is running"
    echo "  • Run manually: npm run db:push"
fi

# Run the performance indexes
if [ -f "database-performance-indexes.sql" ]; then
    print_info "Applying performance indexes..."
    psql "$DATABASE_URL" -f database-performance-indexes.sql >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Performance indexes applied"
    else
        print_warning "Could not apply performance indexes (may already exist)"
    fi
fi

# Run the initial database setup
if [ -f "init-database.sql" ]; then
    print_info "Running initial database setup..."
    psql "$DATABASE_URL" -f init-database.sql >/dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "Initial database setup completed"
    else
        print_warning "Initial setup failed (may already be done)"
    fi
fi

echo ""
print_status "Database setup completed!"
echo ""
print_info "Database URL: $(echo $DATABASE_URL | sed 's/:.*@/:****@/')"
print_info "You can now run: npm run dev"
echo ""