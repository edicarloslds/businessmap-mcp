# Release Process

Releases are fully automated by the [Release workflow](../.github/workflows/release.yml).
Merging to `main` is the only manual step.

## 🚀 What Happens on Every Push to `main`

1. **Validation**: lint, unit tests, build, knip and, when the smoke secrets are
   configured, the `test:npx` package smoke test.
2. **Version calculation** from [Conventional Commits](https://www.conventionalcommits.org)
   since the last `vX.Y.Z` tag:

   | Commits since last tag | Release |
   |---|---|
   | `feat!:`, `fix(scope)!:` or a `BREAKING CHANGE:` footer | major |
   | `feat:` | minor |
   | `fix:`, `perf:` (including `fix(deps):` from Dependabot) | patch |
   | only `chore:`, `docs:`, `test:`, `ci:`, `refactor:`, ... | no release |

3. **Release commit and tag**: `chore(release): X.Y.Z` plus tag `vX.Y.Z`, pushed to `main`.
4. **npm publication** with provenance, through npm Trusted Publishing (no token stored in GitHub).
5. **GitHub release** with the generated release notes.

Runs are serialized, so pushes made while a release is running are released by
the next run.

## 🏷️ Commit Convention

Pull requests are squash merged, so the **PR title** becomes the commit message
that drives the release. Use:

```text
feat: add a new capability            -> minor
fix: correct existing behavior        -> patch
perf: make something faster           -> patch
feat!: remove deprecated tool         -> major
docs: / refactor: / test: / chore:    -> no release on their own
```

For a breaking change without `!`, add a footer to the commit body:

```text
BREAKING CHANGE: list_cards no longer accepts board_name
```

## 👀 Previewing the Next Release

```bash
npm run preview:release          # next version and notes, as the workflow would compute them
npm run preview:release 1.2.3    # notes for an explicit version
```

The workflow can also be started manually from **Actions → Release → Run workflow**
with **dry_run** checked to see the version and notes without publishing anything.

## 🎛️ Forcing a Specific Version

Bump `version` in `package.json` (and `package-lock.json`) in a pull request,
for example with `npm version 5.0.0 --no-git-tag-version`. When it lands on
`main`, the workflow sees an unpublished version, tags that commit and releases
it as is instead of computing a bump.

## 📋 Release Notes Format

Commits since the previous tag are grouped by type, each one credited to its
GitHub author:

```markdown
## What's Changed

### ⚠️ Breaking Changes
### 🚀 New Features
### 🐛 Bug Fixes
### ⚡ Performance
### ♻️ Code Refactoring
### 📚 Documentation
### 📦 Dependencies          (scope `deps` / `deps-dev`)
### 🔧 Other Changes

**Full Changelog**: https://github.com/edicarloslds/businessmap-mcp/compare/v1.0.0...v1.1.0
```

## ⚙️ One-time Setup

1. **GitHub environment**: in *Settings → Environments*, create `npm` and under
   *Deployment branches and tags* select *Selected branches and tags* with only
   `main`. Only the release job running on `main` can then request an npm
   publish token.
2. **npm Trusted Publishing**: on npmjs.com, open the package → *Settings* →
   *Trusted Publisher* → *GitHub Actions* and set:
   - Organization or user: `edicarloslds`
   - Repository: `businessmap-mcp`
   - Workflow filename: `release.yml`
   - Environment name: `npm`
   - Allowed actions: `npm publish` (besides the default `npm stage publish`),
     since the workflow publishes directly without a manual approval step
3. **Smoke test secrets** (optional): add environment secrets to `npm` or repository secrets
   `BUSINESSMAP_SMOKE_API_URL` and `BUSINESSMAP_SMOKE_API_TOKEN`, ideally a
   read-only token. Without them the smoke test step is skipped.
4. **Squash merge only**: in *Settings → General → Pull Requests*, keep only
   *Allow squash merging* with the default message set to the PR title.
5. **Branch protection** (if enabled later): allow GitHub Actions to push the
   release commit and tag to `main`, otherwise the release push is rejected.

## 🔧 Scripts

- `scripts/release.sh` - non-interactive release used by the workflow (`DRY_RUN=true` to simulate)
- `scripts/next-version.sh` - bump type implied by the commits in a range
- `scripts/generate-release-notes.sh` - release notes for a version and commit range
- `scripts/preview-release-notes.sh` - local preview of the next release

## 🚨 Troubleshooting

### A release failed halfway

Re-run the failed workflow. `scripts/release.sh` is idempotent: when the version
in `package.json` is missing from npm or has no GitHub release yet, it finishes
that release instead of computing a new one.

### Merged a fix but nothing was released

Check that the squash commit on `main` starts with `fix:`/`feat:`/`perf:` and
run `npm run preview:release` locally to see what the workflow detects.

### npm publish fails with 404 / ENEEDAUTH

The Trusted Publisher on npmjs.com must match the repository and the
`release.yml` filename exactly.
