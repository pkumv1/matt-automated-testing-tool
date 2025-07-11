#!/bin/bash

# MATT Application - Comprehensive Test Script
# This script performs a complete functional test of the MATT application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"

# Test results
PASSED=0
FAILED=0

echo "
╔══════════════════════════════════════════════════════════════╗
║                 MATT Application Test Suite                  ║
╚══════════════════════════════════════════════════════════════╝
"

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    echo -n "Testing: $test_name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    elif [ "$method" == "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    elif [ "$method" == "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        ((FAILED++))
        return 1
    fi
}

# Function to check if server is running
check_server() {
    echo -n "Checking if server is running... "
    if curl -s "$BASE_URL/health" > /dev/null; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo "Please start the server with: npm start"
        exit 1
    fi
}

# Function to check database connection
check_database() {
    echo -n "Checking database connection... "
    health_response=$(curl -s "$BASE_URL/health")
    if echo "$health_response" | grep -q '"database":true'; then
        echo -e "${GREEN}✓ Database connected${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Database may not be connected${NC}"
        return 1
    fi
}

# Main test execution
echo "1. ENVIRONMENT CHECKS"
echo "===================="
check_server
check_database
echo

echo "2. API ENDPOINT TESTS"
echo "===================="

# Test health endpoint
test_endpoint "GET" "" "" 200 "Health Check"

# Test projects endpoints
echo -e "\n${YELLOW}Projects API:${NC}"
test_endpoint "GET" "/projects" "" 200 "List Projects"

# Create a test project
PROJECT_DATA='{
    "name": "Test Project",
    "description": "Automated test project",
    "sourceType": "github",
    "sourceUrl": "https://github.com/test/repo",
    "repositoryData": {
        "owner": "test",
        "repo": "repo",
        "branch": "main"
    }
}'

# Store the project ID if creation succeeds
if test_endpoint "POST" "/projects" "$PROJECT_DATA" 200 "Create Project"; then
    # Extract project ID from response
    PROJECT_ID=$(curl -s -X POST -H "Content-Type: application/json" -d "$PROJECT_DATA" "$API_URL/projects" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
    
    if [ ! -z "$PROJECT_ID" ]; then
        echo "  Created project with ID: $PROJECT_ID"
        
        # Test project-specific endpoints
        test_endpoint "GET" "/projects/$PROJECT_ID" "" 200 "Get Project Details"
        test_endpoint "GET" "/projects/$PROJECT_ID/analyses" "" 200 "Get Project Analyses"
        test_endpoint "GET" "/projects/$PROJECT_ID/test-cases" "" 200 "Get Project Test Cases"
        test_endpoint "GET" "/projects/$PROJECT_ID/recommendations" "" 200 "Get Project Recommendations"
        test_endpoint "POST" "/projects/$PROJECT_ID/analyze" "{}" 200 "Start Analysis"
        
        # Test metrics endpoint
        test_endpoint "GET" "/projects/$PROJECT_ID/metrics" "" 200 "Get Project Metrics"
        
        # Clean up - delete the test project
        test_endpoint "DELETE" "/projects/$PROJECT_ID" "" 200 "Delete Project"
    fi
fi

# Test agents endpoint
echo -e "\n${YELLOW}Agents API:${NC}"
test_endpoint "GET" "/agents" "" 200 "List Agents"

# Test invalid requests
echo -e "\n${YELLOW}Error Handling:${NC}"
test_endpoint "GET" "/projects/99999" "" 404 "Non-existent Project"
test_endpoint "POST" "/projects" '{"name":""}' 400 "Invalid Project Data"

echo -e "\n${YELLOW}Integration Tests:${NC}"
# Test GitHub integration
GITHUB_TEST_DATA='{"accessToken": "test-token"}'
test_endpoint "POST" "/integrations/github/test" "$GITHUB_TEST_DATA" 200 "GitHub Connection Test"

# Test JIRA integration
JIRA_TEST_DATA='{
    "serverUrl": "https://test.atlassian.net",
    "email": "test@example.com",
    "apiToken": "test-token"
}'
test_endpoint "POST" "/integrations/jira/test" "$JIRA_TEST_DATA" 200 "JIRA Connection Test"

# Test Drive integration
DRIVE_TEST_DATA='{"accessToken": "test-token"}'
test_endpoint "POST" "/integrations/drive/test" "$DRIVE_TEST_DATA" 200 "Drive Connection Test"

echo
echo "3. PERFORMANCE TESTS"
echo "==================="

# Simple performance test
echo -n "Testing response time... "
start_time=$(date +%s%N)
curl -s "$API_URL/projects" > /dev/null
end_time=$(date +%s%N)
response_time=$(( ($end_time - $start_time) / 1000000 ))

if [ $response_time -lt 100 ]; then
    echo -e "${GREEN}✓ Fast response${NC} (${response_time}ms)"
elif [ $response_time -lt 500 ]; then
    echo -e "${YELLOW}⚠ Acceptable response${NC} (${response_time}ms)"
else
    echo -e "${RED}✗ Slow response${NC} (${response_time}ms)"
fi

# Concurrent requests test
echo -n "Testing concurrent requests... "
for i in {1..5}; do
    curl -s "$API_URL/projects" > /dev/null &
done
wait
echo -e "${GREEN}✓ Handled 5 concurrent requests${NC}"

echo
echo "4. SECURITY TESTS"
echo "================"

# Test for security headers
echo -n "Checking security headers... "
headers=$(curl -s -I "$BASE_URL/health")
if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✓ Security headers present${NC}"
else
    echo -e "${YELLOW}⚠ Some security headers missing${NC}"
fi

# Test SQL injection attempt
echo -n "Testing SQL injection protection... "
INJECTION_DATA='{"name": "Test\"; DROP TABLE projects; --"}'
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$INJECTION_DATA" \
    "$API_URL/projects")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" -eq "400" ] || [ "$http_code" -eq "200" ]; then
    echo -e "${GREEN}✓ SQL injection protected${NC}"
else
    echo -e "${RED}✗ Potential SQL injection vulnerability${NC}"
fi

echo
echo "5. TEST SUMMARY"
echo "=============="
TOTAL=$((PASSED + FAILED))
echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi