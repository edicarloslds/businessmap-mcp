import { createErrorResponse, createSuccessResponse } from './base-tool.js';

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
