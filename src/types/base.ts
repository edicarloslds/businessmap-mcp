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

// Common interfaces used across multiple domains
export interface CustomField {
  name: string;
  color: string;
  type: string;
  is_immutable: number;
  is_always_present: number;
  all_properties_are_locked: number;
  availability: number;
  is_enabled: number;
  display_width: number;
  prefix: string;
  suffix: string;
  uniqueness_of_values: number;
  value_is_required: number;
  default_value: string;
}

export interface Tag {
  tag_id: number;
  icon_type: number;
  icon_id: number;
  label: string;
  color: string;
  availability: number;
  is_enabled: number;
}
