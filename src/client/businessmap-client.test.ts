import axios from 'axios';
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { logger } from '../utils/logger.js';
import { runWithRequestContext } from '../utils/request-context.js';
import { BusinessMapClient } from './businessmap-client.js';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

describe('BusinessMapClient HTTP observability', () => {
  const requestUse = jest.fn();
  const responseUse = jest.fn();

  beforeEach(() => {
    requestUse.mockReset();
    responseUse.mockReset();
    (axios.create as jest.Mock).mockReturnValue({
      interceptors: {
        request: { use: requestUse },
        response: { use: responseUse },
      },
    });
  });

  it('propagates correlation IDs and records request metadata', () => {
    new BusinessMapClient({
      apiUrl: 'https://example.kanbanize.com/api/v2',
      apiToken: 'secret',
    });
    const requestHandler = requestUse.mock.calls[0]?.[0] as (
      request: InternalAxiosRequestConfig
    ) => InternalAxiosRequestConfig;
    const responseHandler = responseUse.mock.calls[0]?.[0] as (
      response: AxiosResponse
    ) => AxiosResponse;
    const setHeader = jest.fn();
    const request = {
      method: 'get',
      url: '/cards',
      headers: { set: setHeader },
    } as unknown as InternalAxiosRequestConfig;
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);

    runWithRequestContext({ correlationId: 'request-123' }, () => {
      const configured = requestHandler(request);
      responseHandler({ config: configured, status: 200 } as AxiosResponse);
    });

    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'request-123');
    expect(debug).toHaveBeenCalledWith(
      'BusinessMap API request completed',
      expect.objectContaining({
        method: 'GET',
        path: '/cards',
        status: 200,
        outcome: 'success',
      })
    );
    expect(JSON.stringify(debug.mock.calls)).not.toContain('secret');
    debug.mockRestore();
  });

  it('transforms failed requests after logging metadata', () => {
    new BusinessMapClient({
      apiUrl: 'https://example.kanbanize.com/api/v2',
      apiToken: 'secret',
    });
    const failureHandler = responseUse.mock.calls[0]?.[1] as (error: AxiosError) => never;
    const debug = jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const error = {
      message: 'Too many requests',
      config: { method: 'post', url: '/cards' },
      response: { status: 429, data: { error: { code: 1, message: 'Slow down' } } },
    } as AxiosError;

    expect(() => failureHandler(error)).toThrow('BusinessMap API Error (429): Slow down');
    expect(debug).toHaveBeenCalledWith(
      'BusinessMap API request failed',
      expect.objectContaining({
        method: 'POST',
        path: '/cards',
        status: 429,
        outcome: 'error',
      })
    );
    debug.mockRestore();
  });
});
