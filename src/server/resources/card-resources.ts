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
                try {
                    const boardId = parseInt(variables.board_id as string);
                    if (isNaN(boardId)) {
                        throw new Error(`Invalid board_id: "${variables.board_id}" is not a valid number`);
                    }
                    const cards = await client.getCards(boardId);
                    return {
                        contents: [
                            {
                                uri: uri.href,
                                text: JSON.stringify(cards, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`Failed to fetch cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );

        // Get card details
        server.registerResource(
            'card',
            new ResourceTemplate('businessmap://cards/{card_id}', { list: undefined }),
            {}, // Added empty metadata object
            async (uri, variables) => {
                try {
                    const cardId = parseInt(variables.card_id as string);
                    if (isNaN(cardId)) {
                        throw new Error(`Invalid card_id: "${variables.card_id}" is not a valid number`);
                    }
                    const card = await client.getCard(cardId);
                    return {
                        contents: [
                            {
                                uri: uri.href,
                                text: JSON.stringify(card, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`Failed to fetch card: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );
    }
}
