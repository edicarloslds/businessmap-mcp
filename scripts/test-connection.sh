#!/bin/bash

# Test BusinessMap MCP Server Connection
echo "🧪 Testing BusinessMap MCP Server Connection..."
echo ""

# Check if required environment variables are set
if [ -z "$BUSINESSMAP_API_URL" ]; then
    echo "❌ BUSINESSMAP_API_URL environment variable is not set"
    exit 1
fi

if [ -z "$BUSINESSMAP_API_TOKEN" ]; then
    echo "❌ BUSINESSMAP_API_TOKEN environment variable is not set"
    exit 1
fi

echo "📡 API URL: $BUSINESSMAP_API_URL"
echo "🔒 Read-only mode: ${BUSINESSMAP_READ_ONLY_MODE:-false}"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Test the server initialization
echo "🚀 Testing server initialization..."
echo ""

# Run the server for a few seconds to see the initialization process
timeout 10s node dist/index.js 2>&1 | head -20

echo ""
echo "✅ Connection test completed!"
echo "💡 If you see 'Successfully connected to BusinessMap API', the initialization is working correctly" 