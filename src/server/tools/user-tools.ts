import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  getCurrentUserSchema,
  getUserSchema,
  inviteUserSchema,
  listUsersSchema,
} from '../../schemas/user-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListUsers(server, client);
    this.registerGetUser(server, client);
    this.registerGetCurrentUser(server, client);

    if (!readOnlyMode) {
      this.registerInviteUser(server, client);
    }
  }

  private registerListUsers(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'Get a list of all users',
        inputSchema: listUsersSchema.shape,
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
        inputSchema: getUserSchema.shape,
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

  private registerGetCurrentUser(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_current_user',
      {
        title: 'Get Current User',
        description: 'Get details of the current logged user',
        inputSchema: getCurrentUserSchema.shape,
      },
      async () => {
        try {
          const currentUser = await client.getCurrentUser();
          return createSuccessResponse(currentUser);
        } catch (error) {
          return createErrorResponse(error, 'fetching current user');
        }
      }
    );
  }

  private registerInviteUser(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'invite_user',
      {
        title: 'Invite User',
        description:
          'Add and invite a new user by email. Sends an invitation email with a link to set their password and log in.',
        inputSchema: inviteUserSchema.shape,
      },
      async ({ email, do_not_send_confirmation_email }) => {
        try {
          const params: Record<string, unknown> = { email };
          if (do_not_send_confirmation_email !== undefined) {
            params['do_not_send_confirmation_email'] = do_not_send_confirmation_email;
          }
          const user = await client.inviteUser(params as { email: string; do_not_send_confirmation_email?: number });
          return createSuccessResponse(user, 'User invited successfully:');
        } catch (error) {
          return createErrorResponse(error, 'inviting user');
        }
      }
    );
  }
}
