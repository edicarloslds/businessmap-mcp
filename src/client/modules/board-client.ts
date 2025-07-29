import {
  ApiResponse,
  Board,
  Column,
  CreateBoardParams,
  CreateLaneParams,
  Swimlane,
} from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class BoardClient extends BaseClientModuleImpl {
  /**
   * Get all boards, optionally filtered by workspace
   */
  async getBoards(workspaceId?: number): Promise<Board[]> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.http.get<ApiResponse<Board[]>>('/boards', { params });
    return response.data.data;
  }

  /**
   * Get a specific board by ID
   */
  async getBoard(boardId: number): Promise<Board> {
    const response = await this.http.get<ApiResponse<Board>>(`/boards/${boardId}`);
    return response.data.data;
  }

  /**
   * Create a new board
   */
  async createBoard(params: CreateBoardParams): Promise<Board> {
    this.checkReadOnlyMode('create board');
    const response = await this.http.post<ApiResponse<Board>>('/boards', params);
    return response.data.data;
  }

  /**
   * Update an existing board
   */
  async updateBoard(boardId: number, params: Partial<CreateBoardParams>): Promise<Board> {
    this.checkReadOnlyMode('update board');
    const response = await this.http.patch<ApiResponse<Board>>(`/boards/${boardId}`, params);
    return response.data.data;
  }

  /**
   * Delete a board
   */
  async deleteBoard(boardId: number): Promise<void> {
    this.checkReadOnlyMode('delete board');
    await this.http.delete(`/boards/${boardId}`);
  }

  /**
   * Get board structure
   */
  async getBoardStructure(boardId: number) {
    const response = await this.http.get(`/boards/${boardId}/structure`);
    return response.data.data;
  }

  /**
   * Get all columns for a board
   */
  async getColumns(boardId: number): Promise<Column[]> {
    const response = await this.http.get<ApiResponse<Column[]>>(`/boards/${boardId}/columns`);
    return response.data.data;
  }

  /**
   * Get all lanes/swimlanes for a board
   */
  async getLanes(boardId: number): Promise<Swimlane[]> {
    const response = await this.http.get<ApiResponse<Swimlane[]>>(`/boards/${boardId}/lanes`);
    return response.data.data;
  }

  /**
   * Get a specific lane by ID
   */
  async getLane(laneId: number): Promise<Swimlane> {
    const response = await this.http.get<ApiResponse<Swimlane>>(`/lanes/${laneId}`);
    return response.data.data;
  }

  /**
   * Create a new lane/swimlane
   */
  async createLane(params: CreateLaneParams): Promise<Swimlane> {
    this.checkReadOnlyMode('create lane');
    const response = await this.http.post<ApiResponse<Swimlane>>('/lanes', params);
    return response.data.data;
  }
}
