#!/bin/bash

# MATT Build Script for Exported Environment Variables
# This script builds the application using your exported environment variables

echo "
╔══════════════════════════════════════════════════════════════╗
║              MATT - Build with Exported Env Vars            ║
╚══════════════════════════════════════════════════════════════╝
"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Verify exported environment variables
print_info "Verifying exported environment variables..."

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not exported!"
    echo "Run: export DATABASE_URL=\"postgresql://postgres:post123@host:5432/postgres\""
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "ANTHROPIC_API_KEY not exported!"
    echo "Run: export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    print_error "SESSION_SECRET not exported!"
    echo "Run: export SESSION_SECRET=\"your-session-secret\""
    exit 1
fi

print_status "Environment variables verified"
print_info "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:****@/')"
print_info "ANTHROPIC_API_KEY: $(echo $ANTHROPIC_API_KEY | sed 's/sk-ant-api03-.*/sk-ant-api03-***/')"

# Test database connection before building
print_info "Testing database connection..."
if command -v psql >/dev/null 2>&1; then
    if timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Database connection successful"
        DATABASE_AVAILABLE=true
    else
        print_warning "Database connection failed - will use in-memory fallback"
        DATABASE_AVAILABLE=false
    fi
else
    print_warning "psql not available - cannot test database"
    DATABASE_AVAILABLE=false
fi

# Clean previous build
print_info "Cleaning previous build..."
rm -rf dist/
print_status "Clean completed"

# Set build environment variables
export NODE_ENV=production
export NODE_OPTIONS=--max-old-space-size=4096

print_info "Building frontend with Vite..."
# Build frontend
npx vite build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi
print_status "Frontend build completed"

print_info "Building backend with esbuild..."
# Build backend
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

if [ $? -ne 0 ]; then
    print_error "Backend build failed!"
    exit 1
fi
print_status "Backend build completed"

# Verify build output
if [ ! -f "dist/index.js" ]; then
    print_error "Build output missing: dist/index.js"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    print_error "Frontend build output missing: dist/public"
    exit 1
fi

print_status "Build verification passed"

# Create runtime environment file
print_info "Creating runtime environment configuration..."
cat > .env.production << EOF
# Production Environment Configuration
# Generated on: $(date)

DATABASE_URL=$DATABASE_URL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

# Additional configuration
CONFIG_PATH=./config/settings.json
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
LOG_LEVEL=info
EOF

print_status "Runtime environment created"

# Setup database if available
if [ "$DATABASE_AVAILABLE" = true ]; then
    print_info "Setting up database schema..."
    
    # Apply database schema
    if npm run db:push >/dev/null 2>&1; then
        print_status "Database schema applied"
    else
        print_warning "Database schema setup failed"
    fi
    
    # Apply performance indexes
    if [ -f "database-performance-indexes.sql" ]; then
        if psql "$DATABASE_URL" -f database-performance-indexes.sql >/dev/null 2>&1; then
            print_status "Performance indexes applied"
        else
            print_warning "Performance indexes may already exist"
        fi
    fi
fi

# Create optimized start script
print_info "Creating optimized start script..."
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting MATT in production mode..."

# Load environment variables
if [ -f ".env.production" ]; then
    set -a
    source .env.production
    set +a
    echo "✓ Loaded production environment"
else
    echo "⚠️  .env.production not found, using exported variables"
fi

# Ensure required directories exist
mkdir -p logs uploads config

# Check if dist exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build output not found. Run build first!"
    exit 1
fi

# Start the application
echo "📡 Starting server on http://0.0.0.0:5000"
exec node dist/index.js
EOF

chmod +x start-production.sh
print_status "Created start-production.sh"

# Create quick health check
cat > quick-health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 Quick Health Check..."

# Wait for server to start
sleep 2

# Check if server is responding
if curl -s -f http://localhost:5000/api/health/storage >/dev/null; then
    echo "✅ Server is responding"
    
    # Get detailed health info
    HEALTH=$(curl -s http://localhost:5000/api/health/storage)
    echo "Health Status: $HEALTH"
else
    echo "❌ Server not responding on port 5000"
    echo "Check if the server started successfully"
fi
EOF

chmod +x quick-health-check.sh
print_status "Created quick-health-check.sh"

echo ""
print_status "Build completed successfully!"
echo ""
print_info "Build outputs:"
print_info "- Frontend: dist/public/"
print_info "- Backend: dist/index.js"
print_info "- Environment: .env.production"
echo ""
print_info "To start the application:"
print_info "  ./start-production.sh"
echo ""
print_info "To check health:"
print_info "  ./quick-health-check.sh"
echo ""

if [ "$DATABASE_AVAILABLE" = true ]; then
    print_status "✅ Database configured - projects will persist"
else
    print_warning "⚠️  Database not available - using in-memory storage"
    print_info "Projects will be lost on restart"
fi

echo ""
print_info "🎉 Ready for deployment on demo.mars-techs.ai!"