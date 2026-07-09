import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
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

describe('tool annotations', () => {
  it('annotates every registered tool and marks delete operations as destructive', () => {
    const registerTool = jest.fn();
    const server = { registerTool } as unknown as McpServer;
    const client = {} as BusinessMapClient;
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
});
