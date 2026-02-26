import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../client/businessmap-client.js';
import { config } from '../config/environment.js';
import {
  BoardToolHandler,
  CardToolHandler,
  CustomFieldToolHandler,
  UserToolHandler,
  UtilityToolHandler,
  WorkflowToolHandler,
  WorkspaceToolHandler,
} from './tools/index.js';
import {
  BoardResourceHandler,
  CardResourceHandler,
  WorkspaceResourceHandler,
} from './resources/index.js';
import {
  BoardPromptHandler,
  CardPromptHandler,
  WorkspacePromptHandler,
} from './prompts/index.js';

export class BusinessMapMcpServer {
  private readonly mcpServer: McpServer;
  private readonly businessMapClient: BusinessMapClient;

  constructor() {
    this.mcpServer = new McpServer({
      name: config.server.name,
      version: config.server.version,
    });

    this.businessMapClient = new BusinessMapClient(config.businessMap);
    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  /**
   * Initialize the server by verifying the BusinessMap API connection
   */
  async initialize(): Promise<void> {
    try {
      await this.businessMapClient.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'; throw new Error(`Failed to initialize BusinessMap MCP Server: ${message}`);
    }
  }

  private setupTools(): void {
    const readOnlyMode = config.businessMap.readOnlyMode ?? false;

    // Initialize tool handlers
    const toolHandlers = [
      new WorkspaceToolHandler(),
      new BoardToolHandler(),
      new CardToolHandler(),
      new CustomFieldToolHandler(),
      new UserToolHandler(),
      new UtilityToolHandler(),
      new WorkflowToolHandler(),
    ];

    // Register all tools from handlers
    toolHandlers.forEach((handler) => {
      handler.registerTools(this.mcpServer, this.businessMapClient, readOnlyMode);
    });
  }

  private setupResources(): void {
    const resourceHandlers = [
      new WorkspaceResourceHandler(),
      new BoardResourceHandler(),
      new CardResourceHandler(),
    ];

    resourceHandlers.forEach((handler) => {
      handler.registerResources(this.mcpServer, this.businessMapClient);
    });
  }

  private setupPrompts(): void {
    const promptHandlers = [
      new BoardPromptHandler(),
      new CardPromptHandler(),
      new WorkspacePromptHandler(),
    ];

    promptHandlers.forEach((handler) => {
      handler.registerPrompts(this.mcpServer, this.businessMapClient);
    });
  }

  get server(): McpServer {
    return this.mcpServer;
  }
}
