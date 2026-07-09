/**
 * Workflow cycle time column information
 */
export interface WorkflowCycleTimeColumn {
  column_id: number;
  name: string;
}

/**
 * Workflow information
 */
export interface BoardWorkflow {
  workflow_id: number;
  type: number;
  position: number;
  is_enabled: number;
  is_collapsible: number;
  name: string;
}

export interface CreateWorkflowParams {
  type: number;
  name?: string;
  position?: number;
  is_enabled?: number;
  is_collapsible?: number;
}

export interface UpdateWorkflowParams {
  name?: string;
  position?: number;
  is_enabled?: number;
  is_collapsible?: number;
}