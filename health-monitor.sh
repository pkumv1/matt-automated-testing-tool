#!/bin/bash
# MATT Production Health Monitoring
# Save this as: /opt/reactproject/matt-automated-testing-tool/health-monitor.sh
# Add to crontab: */5 * * * * /opt/reactproject/matt-automated-testing-tool/health-monitor.sh

APP_DIR="/opt/reactproject/matt-automated-testing-tool"
LOG_DIR="$APP_DIR/logs"
HEALTH_LOG="$LOG_DIR/health-monitor.log"
ALERT_EMAIL="admin@mars-techs.ai"  # Change this to your admin email

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log_alert() {
  echo "[$(timestamp)] ALERT: $1" >> "$HEALTH_LOG"
  # Uncomment to send email alerts:
  # echo "$1" | mail -s "MATT Health Alert" "$ALERT_EMAIL"
}

log_info() {
  echo "[$(timestamp)] INFO: $1" >> "$HEALTH_LOG"
}

# Check if application is responding
if ! curl -s -f http://localhost:5000/health > /dev/null; then
  log_alert "Application health check failed - service may be down"
  
  # Try to restart if PM2 is being used
  if command -v pm2 > /dev/null; then
    log_info "Attempting to restart application via PM2"
    pm2 restart matt-app 2>> "$HEALTH_LOG"
  fi
else
  log_info "Application health check passed"
fi

# Check disk space (alert if >90% full)
DISK_USAGE=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
  log_alert "Disk space critical: ${DISK_USAGE}% used"
fi

# Check memory usage (alert if >90% used)
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
  log_alert "Memory usage critical: ${MEMORY_USAGE}% used"
fi

# Check for recent errors
ERROR_COUNT=$(grep "$(date '+%Y-%m-%d %H')" "$LOG_DIR/error-*.log" 2>/dev/null | wc -l)
if [ "$ERROR_COUNT" -gt 10 ]; then
  log_alert "High error rate detected: $ERROR_COUNT errors in the last hour"
fi

# Check log rotation (alert if log files >100MB)
for logfile in "$LOG_DIR"/*.log; do
  if [ -f "$logfile" ]; then
    SIZE=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
    if [ "$SIZE" -gt 104857600 ]; then  # 100MB
      log_alert "Log file $logfile is large ($((SIZE/1024/1024))MB) - consider rotation"
    fi
  fi
done

# Cleanup old health monitor logs (keep last 7 days)
find "$LOG_DIR" -name "health-monitor.log.*" -mtime +7 -delete 2>/dev/null