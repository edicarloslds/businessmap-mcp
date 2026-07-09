import axios, { AxiosError, AxiosInstance } from 'axios';
import { BoardFilters } from './modules/board-client.js';
import {
  BoardClient,
  CardClient,
  CardFilters,
  CustomFieldClient,
  DocClient,
  UserClient,
  UtilityClient,
  WorkflowClient,
  WorkspaceClient,
} from './modules/index.js';
import { BusinessMapConfig, CreateCommentParams, CreateTagParams, UpdateCommentParams } from '../types/index.js';

export class BusinessMapClient {
  private readonly http: AxiosInstance;
  private readonly config: BusinessMapConfig;
  private isInitialized: boolean = false;

  // Client modules
  private readonly workspaceClient: WorkspaceClient;
  private readonly boardClient: BoardClient;
  private readonly cardClient: CardClient;
  private readonly userClient: UserClient;
  private readonly customFieldClient: CustomFieldClient;
  private readonly docClient: DocClient;
  private readonly utilityClient: UtilityClient;
  private readonly workflowClient: WorkflowClient;

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
    this.customFieldClient = new CustomFieldClient();
    this.docClient = new DocClient();
    this.utilityClient = new UtilityClient();
    this.workflowClient = new WorkflowClient();

    // Initialize all modules with http client and config
    [
      this.workspaceClient,
      this.boardClient,
      this.cardClient,
      this.userClient,
      this.customFieldClient,
      this.docClient,
      this.utilityClient,
      this.workflowClient,
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
      const data = error.response.data;
      const apiMessage =
        data !== null &&
        typeof data === 'object' &&
        'error' in data &&
        data.error !== null &&
        typeof data.error === 'object' &&
        'message' in data.error &&
        typeof data.error.message === 'string'
          ? data.error.message
          : null;
      return new Error(`BusinessMap API Error: ${apiMessage ?? error.message}`);
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
  async getBoards(filters?: BoardFilters) {
    return this.boardClient.getBoards(filters);
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

  async getLane(boardId: number, laneId: number) {
    return this.boardClient.getLane(boardId, laneId);
  }

  async createLane(boardId: number, params: Parameters<BoardClient['createLane']>[1]) {
    return this.boardClient.createLane(boardId, params);
  }

  async updateLane(boardId: number, laneId: number, params: Parameters<BoardClient['updateLane']>[2]) {
    return this.boardClient.updateLane(boardId, laneId, params);
  }

  async getCurrentBoardStructure(boardId: number) {
    return this.boardClient.getCurrentBoardStructure(boardId);
  }

  async createColumn(boardId: number, params: Parameters<BoardClient['createColumn']>[1]) {
    return this.boardClient.createColumn(boardId, params);
  }

  async updateColumn(boardId: number, columnId: number, params: Parameters<BoardClient['updateColumn']>[2]) {
    return this.boardClient.updateColumn(boardId, columnId, params);
  }

  async deleteColumn(boardId: number, columnId: number) {
    return this.boardClient.deleteColumn(boardId, columnId);
  }

  // Card Management - Delegated to CardClient
  async getCards(boardId: number, filters?: CardFilters) {
    return this.cardClient.getCards(boardId, filters);
  }

  async searchCards(filters?: Parameters<CardClient['searchCards']>[0]) {
    return this.cardClient.searchCards(filters);
  }

  async getCardTransitions(cardId: number) {
    return this.cardClient.getCardTransitions(cardId);
  }

  async getCardBlockTimes(cardId: number) {
    return this.cardClient.getCardBlockTimes(cardId);
  }

  async getCardLoggedTimes(cardId: number, includeSubtasks?: boolean) {
    return this.cardClient.getCardLoggedTimes(cardId, includeSubtasks);
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

  async moveCard(cardId: number, columnId: number, laneId?: number, position?: number) {
    return this.cardClient.moveCard(cardId, columnId, laneId, position);
  }

  async deleteCard(cardId: number) {
    return this.cardClient.deleteCard(cardId);
  }

  async getCardComments(cardId: number) {
    return this.cardClient.getCardComments(cardId);
  }

  async getCardComment(cardId: number, commentId: number) {
    return this.cardClient.getCardComment(cardId, commentId);
  }

  async getCardCustomFields(cardId: number) {
    return this.cardClient.getCardCustomFields(cardId);
  }

  async getCardTypes() {
    return this.cardClient.getCardTypes();
  }

  async getCardHistory(cardId: number, outcomeId: number) {
    return this.cardClient.getCardHistory(cardId, outcomeId);
  }

  async getCardOutcomes(cardId: number) {
    return this.cardClient.getCardOutcomes(cardId);
  }

  async getCardLinkedCards(cardId: number) {
    return this.cardClient.getCardLinkedCards(cardId);
  }

  async getCardSubtasks(cardId: number) {
    return this.cardClient.getCardSubtasks(cardId);
  }

  async getCardSubtask(cardId: number, subtaskId: number) {
    return this.cardClient.getCardSubtask(cardId, subtaskId);
  }

  async createCardSubtask(cardId: number, params: Parameters<CardClient['createCardSubtask']>[1]) {
    return this.cardClient.createCardSubtask(cardId, params);
  }

  async updateCardSubtask(
    cardId: number,
    subtaskId: number,
    params: Parameters<CardClient['updateCardSubtask']>[2]
  ) {
    return this.cardClient.updateCardSubtask(cardId, subtaskId, params);
  }

  async deleteCardSubtask(cardId: number, subtaskId: number) {
    return this.cardClient.deleteCardSubtask(cardId, subtaskId);
  }

  async getCardParents(cardId: number) {
    return this.cardClient.getCardParents(cardId);
  }

  async getCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.getCardParent(cardId, parentCardId);
  }

  async addCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.addCardParent(cardId, parentCardId);
  }

  async removeCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.removeCardParent(cardId, parentCardId);
  }

