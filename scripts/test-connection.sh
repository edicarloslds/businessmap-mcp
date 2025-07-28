#!/bin/bash

# BusinessMap API Connection Test Script
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check required environment variables
if [ -z "$BUSINESSMAP_API_URL" ]; then
  echo "❌ BUSINESSMAP_API_URL not set"
  exit 1
fi

if [ -z "$BUSINESSMAP_API_TOKEN" ]; then
  echo "❌ BUSINESSMAP_API_TOKEN not set"
  exit 1
fi

echo "🔍 Testing BusinessMap API connection..."
echo "📡 API URL: $BUSINESSMAP_API_URL"

# Test API connectivity
response=$(curl -s -w "%{http_code}" -o /tmp/api_test_response \
  -H "apikey: $BUSINESSMAP_API_TOKEN" \
  -H "Content-Type: application/json" \
  "$BUSINESSMAP_API_URL/workspaces" 2>/dev/null || echo "000")

if [ "$response" = "200" ]; then
  echo "✅ API connection successful"
  echo "📊 Available workspaces:"
  cat /tmp/api_test_response | head -c 500
  echo ""
elif [ "$response" = "401" ]; then
  echo "❌ Authentication failed - check your API token"
  exit 1
elif [ "$response" = "404" ]; then
  echo "❌ API endpoint not found - check your API URL"
  exit 1
elif [ "$response" = "000" ]; then
  echo "❌ Connection failed - check network connectivity and API URL"
  exit 1
else
  echo "❌ API request failed with HTTP status: $response"
  cat /tmp/api_test_response
  exit 1
fi

# Clean up
rm -f /tmp/api_test_response

echo "🎉 Connection test passed!" 