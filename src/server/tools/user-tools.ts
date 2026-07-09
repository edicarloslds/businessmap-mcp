import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  getCurrentUserSchema,
  getUserSchema,
  inviteUserSchema,
  listUsersSchema,
} from '../../schemas/user-schemas.js';
import { BaseToolHandler, READ_ONLY, WRITE, registerTool } from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    registerTool(server, {
      name: 'list_users',
      title: 'List Users',
      description: 'Get a list of all users',
      schema: listUsersSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching users',
      handler: () => client.users.getUsers(),
    });

    registerTool(server, {
      name: 'get_user',
      title: 'Get User',
      description: 'Get details of a specific user',
      schema: getUserSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching user',
      handler: ({ user_id }) => client.users.getUser(user_id),
    });

    registerTool(server, {
      name: 'get_current_user',
      title: 'Get Current User',
      description: 'Get details of the current logged user',
      schema: getCurrentUserSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching current user',
      handler: () => client.users.getCurrentUser(),
    });

    if (!readOnlyMode) {
      registerTool(server, {
        name: 'invite_user',
        title: 'Invite User',
        description:
          'Add and invite a new user by email. Sends an invitation email with a link to set their password and log in.',
        schema: inviteUserSchema,
        annotations: WRITE,
        errorContext: 'inviting user',
        successMessage: 'User invited successfully:',
        handler: ({ email, do_not_send_confirmation_email }) =>
          client.users.inviteUser({
            email,
            ...(do_not_send_confirmation_email !== undefined && {
              do_not_send_confirmation_email,
            }),
          }),
      });
    }
  }
}
