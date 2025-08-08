#!/bin/bash

set -e

# Check if script is already running to prevent duplicate executions
LOCK_FILE="/tmp/businessmap-mcp-publish-npm.lock"
if [ -f "$LOCK_FILE" ]; then
    echo "❌ NPM publication script is already running. Lock file exists: $LOCK_FILE"
    echo "If you're sure no other instance is running, remove the lock file manually:"
    echo "rm $LOCK_FILE"
    exit 1
fi

# Create lock file
echo $$ > "$LOCK_FILE"

# Cleanup function to remove lock file on exit
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT INT TERM

echo "📦 Starting NPM publication process..."

# Check NPM authentication
echo "🔐 Checking NPM authentication..."
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ You need to login to npm first: npm login"
    exit 1
fi
echo "✅ NPM authenticated as: $(npm whoami)"

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash your changes."
    exit 1
fi

echo "✅ Working directory is clean"

# Build the project
echo "📦 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test:npx

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Check if this version is already published
if npm view @edicarlos.lds/businessmap-mcp@$CURRENT_VERSION > /dev/null 2>&1; then
    echo "❌ Version $CURRENT_VERSION is already published to NPM"
    echo "Please bump the version first using:"
    echo "  npm version patch|minor|major"
    echo "Or use the individual scripts: npm run publish:npm && npm run publish:github"
    exit 1
fi

# Confirm publication
read -p "🤔 Publish version $CURRENT_VERSION to npm? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ NPM publication cancelled"
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

echo "✅ Successfully published @edicarlos.lds/businessmap-mcp@$CURRENT_VERSION to NPM"
echo ""
echo "🎉 Users can now install with:"
echo "   npx @edicarlos.lds/businessmap-mcp"
echo "   npm install -g @edicarlos.lds/businessmap-mcp"
echo ""
echo "🔗 NPM Package: https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp"
echo ""
echo "🏁 NPM publication process completed successfully!"
exit 0
