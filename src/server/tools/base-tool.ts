import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';

/**
 * Base interface for tool handlers
 */
export interface BaseToolHandler {
  /**
   * Register all tools provided by this handler
   * @param server The MCP server instance
   * @param client The BusinessMap client instance
   * @param readOnlyMode Whether the server is in read-only mode
   */
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void;
}

/**
 * Standard error handler for tool responses
 */
export function createErrorResponse(error: unknown, operation: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    ],
    isError: true,
  };
}

/**
 * Standard success handler for tool responses
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: message
          ? `${message}\n${JSON.stringify(data, null, 2)}`
          : JSON.stringify(data, null, 2),
      },
    ],
  };
}
