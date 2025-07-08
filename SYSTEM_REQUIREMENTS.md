# MATT (Mars Automated Testing Tool) - System Requirements

## Overview
This document outlines the complete software and hardware requirements for deploying and running MATT as a production application.

## 🖥️ Hardware Requirements

### Minimum Requirements (Development/Testing)
- **CPU**: 2 cores, 2.4 GHz
- **RAM**: 4 GB
- **Storage**: 10 GB available space
- **Network**: Stable internet connection (minimum 10 Mbps)

### Recommended Requirements (Production)
- **CPU**: 4+ cores, 3.0+ GHz (Intel i5/AMD Ryzen 5 or equivalent)
- **RAM**: 8 GB+ (16 GB recommended for heavy analysis workloads)
- **Storage**: 50 GB+ SSD (fast I/O for database operations)
- **Network**: High-speed internet (50+ Mbps for concurrent users)

### Enterprise/Scale Requirements
- **CPU**: 8+ cores, 3.5+ GHz (Intel i7/Xeon or AMD Ryzen 7/EPYC)
- **RAM**: 16-32 GB (for multiple concurrent project analyses)
- **Storage**: 100+ GB NVMe SSD (database and file storage)
- **Network**: Dedicated bandwidth (100+ Mbps)
- **Load Balancer**: For multi-instance deployments

## 💻 Software Requirements

### Core Runtime Environment
- **Node.js**: Version 18.x or 20.x (LTS recommended)
- **npm**: Version 9.x+ (comes with Node.js)
- **Operating System**: 
  - Linux (Ubuntu 20.04+, CentOS 8+, RHEL 8+)
  - macOS 12+ (Monterey or newer)
  - Windows 10/11 (with WSL2 recommended)

### Database Requirements
- **PostgreSQL**: Version 13+ (14+ recommended)
- **Connection Pooling**: Built-in with @neondatabase/serverless
- **Database Size**: 
  - Minimum: 1 GB
  - Recommended: 10+ GB for production
  - Enterprise: 50+ GB with automated backups

### Required System Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y build-essential python3 python3-pip git curl

# CentOS/RHEL
sudo yum install -y gcc-c++ make python3 python3-pip git curl

# macOS (with Homebrew)
brew install node@20 postgresql git
```

## 🌐 Network & Security Requirements

### Network Ports
- **Application**: Port 5000 (configurable via environment)
- **Database**: Port 5432 (PostgreSQL)
- **HTTPS**: Port 443 (for production deployment)
- **SSH**: Port 22 (for server management)

### External API Dependencies
- **Anthropic Claude API**: claude-sonnet-4-20250514 model access
- **Google Drive API**: For project acquisition (optional)
- **JIRA API**: For project integration (optional)
- **GitHub API**: For repository analysis (optional)

### Security Requirements
- **SSL/TLS**: Certificate for HTTPS (Let's Encrypt or commercial)
- **API Keys**: Secure storage for third-party services
- **Session Management**: Built-in with express-session
- **Rate Limiting**: Recommended for production
- **Firewall**: Basic firewall configuration

## 🔧 Installation Dependencies

### Node.js Package Dependencies
```json
{
  "runtime": "431 MB node_modules",
  "production_build": "1.1 MB dist/",
  "total_app_size": "~450 MB"
}
```

### Key Dependencies:
- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **AI Integration**: @anthropic-ai/sdk, @langchain/langgraph
- **Database**: @neondatabase/serverless, drizzle-orm
- **UI Components**: Radix UI, Shadcn/ui, Lucide React

## 📊 Performance Requirements

### System Load Expectations
- **CPU Usage**: 20-40% during analysis (spikes to 60-80%)
- **Memory Usage**: 2-4 GB base, +1-2 GB per concurrent analysis
- **Disk I/O**: Moderate (database operations, file uploads)
- **Network**: Variable based on API calls and file downloads

### Concurrent User Capacity
- **Single Instance**: 10-20 concurrent users
- **Optimized Server**: 50-100 concurrent users
- **Load Balanced**: 200+ concurrent users

## 🚀 Deployment Options

### 1. Self-Hosted (Recommended)
```bash
# Clone repository
git clone https://github.com/pkumv1/matt-automated-testing-tool.git
cd matt-automated-testing-tool

# Install dependencies
npm install

# Set environment variables
export DATABASE_URL="postgresql://user:password@host:5432/database"
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

# Build and start
npm run build
npm start
```

### 2. Docker Deployment
```dockerfile
# Dockerfile (create if needed)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### 3. Cloud Platforms
- **Replit Autoscale**: Native deployment with custom domain
- **AWS EC2**: t3.medium or larger instances
- **Google Cloud Run**: 2 CPU, 4 GB memory
- **Azure Container Apps**: Similar resource allocation
- **DigitalOcean Droplets**: $20/month tier or higher

## 🔐 Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# AI Services
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional Integrations
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
JIRA_API_TOKEN=xxxxx
GITHUB_TOKEN=xxxxx

# Application
NODE_ENV=production
PORT=5000
```

### Optional Configuration
```env
# Session Management
SESSION_SECRET=your-secret-key

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/matt.log
```

## 📈 Monitoring & Maintenance

### Health Checks
- **Application**: `GET /health`
- **API**: `GET /api/health`
- **Database**: Built-in connection monitoring

### Recommended Monitoring Tools
- **System**: htop, iostat, netstat
- **Application**: PM2, forever, or systemd
- **Database**: pg_stat_activity, pg_stat_database
- **External**: New Relic, Datadog, or Prometheus

### Backup Requirements
- **Database**: Daily automated backups
- **Application**: Version control with GitHub
- **Configuration**: Secure environment variable backup

## 🔄 Scaling Considerations

### Horizontal Scaling
- **Load Balancer**: nginx, HAProxy, or cloud load balancer
- **Multiple Instances**: PM2 cluster mode or Docker containers
- **Database**: PostgreSQL read replicas for heavy read workloads

### Vertical Scaling
- **CPU**: Increase cores for concurrent analysis
- **Memory**: Add RAM for larger projects and file processing
- **Storage**: NVMe SSD for database performance

## 🔧 Maintenance Requirements

### Regular Tasks
- **Dependencies**: Monthly npm audit and updates
- **Database**: Weekly VACUUM and ANALYZE
- **Logs**: Regular log rotation and cleanup
- **Security**: Monthly security patch updates

### Performance Optimization
- **Database Indexes**: Optimize based on query patterns
- **Caching**: Redis for session storage (optional)
- **CDN**: Static asset delivery (optional)
- **Compression**: Gzip/Brotli for HTTP responses

## 🆘 Troubleshooting

### Common Issues
1. **Memory Issues**: Increase Node.js heap size with --max-old-space-size
2. **Database Connections**: Check PostgreSQL max_connections setting
3. **API Rate Limits**: Implement retry logic for external APIs
4. **File Upload Limits**: Configure multer for large repository uploads

### Support Resources
- **Documentation**: GitHub repository README
- **Issues**: GitHub issue tracker
- **Community**: Project discussions and forums

---

**Note**: These requirements are based on the current MATT architecture. Adjust based on your specific deployment environment and usage patterns.