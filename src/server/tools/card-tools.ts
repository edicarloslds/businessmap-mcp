import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  addCardParentSchema,
  cardSizeSchema,
  createCardSchema,
  createCardSubtaskSchema,
  getCardChildrenSchema,
  getCardCommentSchema,
  getCardHistorySchema,
  getCardLinkedCardsSchema,
  getCardOutcomesSchema,
  getCardParentGraphSchema,
  getCardParentSchema,
  getCardParentsSchema,
  getCardSchema,
  getCardSubtaskSchema,
  getCardSubtasksSchema,
  getCardTypesSchema,
  listCardsSchema,
  moveCardSchema,
  removeCardParentSchema,
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
    this.registerGetCardHistory(server, client);
    this.registerGetCardOutcomes(server, client);
    this.registerGetCardLinkedCards(server, client);
    this.registerGetCardSubtasks(server, client);
    this.registerGetCardSubtask(server, client);
    this.registerGetCardParents(server, client);
    this.registerGetCardParent(server, client);
    this.registerGetCardParentGraph(server, client);
    this.registerGetCardChildren(server, client);

    if (!readOnlyMode) {
      this.registerCreateCard(server, client);
      this.registerMoveCard(server, client);
      this.registerUpdateCard(server, client);
      this.registerSetCardSize(server, client);
      this.registerCreateCardSubtask(server, client);
      this.registerAddCardParent(server, client);
      this.registerRemoveCardParent(server, client);
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

  private registerGetCardHistory(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_history',
      {
        title: 'Get Card History',
        description: 'Get the history of a specific card outcome',
        inputSchema: getCardHistorySchema.shape,
      },
      async ({ card_id, outcome_id }) => {
        try {
          const history = await client.getCardHistory(card_id, outcome_id);
          return createSuccessResponse({
            history,
            count: history.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card history');
        }
      }
    );
  }

  private registerGetCardOutcomes(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_outcomes',
      {
        title: 'Get Card Outcomes',
        description: 'Get all outcomes for a specific card',
        inputSchema: getCardOutcomesSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const outcomes = await client.getCardOutcomes(card_id);
          return createSuccessResponse({
            outcomes,
            count: outcomes.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card outcomes');
        }
      }
    );
  }

  private registerGetCardLinkedCards(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_linked_cards',
      {
        title: 'Get Card Linked Cards',
        description: 'Get all linked cards for a specific card',
        inputSchema: getCardLinkedCardsSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const linkedCards = await client.getCardLinkedCards(card_id);
          return createSuccessResponse({
            linkedCards,
            count: linkedCards.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card linked cards');
        }
      }
    );
  }

  private registerGetCardSubtasks(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_subtasks',
      {
        title: 'Get Card Subtasks',
        description: 'Get all subtasks for a specific card',
        inputSchema: getCardSubtasksSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const subtasks = await client.getCardSubtasks(card_id);
          return createSuccessResponse({
            subtasks,
            count: subtasks.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card subtasks');
        }
      }
    );
  }

  private registerGetCardSubtask(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_subtask',
      {
        title: 'Get Card Subtask',
        description: 'Get details of a specific subtask from a card',
        inputSchema: getCardSubtaskSchema.shape,
      },
      async ({ card_id, subtask_id }) => {
        try {
          const subtask = await client.getCardSubtask(card_id, subtask_id);
          return createSuccessResponse(subtask);
        } catch (error) {
          return createErrorResponse(error, 'getting card subtask');
        }
      }
    );
  }

  private registerCreateCardSubtask(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_card_subtask',
      {
        title: 'Create Card Subtask',
        description: 'Create a new subtask for a card',
        inputSchema: createCardSubtaskSchema.shape,
      },
      async (params) => {
        try {
          const { card_id, ...subtaskData } = params;
          const subtask = await client.createCardSubtask(card_id, subtaskData);
          return createSuccessResponse(subtask, 'Subtask created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card subtask');
        }
      }
    );
  }

  private registerGetCardParents(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_parents',
      {
        title: 'Get Card Parents',
        description: 'Get a list of parent cards for a specific card',
        inputSchema: getCardParentsSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const parents = await client.getCardParents(card_id);
          return createSuccessResponse({
            parents,
            count: parents.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card parents');
        }
      }
    );
  }

  private registerGetCardParent(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_parent',
      {
        title: 'Get Card Parent',
        description: 'Check if a card is a parent of a given card',
        inputSchema: getCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id }) => {
        try {
          const parent = await client.getCardParent(card_id, parent_card_id);
          return createSuccessResponse(parent);
        } catch (error) {
          return createErrorResponse(error, 'getting card parent');
        }
      }
    );
  }

  private registerAddCardParent(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'add_card_parent',
      {
        title: 'Add Card Parent',
        description: 'Make a card a parent of a given card',
        inputSchema: addCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id }) => {
        try {
          const result = await client.addCardParent(card_id, parent_card_id);
          return createSuccessResponse(result, 'Card parent added successfully:');
        } catch (error) {
          return createErrorResponse(error, 'adding card parent');
        }
      }
    );
  }

  private registerRemoveCardParent(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'remove_card_parent',
      {
        title: 'Remove Card Parent',
        description: 'Remove the link between a child card and a parent card',
        inputSchema: removeCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id }) => {
        try {
          await client.removeCardParent(card_id, parent_card_id);
          return createSuccessResponse(
            { card_id, parent_card_id },
            'Card parent removed successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'removing card parent');
        }
      }
    );
  }

  private registerGetCardParentGraph(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_parent_graph',
      {
        title: 'Get Card Parent Graph',
        description: 'Get a list of parent cards including their parent cards too',
        inputSchema: getCardParentGraphSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const parentGraph = await client.getCardParentGraph(card_id);
          return createSuccessResponse({
            parentGraph,
            count: parentGraph.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card parent graph');
        }
      }
    );
  }

  private registerGetCardChildren(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_children',
      {
        title: 'Get Card Children',
        description: 'Get a list of child cards of a specified parent card',
        inputSchema: getCardChildrenSchema.shape,
      },
      async ({ card_id }) => {
        try {
          const children = await client.getCardChildren(card_id);
          return createSuccessResponse({
            children,
            count: children.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card children');
        }
      }
    );
  }
}
