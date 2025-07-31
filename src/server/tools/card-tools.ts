import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  cardSizeSchema,
  createCardSchema,
  getCardCommentSchema,
  getCardSchema,
  getCardTypesSchema,
  listCardsSchema,
  moveCardSchema,
  updateCardSchema,
} from '../../schemas/index.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class CardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListCards(server, client);
    this.registerGetCard(server, client);
    this.registerGetCardSize(server, client);
    this.registerGetCardComments(server, client);
    this.registerGetCardComment(server, client);
    this.registerGetCardCustomFields(server, client);
    this.registerGetCardTypes(server, client);

    if (!readOnlyMode) {
      this.registerCreateCard(server, client);
      this.registerMoveCard(server, client);
      this.registerUpdateCard(server, client);
      this.registerSetCardSize(server, client);
    }
  }

  private registerListCards(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_cards',
      {
        title: 'List Cards',
        description: 'Get a list of cards from a board with optional filters',
        inputSchema: listCardsSchema.shape,
      },
      async (params) => {
        try {
          const { board_id, ...filters } = params;
          const cards = await client.getCards(board_id, filters);
          return createSuccessResponse(cards);
        } catch (error) {
          return createErrorResponse(error, 'fetching cards');
        }
      }
    );
  }

  private registerGetCard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card',
      {
        title: 'Get Card',
        description: 'Get details of a specific card',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const card = await client.getCard(card_id);
          return createSuccessResponse(card);
        } catch (error) {
          return createErrorResponse(error, 'fetching card');
        }
      }
    );
  }

  private registerGetCardSize(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_size',
      {
        title: 'Get Card Size',
        description: 'Get the size/points of a specific card',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const card = await client.getCard(card_id);
          const size = card.size || 0;
          return {
            content: [
              {
                type: 'text',
                text: `Card "${card.title}" (ID: ${card_id}) has size: ${size} points`,
              },
            ],
          };
        } catch (error) {
          return createErrorResponse(error, 'fetching card size');
        }
      }
    );
  }

  private registerCreateCard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_card',
      {
        title: 'Create Card',
        description: 'Create a new card in a board',
        inputSchema: createCardSchema.shape,
      },
      async (params) => {
        try {
          const card = await client.createCard(params);
          return createSuccessResponse(card, 'Card created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card');
        }
      }
    );
  }

  private registerMoveCard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'move_card',
      {
        title: 'Move Card',
        description: 'Move a card to a different column or lane',
        inputSchema: moveCardSchema.shape,
      },
      async ({ card_id, column_id, lane_id, position }) => {
        try {
          const card = await client.moveCard(card_id, column_id, lane_id, position);
          return createSuccessResponse(card, 'Card moved successfully:');
        } catch (error) {
          return createErrorResponse(error, 'moving card');
        }
      }
    );
  }

  private registerUpdateCard(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_card',
      {
        title: 'Update Card',
        description: "Update a card's properties",
        inputSchema: updateCardSchema.shape,
      },
      async (params) => {
        try {
          const card = await client.updateCard(params);
          return createSuccessResponse(card, 'Card updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating card');
        }
      }
    );
  }

  private registerSetCardSize(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'set_card_size',
      {
        title: 'Set Card Size',
        description: 'Set the size/points of a specific card',
        inputSchema: cardSizeSchema.shape,
      },
      async ({ card_id, size }) => {
        try {
          const card = await client.updateCard({ card_id, size });
          return {
            content: [
              {
                type: 'text',
                text: `Card "${card.title}" (ID: ${card_id}) size updated to: ${size} points`,
              },
            ],
          };
        } catch (error) {
          return createErrorResponse(error, 'setting card size');
        }
      }
    );
  }

  private registerGetCardComments(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_comments',
      {
        title: 'Get Card Comments',
        description: 'Get all comments for a specific card',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const comments = await client.getCardComments(card_id);
          return createSuccessResponse({
            comments,
            count: comments.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card comments');
        }
      }
    );
  }

  private registerGetCardComment(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_comment',
      {
        title: 'Get Card Comment',
        description: 'Get details of a specific comment from a card',
        inputSchema: getCardCommentSchema.shape,
      },
      async ({ card_id, comment_id }) => {
        try {
          const comment = await client.getCardComment(card_id, comment_id);
          return createSuccessResponse(comment);
        } catch (error) {
          return createErrorResponse(error, 'getting card comment');
        }
      }
    );
  }

  private registerGetCardCustomFields(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_custom_fields',
      {
        title: 'Get Card Custom Fields',
        description: 'Get all custom fields for a specific card',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const customFields = await client.getCardCustomFields(card_id);
          return createSuccessResponse({
            customFields,
            count: customFields.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card custom fields');
        }
      }
    );
  }

  private registerGetCardTypes(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_types',
      {
        title: 'Get Card Types',
        description: 'Get all available card types',
        inputSchema: getCardTypesSchema.shape,
      },
      async () => {
        try {
          const cardTypes = await client.getCardTypes();
          return createSuccessResponse({
            cardTypes,
            count: cardTypes.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card types');
        }
      }
    );
  }
}
