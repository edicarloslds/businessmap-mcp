# BusinessMap MCP Server

A Model Context Protocol (MCP) server that enables AI models to interact with [BusinessMap](https://businessmap.io) (formerly Kanbanize) through a standardized interface. This integration allows AI assistants to read, create, and manage workspaces, boards, cards, and analytics data from your BusinessMap instance.

## Features

### 🏢 Workspace Management
- List all workspaces
- Get workspace details
- Create new workspaces
- Update workspace information
- Delete workspaces

### 📋 Board Management
- List boards (all or filtered by workspace)
- Get board details and structure
- Create new boards
- Update board properties
- Delete boards
- Get board structure (columns, swimlanes)

### 📝 Card Management
- List cards with filtering options
- Get detailed card information
- Create new cards with all properties
- Update card properties
- Move cards between columns/swimlanes
- Delete cards

### 👥 User Management
- List all users
- Get user details
- User-based filtering for cards

### 📊 Analytics & Reporting
- Workflow analytics (throughput, cycle time, lead time, flow efficiency)
- Cumulative flow diagrams
- Cycle time reports
- Throughput reports
- Custom time period analysis

### 🔧 Utility Functions
- Health check for API connectivity
- API information retrieval
- Read-only mode support

## Installation

### Prerequisites
- Node.js 18.0.0 or higher
- BusinessMap account with API access
- Valid BusinessMap API token

### Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd businessmap-mcp
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your BusinessMap configuration:
```env
BUSINESSMAP_API_URL=https://your-instance.kanbanize.com/api/v2
BUSINESSMAP_API_TOKEN=your_api_token_here
BUSINESSMAP_DEFAULT_WORKSPACE_ID=1
BUSINESSMAP_READ_ONLY_MODE=false
```

4. **Build the project:**
```bash
npm run build
```

## Usage

### Direct Execution
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### With MCP Client

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "businessmap": {
      "command": "node",
      "args": ["/path/to/businessmap-mcp/dist/index.js"]
    }
  }
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BUSINESSMAP_API_URL` | ✅ | - | Your BusinessMap API base URL |
| `BUSINESSMAP_API_TOKEN` | ✅ | - | API token for authentication |
| `BUSINESSMAP_DEFAULT_WORKSPACE_ID` | ❌ | - | Default workspace ID for operations |
| `BUSINESSMAP_READ_ONLY_MODE` | ❌ | `false` | Restrict to read-only operations |
| `MCP_SERVER_NAME` | ❌ | `businessmap-mcp` | Server name identifier |
| `MCP_SERVER_VERSION` | ❌ | `1.0.0` | Server version |
| `SSE` | ❌ | `false` | Enable Server-Sent Events transport |
| `STREAMABLE_HTTP` | ❌ | `true` | Enable Streamable HTTP transport |
| `PORT` | ❌ | - | HTTP server port (for HTTP transport) |

## API Authentication

### Getting Your API Token

1. Log into your BusinessMap account
2. Go to **My Account** → **API** tab
3. Generate or copy your API token
4. Use the token in your environment configuration

### API URL Format

The API URL should follow this format:
```
https://your-instance.kanbanize.com/api/v2
```

Replace `your-instance` with your actual BusinessMap subdomain.

## Available Tools

### Workspace Tools
- `list_workspaces` - Get all workspaces
- `get_workspace` - Get workspace details
- `create_workspace` - Create new workspace (if not read-only)

### Board Tools
- `list_boards` - Get boards (optionally filtered by workspace)
- `get_board` - Get board details with structure
- `create_board` - Create new board (if not read-only)

### Card Tools
- `list_cards` - Get cards with filtering options
- `get_card` - Get detailed card information
- `create_card` - Create new card (if not read-only)
- `move_card` - Move card to different column/swimlane (if not read-only)
- `update_card` - Update card properties (if not read-only)

### User Tools
- `list_users` - Get all users
- `get_user` - Get user details

### Analytics Tools
- `get_workflow_analytics` - Get workflow metrics for a time period
- `get_cumulative_flow_data` - Get cumulative flow diagram data
- `get_cycle_time_report` - Get cycle time analysis
- `get_throughput_report` - Get throughput analysis

### Utility Tools
- `health_check` - Check API connectivity
- `get_api_info` - Get API information

## Usage Examples

### Creating a New Card
```typescript
// Using the create_card tool
{
  "title": "Implement user authentication",
  "description": "Add OAuth2 authentication to the application",
  "board_id": 123,
  "column_id": 456,
  "priority": "High",
  "assignee_user_id": 789,
  "deadline": "2024-12-31T23:59:59Z"
}
```

### Getting Workflow Analytics
```typescript
// Using the get_workflow_analytics tool
{
  "board_id": 123,
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z"
}
```

### Moving a Card
```typescript
// Using the move_card tool
{
  "card_id": 789,
  "column_id": 456,
  "swimlane_id": 123,
  "position": 1
}
```

## Read-Only Mode

When `BUSINESSMAP_READ_ONLY_MODE=true`, the server will:
- Disable all creation, update, and deletion tools
- Only expose read-only tools (list, get operations)
- Provide safe access for AI assistants that should not modify data

This is useful for:
- Demo environments
- AI assistants that only need to read data
- Enhanced security scenarios

## Error Handling

The server provides comprehensive error handling:

- **Authentication errors**: Invalid or expired API tokens
- **Network errors**: Connection issues with BusinessMap API
- **Validation errors**: Invalid parameters or missing required fields
- **Permission errors**: Insufficient permissions for operations
- **Read-only violations**: Attempts to modify data in read-only mode

## Development

### Project Structure
```
src/
├── types/           # TypeScript type definitions
├── config/          # Environment configuration
├── client/          # BusinessMap API client
├── server/          # MCP server implementation
└── index.ts         # Main entry point
```

### Scripts
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with hot reload
- `npm run watch` - Run with file watching
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run linting and tests: `npm run lint && npm test`
5. Commit changes: `git commit -am 'Add my feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Submit a pull request

## Docker Support

### Building Docker Image
```bash
docker build -t businessmap-mcp .
```

### Running with Docker
```bash
docker run -e BUSINESSMAP_API_URL=https://your-instance.kanbanize.com/api/v2 \
           -e BUSINESSMAP_API_TOKEN=your_token \
           businessmap-mcp
```

### Docker Compose
```yaml
version: '3.8'
services:
  businessmap-mcp:
    build: .
    environment:
      - BUSINESSMAP_API_URL=https://your-instance.kanbanize.com/api/v2
      - BUSINESSMAP_API_TOKEN=your_token
      - BUSINESSMAP_READ_ONLY_MODE=false
    stdin_open: true
    tty: true
```

## Troubleshooting

### Common Issues

**Connection Failed**
- Verify your API URL is correct and accessible
- Check your API token is valid and not expired
- Ensure your network allows HTTPS connections to BusinessMap

**Authentication Errors**
- Verify your API token in BusinessMap account settings
- Check token permissions and scope
- Ensure the token hasn't been revoked

**Tools Not Available**
- Check if read-only mode is enabled
- Verify your BusinessMap account has necessary permissions
- Ensure the workspace/board exists and is accessible

### Debug Mode

Enable verbose logging by setting:
```bash
DEBUG=businessmap-mcp npm start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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