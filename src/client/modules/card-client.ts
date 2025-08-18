import {
  ApiResponse,
  Card,
  CardCustomField,
  CardCustomFieldsResponse,
  CardHistoryItem,
  CardHistoryResponse,
  CardOutcomesResponse,
  CardType,
  CardTypesResponse,
  Comment,
  CommentListResponse,
  CommentResponse,
  CreateCardParams,
  CreateSubtaskParams,
  LinkedCardItem,
  LinkedCardsResponse,
  Outcome,
  ParentCardItem,
  ParentCardPositionResponse,
  ParentCardsResponse,
  ParentGraphItem,
  ParentGraphResponse,
  Subtask,
  SubtaskResponse,
  SubtasksResponse,
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

  /**
   * Get card outcome history
   */
  async getCardHistory(cardId: number, outcomeId: number): Promise<CardHistoryItem[]> {
    const response = await this.http.get<CardHistoryResponse>(
      `/cards/${cardId}/outcomes/${outcomeId}/history`
    );
    return response.data.data;
  }

  /**
   * Get card outcomes
   */
  async getCardOutcomes(cardId: number): Promise<Outcome[]> {
    const response = await this.http.get<CardOutcomesResponse>(`/cards/${cardId}/outcomes`);
    return response.data.data;
  }

  /**
   * Get linked cards for a specific card
   */
  async getCardLinkedCards(cardId: number): Promise<LinkedCardItem[]> {
    const response = await this.http.get<LinkedCardsResponse>(`/cards/${cardId}/linkedCards`);
    return response.data.data;
  }

  /**
   * Get subtasks for a specific card
   */
  async getCardSubtasks(cardId: number): Promise<Subtask[]> {
    const response = await this.http.get<SubtasksResponse>(`/cards/${cardId}/subtasks`);
    return response.data.data;
  }

  /**
   * Get details of a specific subtask
   */
  async getCardSubtask(cardId: number, subtaskId: number): Promise<Subtask> {
    const response = await this.http.get<SubtaskResponse>(`/cards/${cardId}/subtasks/${subtaskId}`);
    return response.data.data;
  }

  /**
   * Create a new subtask for a card
   */
  async createCardSubtask(cardId: number, params: CreateSubtaskParams): Promise<Subtask> {
    this.checkReadOnlyMode('create subtask');
    const response = await this.http.post<SubtaskResponse>(`/cards/${cardId}/subtasks`, params);
    return response.data.data;
  }

  /**
   * Get parent cards for a specific card
   */
  async getCardParents(cardId: number): Promise<ParentCardItem[]> {
    const response = await this.http.get<ParentCardsResponse>(`/cards/${cardId}/parents`);
    return response.data.data;
  }

  /**
   * Check if a card is a parent of a given card
   */
  async getCardParent(cardId: number, parentCardId: number): Promise<{ position: number }> {
    const response = await this.http.get<ParentCardPositionResponse>(
      `/cards/${cardId}/parents/${parentCardId}`
    );
    return response.data.data;
  }

  /**
   * Make a card a parent of a given card
   */
  async addCardParent(cardId: number, parentCardId: number): Promise<{ position: number }> {
    this.checkReadOnlyMode('add card parent');
    const response = await this.http.put<ParentCardPositionResponse>(
      `/cards/${cardId}/parents/${parentCardId}`
    );
    return response.data.data;
  }

  /**
   * Remove the link between a child card and a parent card
   */
  async removeCardParent(cardId: number, parentCardId: number): Promise<void> {
    this.checkReadOnlyMode('remove card parent');
    await this.http.delete(`/cards/${cardId}/parents/${parentCardId}`);
  }

  /**
   * Get parent graph for a specific card (including parent's parents)
   */
  async getCardParentGraph(cardId: number): Promise<ParentGraphItem[]> {
    const response = await this.http.get<ParentGraphResponse>(`/cards/${cardId}/parentGraph`);
    return response.data.data;
  }
}
