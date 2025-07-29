#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config, validateConfig } from './config/environment.js';
import { BusinessMapMcpServer } from './server/mcp-server.js';

async function main() {
  try {
    // Validate configuration
    validateConfig();

    // Create and setup the MCP server
    const businessMapServer = new BusinessMapMcpServer();

    console.error(`🚀 Starting ${config.server.name} v${config.server.version}`);
    console.error(`📡 BusinessMap API: ${config.businessMap.apiUrl}`);
    console.error(`🔒 Read-only mode: ${config.businessMap.readOnlyMode ? 'enabled' : 'disabled'}`);

    // Initialize BusinessMap client with retry logic
    console.error('🔄 Initializing connection to BusinessMap API...');
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    while (retryCount < maxRetries) {
      try {
        await businessMapServer.initialize();
        console.error('✅ Successfully connected to BusinessMap API');
        break;
      } catch (error) {
        retryCount++;
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (retryCount < maxRetries) {
          console.error(`⚠️  Connection attempt ${retryCount} failed: ${message}`);
          console.error(
            `🔄 Retrying in ${retryDelay / 1000} seconds... (${retryCount}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            `❌ Failed to connect to BusinessMap API after ${maxRetries} attempts: ${message}`
          );
          console.error('💡 Please check your API URL and token configuration');
          throw error;
        }
      }
    }

    // Setup transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await businessMapServer.server.connect(transport);

    console.error('✅ BusinessMap MCP Server is running');
    console.error('💡 Use Ctrl+C to stop the server');
  } catch (error) {
    console.error('❌ Failed to start BusinessMap MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n🛑 Shutting down BusinessMap MCP Server...');
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
