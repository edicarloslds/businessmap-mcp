#!/bin/bash

set -euo pipefail

# Load variables from .env when available
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

# Test BusinessMap MCP Server Connection
echo "🧪 Testing BusinessMap MCP Server Connection..."
echo ""

# Check if required environment variables are set
if [ -z "${BUSINESSMAP_API_URL:-}" ]; then
    echo "❌ BUSINESSMAP_API_URL environment variable is not set"
    exit 1
fi

if [ -z "${BUSINESSMAP_API_TOKEN:-}" ]; then
    echo "❌ BUSINESSMAP_API_TOKEN environment variable is not set"
    exit 1
fi

echo "📡 API URL: ${BUSINESSMAP_API_URL}"
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

# Run resource validation using stdio against dist/index.js
echo "🔍 Running MCP stdio resource validation..."
npx tsx scripts/validate-resources.ts

echo ""
echo "✅ Connection test completed!"
echo "💡 If you see successful reads above, MCP stdio + BusinessMap API are working correctly"
