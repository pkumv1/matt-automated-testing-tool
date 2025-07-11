#!/bin/bash

# MATT Application - Automated Test Suite
# This script performs comprehensive testing of the MATT application
# Run with: bash automated-test-suite.sh

echo "================================================"
echo "MATT Automated Testing Tool - Test Suite"
echo "================================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    echo -n "Checking: $description... "
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    echo -n "Checking: $description... "
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. FILE STRUCTURE TESTS"
echo "======================="
check_file "package.json" "Package configuration"
check_file "tsconfig.json" "TypeScript configuration"
check_file ".env.example" "Environment template"
check_file "vite.config.ts" "Vite configuration"
check_file "tailwind.config.ts" "Tailwind configuration"
check_file "drizzle.config.ts" "Database configuration"
check_dir "client" "Frontend directory"
check_dir "server" "Backend directory"
check_dir "shared" "Shared types directory"
check_dir "__tests__" "Test directory"
echo ""

echo "2. DEPENDENCY TESTS"
echo "==================="
run_test "Node modules installed" "[ -d 'node_modules' ]"
run_test "React installed" "[ -d 'node_modules/react' ]"
run_test "Express installed" "[ -d 'node_modules/express' ]"
run_test "TypeScript installed" "[ -d 'node_modules/typescript' ]"
run_test "Drizzle ORM installed" "[ -d 'node_modules/drizzle-orm' ]"
run_test "Anthropic SDK installed" "[ -d 'node_modules/@anthropic-ai' ]"
echo ""

echo "3. INTEGRATION SERVICE TESTS"
echo "============================"
check_file "server/services/google-drive-integration.ts" "Google Drive integration"
check_file "server/services/jira-integration.ts" "JIRA integration"
check_file "server/services/github-integration.ts" "GitHub integration"
check_file "server/services/anthropic.ts" "AI service"
check_file "server/services/agents.ts" "Multi-agent system"
echo ""

echo "4. FRONTEND COMPONENT TESTS"
echo "==========================="
check_file "client/src/App.tsx" "Main App component"
check_file "client/src/components/code-acquisition.tsx" "Code acquisition component"
check_file "client/src/components/agent-status.tsx" "Agent status component"
check_file "client/src/components/modern-dashboard.tsx" "Dashboard component"
check_file "client/src/pages/modern-dashboard-page.tsx" "Dashboard page"
echo ""

echo "5. DATABASE SCHEMA TESTS"
echo "========================"
check_file "shared/schema.ts" "Database schema definitions"
check_file "init-database.sql" "Database initialization script"
run_test "Schema exports Project type" "grep -q 'export type Project' shared/schema.ts"
run_test "Schema exports Analysis type" "grep -q 'export type Analysis' shared/schema.ts"
run_test "Schema exports TestCase type" "grep -q 'export type TestCase' shared/schema.ts"
echo ""

echo "6. BUILD TESTS"
echo "=============="
run_test "TypeScript compilation" "npx tsc --noEmit"
echo ""

echo "7. SECURITY TESTS"
echo "================="
run_test "No hardcoded secrets in code" "! grep -r 'sk-ant-' --include='*.ts' --include='*.tsx' --include='*.js' ."
run_test "Environment validation exists" "grep -q 'validateEnvironment' server/config.ts"
run_test "Session configuration exists" "grep -q 'SESSION_SECRET' server/config.ts"
echo ""

echo "8. DOCUMENTATION TESTS"
echo "====================="
check_file "README.md" "Main documentation"
check_file "PRODUCTION_READY.md" "Production guide"
check_file "DEPLOYMENT_GUIDE.md" "Deployment guide"
check_file "SYSTEM_REQUIREMENTS.md" "System requirements"
check_file "GITHUB_INTEGRATION_GUIDE.md" "GitHub integration guide"
echo ""

echo "9. TEST SUITE EXECUTION"
echo "======================="
if command -v npm &> /dev/null; then
    run_test "Jest test suite runs" "npm test -- --passWithNoTests"
else
    echo -e "${YELLOW}⚠ npm not found, skipping test execution${NC}"
fi
echo ""

echo "10. API ENDPOINT TESTS (if server running)"
echo "=========================================="
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    run_test "Server is running" "curl -s http://localhost:5000"
    run_test "Projects API endpoint" "curl -s http://localhost:5000/api/projects"
    run_test "Agents API endpoint" "curl -s http://localhost:5000/api/agents"
else
    echo -e "${YELLOW}⚠ Server not running, skipping API tests${NC}"
    echo "  Start server with: npm run dev"
fi
echo ""

# Summary
echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo "The application is ready for deployment."
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo "Please fix the issues before deployment."
    exit 1
fi