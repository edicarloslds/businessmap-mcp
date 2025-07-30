import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BusinessMapClient } from '../../client/businessmap-client.js';
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
        inputSchema: {
          board_id: z.number().describe('The ID of the board'),

          // Date and time filters
          archived_from: z
            .string()
            .optional()
            .describe('The first date and time of archived cards for which you want results'),
          archived_from_date: z
            .string()
            .optional()
            .describe('The first date of archived cards for which you want results'),
          archived_to: z
            .string()
            .optional()
            .describe('The last date and time of archived cards for which you want results'),
          archived_to_date: z
            .string()
            .optional()
            .describe('The last date of archived cards for which you want results'),
          created_from: z
            .string()
            .optional()
            .describe('The first date and time of created cards for which you want results'),
          created_from_date: z
            .string()
            .optional()
            .describe('The first date of created cards for which you want results'),
          created_to: z
            .string()
            .optional()
            .describe('The last date and time of created cards for which you want results'),
          created_to_date: z
            .string()
            .optional()
            .describe('The last date of created cards for which you want results'),
          deadline_from: z
            .string()
            .optional()
            .describe('The first date and time of deadline cards for which you want results'),
          deadline_from_date: z
            .string()
            .optional()
            .describe('The first date of deadline cards for which you want results'),
          deadline_to: z
            .string()
            .optional()
            .describe('The last date and time of deadline cards for which you want results'),
          deadline_to_date: z
            .string()
            .optional()
            .describe('The last date of deadline cards for which you want results'),
          discarded_from: z
            .string()
            .optional()
            .describe('The first date and time of discarded cards for which you want results'),
          discarded_from_date: z
            .string()
            .optional()
            .describe('The first date of discarded cards for which you want results'),
          discarded_to: z
            .string()
            .optional()
            .describe('The last date and time of discarded cards for which you want results'),
          discarded_to_date: z
            .string()
            .optional()
            .describe('The last date of discarded cards for which you want results'),
          first_end_from: z
            .string()
            .optional()
            .describe('The first date and time of first end cards for which you want results'),
          first_end_from_date: z
            .string()
            .optional()
            .describe('The first date of first end cards for which you want results'),
          first_end_to: z
            .string()
            .optional()
            .describe('The last date and time of first end cards for which you want results'),
          first_end_to_date: z
            .string()
            .optional()
            .describe('The last date of first end cards for which you want results'),
          first_start_from: z
            .string()
            .optional()
            .describe('The first date and time of first start cards for which you want results'),
          first_start_from_date: z
            .string()
            .optional()
            .describe('The first date of first start cards for which you want results'),
          first_start_to: z
            .string()
            .optional()
            .describe('The last date and time of first start cards for which you want results'),
          first_start_to_date: z
            .string()
            .optional()
            .describe('The last date of first start cards for which you want results'),
          in_current_position_since_from: z
            .string()
            .optional()
            .describe(
              'The first date and time of in current position since cards for which you want results'
            ),
          in_current_position_since_from_date: z
            .string()
            .optional()
            .describe(
              'The first date of in current position since cards for which you want results'
            ),
          in_current_position_since_to: z
            .string()
            .optional()
            .describe(
              'The last date and time of in current position since cards for which you want results'
            ),
          in_current_position_since_to_date: z
            .string()
            .optional()
            .describe(
              'The last date of in current position since cards for which you want results'
            ),
          last_end_from: z
            .string()
            .optional()
            .describe('The first date and time of last end cards for which you want results'),
          last_end_from_date: z
            .string()
            .optional()
            .describe('The first date of last end cards for which you want results'),
          last_end_to: z
            .string()
            .optional()
            .describe('The last date and time of last end cards for which you want results'),
          last_end_to_date: z
            .string()
            .optional()
            .describe('The last date of last end cards for which you want results'),
          last_modified_from: z
            .string()
            .optional()
            .describe('The first date and time of last modified cards for which you want results'),
          last_modified_from_date: z
            .string()
            .optional()
            .describe('The first date of last modified cards for which you want results'),
          last_modified_to: z
            .string()
            .optional()
            .describe('The last date and time of last modified cards for which you want results'),
          last_modified_to_date: z
            .string()
            .optional()
            .describe('The last date of last modified cards for which you want results'),
          last_start_from: z
            .string()
            .optional()
            .describe('The first date and time of last start cards for which you want results'),
          last_start_from_date: z
            .string()
            .optional()
            .describe('The first date of last start cards for which you want results'),
          last_start_to: z
            .string()
            .optional()
            .describe('The last date and time of last start cards for which you want results'),
          last_start_to_date: z
            .string()
            .optional()
            .describe('The last date of last start cards for which you want results'),

          // ID filters (arrays)
          board_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the board ids for which you want to get the results'),
          card_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the card ids that you want to get'),
          column_ids: z
            .array(z.number())
            .optional()
            .describe(
              'A list of the column ids for which you want to get the results. Applied only if state parameter is active'
            ),
          lane_ids: z
            .array(z.number())
            .optional()
            .describe(
              'A list of the lane ids for which you want to get the results. Applied only if state parameter is active'
            ),
          last_column_ids: z
            .array(z.number())
            .optional()
            .describe(
              'A list of the last column ids for which you want to get the results. Applied only if state parameter is archived or discarded'
            ),
          last_lane_ids: z
            .array(z.number())
            .optional()
            .describe(
              'A list of the last lane ids for which you want to get the results. Applied only if state parameter is archived or discarded'
            ),
          owner_user_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the user ids of assignees for which you want to get the results'),
          priorities: z
            .array(z.number())
            .optional()
            .describe('A list of the priorities for which you want to get the results'),
          reason_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the reasons ids for which you want to get the results'),
          sections: z
            .array(z.number())
            .optional()
            .describe('A list of the sections for which you want to get the results'),
          sizes: z
            .array(z.number())
            .optional()
            .describe('A list of the sizes for which you want to get the results'),
          type_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the type ids for which you want to get the results'),
          version_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the version ids for which you want to get the results'),
          workflow_ids: z
            .array(z.number())
            .optional()
            .describe('A list of the workflows ids for which you want to get the results'),

          // String array filters
          colors: z
            .array(z.string())
            .optional()
            .describe('A list of the colors for which you want to get the results'),
          custom_ids: z
            .array(z.string())
            .optional()
            .describe('A list of the custom ids for which you want to get the results'),

          // Configuration options
          include_logged_time_for_child_cards: z
            .number()
            .optional()
            .describe('Controls whether this include logged times for child cards (0 or 1)'),
          include_logged_time_for_subtasks: z
            .number()
            .optional()
            .describe('Controls whether this include logged times for subtasks (0 or 1)'),

          // Pagination
          page: z
            .number()
            .optional()
            .describe(
              'Results are always paginated and returned in pages. This parameter controls which page is returned'
            ),
          per_page: z
            .number()
            .optional()
            .describe(
              'Controls how many results are returned per page. The default value is 200 and the maximum is 1000'
            ),

          // Legacy compatibility
          assignee_user_id: z
            .number()
            .optional()
            .describe('Optional assignee user ID to filter cards (legacy parameter)'),
          tag_ids: z
            .array(z.number())
            .optional()
            .describe('Optional array of tag IDs to filter cards (legacy parameter)'),
        },
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
          column_id: z.number().describe('The ID of the column'),
          template_id: z.number().optional().describe('Optional template ID'),
          card_properties_to_copy: z
            .array(
              z.object({
                properties: z.array(z.string()),
                card_id: z.number(),
              })
            )
            .optional()
            .describe('Optional card properties to copy'),
          custom_fields_to_copy: z
            .array(
              z.object({
                field_ids: z.array(z.number()),
                card_id: z.number(),
              })
            )
            .optional()
            .describe('Optional custom fields to copy'),
          lane_id: z.number().optional().describe('Optional lane ID'),
          position: z.number().optional().describe('Optional position'),
          track: z.number().optional().describe('Optional track'),
          planned_start_date_sync_type: z
            .number()
            .optional()
            .describe('Optional planned start date sync type'),
          planned_start_date: z.string().optional().describe('Optional planned start date'),
          planned_end_date_sync_type: z
            .number()
            .optional()
            .describe('Optional planned end date sync type'),
          planned_end_date: z.string().optional().describe('Optional planned end date'),
          actual_start_time: z.string().optional().describe('Optional actual start time'),
          actual_end_time: z.string().optional().describe('Optional actual end time'),
          description: z.string().optional().describe('Optional description for the card'),
          custom_id: z.string().optional().describe('Optional custom ID'),
          owner_user_id: z.number().optional().describe('Optional owner user ID'),
          type_id: z.number().optional().describe('Optional card type ID'),
          size: z.number().optional().describe('Optional card size/points'),
          priority: z.number().optional().describe('Optional priority level'),
          color: z.string().optional().describe('Optional color'),
          deadline: z.string().optional().describe('Optional deadline (ISO date string)'),
          reference: z.string().optional().describe('Optional reference'),
          block_reason: z
            .object({
              reason_id: z.number(),
              comment: z.string(),
              users: z.array(z.number()),
              date: z.string(),
              cards: z.array(z.number()),
            })
            .optional()
            .describe('Optional block reason'),
          stickers_to_add: z
            .array(
              z.object({
                sticker_id: z.number(),
                if_not_present: z.number(),
              })
            )
            .optional()
            .describe('Optional stickers to add'),
          tag_ids_to_add: z.array(z.number()).optional().describe('Optional tag IDs to add'),
          tag_ids_to_remove: z.array(z.number()).optional().describe('Optional tag IDs to remove'),
          milestone_ids_to_add: z
            .array(z.number())
            .optional()
            .describe('Optional milestone IDs to add'),
          milestone_ids_to_remove: z
            .array(z.number())
            .optional()
            .describe('Optional milestone IDs to remove'),
          co_owner_ids_to_add: z
            .array(z.number())
            .optional()
            .describe('Optional co-owner IDs to add'),
          co_owner_ids_to_remove: z
            .array(z.number())
            .optional()
            .describe('Optional co-owner IDs to remove'),
          watcher_ids_to_add: z
            .array(z.number())
            .optional()
            .describe('Optional watcher IDs to add'),
          watcher_ids_to_remove: z
            .array(z.number())
            .optional()
            .describe('Optional watcher IDs to remove'),
          custom_fields_to_add_or_update: z
            .array(
              z.object({
                field_id: z.number(),
                value: z.string(),
                selected_values_to_add_or_update: z
                  .array(
                    z.object({
                      value_id: z.number(),
                      position: z.number(),
                    })
                  )
                  .optional(),
                selected_value_ids_to_remove: z.array(z.number()).optional(),
                other_value: z.string().optional(),
                contributor_ids_to_add: z.array(z.number()).optional(),
                contributor_ids_to_remove: z.array(z.number()).optional(),
                files_to_add: z
                  .array(
                    z.object({
                      file_name: z.string(),
                      link: z.string(),
                      position: z.number(),
                    })
                  )
                  .optional(),
                files_to_update: z
                  .array(
                    z.object({
                      id: z.number(),
                      file_name: z.string(),
                      link: z.string(),
                      position: z.number(),
                    })
                  )
                  .optional(),
                file_ids_to_remove: z.array(z.number()).optional(),
                vote: z.number().optional(),
                comment: z.string().optional(),
                selected_cards_to_add_or_update: z
                  .array(
                    z.object({
                      selected_card_id: z.number(),
                      position: z.number(),
                    })
                  )
                  .optional(),
                selected_card_ids_to_remove: z.array(z.number()).optional(),
              })
            )
            .optional()
            .describe('Optional custom fields to add or update'),
          custom_field_ids_to_remove: z
            .array(z.number())
            .optional()
            .describe('Optional custom field IDs to remove'),
          attachments_to_add: z
            .array(
              z.object({
                file_name: z.string(),
                link: z.string(),
                position: z.number(),
              })
            )
            .optional()
            .describe('Optional attachments to add'),
          cover_image_link: z.string().optional().describe('Optional cover image link'),
          subtasks_to_add: z
            .array(
              z.object({
                description: z.string(),
                owner_user_id: z.number(),
                is_finished: z.number(),
                deadline: z.string(),
                position: z.number(),
                attachments_to_add: z.array(
                  z.object({
                    file_name: z.string(),
                    link: z.string(),
                    position: z.number(),
                  })
                ),
              })
            )
            .optional()
            .describe('Optional subtasks to add'),
          column_checklist_items_to_check_or_update: z
            .array(
              z.object({
                item_id: z.number(),
                comment: z.string(),
              })
            )
            .optional()
            .describe('Optional column checklist items to check or update'),
          annotations_to_add: z
            .array(
              z.object({
                comment_id: z.string(),
                thread_id: z.string(),
                content: z.string(),
              })
            )
            .optional()
            .describe('Optional annotations to add'),
          links_to_existing_cards_to_add_or_update: z
            .array(
              z.object({
                linked_card_id: z.number(),
                link_type: z.string(),
                linked_card_position: z.number(),
                card_position: z.number(),
              })
            )
            .optional()
            .describe('Optional links to existing cards to add or update'),
          links_to_new_cards_to_add: z
            .array(
              z.object({
                linked_new_card_reference: z.string(),
                link_type: z.string(),
                linked_card_position: z.number(),
                card_position: z.number(),
              })
            )
            .optional()
            .describe('Optional links to new cards to add'),
          watch: z.number().optional().describe('Optional watch flag'),
          created_at: z.string().optional().describe('Optional creation date'),
          is_archived: z.number().optional().describe('Optional archived flag'),
          version_id: z.number().optional().describe('Optional version ID'),
          archived_at: z.string().optional().describe('Optional archived date'),
          is_discarded: z.number().optional().describe('Optional discarded flag'),
          discard_reason_id: z.number().optional().describe('Optional discard reason ID'),
          discard_comment: z.string().optional().describe('Optional discard comment'),
          discarded_at: z.string().optional().describe('Optional discarded date'),
          exceeding_reason: z.string().optional().describe('Optional exceeding reason'),
          reporter_user_id: z.number().optional().describe('Optional reporter user ID'),
          reporter_email: z.string().optional().describe('Optional reporter email'),
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
        description: 'Move a card to a different column or lane',
        inputSchema: {
          card_id: z.number().describe('The ID of the card to move'),
          column_id: z.number().describe('The target column ID'),
          lane_id: z.number().optional().describe('Optional target lane ID'),
          position: z.number().optional().describe('Optional position in the column'),
        },
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card to update'),
          id: z.number().optional().describe('Alternative ID field'),
          title: z.string().optional().describe('New title for the card'),
          description: z.string().optional().describe('New description for the card'),
          column_id: z.number().optional().describe('New column ID'),
          lane_id: z.number().optional().describe('New lane ID'),
          size: z.number().optional().describe('New card size/points'),
          priority: z.string().optional().describe('New priority level'),
          owner_user_id: z.number().optional().describe('New owner user ID'),
          assignee_user_id: z.number().optional().describe('New assignee user ID'),
          deadline: z.string().optional().describe('New deadline (ISO date string)'),
          position: z.number().optional().describe('New position'),
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

  private registerGetCardComments(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_card_comments',
      {
        title: 'Get Card Comments',
        description: 'Get all comments for a specific card',
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
          comment_id: z.number().describe('The ID of the comment'),
        },
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
        inputSchema: {
          card_id: z.number().describe('The ID of the card'),
        },
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
        inputSchema: {
          // No parameters needed for this endpoint
        },
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
