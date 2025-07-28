// BusinessMap API Types

export interface BusinessMapConfig {
  apiUrl: string;
  apiToken: string;
  defaultWorkspaceId?: number;
  readOnlyMode?: boolean;
}

export interface Workspace {
  workspace_id: number;
  name: string;
  description?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Board {
  board_id: number;
  name: string;
  description?: string;
  workspace_id: number;
  structure?: BoardStructure;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardStructure {
  columns: Column[];
  swimlanes: Swimlane[];
}

export interface Column {
  column_id: number;
  position: number;
  name: string;
  description?: string;
  limit?: number;
  type: 'requested' | 'in_progress' | 'done';
}

export interface Swimlane {
  swimlane_id: number;
  position: number;
  name: string;
  description?: string;
  color?: string;
}

export interface Card {
  card_id: number;
  title: string;
  description?: string;
  type_id: number;
  size?: number;
  priority?: 'Low' | 'Average' | 'High' | 'Critical';
  color?: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  board_id: number;
  column_id: number;
  swimlane_id?: number;
  position: number;
  owner_user_id?: number;
  assignee_user_id?: number;
  custom_fields?: CustomField[];
  tags?: Tag[];
}

export interface CustomField {
  field_id: number;
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox';
}

export interface Tag {
  tag_id: number;
  name: string;
  color?: string;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  realname: string;
  avatar?: string;
  is_enabled: boolean;
  created_at: string;
}

export interface WorkflowAnalytics {
  board_id: number;
  period_start: string;
  period_end: string;
  throughput: number;
  cycle_time_avg: number;
  lead_time_avg: number;
  flow_efficiency: number;
  wip_count: number;
}

export interface CumulativeFlowData {
  date: string;
  column_data: {
    column_id: number;
    column_name: string;
    card_count: number;
  }[];
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

// Tool Parameters
export interface CreateCardParams {
  title: string;
  description?: string;
  board_id: number;
  column_id: number;
  swimlane_id?: number;
  type_id?: number;
  size?: number;
  priority?: string;
  owner_user_id?: number;
  assignee_user_id?: number;
  deadline?: string;
  custom_fields?: { field_id: number; value: string | number | boolean }[];
  tags?: number[];
}

export interface UpdateCardParams {
  card_id: number;
  title?: string;
  description?: string;
  column_id?: number;
  swimlane_id?: number;
  size?: number;
  priority?: string;
  owner_user_id?: number;
  assignee_user_id?: number;
  deadline?: string;
  position?: number;
}

export interface CreateWorkspaceParams {
  name: string;
  description?: string;
}

export interface CreateBoardParams {
  name: string;
  description?: string;
  workspace_id: number;
} 