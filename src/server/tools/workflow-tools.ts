import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  createWorkflowSchema,
  getWorkflowCycleTimeColumnsSchema,
  getWorkflowEffectiveCycleTimeColumnsSchema,
  getWorkflowSchema,
  linkRelatedWorkflowSchema,
  listWorkflowsSchema,
  unlinkRelatedWorkflowSchema,
  updateWorkflowSchema,
} from '../../schemas/workflow-schemas.js';
import { logger } from '../../utils/logger.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, client);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, client);
    this.registerListWorkflows(server, client);
    this.registerGetWorkflow(server, client);

    if (!readOnlyMode) {
      this.registerCreateWorkflow(server, client);
      this.registerUpdateWorkflow(server, client);
      this.registerLinkRelatedWorkflow(server, client);
      this.registerUnlinkRelatedWorkflow(server, client);
    }
  }

  private registerListWorkflows(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_workflows',
      {
        title: 'List Workflows',
        description: 'Get a list of workflows for the specified board',
        inputSchema: listWorkflowsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ board_id }) => {
        try {
          const workflows = await client.getWorkflows(board_id);
          return createSuccessResponse(workflows);
        } catch (error) {
          return createErrorResponse(error, 'fetching workflows');
        }
      }
    );
  }

  private registerGetWorkflow(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workflow',
      {
        title: 'Get Workflow',
        description: 'Get the details of a workflow for the specified board',
        inputSchema: getWorkflowSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ board_id, workflow_id }) => {
        try {
          const workflow = await client.getWorkflow(board_id, workflow_id);
          return createSuccessResponse(workflow);
        } catch (error) {
          return createErrorResponse(error, 'fetching workflow');
        }
      }
    );
  }

  private registerCreateWorkflow(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_workflow',
      {
        title: 'Create Workflow',
        description:
          'Create a new workflow on a board. Type: 0=cards, 1=initiatives, 2=timeline. Default names apply by type when name is omitted.',
        inputSchema: createWorkflowSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      },
      async ({ board_id, type, name, position, is_enabled, is_collapsible }) => {
        try {
          const workflow = await client.createWorkflow(board_id, {
            type,
            ...(name !== undefined && { name }),
            ...(position !== undefined && { position }),
            ...(is_enabled !== undefined && { is_enabled }),
            ...(is_collapsible !== undefined && { is_collapsible }),
          });
          return createSuccessResponse(workflow, 'Workflow created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating workflow');
        }
      }
    );
  }

  private registerUpdateWorkflow(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_workflow',
      {
        title: 'Update Workflow',
        description: 'Update an existing workflow (name, position, enabled/collapsible state)',
        inputSchema: updateWorkflowSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ board_id, workflow_id, name, position, is_enabled, is_collapsible }) => {
        try {
          const workflow = await client.updateWorkflow(board_id, workflow_id, {
            ...(name !== undefined && { name }),
            ...(position !== undefined && { position }),
            ...(is_enabled !== undefined && { is_enabled }),
            ...(is_collapsible !== undefined && { is_collapsible }),
          });
          return createSuccessResponse(workflow, 'Workflow updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating workflow');
        }
      }
    );
  }

  private registerLinkRelatedWorkflow(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'link_related_workflow',
      {
        title: 'Link Related Workflow',
        description:
          'Link a workflow from another board to a target board as a related workflow. You must be a workspace manager of both boards.',
        inputSchema: linkRelatedWorkflowSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ board_id, workflow_id, position }) => {
        try {
          await client.linkRelatedWorkflow(board_id, workflow_id, position);
          return createSuccessResponse(
            { board_id, workflow_id },
            'Related workflow linked successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'linking related workflow');
        }
      }
    );
  }

  private registerUnlinkRelatedWorkflow(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'unlink_related_workflow',
      {
        title: 'Unlink Related Workflow',
        description: 'Remove a related workflow from a board',
        inputSchema: unlinkRelatedWorkflowSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
      },
      async ({ board_id, workflow_id }) => {
        try {
          await client.unlinkRelatedWorkflow(board_id, workflow_id);
          return createSuccessResponse(
            { board_id, workflow_id },
            'Related workflow unlinked successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'unlinking related workflow');
        }
      }
    );
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: "Get workflow's cycle time columns",
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ board_id, workflow_id }) => {
        try {
          const columns = await client.getWorkflowCycleTimeColumns(board_id, workflow_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching workflow cycle time columns');
        }
      }
    );
  }

  private registerGetWorkflowEffectiveCycleTimeColumns(
    server: McpServer,
    client: BusinessMapClient
  ): void {
    server.registerTool(
      'get_workflow_effective_cycle_time_columns',
      {
        title: 'Get Workflow Effective Cycle Time Columns',
        description:
          "Get workflow's effective cycle time columns (the columns actually used for cycle time calculation with applied filters/logic)",
        inputSchema: getWorkflowEffectiveCycleTimeColumnsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ board_id, workflow_id }) => {
        try {
          logger.debug(
            `Fetching effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          logger.debug(`Received ${columns.length} effective cycle time columns`);
          return createSuccessResponse(
            columns,
            `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
        } catch (error) {
          logger.error(`Error fetching effective cycle time columns:`, error);
          return createErrorResponse(error, 'fetching workflow effective cycle time columns');
        }
      }
    );
  }
}
