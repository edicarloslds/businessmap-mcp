#!/bin/bash

set -euo pipefail

# Load variables from .env when available
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Test NPX functionality locally
echo "🧪 Testing BusinessMap MCP Server via NPX..."
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

PORT="${PORT:-3000}"
MCP_SERVER_URL="${MCP_SERVER_URL:-http://localhost:${PORT}/mcp}"

echo "📦 Building package..."
npm run build

echo "🔗 Creating global link..."
npm link

echo "🚀 Starting server via npx in HTTP mode..."
echo "Target MCP URL: ${MCP_SERVER_URL}"

cleanup() {
  echo "🧹 Cleaning up..."
  kill "${NPXPID:-}" 2>/dev/null || true
  npm unlink -g @edicarlos.lds/businessmap-mcp >/dev/null 2>&1 || true
}
trap cleanup EXIT

(
  TRANSPORT=http PORT="$PORT" npx @edicarlos.lds/businessmap-mcp
) &
NPXPID=$!

echo "⏳ Waiting for server startup..."
sleep 6

echo "🔍 Verifying MCP tools through HTTP client..."
MCP_SERVER_URL="$MCP_SERVER_URL" npx tsx scripts/verify-tools.ts

echo "✅ NPX test completed!"
echo ""
echo "📋 Summary:"
echo "  - Server started via npx: ✅"
echo "  - MCP endpoint verified: ✅"

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
