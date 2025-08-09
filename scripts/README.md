# Publishing Scripts

This directory contains scripts to automate the release and publishing process of the BusinessMap MCP Server.

## Available Scripts

### 📦 `publish-npm.sh` – NPM Publish

Publishes the package to the NPM Registry.

**Usage:**

```bash
npm run publish:npm
```

**Features:**

- Automatically detects if the current version has already been published
- Automatically bumps the version when needed
- Runs build and tests automatically
- Publishes to NPM

**Prerequisites:**

- You must be logged in to NPM (`npm login`)

### 🏷️ `publish-github.sh` – GitHub Release

Creates a GitHub release with automatically generated release notes.

**Usage:**

```bash
npm run publish:github
```

**Features:**

- Automatically detects if the release already exists
- Automatically bumps the version when needed
- Automatically creates git tags
- Automatically generates release notes
- Automatically pushes tags to the remote repository

**Prerequisites:**

- GitHub CLI must be authenticated (`gh auth login`)

### 📝 `generate-release-notes.sh` – Release Notes Generation

Generates release notes based on commits since the last tag.

**Usage:**

```bash
bash scripts/generate-release-notes.sh <version> [commit-range]
```

### 👀 `preview-release-notes.sh` – Release Notes Preview

Previews the release notes that would be generated.

**Usage:**

```bash
npm run preview:release
```

## Workflows

### Option 1: Fully Automated Process

```bash
# NPM detects published version and offers automatic bump
npm run publish:npm

# GitHub detects existing release and offers automatic bump
npm run publish:github
```

### Option 2: Independent Flows

```bash
# Only publish to NPM (with automatic bump if needed)
npm run publish:npm

# Only create a GitHub release (with automatic bump if needed)
npm run publish:github
```

## Safety Features

- ✅ **Lock files** prevent duplicate execution
- ✅ **Validations** check authentication and repository state
- ✅ **Automatic rollback** in case of errors during version bump
- ✅ **Confirmations** before performing irreversible actions
- ✅ **Automatic cleanup** removes lock files on exit

## Troubleshooting

### Script is already running

```bash
rm /tmp/businessmap-mcp-publish*.lock
```

### Manually revert a version bump

```bash
git tag -d v<version>
git reset --hard HEAD~1
```

### Preview the release notes

```bash
npm run preview:release
```
