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

  /**
   * Initialize the server by verifying the BusinessMap API connection
   */
  async initialize(): Promise<void> {
    try {
      await this.businessMapClient.initialize();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize BusinessMap MCP Server: ${message}`);
    }
  }

  private setupTools(): void {
    this.setupWorkspaceTools();
    this.setupBoardTools();
    this.setupCardTools();
    this.setupUserTools();
    this.setupCycleTimeTools(); // Adicionado para cycle time válidos
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(workspaces, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching workspaces: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(workspace, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
              content: [
                {
                  type: 'text',
                  text: `Workspace created successfully:\n${JSON.stringify(workspace, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error creating workspace: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(boards, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching boards: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Search board by ID or name
    this.mcpServer.registerTool(
      'search_board',
      {
        title: 'Search Board',
        description:
          'Search for a board by ID or name, with intelligent fallback to list all boards if direct search fails',
        inputSchema: {
          board_id: z.number().optional().describe('The ID of the board to search for'),
          board_name: z.string().optional().describe('The name of the board to search for'),
          workspace_id: z
            .number()
            .optional()
            .describe('Optional workspace ID to limit search scope'),
        },
      },
      async ({ board_id, board_name, workspace_id }) => {
        try {
          // If board_id is provided, try direct lookup first
          if (board_id) {
            try {
              const [board, structure] = await Promise.all([
                this.businessMapClient.getBoard(board_id),
                this.businessMapClient.getBoardStructure(board_id),
              ]);
              return {
                content: [
                  {
                    type: 'text',
                    text: `Board found directly:\n${JSON.stringify({ ...board, structure }, null, 2)}`,
                  },
                ],
              };
            } catch (directError) {
              // If direct lookup fails, fallback to list and search
              const boards = await this.businessMapClient.getBoards(workspace_id);
              const foundBoard = boards.find((b) => b.board_id === board_id);

              if (foundBoard) {
                try {
                  const structure = await this.businessMapClient.getBoardStructure(board_id);
                  return {
                    content: [
                      {
                        type: 'text',
                        text: `Board found via list search:\n${JSON.stringify({ ...foundBoard, structure }, null, 2)}`,
                      },
                    ],
                  };
                } catch (structureError) {
                  return {
                    content: [
                      {
                        type: 'text',
                        text: `Board found but structure unavailable:\n${JSON.stringify(foundBoard, null, 2)}\nStructure error: ${structureError instanceof Error ? structureError.message : 'Unknown error'}`,
                      },
                    ],
                  };
                }
              } else {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Board with ID ${board_id} not found. Available boards:\n${JSON.stringify(
                        boards.map((b) => ({
                          board_id: b.board_id,
                          name: b.name,
                          workspace_id: b.workspace_id,
                        })),
                        null,
                        2
                      )}`,
                    },
                  ],
                  isError: true,
                };
              }
            }
          }

          // If board_name is provided, search by name
          if (board_name) {
            const boards = await this.businessMapClient.getBoards(workspace_id);
            const foundBoards = boards.filter((b) =>
              b.name.toLowerCase().includes(board_name.toLowerCase())
            );

            if (foundBoards.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No boards found matching name "${board_name}". Available boards:\n${JSON.stringify(
                      boards.map((b) => ({
                        board_id: b.board_id,
                        name: b.name,
                        workspace_id: b.workspace_id,
                      })),
                      null,
                      2
                    )}`,
                  },
                ],
                isError: true,
              };
            }

            if (foundBoards.length === 1) {
              const foundBoard = foundBoards[0]!;
              try {
                const structure = await this.businessMapClient.getBoardStructure(
                  foundBoard.board_id
                );
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Board found by name:\n${JSON.stringify({ ...foundBoard, structure }, null, 2)}`,
                    },
                  ],
                };
              } catch (structureError) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Board found but structure unavailable:\n${JSON.stringify(foundBoard, null, 2)}`,
                    },
                  ],
                };
              }
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Multiple boards found matching "${board_name}":\n${JSON.stringify(
                    foundBoards.map((b) => ({
                      board_id: b.board_id,
                      name: b.name,
                      workspace_id: b.workspace_id,
                    })),
                    null,
                    2
                  )}`,
                },
              ],
            };
          }

          // If neither ID nor name provided, list all boards
          const boards = await this.businessMapClient.getBoards(workspace_id);
          return {
            content: [
              {
                type: 'text',
                text: `All available boards:\n${JSON.stringify(
                  boards.map((b) => ({
                    board_id: b.board_id,
                    name: b.name,
                    workspace_id: b.workspace_id,
                  })),
                  null,
                  2
                )}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error searching for board: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get board details (improved with better error handling)
    this.mcpServer.registerTool(
      'get_board',
      {
        title: 'Get Board',
        description:
          'Get details of a specific board including its structure. For more robust search, use search_board tool instead.',
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
            content: [
              {
                type: 'text',
                text: JSON.stringify({ ...board, structure }, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching board ${board_id}: ${error instanceof Error ? error.message : 'Unknown error'}. Try using search_board tool for more robust search with fallback options.`,
              },
            ],
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
            const board = await this.businessMapClient.createBoard({
              name,
              workspace_id,
              description,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Board created successfully:\n${JSON.stringify(board, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error creating board: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }
      );
    }

    // Get board columns - endpoint válido na API oficial
    this.mcpServer.registerTool(
      'get_columns',
      {
        title: 'Get Board Columns',
        description: 'Get all columns for a board (válido na API oficial)',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const columns = await this.businessMapClient.getColumns(board_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(columns, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching board columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get board lanes/swimlanes - endpoint válido na API oficial
    this.mcpServer.registerTool(
      'get_lanes',
      {
        title: 'Get Board Lanes',
        description: 'Get all lanes/swimlanes for a board (válido na API oficial)',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const lanes = await this.businessMapClient.getLanes(board_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(lanes, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching board lanes: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get single lane - endpoint válido na API oficial
    this.mcpServer.registerTool(
      'get_lane',
      {
        title: 'Get Lane Details',
        description: 'Get details of a specific lane/swimlane (válido na API oficial)',
        inputSchema: {
          lane_id: z.number().describe('The ID of the lane'),
        },
      },
      async ({ lane_id }) => {
        try {
          const lane = await this.businessMapClient.getLane(lane_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(lane, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching lane details: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    if (!config.businessMap.readOnlyMode) {
      // Create lane - endpoint válido na API oficial
      this.mcpServer.registerTool(
        'create_lane',
        {
          title: 'Create Lane',
          description: 'Create a new lane/swimlane in a board (válido na API oficial)',
          inputSchema: {
            name: z.string().describe('The name of the lane'),
            board_id: z.number().describe('The ID of the board'),
            description: z.string().optional().describe('Optional description for the lane'),
            color: z.string().optional().describe('Optional color for the lane'),
            position: z.number().optional().describe('Optional position for the lane'),
          },
        },
        async ({ name, board_id, description, color, position }) => {
          try {
            const lane = await this.businessMapClient.createLane({
              name,
              board_id,
              description,
              color,
              position,
            });
            return {
              content: [
                {
                  type: 'text',
                  text: `Lane created successfully:\n${JSON.stringify(lane, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error creating lane: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
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
          assignee_user_id: z
            .number()
            .optional()
            .describe('Optional assignee user ID to filter cards'),
        },
      },
      async ({ board_id, column_id, swimlane_id, assignee_user_id }) => {
        try {
          const filters = { column_id, swimlane_id, assignee_user_id };
          const cards = await this.businessMapClient.getCards(board_id, filters);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(cards, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching cards: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(card, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching card: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Get card size
    this.mcpServer.registerTool(
      'get_card_size',
      {
        title: 'Get Card Size',
        description: 'Get the size/points of a specific card',
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
      },
      async ({ card_id }) => {
        try {
          const card = await this.businessMapClient.getCard(card_id);
          const size = card.size || 0;
          return {
            content: [
              {
                type: 'text',
                text: `Card "${card.title}" (ID: ${card_id}) has size: ${size} points`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching card size: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
            priority: z
              .string()
              .optional()
              .describe('Priority level (Low, Average, High, Critical)'),
            owner_user_id: z.number().optional().describe('Optional owner user ID'),
            assignee_user_id: z.number().optional().describe('Optional assignee user ID'),
            deadline: z.string().optional().describe('Optional deadline (ISO date string)'),
          },
        },
        async (params) => {
          try {
            const card = await this.businessMapClient.createCard(params);
            return {
              content: [
                {
                  type: 'text',
                  text: `Card created successfully:\n${JSON.stringify(card, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error creating card: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
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
            const card = await this.businessMapClient.moveCard(
              card_id,
              column_id,
              swimlane_id,
              position
            );
            return {
              content: [
                {
                  type: 'text',
                  text: `Card moved successfully:\n${JSON.stringify(card, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error moving card: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
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
          description: "Update a card's properties",
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
              content: [
                {
                  type: 'text',
                  text: `Card updated successfully:\n${JSON.stringify(card, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error updating card: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
              isError: true,
            };
          }
        }
      );

      // Set card size
      this.mcpServer.registerTool(
        'set_card_size',
        {
          title: 'Set Card Size',
          description: 'Set the size/points of a specific card',
          inputSchema: {
            card_id: z.number().describe('The ID of the card to update'),
            size: z.number().describe('The new size/points for the card'),
          },
        },
        async ({ card_id, size }) => {
          try {
            const card = await this.businessMapClient.updateCard({ card_id, size });
            return {
              content: [
                {
                  type: 'text',
                  text: `Card "${card.title}" (ID: ${card_id}) size updated to: ${size} points`,
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Error setting card size: ${error instanceof Error ? error.message : 'Unknown error'}`,
                },
              ],
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(users, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
            content: [
              {
                type: 'text',
                text: JSON.stringify(user, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching user: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private setupCycleTimeTools(): void {
    // Cycle Time Columns - endpoint válido na API oficial
    this.mcpServer.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: 'Get cycle time configuration columns for a board (válido na API oficial)',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const columns = await this.businessMapClient.getWorkflowCycleTimeColumns(board_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(columns, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching cycle time columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Effective Cycle Time Columns - endpoint válido na API oficial
    this.mcpServer.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description:
          'Get effective cycle time configuration columns for a board (válido na API oficial)',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const columns =
            await this.businessMapClient.getWorkflowEffectiveCycleTimeColumns(board_id);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(columns, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching effective cycle time columns: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
            content: [
              {
                type: 'text',
                text: `BusinessMap API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
        description:
          'Get information about the BusinessMap API (nota: endpoint /info não existe na API oficial)',
        inputSchema: {},
      },
      async () => {
        try {
          const apiInfo = await this.businessMapClient.getApiInfo();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(apiInfo, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error fetching API info: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
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
