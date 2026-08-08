import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
import { config } from '../../config/environment.js';
import type { Board } from '../../types/index.js';
import { BoardToolHandler } from './board-tools.js';

interface TextToolResponse {
  content: Array<{ text: string }>;
}

describe('BoardToolHandler hierarchy', () => {
  const originalProfile = config.businessMap.toolProfile;

  beforeEach(() => {
    config.businessMap.toolProfile = 'full';
  });

  afterAll(() => {
    config.businessMap.toolProfile = originalProfile;
  });

  it('returns compact board candidates without loading structure', async () => {
    const board = {
      board_id: 7,
      workspace_id: 3,
      name: 'Delivery',
      description: 'Large description',
      is_archived: 0,
    } as Board;
    const getBoards = jest.fn().mockResolvedValue([board]);
    const getBoardStructure = jest.fn();
    const client = { boards: { getBoards, getBoardStructure } } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new BoardToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(([name]) => name === 'search_board');
    const callback = registration?.[2] as (args: {
      board_name: string;
    }) => Promise<TextToolResponse>;

    const response = await callback({ board_name: 'deliv' });
    const payload = JSON.parse(response.content[0]!.text) as Record<string, unknown>;

    expect(payload).toEqual({
      matches: [{ board_id: 7, workspace_id: 3, name: 'Delivery', is_archived: 0 }],
      count: 1,
    });
    expect(getBoardStructure).not.toHaveBeenCalled();
  });

  it('gets board detail without loading structure', async () => {
    const board = { board_id: 7, workspace_id: 3, name: 'Delivery' } as Board;
    const getBoard = jest.fn().mockResolvedValue(board);
    const getBoardStructure = jest.fn();
    const client = { boards: { getBoard, getBoardStructure } } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new BoardToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(([name]) => name === 'get_board');
    const callback = registration?.[2] as (args: { board_id: number }) => Promise<TextToolResponse>;

    const response = await callback({ board_id: 7 });

    expect(JSON.parse(response.content[0]!.text)).toMatchObject({ board_id: 7, name: 'Delivery' });
    expect(getBoardStructure).not.toHaveBeenCalled();
  });
});
