import type { AxiosInstance } from 'axios';
import type { Card } from '../../types/index.js';
import { CardClient } from './card-client.js';

function createClient(get: jest.Mock): CardClient {
  const client = new CardClient();
  client.initialize({ get } as unknown as AxiosInstance, {
    apiUrl: 'https://example.kanbanize.com/api/v2',
    apiToken: 'token',
  });
  return client;
}

describe('CardClient pagination', () => {
  const card = { card_id: 42, title: 'Example' } as Card;

  it('keeps getCards backward compatible with an array response', async () => {
    const get = jest.fn().mockResolvedValue({
      data: {
        data: {
          pagination: {
            all_pages: 3,
            current_page: 2,
            results_per_page: 50,
          },
          data: [card],
        },
      },
    });
    const client = createClient(get);

    await expect(client.getCards(7, { page: 2 })).resolves.toEqual([card]);
  });

  it('returns pagination metadata when explicitly requested', async () => {
    const payload = {
      pagination: {
        all_pages: 3,
        current_page: 2,
        results_per_page: 50,
      },
      data: [card],
    };
    const get = jest.fn().mockResolvedValue({ data: { data: payload } });
    const client = createClient(get);

    await expect(client.getCardsPage(7, { page: 2 })).resolves.toEqual(payload);
  });

  it('normalizes pagination metadata from the response meta object', async () => {
    const get = jest.fn().mockResolvedValue({
      data: {
        data: [card],
        meta: { total_count: 101, page: 2, per_page: 50 },
      },
    });
    const client = createClient(get);

    await expect(client.getCardsPage(7)).resolves.toEqual({
      data: [card],
      pagination: {
        all_pages: 3,
        current_page: 2,
        results_per_page: 50,
      },
    });
  });
});
