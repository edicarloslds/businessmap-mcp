import { ApiResponse, Card, CreateCardParams, UpdateCardParams } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export interface CardFilters {
  column_id?: number;
  swimlane_id?: number;
  assignee_user_id?: number;
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
   * Move a card to a different column or swimlane
   */
  async moveCard(
    cardId: number,
    columnId: number,
    swimlaneId?: number,
    position?: number
  ): Promise<Card> {
    this.checkReadOnlyMode('move card');
    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${cardId}`, {
      column_id: columnId,
      swimlane_id: swimlaneId,
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
}
