import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
import { config } from '../../config/environment.js';
import { ESSENTIAL_TOOLS } from './base-tool.js';
import {
  BoardToolHandler,
  CardToolHandler,
  CustomFieldToolHandler,
  DocToolHandler,
  SetupToolHandler,
  UserToolHandler,
  UtilityToolHandler,
  WorkflowToolHandler,
  WorkspaceToolHandler,
} from './index.js';

const handlers = [
  new WorkspaceToolHandler(),
  new BoardToolHandler(),
  new CardToolHandler(),
  new CustomFieldToolHandler(),
  new DocToolHandler(),
  new UserToolHandler(),
  new UtilityToolHandler(),
  new WorkflowToolHandler(),
  new SetupToolHandler(),
];

describe('tool annotations', () => {
  const originalProfile = config.businessMap.toolProfile;

  beforeEach(() => {
    config.businessMap.toolProfile = 'full';
  });

  afterAll(() => {
    config.businessMap.toolProfile = originalProfile;
  });

  it('annotates every registered tool and marks delete operations as destructive', () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;
    const client = {} as BusinessMapClient;

    handlers.forEach((handler) => handler.registerTools(server, client, false));

    const tools = new Map<string, { annotations?: { destructiveHint?: boolean } }>(
      registerTool.mock.calls.map(([name, definition]) => [name, definition])
    );

    for (const [name, definition] of tools) {
      expect({ name, annotations: definition.annotations }).toEqual({
        name,
        annotations: expect.any(Object),
      });
    }

    for (const name of ['delete_card', 'delete_card_subtask', 'delete_comment', 'delete_column']) {
      expect(tools.get(name)?.annotations?.destructiveHint).toBe(true);
    }
  });

  it('registers only the essential catalog when selected', () => {
    config.businessMap.toolProfile = 'essential';
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;

    handlers.forEach((handler) =>
      handler.registerTools(server, {} as BusinessMapClient, false)
    );

    const names = new Set(registerTool.mock.calls.map(([name]) => name as string));
    expect(names).toEqual(ESSENTIAL_TOOLS);
  });
});
