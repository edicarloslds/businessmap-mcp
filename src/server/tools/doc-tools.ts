import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  archiveDocSchema,
  createDocSchema,
  createPersonalDocSchema,
  getDocContentBatchSchema,
  getDocHierarchySchema,
  getDocsForBoardsBatchSchema,
  getDocsTextTitleSearchSchema,
  listDocsSchema,
  listPersonalDocsSchema,
  searchDocsSchema,
  updateDocSchema,
  updatePersonalDocSchema,
} from '../../schemas/index.js';
import { DocListItem } from '../../types/index.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

interface DocTreeNode extends DocListItem {
  children: DocTreeNode[];
}

/** Strip HTML tags and collapse whitespace for content snippets */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract a snippet of plain text around the first match of query */
function extractSnippet(content: string, query: string, radius = 80): string | null {
  const text = toPlainText(content);
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return null;
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + query.length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

export class DocToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerSearchDocs(server, client);
    this.registerGetDocsTextTitleSearch(server, client);
    this.registerGetDocHierarchy(server, client);
    this.registerListDocs(server, client);
    this.registerListPersonalDocs(server, client);
    this.registerGetDocContentBatch(server, client);
    this.registerGetDocsForBoardsBatch(server, client);

    if (!readOnlyMode) {
      this.registerCreateDoc(server, client);
      this.registerUpdateDoc(server, client);
      this.registerArchiveDoc(server, client);
      this.registerUnarchiveDoc(server, client);
      this.registerCreatePersonalDoc(server, client);
      this.registerUpdatePersonalDoc(server, client);
    }
  }

  private registerSearchDocs(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'search_docs',
      {
        title: 'Search Docs',
        description:
          'Search docs by title (case-insensitive substring match). Returns doc metadata without content; use get_doc_content_batch to fetch content.',
        inputSchema: searchDocsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ query, include_archived, include_personal }) => {
        try {
          const docs = await client.getDocs(include_archived ? {} : { is_archived: 0 });
          const lowered = query.toLowerCase();
          const matches: unknown[] = docs
            .filter((d) => d.title.toLowerCase().includes(lowered))
            .map((d) => ({ ...d, personal: false }));
          if (include_personal) {
            const personalDocs = await client.getPersonalDocs();
            matches.push(
              ...personalDocs
                .filter((d) => d.title.toLowerCase().includes(lowered))
                .map((d) => ({ ...d, personal: true }))
            );
          }
          return createSuccessResponse({ query, matches, count: matches.length });
        } catch (error) {
          return createErrorResponse(error, 'searching docs');
        }
      }
    );
  }

  private registerGetDocsTextTitleSearch(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_docs_text_title_search',
      {
        title: 'Search Docs by Title and Content',
        description:
          'Search docs by title AND content (case-insensitive). Content search fetches each doc, so it is limited by max_docs_to_scan (default 100). Returns matches with a content snippet.',
        inputSchema: getDocsTextTitleSearchSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ query, include_archived, max_docs_to_scan }) => {
        try {
          const docs = await client.getDocs(include_archived ? {} : { is_archived: 0 });
          const lowered = query.toLowerCase();
          const titleMatches = new Map<number, { doc: DocListItem; snippet: string | null }>();
          for (const doc of docs) {
            if (doc.title.toLowerCase().includes(lowered)) {
              titleMatches.set(doc.doc_id, { doc, snippet: null });
            }
          }

          // Scan content of remaining docs, most recently updated first
          const scanLimit = max_docs_to_scan ?? 100;
          const toScan = docs
            .filter((d) => !titleMatches.has(d.doc_id))
            .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
            .slice(0, scanLimit);
          const chunkSize = 5;
          for (let i = 0; i < toScan.length; i += chunkSize) {
            const chunk = toScan.slice(i, i + chunkSize);
            const details = await Promise.all(
              chunk.map((d) => client.getDoc(d.doc_id).catch(() => null))
            );
            for (const detail of details) {
              if (!detail?.content) continue;
              const snippet = extractSnippet(detail.content, query);
              if (snippet !== null) {
                titleMatches.set(detail.doc_id, {
                  doc: docs.find((d) => d.doc_id === detail.doc_id)!,
                  snippet,
                });
              }
            }
          }

          const matches = [...titleMatches.values()].map(({ doc, snippet }) => ({
            ...doc,
            matched_in: snippet === null ? 'title' : 'content',
            snippet,
          }));
          return createSuccessResponse({
            query,
            matches,
            count: matches.length,
            scanned_docs_for_content: toScan.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'searching docs by title and content');
        }
      }
    );
  }

  private registerGetDocHierarchy(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_doc_hierarchy',
      {
        title: 'Get Doc Hierarchy',
        description:
          'Get the hierarchical tree of docs (parent/child structure). Optionally rooted at a specific doc.',
        inputSchema: getDocHierarchySchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ parent_doc_id, include_archived }) => {
        try {
          const docs = await client.getDocs(include_archived ? {} : { is_archived: 0 });
          const nodes = new Map<number, DocTreeNode>();
          for (const doc of docs) {
            nodes.set(doc.doc_id, { ...doc, children: [] });
          }
          const roots: DocTreeNode[] = [];
          for (const node of nodes.values()) {
            const parent = node.parent_doc_id ? nodes.get(node.parent_doc_id) : undefined;
            if (parent) {
              parent.children.push(node);
            } else {
              roots.push(node);
            }
          }
          const sortTree = (list: DocTreeNode[]): void => {
            list.sort((a, b) => a.position - b.position);
            list.forEach((n) => sortTree(n.children));
          };
          sortTree(roots);

          if (parent_doc_id !== undefined) {
            const root = nodes.get(parent_doc_id);
            if (!root) {
              return createErrorResponse(
                new Error(`Doc with ID ${parent_doc_id} not found`),
                'getting doc hierarchy'
              );
            }
            return createSuccessResponse({ hierarchy: [root], total_docs: docs.length });
          }
          return createSuccessResponse({ hierarchy: roots, total_docs: docs.length });
        } catch (error) {
          return createErrorResponse(error, 'getting doc hierarchy');
        }
      }
    );
  }

  private registerListDocs(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_docs',
      {
        title: 'List Docs',
        description:
          'Get a list of docs (metadata only, no content) with optional filters. Use get_doc_content_batch to fetch content.',
        inputSchema: listDocsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async (params) => {
        try {
          const docs = await client.getDocs(params);
          return createSuccessResponse({ docs, count: docs.length });
        } catch (error) {
          return createErrorResponse(error, 'listing docs');
        }
      }
    );
  }

  private registerListPersonalDocs(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_personal_docs',
      {
        title: 'List Personal Docs',
        description:
          'Get a list of your personal docs (metadata only, no content). Use get_doc_content_batch with personal=true to fetch content.',
        inputSchema: listPersonalDocsSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async (params) => {
        try {
          const docs = await client.getPersonalDocs(params);
          return createSuccessResponse({ docs, count: docs.length });
        } catch (error) {
          return createErrorResponse(error, 'listing personal docs');
        }
      }
    );
  }

  private registerGetDocContentBatch(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_doc_content_batch',
      {
        title: 'Get Doc Content Batch',
        description:
          'Get the full details (including content) of up to 20 docs in a single call. Set personal=true for personal docs.',
        inputSchema: getDocContentBatchSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ doc_ids, personal }) => {
        try {
          const results = await Promise.all(
            doc_ids.map(async (docId) => {
              try {
                const doc = personal
                  ? await client.getPersonalDoc(docId)
                  : await client.getDoc(docId);
                return { doc_id: docId, doc };
              } catch (error) {
                return {
                  doc_id: docId,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            })
          );
          return createSuccessResponse({ docs: results, count: results.length });
        } catch (error) {
          return createErrorResponse(error, 'getting doc content batch');
        }
      }
    );
  }

  private registerGetDocsForBoardsBatch(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_docs_for_boards_batch',
      {
        title: 'Get Docs for Boards Batch',
        description: 'Get the docs pinned to each of up to 10 boards in a single call',
        inputSchema: getDocsForBoardsBatchSchema.shape,
        annotations: { readOnlyHint: true, idempotentHint: true },
      },
      async ({ board_ids }) => {
        try {
          const results = await Promise.all(
            board_ids.map(async (boardId) => {
              try {
                const docs = await client.getBoardDocs(boardId);
                return { board_id: boardId, docs };
              } catch (error) {
                return {
                  board_id: boardId,
                  error: error instanceof Error ? error.message : 'Unknown error',
                };
              }
            })
          );
          return createSuccessResponse({ boards: results });
        } catch (error) {
          return createErrorResponse(error, 'getting docs for boards');
        }
      }
    );
  }

  private registerCreateDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_doc',
      {
        title: 'Create Doc',
        description: 'Create a new doc, optionally as a child of another doc',
        inputSchema: createDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      },
      async (params) => {
        try {
          const doc = await client.createDoc(params);
          return createSuccessResponse(doc, 'Doc created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating doc');
        }
      }
    );
  }

  private registerUpdateDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_doc',
      {
        title: 'Update Doc',
        description: 'Update the title, content, position, or parent of an existing doc',
        inputSchema: updateDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ doc_id, ...params }) => {
        try {
          const doc = await client.updateDoc(doc_id, params);
          return createSuccessResponse(doc, 'Doc updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating doc');
        }
      }
    );
  }

  private registerArchiveDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'archive_doc',
      {
        title: 'Archive Doc',
        description: 'Archive a doc',
        inputSchema: archiveDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ doc_id }) => {
        try {
          const doc = await client.updateDoc(doc_id, { is_archived: 1 });
          return createSuccessResponse(doc, 'Doc archived successfully:');
        } catch (error) {
          return createErrorResponse(error, 'archiving doc');
        }
      }
    );
  }

  private registerUnarchiveDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'unarchive_doc',
      {
        title: 'Unarchive Doc',
        description: 'Restore an archived doc',
        inputSchema: archiveDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ doc_id }) => {
        try {
          const doc = await client.updateDoc(doc_id, { is_archived: 0 });
          return createSuccessResponse(doc, 'Doc unarchived successfully:');
        } catch (error) {
          return createErrorResponse(error, 'unarchiving doc');
        }
      }
    );
  }

  private registerCreatePersonalDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_personal_doc',
      {
        title: 'Create Personal Doc',
        description: 'Create a new personal doc (visible only to you)',
        inputSchema: createPersonalDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
      },
      async (params) => {
        try {
          const doc = await client.createPersonalDoc(params);
          return createSuccessResponse(doc, 'Personal doc created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating personal doc');
        }
      }
    );
  }

  private registerUpdatePersonalDoc(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_personal_doc',
      {
        title: 'Update Personal Doc',
        description: 'Update the title, content, or position of an existing personal doc',
        inputSchema: updatePersonalDocSchema.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      },
      async ({ doc_id, ...params }) => {
        try {
          const doc = await client.updatePersonalDoc(doc_id, params);
          return createSuccessResponse(doc, 'Personal doc updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating personal doc');
        }
      }
    );
  }
}
