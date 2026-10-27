#!/bin/bash

# Non-interactive release used by .github/workflows/release.yml
#
# 1. If the version in package.json is not on npm yet (failed previous run, or a
#    version bumped by hand in a PR), tag it if needed and publish it as is.
# 2. Otherwise compute the bump from Conventional Commits since the last tag,
#    create the release commit and tag, push them, publish to npm and create
#    the GitHub release.
#
# Requires: git push access, npm Trusted Publishing (OIDC) and GH_TOKEN for gh.
# Set DRY_RUN=true to print what would happen without pushing or publishing.

set -e

PACKAGE_NAME=$(node -p "require('./package.json').name")
DRY_RUN=${DRY_RUN:-false}
BRANCH=${RELEASE_BRANCH:-main}

run() {
    if [ "$DRY_RUN" = true ]; then
        echo "[dry-run] $*"
    else
        "$@"
    fi
}

set_output() {
    if [ -n "$GITHUB_OUTPUT" ]; then
        echo "$1=$2" >> "$GITHUB_OUTPUT"
    fi
}

# Only a 404 means "not published"; any other npm error aborts the release
is_published() {
    local output
    if output=$(npm view "$PACKAGE_NAME@$1" version 2>&1); then
        [ -n "$output" ]
        return
    fi
    if echo "$output" | grep -q "E404"; then
        return 1
    fi
    echo "❌ Could not query npm registry:" >&2
    echo "$output" >&2
    exit 1
}

latest_tag() {
    git describe --tags --abbrev=0 --match 'v[0-9]*.[0-9]*.[0-9]*' "${1:-HEAD}" 2>/dev/null || echo ""
}

publish_and_release() {
    local version=$1
    local previous_tag=$2
    local range=""
    local end_ref="v$version"
    local notes_file

    if ! git rev-parse -q --verify "refs/tags/$end_ref" > /dev/null; then
        end_ref="HEAD"
    fi
    if [ -n "$previous_tag" ]; then
        range="$previous_tag..$end_ref"
    fi

    notes_file=$(mktemp)
    bash scripts/generate-release-notes.sh "$version" "$range" > "$notes_file"

    echo "📋 Release notes:"
    cat "$notes_file"
    echo ""

    if is_published "$version"; then
        echo "ℹ️ $PACKAGE_NAME@$version is already on npm, skipping publish"
    else
        echo "📤 Publishing $PACKAGE_NAME@$version to npm..."
        run npm publish --provenance --access public
    fi

    if gh release view "v$version" > /dev/null 2>&1; then
        echo "ℹ️ GitHub release v$version already exists, skipping"
    else
        echo "🏷️ Creating GitHub release v$version..."
        run gh release create "v$version" \
            --title "Release v$version" \
            --notes-file "$notes_file" \
            --verify-tag \
            --latest
    fi

    rm -f "$notes_file"
    set_output released true
    set_output version "$version"
    echo "✅ Released $PACKAGE_NAME@$version"
}

CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Resume: package.json holds a version that never reached npm, or whose
# GitHub release was not created (e.g. a previous run failed halfway)
NEEDS_RESUME=false
if ! is_published "$CURRENT_VERSION"; then
    NEEDS_RESUME=true
    echo "🔄 $CURRENT_VERSION is not on npm yet, releasing it as is"
elif git rev-parse -q --verify "refs/tags/v$CURRENT_VERSION" > /dev/null \
    && ! gh release view "v$CURRENT_VERSION" > /dev/null 2>&1; then
    NEEDS_RESUME=true
    echo "🔄 v$CURRENT_VERSION has no GitHub release yet, finishing it"
fi

if [ "$NEEDS_RESUME" = true ]; then

    if git rev-parse -q --verify "refs/tags/v$CURRENT_VERSION" > /dev/null; then
        PREVIOUS_TAG=$(latest_tag "v$CURRENT_VERSION^")
    else
        PREVIOUS_TAG=$(latest_tag)
        echo "🏷️ Tagging HEAD as v$CURRENT_VERSION..."
        run git tag -a "v$CURRENT_VERSION" -m "v$CURRENT_VERSION"
        run git push origin "v$CURRENT_VERSION"
    fi

    publish_and_release "$CURRENT_VERSION" "$PREVIOUS_TAG"
    exit 0
fi

LAST_TAG=$(latest_tag)
if [ -n "$LAST_TAG" ]; then
    COMMIT_RANGE="$LAST_TAG..HEAD"
else
    COMMIT_RANGE=""
fi
echo "🔗 Commit range: ${COMMIT_RANGE:-"all commits"}"

BUMP=$(bash scripts/next-version.sh "$COMMIT_RANGE")
echo "📈 Bump: $BUMP"

if [ "$BUMP" = "none" ]; then
    echo "ℹ️ No feat/fix/perf/breaking commits since ${LAST_TAG:-"the beginning"}, nothing to release"
    set_output released false
    exit 0
fi

echo "📝 Updating version ($BUMP)..."
if [ "$DRY_RUN" = true ]; then
    NEW_VERSION=$(bash scripts/next-version.sh --apply "$BUMP" "$CURRENT_VERSION")
    echo "[dry-run] would release $NEW_VERSION"
    bash scripts/generate-release-notes.sh "$NEW_VERSION" "$COMMIT_RANGE"
    exit 0
fi

npm version "$BUMP" -m "chore(release): %s"
NEW_VERSION=$(node -p "require('./package.json').version")

echo "📤 Pushing release commit and tag..."
git push --atomic origin "HEAD:$BRANCH" "v$NEW_VERSION"

publish_and_release "$NEW_VERSION" "$LAST_TAG"
