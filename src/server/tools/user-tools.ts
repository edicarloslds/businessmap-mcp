import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListUsers(server, client);
    this.registerGetUser(server, client);
  }

  private registerListUsers(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'Get a list of all users',
        inputSchema: {},
      },
      async () => {
        try {
          const users = await client.getUsers();
          return createSuccessResponse(users);
        } catch (error) {
          return createErrorResponse(error, 'fetching users');
        }
      }
    );
  }

  private registerGetUser(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_user',
      {
        title: 'Get User',
        description: 'Get details of a specific user',
        inputSchema: {
          user_id: z.number().describe('The ID of the user'),
        },
      },
      async ({ user_id }) => {
        try {
          const user = await client.getUser(user_id);
          return createSuccessResponse(user);
        } catch (error) {
          return createErrorResponse(error, 'fetching user');
        }
      }
    );
  }
}
