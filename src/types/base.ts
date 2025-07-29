// Base Types for BusinessMap API

export interface BusinessMapConfig {
  apiUrl: string;
  apiToken: string;
  defaultWorkspaceId?: number;
  readOnlyMode?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total_count?: number;
    page?: number;
    per_page?: number;
  };
}

export interface ApiError {
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}
