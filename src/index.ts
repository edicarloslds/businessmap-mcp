#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/environment.js';
import { BusinessMapMcpServer } from './server/mcp-server.js';
import { logger } from './utils/logger.js';

export { startHttpServer, HttpServerOptions, ManagedHttpServer } from './server/http.js';
export { BusinessMapMcpServer } from './server/mcp-server.js';

let closeActiveServer: (() => Promise<void>) | undefined;

async function initializeWithRetry(server: BusinessMapMcpServer): Promise<void> {
  logger.info('🔄 Initializing connection to BusinessMap API...');
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  while (retryCount < maxRetries) {
    try {
      await server.initialize();
      logger.success('Successfully connected to BusinessMap API');
      return;
    } catch (error) {
      retryCount++;
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (retryCount < maxRetries) {
        logger.warn(`Connection attempt ${retryCount} failed: ${message}`);
        logger.info(`🔄 Retrying in ${retryDelay / 1000} seconds... (${retryCount}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      } else {
        logger.error(`Failed to connect to BusinessMap API after ${maxRetries} attempts: ${message}`);
        logger.error('💡 Please check your API URL and token configuration');
        throw error;
      }
    }
  }
}

async function main() {
  try {
    // Validate configuration
    validateConfig();

    logger.info(`🚀 Starting ${config.server.name} v${config.server.version}`);
    logger.info(`📡 BusinessMap API: ${config.businessMap.apiUrl}`);
    logger.info(`🔒 Read-only mode: ${config.businessMap.readOnlyMode ? 'enabled' : 'disabled'}`);

    // Setup transport based on configuration
    if (config.transport.type === 'http') {
      // Verify credentials and connectivity before starting remote HTTP mode
      const verificationServer = new BusinessMapMcpServer();
      await initializeWithRetry(verificationServer);

      const { startHttpServer } = await import('./server/http.js');
      const httpServer = await startHttpServer();
      closeActiveServer = () => httpServer.shutdown();
    } else {
      // Create and initialize the stdio MCP server
      const businessMapServer = new BusinessMapMcpServer();
      await initializeWithRetry(businessMapServer);

      // Default to Stdio
      const transport = new StdioServerTransport();
      await businessMapServer.server.connect(transport);
      closeActiveServer = () => businessMapServer.server.close();
      logger.success('BusinessMap MCP Server is running on Stdio');
      logger.info('💡 Use Ctrl+C to stop the server');
    }
  } catch (error) {
    logger.error('Failed to start BusinessMap MCP Server:', error);
    process.exit(1);
  }
}

// Check if run directly
const getRealpath = (p: string) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
};

const isMain = process.argv[1] && (
  getRealpath(process.argv[1]) === fileURLToPath(import.meta.url) ||
  getRealpath(process.argv[1]).replace(/\.[jt]s$/, '') === fileURLToPath(import.meta.url).replace(/\.[jt]s$/, '')
);

if (isMain) {
  // Handle graceful shutdown
  let shutdownPromise: Promise<void> | undefined;
  const handleShutdown = (signal: NodeJS.Signals): void => {
    shutdownPromise ??= (async () => {
      logger.info(`\n🛑 Received ${signal}; shutting down BusinessMap MCP Server...`);
      if (closeActiveServer) {
        await closeActiveServer();
      }
    })();

    void shutdownPromise.then(
      () => process.exit(0),
      (error) => {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    );
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  // Start the server
  try {
    await main();
  } catch (error) {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  }
}
