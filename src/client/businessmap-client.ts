import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ApiError,
  ApiResponse,
  Board,
  BusinessMapConfig,
  Card,
  Column,
  CreateBoardParams,
  CreateCardParams,
  CreateLaneParams,
  CreateWorkspaceParams,
  CycleTimeColumn,
  EffectiveCycleTimeColumn,
  Swimlane,
  // CumulativeFlowData, // Comentado - tipo não disponível na API oficial
  UpdateCardParams,
  User,
  // WorkflowAnalytics, // Comentado - tipo não disponível na API oficial
  Workspace,
} from '../types/businessmap.js';

export class BusinessMapClient {
  private http: AxiosInstance;
  private readonly config: BusinessMapConfig;
  private isInitialized: boolean = false;

  constructor(config: BusinessMapConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.apiUrl,
      headers: {
        apikey: config.apiToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.transformError(error);
      }
    );
  }

  /**
   * Initialize the client by verifying the connection to the BusinessMap API
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Verify configuration first
      if (!this.config.apiUrl) {
        throw new Error(
          'API URL is not configured. Please set BUSINESSMAP_API_URL environment variable.'
        );
      }

      if (!this.config.apiToken) {
        throw new Error(
          'API Token is not configured. Please set BUSINESSMAP_API_TOKEN environment variable.'
        );
      }

      // Try to perform a health check first
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        throw new Error('API connection failed - please check your API URL and token');
      }

      // Try to fetch API info to verify authentication
      try {
        await this.getApiInfo();
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          throw new Error(
            'Authentication failed - please verify your API token has the correct permissions'
          );
        }
        throw new Error(
          `API verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize BusinessMap client: ${message}`);
    }
  }

  /**
   * Check if the client has been initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      const apiError = error.response.data as ApiError;
      return new Error(`BusinessMap API Error: ${apiError.error?.message || error.message}`);
    }
    return new Error(`Network Error: ${error.message}`);
  }

  // Workspace Management
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.http.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data.data;
  }

  async getWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await this.http.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`);
    return response.data.data;
  }

  async createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot create workspace in read-only mode');
    }
    const response = await this.http.post<ApiResponse<Workspace>>('/workspaces', params);
    return response.data.data;
  }

  async updateWorkspace(
    workspaceId: number,
    params: Partial<CreateWorkspaceParams>
  ): Promise<Workspace> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot update workspace in read-only mode');
    }
    const response = await this.http.patch<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}`,
      params
    );
    return response.data.data;
  }

  async deleteWorkspace(workspaceId: number): Promise<void> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot delete workspace in read-only mode');
    }
    await this.http.delete(`/workspaces/${workspaceId}`);
  }

  // Board Management
  async getBoards(workspaceId?: number): Promise<Board[]> {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const response = await this.http.get<ApiResponse<Board[]>>('/boards', { params });
    return response.data.data;
  }

  async getBoard(boardId: number): Promise<Board> {
    const response = await this.http.get<ApiResponse<Board>>(`/boards/${boardId}`);
    return response.data.data;
  }

  async createBoard(params: CreateBoardParams): Promise<Board> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot create board in read-only mode');
    }
    const response = await this.http.post<ApiResponse<Board>>('/boards', params);
    return response.data.data;
  }

  async updateBoard(boardId: number, params: Partial<CreateBoardParams>): Promise<Board> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot update board in read-only mode');
    }
    const response = await this.http.patch<ApiResponse<Board>>(`/boards/${boardId}`, params);
    return response.data.data;
  }

  async deleteBoard(boardId: number): Promise<void> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot delete board in read-only mode');
    }
    await this.http.delete(`/boards/${boardId}`);
  }

  async getBoardStructure(boardId: number) {
    const response = await this.http.get(`/boards/${boardId}/structure`);
    return response.data.data;
  }

  // Get board columns - endpoint válido na API oficial
  async getColumns(boardId: number): Promise<Column[]> {
    const response = await this.http.get<ApiResponse<Column[]>>(`/boards/${boardId}/columns`);
    return response.data.data;
  }

  // Lanes/Swimlanes Management - endpoints válidos na API oficial
  async getLanes(boardId: number): Promise<Swimlane[]> {
    const response = await this.http.get<ApiResponse<Swimlane[]>>(`/boards/${boardId}/lanes`);
    return response.data.data;
  }

  async getLane(laneId: number): Promise<Swimlane> {
    const response = await this.http.get<ApiResponse<Swimlane>>(`/lanes/${laneId}`);
    return response.data.data;
  }

  async createLane(params: CreateLaneParams): Promise<Swimlane> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot create lane in read-only mode');
    }
    const response = await this.http.post<ApiResponse<Swimlane>>('/lanes', params);
    return response.data.data;
  }

  // Card Management
  async getCards(
    boardId: number,
    filters?: { column_id?: number; swimlane_id?: number; assignee_user_id?: number }
  ): Promise<Card[]> {
    const params = { board_id: boardId, ...filters };
    const response = await this.http.get<ApiResponse<Card[]>>('/cards', { params });
    return response.data.data;
  }

  async getCard(cardId: number): Promise<Card> {
    const response = await this.http.get<ApiResponse<Card>>(`/cards/${cardId}`);
    return response.data.data;
  }

  async createCard(params: CreateCardParams): Promise<Card> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot create card in read-only mode');
    }
    const response = await this.http.post<ApiResponse<Card>>('/cards', params);
    return response.data.data;
  }

  async updateCard(params: UpdateCardParams): Promise<Card> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot update card in read-only mode');
    }
    const { card_id, ...updateData } = params;
    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${card_id}`, updateData);
    return response.data.data;
  }

  async moveCard(
    cardId: number,
    columnId: number,
    swimlaneId?: number,
    position?: number
  ): Promise<Card> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot move card in read-only mode');
    }
    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${cardId}`, {
      column_id: columnId,
      swimlane_id: swimlaneId,
      position: position,
    });
    return response.data.data;
  }

  async deleteCard(cardId: number): Promise<void> {
    if (this.config.readOnlyMode) {
      throw new Error('Cannot delete card in read-only mode');
    }
    await this.http.delete(`/cards/${cardId}`);
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const response = await this.http.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  }

  async getUser(userId: number): Promise<User> {
    const response = await this.http.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data;
  }

  // Cycle Time Analytics - endpoints válidos na API oficial
  async getWorkflowCycleTimeColumns(boardId: number): Promise<CycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<CycleTimeColumn[]>>(
      `/boards/${boardId}/analytics/cycle_time_columns`
    );
    return response.data.data;
  }

  async getWorkflowEffectiveCycleTimeColumns(boardId: number): Promise<EffectiveCycleTimeColumn[]> {
    const response = await this.http.get<ApiResponse<EffectiveCycleTimeColumn[]>>(
      `/boards/${boardId}/analytics/effective_cycle_time_columns`
    );
    return response.data.data;
  }

  // Utility Methods
  async healthCheck(): Promise<boolean> {
    try {
      // Use /workspaces endpoint as health check since /health may not exist
      await this.http.get('/workspaces');
      return true;
    } catch (error) {
      // Log the actual error for debugging
      console.error(
        'Health check failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  async getApiInfo() {
    try {
      // Tentativa de usar /info (que não existe na API oficial)
      const response = await this.http.get('/info');
      return response.data;
    } catch (error) {
      // Fallback: verificar conectividade com /workspaces
      console.warn('Endpoint /info não disponível na API oficial, testando conectividade...');
      try {
        await this.http.get('/workspaces');
        return {
          message: 'API is responding (fallback test)',
          endpoint: '/workspaces',
          status: 'healthy',
          note: 'Endpoint /info não existe na API oficial do BusinessMap',
          api_version: 'v2',
          documentation: 'https://rdsaude.kanbanize.com/openapi/#/',
        };
      } catch (fallbackError) {
        throw new Error(
          `API connection failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
        );
      }
    }
  }
}
