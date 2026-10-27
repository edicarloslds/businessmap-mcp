# Release Scripts

Releases are published by the [Release workflow](../.github/workflows/release.yml)
on every push to `main`. See [docs/RELEASE_PROCESS.md](../docs/RELEASE_PROCESS.md)
for the full process.

## Available Scripts

### 🚀 `release.sh` – Automated Release

Non-interactive release used by the workflow: computes the next version from
Conventional Commits, creates the release commit and tag, pushes them,
publishes to npm and creates the GitHub release. Safe to re-run: it finishes a
release left halfway instead of creating a new one.

```bash
DRY_RUN=true bash scripts/release.sh
```

### 📈 `next-version.sh` – Bump Detection

Prints `major`, `minor`, `patch` or `none` for a commit range.

```bash
bash scripts/next-version.sh v1.2.2..HEAD
bash scripts/next-version.sh --apply minor 1.2.2   # 1.3.0
```

### 📝 `generate-release-notes.sh` – Release Notes Generation

Generates release notes based on commits in a range, crediting each commit to
its GitHub author (resolved with `gh` when it is authenticated).

```bash
bash scripts/generate-release-notes.sh <version> [commit-range]
```

### 👀 `preview-release-notes.sh` – Release Preview

Shows the version and release notes the workflow would publish for the current
branch.

```bash
npm run preview:release
```
