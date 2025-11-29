import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';

/**
 * Base interface for resource handlers
 */
export interface BaseResourceHandler {
    /**
     * Register all resources provided by this handler
     * @param server The MCP server instance
     * @param client The BusinessMap client instance
     */
    registerResources(server: McpServer, client: BusinessMapClient): void;
}

/**
 * Standard error handler for resource responses
 */
export function createErrorResourceResponse(error: unknown) {
    // Resources typically return content, but if there's an error reading,
    // we might want to return an error message in the content or throw.
    // For MCP resources, throwing an error is often the right way to signal failure to read.
    throw error instanceof Error ? error : new Error(String(error));
}
