#!/bin/bash

# MATT Production Setup Script
# This script sets up the production environment for MATT

echo "🚀 Setting up MATT for production..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p backups

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your actual values."
else
    echo "✅ .env file already exists."
fi

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 uploads logs backups
chmod 600 .env

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check database connection
echo "🔌 Testing database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set. Please configure your .env file."
    exit 1
fi

# Push database schema
echo "🗄️ Setting up database schema..."
npm run db:push

# Build application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "🎉 Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your actual credentials"
echo "2. Start the application with: npm start"
echo "3. Access your application at: http://localhost:5000"
echo ""
echo "For deployment, see DEPLOYMENT_GUIDE.md"