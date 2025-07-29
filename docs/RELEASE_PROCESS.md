# Release Process

This document describes the automated release process for the BusinessMap MCP Server.

## 🚀 Automated Process

The release process has been fully automated and includes:

1. **Version bump** (patch, minor, major)
2. **Automatic release notes generation** based on commits
3. **Git tag creation**
4. **Push tag to GitHub**
5. **GitHub release creation** with release notes
6. **NPM publication**

## 📝 How to Make a Release

### 1. Preparation

Before making a release, ensure that:

- [ ] All changes are committed
- [ ] You are authenticated to NPM: `npm whoami`
- [ ] You are authenticated to GitHub CLI: `gh auth status`
- [ ] Working directory is clean

### 2. Release Notes Preview

To see how the release notes will look before publishing:

```bash
npm run preview:release
# or for a specific version:
npm run preview:release 1.2.3
```

### 3. Publication

Execute the publish command:

```bash
npm run publish:npm
```

The script will:

1. Verify authentications
2. Build and test
3. Show version options (patch/minor/major)
4. Generate release notes preview
5. Confirm publication
6. Execute the entire process automatically

## 📋 Release Notes Format

Release notes are automatically generated based on commits since the last tag and organized by category:

### 🚀 New Features
- Commits starting with `feat:`, `feature:` or `FEAT:`

### 🐛 Bug Fixes  
- Commits starting with `fix:` or `FIX:`

### ♻️ Code Refactoring
- Commits starting with `refactor:` or `REFACTOR:`

### 📚 Documentation
- Commits starting with `docs:`, `doc:` or `DOCS:`

### 🔧 Other Changes
- All other commits

## 🏷️ Commit Convention

To maximize release notes quality, it's recommended to use the following prefixes:

```
feat: add new functionality
fix: fix bug
docs: update documentation
refactor: refactor code
test: add or update tests
chore: maintenance tasks
```

## 🔧 Available Scripts

- `npm run publish:npm` - Complete release process
- `npm run preview:release` - Preview release notes
- `scripts/generate-release-notes.sh` - Generate release notes for specific version

## 🎯 Example of Generated Release Notes

```markdown
## What's Changed

### 🚀 New Features
- add user authentication support by @username
- implement card filtering by @username

### 🐛 Bug Fixes
- fix memory leak in client by @username
- resolve API timeout issues by @username

### 📚 Documentation
- update README with new examples by @username

**Full Changelog**: https://github.com/edicarloslds/businessmap-mcp/compare/v1.0.0...v1.1.0
```

## 🚨 Troubleshooting

### NPM Authentication Error
```bash
npm login
```

### GitHub Authentication Error
```bash
gh auth login
```

### Working Directory not clean
```bash
git status
git add .
git commit -m "prepare for release"
```

### Tag already exists
If something goes wrong during the process, you can remove the created tag:
```bash
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
``` 