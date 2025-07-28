# BusinessMap MCP Server

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

### Claude Desktop Configuration

Add the following configuration to your Claude Desktop `claude_desktop_config.json` file:

#### Using NPX:

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "npx",
      "args": ["-y", "@edicarlos.lds/businessmap-mcp"],
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false"
      }
    }
  }
}
```

#### Using Global Installation:

```json
{
  "mcpServers": {
    "Businessmap": {
      "command": "businessmap-mcp",
      "env": {
        "BUSINESSMAP_API_TOKEN": "your_token_here",
        "BUSINESSMAP_API_URL": "https://your-account.kanbanize.com/api/v2",
        "BUSINESSMAP_READ_ONLY_MODE": "false"
      }
    }
  }
}
```

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

3. Create a `.env` file with your BusinessMap credentials:
   ```env
   BUSINESSMAP_API_TOKEN=your_token_here
   BUSINESSMAP_API_URL=https://your-account.kanbanize.com/api/v2
   BUSINESSMAP_READ_ONLY_MODE=false
   ```

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
- `mcp_businessmap_list_boards` - Get all boards (optionally filtered by workspace)
- `mcp_businessmap_get_board` - Get board details and structure
- `mcp_businessmap_create_board` - Create new board

### Card Management
- `mcp_businessmap_list_cards` - Get cards from a board with optional filters
- `mcp_businessmap_get_card` - Get detailed card information
- `mcp_businessmap_create_card` - Create new card
- `mcp_businessmap_move_card` - Move card to different column/swimlane
- `mcp_businessmap_update_card` - Update card properties

### User Management
- `mcp_businessmap_list_users` - Get all users
- `mcp_businessmap_get_user` - Get user details

### Analytics & Reports
- `mcp_businessmap_get_workflow_analytics` - Get workflow analytics for a board
- `mcp_businessmap_get_cumulative_flow_data` - Get cumulative flow diagram data
- `mcp_businessmap_get_cycle_time_report` - Get cycle time report
- `mcp_businessmap_get_throughput_report` - Get throughput report

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

## Publishing

To publish a new version to npm:

```bash
npm install -g @edicarlos.lds/businessmap-mcp
businessmap-mcp
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