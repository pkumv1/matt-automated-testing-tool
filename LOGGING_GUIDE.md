# MATT Logging and Diagnostics Guide

## Overview

MATT now includes extensive logging and diagnostic capabilities to help troubleshoot issues during development and production deployment.

## Log Files

The application generates multiple log files in the `logs/` directory:

- **`app-{date}.log`** - Main application log with all events
- **`error-{date}.log`** - Error-specific log for quick issue identification
- **`debug-{date}.log`** - Debug and trace logs for detailed troubleshooting
- **`performance-{date}.log`** - Performance metrics and slow operation tracking

## Viewing Logs

### Real-time Log Monitoring

```bash
# View all logs in real-time
npm run logs:tail

# View only error logs
npm run logs:errors

# View debug logs
npm run logs:debug
```

### Log Levels

- **INFO** (Cyan) - General information about application flow
- **WARN** (Yellow) - Warning conditions that don't prevent operation
- **ERROR** (Red) - Error conditions that need attention
- **DEBUG** (Magenta) - Detailed debug information
- **TRACE** (White) - Very detailed trace information
- **FATAL** (Red background) - Fatal errors that cause application shutdown

## Diagnostics

### Running Diagnostics

```bash
npm run diagnostics
```

This will perform comprehensive system checks including:

1. **Environment Variables** - Validates all required configuration
2. **System Information** - CPU, memory, OS details
3. **Dependencies** - Checks if all packages are installed
4. **Database Connection** - Tests database connectivity
5. **File System** - Verifies required directories and permissions
6. **Network** - Checks if the configured port is available
7. **Build Status** - Verifies production build exists (if in production mode)

The diagnostic report is saved to `logs/diagnostic-{timestamp}.json`

### Health Check Endpoint

```bash
curl http://localhost:3001/health
```

Returns detailed system health information including:
- Application status
- Database connectivity
- Memory usage
- CPU usage
- Uptime
- Service availability
- Log file locations

## Troubleshooting Common Issues

### 502 Bad Gateway Error

1. Check the latest error logs:
   ```bash
   tail -100 logs/error-*.log
   ```

2. Run diagnostics:
   ```bash
   npm run diagnostics
   ```

3. Common causes:
   - TypeScript compilation errors
   - Missing environment variables
   - Database connection issues
   - Port already in use
   - Missing dependencies

### High Memory Usage

The application monitors memory usage and logs warnings when heap usage exceeds 500MB. Check performance logs:

```bash
tail -f logs/performance-*.log
```

### Slow Performance

- Requests taking >1 second are logged as SLOW
- Database queries >100ms are logged as slow queries
- Check performance logs for bottlenecks

## Log Analysis

### Finding Specific Errors

```bash
# Search for specific error types
grep "DATABASE_ERROR" logs/error-*.log

# Find all 500 errors
grep "500" logs/app-*.log | grep "SERVER ERROR"

# Find slow requests
grep "SLOW" logs/app-*.log
```

### Performance Analysis

```bash
# Find slowest operations
grep "duration" logs/performance-*.log | sort -k3 -n -r | head -20
```

## Production Deployment

### Pre-deployment Checklist

1. Run diagnostics to ensure system is ready:
   ```bash
   npm run diagnostics
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Test the production build locally:
   ```bash
   NODE_ENV=production npm start
   ```

4. Monitor logs during deployment:
   ```bash
   npm run logs:tail
   ```

### Post-deployment Monitoring

1. Check health endpoint:
   ```bash
   curl https://your-domain.com/health
   ```

2. Monitor error logs:
   ```bash
   ssh your-server "tail -f /path/to/app/logs/error-*.log"
   ```

## Log Rotation

Logs are created daily with date stamps. To clean old logs:

```bash
# Remove logs older than 7 days
find logs/ -name "*.log" -mtime +7 -delete
```

Or use the clean script:

```bash
npm run clean
```

## Environment Variables for Logging

- `NODE_ENV` - Set to 'development' for verbose logging
- `LOG_LEVEL` - (Optional) Override default log level
- `MAX_LOG_SIZE` - (Optional) Maximum log file size before rotation

## Support

If you encounter issues:

1. Run diagnostics first
2. Check error logs for specific error messages
3. Review the health check endpoint
4. Enable debug logging by setting NODE_ENV=development

Remember to sanitize any logs before sharing them as they may contain sensitive information.