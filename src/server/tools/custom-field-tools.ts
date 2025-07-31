import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';
import { getCustomFieldSchema } from '../../schemas/custom-field-schemas.js';

export class CustomFieldToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerGetCustomField(server, client);
  }

  private registerGetCustomField(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_custom_field',
      {
        title: 'Get Custom Field',
        description: 'Get details of a specific custom field by ID',
        inputSchema: getCustomFieldSchema.shape,
      },
      async ({ custom_field_id }) => {
        try {
          const customField = await client.getCustomField(custom_field_id);
          return createSuccessResponse(customField);
        } catch (error) {
          return createErrorResponse(error, 'fetching custom field');
        }
      }
    );
  }
}
