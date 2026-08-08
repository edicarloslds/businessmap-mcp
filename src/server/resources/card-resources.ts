import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { Card } from '../../types/index.js';
import { BaseResourceHandler } from './base-resource.js';

function compactCard(card: Card) {
    return {
        card_id: card.card_id,
        custom_id: card.custom_id,
        board_id: card.board_id,
        title: card.title,
        owner_user_id: card.owner_user_id,
        column_id: card.column_id,
        lane_id: card.lane_id,
        priority: card.priority,
        deadline: card.deadline,
        is_blocked: card.is_blocked,
    };
}

export class CardResourceHandler implements BaseResourceHandler {
    registerResources(server: McpServer, client: BusinessMapClient): void {
        // Return a bounded discovery page. Clients can follow the page resource for more.
        server.registerResource(
            'cards',
            new ResourceTemplate('businessmap://boards/{board_id}/cards', { list: undefined }),
            {}, // Added empty metadata object
            async (uri, variables) => {
                try {
                    const boardId = Number.parseInt(variables.board_id as string);
                    if (Number.isNaN(boardId)) {
                        throw new TypeError(`Invalid board_id: "${variables.board_id}" is not a valid number`);
                    }
                    const cards = await client.cards.getCardsPage(boardId, { page: 1, per_page: 50 });
                    return {
                        contents: [
                            {
                                uri: uri.href,
                                text: JSON.stringify({
                                    ...cards,
                                    data: cards.data.map(compactCard),
                                    next_resource_template:
                                        'businessmap://boards/{board_id}/cards/pages/{page}/size/{per_page}',
                                }, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    throw new Error(`Failed to fetch cards: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        );

        // Get a bounded page of cards for clients that need predictable payload sizes
        server.registerResource(
            'card-page',
            new ResourceTemplate(
                'businessmap://boards/{board_id}/cards/pages/{page}/size/{per_page}',
                { list: undefined }
            ),
            {},
            async (uri, variables) => {
                const boardId = Number.parseInt(variables.board_id as string);
                const page = Number.parseInt(variables.page as string);
                const perPage = Number.parseInt(variables.per_page as string);
                if (Number.isNaN(boardId) || Number.isNaN(page) || Number.isNaN(perPage)) {
                    throw new TypeError('board_id, page, and per_page must be valid numbers');
                }
                if (page < 1 || perPage < 1 || perPage > 100) {
                    throw new RangeError('page must be at least 1 and per_page must be between 1 and 100');
                }
                const cards = await client.cards.getCardsPage(boardId, {
                    page,
                    per_page: perPage,
                });
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: JSON.stringify({ ...cards, data: cards.data.map(compactCard) }, null, 2),
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
                try {
                    const cardId = Number.parseInt(variables.card_id as string);
                    if (Number.isNaN(cardId)) {
                        throw new TypeError(`Invalid card_id: "${variables.card_id}" is not a valid number`);
                    }
                    const card = await client.cards.getCard(cardId);
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
