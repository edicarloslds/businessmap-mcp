# MCP Client Configuration

This guide contains copy-and-paste examples for configuring the BusinessMap MCP Server in common MCP clients.

## Required Values

Every client needs:

- `BUSINESSMAP_API_TOKEN`: your BusinessMap API token
- `BUSINESSMAP_API_URL`: your BusinessMap API URL, for example `https://your-account.kanbanize.com/api/v2`

Optional but commonly useful:

- `BUSINESSMAP_READ_ONLY_MODE`: set to `true` to expose only read-only tools
- `BUSINESSMAP_DEFAULT_WORKSPACE_ID`: default workspace ID
- `LOG_LEVEL`: `0` debug, `1` info, `2` warn, `3` error, `4` none

## Claude Desktop

Config file location:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Open it through `Settings -> Developer -> Edit Config`, then add:

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

Fully quit and restart Claude Desktop after editing. JSON does not support comments, so remove any comments before saving.

## Claude Code

Add the server globally:

```bash
claude mcp add --transport stdio --scope user businessmap -- npx -y @edicarlos.lds/businessmap-mcp
```

Or add it to the current project:

```bash
claude mcp add --transport stdio businessmap -- npx -y @edicarlos.lds/businessmap-mcp
```

To pass environment variables directly:

```bash
claude mcp add --transport stdio \
  --env BUSINESSMAP_API_TOKEN=your_token_here \
  --env BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2 \
  businessmap -- npx -y @edicarlos.lds/businessmap-mcp
```

You can also commit a `.mcp.json` file to your project root:

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "${BUSINESSMAP_API_TOKEN}",
        "BUSINESSMAP_API_URL": "${BUSINESSMAP_API_URL}"
      }
    }
  }
}
```

Use environment variable expansion to avoid hardcoding secrets in source control.

## Cursor

Create or edit `~/.cursor/mcp.json` for global configuration, or `.cursor/mcp.json` at the project root for project-specific configuration:

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

You can also manage servers through `Settings -> Features -> MCP`.

## VS Code

VS Code uses `servers` as the top-level key instead of `mcpServers`.

Config file locations:

- Workspace: `.vscode/mcp.json`
- macOS user config: `~/Library/Application Support/Code/User/mcp.json`
- Windows user config: `%APPDATA%\Code\User\mcp.json`

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "businessmap-token",
      "description": "BusinessMap API Token",
      "password": true
    }
  ],
  "servers": {
    "businessmap": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "${input:businessmap-token}",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

The `inputs` block lets VS Code prompt for secrets at runtime. This requires the GitHub Copilot Chat extension. You can also add a server from the Command Palette with `MCP: Add Server`.

## Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`. You can open it from the Cascade panel's MCPs icon through `Configure`.

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

Windsurf supports `${env:VARIABLE_NAME}` syntax inside `env` values.

## Zed

Zed configures MCP servers in `~/.config/zed/settings.json` under `context_servers`.

```json
{
  "context_servers": {
    "businessmap": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false",
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1"
      }
    }
  }
}
```

You can also add servers through the Agent Panel settings with `Add Custom Server`. A green indicator in the Agent Panel confirms the server is running.

## Other MCP Clients

For any MCP-compatible client, configure a `stdio` server with:

| Setting | Value |
| --- | --- |
| Command | `npx` |
| Args | `-y @edicarlos.lds/businessmap-mcp` |
| Required env | `BUSINESSMAP_API_TOKEN`, `BUSINESSMAP_API_URL` |
| Optional env | `BUSINESSMAP_READ_ONLY_MODE`, `BUSINESSMAP_DEFAULT_WORKSPACE_ID`, `LOG_LEVEL` |

## Remote HTTP Clients

When running with `TRANSPORT=http`, configure the client to use:

```text
http://your-server:3000/mcp
```

For public or shared deployments, protect the endpoint with authentication or network controls. See [MIDDLEWARE.md](MIDDLEWARE.md) for programmatic middleware examples.
