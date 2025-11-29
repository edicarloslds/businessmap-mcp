import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseResourceHandler } from './base-resource.js';

export class CardResourceHandler implements BaseResourceHandler {
    registerResources(server: McpServer, client: BusinessMapClient): void {
        // List cards for a specific board
        server.registerResource(
            'cards',
            new ResourceTemplate('businessmap://boards/{board_id}/cards', { list: undefined }),
            {}, // Added empty metadata object
            async (uri, variables) => {
                const boardId = parseInt(variables.board_id as string);
                const cards = await client.getCards(boardId);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(cards, null, 2),
                        },
                    ],
                };
            }
        );

        // Get card details
        server.registerResource(
            'card',
            new ResourceTemplate('businessmap://cards/{card_id}', { list: undefined }),
            {}, // Added empty metadata object
            async (uri, variables) => {
                const cardId = parseInt(variables.card_id as string);
                const card = await client.getCard(cardId);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify(card, null, 2),
                        },
                    ],
                };
            }
        );
    }
}
