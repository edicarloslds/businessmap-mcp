# BusinessMap MCP Server

[![npm version](https://img.shields.io/npm/v/@edicarlos.lds/businessmap-mcp.svg)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![GitHub release](https://img.shields.io/github/v/release/edicarloslds/businessmap-mcp)](https://github.com/edicarloslds/businessmap-mcp/releases)
[![npm downloads](https://img.shields.io/npm/dm/@edicarlos.lds/businessmap-mcp)](https://www.npmjs.com/package/@edicarlos.lds/businessmap-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-000000?logo=anthropic&logoColor=white)](https://modelcontextprotocol.io/)

Model Context Protocol server for BusinessMap (Kanbanize) integration.

## Installation

### Via NPX (Recommended)

You can run the BusinessMap MCP server directly using npx without installing it globally:

```bash
npx @edicarlos.lds/businessmap-mcp
```

### Global Installation

```bash
npm install -g @edicarlos.lds/businessmap-mcp
```

## Configuration

### Environment Variables

The server requires the following environment variables:

- `BUSINESSMAP_API_TOKEN`: Your BusinessMap API token
- `BUSINESSMAP_API_URL`: Your BusinessMap API URL (e.g., `https://your-account.kanbanize.com/api/v2`)
- `BUSINESSMAP_READ_ONLY_MODE`: Set to `"true"` for read-only mode, `"false"` to allow modifications (optional, defaults to `"false"`)
- `BUSINESSMAP_DEFAULT_WORKSPACE_ID`: Set the BusinessMap workspace ID (optional)

#### Claude Desktop

Add the following configuration to your `claude_desktop_config.json` file:

**Using NPX:**

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false", // optional
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1" // optional
      }
    }
  }
}
```

**Using Global Installation:**

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "businessmap-mcp",
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false", // optional
        "BUSINESSMAP_DEFAULT_WORKSPACE_ID": "1" // optional
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, use the appropriate configuration format for your client, ensuring you specify:

- Command: `npx @edicarlos.lds/businessmap-mcp` (or `businessmap-mcp` if globally installed)
- Environment variables: `BUSINESSMAP_API_TOKEN`, `BUSINESSMAP_API_URL`, and optionally `BUSINESSMAP_READ_ONLY_MODE`, `BUSINESSMAP_DEFAULT_WORKSPACE_ID`

### Manual Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/edicarloslds/businessmap-mcp.git
   cd businessmap-mcp
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with your BusinessMap credentials (for development/testing):

   ```env
   BUSINESSMAP_API_TOKEN=your_token_here
   BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
   BUSINESSMAP_READ_ONLY_MODE=false
   BUSINESSMAP_DEFAULT_WORKSPACE_ID=1
   ```

   > **Note**: When using as an MCP server with Claude Desktop, you don't need a `.env` file. Configure the environment variables directly in your MCP client configuration instead.

4. Build the project:

   ```bash
   npm run build
   ```

5. Start the server:

   ```bash
   npm start
   ```

## Usage

The BusinessMap MCP server provides the following tools:

### Workspace Management

- `list_workspaces` - Get all workspaces
- `get_workspace` - Get workspace details
- `create_workspace` - Create new workspace

### Board Management

- `list_boards` - List boards in workspace(s)
- `search_board` - Search for boards by ID or name
- `get_board` - Get board details with structure
- `create_board` - Create new board (if not in read-only mode)
- `get_columns` - Get all columns for a board
- `get_lanes` - Get all lanes for a board
- `get_lane` - Get details of a specific lane/swimlane
- `create_lane` - Create new lane/swimlane (if not in read-only mode)

### Card Management

- `list_cards` - Get cards from a board with optional filters
- `get_card` - Get detailed card information
- `get_card_size` - Get the size/points of a specific card
- `get_card_comments` - Get all comments for a specific card
- `get_card_comment` - Get details of a specific comment from a card
- `create_card` - Create new card
- `move_card` - Move card to different column/swimlane
- `update_card` - Update card properties
- `set_card_size` - Set the size/points of a specific card

### Custom Field Management

- `get_custom_field` - Get details of a specific custom field by ID

### Workflow & Cycle Time Analysis

- `get_workflow_cycle_time_columns` - Get workflow's cycle time columns
- `get_workflow_effective_cycle_time_columns` - Get workflow's effective cycle time columns

### User Management

- `list_users` - Get all users
- `get_user` - Get user details
- `get_current_user` - Get current logged user details

### System

- `health_check` - Check API connection
- `get_api_info` - Get API information

## Development

### Setup Development Environment

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Watch for changes
npm run watch

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Docker Support

```bash
# Build Docker image
npm run docker:build

# Run with Docker Compose
npm run docker:up

# View logs
npm run docker:logs

# Stop containers
npm run docker:down
```

## Troubleshooting

### Connection Issues

The server now includes automatic connection verification during startup. If you encounter connection issues:

1. **Check your environment variables**:

   ```bash
   echo $BUSINESSMAP_API_URL
   echo $BUSINESSMAP_API_TOKEN
   ```

2. **Test the connection manually**:

   ```bash
   chmod +x scripts/test-connection.sh
   ./scripts/test-connection.sh
   ```

3. **Common issues**:
   - **Invalid API URL**: Ensure your URL follows the format `https://your-account.kanbanize.com/api/v2`
   - **Invalid API Token**: Verify your token has the necessary permissions

### Startup Process

The server now performs the following steps during initialization:

1. **Configuration validation** - Checks all required environment variables
2. **API connection verification** - Tests connectivity with up to 3 retry attempts
3. **Authentication check** - Verifies API token permissions
4. **Server startup** - Starts the MCP server only after successful connection

If the connection fails, the server will display detailed error messages and retry automatically.

### Release Process

This project uses an automated release process. See [RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) for detailed documentation.

**Quick Start:**

```bash
# Preview release notes
npm run preview:release

# Publish new version (interactive)
npm run publish
```

The release process automatically:

- Bumps version (patch/minor/major)
- Generates release notes from commits
- Creates GitHub tags and releases
- Publishes to NPM

### Contributing

1. Follow conventional commit format for better release notes:

   ```bash
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   refactor: improve code structure
   ```

2. Ensure all tests pass before submitting PR:

   ```bash
   npm test
   npm run test:npx
   ```

## License

MIT

## Support

For issues and questions:

1. Check the [Issues](../../issues) page
2. Review BusinessMap API documentation
3. Verify your environment configuration
4. Submit a new issue with detailed information

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [BusinessMap API Documentation](https://businessmap.io/api) - Official API reference
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official MCP SDK
