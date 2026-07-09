import type { AxiosError } from 'axios';
import type { ApiError } from '../types/index.js';

function isApiError(value: unknown): value is ApiError {
  if (value === null || typeof value !== 'object' || !('error' in value)) {
    return false;
  }

  const error = value.error;
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export class BusinessMapApiError extends Error {
  readonly status?: number;
  readonly code?: number;
  readonly details?: unknown;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: number;
      details?: unknown;
      isNetworkError?: boolean;
      cause?: unknown;
    } = {}
  ) {
    super(message, { cause: options.cause });
    this.name = 'BusinessMapApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export function transformAxiosError(error: AxiosError): BusinessMapApiError {
  if (!error.response) {
    return new BusinessMapApiError(`Network Error: ${error.message}`, {
      isNetworkError: true,
      cause: error,
    });
  }

  const status = error.response.status;
  const data = error.response.data;
  const apiError = isApiError(data) ? data.error : undefined;
  const message = apiError?.message ?? error.message;

  return new BusinessMapApiError(`BusinessMap API Error (${status}): ${message}`, {
    status,
    code: apiError?.code,
    details: apiError?.details,
    cause: error,
  });
}
