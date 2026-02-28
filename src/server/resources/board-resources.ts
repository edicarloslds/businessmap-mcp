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
                try {
                    const boards = await client.getBoards();
                    return {
                        contents: [
                            {
                                uri: uri.href,
                                text: JSON.stringify(boards, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`Failed to fetch boards: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );

        // Get board details
        server.registerResource(
            'board',
            new ResourceTemplate('businessmap://boards/{board_id}', { list: undefined }),
            {},
            async (uri, variables) => {
                try {
                    const boardId = parseInt(variables.board_id as string);
                    if (isNaN(boardId)) {
                        throw new Error(`Invalid board_id: "${variables.board_id}" is not a valid number`);
                    }
                    const board = await client.getBoard(boardId);
                    return {
                        contents: [
                            {
                                uri: uri.href,
                                text: JSON.stringify(board, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`Failed to fetch board: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );
    }
}
