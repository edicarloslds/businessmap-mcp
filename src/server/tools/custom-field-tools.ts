import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { getCustomFieldSchema } from '../../schemas/custom-field-schemas.js';
import { BaseToolHandler, READ_ONLY, registerTool } from './base-tool.js';

export class CustomFieldToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'get_custom_field',
      title: 'Get Custom Field',
      description: 'Get details of a specific custom field by ID',
      schema: getCustomFieldSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching custom field',
      handler: ({ custom_field_id }) => client.customFields.getCustomField(custom_field_id),
    });
  }
}
