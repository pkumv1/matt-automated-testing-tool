# MATT Deployment Troubleshooting Guide

This guide provides comprehensive troubleshooting information for MATT application deployment issues.

## 🚨 Common Deployment Issues

### 1. Port Conflicts (EADDRINUSE)

**Error:** `listen EADDRINUSE: address already in use 0.0.0.0:5000`

**Solutions:**
```bash
# Find what's using port 5000
lsof -i :5000
# OR
ss -tlnp | grep :5000

# Kill the process
sudo kill -9 <PID>

# Check PM2 processes
pm2 list
pm2 delete all

# Try a different port
PORT=3001 npm start
```

### 2. Database Connection Issues

**Error:** Database connection failures, 500 errors on API calls

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -h localhost -U postgres -d testdb -c "SELECT version();"

# Check database logs
journalctl -u postgresql -n 20

# Verify environment variables
cat .env | grep -v "PASSWORD\|SECRET"

# Create database if missing
createdb testdb
```

### 3. Missing Dependencies

**Error:** Module not found errors

**Solutions:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify dependencies
npm list --depth=0

# Check for missing peer dependencies
npm audit
```

### 4. Build Issues

**Error:** Application not starting, missing dist directory

**Solutions:**
```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Verify build output
ls -la dist/
```

### 5. Permission Issues

**Error:** Cannot write to logs, permission denied

**Solutions:**
```bash
# Check ownership
ls -la /opt/reactproject/matt-automated-testing-tool/

# Fix permissions
sudo chown -R $USER:www-data /opt/reactproject/matt-automated-testing-tool/
sudo chmod 755 logs/
sudo chmod 644 logs/*.log
```

## 🔍 Diagnostic Tools

### Quick Health Check
```bash
curl http://localhost:5000/health
```

### Run Deployment Diagnostics
```bash
chmod +x deployment-diagnostics.sh
./deployment-diagnostics.sh
```

### Monitor Health
```bash
chmod +x health-monitor.sh
./health-monitor.sh

# Add to crontab for automatic monitoring
crontab -e
# Add: */5 * * * * /opt/reactproject/matt-automated-testing-tool/health-monitor.sh
```

## 📁 Log Locations

- **Application Log:** `logs/app-YYYY-MM-DD.log`
- **Error Log:** `logs/error-YYYY-MM-DD.log`
- **Debug Log:** `logs/debug-YYYY-MM-DD.log`
- **Performance Log:** `logs/performance-YYYY-MM-DD.log`
- **Health Monitor:** `logs/health-monitor.log`

## 🔧 Common Commands

### Real-time Monitoring
```bash
# Watch error logs
tail -f logs/error-*.log

# Watch application logs
tail -f logs/app-*.log

# Watch all logs
tail -f logs/*.log
```

### Process Management
```bash
# Check running processes
ps aux | grep node

# PM2 commands
pm2 list
pm2 restart matt-app
pm2 logs
pm2 flush
```

### System Resources
```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check CPU usage
top
```

## 🚀 Deployment Checklist

1. **Environment Setup**
   - [ ] Node.js installed
   - [ ] NPM installed
   - [ ] PostgreSQL running
   - [ ] Environment variables configured

2. **Application Build**
   - [ ] Dependencies installed (`npm install`)
   - [ ] Application built (`npm run build`)
   - [ ] Dist directory exists

3. **Database Setup**
   - [ ] PostgreSQL service running
   - [ ] Database created
   - [ ] Connection credentials correct

4. **Network Configuration**
   - [ ] Port 5000 available
   - [ ] Firewall configured
   - [ ] Nginx configured (if using)

5. **Permissions**
   - [ ] Application directory permissions
   - [ ] Log directory writable
   - [ ] Process can bind to port

## 📞 Getting Help

When reporting deployment issues, include:

1. **System Information:**
   - OS version
   - Node.js version
   - NPM version

2. **Error Details:**
   - Full error message
   - Error code
   - Timestamp

3. **Log Files:**
   - Recent error logs
   - Application logs
   - System logs

4. **Environment:**
   - Environment variables (without secrets)
   - Network configuration
   - Database status

## 🔄 Recovery Procedures

### Complete Reset
```bash
# Stop all processes
pm2 delete all

# Clean application
cd /opt/reactproject/matt-automated-testing-tool
rm -rf node_modules dist logs/*.log

# Reinstall and rebuild
npm install
npm run build

# Restart
npm start
```

### Database Reset
```bash
# Drop and recreate database
dropdb testdb
createdb testdb

# Run migrations if available
npm run migrate
```

This troubleshooting guide should help identify and resolve most deployment issues. For persistent problems, consult the enhanced logging output for detailed diagnostic information.