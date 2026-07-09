import type { AxiosInstance } from 'axios';
import { BoardClient } from './board-client.js';

function createClient(defaultWorkspaceId?: number) {
  const get = jest.fn().mockResolvedValue({ data: { data: [] } });
  const post = jest.fn().mockResolvedValue({ data: { data: { board_id: 10 } } });
  const client = new BoardClient();
  client.initialize({ get, post } as unknown as AxiosInstance, {
    apiUrl: 'https://example.kanbanize.com/api/v2',
    apiToken: 'token',
    defaultWorkspaceId,
  });
  return { client, get, post };
}

describe('BoardClient default workspace', () => {
  it('applies the configured workspace when no list filter is provided', async () => {
    const { client, get } = createClient(12);

    await client.getBoards();

    expect(get).toHaveBeenCalledWith('/boards', { params: { workspace_id: 12 } });
  });

  it('keeps an explicit workspace filter', async () => {
    const { client, get } = createClient(12);

    await client.getBoards({ workspace_id: 99 });

    expect(get).toHaveBeenCalledWith('/boards', { params: { workspace_id: 99 } });
  });

  it('applies the configured workspace when creating a board', async () => {
    const { client, post } = createClient(12);

    await client.createBoard({ name: 'Delivery', workspace_id: undefined });

    expect(post).toHaveBeenCalledWith('/boards', {
      name: 'Delivery',
      workspace_id: 12,
    });
  });
});
