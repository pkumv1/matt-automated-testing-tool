#!/bin/bash

# MATT Production Setup Script with Database Persistence Fix
# This script ensures projects are properly saved to the database

echo "
╔══════════════════════════════════════════════════════════════╗
║          MATT - Production Setup & Database Fix             ║
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

# Step 1: Environment Setup
print_info "Setting up environment variables..."

# Check if .env file exists
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        print_warning "Creating .env from .env.example..."
        cp .env.example .env
        print_status "Created .env file"
    else
        print_error ".env.example not found!"
        exit 1
    fi
fi

# Load environment variables
set -a
source .env
set +a

# Step 2: Database URL Configuration
print_info "Configuring database connection..."

if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "postgresql://postgres:post123@localhost:5432/postgres" ]; then
    print_warning "DATABASE_URL needs configuration for production"
    
    # For production deployment, provide options
    echo "Production database options:"
    echo "1. Local PostgreSQL (recommended for demo.mars-techs.ai)"
    echo "2. External PostgreSQL service"
    echo "3. Use environment variables from deployment platform"
    
    read -p "Choose option (1-3): " choice
    
    case $choice in
        1)
            # Local PostgreSQL setup
            print_info "Setting up local PostgreSQL..."
            
            # Check if PostgreSQL is installed
            if command -v psql >/dev/null 2>&1; then
                print_status "PostgreSQL found"
                
                # Try to create database and user
                sudo -u postgres psql -c "CREATE DATABASE matt_production;" 2>/dev/null || print_warning "Database may already exist"
                sudo -u postgres psql -c "CREATE USER matt_user WITH PASSWORD 'matt_secure_password';" 2>/dev/null || print_warning "User may already exist"
                sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE matt_production TO matt_user;" 2>/dev/null
                
                # Update .env with production database URL
                sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://matt_user:matt_secure_password@localhost:5432/matt_production|" .env
                print_status "Updated DATABASE_URL for production"
                
                export DATABASE_URL="postgresql://matt_user:matt_secure_password@localhost:5432/matt_production"
                
            else
                print_error "PostgreSQL not found. Please install PostgreSQL first:"
                echo "  sudo apt update && sudo apt install postgresql postgresql-contrib"
                exit 1
            fi
            ;;
        2)
            print_info "Please set DATABASE_URL in .env file with your external PostgreSQL URL"
            print_info "Format: postgresql://username:password@host:port/database"
            exit 0
            ;;
        3)
            print_info "Using environment variables from deployment platform"
            if [ -z "$DATABASE_URL" ]; then
                print_error "DATABASE_URL environment variable not set"
                exit 1
            fi
            ;;
    esac
fi

# Step 3: Other Environment Variables
print_info "Configuring other environment variables..."

# Generate secure session secret if needed
if [ "$SESSION_SECRET" = "your-secret-change-this-in-production" ] || [ -z "$SESSION_SECRET" ]; then
    NEW_SECRET=$(openssl rand -base64 32)
    sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=${NEW_SECRET}|" .env
    print_status "Generated secure SESSION_SECRET"
fi

# Set production NODE_ENV
sed -i "s|^NODE_ENV=.*|NODE_ENV=production|" .env
print_status "Set NODE_ENV to production"

# Step 4: Install Dependencies
print_info "Installing production dependencies..."
npm ci --only=production
if [ $? -eq 0 ]; then
    print_status "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Build Application
print_info "Building application..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Build completed"
else
    print_error "Build failed"
    exit 1
fi

# Step 6: Database Setup
print_info "Setting up database schema..."

# Test database connection
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "Database connection successful"
    
    # Run database migrations
    npm run db:push
    if [ $? -eq 0 ]; then
        print_status "Database schema created"
    else
        print_warning "Database schema setup failed - app will use fallback storage"
    fi
    
    # Apply performance indexes
    if [ -f "database-performance-indexes.sql" ]; then
        print_info "Applying performance indexes..."
        psql "$DATABASE_URL" -f database-performance-indexes.sql >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Performance indexes applied"
        else
            print_warning "Performance indexes may already exist"
        fi
    fi
    
    # Run initial database setup
    if [ -f "init-database.sql" ]; then
        print_info "Running initial database setup..."
        psql "$DATABASE_URL" -f init-database.sql >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Initial database setup completed"
        else
            print_warning "Initial setup may already be done"
        fi
    fi
    
else
    print_warning "Cannot connect to database - app will use in-memory storage"
    print_info "Projects will not persist between restarts"
fi

# Step 7: Setup PM2 for Production
print_info "Setting up PM2 for production..."

if ! command -v pm2 >/dev/null 2>&1; then
    print_info "Installing PM2..."
    npm install -g pm2
fi

# Create PM2 ecosystem file with proper database configuration
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'matt-app',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    env_file: '.env',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512'
  }]
};
EOF

print_status "PM2 configuration created"

# Step 8: Create startup script
cat > start-production.sh << 'EOF'
#!/bin/bash
echo "Starting MATT in production mode..."

# Ensure logs directory exists
mkdir -p logs

# Load environment variables
set -a
source .env
set +a

# Start with PM2
pm2 start ecosystem.config.cjs

# Show status
pm2 status
pm2 logs matt-app --lines 10

echo "MATT is running on http://0.0.0.0:5000"
echo "Check logs with: pm2 logs matt-app"
echo "Stop with: pm2 stop matt-app"
EOF

chmod +x start-production.sh
print_status "Created start-production.sh script"

# Step 9: Final Status Check
print_info "Running final health checks..."

# Create a simple health check script
cat > health-check.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health/storage',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('Storage Health:', health.type);
      console.log('Status:', health.healthy ? 'Healthy' : 'Unhealthy');
      console.log('Message:', health.message);
      if (health.details) {
        console.log('Details:', JSON.stringify(health.details, null, 2));
      }
    } catch (e) {
      console.log('Health check response:', data);
    }
  });
});

req.on('error', (err) => {
  console.log('Health check failed:', err.message);
});

req.on('timeout', () => {
  console.log('Health check timed out');
  req.destroy();
});

req.end();
EOF

print_status "Created health-check.js script"

echo ""
print_status "Production setup completed!"
echo ""
print_info "Next steps:"
print_info "1. Start the application: ./start-production.sh"
print_info "2. Check health: node health-check.js"
print_info "3. Monitor logs: pm2 logs matt-app"
print_info "4. Access at: http://demo.mars-techs.ai:5000"
echo ""
print_info "Database Status:"
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "✅ Database connected - projects will persist"
else
    print_warning "⚠️  Database not connected - using in-memory storage"
    print_info "Projects will be lost on restart"
fi

echo ""
print_info "Production deployment is ready!"