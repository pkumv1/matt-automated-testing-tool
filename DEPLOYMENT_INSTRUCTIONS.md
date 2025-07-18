# MATT Deployment Instructions

## Server Environment Setup

### 1. Set Required Environment Variables

On the server, export these variables before running the setup script:

```bash
export DATABASE_URL="postgresql://postgres:your_password@localhost:5432/postgres"
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_ACTUAL_API_KEY_HERE"
```

### 2. Run Setup Script

```bash
cd /opt/reactproject/matt-automated-testing-tool
chmod +x setup-production-env.sh
./setup-production-env.sh
```

### 3. Build and Deploy

```bash
npm install
npm run build
pm2 start ecosystem.config.js --env production
```

### 4. Verify Deployment

```bash
curl http://localhost:3000/health
pm2 logs matt-production
```

## Environment Variables Reference

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `ANTHROPIC_API_KEY`: Anthropic API key for AI services
- `SESSION_SECRET`: Secure session secret (auto-generated)

### Optional Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: production)
- `MAX_FILE_SIZE`: File upload limit (default: 50MB)
- `LOG_LEVEL`: Logging level (default: info)

## Troubleshooting

If deployment fails:

1. **Check environment variables are set**:
   ```bash
   echo $DATABASE_URL
   echo $ANTHROPIC_API_KEY
   ```

2. **Run diagnostic script**:
   ```bash
   ./troubleshoot-502.sh
   ```

3. **Check PM2 status**:
   ```bash
   pm2 list
   pm2 logs matt-production
   ```

4. **Test database connection**:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

5. **Quick fix script**:
   ```bash
   ./fix-502-error.sh
   ```

## Security Notes

- Environment variables contain sensitive data
- Never commit `.env` files to version control
- Use secure session secrets in production
- Ensure proper file permissions on `.env` (600)

## Missing Environment Variables

Based on your configuration, you need to set:

1. **DATABASE_URL**: `postgresql://postgres:post123@localhost:5432/postgres`
2. **ANTHROPIC_API_KEY**: Your actual API key starting with `sk-ant-api03-`

The deployment is currently failing because these variables are not set on the server.