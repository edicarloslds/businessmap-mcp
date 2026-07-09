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
import {
  BaseToolHandler,
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  createSuccessResponse,
  registerTool,
} from './base-tool.js';

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    registerTool(server, {
      name: 'get_workflow_cycle_time_columns',
      title: 'Get Workflow Cycle Time Columns',
      description: "Get workflow's cycle time columns",
      schema: getWorkflowCycleTimeColumnsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workflow cycle time columns',
      handler: ({ board_id, workflow_id }) =>
        client.workflows.getWorkflowCycleTimeColumns(board_id, workflow_id),
    });

    registerTool(server, {
      name: 'get_workflow_effective_cycle_time_columns',
      title: 'Get Workflow Effective Cycle Time Columns',
      description:
        "Get workflow's effective cycle time columns (the columns actually used for cycle time calculation with applied filters/logic)",
      schema: getWorkflowEffectiveCycleTimeColumnsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workflow effective cycle time columns',
      handler: async ({ board_id, workflow_id }) => {
        const columns = await client.workflows.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
        return createSuccessResponse(
          columns,
          `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
        );
      },
    });

    registerTool(server, {
      name: 'list_workflows',
      title: 'List Workflows',
      description: 'Get a list of workflows for the specified board',
      schema: listWorkflowsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workflows',
      handler: ({ board_id }) => client.workflows.getWorkflows(board_id),
    });

    registerTool(server, {
      name: 'get_workflow',
      title: 'Get Workflow',
      description: 'Get the details of a workflow for the specified board',
      schema: getWorkflowSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workflow',
      handler: ({ board_id, workflow_id }) => client.workflows.getWorkflow(board_id, workflow_id),
    });

    if (!readOnlyMode) {
      registerTool(server, {
        name: 'create_workflow',
        title: 'Create Workflow',
        description:
          'Create a new workflow on a board. Type: 0=cards, 1=initiatives, 2=timeline. Default names apply by type when name is omitted.',
        schema: createWorkflowSchema,
        annotations: WRITE,
        errorContext: 'creating workflow',
        successMessage: 'Workflow created successfully:',
        handler: ({ board_id, type, name, position, is_enabled, is_collapsible }) =>
          client.workflows.createWorkflow(board_id, {
            type,
            ...(name !== undefined && { name }),
            ...(position !== undefined && { position }),
            ...(is_enabled !== undefined && { is_enabled }),
            ...(is_collapsible !== undefined && { is_collapsible }),
          }),
      });

      registerTool(server, {
        name: 'update_workflow',
        title: 'Update Workflow',
        description: 'Update an existing workflow (name, position, enabled/collapsible state)',
        schema: updateWorkflowSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating workflow',
        successMessage: 'Workflow updated successfully:',
        handler: ({ board_id, workflow_id, name, position, is_enabled, is_collapsible }) =>
          client.workflows.updateWorkflow(board_id, workflow_id, {
            ...(name !== undefined && { name }),
            ...(position !== undefined && { position }),
            ...(is_enabled !== undefined && { is_enabled }),
            ...(is_collapsible !== undefined && { is_collapsible }),
          }),
      });

      registerTool(server, {
        name: 'link_related_workflow',
        title: 'Link Related Workflow',
        description:
          'Link a workflow from another board to a target board as a related workflow. You must be a workspace manager of both boards.',
        schema: linkRelatedWorkflowSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'linking related workflow',
        successMessage: 'Related workflow linked successfully:',
        handler: async ({ board_id, workflow_id, position }) => {
          await client.workflows.linkRelatedWorkflow(board_id, workflow_id, position);
          return { board_id, workflow_id };
        },
      });

      registerTool(server, {
        name: 'unlink_related_workflow',
        title: 'Unlink Related Workflow',
        description: 'Remove a related workflow from a board',
        schema: unlinkRelatedWorkflowSchema,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
        errorContext: 'unlinking related workflow',
        successMessage: 'Related workflow unlinked successfully:',
        handler: async ({ board_id, workflow_id }) => {
          await client.workflows.unlinkRelatedWorkflow(board_id, workflow_id);
          return { board_id, workflow_id };
        },
      });
    }
  }
}
