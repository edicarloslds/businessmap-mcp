#!/bin/bash

set -e

# Check if script is already running to prevent duplicate executions
LOCK_FILE="/tmp/businessmap-mcp-version-bump.lock"
if [ -f "$LOCK_FILE" ]; then
    echo "❌ Version bump script is already running. Lock file exists: $LOCK_FILE"
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

echo "📝 Starting version bump process..."

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash your changes."
    exit 1
fi

echo "✅ Working directory is clean"

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Get the latest tag for commit range calculation
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

# Check if the new version tag would already exist
NEW_VERSION_PREVIEW=""
case $VERSION_TYPE in
    "patch") NEW_VERSION_PREVIEW=$PATCH_VERSION ;;
    "minor") NEW_VERSION_PREVIEW=$MINOR_VERSION ;;
    "major") NEW_VERSION_PREVIEW=$MAJOR_VERSION ;;
esac

if git tag -l | grep -q "^v$NEW_VERSION_PREVIEW$"; then
    echo "❌ Tag v$NEW_VERSION_PREVIEW already exists"
    echo "Available tags: $(git tag -l | tail -5 | tr '\n' ' ')"
    echo "Please delete the tag first or choose a different version"
    exit 1
fi

# Update version (this automatically updates package.json and creates a git tag)
echo "📝 Updating version ($VERSION_TYPE)..."
npm version $VERSION_TYPE

NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: $NEW_VERSION"

# Generate release notes preview
echo "📝 Generating release notes preview..."
if RELEASE_NOTES=$(bash scripts/generate-release-notes.sh "$NEW_VERSION" "$COMMIT_RANGE" 2>&1); then
    echo ""
    echo "📋 Release notes preview for v$NEW_VERSION:"
    echo "$RELEASE_NOTES"
else
    echo "⚠️ Could not generate release notes preview: $RELEASE_NOTES"
fi

echo ""
echo "✅ Version bump completed: $CURRENT_VERSION -> $NEW_VERSION"
echo ""
echo "🔄 Next steps:"
echo "   npm run publish:npm     - Publish to NPM"
echo "   npm run publish:github  - Create GitHub release"
echo ""
echo "🏁 Version bump process completed successfully!"
exit 0
