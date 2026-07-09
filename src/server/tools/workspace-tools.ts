import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  createWorkspaceSchema,
  getWorkspaceSchema,
  listWorkspacesSchema,
  updateWorkspaceSchema,
} from '../../schemas/workspace-schemas.js';
import { BaseToolHandler, READ_ONLY, WRITE, WRITE_IDEMPOTENT, registerTool } from './base-tool.js';

export class WorkspaceToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    registerTool(server, {
      name: 'list_workspaces',
      title: 'List Workspaces',
      description: 'Get a list of all workspaces',
      schema: listWorkspacesSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workspaces',
      handler: () => client.workspaces.getWorkspaces(),
    });

    registerTool(server, {
      name: 'get_workspace',
      title: 'Get Workspace',
      description: 'Get details of a specific workspace',
      schema: getWorkspaceSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching workspace',
      handler: ({ workspace_id }) => client.workspaces.getWorkspace(workspace_id),
    });

    if (!readOnlyMode) {
      registerTool(server, {
        name: 'create_workspace',
        title: 'Create Workspace',
        description: 'Create a new workspace',
        schema: createWorkspaceSchema,
        annotations: WRITE,
        errorContext: 'creating workspace',
        successMessage: 'Workspace created successfully:',
        handler: ({ name, description, type }) =>
          client.workspaces.createWorkspace({ name, description, ...(type !== undefined && { type }) }),
      });

      registerTool(server, {
        name: 'update_workspace',
        title: 'Update Workspace',
        description: 'Update the name of an existing workspace',
        schema: updateWorkspaceSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating workspace',
        successMessage: 'Workspace updated successfully:',
        handler: ({ workspace_id, name }) => client.workspaces.updateWorkspace(workspace_id, { name }),
      });
    }
  }
}
