import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { logger } from '../../utils/logger.js';
import {
  WRITE_IDEMPOTENT,
  createErrorResponse,
  createSuccessResponse,
  registerTool,
} from './base-tool.js';

describe('createErrorResponse', () => {
  it('formats an Error instance correctly', () => {
    const error = new Error('Something went wrong');
    const result = createErrorResponse(error, 'fetching data');

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toBe('Error fetching data: Something went wrong');
  });

  it('handles unknown/non-Error values gracefully', () => {
    const result = createErrorResponse('just a string', 'testing');

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe('Error testing: Unknown error');
  });

  it('handles null error gracefully', () => {
    const result = createErrorResponse(null, 'nullish case');

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe('Error nullish case: Unknown error');
  });
});

describe('createSuccessResponse', () => {
  it('serializes data as JSON text', () => {
    const data = { id: 1, name: 'Test Board' };
    const result = createSuccessResponse(data);

    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
    expect(result.content[0]?.text).toBe(JSON.stringify(data, null, 2));
  });

  it('prepends optional message when provided', () => {
    const data = { id: 42 };
    const result = createSuccessResponse(data, 'Created successfully:');

    expect(result.content[0]?.text).toBe(`Created successfully:\n${JSON.stringify(data, null, 2)}`);
  });

  it('handles arrays correctly', () => {
    const data = [1, 2, 3];
    const result = createSuccessResponse(data);

    expect(result.content[0]?.text).toBe(JSON.stringify(data, null, 2));
  });

  it('does not include isError field', () => {
    const result = createSuccessResponse({});
    expect((result as Record<string, unknown>)['isError']).toBeUndefined();
  });
});

describe('registerTool mutation audit', () => {
  it('logs numeric identifiers without free-form values', async () => {
    const register = jest.fn();
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    registerTool({ registerTool: register } as unknown as McpServer, {
      name: 'test_mutation',
      title: 'Test Mutation',
      description: 'Test',
      schema: z.object({ card_id: z.number(), text: z.string() }),
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'testing mutation',
      handler: async () => ({ ok: true }),
    });
    const callback = register.mock.calls[0]?.[2] as (args: {
      card_id: number;
      text: string;
    }) => Promise<unknown>;

    await callback({ card_id: 123, text: 'sensitive comment text' });

    expect(info).toHaveBeenCalledWith(
      'MCP mutation tool completed',
      expect.objectContaining({
        tool: 'test_mutation',
        outcome: 'success',
        identifiers: { card_id: 123 },
      })
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain('sensitive comment text');
    info.mockRestore();
  });
});