  async getCardParentGraph(cardId: number) {
    return this.cardClient.getCardParentGraph(cardId);
  }

  async getCardChildren(cardId: number) {
    return this.cardClient.getCardChildren(cardId);
  }

  async getCardChildGraph(cardId: number) {
    return this.cardClient.getCardChildGraph(cardId);
  }

  async getCardRevisions(cardId: number) {
    return this.cardClient.getCardRevisions(cardId);
  }

  async getCardRevision(cardId: number, revision: number) {
    return this.cardClient.getCardRevision(cardId, revision);
  }

  // Block / Unblock - Delegated to CardClient
  async blockCard(cardId: number, reason: string) {
    return this.cardClient.blockCard(cardId, reason);
  }

  async unblockCard(cardId: number) {
    return this.cardClient.unblockCard(cardId);
  }

  // Comments - Delegated to CardClient
  async createCardComment(cardId: number, params: CreateCommentParams) {
    return this.cardClient.createCardComment(cardId, params);
  }

  async updateCardComment(cardId: number, commentId: number, params: UpdateCommentParams) {
    return this.cardClient.updateCardComment(cardId, commentId, params);
  }

  async deleteCardComment(cardId: number, commentId: number) {
    return this.cardClient.deleteCardComment(cardId, commentId);
  }

  // Tags - Delegated to CardClient
  async createTag(params: CreateTagParams) {
    return this.cardClient.createTag(params);
  }

  async addTagToCard(cardId: number, tagId: number) {
    return this.cardClient.addTagToCard(cardId, tagId);
  }

  async removeTagFromCard(cardId: number, tagId: number) {
    return this.cardClient.removeTagFromCard(cardId, tagId);
  }

  // Stickers - Delegated to CardClient
  async addStickerToCard(cardId: number, stickerId: number) {
    return this.cardClient.addStickerToCard(cardId, stickerId);
  }

  async removeStickerFromCard(cardId: number, stickerCardId: number) {
    return this.cardClient.removeStickerFromCard(cardId, stickerCardId);
  }

