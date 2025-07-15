# Deployment Guide for MATT Automated Testing Tool

This guide explains how to deploy the MATT application to https://demo.mars-techs.ai/

## Prerequisites

1. **Server Requirements**:
   - Node.js 20.x or higher
   - PostgreSQL 14 or higher
   - PM2 (for process management)
   - Nginx (for reverse proxy)

2. **GitHub Secrets** (Required for automated deployment):
   - `DEPLOY_HOST`: Your server hostname (default: demo.mars-techs.ai)
   - `DEPLOY_USER`: SSH user for deployment (default: deploy)
   - `DEPLOY_KEY`: SSH private key for authentication
   - `DEPLOY_PATH`: Path on server where app will be deployed (default: /var/www/matt)

## Setting Up GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Add the following secrets:

```bash
DEPLOY_HOST=demo.mars-techs.ai
DEPLOY_USER=your-ssh-user
DEPLOY_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
your-private-key-content
-----END OPENSSH PRIVATE KEY-----
DEPLOY_PATH=/var/www/matt
```

## Server Setup

1. **Create deployment user** (if not exists):
```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
```

2. **Install Node.js 20.x**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2**:
```bash
sudo npm install -g pm2
```

4. **Setup PostgreSQL**:
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE matt_db;
CREATE USER matt_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE matt_db TO matt_user;
\q
```

5. **Create application directory**:
```bash
sudo mkdir -p /var/www/matt
sudo chown deploy:deploy /var/www/matt
```

6. **Setup Nginx**:
```bash
sudo apt install nginx
```

Create Nginx configuration at `/etc/nginx/sites-available/matt`:
```nginx
server {
    listen 80;
    server_name demo.mars-techs.ai;

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
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/matt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL with Let's Encrypt** (optional but recommended):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d demo.mars-techs.ai
```

## Environment Variables

Create `.env` file on the server at `/var/www/matt/.env`:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://matt_user:your-password@localhost:5432/matt_db
SESSION_SECRET=your-session-secret
ANTHROPIC_API_KEY=your-anthropic-api-key
```

## Manual Deployment

If you prefer to deploy manually:

1. **Build locally**:
```bash
npm install
npm run build
```

2. **Transfer files to server**:
```bash
scp -r dist/ package.json package-lock.json user@demo.mars-techs.ai:/var/www/matt/
```

3. **On the server**:
```bash
cd /var/www/matt
npm install --production
pm2 start dist/index.js --name matt-app
pm2 save
pm2 startup
```

## Automated Deployment

The repository includes a GitHub Actions workflow that automatically deploys when you push to the main branch:

1. Push your changes to main branch
2. GitHub Actions will:
   - Run tests
   - Build the application
   - Deploy to your server

## Monitoring

1. **Check application status**:
```bash
pm2 status
pm2 logs matt-app
```

2. **Monitor resources**:
```bash
pm2 monit
```

3. **Restart application**:
```bash
pm2 restart matt-app
```

## Troubleshooting

1. **Check logs**:
```bash
# Application logs
pm2 logs matt-app

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

2. **Common issues**:
   - Port already in use: Check if another process is using port 3000
   - Database connection failed: Verify PostgreSQL credentials and connection
   - PM2 not starting: Check Node.js version and permissions

3. **Fix dependencies**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Security Considerations

1. Use environment variables for sensitive data
2. Keep dependencies updated
3. Use HTTPS in production
4. Restrict database access to localhost
5. Setup firewall rules appropriately

## Support

For issues specific to deployment, check:
- GitHub Actions logs
- Server logs
- PM2 logs

For application issues, please open an issue on GitHub.
