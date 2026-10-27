#!/bin/bash

# Script to generate release notes for GitHub releases
# Usage: ./generate-release-notes.sh <version> [commit-range]

set -e

VERSION=$1
COMMIT_RANGE=${2:-""}
REPO=${GITHUB_REPOSITORY:-"edicarloslds/businessmap-mcp"}

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [commit-range]"
    echo "Example: $0 1.2.3 v1.2.2..HEAD"
    exit 1
fi

VERSION=${VERSION#v}

# Cache of "email<TAB>login" lines so each author is resolved only once
LOGIN_CACHE=$(mktemp)
trap 'rm -f "$LOGIN_CACHE"' EXIT

GH_AVAILABLE=false
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    GH_AVAILABLE=true
fi

# Resolve the GitHub login of a commit author, falling back to the git author name
resolve_author() {
    local sha=$1
    local email=$2
    local name=$3
    local login=""

    login=$(awk -F'\t' -v e="$email" '$1 == e { print $2; exit }' "$LOGIN_CACHE")
    if [ -n "$login" ]; then
        echo "$login"
        return
    fi

    # GitHub noreply addresses embed the login: 12345+login@users.noreply.github.com
    if [[ $email =~ ^([0-9]+\+)?([^@]+)@users\.noreply\.github\.com$ ]]; then
        login="@${BASH_REMATCH[2]}"
    elif [ "$GH_AVAILABLE" = true ]; then
        # gh prints the error payload on stdout when the commit is unknown to GitHub
        if login=$(gh api "repos/$REPO/commits/$sha" --jq '.author.login // empty' 2>/dev/null) \
            && [[ $login =~ ^[A-Za-z0-9-]+(\[bot\])?$ ]]; then
            login="@$login"
        else
            login=""
        fi
    fi

    if [ -z "$login" ]; then
        login="$name"
    fi

    printf '%s\t%s\n' "$email" "$login" >> "$LOGIN_CACHE"
    echo "$login"
}

# Function to categorize commits
categorize_commits() {
    local range=$1

    # Initialize arrays for different types
    declare -a breaking=()
    declare -a features=()
    declare -a fixes=()
    declare -a perf=()
    declare -a refactor=()
    declare -a docs=()
    declare -a deps=()
    declare -a other=()

    # Get commits (fields separated by the ASCII unit separator)
    if [ -z "$range" ]; then
        # If no range, get all commits (first release)
        commits=$(git log --pretty=format:"%H%x1f%s%x1f%ae%x1f%an" --reverse | head -20)
    else
        commits=$(git log $range --pretty=format:"%H%x1f%s%x1f%ae%x1f%an" --reverse)
    fi

    shopt -s nocasematch

    # Process each commit
    while IFS=$'\x1f' read -r sha message email name; do
        [ -z "$sha" ] && continue

        # Skip release and version bump commits (e.g., "chore(release): 1.2.3", "1.2.3" or "v1.2.3")
        if [[ $message =~ ^chore\(release\): ]] || [[ $message =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            continue
        fi

        author=$(resolve_author "$sha" "$email" "$name")

        # Split "type(scope)!: description"
        type=""
        scope=""
        bang=""
        description=$message
        if [[ $message =~ ^([a-z]+)(\(([^\)]*)\))?(!)?:[[:space:]]*(.*)$ ]]; then
            type=$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')
            scope=${BASH_REMATCH[3]}
            bang=${BASH_REMATCH[4]}
            description=${BASH_REMATCH[5]}
        fi

        entry="- $description by $author"
        if [ -n "$scope" ] && [[ ! $scope =~ ^deps(-dev)?$ ]]; then
            entry="- **$scope:** $description by $author"
        fi

        # Categorize based on commit message prefix
        if [ -n "$bang" ] || git log -1 --format=%b "$sha" | grep -qiE '^BREAKING[ -]CHANGE:'; then
            breaking+=("$entry")
        elif [[ $scope =~ ^deps(-dev)?$ ]]; then
            deps+=("$entry")
        elif [ "$type" = "feat" ] || [ "$type" = "feature" ]; then
            features+=("$entry")
        elif [ "$type" = "fix" ]; then
            fixes+=("$entry")
        elif [ "$type" = "perf" ]; then
            perf+=("$entry")
        elif [ "$type" = "refactor" ]; then
            refactor+=("$entry")
        elif [ "$type" = "docs" ] || [ "$type" = "doc" ]; then
            docs+=("$entry")
        else
            other+=("$entry")
        fi
    done <<< "$commits"

    shopt -u nocasematch

    # Generate release notes
    echo "## What's Changed"
    echo ""

    print_section "⚠️ Breaking Changes" "${breaking[@]}"
    print_section "🚀 New Features" "${features[@]}"
    print_section "🐛 Bug Fixes" "${fixes[@]}"
    print_section "⚡ Performance" "${perf[@]}"
    print_section "♻️ Code Refactoring" "${refactor[@]}"
    print_section "📚 Documentation" "${docs[@]}"
    print_section "📦 Dependencies" "${deps[@]}"
    print_section "🔧 Other Changes" "${other[@]}"

    # Add changelog link
    if [ -n "$COMMIT_RANGE" ]; then
        # Extract the previous tag from the commit range (everything before the dots)
        PREVIOUS_TAG=$(echo $COMMIT_RANGE | sed 's/\.\.\..*$//' | sed 's/\.\..*$//')
    else
        # If no range provided, get the previous tag automatically
        PREVIOUS_TAG=$(git tag --sort=-version:refname | grep -v "^v$VERSION$" | head -1)
    fi

    if [ -n "$PREVIOUS_TAG" ]; then
        if [ "${PREVIOUS_TAG#v}" != "$VERSION" ]; then
            echo "**Full Changelog**: https://github.com/$REPO/compare/$PREVIOUS_TAG...v$VERSION"
        fi
    else
        # For first release
        echo "**Full Changelog**: https://github.com/$REPO/commits/v$VERSION"
    fi
}

print_section() {
    local title=$1
    shift
    if [ $# -gt 0 ]; then
        echo "### $title"
        printf '%s\n' "$@"
        echo ""
    fi
}

# Generate and output the release notes
categorize_commits "$COMMIT_RANGE"
