import { z } from 'zod';
import {
  fileAttachmentSchema,
  fileAttachmentWithIdSchema,
  idArrayFilters,
  paginationSchema,
} from './common-schemas.js';

// List cards schema - extraído do card-tools.ts
export const listCardsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),

  // Date and time filters usando o schema comum e estendendo para casos específicos
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
    .describe('The first date of in current position since cards for which you want results'),
  in_current_position_since_to: z
    .string()
    .optional()
    .describe(
      'The last date and time of in current position since cards for which you want results'
    ),
  in_current_position_since_to_date: z
    .string()
    .optional()
    .describe('The last date of in current position since cards for which you want results'),

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

  // ID filters (arrays) - usando schemas comuns e estendendo
  ...idArrayFilters,
  card_ids: z.array(z.number()).optional().describe('A list of the card ids that you want to get'),
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

  // Pagination usando schema comum
  ...paginationSchema,

  // Legacy compatibility
  assignee_user_id: z
    .number()
    .optional()
    .describe('Optional assignee user ID to filter cards (legacy parameter)'),
  tag_ids: z
    .array(z.number())
    .optional()
    .describe('Optional array of tag IDs to filter cards (legacy parameter)'),
});

// Schema básico para get card
export const getCardSchema = z.object({
  card_id: z.number().describe('The ID of the card'),
});

// Schema para tamanho do card
export const cardSizeSchema = z.object({
  card_id: z.number().describe('The ID of the card'),
  size: z.number().optional().describe('The new size/points for the card'),
});

// Schema para comentários do card
export const cardCommentsSchema = z.object({
  card_id: z.number().describe('The ID of the card'),
});

// Schema para obter um comentário específico
export const getCardCommentSchema = z.object({
  card_id: z.number().describe('The ID of the card'),
  comment_id: z.number().describe('The ID of the comment'),
});

// Schema para get card types (sem parâmetros)
export const getCardTypesSchema = z.object({});

// Schemas complexos para criação de cards
export const blockReasonSchema = z.object({
  reason_id: z.number(),
  comment: z.string(),
  users: z.array(z.number()),
  date: z.string(),
  cards: z.array(z.number()),
});

export const stickerSchema = z.object({
  sticker_id: z.number(),
  if_not_present: z.number(),
});

export const customFieldValueSchema = z.object({
  value_id: z.number(),
  position: z.number(),
});

export const customFieldCardSchema = z.object({
  selected_card_id: z.number(),
  position: z.number(),
});

export const customFieldSchema = z.object({
  field_id: z.number(),
  value: z.string(),
  selected_values_to_add_or_update: z.array(customFieldValueSchema).optional(),
  selected_value_ids_to_remove: z.array(z.number()).optional(),
  other_value: z.string().optional(),
  contributor_ids_to_add: z.array(z.number()).optional(),
  contributor_ids_to_remove: z.array(z.number()).optional(),
  files_to_add: z.array(fileAttachmentSchema).optional(),
  files_to_update: z.array(fileAttachmentWithIdSchema).optional(),
  file_ids_to_remove: z.array(z.number()).optional(),
  vote: z.number().optional(),
  comment: z.string().optional(),
  selected_cards_to_add_or_update: z.array(customFieldCardSchema).optional(),
  selected_card_ids_to_remove: z.array(z.number()).optional(),
});

export const subtaskSchema = z.object({
  description: z.string(),
  owner_user_id: z.number(),
  is_finished: z.number(),
  deadline: z.string(),
  position: z.number(),
  attachments_to_add: z.array(fileAttachmentSchema),
});

export const annotationSchema = z.object({
  comment_id: z.string(),
  thread_id: z.string(),
  content: z.string(),
});

