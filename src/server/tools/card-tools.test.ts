import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
import { config } from '../../config/environment.js';
import type { Card } from '../../types/index.js';
import { CardToolHandler } from './card-tools.js';

interface TextToolResponse {
  content: Array<{ text: string }>;
}

describe('CardToolHandler compact responses', () => {
  const originalProfile = config.businessMap.toolProfile;

  afterAll(() => {
    config.businessMap.toolProfile = originalProfile;
  });

  it('preserves pagination while returning only summary fields', async () => {
    config.businessMap.toolProfile = 'full';
    const card = {
      card_id: 1,
      custom_id: 'CARD-1',
      board_id: 2,
      title: 'Compact card',
      owner_user_id: 3,
      type_id: 4,
      column_id: 5,
      lane_id: 6,
      size: 8,
      priority: 2,
      deadline: '2026-07-30',
      is_blocked: 0,
      description: 'This large field should not be returned',
    } as Card;
    const getCardsPage = jest.fn().mockResolvedValue({
      data: [card],
      pagination: { all_pages: 1, current_page: 1, results_per_page: 50 },
    });
    const client = { cards: { getCardsPage } } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new CardToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(([name]) => name === 'list_cards');
    const callback = registration?.[2] as (args: {
      board_id: number;
      include_pagination: boolean;
      compact: boolean;
    }) => Promise<TextToolResponse>;

    const response = await callback({
      board_id: 2,
      include_pagination: true,
      compact: true,
    });
    const payload = JSON.parse(response.content[0]!.text) as {
      data: Array<Record<string, unknown>>;
      pagination: unknown;
    };

    expect(payload.pagination).toEqual({
      all_pages: 1,
      current_page: 1,
      results_per_page: 50,
    });
    expect(payload.data[0]).toEqual({
      card_id: 1,
      custom_id: 'CARD-1',
      board_id: 2,
      title: 'Compact card',
      owner_user_id: 3,
      type_id: 4,
      column_id: 5,
      lane_id: 6,
      size: 8,
      priority: 2,
      deadline: '2026-07-30',
      is_blocked: 0,
    });
  });
});
