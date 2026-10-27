import type { AxiosError } from 'axios';
import { inspect } from 'node:util';
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
    expect(error.cause).toMatchObject({ message: 'Request failed with status code 429', status: 429 });
  });

  it('marks errors without a response as network errors', () => {
    const source = { message: 'socket timeout' } as AxiosError;

    const error = transformAxiosError(source);

    expect(error.message).toBe('Network Error: socket timeout');
    expect(error.status).toBeUndefined();
    expect(error.isNetworkError).toBe(true);
  });

  it('never exposes the API token through the error or its cause chain', () => {
    const token = 'secret-api-token';
    const source = {
      name: 'AxiosError',
      message: 'Request failed with status code 400',
      code: 'ERR_BAD_REQUEST',
      config: { method: 'post', url: '/cards', headers: { apikey: token } },
      request: { _header: `POST /api/v2/cards HTTP/1.1\r\napikey: ${token}\r\n` },
      response: {
        status: 400,
        config: { headers: { apikey: token } },
        data: { error: { message: 'Invalid card' } },
      },
    } as unknown as AxiosError;

    const error = transformAxiosError(source);
    const wrapped = new Error('Failed to initialize', { cause: error });

    expect(inspect(wrapped, { depth: null })).not.toContain(token);
    expect(JSON.stringify(error)).not.toContain(token);
    expect(error.cause).toMatchObject({
      name: 'AxiosError',
      code: 'ERR_BAD_REQUEST',
      method: 'POST',
      url: '/cards',
      status: 400,
    });
  });
});
