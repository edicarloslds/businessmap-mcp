#!/bin/bash

# Script to generate release notes for GitHub releases
# Usage: ./generate-release-notes.sh <version> [commit-range]

set -e

VERSION=$1
COMMIT_RANGE=${2:-""}

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version> [commit-range]"
    echo "Example: $0 1.2.3 v1.2.2..HEAD"
    exit 1
fi

# Function to categorize commits
categorize_commits() {
    local range=$1
    
    # Initialize arrays for different types
    declare -a features=()
    declare -a fixes=()
    declare -a docs=()
    declare -a refactor=()
    declare -a other=()
    
    # Get commits
    if [ -z "$range" ]; then
        # If no range, get all commits (first release)
        commits=$(git log --pretty=format:"%s|%an" --reverse | head -20)
    else
        commits=$(git log $range --pretty=format:"%s|%an" --reverse)
    fi
    
    # Process each commit
    while IFS='|' read -r message author; do
        # Skip version bump commits
        if [[ $message =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            continue
        fi
        
        # Extract GitHub username if available, fallback to git author
        gh_user=$(gh api user --jq '.login' 2>/dev/null || echo "$author")
        # If we got a git author name, try to extract a username format
        if [[ "$gh_user" == "$author" && "$author" =~ ^[a-zA-Z0-9._-]+$ ]]; then
            gh_user="$author"
        elif [[ "$gh_user" == "$author" ]]; then
            # Convert full name to a username-like format
            gh_user=$(echo "$author" | tr '[:upper:]' '[:lower:]' | sed 's/ //g' | sed 's/[^a-zA-Z0-9._-]//g')
        fi
        
        # Categorize based on commit message prefix
        if [[ $message =~ ^[Ff][Ee][Aa][Tt][:_\s] ]]; then
            features+=("- ${message#*:} by @$gh_user")
        elif [[ $message =~ ^[Ff][Ii][Xx][:_\s] ]]; then
            fixes+=("- ${message#*:} by @$gh_user")
        elif [[ $message =~ ^[Dd][Oo][Cc][Ss]?[:_\s] ]]; then
            docs+=("- ${message#*:} by @$gh_user")
        elif [[ $message =~ ^[Rr][Ee][Ff][Aa][Cc][Tt][Oo][Rr][:_\s] ]]; then
            refactor+=("- ${message#*:} by @$gh_user")
        else
            # Clean up the message and add to other
            clean_message=$message
            # Remove common prefixes if present
            clean_message=${clean_message#*: }
            other+=("- $clean_message by @$gh_user")
        fi
    done <<< "$commits"
    
    # Generate release notes
    echo "## What's Changed"
    echo ""
    
    # Print features
    if [ ${#features[@]} -gt 0 ]; then
        echo "### 🚀 New Features"
        printf '%s\n' "${features[@]}"
        echo ""
    fi
    
    # Print fixes
    if [ ${#fixes[@]} -gt 0 ]; then
        echo "### 🐛 Bug Fixes"
        printf '%s\n' "${fixes[@]}"
        echo ""
    fi
    
    # Print refactoring
    if [ ${#refactor[@]} -gt 0 ]; then
        echo "### ♻️ Code Refactoring"
        printf '%s\n' "${refactor[@]}"
        echo ""
    fi
    
    # Print documentation
    if [ ${#docs[@]} -gt 0 ]; then
        echo "### 📚 Documentation"
        printf '%s\n' "${docs[@]}"
        echo ""
    fi
    
    # Print other changes
    if [ ${#other[@]} -gt 0 ]; then
        echo "### 🔧 Other Changes"
        printf '%s\n' "${other[@]}"
        echo ""
    fi
    
    # Add changelog link
    if [ -n "$COMMIT_RANGE" ]; then
        LATEST_TAG=$(echo $COMMIT_RANGE | cut -d'.' -f1)
        echo "**Full Changelog**: https://github.com/edicarloslds/businessmap-mcp/compare/$LATEST_TAG...v$VERSION"
    else
        # For first release
        FIRST_COMMIT=$(git rev-list --max-parents=0 HEAD)
        echo "**Full Changelog**: https://github.com/edicarloslds/businessmap-mcp/commits/v$VERSION"
    fi
}

# Generate and output the release notes
categorize_commits "$COMMIT_RANGE" 