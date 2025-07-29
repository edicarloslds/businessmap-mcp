import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class BoardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListBoards(server, client);
    this.registerSearchBoard(server, client);
    this.registerGetBoard(server, client);
    this.registerGetColumns(server, client);
    this.registerGetLanes(server, client);
    this.registerGetLane(server, client);

    if (!readOnlyMode) {
      this.registerCreateBoard(server, client);
      this.registerCreateLane(server, client);
    }
  }

  private registerListBoards(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const boards = await client.getBoards(workspace_id);
          return createSuccessResponse(boards);
        } catch (error) {
          return createErrorResponse(error, 'fetching boards');
        }
      }
    );
  }

  private registerSearchBoard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
                client.getBoard(board_id),
                client.getBoardStructure(board_id),
              ]);
              return createSuccessResponse({ ...board, structure }, 'Board found directly:');
            } catch (directError) {
              // If direct lookup fails, fallback to list and search
              const boards = await client.getBoards(workspace_id);
              const foundBoard = boards.find((b) => b.board_id === board_id);

              if (foundBoard) {
                try {
                  const structure = await client.getBoardStructure(board_id);
                  return createSuccessResponse(
                    { ...foundBoard, structure },
                    'Board found via list search:'
                  );
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
            const boards = await client.getBoards(workspace_id);
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
              if (!foundBoard.board_id) {
                return createErrorResponse(new Error('Board missing board_id'), 'board validation');
              }
              try {
                const structure = await client.getBoardStructure(foundBoard.board_id);
                return createSuccessResponse({ ...foundBoard, structure }, 'Board found by name:');
              } catch (structureError) {
                return createSuccessResponse(foundBoard, 'Board found but structure unavailable:');
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
          const boards = await client.getBoards(workspace_id);
          return createSuccessResponse(
            boards.map((b) => ({
              board_id: b.board_id,
              name: b.name,
              workspace_id: b.workspace_id,
            })),
            'All available boards:'
          );
        } catch (error) {
          return createErrorResponse(error, 'searching for board');
        }
      }
    );
  }

  private registerGetBoard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
            client.getBoard(board_id),
            client.getBoardStructure(board_id),
          ]);
          return createSuccessResponse({ ...board, structure });
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
  }

  private registerGetColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const columns = await client.getColumns(board_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching board columns');
        }
      }
    );
  }

  private registerGetLanes(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const lanes = await client.getLanes(board_id);
          return createSuccessResponse(lanes);
        } catch (error) {
          return createErrorResponse(error, 'fetching board lanes');
        }
      }
    );
  }

  private registerGetLane(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const lane = await client.getLane(lane_id);
          return createSuccessResponse(lane);
        } catch (error) {
          return createErrorResponse(error, 'fetching lane details');
        }
      }
    );
  }

  private registerCreateBoard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const board = await client.createBoard({
            name,
            workspace_id,
            description,
          });
          return createSuccessResponse(board, 'Board created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating board');
        }
      }
    );
  }

  private registerCreateLane(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_lane',
      {
        title: 'Create Lane',
        description: 'Create a new lane/swimlane in a board (válido na API oficial)',
        inputSchema: {
          workflow_id: z.number().describe('The ID of the workflow'),
          position: z.number().describe('The position of the lane'),
          name: z.string().describe('The name of the lane'),
          description: z.string().optional().describe('Optional description for the lane'),
          color: z.string().describe('Optional color for the lane'),
        },
      },
      async ({ workflow_id, name, description, color, position }) => {
        try {
          const lane = await client.createLane({
            workflow_id,
            name,
            description,
            color,
            position,
          });
          return createSuccessResponse(lane, 'Lane created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating lane');
        }
      }
    );
  }
}
