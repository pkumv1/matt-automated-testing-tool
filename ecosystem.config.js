module.exports = {
  apps: [{
    name: 'matt-production',
    script: 'dist/index.js',
    cwd: '/opt/reactproject/matt-automated-testing-tool',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    max_memory_restart: '1G',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    min_uptime: '10s',
    // Advanced PM2 features
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Log rotation
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Error handling
    error_file_max_size: '50M',
    out_file_max_size: '50M',
    // Monitoring
    instance_var: 'INSTANCE_ID',
    // Graceful shutdown
    shutdown_with_message: true,
    // Environment specific
    env_production: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug',
      DEBUG: '*'
    }
  }, {
    name: 'matt-dev',
    script: 'npm',
    args: 'run dev',
    cwd: '/opt/reactproject/matt-automated-testing-tool',
    interpreter: 'none',
    env: {
      NODE_ENV: 'development',
      DEBUG: '*',
      LOG_LEVEL: 'debug'
    },
    error_file: './logs/pm2-dev-error.log',
    out_file: './logs/pm2-dev-out.log',
    log_file: './logs/pm2-dev-combined.log',
    time: true,
    merge_logs: true,
    watch: ['server', 'shared', '.env'],
    ignore_watch: ['node_modules', 'logs', 'dist', '.git'],
    watch_delay: 1000,
    restart_delay: 3000,
    autorestart: true,
    max_restarts: 5
  }],

  // Deploy configuration
  deploy: {
    production: {
      user: 'root',
      host: 'demo.mars-techs.ai',
      ref: 'origin/main',
      repo: 'https://github.com/pkumv1/matt-automated-testing-tool.git',
      path: '/opt/reactproject',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
