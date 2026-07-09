import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  addCardParentSchema,
  addPredecessorSchema,
  addStickerToCardSchema,
  addTagToCardSchema,
  blockCardSchema,
  cardCommentsSchema,
  cardSizeSchema,
  createCardSchema,
  createCardSubtaskSchema,
  createCommentSchema,
  createTagSchema,
  deleteCardSchema,
  deleteCardSubtaskSchema,
  deleteCommentSchema,
  getCardBlockedTimesSchema,
  getCardChildGraphSchema,
  getCardChildrenSchema,
  getCardCommentSchema,
  getCardFlowHistorySchema,
  getCardHistorySchema,
  getCardLinkedCardsSchema,
  getCardLoggedTimeSchema,
  getCardOutcomesSchema,
  getCardParentGraphSchema,
  getCardParentSchema,
  getCardParentsSchema,
  getCardRevisionsSchema,
  getCardSchema,
  getCardSubtaskSchema,
  getCardSubtasksSchema,
  getCardTypesSchema,
  listCardsSchema,
  moveCardSchema,
  removeCardParentSchema,
  removePredecessorSchema,
  removeStickerFromCardSchema,
  removeTagFromCardSchema,
  searchCardsSchema,
  unblockCardSchema,
  updateCardSchema,
  updateCardSubtaskSchema,
  updateCommentSchema,
} from '../../schemas/index.js';
import {
  BaseToolHandler,
  DESTRUCTIVE,
  DESTRUCTIVE_IDEMPOTENT,
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  registerTool,
} from './base-tool.js';

