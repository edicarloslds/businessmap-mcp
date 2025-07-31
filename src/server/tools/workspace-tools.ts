import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  createWorkspaceSchema,
  getWorkspaceSchema,
  listWorkspacesSchema,
} from '../../schemas/workspace-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListWorkspaces(server, client);
    this.registerGetWorkspace(server, client);

    if (!readOnlyMode) {
      this.registerCreateWorkspace(server, client);
    }
  }

  private registerListWorkspaces(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_workspaces',
      {
        title: 'List Workspaces',
        description: 'Get a list of all workspaces',
        inputSchema: listWorkspacesSchema.shape,
      },
      async () => {
        try {
          const workspaces = await client.getWorkspaces();
          return createSuccessResponse(workspaces);
        } catch (error) {
          return createErrorResponse(error, 'fetching workspaces');
        }
      }
    );
  }

  private registerGetWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_workspace',
      {
        title: 'Get Workspace',
        description: 'Get details of a specific workspace',
        inputSchema: getWorkspaceSchema.shape,
      },
      async ({ workspace_id }) => {
        try {
          const workspace = await client.getWorkspace(workspace_id);
          return createSuccessResponse(workspace);
        } catch (error) {
          return createErrorResponse(error, 'fetching workspace');
        }
      }
    );
  }

  private registerCreateWorkspace(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_workspace',
      {
        title: 'Create Workspace',
        description: 'Create a new workspace',
        inputSchema: createWorkspaceSchema.shape,
      },
      async ({ name, description }) => {
        try {
          const workspace = await client.createWorkspace({ name, description });
          return createSuccessResponse(workspace, 'Workspace created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating workspace');
        }
      }
    );
  }
}
