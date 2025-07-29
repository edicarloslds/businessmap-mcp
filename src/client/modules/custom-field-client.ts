import { ApiResponse, CustomField } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class CustomFieldClient extends BaseClientModuleImpl {
  /**
   * Get a specific custom field by ID
   */
  async getCustomField(customFieldId: number): Promise<CustomField> {
    const response = await this.http.get<ApiResponse<CustomField>>(
      `/custom_fields/${customFieldId}`
    );
    return response.data.data;
  }
}
