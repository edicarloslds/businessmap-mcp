#!/bin/bash

set -e

echo "🚀 Starting BusinessMap MCP Server publication process..."

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ You need to login to npm first: npm login"
    exit 1
fi

echo "✅ Logged in to npm as: $(npm whoami)"

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

# Calculate example versions
PATCH_VERSION=$(node -p "
  const semver = require('./package.json').version.split('.');
  semver[2] = parseInt(semver[2]) + 1;
  semver.join('.');
")

MINOR_VERSION=$(node -p "
  const semver = require('./package.json').version.split('.');
  semver[1] = parseInt(semver[1]) + 1;
  semver[2] = 0;
  semver.join('.');
")

MAJOR_VERSION=$(node -p "
  const semver = require('./package.json').version.split('.');
  semver[0] = parseInt(semver[0]) + 1;
  semver[1] = 0;
  semver[2] = 0;
  semver.join('.');
")

# Ask for version type
echo ""
echo "Select version bump type:"
echo "1) patch ($CURRENT_VERSION -> $PATCH_VERSION)"
echo "2) minor ($CURRENT_VERSION -> $MINOR_VERSION)"
echo "3) major ($CURRENT_VERSION -> $MAJOR_VERSION)"
read -p "Enter choice (1-3): " choice

case $choice in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
esac

# Update version (this automatically updates package.json and creates a git tag)
echo "📝 Updating version ($VERSION_TYPE)..."
npm version $VERSION_TYPE

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: $NEW_VERSION"

# Confirm publication
read -p "🤔 Publish version $NEW_VERSION to npm? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

echo "✅ Successfully published @edicarlos.lds/businessmap-mcp@$NEW_VERSION"
echo ""
echo "🎉 Users can now install with:"
echo "   npx @edicarlos.lds/businessmap-mcp"
echo "   npm install -g @edicarlos.lds/businessmap-mcp"
echo ""
echo "📋 Don't forget to:"
echo "   1. Push the version tag: git push origin v$NEW_VERSION"
echo "   2. Create a GitHub release"
echo "   3. Update documentation if needed" 