import { ApiResponse, CycleTimeColumn, EffectiveCycleTimeColumn } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class AnalyticsClient extends BaseClientModuleImpl {
  /**
   * Get cycle time configuration columns for a board
   */
  async getWorkflowCycleTimeColumns(boardId: number): Promise<CycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<CycleTimeColumn[]>>(
      `/boards/${boardId}/analytics/cycle_time_columns`
    );
    return response.data.data;
  }

  /**
   * Get effective cycle time configuration columns for a board
   */
  async getWorkflowEffectiveCycleTimeColumns(boardId: number): Promise<EffectiveCycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<EffectiveCycleTimeColumn[]>>(
      `/boards/${boardId}/analytics/effective_cycle_time_columns`
    );
    return response.data.data;
  }
}
