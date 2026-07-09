import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { Board } from '../../types/index.js';
import {
  createBoardSchema,
  createColumnSchema,
  createColumnInputSchema,
  createLaneSchema,
  deleteColumnSchema,
  getColumnsSchema,
  getCurrentBoardStructureSchema,
  getLanesSchema,
  getLaneSchema,
  listBoardsSchema,
  searchBoardSchema,
  updateBoardSchema,
  updateColumnSchema,
  updateLaneSchema,
} from '../../schemas/index.js';
import { logger } from '../../utils/logger.js';
import {
  BaseToolHandler,
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  createErrorResponse,
  createSuccessResponse,
  registerTool,
} from './base-tool.js';

export class BoardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    registerTool(server, {
      name: 'list_boards',
      title: 'List Boards',
      description: 'Get a list of boards with optional filters',
      schema: listBoardsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching boards',
      handler: (params) => client.boards.getBoards(params),
    });

    registerTool(server, {
      name: 'search_board',
      title: 'Search Board',
      description:
        'Search for a board by ID or name, with intelligent fallback to list all boards if direct search fails',
      schema: searchBoardSchema,
      annotations: READ_ONLY,
      errorContext: 'searching for board',
      handler: async ({ board_id, board_name, workspace_id }) => {
        if (board_id) {
          return this.searchBoardById(client, board_id, workspace_id);
        }
        if (board_name) {
          return this.searchBoardByName(client, board_name, workspace_id);
        }
        // If neither ID nor name provided, list all boards
        return this.getAllBoards(client, workspace_id);
      },
    });

    registerTool(server, {
      name: 'get_columns',
      title: 'Get Board Columns',
      description: 'Get all columns for a board',
      schema: getColumnsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching board columns',
      handler: ({ board_id }) => client.boards.getColumns(board_id),
    });

    registerTool(server, {
      name: 'get_lanes',
      title: 'Get Board Lanes',
      description: 'Get all lanes/swimlanes for a board',
      schema: getLanesSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching board lanes',
      handler: ({ board_id }) => client.boards.getLanes(board_id),
    });

    registerTool(server, {
      name: 'get_lane',
      title: 'Get Lane Details',
      description: 'Get details of a specific lane/swimlane',
      schema: getLaneSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching lane details',
      handler: ({ board_id, lane_id }) => client.boards.getLane(board_id, lane_id),
    });

    registerTool(server, {
      name: 'get_current_board_structure',
      title: 'Get Current Board Structure',
      description:
        'Get the complete current structure of a board including workflows, columns, lanes, and configurations',
      schema: getCurrentBoardStructureSchema,
      annotations: READ_ONLY,
      errorContext: 'getting current board structure',
      successMessage: 'Board structure retrieved successfully:',
      handler: ({ board_id }) => client.boards.getCurrentBoardStructure(board_id),
    });

    if (!readOnlyMode) {
      registerTool(server, {
        name: 'create_board',
        title: 'Create Board',
        description: 'Create a new board in a workspace',
        schema: createBoardSchema,
        annotations: WRITE,
        errorContext: 'creating board',
        successMessage: 'Board created successfully:',
        handler: ({ name, workspace_id, description }) =>
          client.boards.createBoard({ name, workspace_id, description }),
      });

      registerTool(server, {
        name: 'update_board',
        title: 'Update Board',
        description: 'Update the name and/or description of an existing board',
        schema: updateBoardSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating board',
        successMessage: 'Board updated successfully:',
        handler: ({ board_id, name, description }) =>
          client.boards.updateBoard(board_id, {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
          }),
      });

      registerTool(server, {
        name: 'create_lane',
        title: 'Create Lane',
        description: 'Create a new lane/swimlane in a board',
        schema: createLaneSchema,
        annotations: WRITE,
        errorContext: 'creating lane',
        successMessage: 'Lane created successfully:',
        handler: ({ board_id, workflow_id, name, description, color, position, parent_lane_id }) =>
          client.boards.createLane(board_id, {
            workflow_id,
            name,
            description: description || null,
            ...(color !== undefined && { color }),
            position,
            ...(parent_lane_id !== undefined && { parent_lane_id }),
          }),
      });

      registerTool(server, {
        name: 'update_lane',
        title: 'Update Lane',
        description:
          'Update an existing lane/swimlane (name, description, color, position or parent lane)',
        schema: updateLaneSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating lane',
        successMessage: 'Lane updated successfully:',
        handler: ({ board_id, lane_id, name, description, color, position, parent_lane_id }) =>
          client.boards.updateLane(board_id, lane_id, {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(color !== undefined && { color }),
            ...(position !== undefined && { position }),
            ...(parent_lane_id !== undefined && { parent_lane_id }),
          }),
      });

      registerTool(server, {
        name: 'create_column',
        title: 'Create Column',
        description:
          'Create a new column on a board. Supports both main columns (requires workflow_id and section) and sub-columns (requires parent_column_id). Section values: 1=Backlog, 2=Requested, 3=Progress, 4=Done.',
        schema: createColumnInputSchema,
        errorContext: 'creating column',
        successMessage: 'Column created successfully:',
        handler: (params) => {
          const { board_id, workflow_id, section, parent_column_id, position, name, limit, description } =
            createColumnSchema.parse(params);
          const sharedFields = {
            position,
            name,
            ...(limit !== undefined && { limit }),
            ...(description && { description }),
          };
          return client.boards.createColumn(
            board_id,
            parent_column_id
              ? { parent_column_id, ...sharedFields }
              : { workflow_id, section, ...sharedFields }
          );
        },
      });

      registerTool(server, {
        name: 'update_column',
        title: 'Update Column',
        description: 'Update the details of a specific column on a board',
        schema: updateColumnSchema,
        errorContext: 'updating column',
        successMessage: 'Column updated successfully:',
        handler: ({ board_id, column_id, name, limit, section, position, description }) =>
          client.boards.updateColumn(board_id, column_id, {
            ...(name !== undefined && { name }),
            ...(limit !== undefined && { limit }),
            ...(section !== undefined && { section }),
            ...(position !== undefined && { position }),
            ...(description !== undefined && { description }),
          }),
      });

      registerTool(server, {
        name: 'delete_column',
        title: 'Delete Column',
        description: 'Delete a column from a board',
        schema: deleteColumnSchema,
        errorContext: 'deleting column',
        successMessage: 'Column deleted successfully:',
        handler: async ({ board_id, column_id }) => {
          await client.boards.deleteColumn(board_id, column_id);
          return { board_id, column_id };
        },
      });
    }
  }

  private async searchBoardById(client: BusinessMapClient, boardId: number, workspaceId?: number) {
    try {
      const [board, structure] = await Promise.all([
        client.boards.getBoard(boardId),
        client.boards.getBoardStructure(boardId),
      ]);
      return createSuccessResponse({ ...board, structure }, 'Board found directly:');
    } catch (directError) {
      logger.warn(
        `Direct board lookup failed for ID ${boardId}: ${directError instanceof Error ? directError.message : 'Unknown error'}`
      );
      return await this.searchBoardByIdFallback(client, boardId, workspaceId);
    }
  }

  private async searchBoardByIdFallback(
    client: BusinessMapClient,
    boardId: number,
    workspaceId?: number
  ) {
    const boards = await client.boards.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
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
    const boards = await client.boards.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
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
    const boards = await client.boards.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    return createSuccessResponse(this.formatBoardsList(boards), 'All available boards:');
  }

  private async getBoardWithStructure(
    client: BusinessMapClient,
    board: Board,
    successMessage: string
  ) {
    try {
      const structure = await client.boards.getBoardStructure(board.board_id!);
      return createSuccessResponse({ ...board, structure }, successMessage);
    } catch (structureError) {
      logger.warn(
        `Structure lookup failed for board ID ${board.board_id}: ${structureError instanceof Error ? structureError.message : 'Unknown error'}`
      );
      return createSuccessResponse(
        board,
        `Board found but structure unavailable. Structure error: ${structureError instanceof Error ? structureError.message : 'Unknown error'}`
      );
    }
  }

  private formatBoardsList(boards: Board[]) {
    return boards.map((b) => ({
      board_id: b.board_id,
      name: b.name,
      workspace_id: b.workspace_id,
    }));
  }
}
