# MATT Deployment Troubleshooting Guide

## Common Issues and Solutions

### 502 Gateway Error on demo.mars-techs.ai

#### Problem
When accessing https://demo.mars-techs.ai/, you receive a 502 Bad Gateway error.

#### Root Cause
The 502 error typically occurs when:
1. The Node.js application is not running
2. The application is running on the wrong port
3. Database connection issues
4. Missing environment variables

#### Solution

##### 1. Check Port Configuration
The application **MUST** run on port 3000 for the nginx proxy to work correctly.

**Fix the ecosystem.config.js:**
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000  // Changed from 5000 to 3000
},
```

##### 2. Verify Environment Variables
SSH into the server and check:
```bash
cd /opt/reactproject/matt-automated-testing-tool
cat .env
```

Ensure these are set:
- `PORT=3000`
- `DATABASE_URL=postgresql://...`
- `ANTHROPIC_API_KEY=sk-ant-...`
- `SESSION_SECRET=...`

##### 3. Check PM2 Status
```bash
pm2 status
pm2 logs matt-production --lines 100
```

##### 4. Restart the Application
```bash
cd /opt/reactproject/matt-automated-testing-tool
git pull origin main
npm install
npm run build
pm2 restart ecosystem.config.js --env production
```

##### 5. Verify Nginx Configuration
```bash
sudo nginx -t
sudo systemctl status nginx
```

The nginx should proxy from port 443/80 to localhost:3000.

### Database Connection Issues

#### Problem
Application fails to start with database connection errors.

#### Solution
1. Check PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Test database connection:
   ```bash
   psql "$DATABASE_URL"
   ```

3. Ensure database exists:
   ```bash
   sudo -u postgres psql -c "\l"
   ```

4. Check for special characters in password (must be URL-encoded):
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

### Build Failures

#### Problem
`npm run build` fails with memory errors.

#### Solution
The build script already includes memory optimization:
```json
"build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 vite build && cross-env NODE_OPTIONS=--max-old-space-size=4096 esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist"
```

If still failing:
```bash
# Increase swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Missing Dependencies

#### Problem
Application fails with "Module not found" errors.

#### Solution
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### SSL Certificate Issues

#### Problem
HTTPS not working or certificate errors.

#### Solution
1. Check certificate paths in nginx:
   ```nginx
   ssl_certificate /path/to/ssl/certificate.crt;
   ssl_certificate_key /path/to/ssl/private.key;
   ```

2. Verify certificates:
   ```bash
   sudo nginx -t
   ```

3. Renew if using Let's Encrypt:
   ```bash
   sudo certbot renew
   ```

## Quick Deployment Checklist

1. **Pull latest code:**
   ```bash
   cd /opt/reactproject/matt-automated-testing-tool
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   npm install
   ```

3. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   # Ensure PORT=3000
   ```

4. **Build application:**
   ```bash
   npm run build
   ```

5. **Start/Restart with PM2:**
   ```bash
   pm2 restart ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

6. **Check logs:**
   ```bash
   pm2 logs matt-production
   tail -f logs/error-*.log
   ```

7. **Verify deployment:**
   - Check PM2: `pm2 status`
   - Check app: `curl http://localhost:3000/health`
   - Check nginx: `sudo nginx -t`
   - Check site: `curl https://demo.mars-techs.ai/health`

## Emergency Rollback

If deployment fails:
```bash
cd /opt/reactproject/matt-automated-testing-tool
git log --oneline -5  # Find last working commit
git checkout <commit-hash>
npm install
npm run build
pm2 restart ecosystem.config.js --env production
```

## Monitoring

### Check Application Health
```bash
curl http://localhost:3000/health
```

### View Real-time Logs
```bash
pm2 logs matt-production --lines 100
tail -f logs/app-*.log
tail -f logs/error-*.log
```

### System Resources
```bash
htop
df -h
free -m
```

## Contact

If issues persist after following this guide:
1. Check GitHub issues: https://github.com/pkumv1/matt-automated-testing-tool/issues
2. Review deployment logs in `/opt/reactproject/matt-automated-testing-tool/logs/`
3. Check PM2 logs: `pm2 logs matt-production --err`