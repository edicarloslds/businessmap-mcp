#!/bin/bash

set -e

# Check if script is already running to prevent duplicate executions
LOCK_FILE="/tmp/businessmap-mcp-publish-github.lock"
if [ -f "$LOCK_FILE" ]; then
    echo "❌ GitHub release script is already running. Lock file exists: $LOCK_FILE"
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

echo "🏷️ Starting GitHub release creation process..."

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

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Check if tag already exists
if git tag -l | grep -q "^v$CURRENT_VERSION$"; then
    echo "📋 Tag v$CURRENT_VERSION already exists"
    TAG_EXISTS=true
else
    echo "📋 Tag v$CURRENT_VERSION does not exist, will create it"
    TAG_EXISTS=false
fi

# Get the latest tag for commit range
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LATEST_TAG" ]; then
    echo "📋 No previous tags found, will include all commits"
    COMMIT_RANGE=""
else
    echo "📋 Latest tag: $LATEST_TAG"
    if [ "$TAG_EXISTS" = true ]; then
        # If current tag exists, use it as the end of range
        COMMIT_RANGE="$LATEST_TAG..v$CURRENT_VERSION"
    else
        # If current tag doesn't exist, use HEAD
        COMMIT_RANGE="$LATEST_TAG..HEAD"
    fi
fi

# Generate release notes
echo "📝 Generating release notes..."
if ! RELEASE_NOTES=$(bash scripts/generate-release-notes.sh "$CURRENT_VERSION" "$COMMIT_RANGE" 2>&1); then
    echo "❌ Failed to generate release notes: $RELEASE_NOTES"
    exit 1
fi

echo "📋 Release notes preview:"
echo "$RELEASE_NOTES"
echo ""

# Confirm release creation
read -p "🤔 Create GitHub release for version $CURRENT_VERSION? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ GitHub release creation cancelled"
    exit 1
fi

# Create tag if it doesn't exist
if [ "$TAG_EXISTS" = false ]; then
    echo "🏷️ Creating tag v$CURRENT_VERSION..."
    git tag "v$CURRENT_VERSION"
    
    # Push the tag to remote
    echo "📤 Pushing tag to GitHub..."
    git push origin "v$CURRENT_VERSION"
fi

# Check if release already exists
if gh release view "v$CURRENT_VERSION" > /dev/null 2>&1; then
    echo "❌ Release v$CURRENT_VERSION already exists on GitHub"
    echo "To update it, delete the existing release first:"
    echo "  gh release delete v$CURRENT_VERSION"
    exit 1
fi

# Create GitHub release
echo "🏷️ Creating GitHub release..."
echo "$RELEASE_NOTES" | gh release create "v$CURRENT_VERSION" \
    --title "Release v$CURRENT_VERSION" \
    --notes-file - \
    --latest

echo "✅ Successfully created GitHub release v$CURRENT_VERSION"
echo ""
echo "🔗 GitHub Release: https://github.com/edicarloslds/businessmap-mcp/releases/tag/v$CURRENT_VERSION"
echo "📚 Repository: https://github.com/edicarloslds/businessmap-mcp"
echo ""
echo "🏁 GitHub release creation process completed successfully!"
exit 0
