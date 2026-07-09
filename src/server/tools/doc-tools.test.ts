import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BusinessMapClient } from '../../client/businessmap-client.js';
import { config } from '../../config/environment.js';
import type { Doc, DocListItem } from '../../types/index.js';
import { DocToolHandler } from './doc-tools.js';

describe('DocToolHandler content scanning', () => {
  const originalProfile = config.businessMap.toolProfile;

  afterAll(() => {
    config.businessMap.toolProfile = originalProfile;
  });

  it('reports successful and failed document fetches separately', async () => {
    config.businessMap.toolProfile = 'full';
    const docs = [
      { doc_id: 1, title: 'First', updated_at: '2026-07-03' },
      { doc_id: 2, title: 'Second', updated_at: '2026-07-02' },
      { doc_id: 3, title: 'Third', updated_at: '2026-07-01' },
    ] as DocListItem[];
    const getDoc = jest.fn(async (id: number) => {
      if (id === 2) {
        throw new Error('Temporary API failure');
      }
      return {
        doc_id: id,
        content: id === 1 ? '<p>Contains the needle here</p>' : '<p>No match</p>',
      } as Doc;
    });
    const client = {
      docs: {
        getDocs: jest.fn().mockResolvedValue(docs),
        getDoc,
      },
    } as unknown as BusinessMapClient;
    const registerTool = jest.fn();
    new DocToolHandler().registerTools(
      { registerTool } as unknown as McpServer,
      client,
      true
    );
    const registration = registerTool.mock.calls.find(
      ([name]) => name === 'get_docs_text_title_search'
    );
    const callback = registration?.[2] as (args: {
      query: string;
      include_archived: boolean;
      max_docs_to_scan: number;
    }) => Promise<{ content: Array<{ text: string }> }>;

    const response = await callback({
      query: 'needle',
      include_archived: false,
      max_docs_to_scan: 10,
    });
    const payload = JSON.parse(response.content[0]!.text) as Record<string, unknown>;

    expect(payload).toMatchObject({
      count: 1,
      scanned_docs_for_content: 3,
      successfully_scanned_docs: 2,
      failed_docs: 1,
    });
  });
});
