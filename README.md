# MATT - Mars Automated Testing Tool

MATT is an enterprise-grade automated testing platform that leverages AI to analyze code, identify risks, and generate comprehensive test suites.

## Features

- 🤖 AI-powered code analysis and test generation
- 🔐 Security vulnerability detection
- ⚡ Performance testing and optimization
- 🎯 Automated test case creation across multiple platforms
- 📊 Comprehensive reporting and analytics
- 🚀 Production-ready deployment tools

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Anthropic API key

## Installation

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
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `DATABASE_URL` - PostgreSQL connection string
   - `ANTHROPIC_API_KEY` - Your Anthropic API key
   - `SESSION_SECRET` - A random string for session security

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## Project Structure

```
matt-automated-testing-tool/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── lib/
├── server/          # Express backend
│   ├── routes/
│   └── agents/
├── shared/          # Shared types and schemas
└── attached_assets/ # Static assets
```

## Key Components

- **Code Acquisition**: Supports GitHub, Google Drive, and JIRA integrations
- **Analysis Engine**: AI-powered code analysis for architecture, security, and performance
- **Test Generation**: Automated test case creation with multiple framework support
- **Deployment Tools**: Production-ready deployment configurations and checklists

## API Endpoints

- `/api/projects` - Project management
- `/api/agents` - AI agent management
- `/api/analyses` - Code analysis results
- `/api/test-cases` - Test case management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
