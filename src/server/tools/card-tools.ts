import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class CardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListCards(server, client);
    this.registerGetCard(server, client);
    this.registerGetCardSize(server, client);

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
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),
          column_id: z.number().optional().describe('Optional column ID to filter cards'),
          swimlane_id: z.number().optional().describe('Optional swimlane ID to filter cards'),
          assignee_user_id: z
            .number()
            .optional()
            .describe('Optional assignee user ID to filter cards'),
        },
      },
      async ({ board_id, column_id, swimlane_id, assignee_user_id }) => {
        try {
          const filters = { column_id, swimlane_id, assignee_user_id };
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
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
        inputSchema: {
          title: z.string().describe('The title of the card'),
          board_id: z.number().describe('The ID of the board'),
          column_id: z.number().describe('The ID of the column'),
          description: z.string().optional().describe('Optional description for the card'),
          swimlane_id: z.number().optional().describe('Optional swimlane ID'),
          type_id: z.number().optional().describe('Optional card type ID'),
          size: z.number().optional().describe('Optional card size/points'),
          priority: z.number().optional().describe('Priority level'),
          owner_user_id: z.number().optional().describe('Optional owner user ID'),
          assignee_user_id: z.number().optional().describe('Optional assignee user ID'),
          deadline: z.string().optional().describe('Optional deadline (ISO date string)'),
        },
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
        description: 'Move a card to a different column or swimlane',
        inputSchema: {
          card_id: z.number().describe('The ID of the card to move'),
          column_id: z.number().describe('The target column ID'),
          swimlane_id: z.number().optional().describe('Optional target swimlane ID'),
          position: z.number().optional().describe('Optional position in the column'),
        },
      },
      async ({ card_id, column_id, swimlane_id, position }) => {
        try {
          const card = await client.moveCard(card_id, column_id, swimlane_id, position);
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card to update'),
          title: z.string().optional().describe('New title for the card'),
          description: z.string().optional().describe('New description for the card'),
          priority: z.string().optional().describe('New priority level'),
          assignee_user_id: z.number().optional().describe('New assignee user ID'),
          deadline: z.string().optional().describe('New deadline (ISO date string)'),
          size: z.number().optional().describe('New card size/points'),
        },
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card to update'),
          size: z.number().describe('The new size/points for the card'),
        },
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
}
