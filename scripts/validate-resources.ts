import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getStringEnvironment(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
  );
}

function getCollection(content: unknown): unknown[] | undefined {
  if (Array.isArray(content)) return content;
  if (content && typeof content === 'object' && Array.isArray((content as { data?: unknown[] }).data)) {
    return (content as { data: unknown[] }).data;
  }
  if (content && typeof content === 'object' && Array.isArray((content as { cards?: unknown[] }).cards)) {
    return (content as { cards: unknown[] }).cards;
  }
  return undefined;
}

function getCount(content: unknown): number | undefined {
  return getCollection(content)?.length;
}

function getNamedListItem(
  value: unknown,
  idProperty: 'workspace_id' | 'board_id'
): { id: number; name: string } | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const item = value as Record<string, unknown>;
  const id = item[idProperty];
  return typeof id === 'number' && typeof item.name === 'string'
    ? { id, name: item.name }
    : undefined;
}

function isCardListItem(value: unknown): value is { card_id: number; title: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as { card_id?: unknown }).card_id === 'number' &&
    typeof (value as { title?: unknown }).title === 'string'
  );
}

type ResourceReadResult = Awaited<ReturnType<Client['readResource']>>;

function getServerPath(): string | undefined {
  if (!process.env.BUSINESSMAP_API_URL || !process.env.BUSINESSMAP_API_TOKEN) {
    console.error('❌ Missing environment variables. Please set BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN.');
    console.log('💡 You can create a .env file in the root directory.');
    process.exitCode = 1;
    return undefined;
  }

  const serverPath = path.resolve(__dirname, '../dist/index.js');
  if (!fs.existsSync(serverPath)) {
    console.error(`❌ Build output not found at ${serverPath}`);
    console.log('💡 Run "npm run build" before running this validation script.');
    process.exitCode = 1;
    return undefined;
  }
  return serverPath;
}

function createClient(serverPath: string): { client: Client; transport: StdioClientTransport } {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: getStringEnvironment(),
  });
  const client = new Client(
    { name: 'validate-resources-client', version: '1.0.0' },
    { capabilities: {} }
  );
  return { client, transport };
}

function parseTextResource(result: ResourceReadResult): unknown {
  const resource = result.contents[0];
  if (!resource || !('text' in resource)) {
    throw new Error('Expected text resource but got blob');
  }
  return JSON.parse(resource.text) as unknown;
}

function logCount(content: unknown): void {
  const count = getCount(content);
  if (count !== undefined) console.log(`  Count: ${count}`);
}

async function safelyCheck<T>(failureMessage: string, check: () => Promise<T>): Promise<T | undefined> {
  try {
    return await check();
  } catch (error) {
    console.error(failureMessage, error);
    return undefined;
  }
}

async function listResources(client: Client): Promise<void> {
  console.log('\n📋 Listing resources...');
  const resources = await client.listResources();
  console.log(`Found ${resources.resources.length} resources:`);
  for (const resource of resources.resources) {
    console.log(`- ${resource.name} (${resource.uri})`);
  }
}

async function readWorkspaces(client: Client): Promise<void> {
  console.log('\n📖 Reading workspaces...');
  await safelyCheck('❌ Failed to read workspaces:', async () => {
    const content = parseTextResource(
      await client.readResource({ uri: 'businessmap://workspaces' })
    );
    console.log('✅ Successfully read workspaces:');
    logCount(content);
    const workspace = getNamedListItem(getCollection(content)?.[0], 'workspace_id');
    if (workspace) console.log(`  First workspace: ${workspace.name} (ID: ${workspace.id})`);
  });
}

async function readBoards(client: Client): Promise<number | undefined> {
  console.log('\n📖 Reading boards...');
  return safelyCheck('❌ Failed to read boards:', async () => {
    const content = parseTextResource(await client.readResource({ uri: 'businessmap://boards' }));
    console.log('✅ Successfully read boards:');
    logCount(content);
    const board = getNamedListItem(getCollection(content)?.[0], 'board_id');
    if (!board) return undefined;
    console.log(`  First board: ${board.name} (ID: ${board.id})`);
    return board.id;
  });
}

async function readBoardDetails(client: Client, boardId: number): Promise<void> {
  console.log(`\n📖 Reading details for board ${boardId}...`);
  await safelyCheck(`❌ Failed to read board ${boardId}:`, async () => {
    await client.readResource({ uri: `businessmap://boards/${boardId}` });
    console.log('✅ Successfully read board details');
  });
}

async function readCards(client: Client, boardId: number): Promise<void> {
  console.log(`\n📖 Reading cards for board ${boardId}...`);
  await safelyCheck(`❌ Failed to read cards for board ${boardId}:`, async () => {
    const content = parseTextResource(
      await client.readResource({ uri: `businessmap://boards/${boardId}/cards` })
    );
    console.log('✅ Successfully read cards:');
    logCount(content);
    const firstCard = getCollection(content)?.[0];
    if (isCardListItem(firstCard)) {
      console.log(`  First card: ${firstCard.card_id} - ${firstCard.title}`);
    }
  });
}

async function validateResources(client: Client): Promise<void> {
  await listResources(client);
  await readWorkspaces(client);
  const boardId = await readBoards(client);
  if (boardId === undefined) return;
  await readBoardDetails(client, boardId);
  await readCards(client, boardId);
}

async function closeClient(client: Client): Promise<void> {
  try {
    await client.close();
  } catch {
    // The child process may already be closed after a connection failure.
  }
}

async function main(): Promise<void> {
  console.log('🧪 Starting Resource Validation...');
  const serverPath = getServerPath();
  if (!serverPath) return;

  console.log(`🔌 Connecting to server at ${serverPath}...`);
  const { client, transport } = createClient(serverPath);
  try {
    await client.connect(transport);
    console.log('✅ Connected to server!');
    await validateResources(client);
    console.log('\n🎉 Validation complete!');
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exitCode = 1;
  } finally {
    await closeClient(client);
  }
}

try {
  await main();
} catch (error) {
  console.error('❌ Unexpected error:', error);
  process.exitCode = 1;
}
