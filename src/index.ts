#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/environment.js';
import { BusinessMapMcpServer } from './server/mcp-server.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Create and setup the MCP server
    const businessMapServer = new BusinessMapMcpServer();

    logger.info(`🚀 Starting ${config.server.name} v${config.server.version}`);
    logger.info(`📡 BusinessMap API: ${config.businessMap.apiUrl}`);
    logger.info(`🔒 Read-only mode: ${config.businessMap.readOnlyMode ? 'enabled' : 'disabled'}`);

    // Initialize BusinessMap client with retry logic
    logger.info('🔄 Initializing connection to BusinessMap API...');
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        await businessMapServer.initialize();
        logger.success('Successfully connected to BusinessMap API');
        break;
      } catch (error) {
        retryCount++;
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (retryCount < maxRetries) {
          logger.warn(`Connection attempt ${retryCount} failed: ${message}`);
          logger.info(
            `🔄 Retrying in ${retryDelay / 1000} seconds... (${retryCount}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          logger.error(
            `Failed to connect to BusinessMap API after ${maxRetries} attempts: ${message}`
          );
          logger.error('💡 Please check your API URL and token configuration');
          throw error;
        }
      }
    }

    // Setup transport based on configuration
    if (config.transport.type === 'sse' || config.transport.type === 'http') {
      const { startHttpServer } = await import('./server/http.js');
      await startHttpServer(businessMapServer);
    } else {
      // Default to Stdio
      const transport = new StdioServerTransport();
      await businessMapServer.server.connect(transport);
      logger.success('BusinessMap MCP Server is running on Stdio');
      logger.info('💡 Use Ctrl+C to stop the server');
    }
  } catch (error) {
    logger.error('Failed to start BusinessMap MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('\n🛑 Shutting down BusinessMap MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n🛑 Shutting down BusinessMap MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
