# MATT (Mars Automated Testing Tool)

## Overview

MATT is an advanced AI-powered automated testing platform that leverages multi-agent architecture for intelligent software quality assurance and comprehensive system analysis.

## 🌟 Key Features

- **Multi-Platform Project Acquisition**: Support for GitHub repositories, Google Drive files/folders, and JIRA projects
- **AI-Powered Analysis**: Claude 4.0 Sonnet integration for intelligent code analysis and risk assessment
- **Comprehensive Testing**: 11+ testing platforms including Playwright, Cypress, k6, OWASP ZAP, Lighthouse, and more
- **Real-Time Monitoring**: Live test execution with progress tracking and detailed logging
- **Production-Grade Deployment**: Automated deployment readiness assessment and configuration
- **Modern Architecture**: React TypeScript frontend with Express backend and PostgreSQL database

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key (Claude)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pkumv1/matt-automated-testing-tool.git
cd matt-automated-testing-tool
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

4. Run the application:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Carbon Design System colors
- **State Management**: TanStack React Query for server state management

### Backend
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Anthropic Claude API for intelligent analysis

### Key Components
- **Multi-Agent System**: Supervisor, Analyzer, Risk Assessment, Test Generation, and Environment agents
- **Testing Framework**: Support for Jest, Playwright, k6, OWASP ZAP, Lighthouse, and Postman
- **Integration Services**: Google Drive and JIRA APIs for project acquisition

## 📊 Testing Capabilities

MATT supports comprehensive testing across multiple dimensions:

- **Security Testing**: OWASP ZAP, Burp Suite, Nessus vulnerability scans
- **Performance Testing**: k6, JMeter load testing and benchmarking
- **Functional Testing**: Playwright, Cypress, Selenium automated testing
- **Accessibility Testing**: Axe-Core, Pa11y WCAG 2.1 AA compliance
- **API Testing**: Postman, REST Assured API validation
- **Visual Testing**: Percy, BackstopJS visual regression testing

## 🚀 Deployment

The application is production-ready and can be deployed to:

- **Replit Autoscale**: Direct deployment with custom domain support
- **Docker**: Containerized deployment (Dockerfile included)
- **Traditional VPS**: Node.js server deployment
- **Cloud Platforms**: AWS, GCP, Azure compatible

### Live Demo
Visit the live demo at: [https://demo.mars-techs.ai](https://demo.mars-techs.ai)

## 📝 Documentation

- `replit.md` - Complete architecture and development guide
- `DEPLOYMENT_README.md` - Detailed deployment instructions
- `FILE_STRUCTURE.md` - Project structure overview

## 🤝 Contributing

This project was built for enterprise-grade automated testing. Contributions are welcome!

## 📄 License

MIT License - see LICENSE file for details

---

Built with modern web technologies for intelligent software quality assurance.
