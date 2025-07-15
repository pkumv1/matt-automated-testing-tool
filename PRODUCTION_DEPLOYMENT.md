# Production Deployment Configuration for demo.mars-techs.ai

This configuration is specifically for deploying MATT to https://demo.mars-techs.ai/

## Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/matt_production

# Session
SESSION_SECRET=your-production-session-secret-here

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Application URL
APP_URL=https://demo.mars-techs.ai
```

## Nginx Configuration

Add this to your Nginx configuration:

```nginx
server {
    listen 80;
    server_name demo.mars-techs.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name demo.mars-techs.ai;

    # SSL configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /api/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## PM2 Configuration

The `ecosystem.config.cjs` file is already configured for PM2. To deploy:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start with PM2:
   ```bash
   pm2 start ecosystem.config.cjs --env production
   ```

4. Save PM2 configuration:
   ```bash
   pm2 save
   pm2 startup
   ```

## Database Setup

1. Create the production database:
   ```bash
   createdb matt_production
   ```

2. Run migrations:
   ```bash
   NODE_ENV=production npm run db:push
   ```

## Deployment Script

Create a deployment script `deploy.sh`:

```bash
#!/bin/bash

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build the application
npm run build

# Run database migrations
NODE_ENV=production npm run db:push

# Restart PM2
pm2 restart matt-production

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## Monitoring

- Check application logs: `pm2 logs matt-production`
- Monitor processes: `pm2 monit`
- Check status: `pm2 status`

## SSL Certificate

For SSL certificates, you can use Let's Encrypt:

```bash
sudo certbot --nginx -d demo.mars-techs.ai
```

## Firewall Configuration

Ensure ports 80 and 443 are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # Keep SSH open
sudo ufw enable
```

## Health Check

The application provides a health check endpoint at `/api/health`. You can use this for monitoring.
