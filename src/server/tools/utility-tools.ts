import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { getApiInfoSchema, healthCheckSchema } from '../../schemas/utility-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class UtilityToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerHealthCheck(server, client);
    this.registerGetApiInfo(server, client);
  }

  private registerHealthCheck(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'health_check',
      {
        title: 'Health Check',
        description: 'Check the connection to BusinessMap API',
        inputSchema: healthCheckSchema.shape,
      },
      async () => {
        try {
          const isHealthy = await client.healthCheck();
          return {
            content: [
              {
                type: 'text',
                text: `BusinessMap API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`,
              },
            ],
          };
        } catch (error) {
          return createErrorResponse(error, 'health check failed');
        }
      }
    );
  }

  private registerGetApiInfo(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_api_info',
      {
        title: 'Get API Info',
        description:
          'Get information about the BusinessMap API (nota: endpoint /info não existe na API oficial)',
        inputSchema: getApiInfoSchema.shape,
      },
      async () => {
        try {
          const apiInfo = await client.getApiInfo();
          return createSuccessResponse(apiInfo);
        } catch (error) {
          return createErrorResponse(error, 'fetching API info');
        }
      }
    );
  }
}
