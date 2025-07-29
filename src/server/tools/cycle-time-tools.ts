import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class CycleTimeToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetWorkflowCycleTimeColumns(server, client);
    this.registerGetWorkflowEffectiveCycleTimeColumns(server, client);
  }

  private registerGetWorkflowCycleTimeColumns(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
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
          const columns = await client.getWorkflowCycleTimeColumns(board_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching cycle time columns');
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
          'Get effective cycle time configuration columns for a board (válido na API oficial)',
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
        },
      },
      async ({ board_id }) => {
        try {
          const columns = await client.getWorkflowEffectiveCycleTimeColumns(board_id);
          return createSuccessResponse(columns);
        } catch (error) {
          return createErrorResponse(error, 'fetching effective cycle time columns');
        }
      }
    );
  }
}
