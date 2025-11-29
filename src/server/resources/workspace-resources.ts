import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseResourceHandler } from './base-resource.js';

export class WorkspaceResourceHandler implements BaseResourceHandler {
    registerResources(server: McpServer, client: BusinessMapClient): void {
        server.registerResource(
            'workspaces',
            new ResourceTemplate('businessmap://workspaces', { list: undefined }),
            {},
            async (uri, variables) => {
                const workspaces = await client.getWorkspaces();
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(workspaces, null, 2),
                        },
                    ],
                };
            }
        );
    }
}
