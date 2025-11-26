import dotenv from 'dotenv';
import path from 'path';
import { BusinessMapConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';

// Load environment variables
// Load environment variables from current working directory
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  // If .env file doesn't exist, dotenv returns an error. 
  // We'll try loading without path (default behavior) as fallback, 
  // but also log that we checked CWD.
  logger.info(`No .env file found at ${envPath}, checking default locations...`);
  dotenv.config();
} else {
  logger.info(`Loaded environment variables from ${envPath}`);
}

export interface EnvironmentConfig {
  businessMap: BusinessMapConfig;
  server: {
    name: string;
    version: string;
    port: number;
  };
  transport: {
    type: 'stdio' | 'sse' | 'http';
  };
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getNumberEnvVar(name: string, defaultValue?: number): number | undefined {
  const value = process.env[name];
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

export const config: EnvironmentConfig = {
  businessMap: {
    apiUrl: getRequiredEnvVar('BUSINESSMAP_API_URL'),
    apiToken: getRequiredEnvVar('BUSINESSMAP_API_TOKEN'),
    defaultWorkspaceId: getNumberEnvVar('BUSINESSMAP_DEFAULT_WORKSPACE_ID'),
    readOnlyMode: getBooleanEnvVar('BUSINESSMAP_READ_ONLY_MODE', false),
  },
  server: {
    name: process.env.MCP_SERVER_NAME || 'businessmap-mcp',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
    port: getNumberEnvVar('PORT') || 3000,
  },
  transport: {
    type: (process.env.TRANSPORT as 'stdio' | 'sse' | 'http') || 'stdio',
  },
};

export function validateConfig(): void {
  // Validate API URL format
  try {
    new URL(config.businessMap.apiUrl);
  } catch {
    throw new Error('BUSINESSMAP_API_URL must be a valid URL');
  }

  // Validate API token is not empty
  if (!config.businessMap.apiToken.trim()) {
    throw new Error('BUSINESSMAP_API_TOKEN cannot be empty');
  }

  logger.success(`Configuration validated for ${config.server.name} v${config.server.version}`);
  logger.info(`📡 BusinessMap API: ${config.businessMap.apiUrl}`);
  logger.info(`🔒 Read-only mode: ${config.businessMap.readOnlyMode ? 'enabled' : 'disabled'}`);
}
