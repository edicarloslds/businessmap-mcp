// Board and Column Types for BusinessMap API

export interface Board {
  board_id?: number;
  workspace_id: number;
  is_archived: number;
  name: string;
  description: string;
  revision: number;
}

export interface Column {
  column_id?: number;
  workflow_id: number;
  section: number;
  parent_column_id: number;
  position: number;
  name: string;
  description: string;
  color: string;
  limit: number;
  cards_per_row: number;
  flow_type: number;
}

export interface CreateBoardParams {
  workspace_id?: number;
  name: string;
  description?: string;
}
