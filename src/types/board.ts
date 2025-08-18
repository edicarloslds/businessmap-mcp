// Board and Column Types for BusinessMap API

export interface Board {
  board_id?: number;
  workspace_id: number;
  is_archived: number;
  name: string;
  description: string;
  revision: number;
}

export interface Column {
  column_id?: number;
  workflow_id: number;
  section: number;
  parent_column_id: number;
  position: number;
  name: string;
  description: string;
  color: string;
  limit: number;
  cards_per_row: number;
  flow_type: number;
}

export interface CreateBoardParams {
  workspace_id?: number;
  name: string;
  description?: string;
}

// Current Board Structure Types
export interface Workflow {
  type: number;
  position: number;
  is_enabled: number;
  is_collapsible: number;
  name: string;
  top_lanes: number[];
  bottom_lanes: number[];
  top_columns: number[];
  bottom_columns: number[];
  section_columns: { [key: string]: number[] };
}

export interface StructureLane {
  workflow_id: number;
  name: string;
  description: string;
  color: string;
}

export interface CurrentStructureColumn {
  workflow_id: number;
  section: number;
  parent_column_id: number;
  name: string;
  description: string;
  color: string;
  limit: number;
  cards_per_row: number;
  flow_type: number;
  card_ordering: string | null;
  checklist_items: number[];
}

export interface ColumnChecklistItem {
  column_id: number;
  text: string;
  position: number;
}

export interface MergedArea {
  primary_column_id: number;
  limit: number;
  card_ordering: string | null;
  lane_ids: number[];
  column_ids: number[];
}

export interface CurrentBoardStructure {
  version: string;
  workspace_id: number;
  board_id: number;
  name: string;
  description: string;
  is_archived: number;
  workflow_order: number[];
  workflows: { [key: string]: Workflow };
  lanes: { [key: string]: StructureLane };
  columns: { [key: string]: CurrentStructureColumn };
  child_columns: { [key: string]: number[] };
  column_checklist_items: { [key: string]: ColumnChecklistItem };
  size_type: number;
  allow_exceeding: number;
  autoarchive_cards_after: number;
  limit_type: number;
  allow_repeating_custom_card_ids: number;
  is_discard_reason_required: number;
  size_formula: string;
  deadline_formula: string;
  default_sender_user_id: number;
  default_receiver_user_id: number;
  allow_generic_blocker: number;
  cell_card_orderings: { [key: string]: { [key: string]: string } };
  cell_limits: { [key: string]: { [key: string]: number } };
  lane_section_limits: { [key: string]: { [key: string]: number } };
  merged_areas: { [key: string]: MergedArea };
  revision: number;
}

export interface CurrentBoardStructureResponse {
  data: CurrentBoardStructure;
}
