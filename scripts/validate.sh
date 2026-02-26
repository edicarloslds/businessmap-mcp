#!/bin/bash

set -euo pipefail

echo "🧪 Validating BusinessMap MCP Server..."
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
echo "✅ Build successful"
echo ""

# Start server in background
echo "🚀 Starting server in HTTP mode..."
TRANSPORT=http PORT=3000 npm start &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

sleep 6

# Test 1: Health endpoint
echo ""
echo "Test 1: Health Endpoint"
echo "========================"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Health endpoint working"
    echo "Response: $HEALTH_RESPONSE"
else
    echo "❌ Health endpoint failed"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi

# Test 2: MCP endpoint using official client transport
echo ""
echo "Test 2: MCP Endpoint (/mcp)"
echo "==========================="
if npx tsx scripts/verify-tools.ts; then
    echo "✅ MCP endpoint verified via client"
else
    echo "❌ MCP endpoint verification failed"
    exit 1
fi

echo ""
echo "✅ Validation complete!"
echo ""
echo "📋 Summary:"
echo "  - Build: ✅ OK"
echo "  - HTTP Server: ✅ Running on port 3000"
echo "  - Health Endpoint: ✅ OK"
echo "  - MCP Endpoint (/mcp): ✅ OK"
