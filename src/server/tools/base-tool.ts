import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
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
export function createSuccessResponse(data: unknown, message?: string) {
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

export type ToolResponse = ReturnType<typeof createSuccessResponse> & { isError?: boolean };

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
}

/** Annotations for read-only tools */
export const READ_ONLY: ToolAnnotations = { readOnlyHint: true, idempotentHint: true };
/** Annotations for non-destructive write tools (create) */
export const WRITE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
};
/** Annotations for idempotent write tools (update/toggle) */
export const WRITE_IDEMPOTENT: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
};
/** Annotations for destructive operations that are safe to repeat */
export const DESTRUCTIVE_IDEMPOTENT: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
};
/** Annotations for destructive operations that may not be safe to repeat */
export const DESTRUCTIVE: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
};

export interface ToolDefinition<Shape extends z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  schema: z.ZodObject<Shape>;
  annotations?: ToolAnnotations;
  /** Used in the standard error response: `Error <errorContext>: <message>` */
  errorContext: string;
  /** Optional message prepended to the JSON payload; may be derived from the result */
  successMessage?: string | ((data: unknown) => string);
  /** Returns the data to serialize, or a full ToolResponse (returned as-is) */
  handler: (args: z.objectOutputType<Shape, z.ZodTypeAny>) => Promise<unknown>;
}

function isToolResponse(value: unknown): value is ToolResponse {
  return (
    value !== null &&
    typeof value === 'object' &&
    'content' in value &&
    Array.isArray((value as ToolResponse).content)
  );
}

/**
 * Register a tool with standard try/catch error handling and JSON success formatting.
 * The handler either returns plain data (serialized via createSuccessResponse) or a
 * complete ToolResponse for tools that need custom response shaping.
 */
export function registerTool<Shape extends z.ZodRawShape>(
  server: McpServer,
  def: ToolDefinition<Shape>
): void {
  const callback = async (args: z.objectOutputType<Shape, z.ZodTypeAny>) => {
    try {
      const result = await def.handler(args);
      if (isToolResponse(result)) {
        return result;
      }
      const message =
        typeof def.successMessage === 'function' ? def.successMessage(result) : def.successMessage;
      return createSuccessResponse(result, message);
    } catch (error) {
      return createErrorResponse(error, def.errorContext);
    }
  };
  server.registerTool(
    def.name,
    {
      title: def.title,
      description: def.description,
      inputSchema: def.schema.shape,
      ...(def.annotations && { annotations: def.annotations }),
    },
    // The SDK infers its own callback arg/return types from the raw shape; our callback is
    // structurally compatible (validated args in, ToolResponse out), so bridge the generics here.
    callback as unknown as Parameters<McpServer['registerTool']>[2]
  );
}
