import { logger } from '../../utils/logger.js';
import { BaseClientModuleImpl } from './base-client.js';

export class UtilityClient extends BaseClientModuleImpl {
  /**
   * Check if the API is healthy and accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use /me endpoint as health check since /health may not exist
      await this.http.get('/me');
      return true;
    } catch (error) {
      // Log the actual error for debugging
      logger.error(
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return false;
    }
  }

  /**
   * Get API information (with fallback for official API)
   */
  async getApiInfo() {
    // /info does not exist in the official BusinessMap API — use /me as connectivity check
    try {
      await this.http.get('/me');
      return {
        message: 'API is responding',
        endpoint: '/me',
        status: 'healthy',
        note: 'Endpoint /info is not available in the official BusinessMap API',
        api_version: 'v2',
        documentation: 'https://rdsaude.kanbanize.com/openapi/#/',
      };
    } catch (error) {
      throw new Error(
        `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
