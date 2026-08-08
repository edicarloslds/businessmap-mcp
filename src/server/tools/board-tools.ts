import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { Board } from '../../types/index.js';
import {
  createBoardSchema,
  createColumnSchema,
  createColumnInputSchema,
  createLaneSchema,
  deleteColumnSchema,
  getBoardSchema,
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
import {
  BaseToolHandler,
  DESTRUCTIVE_IDEMPOTENT,
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  registerTool,
} from './base-tool.js';

function compactBoard(board: Board) {
  return {
    board_id: board.board_id,
    workspace_id: board.workspace_id,
    name: board.name,
    is_archived: board.is_archived,
  };
}

export class BoardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    registerTool(server, {
      name: 'list_boards',
      title: 'List Boards',
      description:
        'Discover boards with optional filters. Returns compact candidates by default; use get_board with a returned board_id for details.',
      schema: listBoardsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching boards',
      handler: async ({ detail_level, ...params }) => {
        const boards = await client.boards.getBoards(params);
        return detail_level === 'full' ? boards : boards.map(compactBoard);
      },
    });

    registerTool(server, {
      name: 'search_board',
      title: 'Search Board',
      description:
        'Find compact board candidates by name fragment, then use get_board with a returned board_id. If the board_id is already known, call get_board directly.',
      schema: searchBoardSchema,
      annotations: READ_ONLY,
      errorContext: 'searching for board',
      handler: async ({ board_name, workspace_id }) => {
        const boards = await client.boards.getBoards(
          workspace_id !== undefined ? { workspace_id } : undefined
        );
        const query = board_name.toLowerCase();
        const matches = boards
          .filter((board) => board.name.toLowerCase().includes(query))
          .map(compactBoard);
        return { matches, count: matches.length };
      },
    });

    registerTool(server, {
      name: 'get_board',
      title: 'Get Board',
      description:
        'Inspect a board selected by board_id. Returns board details without its structure; use get_current_board_structure only when workflows, columns and lanes are needed.',
      schema: getBoardSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching board',
      handler: ({ board_id }) => client.boards.getBoard(board_id),
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
        annotations: WRITE,
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
        annotations: WRITE_IDEMPOTENT,
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
        annotations: DESTRUCTIVE_IDEMPOTENT,
        errorContext: 'deleting column',
        successMessage: 'Column deleted successfully:',
        handler: async ({ board_id, column_id }) => {
          await client.boards.deleteColumn(board_id, column_id);
          return { board_id, column_id };
        },
      });
    }
  }
}
