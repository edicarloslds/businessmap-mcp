import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function main() {
    console.log('🧪 Starting MCP Tool Verification...');
    const serverUrl = process.env['MCP_SERVER_URL'] || 'http://localhost:3000/mcp';

    const transport = new StreamableHTTPClientTransport(
        new URL(serverUrl)
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
        console.log(`🔌 Connecting to server at ${serverUrl}...`);
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
            process.exitCode = 1;
        }

        // Optional: Call a tool if we want to test execution (will fail without real API)
        // await client.callTool({ name: 'list_workspaces', arguments: {} });

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exitCode = 1;
    } finally {
        await client.close().catch(() => undefined);
    }
}

main().catch((error) => {
    console.error('❌ Unexpected verification failure:', error);
    process.exitCode = 1;
});
