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

# Run the same local checks enforced by CI before the API-backed smoke test
echo "🔍 Running lint..."
npm run lint

echo "🧪 Running unit tests..."
npm test -- --runInBand

echo "📦 Building project..."
npm run build

echo "🧹 Checking for unused code..."
npm run knip

echo "🌐 Running package smoke test..."
npm run test:npx

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Check if this version is already published
if npm view @edicarlos.lds/businessmap-mcp@$CURRENT_VERSION > /dev/null 2>&1; then
    echo "❌ Version $CURRENT_VERSION is already published to NPM"
    echo ""
    echo "🔄 Would you like to bump the version and publish?"
    read -p "Bump version and continue? (y/N): " bump_confirm
    if [[ $bump_confirm != [yY] ]]; then
        echo "❌ NPM publication cancelled"
        echo "You can bump the version manually using: npm version patch|minor|major"
        exit 1
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
    CURRENT_VERSION=$NEW_VERSION
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
