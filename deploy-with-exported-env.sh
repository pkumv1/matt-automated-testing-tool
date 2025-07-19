#!/bin/bash

# MATT Deployment Script for Exported Environment Variables
# Use this when you've already exported DATABASE_URL, ANTHROPIC_API_KEY, and SESSION_SECRET

echo "
╔══════════════════════════════════════════════════════════════╗
║        MATT - Deploy with Exported Environment Variables    ║
╚══════════════════════════════════════════════════════════════╝
"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if environment variables are exported
print_info "Checking exported environment variables..."

if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL is not exported!"
    echo "Please export it first: export DATABASE_URL=\"postgresql://postgres:post123@host:5432/postgres\""
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "ANTHROPIC_API_KEY is not exported!"
    echo "Please export it first: export ANTHROPIC_API_KEY=\"your-api-key\""
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    print_error "SESSION_SECRET is not exported!"
    echo "Please export it first: export SESSION_SECRET=\"your-session-secret\""
    exit 1
fi

print_status "All required environment variables are exported"
print_info "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:****@/')"
print_info "ANTHROPIC_API_KEY: $(echo $ANTHROPIC_API_KEY | sed 's/.*/sk-ant-...***/')"
print_info "SESSION_SECRET: [HIDDEN]"

# Test database connection
print_info "Testing database connection..."
if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        print_status "Database connection successful"
    else
        print_warning "Cannot connect to database - app will use in-memory storage fallback"
    fi
else
    print_warning "psql not found - cannot test database connection"
fi

# Create .env file from exported variables
print_info "Creating .env file from exported variables..."
cat > .env << EOF
# MATT Environment Configuration - Generated from exported variables
# Generated on: $(date)

# Database Configuration
DATABASE_URL=$DATABASE_URL

# AI Services  
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

# Session Security
SESSION_SECRET=$SESSION_SECRET

# Application Settings
NODE_ENV=production
HOST=0.0.0.0
PORT=5000

# Configuration Path (optional)
CONFIG_PATH=./config/settings.json

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Optional Integrations (leave empty if not used)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JIRA_API_TOKEN=
GITHUB_TOKEN=

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
LOG_FILE=
EOF

print_status "Created .env file with exported variables"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_status "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Build the application with environment variables
print_info "Building application with exported environment variables..."

# Export NODE_ENV for build process
export NODE_ENV=production

# Build with environment variables
npm run build

if [ $? -eq 0 ]; then
    print_status "Build completed successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Initialize database schema if database is available
if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_info "Setting up database schema..."
    
    # Run database migrations
    npm run db:push
    if [ $? -eq 0 ]; then
        print_status "Database schema created/updated"
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
    print_warning "Database not available - app will use in-memory storage"
fi

# Create simple start script
print_info "Creating start script..."
cat > start-server.sh << 'EOF'
#!/bin/bash
echo "Starting MATT server with exported environment variables..."

# Ensure all environment variables are still available
if [ -z "$DATABASE_URL" ] || [ -z "$ANTHROPIC_API_KEY" ] || [ -z "$SESSION_SECRET" ]; then
    echo "Environment variables not found, loading from .env file..."
    set -a
    source .env
    set +a
fi

# Start the server
NODE_ENV=production npm start
EOF

chmod +x start-server.sh
print_status "Created start-server.sh"

# Create health check script
print_info "Creating health check script..."
cat > check-health.js << 'EOF'
const http = require('http');

console.log('Checking MATT application health...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health/storage',
  method: 'GET',
  timeout: 10000
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('\n✅ Application Health Check:');
      console.log(`Storage Type: ${health.type}`);
      console.log(`Status: ${health.healthy ? 'Healthy ✅' : 'Unhealthy ❌'}`);
      console.log(`Message: ${health.message}`);
      
      if (health.details) {
        console.log('\nDetails:');
        if (health.type === 'database') {
          console.log(`- Projects in database: ${health.details.projectCount || 0}`);
          console.log(`- Database connected: ${health.details.connected ? 'Yes' : 'No'}`);
        } else {
          console.log(`- In-memory projects: ${health.details.projects || 0}`);
          console.log('- ⚠️  Data will be lost on restart (no database persistence)');
        }
      }
      
      console.log(`\nTimestamp: ${health.timestamp}`);
      
      if (health.type === 'database' && health.healthy) {
        console.log('\n🎉 Projects will persist between server restarts!');
      } else if (health.type === 'memory') {
        console.log('\n⚠️  Using fallback storage - projects will be lost on restart');
        console.log('   Check DATABASE_URL configuration if persistence is needed');
      }
      
    } catch (e) {
      console.log('❌ Health check response (not JSON):', data);
    }
  });
});

req.on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
  console.log('Make sure the server is running on port 5000');
});

req.on('timeout', () => {
  console.log('❌ Health check timed out');
  req.destroy();
});

req.end();
EOF

print_status "Created check-health.js"

echo ""
print_status "Deployment completed successfully!"
echo ""
print_info "Next steps:"
print_info "1. Start the server: ./start-server.sh"
print_info "2. Check health: node check-health.js"  
print_info "3. Access the application: http://demo.mars-techs.ai:5000"
echo ""
print_info "Environment Variables Used:"
print_info "- DATABASE_URL: $(echo $DATABASE_URL | sed 's/:.*@/:****@/')"
print_info "- ANTHROPIC_API_KEY: $(echo $ANTHROPIC_API_KEY | sed 's/.*/sk-ant-...***/')"
print_info "- SESSION_SECRET: [CONFIGURED]"
echo ""

if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    print_status "✅ Database connected - projects will persist!"
else
    print_warning "⚠️  Database not accessible - using in-memory storage"
    print_info "Projects will be lost on server restart"
fi

echo ""
print_info "🚀 MATT is ready for deployment!"