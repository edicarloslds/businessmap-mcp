import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  configureBoardStructureSchema,
  createBoardsInWorkspaceSchema,
  createWorkspacesAndBoardsSchema,
  setupBoardSchema,
  setupWorkflowSchema,
} from '../../schemas/index.js';
import { logger } from '../../utils/logger.js';
import { BaseToolHandler, WRITE, registerTool } from './base-tool.js';

type SetupWorkflowConfig = z.infer<typeof setupWorkflowSchema>;
type SetupBoardConfig = z.infer<typeof setupBoardSchema>;

interface WorkflowSetupReport {
  workflow_id?: number;
  created: boolean;
  renamed_default_columns: string[];
  created_columns: string[];
  created_lanes: string[];
  errors: string[];
}

interface BoardSetupReport {
  name: string;
  board_id?: number;
  workflows: WorkflowSetupReport[];
  error?: string;
}

interface WorkspaceSetupReport {
  name: string;
  workspace_id?: number;
  boards: BoardSetupReport[];
  error?: string;
}

export class SetupToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    if (readOnlyMode) {
      return;
    }

    registerTool(server, {
      name: 'create_workspaces_and_boards',
      title: 'Create Workspaces and Boards',
      description:
        'Create one or more workspaces (max 3) together with their boards and full board structure (workflows, renamed default columns, extra columns and lanes) in a single batch call',
      schema: createWorkspacesAndBoardsSchema,
      annotations: WRITE,
      errorContext: 'creating workspaces and boards',
      handler: async ({ workspaces }) => {
        const reports = [];
        for (const workspaceConfig of workspaces) {
          reports.push(await this.createWorkspaceWithBoards(client, workspaceConfig));
        }
        return { workspaces: reports };
      },
    });

    registerTool(server, {
      name: 'create_boards_in_workspace',
      title: 'Create Boards in Workspace',
      description:
        'Create one or more boards (max 3) with their full structure (workflows, renamed default columns, extra columns and lanes) in an existing workspace, in a single batch call',
      schema: createBoardsInWorkspaceSchema,
      annotations: WRITE,
      errorContext: 'creating boards in workspace',
      handler: async ({ workspace_id, boards }) => {
        const reports = await this.createBoardsWithStructure(client, workspace_id, boards);
        return { workspace_id, boards: reports };
      },
    });

    registerTool(server, {
      name: 'configure_board_structure',
      title: 'Configure Board Structure',
      description:
        'Configure the structure of an existing board in a single batch call: create or rename workflows, rename the built-in Requested/In Progress/Done columns, and add extra columns and lanes',
      schema: configureBoardStructureSchema,
      annotations: WRITE,
      errorContext: 'configuring board structure',
      handler: async ({ board_id, workflows }) => {
        const reports = [];
        for (const workflowConfig of workflows) {
          reports.push(await this.applyWorkflowConfig(client, board_id, workflowConfig));
        }
        return { board_id, workflows: reports };
      },
    });
  }

  private async createWorkspaceWithBoards(
    client: BusinessMapClient,
    workspaceConfig: z.infer<typeof createWorkspacesAndBoardsSchema>['workspaces'][number]
  ): Promise<WorkspaceSetupReport> {
    const report: WorkspaceSetupReport = { name: workspaceConfig.name, boards: [] };
    try {
      const workspace = await client.workspaces.createWorkspace({
        name: workspaceConfig.name,
        ...(workspaceConfig.type !== undefined && { type: workspaceConfig.type }),
      });
      if (workspace.workspace_id === undefined) {
        throw new Error('Workspace was created but the API did not return a workspace_id');
      }
      report.workspace_id = workspace.workspace_id;
      report.boards = await this.createBoardsWithStructure(
        client,
        workspace.workspace_id,
        workspaceConfig.boards ?? []
      );
    } catch (error) {
      report.error = errorMessage(error);
    }
    return report;
  }

  private async createBoardsWithStructure(
    client: BusinessMapClient,
    workspaceId: number,
    boards: SetupBoardConfig[]
  ): Promise<BoardSetupReport[]> {
    const reports: BoardSetupReport[] = [];
    for (const boardConfig of boards) {
      const report: BoardSetupReport = { name: boardConfig.name, workflows: [] };
      try {
        const board = await client.boards.createBoard({
          name: boardConfig.name,
          workspace_id: workspaceId,
          ...(boardConfig.description && { description: boardConfig.description }),
        });
        if (board.board_id === undefined) {
          throw new Error('Board was created but the API did not return a board_id');
        }
        report.board_id = board.board_id;
        for (const workflowConfig of boardConfig.workflows ?? []) {
          report.workflows.push(
            await this.applyWorkflowConfig(client, board.board_id, workflowConfig)
          );
        }
      } catch (error) {
        report.error = errorMessage(error);
      }
      reports.push(report);
    }
    return reports;
  }

  private async applyWorkflowConfig(
    client: BusinessMapClient,
    boardId: number,
    config: SetupWorkflowConfig
  ): Promise<WorkflowSetupReport> {
    const report: WorkflowSetupReport = {
      created: false,
      renamed_default_columns: [],
      created_columns: [],
      created_lanes: [],
      errors: [],
    };

    const workflowId = await this.resolveWorkflow(client, boardId, config, report);
    if (workflowId === undefined) {
      return report;
    }

    const columnIdsByName = await this.renameDefaultColumns(
      client,
      boardId,
      workflowId,
      config,
      report
    );
    await this.createColumns(client, boardId, workflowId, config, columnIdsByName, report);
    await this.createLanes(client, boardId, workflowId, config, report);

    if (report.errors.length > 0) {
      logger.warn(
        `Board ${boardId} structure setup finished with ${report.errors.length} error(s)`
      );
    }
    return report;
  }

  /** Resolve the target workflow: create a new one or rename an existing one */
  private async resolveWorkflow(
    client: BusinessMapClient,
    boardId: number,
    config: SetupWorkflowConfig,
    report: WorkflowSetupReport
  ): Promise<number | undefined> {
    let workflowId = config.workflow_id;
    try {
      if (workflowId === undefined) {
        if (config.type === undefined) {
          report.errors.push('Provide workflow_id (existing) or type (to create a new workflow).');
          return undefined;
        }
        const workflow = await client.workflows.createWorkflow(boardId, {
          type: config.type,
          ...(config.name && { name: config.name }),
        });
        workflowId = workflow.workflow_id;
        report.created = true;
      } else if (config.name) {
        await client.workflows.updateWorkflow(boardId, workflowId, { name: config.name });
      }
      report.workflow_id = workflowId;
      return workflowId;
    } catch (error) {
      report.errors.push(`workflow: ${errorMessage(error)}`);
      return undefined;
    }
  }

  /**
   * Rename the built-in section columns and return a name -> column_id map of the
   * workflow's existing columns (used for parent resolution when creating sub-columns)
   */
  private async renameDefaultColumns(
    client: BusinessMapClient,
    boardId: number,
    workflowId: number,
    config: SetupWorkflowConfig,
    report: WorkflowSetupReport
  ): Promise<Map<string, number>> {
    const columnIdsByName = new Map<string, number>();
    if (!config.default_columns?.length && !config.columns?.some((c) => c.parent_column_name)) {
      return columnIdsByName;
    }

    try {
      const structure = await client.boards.getCurrentBoardStructure(boardId);
      for (const [columnId, column] of Object.entries(structure.columns)) {
        if (column.workflow_id !== workflowId) {
          continue;
        }
        columnIdsByName.set(column.name, Number(columnId));
        // Rename built-in columns by section (top-level columns only)
        const rename = config.default_columns?.find(
          (dc) => dc.section === column.section && !column.parent_column_id
        );
        if (rename && !report.renamed_default_columns.includes(rename.name)) {
          await client.boards.updateColumn(boardId, Number(columnId), { name: rename.name });
          columnIdsByName.delete(column.name);
          columnIdsByName.set(rename.name, Number(columnId));
          report.renamed_default_columns.push(rename.name);
        }
      }
    } catch (error) {
      report.errors.push(`default_columns: ${errorMessage(error)}`);
    }
    return columnIdsByName;
  }

  /** Create the extra columns (main or sub-columns resolved by parent name) */
  private async createColumns(
    client: BusinessMapClient,
    boardId: number,
    workflowId: number,
    config: SetupWorkflowConfig,
    columnIdsByName: Map<string, number>,
    report: WorkflowSetupReport
  ): Promise<void> {
    for (const column of config.columns ?? []) {
      try {
        const parentColumnId = column.parent_column_name
          ? columnIdsByName.get(column.parent_column_name)
          : undefined;
        if (column.parent_column_name && parentColumnId === undefined) {
          report.errors.push(
            `column "${column.name}": parent column "${column.parent_column_name}" not found`
          );
          continue;
        }
        const sharedFields = {
          position: column.position ?? 0,
          name: column.name,
          ...(column.limit !== undefined && { limit: column.limit }),
          ...(column.description && { description: column.description }),
        };
        const created = await client.boards.createColumn(
          boardId,
          parentColumnId !== undefined
            ? { parent_column_id: parentColumnId, ...sharedFields }
            : { workflow_id: workflowId, section: column.section ?? 3, ...sharedFields }
        );
        if (created.column_id !== undefined) {
          columnIdsByName.set(column.name, created.column_id);
        }
        report.created_columns.push(column.name);
      } catch (error) {
        report.errors.push(`column "${column.name}": ${errorMessage(error)}`);
      }
    }
  }

  /** Create the extra lanes */
  private async createLanes(
    client: BusinessMapClient,
    boardId: number,
    workflowId: number,
    config: SetupWorkflowConfig,
    report: WorkflowSetupReport
  ): Promise<void> {
    for (const lane of config.lanes ?? []) {
      try {
        await client.boards.createLane(boardId, {
          workflow_id: workflowId,
          position: lane.position ?? 0,
          name: lane.name,
          ...(lane.color && { color: lane.color }),
        });
        report.created_lanes.push(lane.name);
      } catch (error) {
        report.errors.push(`lane "${lane.name}": ${errorMessage(error)}`);
      }
    }
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}
