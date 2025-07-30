import {
  ApiResponse,
  Card,
  CardCustomField,
  CardCustomFieldsResponse,
  CardType,
  CardTypesResponse,
  Comment,
  CommentListResponse,
  CommentResponse,
  CreateCardParams,
  UpdateCardParams,
} from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export interface CardFilters {
  // Date and time filters
  archived_from?: string;
  archived_from_date?: string;
  archived_to?: string;
  archived_to_date?: string;
  created_from?: string;
  created_from_date?: string;
  created_to?: string;
  created_to_date?: string;
  deadline_from?: string;
  deadline_from_date?: string;
  deadline_to?: string;
  deadline_to_date?: string;
  discarded_from?: string;
  discarded_from_date?: string;
  discarded_to?: string;
  discarded_to_date?: string;
  first_end_from?: string;
  first_end_from_date?: string;
  first_end_to?: string;
  first_end_to_date?: string;
  first_start_from?: string;
  first_start_from_date?: string;
  first_start_to?: string;
  first_start_to_date?: string;
  in_current_position_since_from?: string;
  in_current_position_since_from_date?: string;
  in_current_position_since_to?: string;
  in_current_position_since_to_date?: string;
  last_end_from?: string;
  last_end_from_date?: string;
  last_end_to?: string;
  last_end_to_date?: string;
  last_modified_from?: string;
  last_modified_from_date?: string;
  last_modified_to?: string;
  last_modified_to_date?: string;
  last_start_from?: string;
  last_start_from_date?: string;
  last_start_to?: string;
  last_start_to_date?: string;

  // ID filters (arrays)
  board_ids?: number[];
  card_ids?: number[];
  column_ids?: number[];
  lane_ids?: number[];
  last_column_ids?: number[];
  last_lane_ids?: number[];
  owner_user_ids?: number[];
  priorities?: number[];
  reason_ids?: number[];
  sections?: number[];
  sizes?: number[];
  type_ids?: number[];
  version_ids?: number[];
  workflow_ids?: number[];

  // String array filters
  colors?: string[];
  custom_ids?: string[];

  // Configuration options
  include_logged_time_for_child_cards?: number;
  include_logged_time_for_subtasks?: number;

  // Pagination
  page?: number;
  per_page?: number;

  // Legacy compatibility (keeping for backward compatibility)
  assignee_user_id?: number;
  tag_ids?: number[];
}

export class CardClient extends BaseClientModuleImpl {
  /**
   * Get cards from a board with optional filters
   */
  async getCards(boardId: number, filters?: CardFilters): Promise<Card[]> {
    const params = { board_id: boardId, ...filters };
    const response = await this.http.get<ApiResponse<Card[]>>('/cards', { params });
    return response.data.data;
  }

  /**
   * Get a specific card by ID
   */
  async getCard(cardId: number): Promise<Card> {
    const response = await this.http.get<ApiResponse<Card>>(`/cards/${cardId}`);
    return response.data.data;
  }

  /**
   * Create a new card
   */
  async createCard(params: CreateCardParams): Promise<Card> {
    this.checkReadOnlyMode('create card');
    const response = await this.http.post<ApiResponse<Card>>('/cards', params);
    return response.data.data;
  }

  /**
   * Update an existing card
   */
  async updateCard(params: UpdateCardParams): Promise<Card> {
    this.checkReadOnlyMode('update card');
    const { card_id, ...updateData } = params;
    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${card_id}`, updateData);
    return response.data.data;
  }

  /**
   * Move a card to a different column or lane
   */
  async moveCard(
    cardId: number,
    columnId: number,
    laneId?: number,
    position?: number
  ): Promise<Card> {
    this.checkReadOnlyMode('move card');
    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${cardId}`, {
      column_id: columnId,
      lane_id: laneId,
      position: position,
    });
    return response.data.data;
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: number): Promise<void> {
    this.checkReadOnlyMode('delete card');
    await this.http.delete(`/cards/${cardId}`);
  }

  /**
   * Get comments for a specific card
   */
  async getCardComments(cardId: number): Promise<Comment[]> {
    const response = await this.http.get<CommentListResponse>(`/cards/${cardId}/comments`);
    return response.data.data;
  }

  /**
   * Get details of a specific comment
   */
  async getCardComment(cardId: number, commentId: number): Promise<Comment> {
    const response = await this.http.get<CommentResponse>(`/cards/${cardId}/comments/${commentId}`);
    return response.data.data;
  }

  /**
   * Get custom fields for a specific card
   */
  async getCardCustomFields(cardId: number): Promise<CardCustomField[]> {
    const response = await this.http.get<CardCustomFieldsResponse>(`/cards/${cardId}/customFields`);
    return response.data.data;
  }

  /**
   * Get all card types
   */
  async getCardTypes(): Promise<CardType[]> {
    const response = await this.http.get<CardTypesResponse>('/cardTypes');
    return response.data.data;
  }
}
