// PM2 Configuration for MATT Application
// Production-ready process management

module.exports = {
  apps: [{
    name: 'matt-app',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: 5000
    },
    
    // Auto-restart configuration
    watch: false,
    max_memory_restart: '500M',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Logging
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Advanced features
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: true,
    
    // Auto-restart on file changes (disabled for production)
    ignore_watch: ['node_modules', 'logs'],
    
    // Graceful reload/restart
    wait_ready: true,
    autorestart: true,
    
    // Increase restart delay
    restart_delay: 4000,
    
    // Cron restart (optional - restart every day at 3 AM)
    // cron_restart: '0 3 * * *',
    
    // Instance configuration
    instance_var: 'INSTANCE_ID'
  }]
};
