#!/bin/bash

# MATT Environment Variables Fix Script
# This fixes the DATABASE_URL not being found issue

echo "🔧 Fixing Environment Variables for MATT"
echo "========================================"

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in MATT project directory"
    exit 1
fi

echo "✅ In MATT project directory: $(pwd)"

# Check if environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Environment variables not set in current shell"
    echo "Please run these commands first:"
    echo ""
    echo "export DATABASE_URL=\"postgresql://postgres:post123@localhost:5432/postgres\""
    echo "export ANTHROPIC_API_KEY=\"sk-ant-api03-YOUR_ACTUAL_KEY_HERE\""
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ Environment variables found in shell"
echo "DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:****@/')"
echo "ANTHROPIC_API_KEY: $(echo $ANTHROPIC_API_KEY | cut -c1-20)..."
echo ""

# Stop any running PM2 processes
echo "🛑 Stopping PM2 processes..."
pm2 stop matt-production 2>/dev/null || echo "No process to stop"
pm2 delete matt-production 2>/dev/null || echo "No process to delete"

# Kill any process on port 5000
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    echo "🔌 Killing process on port 5000: $PID"
    kill -9 $PID
fi

# Create or update .env file with current environment variables
echo "📝 Creating .env file with current environment variables..."
cat > .env << EOF
# MATT Production Environment - Generated $(date)
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=${DATABASE_URL}

# AI Services  
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Session Security
SESSION_SECRET=matt-prod-secret-$(date +%s)-$(openssl rand -hex 16 2>/dev/null || echo "fallback-secret")

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Logging
LOG_LEVEL=info
LOG_FILE=

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Configuration Path
CONFIG_PATH=./config/settings.json

# Optional Integrations
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JIRA_API_TOKEN=
GITHUB_TOKEN=
EOF

echo "✅ .env file created"

# Set secure permissions
chmod 600 .env
echo "✅ Set secure permissions on .env file"

# Verify .env file content
echo ""
echo "🔍 Verifying .env file:"
echo "NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo "PORT: $(grep PORT .env | cut -d'=' -f2)"
echo "DATABASE_URL: $(grep DATABASE_URL .env | cut -d'=' -f2 | sed 's/:[^@]*@/:****@/')"
echo "ANTHROPIC_API_KEY: $(grep ANTHROPIC_API_KEY .env | cut -d'=' -f2 | cut -c1-20)..."
echo ""

# Test database connection
echo "🗄️  Testing database connection..."
if command -v psql &> /dev/null; then
    # Test the connection string
    DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2)
    # Replace 'host' with 'localhost' if needed
    DB_URL_FIXED=$(echo "$DB_URL" | sed 's/@host:/@localhost:/')
    
    if [ "$DB_URL" != "$DB_URL_FIXED" ]; then
        echo "🔧 Fixing database host (host -> localhost)..."
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_URL_FIXED|" .env
        echo "✅ Updated DATABASE_URL in .env"
    fi
    
    echo "Testing connection: $(echo "$DB_URL_FIXED" | sed 's/:[^@]*@/:****@/')"
    if timeout 5 psql "$DB_URL_FIXED" -c "SELECT 1;" &>/dev/null; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        echo "Check: systemctl status postgresql"
    fi
else
    echo "⚠️  psql not available"
fi

# Create required directories
echo ""
echo "📁 Creating directories..."
mkdir -p uploads logs backups config
echo "✅ Directories created"

# Test environment loading with Node.js
echo ""
echo "🧪 Testing environment loading..."
if command -v node &> /dev/null; then
    node -e "
        require('dotenv').config();
        console.log('✅ NODE_ENV:', process.env.NODE_ENV);
        console.log('✅ PORT:', process.env.PORT);
        console.log('✅ DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING');
        console.log('✅ ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING');
        console.log('✅ SESSION_SECRET:', process.env.SESSION_SECRET ? 'SET' : 'MISSING');
    " 2>/dev/null || echo "❌ Environment test failed"
else
    echo "⚠️  Node.js not available for testing"
fi

echo ""
echo "🏗️  Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Start with PM2 using the ecosystem config
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Wait for startup
sleep 10

# Check PM2 status
echo ""
echo "📊 PM2 Status:"
pm2 list

# Check if process is running
if pm2 describe matt-production &>/dev/null; then
    echo "✅ PM2 process started"
    
    # Test health endpoint
    echo ""
    echo "🏥 Testing health endpoint..."
    for i in {1..5}; do
        if curl -s http://localhost:5000/health | grep -q "status"; then
            echo "✅ Application is responding on port 5000"
            curl -s http://localhost:5000/health | head -5
            break
        else
            echo "Attempt $i: Waiting for application..."
            sleep 5
        fi
    done
else
    echo "❌ PM2 process failed to start"
    echo ""
    echo "📋 Checking logs:"
    pm2 logs matt-production --lines 20 --nostream
fi

echo ""
echo "🎉 Environment fix complete!"
echo ""
echo "🔗 Test URLs:"
echo "• Health: http://localhost:5000/health"
echo "• Application: http://localhost:5000/"
echo ""
echo "📋 Useful commands:"
echo "• Check logs: pm2 logs matt-production"
echo "• Restart: pm2 restart matt-production"
echo "• Stop: pm2 stop matt-production"
echo ""