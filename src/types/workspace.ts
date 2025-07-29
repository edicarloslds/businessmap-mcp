// Workspace Types for BusinessMap API

export interface Workspace {
  workspace_id?: number;
  type: number;
  is_archived: number;
  name: string;
}

export interface CreateWorkspaceParams {
  name: string;
  description?: string;
}
