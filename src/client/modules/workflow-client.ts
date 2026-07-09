import {
  ApiResponse,
  BoardWorkflow,
  CreateWorkflowParams,
  UpdateWorkflowParams,
  WorkflowCycleTimeColumn,
} from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class WorkflowClient extends BaseClientModuleImpl {
  /**
   * Get workflow's cycle time columns
   */
  async getWorkflowCycleTimeColumns(
    boardId: number,
    workflowId: number
  ): Promise<WorkflowCycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<WorkflowCycleTimeColumn[]>>(
      `/boards/${boardId}/workflows/${workflowId}/cycleTimeColumns`
    );
    return response.data.data;
  }

  /**
   * Get workflow's effective cycle time columns
   */
  async getWorkflowEffectiveCycleTimeColumns(
    boardId: number,
    workflowId: number
  ): Promise<WorkflowCycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<WorkflowCycleTimeColumn[]>>(
      `/boards/${boardId}/workflows/${workflowId}/effectiveCycleTimeColumns`
    );
    return response.data.data;
  }

  /**
   * Get all workflows for a board
   */
  async getWorkflows(boardId: number): Promise<BoardWorkflow[]> {
    const response = await this.http.get<ApiResponse<BoardWorkflow[]>>(
      `/boards/${boardId}/workflows`
    );
    return response.data.data;
  }

  /**
   * Get the details of a specific workflow
   */
  async getWorkflow(boardId: number, workflowId: number): Promise<BoardWorkflow> {
    const response = await this.http.get<ApiResponse<BoardWorkflow>>(
      `/boards/${boardId}/workflows/${workflowId}`
    );
    return response.data.data;
  }

  /**
   * Create a new workflow on a board
   */
  async createWorkflow(boardId: number, params: CreateWorkflowParams): Promise<BoardWorkflow> {
    this.checkReadOnlyMode('create workflow');
    const response = await this.http.post<ApiResponse<BoardWorkflow>>(
      `/boards/${boardId}/workflows`,
      params
    );
    return response.data.data;
  }

  /**
   * Update an existing workflow on a board
   */
  async updateWorkflow(
    boardId: number,
    workflowId: number,
    params: UpdateWorkflowParams
  ): Promise<BoardWorkflow> {
    this.checkReadOnlyMode('update workflow');
    const response = await this.http.patch<ApiResponse<BoardWorkflow>>(
      `/boards/${boardId}/workflows/${workflowId}`,
      params
    );
    return response.data.data;
  }

  /**
   * Link a workflow from another board to a target board as a related workflow
   */
  async linkRelatedWorkflow(
    boardId: number,
    workflowId: number,
    position?: number
  ): Promise<void> {
    this.checkReadOnlyMode('link related workflow');
    await this.http.put(
      `/boards/${boardId}/relatedWorkflows/${workflowId}`,
      position !== undefined ? { position } : {}
    );
  }

  /**
   * Remove a related workflow from a board
   */
  async unlinkRelatedWorkflow(boardId: number, workflowId: number): Promise<void> {
    this.checkReadOnlyMode('unlink related workflow');
    await this.http.delete(`/boards/${boardId}/relatedWorkflows/${workflowId}`);
  }
}
