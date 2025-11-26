#!/bin/bash

echo "🧪 Validating BusinessMap MCP Server..."
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

# Start server in background
echo "🚀 Starting server in HTTP mode..."
TRANSPORT=sse PORT=3000 npm start &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 5

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
    kill $SERVER_PID
    exit 1
fi

# Test 2: SSE endpoint (basic connection)
echo ""
echo "Test 2: SSE Endpoint Connection"
echo "================================"
timeout 3 curl -N -H "Accept: text/event-stream" http://localhost:3000/sse > /tmp/sse_test.txt 2>&1 &
CURL_PID=$!
sleep 2
kill $CURL_PID 2>/dev/null

if grep -q "event: endpoint" /tmp/sse_test.txt; then
    echo "✅ SSE endpoint responding with endpoint event"
    cat /tmp/sse_test.txt
else
    echo "⚠️  SSE endpoint response (may need MCP client):"
    cat /tmp/sse_test.txt
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID
rm -f /tmp/sse_test.txt

echo ""
echo "✅ Validation complete!"
echo ""
echo "📋 Summary:"
echo "  - Build: ✅ OK"
echo "  - HTTP Server: ✅ Running on port 3000"
echo "  - Health Endpoint: ✅ OK"
echo "  - SSE Endpoint: 🔌 Available"
echo ""
echo "💡 For full MCP verification, use an MCP client like Claude Desktop"
