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

# Capture latest tags (remote preferred) for later commit range calculation
START_LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
REMOTE_LATEST_TAG=$(git ls-remote --tags --refs origin 2>/dev/null \
  | awk -F/ '{print $NF}' \
  | grep -E '^v?[0-9]+(\.[0-9]+){2}$' \
  | sed 's/^v//' \
  | sort -t. -k1,1n -k2,2n -k3,3n \
  | tail -1)
if [ -n "$REMOTE_LATEST_TAG" ]; then
  REMOTE_LATEST_TAG="v$REMOTE_LATEST_TAG"
fi

if [ -n "$REMOTE_LATEST_TAG" ]; then
    echo "📋 Latest remote tag: $REMOTE_LATEST_TAG"
elif [ -n "$START_LATEST_TAG" ]; then
    echo "📋 Latest local tag: $START_LATEST_TAG"
else
    echo "📋 No previous tags found yet (local or remote)"
fi

DID_BUMP=false

# Always offer version bump selection right after clean working directory check
PATCH_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[2]=parseInt(s[2])+1;s.join('.')")
MINOR_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[1]=parseInt(s[1])+1;s[2]=0;s.join('.')")
MAJOR_VERSION=$(node -p "const s=require('./package.json').version.split('.');s[0]=parseInt(s[0])+1;s[1]=0;s[2]=0;s.join('.')")

echo ""
echo "Select version bump type:"
echo "0) keep current ($CURRENT_VERSION)"
echo "1) patch ($CURRENT_VERSION -> $PATCH_VERSION)"
echo "2) minor ($CURRENT_VERSION -> $MINOR_VERSION)"
echo "3) major ($CURRENT_VERSION -> $MAJOR_VERSION)"
read -p "Enter choice (0-3): " choice

case $choice in
    0) DID_BUMP=false ;;
    1) VERSION_TYPE="patch"; DID_BUMP=true ;;
    2) VERSION_TYPE="minor"; DID_BUMP=true ;;
    3) VERSION_TYPE="major"; DID_BUMP=true ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
esac

if [ "$DID_BUMP" = true ]; then
    echo "📝 Updating version ($VERSION_TYPE)..."
    npm version $VERSION_TYPE
    CURRENT_VERSION=$(node -p "require('./package.json').version")
fi

# Compute commit range after potential bump so rules use the selected version
# Prefer remote latest tag as the base; fallback to local
if [ -n "$REMOTE_LATEST_TAG" ]; then
    PREVIOUS_TAG="$REMOTE_LATEST_TAG"
else
    PREVIOUS_TAG="$START_LATEST_TAG"
fi

if [ -n "$PREVIOUS_TAG" ]; then
    COMMIT_RANGE="$PREVIOUS_TAG..HEAD"
else
    COMMIT_RANGE=""
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

# If user chose to keep current, check if tag exists and ask for confirmation
if [ "$DID_BUMP" = false ]; then
    # Check if current version tag exists
    if git tag -l | grep -q "^v$CURRENT_VERSION$"; then
        echo "📋 Tag v$CURRENT_VERSION already exists locally"
        
        # Check if release already exists on GitHub
        if gh release view "v$CURRENT_VERSION" > /dev/null 2>&1; then
            echo "❌ Release v$CURRENT_VERSION already exists on GitHub"
            echo "ℹ️ Keep current selected but release already exists. No action needed."
            exit 0
        else
            echo "🔄 Tag exists but no GitHub release found"
            read -p "🤔 Create GitHub release for existing version $CURRENT_VERSION? (y/N): " create_release_confirm
            if [[ $create_release_confirm != [yY] ]]; then
                echo "ℹ️ GitHub release creation cancelled. Only showing release notes."
                exit 0
            fi
            # Continue with release creation flow
        fi
    else
        echo "📋 Tag v$CURRENT_VERSION does not exist"
        read -p "🤔 Create tag and GitHub release for current version $CURRENT_VERSION? (y/N): " create_tag_release_confirm
        if [[ $create_tag_release_confirm != [yY] ]]; then
            echo "ℹ️ Tag and release creation cancelled. Only showing release notes."
            exit 0
        fi
        # Continue with tag creation and release flow
    fi
fi

# Confirm release creation for the (possibly new) CURRENT_VERSION
# Skip this confirmation if user already confirmed in the "keep current" flow above
if [ "$DID_BUMP" = true ]; then
    read -p "🤔 Create GitHub release for version $CURRENT_VERSION? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "❌ GitHub release creation cancelled"
        # Revert the version bump if user cancels after bump
        if [ "$DID_BUMP" = true ]; then
            echo "🔄 Reverting version bump..."
            git tag -d "v$CURRENT_VERSION" 2>/dev/null || true
            git reset --hard HEAD~1
        fi
        exit 1
    fi
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
