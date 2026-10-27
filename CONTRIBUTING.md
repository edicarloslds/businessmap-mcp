# Contributing

Thank you for helping improve BusinessMap MCP.

## Local setup

Requirements:

- Node.js 22 or newer
- npm

Install dependencies:

```bash
npm ci
```

Most development checks do not need BusinessMap credentials:

```bash
npm run lint
npm test -- --runInBand
npm run build
npm run knip
```

Run `npm run test:coverage` when changing core client, transport, or tool
registration behavior. The coverage thresholds are intentionally incremental
and must not regress.

The API-backed smoke tests are optional for contributors and require
`BUSINESSMAP_API_URL` and `BUSINESSMAP_API_TOKEN`:

```bash
npm run test:npx
```

Never commit `.env` files or API tokens.

## Project structure

- `src/client/`: BusinessMap HTTP client and domain modules
- `src/schemas/`: Zod input schemas for MCP tools
- `src/server/tools/`: MCP tool registration and handlers
- `src/server/resources/`: MCP resources
- `src/server/prompts/`: guided MCP prompts
- `src/config/`: runtime configuration
- `docs/`: user and maintainer documentation

## Pull requests

Keep changes focused and include tests for behavior changes. Before opening a
pull request, run the local checks listed above. CI runs the same checks on
Node.js 22.

Use conventional commits in pull request titles. Pull requests are squash
merged and releases are published automatically from `main` based on these
prefixes (see [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md)):

```text
feat: add a new capability                       (minor release)
fix: correct existing behavior                   (patch release)
feat!: change that breaks compatibility          (major release)
docs: improve documentation                      (no release)
refactor: restructure without changing behavior  (no release)
test: add or improve tests                       (no release)
```

Changes to tool names, input schemas, response shapes, or default behavior must
remain backward compatible unless the pull request explicitly targets a major
release.

## Reporting security issues

Do not open a public issue for a suspected vulnerability. Follow the private
reporting process in [SECURITY.md](SECURITY.md).
