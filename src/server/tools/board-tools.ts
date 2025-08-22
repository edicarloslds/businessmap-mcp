import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  createBoardSchema,
  createLaneSchema,
  getBoardSchema,
  getCurrentBoardStructureSchema,
  getLaneSchema,
  listBoardsSchema,
  searchBoardSchema,
} from '../../schemas/index.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class BoardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListBoards(server, client);
    this.registerSearchBoard(server, client);
    this.registerGetColumns(server, client);
    this.registerGetLanes(server, client);
    this.registerGetLane(server, client);
    this.registerGetCurrentBoardStructure(server, client);

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
        description: 'Get a list of boards with optional filters',
        inputSchema: listBoardsSchema.shape,
      },
      async (params) => {
        try {
          const boards = await client.getBoards(params);
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
        inputSchema: searchBoardSchema.shape,
      },
      async ({ board_id, board_name, workspace_id }) => {
        try {
          if (board_id) {
            return await this.searchBoardById(client, board_id, workspace_id);
          }

          if (board_name) {
            return await this.searchBoardByName(client, board_name, workspace_id);
          }

          // If neither ID nor name provided, list all boards
          return await this.getAllBoards(client, workspace_id);
        } catch (error) {
          return createErrorResponse(error, 'searching for board');
        }
      }
    );
  }

  private async searchBoardById(client: BusinessMapClient, boardId: number, workspaceId?: number) {
    try {
      const [board, structure] = await Promise.all([
        client.getBoard(boardId),
        client.getBoardStructure(boardId),
      ]);
      return createSuccessResponse({ ...board, structure }, 'Board found directly:');
    } catch (directError) {
      console.warn(
        `Direct board lookup failed for ID ${boardId}:`,
        directError instanceof Error ? directError.message : 'Unknown error'
      );
      return await this.searchBoardByIdFallback(client, boardId, workspaceId);
    }
  }

  private async searchBoardByIdFallback(
    client: BusinessMapClient,
    boardId: number,
    workspaceId?: number
  ) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    const foundBoard = boards.find((b) => b.board_id === boardId);

    if (!foundBoard) {
      return createErrorResponse(
        new Error(
          `Board with ID ${boardId} not found. Available boards:\n${JSON.stringify(this.formatBoardsList(boards), null, 2)}`
        ),
        'searching for board'
      );
    }

    return await this.getBoardWithStructure(client, foundBoard, 'Board found via list search:');
  }

  private async searchBoardByName(
    client: BusinessMapClient,
    boardName: string,
    workspaceId?: number
  ) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    const foundBoards = boards.filter((b) =>
      b.name.toLowerCase().includes(boardName.toLowerCase())
    );

    if (foundBoards.length === 0) {
      return createErrorResponse(
        new Error(
          `No boards found matching name "${boardName}". Available boards:\n${JSON.stringify(this.formatBoardsList(boards), null, 2)}`
        ),
        'searching for board by name'
      );
    }

    if (foundBoards.length === 1) {
      const foundBoard = foundBoards[0]!;
      if (!foundBoard.board_id) {
        return createErrorResponse(new Error('Board missing board_id'), 'board validation');
      }
      return await this.getBoardWithStructure(client, foundBoard, 'Board found by name:');
    }

    return createSuccessResponse(
      this.formatBoardsList(foundBoards),
      `Multiple boards found matching "${boardName}":`
    );
  }

  private async getAllBoards(client: BusinessMapClient, workspaceId?: number) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    return createSuccessResponse(this.formatBoardsList(boards), 'All available boards:');
  }

  private async getBoardWithStructure(
    client: BusinessMapClient,
    board: any,
    successMessage: string
  ) {
    try {
      const structure = await client.getBoardStructure(board.board_id);
      return createSuccessResponse({ ...board, structure }, successMessage);
    } catch (structureError) {
      console.warn(
        `Structure lookup failed for board ID ${board.board_id}:`,
        structureError instanceof Error ? structureError.message : 'Unknown error'
      );
      return createSuccessResponse(
        board,
        `Board found but structure unavailable. Structure error: ${structureError instanceof Error ? structureError.message : 'Unknown error'}`
      );
    }
  }

  private formatBoardsList(boards: any[]) {
    return boards.map((b) => ({
      board_id: b.board_id,
      name: b.name,
      workspace_id: b.workspace_id,
    }));
  }

  private registerGetColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_columns',
      {
        title: 'Get Board Columns',
        description: 'Get all columns for a board (válido na API oficial)',
        inputSchema: getBoardSchema.shape,
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
        inputSchema: getBoardSchema.shape,
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
        inputSchema: getLaneSchema.shape,
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
        inputSchema: createBoardSchema.shape,
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
        inputSchema: createLaneSchema.shape,
      },
      async ({ workflow_id, name, description, color, position }) => {
        try {
          const lane = await client.createLane({
            workflow_id,
            name,
            description: description || null,
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

  private registerGetCurrentBoardStructure(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_current_board_structure',
      {
        title: 'Get Current Board Structure',
        description:
          'Get the complete current structure of a board including workflows, columns, lanes, and configurations',
        inputSchema: getCurrentBoardStructureSchema.shape,
      },
      async ({ board_id }) => {
        try {
          const structure = await client.getCurrentBoardStructure(board_id);
          return createSuccessResponse(structure, 'Board structure retrieved successfully:');
        } catch (error) {
          return createErrorResponse(error, 'getting current board structure');
        }
      }
    );
  }
}
