// ecosystem.config.cjs - PRODUCTION READY CONFIGURATION
// This configuration is optimized for demo.mars-techs.ai deployment

module.exports = {
  apps: [{
    name: 'matt-production',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    
    // Production environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,  // CRITICAL: Must be 3000 for nginx proxy
      HOST: '0.0.0.0'
    },
    
    // Logging configuration
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Performance & stability
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Environment file
    env_file: './.env',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Instance management
    instance_var: 'INSTANCE_ID',
    
    // Advanced features
    time: true,
    combine_logs: true
  }]
};
