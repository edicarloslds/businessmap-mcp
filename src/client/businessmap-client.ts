import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError, BusinessMapConfig } from '../types/index.js';
import {
  AnalyticsClient,
  BoardClient,
  CardClient,
  CardFilters,
  UserClient,
  UtilityClient,
  WorkspaceClient,
} from './modules/index.js';

export class BusinessMapClient {
  private http: AxiosInstance;
  private readonly config: BusinessMapConfig;
  private isInitialized: boolean = false;

  // Client modules
  private workspaceClient: WorkspaceClient;
  private boardClient: BoardClient;
  private cardClient: CardClient;
  private userClient: UserClient;
  private analyticsClient: AnalyticsClient;
  private utilityClient: UtilityClient;

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

    // Initialize client modules
    this.workspaceClient = new WorkspaceClient();
    this.boardClient = new BoardClient();
    this.cardClient = new CardClient();
    this.userClient = new UserClient();
    this.analyticsClient = new AnalyticsClient();
    this.utilityClient = new UtilityClient();

    // Initialize all modules with http client and config
    [
      this.workspaceClient,
      this.boardClient,
      this.cardClient,
      this.userClient,
      this.analyticsClient,
      this.utilityClient,
    ].forEach((module) => {
      module.initialize(this.http, this.config);
    });
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
      const isHealthy = await this.utilityClient.healthCheck();
      if (!isHealthy) {
        throw new Error('API connection failed - please check your API URL and token');
      }

      // Try to fetch API info to verify authentication
      try {
        await this.utilityClient.getApiInfo();
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

  // Workspace Management - Delegated to WorkspaceClient
  async getWorkspaces() {
    return this.workspaceClient.getWorkspaces();
  }

  async getWorkspace(workspaceId: number) {
    return this.workspaceClient.getWorkspace(workspaceId);
  }

  async createWorkspace(params: Parameters<WorkspaceClient['createWorkspace']>[0]) {
    return this.workspaceClient.createWorkspace(params);
  }

  async updateWorkspace(
    workspaceId: number,
    params: Parameters<WorkspaceClient['updateWorkspace']>[1]
  ) {
    return this.workspaceClient.updateWorkspace(workspaceId, params);
  }

  async deleteWorkspace(workspaceId: number) {
    return this.workspaceClient.deleteWorkspace(workspaceId);
  }

  // Board Management - Delegated to BoardClient
  async getBoards(workspaceId?: number) {
    return this.boardClient.getBoards(workspaceId);
  }

  async getBoard(boardId: number) {
    return this.boardClient.getBoard(boardId);
  }

  async createBoard(params: Parameters<BoardClient['createBoard']>[0]) {
    return this.boardClient.createBoard(params);
  }

  async updateBoard(boardId: number, params: Parameters<BoardClient['updateBoard']>[1]) {
    return this.boardClient.updateBoard(boardId, params);
  }

  async deleteBoard(boardId: number) {
    return this.boardClient.deleteBoard(boardId);
  }

  async getBoardStructure(boardId: number) {
    return this.boardClient.getBoardStructure(boardId);
  }

  async getColumns(boardId: number) {
    return this.boardClient.getColumns(boardId);
  }

  async getLanes(boardId: number) {
    return this.boardClient.getLanes(boardId);
  }

  async getLane(laneId: number) {
    return this.boardClient.getLane(laneId);
  }

  async createLane(params: Parameters<BoardClient['createLane']>[0]) {
    return this.boardClient.createLane(params);
  }

  // Card Management - Delegated to CardClient
  async getCards(boardId: number, filters?: CardFilters) {
    return this.cardClient.getCards(boardId, filters);
  }

  async getCard(cardId: number) {
    return this.cardClient.getCard(cardId);
  }

  async createCard(params: Parameters<CardClient['createCard']>[0]) {
    return this.cardClient.createCard(params);
  }

  async updateCard(params: Parameters<CardClient['updateCard']>[0]) {
    return this.cardClient.updateCard(params);
  }

  async moveCard(cardId: number, columnId: number, swimlaneId?: number, position?: number) {
    return this.cardClient.moveCard(cardId, columnId, swimlaneId, position);
  }

  async deleteCard(cardId: number) {
    return this.cardClient.deleteCard(cardId);
  }

  // User Management - Delegated to UserClient
  async getUsers() {
    return this.userClient.getUsers();
  }

  async getUser(userId: number) {
    return this.userClient.getUser(userId);
  }

  // Analytics - Delegated to AnalyticsClient
  async getWorkflowCycleTimeColumns(boardId: number) {
    return this.analyticsClient.getWorkflowCycleTimeColumns(boardId);
  }

  async getWorkflowEffectiveCycleTimeColumns(boardId: number) {
    return this.analyticsClient.getWorkflowEffectiveCycleTimeColumns(boardId);
  }

  // Utility Methods - Delegated to UtilityClient
  async healthCheck() {
    return this.utilityClient.healthCheck();
  }

  async getApiInfo() {
    return this.utilityClient.getApiInfo();
  }
}
