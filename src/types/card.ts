// Card Types for BusinessMap API

export interface Card {
  card_id: number;
  custom_id: string;
  board_id: number;
  workflow_id: number;
  title: string;
  owner_user_id: number;
  type_id: number;
  color: string;
  section: number;
  column_id: number;
  lane_id: number;
  position: number;
  description: string;
  size: number;
  priority: number;
  deadline: string;
  reporter: {
    type: string;
    value: number;
  };
  created_at: string;
  revision: number;
  last_modified: string;
  in_current_position_since: string;
  is_blocked: number;
  block_reason: BlockReason;
  child_card_stats: ChildCardStats;
  finished_subtask_count: number;
  unfinished_subtask_count: number;
  current_cycle_time: number;
  first_request_time: string;
  first_start_time: string;
  first_end_time: string;
  last_request_time: string;
  last_start_time: string;
  last_end_time: string;
  last_column_id: number;
  last_lane_id: number;
  attachments: Attachment[];
  cover_image: CoverImage;
  custom_fields: CardCustomField[];
  stickers: Sticker[];
  tag_ids: number[];
  milestone_ids: number[];
  co_owner_ids: number[];
  watcher_ids: number[];
  annotations: Annotation[];
  outcomes: Outcome[];
  subtasks: Subtask[];
  linked_cards: LinkedCard[];
}

export interface BlockReason {
  reason_id: number;
  icon_type: number;
  icon_id: number;
  label: string;
  color: string;
  with_cards: number;
  with_date: number;
  with_users: number;
  availability: number;
  is_enabled: number;
}

export interface ChildCardStats {
  child_card_size_sum: number;
  finished_bottom_child_card_size_sum: number;
  unfinished_bottom_child_card_size_sum: number;
  has_unfinished_child_cards: boolean;
  last_unfinished_child_card_deadline: string;
}

export interface Attachment {
  id: number;
  file_name: string;
  link: string;
  position?: number;
}

export interface CoverImage {
  attachment_id: number;
  width: number;
  height: number;
  link: string;
}

export interface CardCustomField {
  field_id: number;
  value: string;
  display_value: string;
}

export interface Sticker {
  id: number;
  card_id: number;
  sticker_id: number;
}

export interface Annotation {
  thread_id: string;
  comment_id: string;
  author_id: number;
  content: string;
  created_at: string;
}

export interface Outcome {
  outcome_id: number;
  field_id: number;
  starting_value: number;
  target_value: number;
  operator: string;
  comment: string | null;
  weight: number;
  created_at: string;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: number;
  time: string;
  name: string;
  value: number;
}

export interface Subtask {
  subtask_id: number;
  description: string;
  owner_user_id: number;
  deadline: string;
  finished_at: string;
  position: number;
  attachments: Attachment[];
}

export interface LinkedCard {
  card_id: number;
  link_type: string;
}

export interface CardListResponse {
  pagination: {
    all_pages: number;
    current_page: number;
    results_per_page: number;
  };
  data: Card[];
}

