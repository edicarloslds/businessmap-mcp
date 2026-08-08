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

  it('uses bounded compact pagination when discovery options are omitted', async () => {
    config.businessMap.toolProfile = 'full';
    const getCardsPage = jest.fn().mockResolvedValue({ data: [] });
    const client = { cards: { getCardsPage } } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new CardToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(([name]) => name === 'list_cards');
    const callback = registration?.[2] as (args: { board_id: number }) => Promise<TextToolResponse>;

    const response = await callback({ board_id: 2 });

    expect(getCardsPage).toHaveBeenCalledWith(2, { per_page: 50 });
    expect(JSON.parse(response.content[0]!.text)).toEqual({ data: [] });
  });

  it('returns a card summary with pointers to deeper tools by default', async () => {
    config.businessMap.toolProfile = 'full';
    const card = {
      card_id: 1,
      custom_id: 'CARD-1',
      board_id: 2,
      title: 'Inspect me',
      description: 'Relevant detail',
      attachments: [{ id: 1 }],
      custom_fields: Array.from({ length: 20 }, (_, index) => ({
        field_id: index,
        value: 'x'.repeat(100),
      })),
      subtasks: [{ subtask_id: 9 }],
      linked_cards: [],
      outcomes: [],
    } as unknown as Card;
    const getCard = jest.fn().mockResolvedValue(card);
    const client = { cards: { getCard } } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new CardToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(([name]) => name === 'get_card');
    const callback = registration?.[2] as (args: { card_id: number }) => Promise<TextToolResponse>;

    const response = await callback({ card_id: 1 });
    const payload = JSON.parse(response.content[0]!.text) as Record<string, unknown>;
    const fullResponse = await (
      callback as (args: { card_id: number; detail_level: 'full' }) => Promise<TextToolResponse>
    )({ card_id: 1, detail_level: 'full' });

    expect(payload).toMatchObject({
      card_id: 1,
      description: 'Relevant detail',
      related_counts: { attachments: 1, subtasks: 1 },
      next_tools: expect.arrayContaining(['get_card_comments', 'get_card_subtasks']),
      full_profile_tools: expect.arrayContaining(['get_card_flow_history']),
    });
    expect(response.content[0]!.text.length).toBeLessThan(fullResponse.content[0]!.text.length);
  });
});
