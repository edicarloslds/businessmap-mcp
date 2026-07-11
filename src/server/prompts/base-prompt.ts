import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod/v3';
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

/**
 * Register a prompt through a non-generic signature. The SDK's registerPrompt infers
 * callback types from the args schema, which makes TS recurse into the zod generics
 * and blow up with TS2589; calling through this fixed signature avoids that.
 */
export function registerPrompt(
  server: McpServer,
  name: string,
  promptConfig: { title: string; description: string; argsSchema: z.ZodRawShape },
  callback: (args: Record<string, string>) => GetPromptResult
): void {
  const register = server.registerPrompt.bind(server) as (
    promptName: string,
    config: typeof promptConfig,
    cb: typeof callback
  ) => void;
  register(name, promptConfig, callback);
}
