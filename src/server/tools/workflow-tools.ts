import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { getWorkflowCycleTimeColumnsSchema } from '../../schemas/workflow-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class WorkflowToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, client);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, client);
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workflow_cycle_time_columns',
      {
        title: 'Get Workflow Cycle Time Columns',
        description: "Get workflow's cycle time columns",
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
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
        inputSchema: getWorkflowCycleTimeColumnsSchema.shape,
      },
      async ({ board_id, workflow_id }) => {
        try {
          console.log(
            `[DEBUG] Fetching effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id, workflow_id);
          console.log(`[DEBUG] Received ${columns.length} effective cycle time columns`);
          return createSuccessResponse(
            columns,
            `Retrieved ${columns.length} effective cycle time columns for board ${board_id}, workflow ${workflow_id}`
          );
        } catch (error) {
          console.error(`[DEBUG] Error fetching effective cycle time columns:`, error);
          return createErrorResponse(error, 'fetching workflow effective cycle time columns');
        }
      }
    );
  }
}
