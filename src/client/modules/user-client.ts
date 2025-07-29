import { ApiResponse, User } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class UserClient extends BaseClientModuleImpl {
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    const response = await this.http.get<ApiResponse<User[]>>('/users');
    return response.data.data;
  }

  /**
   * Get a specific user by ID
   */
  async getUser(userId: number): Promise<User> {
    const response = await this.http.get<ApiResponse<User>>(`/users/${userId}`);
    return response.data.data;
  }
}
