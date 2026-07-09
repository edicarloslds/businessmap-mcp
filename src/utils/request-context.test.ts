import {
  getRequestContext,
  runWithRequestContext,
} from './request-context.js';

describe('request context', () => {
  it('preserves correlation data across asynchronous work', async () => {
    await runWithRequestContext(
      { correlationId: 'request-1', sessionId: 'session-1' },
      async () => {
        await Promise.resolve();
        expect(getRequestContext()).toEqual({
          correlationId: 'request-1',
          sessionId: 'session-1',
        });
      }
    );
  });

  it('does not leak context after the callback completes', () => {
    runWithRequestContext({ correlationId: 'request-2' }, () => {
      expect(getRequestContext()?.correlationId).toBe('request-2');
    });

    expect(getRequestContext()).toBeUndefined();
  });
});