export class CardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerReadTools(server, client);

    if (!readOnlyMode) {
      this.registerCardWriteTools(server, client);
      this.registerSubtaskWriteTools(server, client);
      this.registerRelationshipWriteTools(server, client);
      this.registerCommentWriteTools(server, client);
      this.registerTagStickerWriteTools(server, client);
    }
  }

  private registerReadTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'list_cards',
      title: 'List Cards',
      description:
        'Get a list of cards from a board with optional filters. Set include_pagination to return pagination metadata.',
      schema: listCardsSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching cards',
      handler: ({ board_id, include_pagination, ...filters }) =>
        include_pagination
          ? client.cards.getCardsPage(board_id, filters)
          : client.cards.getCards(board_id, filters),
    });

    registerTool(server, {
      name: 'search_cards',
      title: 'Search Cards',
      description:
        'Search for cards across all boards (or a subset of boards) using advanced filters: owners, priorities, sizes, blocked state, types, dates, lifecycle state and more',
      schema: searchCardsSchema,
      annotations: READ_ONLY,
      errorContext: 'searching cards',
      handler: (params) => client.cards.searchCards(params),
    });

    registerTool(server, {
      name: 'get_card',
      title: 'Get Card',
      description: 'Get details of a specific card',
      schema: getCardSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching card',
      handler: ({ card_id }) => client.cards.getCard(card_id),
    });

    registerTool(server, {
      name: 'get_card_size',
      title: 'Get Card Size',
      description: 'Get the size/points of a specific card',
      schema: getCardSchema,
      annotations: READ_ONLY,
      errorContext: 'fetching card size',
      handler: async ({ card_id }) => {
        const card = await client.cards.getCard(card_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Card "${card.title}" (ID: ${card_id}) has size: ${card.size || 0} points`,
            },
          ],
        };
      },
    });

    registerTool(server, {
      name: 'get_card_logged_time',
      title: 'Get Card Logged Time',
      description:
        'Get the time logged on a card (and optionally its subtasks), with the individual logged time entries',
      schema: getCardLoggedTimeSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card logged time',
      handler: async ({ card_id, include_subtasks }) => {
        const entries = await client.cards.getCardLoggedTimes(card_id, include_subtasks ?? true);
        const totalTime = entries.reduce((sum, entry) => sum + (entry.time || 0), 0);
        return { total_time: totalTime, entries, count: entries.length };
      },
    });

    registerTool(server, {
      name: 'get_card_blocked_times',
      title: 'Get Card Blocked Times',
      description:
        'Get the full blocking history of a card, including when and where blocks occurred',
      schema: getCardBlockedTimesSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card blocked times',
      handler: async ({ card_id }) => {
        const card = await client.cards.getCardBlockTimes(card_id);
        if (!card) {
          throw new Error(`Card ${card_id} not found`);
        }
        return card;
      },
    });

    registerTool(server, {
      name: 'get_card_flow_history',
      title: 'Get Card Flow History',
      description:
        "Get the card's movement history (transitions) across boards, workflows and columns with timing details",
      schema: getCardFlowHistorySchema,
      annotations: READ_ONLY,
      errorContext: 'getting card flow history',
      handler: async ({ card_id }) => {
        const card = await client.cards.getCardTransitions(card_id);
        if (!card) {
          throw new Error(`Card ${card_id} not found`);
        }
        return card;
      },
    });

    registerTool(server, {
      name: 'get_card_comments',
      title: 'Get Card Comments',
      description: 'Get all comments for a specific card',
      schema: cardCommentsSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card comments',
      handler: async ({ card_id }) => {
        const comments = await client.cards.getCardComments(card_id);
        return { comments, count: comments.length };
      },
    });

    registerTool(server, {
      name: 'get_card_comment',
      title: 'Get Card Comment',
      description: 'Get details of a specific comment from a card',
      schema: getCardCommentSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card comment',
      handler: ({ card_id, comment_id }) => client.cards.getCardComment(card_id, comment_id),
    });

    registerTool(server, {
      name: 'get_card_custom_fields',
      title: 'Get Card Custom Fields',
      description: 'Get all custom fields for a specific card',
      schema: getCardSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card custom fields',
      handler: async ({ card_id }) => {
        const customFields = await client.cards.getCardCustomFields(card_id);
        return { customFields, count: customFields.length };
      },
    });

    registerTool(server, {
      name: 'get_card_types',
      title: 'Get Card Types',
      description: 'Get all available card types',
      schema: getCardTypesSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card types',
      handler: async () => {
        const cardTypes = await client.cards.getCardTypes();
        return { cardTypes, count: cardTypes.length };
      },
    });

    registerTool(server, {
      name: 'get_card_history',
      title: 'Get Card History',
      description: 'Get the history of a specific card outcome',
      schema: getCardHistorySchema,
      annotations: READ_ONLY,
      errorContext: 'getting card history',
      handler: async ({ card_id, outcome_id }) => {
        const history = await client.cards.getCardHistory(card_id, outcome_id);
        return { history, count: history.length };
      },
    });

    registerTool(server, {
      name: 'get_card_outcomes',
      title: 'Get Card Outcomes',
      description: 'Get all outcomes for a specific card',
      schema: getCardOutcomesSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card outcomes',
      handler: async ({ card_id }) => {
        const outcomes = await client.cards.getCardOutcomes(card_id);
        return { outcomes, count: outcomes.length };
      },
    });

    registerTool(server, {
      name: 'get_card_linked_cards',
      title: 'Get Card Linked Cards',
      description: 'Get all linked cards for a specific card',
      schema: getCardLinkedCardsSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card linked cards',
      handler: async ({ card_id }) => {
        const linkedCards = await client.cards.getCardLinkedCards(card_id);
        return { linkedCards, count: linkedCards.length };
      },
    });

    registerTool(server, {
      name: 'get_card_subtasks',
      title: 'Get Card Subtasks',
      description: 'Get all subtasks for a specific card',
      schema: getCardSubtasksSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card subtasks',
      handler: async ({ card_id }) => {
        const subtasks = await client.cards.getCardSubtasks(card_id);
        return { subtasks, count: subtasks.length };
      },
    });

    registerTool(server, {
      name: 'get_card_subtask',
      title: 'Get Card Subtask',
      description: 'Get details of a specific subtask from a card',
      schema: getCardSubtaskSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card subtask',
      handler: ({ card_id, subtask_id }) => client.cards.getCardSubtask(card_id, subtask_id),
    });

    registerTool(server, {
      name: 'get_card_parents',
      title: 'Get Card Parents',
      description: 'Get a list of parent cards for a specific card',
      schema: getCardParentsSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card parents',
      handler: async ({ card_id }) => {
        const parents = await client.cards.getCardParents(card_id);
        return { parents, count: parents.length };
      },
    });

    registerTool(server, {
      name: 'get_card_parent',
      title: 'Get Card Parent',
      description: 'Check if a card is a parent of a given card',
      schema: getCardParentSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card parent',
      handler: ({ card_id, parent_card_id }) => client.cards.getCardParent(card_id, parent_card_id),
    });

    registerTool(server, {
      name: 'get_card_parent_graph',
      title: 'Get Card Parent Graph',
      description: 'Get a list of parent cards including their parent cards too',
      schema: getCardParentGraphSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card parent graph',
      handler: async ({ card_id }) => {
        const parentGraph = await client.cards.getCardParentGraph(card_id);
        return { parentGraph, count: parentGraph.length };
      },
    });

    registerTool(server, {
      name: 'get_card_children',
      title: 'Get Card Children',
      description: 'Get a list of child cards of a specified parent card',
      schema: getCardChildrenSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card children',
      handler: async ({ card_id }) => {
        const children = await client.cards.getCardChildren(card_id);
        return { children, count: children.length };
      },
    });

    registerTool(server, {
      name: 'get_card_child_graph',
      title: 'Get Card Child Graph',
      description: "Get the hierarchical graph of a card's children, including children of children",
      schema: getCardChildGraphSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card child graph',
      handler: async ({ card_id }) => {
        const graph = await client.cards.getCardChildGraph(card_id);
        return { children: graph, count: graph.length };
      },
    });

    registerTool(server, {
      name: 'get_card_revisions',
      title: 'Get Card Revisions',
      description:
        'Get the chronological change history (revisions) of a card. Pass a revision number to get the full card state at that revision.',
      schema: getCardRevisionsSchema,
      annotations: READ_ONLY,
      errorContext: 'getting card revisions',
      handler: async ({ card_id, revision }) => {
        if (revision !== undefined) {
          return client.cards.getCardRevision(card_id, revision);
        }
        const revisions = await client.cards.getCardRevisions(card_id);
        return { revisions, count: revisions.length };
      },
    });
  }

  private registerCardWriteTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'create_card',
      title: 'Create Card',
      description: 'Create a new card in a board',
      schema: createCardSchema,
      annotations: WRITE,
      errorContext: 'creating card',
      successMessage: 'Card created successfully:',
      handler: (params) => client.cards.createCard(params),
    });

    registerTool(server, {
      name: 'move_card',
      title: 'Move Card',
      description: 'Move a card to a different column or lane',
      schema: moveCardSchema,
      annotations: WRITE,
      errorContext: 'moving card',
      successMessage: 'Card moved successfully:',
      handler: ({ card_id, column_id, lane_id, position }) =>
        client.cards.moveCard(card_id, column_id, lane_id, position),
    });

    registerTool(server, {
      name: 'update_card',
      title: 'Update Card',
      description: "Update a card's properties",
      schema: updateCardSchema,
      annotations: WRITE,
      errorContext: 'updating card',
      successMessage: 'Card updated successfully:',
      handler: (params) => client.cards.updateCard(params),
    });

    registerTool(server, {
      name: 'set_card_size',
      title: 'Set Card Size',
      description: 'Set the size/points of a specific card',
      schema: cardSizeSchema,
      annotations: WRITE,
      errorContext: 'setting card size',
      handler: async ({ card_id, size }) => {
        const card = await client.cards.updateCard({ card_id, size });
        return {
          content: [
            {
              type: 'text' as const,
              text: `Card "${card.title}" (ID: ${card_id}) size updated to: ${size} points`,
            },
          ],
        };
      },
    });

    registerTool(server, {
      name: 'delete_card',
      title: 'Delete Card',
      description:
        'Permanently delete a card. This action cannot be undone and the card cannot be recovered.',
      schema: deleteCardSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'deleting card',
      successMessage: 'Card deleted successfully:',
      handler: async ({ card_id }) => {
        await client.cards.deleteCard(card_id);
        return { card_id };
      },
    });

    registerTool(server, {
      name: 'block_card',
      title: 'Block Card',
      description: 'Block a card and set a reason/comment explaining why it is blocked',
      schema: blockCardSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'blocking card',
      successMessage: 'Card blocked successfully:',
      handler: async ({ card_id, reason }) => {
        await client.cards.blockCard(card_id, reason);
        return { card_id, reason };
      },
    });

    registerTool(server, {
      name: 'unblock_card',
      title: 'Unblock Card',
      description: 'Unblock a card by removing its block reason',
      schema: unblockCardSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'unblocking card',
      successMessage: 'Card unblocked successfully:',
      handler: async ({ card_id }) => {
        await client.cards.unblockCard(card_id);
        return { card_id };
      },
    });
  }

  private registerSubtaskWriteTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'create_card_subtask',
      title: 'Create Card Subtask',
      description: 'Create a new subtask for a card',
      schema: createCardSubtaskSchema,
      annotations: WRITE,
      errorContext: 'creating card subtask',
      successMessage: 'Subtask created successfully:',
      handler: ({ card_id, ...subtaskData }) => client.cards.createCardSubtask(card_id, subtaskData),
    });

    registerTool(server, {
      name: 'update_card_subtask',
      title: 'Update Card Subtask',
      description:
        'Update an existing subtask of a card (description, owner, finished state, deadline, position)',
      schema: updateCardSubtaskSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'updating card subtask',
      successMessage: 'Subtask updated successfully:',
      handler: ({ card_id, subtask_id, ...subtaskData }) =>
        client.cards.updateCardSubtask(card_id, subtask_id, subtaskData),
    });

    registerTool(server, {
      name: 'delete_card_subtask',
      title: 'Delete Card Subtask',
      description: 'Delete a subtask from a card',
      schema: deleteCardSubtaskSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'deleting card subtask',
      successMessage: 'Subtask deleted successfully:',
      handler: async ({ card_id, subtask_id }) => {
        await client.cards.deleteCardSubtask(card_id, subtask_id);
        return { card_id, subtask_id };
      },
    });
  }

  private registerRelationshipWriteTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'add_card_parent',
      title: 'Add Card Parent',
      description: 'Make a card a parent of a given card',
      schema: addCardParentSchema,
      annotations: WRITE,
      errorContext: 'adding card parent',
      successMessage: 'Card parent added successfully:',
      handler: ({ card_id, parent_card_id }) => client.cards.addCardParent(card_id, parent_card_id),
    });

    registerTool(server, {
      name: 'remove_card_parent',
      title: 'Remove Card Parent',
      description: 'Remove the link between a child card and a parent card',
      schema: removeCardParentSchema,
      annotations: DESTRUCTIVE,
      errorContext: 'removing card parent',
      successMessage: 'Card parent removed successfully:',
      handler: async ({ card_id, parent_card_id }) => {
        await client.cards.removeCardParent(card_id, parent_card_id);
        return { card_id, parent_card_id };
      },
    });

    registerTool(server, {
      name: 'add_predecessor',
      title: 'Add Predecessor',
      description:
        'Establish or update a predecessor-successor relationship between two cards. The predecessor_card_id becomes a prerequisite that must be completed before the card.',
      schema: addPredecessorSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'adding predecessor',
      successMessage: 'Predecessor added successfully:',
      handler: async ({ card_id, predecessor_card_id, linked_card_position, card_position }) => {
        await client.cards.addPredecessor(card_id, predecessor_card_id, {
          ...(linked_card_position !== undefined && { linked_card_position }),
          ...(card_position !== undefined && { card_position }),
        });
        return { card_id, predecessor_card_id };
      },
    });

    registerTool(server, {
      name: 'remove_predecessor',
      title: 'Remove Predecessor',
      description: 'Remove the predecessor-successor relationship between two cards.',
      schema: removePredecessorSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'removing predecessor',
      successMessage: 'Predecessor removed successfully:',
      handler: async ({ card_id, predecessor_card_id }) => {
        await client.cards.removePredecessor(card_id, predecessor_card_id);
        return { card_id, predecessor_card_id };
      },
    });
  }

  private registerCommentWriteTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'create_comment',
      title: 'Create Comment',
      description: 'Add a new comment to a card',
      schema: createCommentSchema,
      annotations: WRITE,
      errorContext: 'creating comment',
      successMessage: 'Comment created successfully:',
      handler: ({ card_id, text }) => client.cards.createCardComment(card_id, { text }),
    });

    registerTool(server, {
      name: 'update_comment',
      title: 'Update Comment',
      description: 'Update the text of an existing comment on a card',
      schema: updateCommentSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'updating comment',
      successMessage: 'Comment updated successfully:',
      handler: ({ card_id, comment_id, text }) =>
        client.cards.updateCardComment(card_id, comment_id, { text }),
    });

    registerTool(server, {
      name: 'delete_comment',
      title: 'Delete Comment',
      description: 'Delete a comment from a card',
      schema: deleteCommentSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'deleting comment',
      successMessage: 'Comment deleted successfully:',
      handler: async ({ card_id, comment_id }) => {
        await client.cards.deleteCardComment(card_id, comment_id);
        return { card_id, comment_id };
      },
    });
  }

  private registerTagStickerWriteTools(server: McpServer, client: BusinessMapClient): void {
    registerTool(server, {
      name: 'create_tag',
      title: 'Create Tag',
      description: 'Create a new tag in the workspace',
      schema: createTagSchema,
      annotations: WRITE,
      errorContext: 'creating tag',
      successMessage: 'Tag created successfully:',
      handler: ({ label, color }) => client.cards.createTag({ label, color }),
    });

    registerTool(server, {
      name: 'add_tag_to_card',
      title: 'Add Tag to Card',
      description: 'Add an existing tag to a card',
      schema: addTagToCardSchema,
      annotations: WRITE_IDEMPOTENT,
      errorContext: 'adding tag to card',
      successMessage: 'Tag added to card successfully:',
      handler: async ({ card_id, tag_id }) => {
        await client.cards.addTagToCard(card_id, tag_id);
        return { card_id, tag_id };
      },
    });

    registerTool(server, {
      name: 'remove_tag_from_card',
      title: 'Remove Tag from Card',
      description: 'Remove a tag from a card',
      schema: removeTagFromCardSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'removing tag from card',
      successMessage: 'Tag removed from card successfully:',
      handler: async ({ card_id, tag_id }) => {
        await client.cards.removeTagFromCard(card_id, tag_id);
        return { card_id, tag_id };
      },
    });

    registerTool(server, {
      name: 'add_sticker_to_card',
      title: 'Add Sticker to Card',
      description: 'Add a sticker to a card',
      schema: addStickerToCardSchema,
      annotations: WRITE,
      errorContext: 'adding sticker to card',
      successMessage: 'Sticker added to card successfully:',
      handler: ({ card_id, sticker_id }) => client.cards.addStickerToCard(card_id, sticker_id),
    });

    registerTool(server, {
      name: 'remove_sticker_from_card',
      title: 'Remove Sticker from Card',
      description:
        'Remove a sticker from a card using the sticker-card association ID ' +
        '(the "id" field returned when listing or adding stickers to a card)',
      schema: removeStickerFromCardSchema,
      annotations: DESTRUCTIVE_IDEMPOTENT,
      errorContext: 'removing sticker from card',
      successMessage: 'Sticker removed from card successfully:',
      handler: async ({ card_id, sticker_card_id }) => {
        await client.cards.removeStickerFromCard(card_id, sticker_card_id);
        return { card_id, sticker_card_id };
      },
    });
  }
}
