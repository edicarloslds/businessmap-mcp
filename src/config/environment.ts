import dotenv from 'dotenv';
import { BusinessMapConfig } from '../types/businessmap.js';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  businessMap: BusinessMapConfig;
  server: {
    name: string;
    version: string;
    port?: number;
  };
  transport: {
    sse: boolean;
    streamableHttp: boolean;
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
  if (value === undefined) return defaultValue;
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
    port: getNumberEnvVar('PORT'),
  },
  transport: {
    sse: getBooleanEnvVar('SSE', false),
    streamableHttp: getBooleanEnvVar('STREAMABLE_HTTP', true),
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

  console.log(`✅ Configuration validated for ${config.server.name} v${config.server.version}`);
  console.log(`📡 BusinessMap API: ${config.businessMap.apiUrl}`);
  console.log(`🔒 Read-only mode: ${config.businessMap.readOnlyMode ? 'enabled' : 'disabled'}`);
} 