  async addPredecessor(cardId: number, predecessorCardId: number, params?: Parameters<CardClient['addPredecessor']>[2]) {
    return this.cardClient.addPredecessor(cardId, predecessorCardId, params);
  }

  async removePredecessor(cardId: number, predecessorCardId: number) {
    return this.cardClient.removePredecessor(cardId, predecessorCardId);
  }

  // User Management - Delegated to UserClient
  async getUsers() {
    return this.userClient.getUsers();
  }

  async getUser(userId: number) {
    return this.userClient.getUser(userId);
  }

  async getCurrentUser() {
    return this.userClient.getCurrentUser();
  }

  async inviteUser(params: Parameters<UserClient['inviteUser']>[0]) {
    return this.userClient.inviteUser(params);
  }

  // Custom Fields - Delegated to CustomFieldClient
  async getCustomField(customFieldId: number) {
    return this.customFieldClient.getCustomField(customFieldId);
  }

  // Workflow Management - Delegated to WorkflowClient
  async getWorkflowCycleTimeColumns(boardId: number, workflowId: number) {
    return this.workflowClient.getWorkflowCycleTimeColumns(boardId, workflowId);
  }

  async getWorkflowEffectiveCycleTimeColumns(boardId: number, workflowId: number) {
    return this.workflowClient.getWorkflowEffectiveCycleTimeColumns(boardId, workflowId);
  }

  async getWorkflows(boardId: number) {
    return this.workflowClient.getWorkflows(boardId);
  }

  async getWorkflow(boardId: number, workflowId: number) {
    return this.workflowClient.getWorkflow(boardId, workflowId);
  }

  async createWorkflow(boardId: number, params: Parameters<WorkflowClient['createWorkflow']>[1]) {
    return this.workflowClient.createWorkflow(boardId, params);
  }

  async updateWorkflow(
    boardId: number,
    workflowId: number,
    params: Parameters<WorkflowClient['updateWorkflow']>[2]
  ) {
    return this.workflowClient.updateWorkflow(boardId, workflowId, params);
  }

  async linkRelatedWorkflow(boardId: number, workflowId: number, position?: number) {
    return this.workflowClient.linkRelatedWorkflow(boardId, workflowId, position);
  }

  async unlinkRelatedWorkflow(boardId: number, workflowId: number) {
    return this.workflowClient.unlinkRelatedWorkflow(boardId, workflowId);
  }

  // Docs - Delegated to DocClient
  async getDocs(filters?: Parameters<DocClient['getDocs']>[0]) {
    return this.docClient.getDocs(filters);
  }

  async getDoc(docId: number) {
    return this.docClient.getDoc(docId);
  }

  async createDoc(params: Parameters<DocClient['createDoc']>[0]) {
    return this.docClient.createDoc(params);
  }

  async updateDoc(docId: number, params: Parameters<DocClient['updateDoc']>[1]) {
    return this.docClient.updateDoc(docId, params);
  }

  async getBoardDocs(boardId: number) {
    return this.docClient.getBoardDocs(boardId);
  }

  async getPersonalDocs(filters?: Parameters<DocClient['getPersonalDocs']>[0]) {
    return this.docClient.getPersonalDocs(filters);
  }

  async getPersonalDoc(docId: number) {
    return this.docClient.getPersonalDoc(docId);
  }

  async createPersonalDoc(params: Parameters<DocClient['createPersonalDoc']>[0]) {
    return this.docClient.createPersonalDoc(params);
  }

  async updatePersonalDoc(docId: number, params: Parameters<DocClient['updatePersonalDoc']>[1]) {
    return this.docClient.updatePersonalDoc(docId, params);
  }

  // Utility Methods - Delegated to UtilityClient
  async healthCheck() {
    return this.utilityClient.healthCheck();
  }

  async getApiInfo() {
    return this.utilityClient.getApiInfo();
  }
}
