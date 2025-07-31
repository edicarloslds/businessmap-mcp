import { ApiResponse, WorkflowCycleTimeColumn } from '../../types/index.js';
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
}