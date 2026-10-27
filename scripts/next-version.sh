#!/bin/bash

# Determine the semver bump implied by Conventional Commits in a range.
# Usage: ./next-version.sh [commit-range]
# Prints one of: major, minor, patch, none
#
#   feat!: / fix(scope)!: / "BREAKING CHANGE:" footer -> major
#   feat:                                              -> minor
#   fix: / perf:                                       -> patch
#   anything else (chore, docs, test, ci, ...)         -> none
#
# Usage: ./next-version.sh --apply <major|minor|patch> <version>
# Prints the bumped version without touching any file.

set -e

if [ "$1" = "--apply" ]; then
    IFS='.' read -r major minor patch <<< "${3%%-*}"
    case $2 in
        major) echo "$((major + 1)).0.0" ;;
        minor) echo "$major.$((minor + 1)).0" ;;
        patch) echo "$major.$minor.$((patch + 1))" ;;
        *) echo "$3" ;;
    esac
    exit 0
fi

COMMIT_RANGE=${1:-""}

if [ -z "$COMMIT_RANGE" ]; then
    COMMIT_RANGE="HEAD"
fi

subjects=$(git log $COMMIT_RANGE --format='%s')
bodies=$(git log $COMMIT_RANGE --format='%b')

shopt -s nocasematch

bump="none"
while IFS= read -r subject; do
    [ -z "$subject" ] && continue

    # Release commits created by the release workflow never trigger another release
    if [[ $subject =~ ^chore\(release\): ]]; then
        continue
    fi

    if [[ $subject =~ ^[a-z]+(\([^\)]*\))?!: ]]; then
        bump="major"
        break
    elif [[ $subject =~ ^feat(\([^\)]*\))?: ]]; then
        bump="minor"
    elif [[ $subject =~ ^(fix|perf)(\([^\)]*\))?: ]] && [ "$bump" = "none" ]; then
        bump="patch"
    fi
done <<< "$subjects"

if [ "$bump" != "major" ] && echo "$bodies" | grep -qiE '^BREAKING[ -]CHANGE:'; then
    bump="major"
fi

echo "$bump"