export const cardLinkSchema = z.object({
  linked_card_id: z.number(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
});

export const newCardLinkSchema = z.object({
  linked_new_card_reference: z.string(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
});

export const cardPropertyToCopySchema = z.object({
  properties: z.array(z.string()),
  card_id: z.number(),
});

export const customFieldToCopySchema = z.object({
  field_ids: z.array(z.number()),
  card_id: z.number(),
});

export const columnChecklistItemSchema = z.object({
  item_id: z.number(),
  comment: z.string(),
});

// Schema principal para criação de cards
export const createCardSchema = z.object({
  title: z.string().describe('The title of the card'),
  column_id: z.number().describe('The ID of the column'),

  // Campos opcionais básicos
  template_id: z.number().optional().describe('Optional template ID'),
  lane_id: z.number().optional().describe('Optional lane ID'),
  position: z.number().optional().describe('Optional position'),
  track: z.number().optional().describe('Optional track'),
  description: z.string().optional().describe('Optional description for the card'),
  custom_id: z.string().optional().describe('Optional custom ID'),
  owner_user_id: z.number().optional().describe('Optional owner user ID'),
  type_id: z.number().optional().describe('Optional card type ID'),
  size: z.number().optional().describe('Optional card size/points'),
  priority: z.number().optional().describe('Optional priority level'),
  color: z.string().optional().describe('Optional color'),
  deadline: z.string().optional().describe('Optional deadline (ISO date string)'),
  reference: z.string().optional().describe('Optional reference'),

  // Datas
  planned_start_date_sync_type: z
    .number()
    .optional()
    .describe('Optional planned start date sync type'),
  planned_start_date: z.string().optional().describe('Optional planned start date'),
  planned_end_date_sync_type: z.number().optional().describe('Optional planned end date sync type'),
  planned_end_date: z.string().optional().describe('Optional planned end date'),
  actual_start_time: z.string().optional().describe('Optional actual start time'),
  actual_end_time: z.string().optional().describe('Optional actual end time'),
  created_at: z.string().optional().describe('Optional creation date'),
  archived_at: z.string().optional().describe('Optional archived date'),
  discarded_at: z.string().optional().describe('Optional discarded date'),

  // Status e flags
  is_archived: z.number().optional().describe('Optional archived flag'),
  is_discarded: z.number().optional().describe('Optional discarded flag'),
  watch: z.number().optional().describe('Optional watch flag'),
  version_id: z.number().optional().describe('Optional version ID'),

  // Razões e comentários
  block_reason: blockReasonSchema.optional().describe('Optional block reason'),
  discard_reason_id: z.number().optional().describe('Optional discard reason ID'),
  discard_comment: z.string().optional().describe('Optional discard comment'),
  exceeding_reason: z.string().optional().describe('Optional exceeding reason'),

  // Reporter
  reporter_user_id: z.number().optional().describe('Optional reporter user ID'),
  reporter_email: z.string().optional().describe('Optional reporter email'),

  // Arrays de relacionamentos
  card_properties_to_copy: z
    .array(cardPropertyToCopySchema)
    .optional()
    .describe('Optional card properties to copy'),
  custom_fields_to_copy: z
    .array(customFieldToCopySchema)
    .optional()
    .describe('Optional custom fields to copy'),
  co_owner_ids_to_add: z.array(z.number()).optional().describe('Optional co-owner IDs to add'),
  co_owner_ids_to_remove: z
    .array(z.number())
    .optional()
    .describe('Optional co-owner IDs to remove'),
  watcher_ids_to_add: z.array(z.number()).optional().describe('Optional watcher IDs to add'),
  watcher_ids_to_remove: z.array(z.number()).optional().describe('Optional watcher IDs to remove'),
  stickers_to_add: z.array(stickerSchema).optional().describe('Optional stickers to add'),
  tag_ids_to_add: z.array(z.number()).optional().describe('Optional tag IDs to add'),
  tag_ids_to_remove: z.array(z.number()).optional().describe('Optional tag IDs to remove'),
  milestone_ids_to_add: z.array(z.number()).optional().describe('Optional milestone IDs to add'),
  milestone_ids_to_remove: z
    .array(z.number())
    .optional()
    .describe('Optional milestone IDs to remove'),

  // Campos customizados e anexos
  custom_fields_to_add_or_update: z
    .array(customFieldSchema)
    .optional()
    .describe('Optional custom fields to add or update'),
  custom_field_ids_to_remove: z
    .array(z.number())
    .optional()
    .describe('Optional custom field IDs to remove'),
  attachments_to_add: z
    .array(fileAttachmentSchema)
    .optional()
    .describe('Optional attachments to add'),
  cover_image_link: z.string().optional().describe('Optional cover image link'),

  // Subtasks e checklists
  subtasks_to_add: z.array(subtaskSchema).optional().describe('Optional subtasks to add'),
  column_checklist_items_to_check_or_update: z
    .array(columnChecklistItemSchema)
    .optional()
    .describe('Optional column checklist items to check or update'),

  // Anotações e links
  annotations_to_add: z.array(annotationSchema).optional().describe('Optional annotations to add'),
  links_to_existing_cards_to_add_or_update: z
    .array(cardLinkSchema)
    .optional()
    .describe('Optional links to existing cards to add or update'),
  links_to_new_cards_to_add: z
    .array(newCardLinkSchema)
    .optional()
    .describe('Optional links to new cards to add'),
});

// Schema para movimentação de cards
export const moveCardSchema = z.object({
  card_id: z.number().describe('The ID of the card to move'),
  column_id: z.number().describe('The target column ID'),
  lane_id: z.number().optional().describe('Optional target lane ID'),
  position: z.number().optional().describe('Optional position in the column'),
});

// Schema para atualização de cards
export const updateCardSchema = z.object({
  card_id: z.number().describe('The ID of the card to update'),
  id: z.number().optional().describe('Alternative ID field'),
  title: z.string().optional().describe('New title for the card'),
  description: z.string().optional().describe('New description for the card'),
  column_id: z.number().optional().describe('New column ID'),
  lane_id: z.number().optional().describe('New lane ID'),
  position: z.number().optional().describe('New position'),
  owner_user_id: z.number().optional().describe('New owner user ID'),
  assignee_user_id: z.number().optional().describe('New assignee user ID'),
  size: z.number().optional().describe('New card size/points'),
  priority: z.string().optional().describe('New priority level'),
  deadline: z.string().optional().describe('New deadline (ISO date string)'),
});
