import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getCount(content: unknown): number | undefined {
  if (Array.isArray(content)) return content.length;
  if (content && typeof content === 'object' && Array.isArray((content as { cards?: unknown[] }).cards)) {
    return (content as { cards: unknown[] }).cards.length;
  }
  return undefined;
}

async function main() {
  console.log('🧪 Starting Resource Validation...');

  if (!process.env.BUSINESSMAP_API_URL || !process.env.BUSINESSMAP_API_TOKEN) {
    console.error('❌ Missing environment variables. Please set BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN.');
    console.log('💡 You can create a .env file in the root directory.');
    process.exitCode = 1;
    return;
  }

  const serverPath = path.resolve(__dirname, '../dist/index.js');
  if (!fs.existsSync(serverPath)) {
    console.error(`❌ Build output not found at ${serverPath}`);
    console.log('💡 Run "npm run build" before running this validation script.');
    process.exitCode = 1;
    return;
  }

  console.log(`🔌 Connecting to server at ${serverPath}...`);

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: process.env,
  });

  const client = new Client(
    {
      name: 'validate-resources-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to server!');

    console.log('\n📋 Listing resources...');
    const resources = await client.listResources();
    console.log(`Found ${resources.resources.length} resources:`);
    resources.resources.forEach((r) => {
      console.log(`- ${r.name} (${r.uri})`);
    });

    console.log('\n📖 Reading workspaces...');
    try {
      const workspaces = await client.readResource({ uri: 'businessmap://workspaces' });
      console.log('✅ Successfully read workspaces:');
      const resource = workspaces.contents[0];
      if (!resource || !('text' in resource)) {
        throw new Error('Expected text resource but got blob');
      }
      const content = JSON.parse(resource.text);
      const count = getCount(content);
      if (count !== undefined) console.log(`  Count: ${count}`);
      if (Array.isArray(content) && content.length > 0) {
        console.log(`  First workspace: ${content[0].name} (ID: ${content[0].workspace_id})`);
      }
    } catch (error) {
      console.error('❌ Failed to read workspaces:', error);
    }

    console.log('\n📖 Reading boards...');
    let firstBoardId: number | undefined;
    try {
      const boards = await client.readResource({ uri: 'businessmap://boards' });
      console.log('✅ Successfully read boards:');
      const resource = boards.contents[0];
      if (!resource || !('text' in resource)) {
        throw new Error('Expected text resource but got blob');
      }
      const content = JSON.parse(resource.text);
      const count = getCount(content);
      if (count !== undefined) console.log(`  Count: ${count}`);
      if (Array.isArray(content) && content.length > 0) {
        firstBoardId = content[0].board_id;
        console.log(`  First board: ${content[0].name} (ID: ${firstBoardId})`);
      }
    } catch (error) {
      console.error('❌ Failed to read boards:', error);
    }

    if (firstBoardId) {
      console.log(`\n📖 Reading details for board ${firstBoardId}...`);
      try {
        await client.readResource({ uri: `businessmap://boards/${firstBoardId}` });
        console.log('✅ Successfully read board details');
      } catch (error) {
        console.error(`❌ Failed to read board ${firstBoardId}:`, error);
      }

      console.log(`\n📖 Reading cards for board ${firstBoardId}...`);
      try {
        const cards = await client.readResource({ uri: `businessmap://boards/${firstBoardId}/cards` });
        console.log('✅ Successfully read cards:');
        const resource = cards.contents[0];
        if (!resource || !('text' in resource)) {
          throw new Error('Expected text resource but got blob');
        }
        const content = JSON.parse(resource.text);
        const count = getCount(content);
        if (count !== undefined) console.log(`  Count: ${count}`);
        if (Array.isArray(content) && content.length > 0) {
          console.log(`  First card: ${content[0].card_id} - ${content[0].title}`);
        } else if (content && typeof content === 'object' && Array.isArray((content as { cards?: any[] }).cards) && (content as { cards: any[] }).cards.length > 0) {
          const firstCard = (content as { cards: any[] }).cards[0];
          console.log(`  First card: ${firstCard.card_id} - ${firstCard.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to read cards for board ${firstBoardId}:`, error);
      }
    }

    console.log('\n🎉 Validation complete!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exitCode = 1;
});
