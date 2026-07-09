import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
import { CardResourceHandler } from './card-resources.js';

describe('CardResourceHandler', () => {
  it('registers a bounded paginated cards resource', async () => {
    const getCardsPage = jest.fn().mockResolvedValue({
      data: [],
      pagination: { all_pages: 0, current_page: 2, results_per_page: 25 },
    });
    const client = { cards: { getCardsPage } } as unknown as BusinessMapClient;
    const registerResource = jest.fn();
    new CardResourceHandler().registerResources(
      { registerResource } as unknown as McpServer,
      client
    );
    const registration = registerResource.mock.calls.find(([name]) => name === 'card-page');
    const callback = registration?.[3] as (
      uri: URL,
      variables: Record<string, string>
    ) => Promise<{ contents: Array<{ text: string }> }>;

    const response = await callback(
      new URL('businessmap://boards/12/cards/pages/2/size/25'),
      { board_id: '12', page: '2', per_page: '25' }
    );

    expect(getCardsPage).toHaveBeenCalledWith(12, { page: 2, per_page: 25 });
    expect(JSON.parse(response.contents[0]!.text)).toMatchObject({
      data: [],
      pagination: { current_page: 2, results_per_page: 25 },
    });
  });
});
