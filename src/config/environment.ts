import dotenv from 'dotenv';
import path from 'node:path';
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
    allowedOrigins: string[];
    allowedHosts: string[];
  };
  transport: {
    type: 'stdio' | 'http';
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
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new TypeError(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

function getCsvEnvVar(name: string, defaultValue: string[]): string[] {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getTransportType(): 'stdio' | 'http' {
  const transport = (process.env.TRANSPORT || 'stdio').toLowerCase();

  if (transport === 'stdio' || transport === 'http') {
    return transport;
  }

  if (transport === 'sse') {
    logger.warn('TRANSPORT=sse is deprecated. Falling back to TRANSPORT=http');
    return 'http';
  }

  throw new Error(`TRANSPORT must be either "stdio" or "http" (received: "${transport}")`);
}

const port = getNumberEnvVar('PORT') || 3000;
const defaultAllowedHosts = [
  'localhost',
  '127.0.0.1',
  '[::1]',
  `localhost:${port}`,
  `127.0.0.1:${port}`,
  `[::1]:${port}`,
];

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
    port,
    allowedOrigins: getCsvEnvVar('ALLOWED_ORIGINS', ['http://localhost']),
    allowedHosts: getCsvEnvVar('ALLOWED_HOSTS', defaultAllowedHosts),
  },
  transport: {
    type: getTransportType(),
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
