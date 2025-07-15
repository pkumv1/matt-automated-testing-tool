# MATT Deployment Guide

## Quick Start Commands

### Prerequisites Check
```bash
# Check Node.js version
node --version  # Should be 18.x or 20.x

# Check npm version  
npm --version   # Should be 9.x+

# Check PostgreSQL
psql --version  # Should be 13+
```

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/pkumv1/matt-automated-testing-tool.git
cd matt-automated-testing-tool

# Install dependencies
npm install

# Check installation
npm run check
```

### 2. Database Setup
```bash
# Option A: Use Neon Database (Recommended)
# Sign up at https://neon.tech
# Create database and get connection string

# Option B: Local PostgreSQL
createdb matt_database
export DATABASE_URL="postgresql://localhost:5432/matt_database"

# Push database schema
npm run db:push
```

### 3. Configure Environment
```bash
# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@host:5432/database
ANTHROPIC_API_KEY=sk-ant-xxxxx
NODE_ENV=production
PORT=5000
EOF

# Load environment
source .env
```

### 4. Build and Deploy
```bash
# Build application
npm run build

# Start production server
npm start

# Or for development
npm run dev
```

## Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using Docker
```bash
# Build Docker image
docker build -t matt-app .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  --name matt-app \
  matt-app
```

### Using Systemd
```bash
# Create service file
sudo nano /etc/systemd/system/matt.service

# Add service configuration
[Unit]
Description=MATT Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/matt
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable matt
sudo systemctl start matt
```

## Cloud Deployment Options

### 1. Replit Autoscale
```bash
# Already configured with .replit file
# Just click "Deploy" in Replit interface
# Configure custom domain in deployment settings
```

### 2. AWS EC2
```bash
# Launch t3.medium instance
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Deploy application
git clone https://github.com/pkumv1/matt-automated-testing-tool.git
cd matt-automated-testing-tool
npm install
npm run build
npm start
```

### 3. DigitalOcean Droplet
```bash
# Create $20/month droplet (4GB RAM)
# SSH into droplet
ssh root@your-droplet-ip

# Install dependencies
apt update
apt install -y nodejs npm postgresql-client git

# Deploy application
git clone https://github.com/pkumv1/matt-automated-testing-tool.git
cd matt-automated-testing-tool
npm install
npm run build
npm start
```

## SSL/HTTPS Setup

### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d demo.mars-techs.ai

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Cloudflare
```bash
# Configure DNS A record
# demo.mars-techs.ai -> Your server IP

# Enable Cloudflare proxy
# SSL/TLS mode: Full (strict)
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_analyses_project_id ON analyses(project_id);
CREATE INDEX idx_test_cases_project_id ON test_cases(project_id);
```

### Node.js Optimization
```bash
# Increase heap size for large projects
node --max-old-space-size=4096 dist/index.js

# Use cluster mode
pm2 start dist/index.js -i max --name matt-cluster
```

## Monitoring Setup

### Basic Health Check
```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:5000/health || systemctl restart matt
```

### Advanced Monitoring
```bash
# Install monitoring tools
npm install -g clinic
npm install -g autocannon

# Performance testing
autocannon -c 10 -d 60 http://localhost:5000
```

## Backup Strategy

### Database Backup
```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL > /backups/matt_$(date +%Y%m%d).sql
find /backups -name "matt_*.sql" -mtime +30 -delete
```

### Application Backup
```bash
# Backup configuration
tar -czf matt_config_$(date +%Y%m%d).tar.gz .env package.json
```

## Security Checklist

### Server Security
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

### Application Security
```bash
# Use environment variables only
# Never commit API keys
# Enable rate limiting
# Use HTTPS only
# Regular security updates
```

## Troubleshooting Common Issues

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL
# Check connection limits
SELECT * FROM pg_stat_activity;
```

### Memory Issues
```bash
# Monitor memory usage
htop
free -h
# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### API Rate Limits
```bash
# Check API key limits
curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  https://api.anthropic.com/v1/messages
```

## Support and Maintenance

### Log Files
```bash
# Application logs
tail -f /var/log/matt.log

# System logs
journalctl -u matt -f

# Database logs
tail -f /var/log/postgresql/postgresql-*.log
```

### Updates
```bash
# Update dependencies
npm update
npm audit fix

# Update system
sudo apt update && sudo apt upgrade -y
```

For additional support, visit the [GitHub repository](https://github.com/pkumv1/matt-automated-testing-tool) or check the issues section.