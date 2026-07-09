# BusinessMap MCP Server

[![npm version](https://img.shields.io/npm/v/@edicarlos.lds/businessmap-mcp.svg)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![GitHub release](https://img.shields.io/github/v/release/edicarloslds/businessmap-mcp)](https://github.com/edicarloslds/businessmap-mcp/releases)
[![npm downloads](https://img.shields.io/npm/dm/@edicarlos.lds/businessmap-mcp)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-000000?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/edicarloslds)](https://github.com/sponsors/edicarloslds)

Model Context Protocol (MCP) server for BusinessMap/Kanbanize. It gives AI clients access to BusinessMap workspaces, boards, cards, users, custom fields, workflow cycle-time data, resources, and guided prompts.

## What You Get

- 92 MCP tools for workspaces, boards, cards, docs, users, custom fields, workflow management, batch board setup, and health checks
- 5 MCP resources for direct workspace, board, and card reads
- 4 guided prompts for board analysis, reporting, card creation, and workspace summaries
- Optional read-only mode for safer exploration
- `stdio` transport for local MCP clients and HTTP transport for remote usage
- Docker, structured logging, and programmatic middleware support

See the full catalog in [docs/TOOLS.md](docs/TOOLS.md).

## Quick Start

Run directly with `npx`:

```bash
npx -y @edicarlos.lds/businessmap-mcp
```

Or install globally:

```bash
npm install -g @edicarlos.lds/businessmap-mcp
businessmap-mcp
```

The server requires Node.js 18 or newer.

## Required Configuration

Set these environment variables in your MCP client, shell, deployment platform, or local `.env` file:

```env
BUSINESSMAP_API_TOKEN=your_token_here
BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
```

Optional settings:

| Variable | Default | Description |
| --- | --- | --- |
| `BUSINESSMAP_READ_ONLY_MODE` | `false` | Use `true` to register only read-only tools. |
| `BUSINESSMAP_DEFAULT_WORKSPACE_ID` | unset | Default workspace ID for tools that can use one. |
| `LOG_LEVEL` | `1` | `0` debug, `1` info, `2` warn, `3` error, `4` none. |
| `TRANSPORT` | `stdio` | Use `stdio` or `http`. |
| `PORT` | `3000` | HTTP server port. |
| `ALLOWED_ORIGINS` | `http://localhost` | CORS allowlist for HTTP mode. |
| `ALLOWED_HOSTS` | unset | Host header allowlist for HTTP mode. |

## MCP Client Setup

Most MCP clients need the same command and environment variables:

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2"
      }
    }
  }
}
```

Client-specific examples for Claude Desktop, Claude Code, Cursor, VS Code, Windsurf, Zed, and other MCP clients are in [docs/MCP_CLIENTS.md](docs/MCP_CLIENTS.md).

## HTTP Mode

Use HTTP mode when deploying the server remotely or when your client supports Streamable HTTP:

```bash
TRANSPORT=http \
PORT=3000 \
ALLOWED_ORIGINS=https://your-client.example.com \
ALLOWED_HOSTS=your-server.example.com \
npm start
```

Configure your MCP client with:

```text
http://your-server:3000/mcp
```

For custom authentication, authorization, logging, or rate limiting, see [docs/MIDDLEWARE.md](docs/MIDDLEWARE.md).

## Local Development

```bash
git clone https://github.com/edicarloslds/businessmap-mcp.git
cd businessmap-mcp
npm install
```

Create a local `.env` file:

```env
BUSINESSMAP_API_TOKEN=your_token_here
BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
BUSINESSMAP_READ_ONLY_MODE=false
BUSINESSMAP_DEFAULT_WORKSPACE_ID=1
```

Useful commands:

```bash
npm run dev          # Run from TypeScript source
npm run watch        # Run and reload on changes
npm run build        # Build dist/
npm test             # Run tests
npm run lint         # Run ESLint
npm run test:npx     # Test package execution through npx
```

## Docker

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
npm run docker:down
```

## Troubleshooting

If startup fails, check the two required environment variables first:

```bash
echo $BUSINESSMAP_API_URL
echo $BUSINESSMAP_API_TOKEN
```

Then test the BusinessMap connection:

```bash
chmod +x scripts/test-connection.sh
./scripts/test-connection.sh
```

Common causes:

- `BUSINESSMAP_API_URL` is not in the expected format: `https://your-account.kanbanize.com/api/v2`
- `BUSINESSMAP_API_TOKEN` is missing, expired, or lacks the needed permissions
- The selected MCP client has not been fully restarted after editing its config

Logging details are documented in [docs/LOGGING.md](docs/LOGGING.md).

## Project Docs

- [Tools, resources, and prompts](docs/TOOLS.md)
- [MCP client configuration](docs/MCP_CLIENTS.md)
- [Logging](docs/LOGGING.md)
- [Programmatic middleware](docs/MIDDLEWARE.md)
- [Release process](docs/RELEASE_PROCESS.md)
- [Scripts](scripts/README.md)

## Contributing

Use conventional commits when possible:

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: improve code structure
```

Before opening a pull request:

```bash
npm test
npm run test:npx
```

## Support

For issues and questions:

1. Check existing [GitHub issues](../../issues)
2. Review the [BusinessMap API documentation](https://businessmap.io/api)
3. Verify your environment configuration
4. Open a new issue with the error message, runtime command, and relevant MCP client configuration

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [BusinessMap API Documentation](https://businessmap.io/api)
- [BusinessMap Demo API](https://demo.kanbanize.com/openapi#/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## Sponsors

If this project helps you, consider supporting it through [GitHub Sponsors](https://github.com/sponsors/edicarloslds).

## License

MIT
