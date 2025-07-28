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