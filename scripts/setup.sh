#!/bin/bash

# BusinessMap MCP Setup Script
set -e

echo "🚀 Setting up BusinessMap MCP Server..."

# Check Node.js version
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 22 ]; then
  echo "❌ Node.js 22+ required. Current version: $(node -v)"
  exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📋 Creating .env file from template..."
  cp .env.example .env
  echo "⚠️  Please edit .env file with your BusinessMap API credentials"
else
  echo "✅ .env file already exists"
fi

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your BusinessMap API credentials"
echo "2. Run 'npm start' to start the server"
echo "3. Or run 'npm run dev' for development mode"
echo ""
echo "For Docker deployment:"
echo "1. Run 'docker-compose up -d'"
echo ""
echo "📚 See README.md for detailed usage instructions" 