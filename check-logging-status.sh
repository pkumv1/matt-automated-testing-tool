#!/bin/bash

# MATT Application Logging Status Check
# Enhanced logging verification and troubleshooting script

LOG_DIR="./logs"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=============================================="
echo "🔍 MATT Application - Logging Status Check"
echo "=============================================="
echo "📅 Date: $TIMESTAMP"
echo ""

# Check if logs directory exists
if [ -d "$LOG_DIR" ]; then
    echo "✅ Logs directory exists: $LOG_DIR"
else
    echo "❌ Logs directory not found: $LOG_DIR"
    echo "   Creating logs directory..."
    mkdir -p "$LOG_DIR"
    echo "✅ Created logs directory"
fi

echo ""
echo "📊 Log Files Status:"
echo "===================="

# Check for log files
if ls $LOG_DIR/*.log 1> /dev/null 2>&1; then
    echo "📁 Found log files:"
    ls -lah $LOG_DIR/*.log | while read line; do
        echo "   $line"
    done
    
    echo ""
    echo "📈 Log File Sizes:"
    du -h $LOG_DIR/*.log | while read size file; do
        echo "   $size - $(basename $file)"
    done
else
    echo "⚠️  No log files found in $LOG_DIR"
fi

echo ""
echo "🔍 Recent Log Activity (Last 10 lines):"
echo "========================================"

# Check recent application logs
if [ -f "$LOG_DIR/app-$DATE.log" ]; then
    echo "📋 Application Log (app-$DATE.log):"
    tail -10 "$LOG_DIR/app-$DATE.log" | sed 's/^/   /'
else
    echo "⚠️  No application log for today"
fi

echo ""

# Check recent error logs
if [ -f "$LOG_DIR/error-$DATE.log" ]; then
    echo "🔴 Error Log (error-$DATE.log):"
    tail -10 "$LOG_DIR/error-$DATE.log" | sed 's/^/   /'
else
    echo "✅ No error log for today (good!)"
fi

echo ""

# Check recent performance logs
if [ -f "$LOG_DIR/performance-$DATE.log" ]; then
    echo "⚡ Performance Log (performance-$DATE.log):"
    tail -10 "$LOG_DIR/performance-$DATE.log" | sed 's/^/   /'
else
    echo "⚠️  No performance log for today"
fi

echo ""
echo "🔧 Enhanced Logging Configuration:"
echo "=================================="

# Check if enhanced logging config exists
if [ -f "./enhanced-logging-config.ts" ]; then
    echo "✅ Enhanced logging configuration found"
    echo "📝 Current configuration preview:"
    grep -A 15 "detailedLoggingConfig:" ./enhanced-logging-config.ts | sed 's/^/   /'
else
    echo "❌ Enhanced logging configuration not found"
fi

echo ""
echo "🚀 Application Process Status:"
echo "=============================="

# Check if application is running
if pgrep -f "node.*server" > /dev/null; then
    echo "✅ Application appears to be running"
    echo "📊 Process details:"
    ps aux | grep "node.*server" | grep -v grep | sed 's/^/   /'
else
    echo "❌ Application does not appear to be running"
fi

echo ""
echo "💾 Disk Space Check:"
echo "==================="

# Check disk space
df -h . | head -2 | sed 's/^/   /'

echo ""
echo "📊 Log Statistics:"
echo "=================="

# Count log entries by level
if ls $LOG_DIR/*.log 1> /dev/null 2>&1; then
    echo "🔍 Log Level Distribution (Today):"
    
    # Count different log levels
    ERROR_COUNT=$(grep -c "ERROR\|FATAL" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    WARN_COUNT=$(grep -c "WARN" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    INFO_COUNT=$(grep -c "INFO" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    DEBUG_COUNT=$(grep -c "DEBUG" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    
    echo "   🔴 ERRORS: $ERROR_COUNT"
    echo "   🟡 WARNINGS: $WARN_COUNT"
    echo "   🔵 INFO: $INFO_COUNT"
    echo "   🔍 DEBUG: $DEBUG_COUNT"
    
    echo ""
    echo "🌐 API Request Statistics (Today):"
    
    # Count API requests
    API_COUNT=$(grep -c "HTTP_REQUEST\|API_REQUEST" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    ERROR_RESPONSES=$(grep -c "HTTP_RESPONSE.*[45][0-9][0-9]" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    SLOW_REQUESTS=$(grep -c "SLOW" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    
    echo "   📡 Total API Requests: $API_COUNT"
    echo "   ❌ Error Responses (4xx/5xx): $ERROR_RESPONSES"
    echo "   🐌 Slow Requests: $SLOW_REQUESTS"
    
    echo ""
    echo "🗄️  Database Operations (Today):"
    
    # Count database operations
    DB_COUNT=$(grep -c "DB_OPERATION\|DATABASE" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    DB_ERRORS=$(grep -c "DATABASE_ERROR\|DB.*ERROR" $LOG_DIR/*$DATE*.log 2>/dev/null || echo "0")
    
    echo "   🗄️  Database Operations: $DB_COUNT"
    echo "   ❌ Database Errors: $DB_ERRORS"
else
    echo "⚠️  No logs found for analysis"
fi

echo ""
echo "🔄 Log Rotation Status:"
echo "======================"

# Check log file ages
if ls $LOG_DIR/*.log 1> /dev/null 2>&1; then
    echo "📅 Log file ages:"
    find $LOG_DIR -name "*.log" -type f -exec ls -la {} \; | awk '{print $6, $7, $8, $9}' | sed 's/^/   /'
    
    # Check for old log files (older than 7 days)
    OLD_LOGS=$(find $LOG_DIR -name "*.log" -type f -mtime +7 2>/dev/null)
    if [ -n "$OLD_LOGS" ]; then
        echo ""
        echo "🗑️  Old log files (>7 days) - consider archiving:"
        echo "$OLD_LOGS" | sed 's/^/   /'
    else
        echo ""
        echo "✅ No old log files found"
    fi
fi

echo ""
echo "🔧 Troubleshooting Commands:"
echo "============================"
echo "   📖 View live logs: tail -f $LOG_DIR/app-$DATE.log"
echo "   🔍 Search for errors: grep -i error $LOG_DIR/*.log"
echo "   ⚡ Monitor performance: grep PERFORMANCE $LOG_DIR/*.log"
echo "   🌐 Monitor API calls: grep HTTP_REQUEST $LOG_DIR/*.log"
echo "   🗄️  Monitor database: grep DB_OPERATION $LOG_DIR/*.log"

echo ""
echo "=============================================="
echo "✅ Logging status check completed!"
echo "📧 For issues, check the logs above or contact support"
echo "=============================================="