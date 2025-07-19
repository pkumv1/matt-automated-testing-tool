#!/bin/bash

# MATT Production Environment Setup Script
# Run this script on the server to set up the production environment

echo "🔧 Setting up MATT Production Environment"
echo "========================================"

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    echo "Please run this script from: /opt/reactproject/matt-automated-testing-tool"
    exit 1
fi

echo "✅ In MATT project directory: $(pwd)"
echo ""

# Check if environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: Required environment variables not set"
    echo "Please export these variables first:"
    echo "export DATABASE_URL=\"postgresql://postgres:password@localhost:5432/postgres\""
    echo "export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
    exit 1
fi

# Create production .env file
echo "📝 Creating production .env file..."
cat > .env << EOF
# MATT Production Environment Configuration
NODE_ENV=production
PORT=5000

# Database Configuration  
DATABASE_URL=${DATABASE_URL}

# AI Services
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Session Security - Auto-generated secure secret
SESSION_SECRET=matt-prod-secret-$(date +%s)-$(openssl rand -hex 16)

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

# Optional Integrations (leave empty if not used)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JIRA_API_TOKEN=
GITHUB_TOKEN=
EOF

echo "✅ Production .env file created"
echo ""

# Set proper permissions
chmod 600 .env
echo "✅ Set secure permissions on .env file (600)"
echo ""

# Verify the file was created correctly
echo "🔍 Verifying .env file contents:"
echo "NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo "PORT: $(grep PORT .env | cut -d'=' -f2)"
echo "DATABASE_URL: $(grep DATABASE_URL .env | cut -d'=' -f2 | sed 's/:[^@]*@/:****@/')"
echo "ANTHROPIC_API_KEY: $(grep ANTHROPIC_API_KEY .env | cut -d'=' -f2 | cut -c1-20)..."
echo "SESSION_SECRET: $(grep SESSION_SECRET .env | cut -d'=' -f2 | cut -c1-20)..."
echo ""

# Test database connection
echo "🗄️  Testing database connection..."
if command -v psql &> /dev/null; then
    DATABASE_URL_TEST=$(grep DATABASE_URL .env | cut -d'=' -f2)
    # Replace 'host' with 'localhost' if needed
    DATABASE_URL_FIXED=$(echo "$DATABASE_URL_TEST" | sed 's/@host:/@localhost:/')
    
    echo "Testing connection to: $(echo "$DATABASE_URL_FIXED" | sed 's/:[^@]*@/:****@/')"
    
    if timeout 5 psql "$DATABASE_URL_FIXED" -c "SELECT 1;" &>/dev/null; then
        echo "✅ Database connection successful"
        # Update .env with the working URL
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL_FIXED|" .env
        echo "✅ Updated DATABASE_URL in .env file"
    else
        echo "❌ Database connection failed"
        echo "Please check:"
        echo "1. PostgreSQL is running: systemctl status postgresql"
        echo "2. Database exists: psql -l"
        echo "3. Correct host (localhost vs host): $DATABASE_URL_FIXED"
        echo ""
        echo "Common fixes:"
        echo "- Replace 'host' with 'localhost' in DATABASE_URL"
        echo "- Check if PostgreSQL is running on port 5432"
        echo "- Verify database name and credentials"
    fi
else
    echo "⚠️  psql not available, skipping database test"
fi
echo ""

# Create required directories
echo "📁 Creating required directories..."
mkdir -p uploads logs backups config
echo "✅ Created directories: uploads, logs, backups, config"
echo ""

# Test environment loading
echo "🧪 Testing environment loading..."
if node -e "
    require('dotenv').config();
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'Set' : 'Missing');
    console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Missing');
" 2>/dev/null; then
    echo "✅ Environment variables loaded successfully"
else
    echo "❌ Failed to load environment variables"
    echo "Please install dotenv: npm install dotenv"
fi
echo ""

echo "🎉 Production environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run build"
echo "3. Run: pm2 start ecosystem.config.cjs --env production"
echo "4. Check: pm2 logs matt-production"
echo "5. Test: curl http://localhost:5000/health"
echo ""
echo "🔐 Security reminder:"
echo "- Change SESSION_SECRET to a unique value if needed"
echo "- Ensure .env file has restricted permissions (600)"
echo "- Never commit .env file to version control"
echo ""