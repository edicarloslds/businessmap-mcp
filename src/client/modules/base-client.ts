import { AxiosInstance } from 'axios';
import { BusinessMapConfig } from '../../types/index.js';

/**
 * Base interface for client modules
 */
export interface BaseClientModule {
  /**
   * Initialize the module with the HTTP client and configuration
   * @param http The axios instance
   * @param config The BusinessMap configuration
   */
  initialize(http: AxiosInstance, config: BusinessMapConfig): void;
}

/**
 * Base class for client modules with common functionality
 */
export abstract class BaseClientModuleImpl implements BaseClientModule {
  protected http!: AxiosInstance;
  protected config!: BusinessMapConfig;

  initialize(http: AxiosInstance, config: BusinessMapConfig): void {
    this.http = http;
    this.config = config;
  }

  /**
   * Check if the module is in read-only mode
   */
  protected checkReadOnlyMode(operation: string): void {
    if (this.config.readOnlyMode) {
      throw new Error(`Cannot ${operation} in read-only mode`);
    }
  }
}

/**
 * Common HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL: string;
  headers: Record<string, string>;
  timeout: number;
}
