#!/bin/bash

set -e

echo "🚀 Starting BusinessMap MCP Server publication process..."

# Function to check NPM authentication
check_npm_auth() {
    # First try to use token if available
    if [ -n "$NPM_PUBLISH_TOKEN" ]; then
        echo "🔑 Using NPM_PUBLISH_TOKEN for authentication"
        # Set auth token in npm config
        npm config set //registry.npmjs.org/:_authToken=$NPM_PUBLISH_TOKEN
        npm config set registry https://registry.npmjs.org/
        
        # Also ensure .npmrc has the token for this session
        echo "//registry.npmjs.org/:_authToken=$NPM_PUBLISH_TOKEN" > .npmrc.tmp
        echo "registry=https://registry.npmjs.org/" >> .npmrc.tmp
        
        return 0
    fi
    
    # Check if user is logged in to npm
    if ! npm whoami > /dev/null 2>&1; then
        echo "❌ NPM authentication failed!"
        echo ""
        echo "To fix this, you have two options:"
        echo "1) Set NPM_PUBLISH_TOKEN environment variable:"
        echo "   export NPM_PUBLISH_TOKEN=your_npm_token_here"
        echo "   # Then run the script again"
        echo ""
        echo "2) Login manually:"
        echo "   npm login"
        echo ""
        echo "💡 To get an NPM token:"
        echo "   1. Go to https://www.npmjs.com/settings/tokens"
        echo "   2. Click 'Generate New Token'"
        echo "   3. Choose 'Automation' type"
        echo "   4. Copy the token and set as NPM_PUBLISH_TOKEN"
        exit 1
    fi
    
    return 0
}

# Check NPM authentication
check_npm_auth
echo "✅ NPM authentication successful - user: $(npm whoami)"

# Check if GitHub CLI is authenticated
if ! gh auth status > /dev/null 2>&1; then
    echo "❌ You need to authenticate with GitHub CLI first: gh auth login"
    exit 1
fi

echo "✅ Authenticated with GitHub CLI"

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

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LATEST_TAG" ]; then
    echo "📋 No previous tags found, will include all commits"
    COMMIT_RANGE=""
else
    echo "📋 Latest tag: $LATEST_TAG"
    COMMIT_RANGE="$LATEST_TAG..HEAD"
fi

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

# Generate release notes based on commits since last tag
echo "📝 Generating release notes..."

# Generate the release notes using the dedicated script
RELEASE_NOTES=$(bash scripts/generate-release-notes.sh "$NEW_VERSION" "$COMMIT_RANGE")

echo "📋 Release notes preview:"
echo "$RELEASE_NOTES"
echo ""

# Confirm publication
read -p "🤔 Publish version $NEW_VERSION to npm and create GitHub release? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Publication cancelled"
    # Revert the version bump
    git tag -d "v$NEW_VERSION" 2>/dev/null || true
    git reset --hard HEAD~1
    exit 1
fi

# Push the tag to remote
echo "📤 Pushing tag to GitHub..."
git push origin "v$NEW_VERSION"

# Create GitHub release
echo "🏷️ Creating GitHub release..."
echo "$RELEASE_NOTES" | gh release create "v$NEW_VERSION" \
    --title "Release v$NEW_VERSION" \
    --notes-file - \
    --latest

# Publish to npm
echo "📤 Publishing to npm..."
npm publish

# Clean up temporary npmrc if it was created
if [ -f ".npmrc.tmp" ]; then
    rm .npmrc.tmp
fi

echo "✅ Successfully published @edicarlos.lds/businessmap-mcp@$NEW_VERSION"
echo ""
echo "🎉 Users can now install with:"
echo "   npx @edicarlos.lds/businessmap-mcp"
echo "   npm install -g @edicarlos.lds/businessmap-mcp"
echo ""
echo "🔗 Links:"
echo "   📦 NPM: https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp"
echo "   🏷️ GitHub Release: https://github.com/edicarloslds/businessmap-mcp/releases/tag/v$NEW_VERSION"
echo "   📚 Repository: https://github.com/edicarloslds/businessmap-mcp" 