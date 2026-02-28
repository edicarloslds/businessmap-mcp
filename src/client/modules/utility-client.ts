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
    try {
      // /info does not exist in the official BusinessMap API, try /me as fallback
      const response = await this.http.get('/info');
      return response.data;
    } catch (error) {
      logger.warn('Endpoint /info not available in the official API, falling back to connectivity check...');
      try {
        await this.http.get('/me');
        return {
          message: 'API is responding (fallback test)',
          endpoint: '/me',
          status: 'healthy',
          note: 'Endpoint /info is not available in the official BusinessMap API',
          api_version: 'v2',
          documentation: 'https://rdsaude.kanbanize.com/openapi/#/',
        };
      } catch (fallbackError) {
        throw new Error(
          `API connection failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`
        );
      }
    }
  }
}
