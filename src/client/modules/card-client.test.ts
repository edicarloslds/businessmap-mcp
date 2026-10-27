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

describe('CardClient write responses', () => {
  const card = { card_id: 7, title: 'Written card' } as Card;

  function createWriteClient(http: Record<string, jest.Mock>): CardClient {
    const client = new CardClient();
    client.initialize(http as unknown as AxiosInstance, {
      apiUrl: 'https://example.kanbanize.com/api/v2',
      apiToken: 'token',
    });
    return client;
  }

  it('unwraps the created card from the array returned by POST /cards', async () => {
    const post = jest.fn().mockResolvedValue({ data: { data: [card] } });
    const client = createWriteClient({ post });

    await expect(client.createCard({ title: 'Written card', column_id: 1 })).resolves.toBe(card);
  });

  it('unwraps the updated card from the array returned by PATCH /cards/{id}', async () => {
    const patch = jest.fn().mockResolvedValue({ data: { data: [card] } });
    const get = jest.fn();
    const client = createWriteClient({ patch, get });

    await expect(client.updateCard({ card_id: 7, size: 3 })).resolves.toBe(card);
    await expect(client.moveCard(7, 2)).resolves.toBe(card);
    expect(get).not.toHaveBeenCalled();
  });

  it('fetches the card when PATCH changes nothing and returns an empty array', async () => {
    const patch = jest.fn().mockResolvedValue({ data: { data: [] } });
    const get = jest.fn().mockResolvedValue({ data: { data: card } });
    const client = createWriteClient({ patch, get });

    await expect(client.updateCard({ card_id: 7, title: 'Written card' })).resolves.toBe(card);
    expect(get).toHaveBeenCalledWith('/cards/7');
  });

  it('returns the updated card when linked cards come first in the PATCH response', async () => {
    // The API sorts changed cards by card_id, so a linked card with a lower ID comes first
    const linkedCard = { card_id: 3, title: 'Linked card' } as Card;
    const patch = jest.fn().mockResolvedValue({ data: { data: [linkedCard, card] } });
    const get = jest.fn();
    const client = createWriteClient({ patch, get });

    await expect(
      client.updateCard({
        card_id: 7,
        links_to_existing_cards_to_add_or_update: [{ linked_card_id: 3, link_type: 'parent' }],
      })
    ).resolves.toBe(card);
    expect(get).not.toHaveBeenCalled();
  });

  it('fetches the card when only linked cards come back in the PATCH response', async () => {
    const linkedCard = { card_id: 3, title: 'Linked card' } as Card;
    const patch = jest.fn().mockResolvedValue({ data: { data: [linkedCard] } });
    const get = jest.fn().mockResolvedValue({ data: { data: card } });
    const client = createWriteClient({ patch, get });

    await expect(
      client.updateCard({
        card_id: 7,
        links_to_existing_cards_to_remove: [{ linked_card_id: 3, link_type: 'parent' }],
      })
    ).resolves.toBe(card);
    expect(get).toHaveBeenCalledWith('/cards/7');
  });

  it('returns the created card instead of the cards it was linked to', async () => {
    const linkedCard = { card_id: 3, title: 'Linked card' } as Card;
    const post = jest.fn().mockResolvedValue({ data: { data: [linkedCard, card] } });
    const client = createWriteClient({ post });

    await expect(
      client.createCard({
        title: 'Written card',
        column_id: 1,
        links_to_existing_cards_to_add_or_update: [{ linked_card_id: 3, link_type: 'child' }],
      })
    ).resolves.toBe(card);
  });
});

describe('CardClient expanded card lookup', () => {
  const card = { card_id: 42, title: 'Archived card' } as Card;

  it('uses one request when the active card is found', async () => {
    const get = jest.fn().mockResolvedValue({ data: { data: [card] } });
    const client = createClient(get);

    await expect(client.getCardTransitions(42)).resolves.toBe(card);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0]?.[1]?.params.state).toBe('active');
  });

  it('checks archived and discarded states after the active lookup misses', async () => {
    const get = jest.fn().mockImplementation((_path, options) => {
      const state = options.params.state;
      return Promise.resolve({
        data: { data: state === 'archived' ? [card] : [] },
      });
    });
    const client = createClient(get);

    await expect(client.getCardTransitions(42)).resolves.toBe(card);
    expect(get.mock.calls.map((call) => call[1].params.state)).toEqual([
      'active',
      'archived',
      'discarded',
    ]);
  });
});

describe('CardClient updateCard', () => {
  it('sends link changes in the PATCH body without the card_id', async () => {
    const card = { card_id: 1, title: 'Linked' } as Card;
    const patch = jest.fn().mockResolvedValue({ data: { data: card } });
    const client = new CardClient();
    client.initialize({ patch } as unknown as AxiosInstance, {
      apiUrl: 'https://example.kanbanize.com/api/v2',
      apiToken: 'token',
    });

    await expect(
      client.updateCard({
        card_id: 1,
        links_to_existing_cards_to_add_or_update: [{ linked_card_id: 2, link_type: 'parent' }],
        links_to_existing_cards_to_remove: [{ linked_card_id: 3, link_type: 'relative' }],
      })
    ).resolves.toBe(card);

    expect(patch).toHaveBeenCalledWith('/cards/1', {
      links_to_existing_cards_to_add_or_update: [{ linked_card_id: 2, link_type: 'parent' }],
      links_to_existing_cards_to_remove: [{ linked_card_id: 3, link_type: 'relative' }],
    });
  });
});
