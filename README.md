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

#### Environment Variables

- **`BUSINESSMAP_API_TOKEN`** (required): Your BusinessMap API token
- **`BUSINESSMAP_API_URL`** (required): Your BusinessMap API URL (e.g., `https://your-account.kanbanize.com/api/v2`)
- **`BUSINESSMAP_READ_ONLY_MODE`** (optional): Set to `true` to prevent write operations (default: `false`)
- **`BUSINESSMAP_DEFAULT_WORKSPACE_ID`** (optional): Default workspace ID to use when not specified in operations

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
- `mcp_businessmap_list_workspaces` - Get all workspaces
- `mcp_businessmap_get_workspace` - Get workspace details
- `mcp_businessmap_create_workspace` - Create new workspace

### Board Management
- `mcp_businessmap_list_boards` - List boards in workspace(s)
- `mcp_businessmap_search_board` - Search for boards by ID or name
- `mcp_businessmap_get_board` - Get board details with structure
- `mcp_businessmap_create_board` - Create new board (if not in read-only mode)
- `mcp_businessmap_get_columns` - Get all columns for a board
- `mcp_businessmap_get_lanes` - Get all lanes for a board
- `mcp_businessmap_get_lane` - Get details of a specific lane/swimlane
- `mcp_businessmap_create_lane` - Create new lane/swimlane (if not in read-only mode)

### Card Management
- `mcp_businessmap_list_cards` - Get cards from a board with optional filters
- `mcp_businessmap_get_card` - Get detailed card information
- `mcp_businessmap_get_card_size` - Get the size/points of a specific card
- `mcp_businessmap_get_card_comments` - Get all comments for a specific card
- `mcp_businessmap_get_card_comment` - Get details of a specific comment from a card
- `mcp_businessmap_create_card` - Create new card
- `mcp_businessmap_move_card` - Move card to different column/swimlane
- `mcp_businessmap_update_card` - Update card properties
- `mcp_businessmap_set_card_size` - Set the size/points of a specific card

### Custom Field Management
- `mcp_businessmap_get_custom_field` - Get details of a specific custom field by ID

### User Management
- `mcp_businessmap_list_users` - Get all users
- `mcp_businessmap_get_user` - Get user details
- `mcp_businessmap_get_current_user` - Get current logged user details

### System
- `mcp_businessmap_health_check` - Check API connection
- `mcp_businessmap_get_api_info` - Get API information

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

## Development

### Release Process

This project uses an automated release process. See [RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) for detailed documentation.

**Quick Start:**
```bash
# Preview release notes
npm run preview:release

# Publish new version (interactive)
npm run publish:npm
```

The release process automatically:
- Bumps version (patch/minor/major)
- Generates release notes from commits
- Creates GitHub tags and releases
- Publishes to NPM

### Contributing

1. Follow conventional commit format for better release notes:
   ```
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