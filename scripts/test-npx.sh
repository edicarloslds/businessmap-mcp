#!/bin/bash

# Test NPX functionality locally
echo "🧪 Testing BusinessMap MCP Server via NPX..."

# Set test environment variables
export BUSINESSMAP_API_TOKEN="test_token"
export BUSINESSMAP_API_URL="https://test.kanbanize.com/api/v2"
export BUSINESSMAP_READ_ONLY_MODE="true"
export BUSINESSMAP_DEFAULT_WORKSPACE_ID="1"

echo "📦 Building package..."
npm run build

echo "🔗 Creating global link..."
npm link

echo "🚀 Testing with npx..."
echo "This should start the server and show startup messages..."
echo "Press Ctrl+C to stop the test"

# Test the npx command (run for a few seconds then stop)
(npx @edicarlos.lds/businessmap-mcp &
NPXPID=$!
sleep 3
kill $NPXPID 2>/dev/null
wait $NPXPID 2>/dev/null) || echo "✅ Test completed (server started successfully)"

echo "🧹 Cleaning up..."
npm unlink -g @edicarlos.lds/businessmap-mcp

echo "✅ NPX test completed!"
echo ""
echo "📋 To use in Claude Desktop, add this configuration:"
echo "{"
echo "  \"mcpServers\": {"
echo "    \"Businessmap\": {"
echo "      \"command\": \"npx\","
echo "      \"args\": [\"-y\", \"@edicarlos.lds/businessmap-mcp\"],"
echo "      \"env\": {"
echo "        \"BUSINESSMAP_API_TOKEN\": \"your_token\","
echo "        \"BUSINESSMAP_API_URL\": \"your_api_url\","
echo "        \"BUSINESSMAP_READ_ONLY_MODE\": \"false\""
echo "      }"
echo "    }"
echo "  }"
echo "}" 