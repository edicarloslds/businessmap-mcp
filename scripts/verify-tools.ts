import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { EventSource } from 'eventsource';

// Polyfill EventSource for Node.js
global.EventSource = EventSource;

async function main() {
    console.log('🧪 Starting MCP Tool Verification...');

    const transport = new SSEClientTransport(
        new URL('http://localhost:3000/sse')
    );

    const client = new Client(
        {
            name: 'test-client',
            version: '1.0.0',
        },
        {
            capabilities: {},
        }
    );

    try {
        console.log('🔌 Connecting to server...');
        await client.connect(transport);
        console.log('✅ Connected!');

        console.log('📋 Listing tools...');
        const result = await client.listTools();

        console.log(`✅ Found ${result.tools.length} tools`);

        const workspaceTool = result.tools.find(t => t.name === 'list_workspaces');
        if (workspaceTool) {
            console.log('✅ Verified "list_workspaces" tool exists');
        } else {
            console.error('❌ "list_workspaces" tool not found');
            process.exit(1);
        }

        // Optional: Call a tool if we want to test execution (will fail without real API)
        // await client.callTool({ name: 'list_workspaces', arguments: {} });

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

main();
