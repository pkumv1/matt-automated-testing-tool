#!/bin/bash

echo "🚀 Starting MATT in debug mode..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p logs

# Clear old logs
echo -e "${YELLOW}📄 Clearing old logs...${NC}"
> logs/app.log
> logs/debug.log
> logs/error.log

# Check prerequisites
echo -e "\n${YELLOW}🔍 Checking prerequisites...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "   Please create .env file from .env.example"
    exit 1
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check database connection
echo -e "\n${YELLOW}🔍 Testing database connection...${NC}"
node -e "
const { config } = require('dotenv');
config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
"

# Check PostgreSQL service
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    echo "   Run: sudo systemctl start postgresql"
fi

# Check if port 5000 is available
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${RED}❌ Port 5000 is already in use${NC}"
    echo "   Kill the process using: kill $(lsof -t -i:5000)"
    exit 1
else
    echo -e "${GREEN}✅ Port 5000 is available${NC}"
fi

# Start the application with all debugging enabled
echo -e "\n${YELLOW}🔧 Starting application with full debugging...${NC}"
echo "=================================="
echo "Logs will be written to:"
echo "  - Console output (colored)"
echo "  - ./logs/app-$(date +%Y-%m-%d).log"
echo "  - ./logs/debug.log"
echo "=================================="

# Export debug environment variables
export NODE_ENV=development
export LOG_LEVEL=debug
export DEBUG=express:*,http:*
export NODE_OPTIONS="--trace-warnings"

# Run the application
npm run dev 2>&1 | tee -a logs/debug.log

# If the application exits
echo -e "\n${RED}❌ Application exited${NC}"
echo "Check logs/debug.log for details"
