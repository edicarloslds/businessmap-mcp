import { ApiResponse, CreateWorkspaceParams, Workspace } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class WorkspaceClient extends BaseClientModuleImpl {
  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.http.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data.data;
  }

  /**
   * Get a specific workspace by ID
   */
  async getWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await this.http.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`);
    return response.data.data;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    this.checkReadOnlyMode('create workspace');
    const response = await this.http.post<ApiResponse<Workspace>>('/workspaces', params);
    return response.data.data;
  }

  /**
   * Update an existing workspace
   */
  async updateWorkspace(
    workspaceId: number,
    params: Partial<CreateWorkspaceParams>
  ): Promise<Workspace> {
    this.checkReadOnlyMode('update workspace');
    const response = await this.http.patch<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}`,
      params
    );
    return response.data.data;
  }

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: number): Promise<void> {
    this.checkReadOnlyMode('delete workspace');
    await this.http.delete(`/workspaces/${workspaceId}`);
  }
}