export interface CreateCardParams {
  template_id?: number;
  card_properties_to_copy?: Array<{
    properties: string[];
    card_id: number;
  }>;
  custom_fields_to_copy?: Array<{
    field_ids: number[];
    card_id: number;
  }>;
  column_id: number;
  lane_id?: number;
  position?: number;
  track?: number;
  planned_start_date_sync_type?: number;
  planned_start_date?: string;
  planned_end_date_sync_type?: number;
  planned_end_date?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  title: string;
  description?: string;
  custom_id?: string;
  owner_user_id?: number;
  type_id?: number;
  size?: number;
  priority?: number;
  color?: string;
  deadline?: string;
  reference?: string;
  block_reason?: {
    reason_id: number;
    comment: string;
    users: number[];
    date: string;
    cards: number[];
  };
  stickers_to_add?: Array<{
    sticker_id: number;
    if_not_present: number;
  }>;
  tag_ids_to_add?: number[];
  tag_ids_to_remove?: number[];
  milestone_ids_to_add?: number[];
  milestone_ids_to_remove?: number[];
  co_owner_ids_to_add?: number[];
  co_owner_ids_to_remove?: number[];
  watcher_ids_to_add?: number[];
  watcher_ids_to_remove?: number[];
  custom_fields_to_add_or_update?: Array<{
    field_id: number;
    value: string;
    selected_values_to_add_or_update?: Array<{
      value_id: number;
      position: number;
    }>;
    selected_value_ids_to_remove?: number[];
    other_value?: string;
    contributor_ids_to_add?: number[];
    contributor_ids_to_remove?: number[];
    files_to_add?: Array<{
      file_name: string;
      link: string;
      position: number;
    }>;
    files_to_update?: Array<{
      id: number;
      file_name: string;
      link: string;
      position: number;
    }>;
    file_ids_to_remove?: number[];
    vote?: number;
    comment?: string;
    selected_cards_to_add_or_update?: Array<{
      selected_card_id: number;
      position: number;
    }>;
    selected_card_ids_to_remove?: number[];
  }>;
  custom_field_ids_to_remove?: number[];
  attachments_to_add?: Array<{
    file_name: string;
    link: string;
    position: number;
  }>;
  cover_image_link?: string;
  subtasks_to_add?: Array<{
    description: string;
    owner_user_id: number;
    is_finished: number;
    deadline: string;
    position: number;
    attachments_to_add: Array<{
      file_name: string;
      link: string;
      position: number;
    }>;
  }>;
  column_checklist_items_to_check_or_update?: Array<{
    item_id: number;
    comment: string;
  }>;
  annotations_to_add?: Array<{
    comment_id: string;
    thread_id: string;
    content: string;
  }>;
  links_to_existing_cards_to_add_or_update?: Array<{
    linked_card_id: number;
    link_type: string;
    linked_card_position: number;
    card_position: number;
  }>;
  links_to_new_cards_to_add?: Array<{
    linked_new_card_reference: string;
    link_type: string;
    linked_card_position: number;
    card_position: number;
  }>;
  watch?: number;
  created_at?: string;
  is_archived?: number;
  version_id?: number;
  archived_at?: string;
  is_discarded?: number;
  discard_reason_id?: number;
  discard_comment?: string;
  discarded_at?: string;
  exceeding_reason?: string;
  reporter_user_id?: number;
  reporter_email?: string;
}

export interface UpdateCardParams {
  card_id?: number;
  id?: number;
  title?: string;
  description?: string;
  column_id?: number;
  lane_id?: number;
  size?: number;
  priority?: string;
  owner_user_id?: number;
  assignee_user_id?: number;
  deadline?: string;
  position?: number;
}

// Comment types
export interface Comment {
  comment_id: number;
  type: string;
  text: string;
  attachments: {
    id: number;
    file_name: string;
    link: string;
  };
  created_at: string;
  last_modified: string;
  author: {
    type: string;
    value: number;
  };
}

export interface CommentListResponse {
  data: Comment[];
}

export interface CommentResponse {
  data: Comment;
}

// Card Custom Fields Response
export interface CardCustomFieldsResponse {
  data: CardCustomField[];
}

// Card Types
export interface CardType {
  type_id: number;
  icon_type: number;
  icon_id: number;
  name: string;
  description: string;
  color: string;
  card_color_sync: number;
  all_properties_are_locked: number;
  availability: number;
  is_enabled: number;
}

export interface CardTypesResponse {
  data: CardType[];
}

// Card History types
export interface CardHistoryItem {
  history_id: number;
  outcome_id: number;
  event_type: number;
  event_guid: string;
  user_id: number;
  old_value: number;
  changes: string;
  time: string;
}

export interface CardHistoryResponse {
  data: CardHistoryItem[];
}

// Card Outcomes Response
export interface CardOutcomesResponse {
  data: Outcome[];
}

// Linked Cards Response (specific for /cards/{card_id}/linkedCards endpoint)
export interface LinkedCardItem {
  card_id: number;
  position: number;
  link_type: string;
}

export interface LinkedCardsResponse {
  data: LinkedCardItem[];
}

// Subtasks Response types
export interface SubtasksResponse {
  data: Subtask[];
}

export interface SubtaskResponse {
  data: Subtask;
}

// Create Subtask params
export interface CreateSubtaskParams {
  description: string;
  owner_user_id?: number;
  is_finished?: number;
  deadline?: string;
  position?: number;
  attachments_to_add?: Array<{
    file_name: string;
    link: string;
    position: number;
  }>;
}
