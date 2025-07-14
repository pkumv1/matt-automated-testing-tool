# MATT Logging and Debugging Guide

## Overview

MATT includes comprehensive logging and error handling to help diagnose issues during development and production.

## Log Files

All logs are stored in the `./logs` directory:

- `app-YYYY-MM-DD.log` - Daily application logs in JSON format
- `pm2-error.log` - PM2 error logs (production)
- `pm2-out.log` - PM2 standard output (production)
- `pm2-combined.log` - Combined PM2 logs
- `debug.log` - Debug mode output

## Running with Logging

### Development Mode with Full Logging

```bash
# Using the debug script
chmod +x debug-start.sh
./debug-start.sh

# Or manually with environment variables
LOG_LEVEL=debug DEBUG=express:* npm run dev
```

### Production with PM2

```bash
# Start with PM2 using ecosystem config
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs matt-production --lines 100
```

### Development with PM2

```bash
# Start development with PM2
pm2 start ecosystem.config.js --only matt-dev

# Stream logs
pm2 logs matt-dev
```

## Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages (e.g., slow queries)
- **ERROR**: Error messages with stack traces

## Features

### 1. Request/Response Logging
- All API requests and responses are logged
- Request duration tracking
- Slow query detection (>1 second)
- Request IDs for tracing

### 2. Database Operation Logging
- All database queries are logged
- Query execution time tracking
- Error code translation
- Large data size warnings

### 3. Error Handling
- Comprehensive error logging with stack traces
- PostgreSQL error code handling
- User-friendly error messages
- Context preservation

### 4. Health Monitoring
- `/health` endpoint for system status
- Database connection health check
- Service availability monitoring

## Viewing Logs

### Real-time Monitoring

```bash
# Watch application logs
tail -f logs/app-$(date +%Y-%m-%d).log | jq '.'

# Watch all logs
tail -f logs/*.log

# Filter errors only
tail -f logs/app-$(date +%Y-%m-%d).log | grep ERROR

# Watch PM2 logs
pm2 logs --lines 100
```

### Log Analysis

```bash
# Count errors by type
grep ERROR logs/app-*.log | jq '.message' | sort | uniq -c

# Find slow queries
grep "Slow database operation" logs/app-*.log | jq '.data.duration'

# Track specific request
grep "requestId-123" logs/app-*.log
```

## Debugging Database Issues

The application provides specific error messages for common PostgreSQL issues:

- **ECONNREFUSED**: PostgreSQL not running
- **28P01**: Authentication failed
- **3D000**: Database doesn't exist
- **23505**: Duplicate entry
- **23503**: Foreign key violation

## Environment Variables for Logging

```env
# Set in .env file
LOG_LEVEL=debug          # debug, info, warn, error
DEBUG=express:*          # Enable Express debug output
NODE_ENV=development     # Enable development features
```

## Troubleshooting

### No Logs Appearing

1. Check logs directory exists: `mkdir -p logs`
2. Check write permissions: `chmod 755 logs`
3. Verify LOG_LEVEL is set: `echo $LOG_LEVEL`

### Database Connection Errors

1. Check PostgreSQL status: `sudo systemctl status postgresql`
2. Test connection: `psql "$DATABASE_URL"`
3. Check logs: `tail -f logs/app-*.log | grep Database`

### High Memory Usage

1. Check log file sizes: `du -h logs/*`
2. Rotate logs if needed: `mv logs/app-*.log logs/archive/`
3. Adjust PM2 memory limit in ecosystem.config.js

## Log Rotation

For production, consider setting up log rotation:

```bash
# Install logrotate configuration
sudo tee /etc/logrotate.d/matt << EOF
/opt/reactproject/matt-automated-testing-tool/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

## Best Practices

1. Always check logs when debugging issues
2. Use request IDs to trace specific requests
3. Monitor slow query warnings
4. Set appropriate log levels for each environment
5. Regularly clean up old log files
6. Use structured logging for easy parsing
