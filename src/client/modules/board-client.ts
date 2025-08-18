import {
  ApiResponse,
  Board,
  Column,
  CreateBoardParams,
  CreateLaneParams,
  CurrentBoardStructure,
  CurrentBoardStructureResponse,
  Lane,
} from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export interface BoardFilters {
  // ID filters (arrays)
  board_ids?: number[];
  workspace_ids?: number[];

  // Expansion options
  expand?: ('workflows' | 'settings' | 'structure')[];

  // Field selection
  fields?: ('board_id' | 'workspace_id' | 'is_archived' | 'name' | 'description' | 'revision')[];

  // Assignment filter
  if_assigned?: number; // 0 or 1

  // Archive status
  is_archived?: number; // 0 or 1

  // Legacy compatibility
  workspace_id?: number;
}

export class BoardClient extends BaseClientModuleImpl {
  /**
   * Get all boards with optional filters
   */
  async getBoards(filters?: BoardFilters): Promise<Board[]> {
    const params = filters || {};
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
  async getLanes(boardId: number): Promise<Lane[]> {
    const response = await this.http.get<ApiResponse<Lane[]>>(`/boards/${boardId}/lanes`);
    return response.data.data;
  }

  /**
   * Get a specific lane by ID
   */
  async getLane(laneId: number): Promise<Lane> {
    const response = await this.http.get<ApiResponse<Lane>>(`/lanes/${laneId}`);
    return response.data.data;
  }

  /**
   * Create a new lane/swimlane
   */
  async createLane(params: CreateLaneParams): Promise<Lane> {
    this.checkReadOnlyMode('create lane');
    const response = await this.http.post<ApiResponse<Lane>>('/lanes', params);
    return response.data.data;
  }

  /**
   * Get current board structure with detailed configuration
   */
  async getCurrentBoardStructure(boardId: number): Promise<CurrentBoardStructure> {
    const response = await this.http.get<CurrentBoardStructureResponse>(
      `/boards/${boardId}/currentStructure`
    );
    return response.data.data;
  }
}
