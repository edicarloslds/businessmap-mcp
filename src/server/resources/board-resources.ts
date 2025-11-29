import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseResourceHandler } from './base-resource.js';

export class BoardResourceHandler implements BaseResourceHandler {
    registerResources(server: McpServer, client: BusinessMapClient): void {
        // List all boards
        server.registerResource(
            'boards',
            new ResourceTemplate('businessmap://boards', { list: undefined }),
            {},
            async (uri) => {
                const boards = await client.getBoards();
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(boards, null, 2),
                        },
                    ],
                };
            }
        );

        // Get board details
        server.registerResource(
            'board',
            new ResourceTemplate('businessmap://boards/{board_id}', { list: undefined }),
            {},
            async (uri, variables) => {
                const boardId = parseInt(variables.board_id as string);
                const board = await client.getBoard(boardId);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(board, null, 2),
                        },
                    ],
                };
            }
        );
    }
}
