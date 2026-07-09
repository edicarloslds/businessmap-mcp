import type { AxiosError } from 'axios';
import { BusinessMapApiError, transformAxiosError } from './businessmap-error.js';

describe('transformAxiosError', () => {
  it('preserves API status, code, and details', () => {
    const source = {
      message: 'Request failed with status code 429',
      response: {
        status: 429,
        data: {
          error: {
            code: 1001,
            message: 'Rate limit exceeded',
            details: { retry_after: 30 },
          },
        },
      },
    } as AxiosError;

    const error = transformAxiosError(source);

    expect(error).toBeInstanceOf(BusinessMapApiError);
    expect(error.message).toBe('BusinessMap API Error (429): Rate limit exceeded');
    expect(error.status).toBe(429);
    expect(error.code).toBe(1001);
    expect(error.details).toEqual({ retry_after: 30 });
    expect(error.isNetworkError).toBe(false);
    expect(error.cause).toBe(source);
  });

  it('marks errors without a response as network errors', () => {
    const source = { message: 'socket timeout' } as AxiosError;

    const error = transformAxiosError(source);

    expect(error.message).toBe('Network Error: socket timeout');
    expect(error.status).toBeUndefined();
    expect(error.isNetworkError).toBe(true);
  });
});
