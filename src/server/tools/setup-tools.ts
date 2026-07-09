import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  configureBoardStructureSchema,
  createBoardsInWorkspaceSchema,
  setupWorkflowSchema,
} from '../../schemas/index.js';
import { logger } from '../../utils/logger.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

type SetupWorkflowConfig = z.infer<typeof setupWorkflowSchema>;

interface WorkflowSetupReport {
  workflow_id?: number;
  created: boolean;
  renamed_default_columns: string[];
  created_columns: string[];
  created_lanes: string[];
  errors: string[];
}

export class SetupToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    if (!readOnlyMode) {
      this.registerCreateBoardsInWorkspace(server, client);
      this.registerConfigureBoardStructure(server, client);
    }
  }

  private registerCreateBoardsInWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_boards_in_workspace',
      {
        title: 'Create Boards in Workspace',
        description:
          'Create one or more boards (max 3) with their full structure (workflows, renamed default columns, extra columns and lanes) in an existing workspace, in a single batch call',
        inputSchema: createBoardsInWorkspaceSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      },
      async ({ workspace_id, boards }) => {
        try {
          const reports = [];
          for (const boardConfig of boards) {
            const report: {
              name: string;
              board_id?: number;
              workflows: WorkflowSetupReport[];
              error?: string;
            } = { name: boardConfig.name, workflows: [] };
            try {
              const board = await client.createBoard({
                name: boardConfig.name,
                workspace_id,
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
              report.error = error instanceof Error ? error.message : 'Unknown error';
            }
            reports.push(report);
          }
          return createSuccessResponse({ workspace_id, boards: reports });
        } catch (error) {
          return createErrorResponse(error, 'creating boards in workspace');
        }
      }
    );
  }

  private registerConfigureBoardStructure(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'configure_board_structure',
      {
        title: 'Configure Board Structure',
        description:
          'Configure the structure of an existing board in a single batch call: create or rename workflows, rename the built-in Requested/In Progress/Done columns, and add extra columns and lanes',
        inputSchema: configureBoardStructureSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      },
      async ({ board_id, workflows }) => {
        try {
          const reports = [];
          for (const workflowConfig of workflows) {
            reports.push(await this.applyWorkflowConfig(client, board_id, workflowConfig));
          }
          return createSuccessResponse({ board_id, workflows: reports });
        } catch (error) {
          return createErrorResponse(error, 'configuring board structure');
        }
      }
    );
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

    let workflowId = config.workflow_id;
    try {
      if (workflowId === undefined) {
        if (config.type === undefined) {
          report.errors.push('Provide workflow_id (existing) or type (to create a new workflow).');
          return report;
        }
        const workflow = await client.createWorkflow(boardId, {
          type: config.type,
          ...(config.name && { name: config.name }),
        });
        workflowId = workflow.workflow_id;
        report.created = true;
      } else if (config.name) {
        await client.updateWorkflow(boardId, workflowId, { name: config.name });
      }
      report.workflow_id = workflowId;
    } catch (error) {
      report.errors.push(
        `workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return report;
    }

    // Map of column name -> column_id for parent resolution (existing + created)
    const columnIdsByName = new Map<string, number>();

    if (config.default_columns?.length || config.columns?.some((c) => c.parent_column_name)) {
      try {
        const structure = await client.getCurrentBoardStructure(boardId);
        for (const [columnId, column] of Object.entries(structure.columns)) {
          if (column.workflow_id === workflowId) {
            columnIdsByName.set(column.name, Number(columnId));
            // Rename built-in columns by section (top-level columns only)
            const rename = config.default_columns?.find(
              (dc) => dc.section === column.section && !column.parent_column_id
            );
            if (rename && !report.renamed_default_columns.includes(rename.name)) {
              await client.updateColumn(boardId, Number(columnId), { name: rename.name });
              columnIdsByName.delete(column.name);
              columnIdsByName.set(rename.name, Number(columnId));
              report.renamed_default_columns.push(rename.name);
            }
          }
        }
      } catch (error) {
        report.errors.push(
          `default_columns: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

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
        const created = await client.createColumn(
          boardId,
          parentColumnId !== undefined
            ? {
                parent_column_id: parentColumnId,
                position: column.position ?? 0,
                name: column.name,
                ...(column.limit !== undefined && { limit: column.limit }),
                ...(column.description && { description: column.description }),
              }
            : {
                workflow_id: workflowId,
                section: column.section ?? 3,
                position: column.position ?? 0,
                name: column.name,
                ...(column.limit !== undefined && { limit: column.limit }),
                ...(column.description && { description: column.description }),
              }
        );
        if (created.column_id !== undefined) {
          columnIdsByName.set(column.name, created.column_id);
        }
        report.created_columns.push(column.name);
      } catch (error) {
        report.errors.push(
          `column "${column.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    for (const lane of config.lanes ?? []) {
      try {
        await client.createLane(boardId, {
          workflow_id: workflowId,
          position: lane.position ?? 0,
          name: lane.name,
          ...(lane.color && { color: lane.color }),
        });
        report.created_lanes.push(lane.name);
      } catch (error) {
        report.errors.push(
          `lane "${lane.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (report.errors.length > 0) {
      logger.warn(
        `Board ${boardId} structure setup finished with ${report.errors.length} error(s)`
      );
    }
    return report;
  }
}
