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

# Do not pre-validate tag existence; handle bump and tagging after confirmation
TAG_EXISTS=false

# Capture the latest tag at script start for later commit range calculation
START_LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$START_LATEST_TAG" ]; then
    echo "📋 No previous tags found yet"
else
    echo "📋 Latest tag at start: $START_LATEST_TAG"
fi

DID_BUMP=false

# Offer bump if release already exists for current tag version
if gh release view "v$CURRENT_VERSION" > /dev/null 2>&1; then
    echo "❌ Release v$CURRENT_VERSION already exists on GitHub"
    echo ""
    echo "🔄 Would you like to bump the version and create a new release?"
    read -p "Bump version and continue? (y/N): " bump_confirm
    if [[ $bump_confirm != [yY] ]]; then
        echo "❌ GitHub release creation cancelled"
        echo "To update existing release, delete it first: gh release delete v$CURRENT_VERSION"
        exit 1
    fi

    PATCH_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[2]=parseInt(s[2])+1;s.join('.')")
    MINOR_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[1]=parseInt(s[1])+1;s[2]=0;s.join('.')")
    MAJOR_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[0]=parseInt(s[0])+1;s[1]=0;s[2]=0;s.join('.')")

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

    echo "📝 Updating version ($VERSION_TYPE)..."
    npm version $VERSION_TYPE
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    DID_BUMP=true
fi

# Compute commit range after potential bump so rules use the selected version
if git tag -l | grep -q "^v$CURRENT_VERSION$"; then
    # Tag exists locally (either pre-existing or created by npm version)
    if [ "$DID_BUMP" = true ]; then
        PREVIOUS_TAG="$START_LATEST_TAG"
    else
        PREVIOUS_TAG=$(git tag --sort=-version:refname | grep -v "^v$CURRENT_VERSION$" | head -1)
    fi
    if [ -z "$PREVIOUS_TAG" ]; then
        COMMIT_RANGE=""
    else
        COMMIT_RANGE="$PREVIOUS_TAG..v$CURRENT_VERSION"
    fi
else
    # Tag doesn't exist yet; compare from last known tag to HEAD
    if [ -z "$START_LATEST_TAG" ]; then
        COMMIT_RANGE=""
    else
        COMMIT_RANGE="$START_LATEST_TAG..HEAD"
    fi
fi

# Generate release notes AFTER bump selection
echo "📝 Generating release notes..."
if ! RELEASE_NOTES=$(bash scripts/generate-release-notes.sh "$CURRENT_VERSION" "$COMMIT_RANGE" 2>&1); then
    echo "❌ Failed to generate release notes: $RELEASE_NOTES"
    exit 1
fi

echo "📋 Release notes preview:"
echo "$RELEASE_NOTES"
echo ""

# Confirm release creation for the (possibly new) CURRENT_VERSION
read -p "🤔 Create GitHub release for version $CURRENT_VERSION? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ GitHub release creation cancelled"
    exit 1
fi

# Ensure tag exists locally (npm version already created it if bump happened; otherwise create now)
if ! git tag -l | grep -q "^v$CURRENT_VERSION$"; then
    echo "🏷️ Creating tag v$CURRENT_VERSION..."
    git tag "v$CURRENT_VERSION"
fi

# Push the tag to remote after confirmation
echo "📤 Pushing tag to GitHub..."
git push origin "v$CURRENT_VERSION"



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
