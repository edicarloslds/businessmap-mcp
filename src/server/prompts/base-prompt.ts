import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';

/**
 * Base interface for prompt handlers
 */
export interface BasePromptHandler {
  /**
   * Register all prompts provided by this handler
   * @param server The MCP server instance
   * @param client The BusinessMap client instance
   */
  registerPrompts(server: McpServer, client: BusinessMapClient): void;
}
