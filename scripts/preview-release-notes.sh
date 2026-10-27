#!/bin/bash

# Script to preview the next release without publishing
# Usage: ./preview-release-notes.sh [version]

set -e

CURRENT_VERSION=$(node -p "require('./package.json').version")

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
if [ -z "$LATEST_TAG" ]; then
    echo "📋 No previous tags found, will include all commits"
    COMMIT_RANGE=""
else
    echo "📋 Latest tag: $LATEST_TAG"
    COMMIT_RANGE="$LATEST_TAG..HEAD"
fi

BUMP=$(bash scripts/next-version.sh "$COMMIT_RANGE")

# Use the version the release workflow would compute unless one was provided
if [ -z "$1" ]; then
    if [ "$BUMP" = "none" ]; then
        echo "ℹ️ No feat/fix/perf/breaking commits since ${LATEST_TAG:-"the beginning"}: merging to main will not release"
        exit 0
    fi
    VERSION=$(bash scripts/next-version.sh --apply "$BUMP" "$CURRENT_VERSION")
    echo "📈 Bump: $BUMP ($CURRENT_VERSION -> $VERSION)"
else
    VERSION=$1
fi

echo ""
echo "📝 Generating release notes preview for version $VERSION..."
echo "🔗 Commit range: ${COMMIT_RANGE:-"all commits"}"
echo ""
echo "=" $(printf '%.0s=' {1..60})

# Generate the release notes using the dedicated script
bash scripts/generate-release-notes.sh "$VERSION" "$COMMIT_RANGE"

echo ""
echo "=" $(printf '%.0s=' {1..60})
echo ""
echo "💡 The Release workflow publishes these notes automatically when these commits land on main"
