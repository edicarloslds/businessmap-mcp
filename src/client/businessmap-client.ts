import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  BoardClient,
  CardClient,
  CustomFieldClient,
  DocClient,
  UserClient,
  UtilityClient,
  WorkflowClient,
  WorkspaceClient,
} from './modules/index.js';
import { BusinessMapConfig } from '../types/index.js';

/**
 * BusinessMap API client, organized in domain modules.
 * Access the API through the public module properties, e.g.:
 *   client.cards.getCard(id)
 *   client.boards.getColumns(boardId)
 *   client.docs.getDocs()
 */
export class BusinessMapClient {
  private readonly http: AxiosInstance;
  private readonly config: BusinessMapConfig;
  private isInitialized: boolean = false;

  // Domain modules
  readonly workspaces = new WorkspaceClient();
  readonly boards = new BoardClient();
  readonly cards = new CardClient();
  readonly users = new UserClient();
  readonly customFields = new CustomFieldClient();
  readonly docs = new DocClient();
  readonly utility = new UtilityClient();
  readonly workflows = new WorkflowClient();

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

    [
      this.workspaces,
      this.boards,
      this.cards,
      this.users,
      this.customFields,
      this.docs,
      this.utility,
      this.workflows,
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
      const isHealthy = await this.utility.healthCheck();
      if (!isHealthy) {
        throw new Error('API connection failed - please check your API URL and token');
      }

      // Try to fetch API info to verify authentication
      try {
        await this.utility.getApiInfo();
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
}
