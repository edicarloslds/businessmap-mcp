import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { getApiInfoSchema, healthCheckSchema } from '../../schemas/utility-schemas.js';
import { BaseToolHandler, READ_ONLY, registerTool } from './base-tool.js';

export class UtilityToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'health_check',
      title: 'Health Check',
      description: 'Check the connection to BusinessMap API',
      schema: healthCheckSchema,
      annotations: READ_ONLY,
      errorContext: 'health check failed',
      handler: async () => {
        const isHealthy = await client.utility.healthCheck();
        return {
          content: [
            {
              type: 'text' as const,
              text: `BusinessMap API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`,
            },
          ],
        };
      },
    });

    registerTool(server, {
      name: 'get_api_info',
      title: 'Get API Info',
      description: 'Get information about the BusinessMap API',
      schema: getApiInfoSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching API info',
      handler: () => client.utility.getApiInfo(),
    });
  }
}
