# MATT - Modern Automated Testing Tool

A modern, AI-powered testing automation platform that generates comprehensive test suites for your applications.

## Quick Start

### Prerequisites

- Node.js 18.x or 20.x
- PostgreSQL 13+
- npm 9.x+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pkumv1/matt-automated-testing-tool.git
   cd matt-automated-testing-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   **Option A: Use the automated setup wizard (Recommended)**
   ```bash
   npm run setup
   ```
   
   **Option B: Manual setup**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

   **Important**: If your PostgreSQL password contains special characters (like @), they must be URL-encoded:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   
   Example: If your password is `post@123`, use `post%40123` in the DATABASE_URL.

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

   The application will be available at `http://localhost:5000`

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for AI services | `sk-ant-xxxxx` |
| `SESSION_SECRET` | ✅ | Secret for session encryption | Random 64-char string |
| `CONFIG_PATH` | ❌ | Path to additional config file | `./config/settings.json` |
| `NODE_ENV` | ❌ | Environment mode | `development` or `production` |
| `PORT` | ❌ | Server port (default: 5000) | `5000` |

## Features

- **AI-Powered Test Generation**: Automatically generates comprehensive test suites
- **Multi-Platform Support**: Integrates with Jest, Playwright, Selenium, and more
- **Source Integration**: Connect with GitHub, Google Drive, and JIRA
- **Real-time Analysis**: Live test execution and results monitoring
- **Risk Assessment**: Identifies potential vulnerabilities and performance issues

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/analyze` - Start project analysis
- `POST /api/projects/:id/generate-tests` - Generate test suite
- `POST /api/projects/:id/execute-tests` - Execute tests

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running**
   ```bash
   pg_isready
   ```

2. **Verify connection string**
   - Ensure password is URL-encoded if it contains special characters
   - Check host, port, and database name

3. **Test connection manually**
   ```bash
   psql $DATABASE_URL
   ```

### Environment Variable Issues

1. **Missing .env file**
   - Run `npm run setup` to create one
   - Or copy `.env.example` to `.env`

2. **Invalid API keys**
   - Anthropic API keys should start with `sk-ant-`
   - Verify your API key is active

### Build Issues

1. **Clear build artifacts**
   ```bash
   rm -rf dist/
   rm -rf node_modules/
   npm install
   npm run build
   ```

2. **Check Node.js version**
   ```bash
   node --version  # Should be 18.x or 20.x
   ```

## Development

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Database Migrations
```bash
npm run db:push     # Push schema changes
npm run db:migrate  # Run migrations
```

## Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Support

- GitHub Issues: [Report a bug](https://github.com/pkumv1/matt-automated-testing-tool/issues)
- Documentation: [Wiki](https://github.com/pkumv1/matt-automated-testing-tool/wiki)

## License

MIT License - see [LICENSE](./LICENSE) for details.
