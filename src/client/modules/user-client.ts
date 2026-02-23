import { ApiResponse, CurrentUser, InvitedUser, InviteUserParams, User } from '../../types/index.js';
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

  /**
   * Get current logged user data
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await this.http.get<ApiResponse<CurrentUser>>('/me');
    return response.data.data;
  }

  /**
   * Invite a new user by email
   */
  async inviteUser(params: InviteUserParams): Promise<InvitedUser> {
    this.checkReadOnlyMode('invite user');
    const response = await this.http.post<ApiResponse<InvitedUser>>('/users/invite', params);
    return response.data.data;
  }
}
