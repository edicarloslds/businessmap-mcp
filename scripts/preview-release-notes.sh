#!/bin/bash

# Script to preview release notes without publishing
# Usage: ./preview-release-notes.sh [version]

set -e

# Get current version if not provided
if [ -z "$1" ]; then
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    # Calculate next patch version as example
    VERSION=$(node -p "
      const semver = require('./package.json').version.split('.');
      semver[2] = parseInt(semver[2]) + 1;
      semver.join('.');
    ")
    echo "🔍 No version provided, using next patch version as preview: $VERSION"
else
    VERSION=$1
fi

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LATEST_TAG" ]; then
    echo "📋 No previous tags found, will include all commits"
    COMMIT_RANGE=""
else
    echo "📋 Latest tag: $LATEST_TAG"
    COMMIT_RANGE="$LATEST_TAG..HEAD"
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
echo "💡 To publish with these notes, run: npm run publish:npm" 