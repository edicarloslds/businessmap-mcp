import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../client/businessmap-client.js';
import { config } from '../config/environment.js';

export class BusinessMapMcpServer {
  private mcpServer: McpServer;
  private businessMapClient: BusinessMapClient;

  constructor() {
    this.mcpServer = new McpServer({
      name: config.server.name,
      version: config.server.version,
    });

    this.businessMapClient = new BusinessMapClient(config.businessMap);
    this.setupTools();
    this.setupResources();
  }

  private setupTools(): void {
    this.setupWorkspaceTools();
    this.setupBoardTools();
    this.setupCardTools();
    this.setupUserTools();
    this.setupAnalyticsTools();
    this.setupUtilityTools();
  }

  private setupWorkspaceTools(): void {
    // List workspaces
    this.mcpServer.registerTool(
      'list_workspaces',
      {
        title: 'List Workspaces',
        description: 'Get a list of all workspaces',
        inputSchema: {},
      },
      async () => {
        try {
          const workspaces = await this.businessMapClient.getWorkspaces();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(workspaces, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Get workspace details
    this.mcpServer.registerTool(
      'get_workspace',
      {
        title: 'Get Workspace',
        description: 'Get details of a specific workspace',
        inputSchema: {
          workspace_id: z.number().describe('The ID of the workspace'),
        },
      },
      async ({ workspace_id }) => {
        try {
          const workspace = await this.businessMapClient.getWorkspace(workspace_id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(workspace, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    if (!config.businessMap.readOnlyMode) {
      // Create workspace
      this.mcpServer.registerTool(
        'create_workspace',
        {
          title: 'Create Workspace',
          description: 'Create a new workspace',
          inputSchema: {
            name: z.string().describe('The name of the workspace'),
            description: z.string().optional().describe('Optional description for the workspace'),
          },
        },
        async ({ name, description }) => {
          try {
            const workspace = await this.businessMapClient.createWorkspace({ name, description });
            return {
              content: [{
                type: 'text',
                text: `Workspace created successfully:\n${JSON.stringify(workspace, null, 2)}`,
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error creating workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
      );
    }
  }

  private setupBoardTools(): void {
    // List boards
    this.mcpServer.registerTool(
      'list_boards',
      {
        title: 'List Boards',
        description: 'Get a list of boards, optionally filtered by workspace',
        inputSchema: {
          workspace_id: z.number().optional().describe('Optional workspace ID to filter boards'),
        },
      },
      async ({ workspace_id }) => {
        try {
          const boards = await this.businessMapClient.getBoards(workspace_id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(boards, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching boards: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Get board details
    this.mcpServer.registerTool(
      'get_board',
      {
        title: 'Get Board',
        description: 'Get details of a specific board including its structure',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const [board, structure] = await Promise.all([
            this.businessMapClient.getBoard(board_id),
            this.businessMapClient.getBoardStructure(board_id),
          ]);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ ...board, structure }, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching board: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    if (!config.businessMap.readOnlyMode) {
      // Create board
      this.mcpServer.registerTool(
        'create_board',
        {
          title: 'Create Board',
          description: 'Create a new board in a workspace',
          inputSchema: {
            name: z.string().describe('The name of the board'),
            workspace_id: z.number().describe('The ID of the workspace'),
            description: z.string().optional().describe('Optional description for the board'),
          },
        },
        async ({ name, workspace_id, description }) => {
          try {
            const board = await this.businessMapClient.createBoard({ name, workspace_id, description });
            return {
              content: [{
                type: 'text',
                text: `Board created successfully:\n${JSON.stringify(board, null, 2)}`,
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error creating board: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
      );
    }
  }

  private setupCardTools(): void {
    // List cards
    this.mcpServer.registerTool(
      'list_cards',
      {
        title: 'List Cards',
        description: 'Get a list of cards from a board with optional filters',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          column_id: z.number().optional().describe('Optional column ID to filter cards'),
          swimlane_id: z.number().optional().describe('Optional swimlane ID to filter cards'),
          assignee_user_id: z.number().optional().describe('Optional assignee user ID to filter cards'),
        },
      },
      async ({ board_id, column_id, swimlane_id, assignee_user_id }) => {
        try {
          const filters = { column_id, swimlane_id, assignee_user_id };
          const cards = await this.businessMapClient.getCards(board_id, filters);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(cards, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Get card details
    this.mcpServer.registerTool(
      'get_card',
      {
        title: 'Get Card',
        description: 'Get details of a specific card',
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
      },
      async ({ card_id }) => {
        try {
          const card = await this.businessMapClient.getCard(card_id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(card, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching card: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    if (!config.businessMap.readOnlyMode) {
      // Create card
      this.mcpServer.registerTool(
        'create_card',
        {
          title: 'Create Card',
          description: 'Create a new card in a board',
          inputSchema: {
            title: z.string().describe('The title of the card'),
            board_id: z.number().describe('The ID of the board'),
            column_id: z.number().describe('The ID of the column'),
            description: z.string().optional().describe('Optional description for the card'),
            swimlane_id: z.number().optional().describe('Optional swimlane ID'),
            type_id: z.number().optional().describe('Optional card type ID'),
            size: z.number().optional().describe('Optional card size/points'),
            priority: z.string().optional().describe('Priority level (Low, Average, High, Critical)'),
            owner_user_id: z.number().optional().describe('Optional owner user ID'),
            assignee_user_id: z.number().optional().describe('Optional assignee user ID'),
            deadline: z.string().optional().describe('Optional deadline (ISO date string)'),
          },
        },
        async (params) => {
          try {
            const card = await this.businessMapClient.createCard(params);
            return {
              content: [{
                type: 'text',
                text: `Card created successfully:\n${JSON.stringify(card, null, 2)}`,
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error creating card: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
      );

      // Move card
      this.mcpServer.registerTool(
        'move_card',
        {
          title: 'Move Card',
          description: 'Move a card to a different column or swimlane',
          inputSchema: {
            card_id: z.number().describe('The ID of the card to move'),
            column_id: z.number().describe('The target column ID'),
            swimlane_id: z.number().optional().describe('Optional target swimlane ID'),
            position: z.number().optional().describe('Optional position in the column'),
          },
        },
        async ({ card_id, column_id, swimlane_id, position }) => {
          try {
            const card = await this.businessMapClient.moveCard(card_id, column_id, swimlane_id, position);
            return {
              content: [{
                type: 'text',
                text: `Card moved successfully:\n${JSON.stringify(card, null, 2)}`,
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error moving card: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
      );

      // Update card
      this.mcpServer.registerTool(
        'update_card',
        {
          title: 'Update Card',
          description: 'Update a card\'s properties',
          inputSchema: {
            card_id: z.number().describe('The ID of the card to update'),
            title: z.string().optional().describe('New title for the card'),
            description: z.string().optional().describe('New description for the card'),
            priority: z.string().optional().describe('New priority level'),
            assignee_user_id: z.number().optional().describe('New assignee user ID'),
            deadline: z.string().optional().describe('New deadline (ISO date string)'),
            size: z.number().optional().describe('New card size/points'),
          },
        },
        async (params) => {
          try {
            const card = await this.businessMapClient.updateCard(params);
            return {
              content: [{
                type: 'text',
                text: `Card updated successfully:\n${JSON.stringify(card, null, 2)}`,
              }],
            };
          } catch (error) {
            return {
              content: [{
                type: 'text',
                text: `Error updating card: ${error instanceof Error ? error.message : 'Unknown error'}`,
              }],
              isError: true,
            };
          }
        }
      );
    }
  }

  private setupUserTools(): void {
    // List users
    this.mcpServer.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'Get a list of all users',
        inputSchema: {},
      },
      async () => {
        try {
          const users = await this.businessMapClient.getUsers();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(users, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Get user details
    this.mcpServer.registerTool(
      'get_user',
      {
        title: 'Get User',
        description: 'Get details of a specific user',
        inputSchema: {
          user_id: z.number().describe('The ID of the user'),
        },
      },
      async ({ user_id }) => {
        try {
          const user = await this.businessMapClient.getUser(user_id);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(user, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );
  }

  private setupAnalyticsTools(): void {
    // Workflow analytics
    this.mcpServer.registerTool(
      'get_workflow_analytics',
      {
        title: 'Get Workflow Analytics',
        description: 'Get workflow analytics for a board within a time period',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          period_start: z.string().describe('Start date (ISO date string)'),
          period_end: z.string().describe('End date (ISO date string)'),
        },
      },
      async ({ board_id, period_start, period_end }) => {
        try {
          const analytics = await this.businessMapClient.getWorkflowAnalytics(board_id, period_start, period_end);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(analytics, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching workflow analytics: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Cumulative flow diagram
    this.mcpServer.registerTool(
      'get_cumulative_flow_data',
      {
        title: 'Get Cumulative Flow Data',
        description: 'Get cumulative flow diagram data for a board',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          period_start: z.string().describe('Start date (ISO date string)'),
          period_end: z.string().describe('End date (ISO date string)'),
        },
      },
      async ({ board_id, period_start, period_end }) => {
        try {
          const flowData = await this.businessMapClient.getCumulativeFlowData(board_id, period_start, period_end);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(flowData, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching cumulative flow data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Cycle time report
    this.mcpServer.registerTool(
      'get_cycle_time_report',
      {
        title: 'Get Cycle Time Report',
        description: 'Get cycle time report for a board',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          period_start: z.string().describe('Start date (ISO date string)'),
          period_end: z.string().describe('End date (ISO date string)'),
        },
      },
      async ({ board_id, period_start, period_end }) => {
        try {
          const report = await this.businessMapClient.getCycleTimeReport(board_id, period_start, period_end);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(report, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching cycle time report: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // Throughput report
    this.mcpServer.registerTool(
      'get_throughput_report',
      {
        title: 'Get Throughput Report',
        description: 'Get throughput report for a board',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          period_start: z.string().describe('Start date (ISO date string)'),
          period_end: z.string().describe('End date (ISO date string)'),
        },
      },
      async ({ board_id, period_start, period_end }) => {
        try {
          const report = await this.businessMapClient.getThroughputReport(board_id, period_start, period_end);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(report, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching throughput report: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );
  }

  private setupUtilityTools(): void {
    // Health check
    this.mcpServer.registerTool(
      'health_check',
      {
        title: 'Health Check',
        description: 'Check the connection to BusinessMap API',
        inputSchema: {},
      },
      async () => {
        try {
          const isHealthy = await this.businessMapClient.healthCheck();
          return {
            content: [{
              type: 'text',
              text: `BusinessMap API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`,
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );

    // API info
    this.mcpServer.registerTool(
      'get_api_info',
      {
        title: 'Get API Info',
        description: 'Get information about the BusinessMap API',
        inputSchema: {},
      },
      async () => {
        try {
          const apiInfo = await this.businessMapClient.getApiInfo();
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(apiInfo, null, 2),
            }],
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error fetching API info: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }],
            isError: true,
          };
        }
      }
    );
  }

  private setupResources(): void {
    // TODO: Implement resource endpoints for reading workspace/board/card data
    // This would allow LLMs to access current state without performing actions
  }

  get server(): McpServer {
    return this.mcpServer;
  }
} 