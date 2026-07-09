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
import { Doc, DocListItem } from '../../types/index.js';
import {
  BaseToolHandler,
  READ_ONLY,
  WRITE,
  WRITE_IDEMPOTENT,
  registerTool,
} from './base-tool.js';

interface DocTreeNode extends DocListItem {
  children: DocTreeNode[];
}

interface DocSearchMatch {
  doc: DocListItem;
  snippet: string | null;
}

interface DocScanStats {
  attempted: number;
  succeeded: number;
  failed: number;
}

function stripHtmlTags(html: string): string {
  let text = '';
  let insideTag = false;
  for (const character of html) {
    if (character === '<') {
      insideTag = true;
    } else if (character === '>') {
      insideTag = false;
      text += ' ';
    } else if (!insideTag) {
      text += character;
    }
  }
  return text;
}

/** Strip HTML tags and collapse whitespace for content snippets */
function toPlainText(html: string): string {
  return stripHtmlTags(html).replaceAll('&nbsp;', ' ').replace(/\s+/g, ' ').trim();
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
    registerTool(server, {
      name: 'search_docs',
      title: 'Search Docs',
      description:
        'Search docs by title (case-insensitive substring match). Returns doc metadata without content; use get_doc_content_batch to fetch content.',
      schema: searchDocsSchema,
      annotations: READ_ONLY,
      errorContext: 'searching docs',
      handler: async ({ query, include_archived, include_personal }) => {
        const docs = await client.docs.getDocs(include_archived ? {} : { is_archived: 0 });
        const lowered = query.toLowerCase();
        const matches: unknown[] = docs
          .filter((d) => d.title.toLowerCase().includes(lowered))
          .map((d) => ({ ...d, personal: false }));
        if (include_personal) {
          const personalDocs = await client.docs.getPersonalDocs();
          matches.push(
            ...personalDocs
              .filter((d) => d.title.toLowerCase().includes(lowered))
              .map((d) => ({ ...d, personal: true }))
          );
        }
        return { query, matches, count: matches.length };
      },
    });

    registerTool(server, {
      name: 'get_docs_text_title_search',
      title: 'Search Docs by Title and Content',
      description:
        'Search docs by title AND content (case-insensitive). Content search fetches each doc, so it is limited by max_docs_to_scan (default 100). Returns matches with a content snippet.',
      schema: getDocsTextTitleSearchSchema,
      annotations: READ_ONLY,
      errorContext: 'searching docs by title and content',
      handler: async ({ query, include_archived, max_docs_to_scan }) => {
        const docs = await client.docs.getDocs(include_archived ? {} : { is_archived: 0 });
        const matches = new Map<number, DocSearchMatch>();
        const lowered = query.toLowerCase();
        for (const doc of docs) {
          if (doc.title.toLowerCase().includes(lowered)) {
            matches.set(doc.doc_id, { doc, snippet: null });
          }
        }
        const scan = await this.scanDocContents(
          client,
          docs.filter((d) => !matches.has(d.doc_id)),
          query,
          max_docs_to_scan ?? 100,
          matches
        );
        const results = [...matches.values()].map(({ doc, snippet }) => ({
          ...doc,
          matched_in: snippet === null ? 'title' : 'content',
          snippet,
        }));
        return {
          query,
          matches: results,
          count: results.length,
          scanned_docs_for_content: scan.attempted,
          successfully_scanned_docs: scan.succeeded,
          failed_docs: scan.failed,
        };
      },
    });

    registerTool(server, {
      name: 'get_doc_hierarchy',
      title: 'Get Doc Hierarchy',
      description:
        'Get the hierarchical tree of docs (parent/child structure). Optionally rooted at a specific doc.',
      schema: getDocHierarchySchema,
      annotations: READ_ONLY,
      errorContext: 'getting doc hierarchy',
      handler: async ({ parent_doc_id, include_archived }) => {
        const docs = await client.docs.getDocs(include_archived ? {} : { is_archived: 0 });
        const { roots, nodes } = this.buildDocTree(docs);
        if (parent_doc_id !== undefined) {
          const root = nodes.get(parent_doc_id);
          if (!root) {
            throw new Error(`Doc with ID ${parent_doc_id} not found`);
          }
          return { hierarchy: [root], total_docs: docs.length };
        }
        return { hierarchy: roots, total_docs: docs.length };
      },
    });

    registerTool(server, {
      name: 'list_docs',
      title: 'List Docs',
      description:
        'Get a list of docs (metadata only, no content) with optional filters. Use get_doc_content_batch to fetch content.',
      schema: listDocsSchema,
      annotations: READ_ONLY,
      errorContext: 'listing docs',
      handler: async (params) => {
        const docs = await client.docs.getDocs(params);
        return { docs, count: docs.length };
      },
    });

    registerTool(server, {
      name: 'list_personal_docs',
      title: 'List Personal Docs',
      description:
        'Get a list of your personal docs (metadata only, no content). Use get_doc_content_batch with personal=true to fetch content.',
      schema: listPersonalDocsSchema,
      annotations: READ_ONLY,
      errorContext: 'listing personal docs',
      handler: async (params) => {
        const docs = await client.docs.getPersonalDocs(params);
        return { docs, count: docs.length };
      },
    });

    registerTool(server, {
      name: 'get_doc_content_batch',
      title: 'Get Doc Content Batch',
      description:
        'Get the full details (including content) of up to 20 docs in a single call. Set personal=true for personal docs.',
      schema: getDocContentBatchSchema,
      annotations: READ_ONLY,
      errorContext: 'getting doc content batch',
      handler: async ({ doc_ids, personal }) => {
        const results = await Promise.all(
          doc_ids.map(async (docId) => {
            try {
              const doc = personal
                ? await client.docs.getPersonalDoc(docId)
                : await client.docs.getDoc(docId);
              return { doc_id: docId, doc };
            } catch (error) {
              return {
                doc_id: docId,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );
        return { docs: results, count: results.length };
      },
    });

    registerTool(server, {
      name: 'get_docs_for_boards_batch',
      title: 'Get Docs for Boards Batch',
      description: 'Get the docs pinned to each of up to 10 boards in a single call',
      schema: getDocsForBoardsBatchSchema,
      annotations: READ_ONLY,
      errorContext: 'getting docs for boards',
      handler: async ({ board_ids }) => {
        const results = await Promise.all(
          board_ids.map(async (boardId) => {
            try {
              const docs = await client.docs.getBoardDocs(boardId);
              return { board_id: boardId, docs };
            } catch (error) {
              return {
                board_id: boardId,
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          })
        );
        return { boards: results };
      },
    });

    if (!readOnlyMode) {
      registerTool(server, {
        name: 'create_doc',
        title: 'Create Doc',
        description: 'Create a new doc, optionally as a child of another doc',
        schema: createDocSchema,
        annotations: WRITE,
        errorContext: 'creating doc',
        successMessage: 'Doc created successfully:',
        handler: (params) => client.docs.createDoc(params),
      });

      registerTool(server, {
        name: 'update_doc',
        title: 'Update Doc',
        description: 'Update the title, content, position, or parent of an existing doc',
        schema: updateDocSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating doc',
        successMessage: 'Doc updated successfully:',
        handler: ({ doc_id, ...params }) => client.docs.updateDoc(doc_id, params),
      });

      registerTool(server, {
        name: 'archive_doc',
        title: 'Archive Doc',
        description: 'Archive a doc',
        schema: archiveDocSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'archiving doc',
        successMessage: 'Doc archived successfully:',
        handler: ({ doc_id }) => client.docs.updateDoc(doc_id, { is_archived: 1 }),
      });

      registerTool(server, {
        name: 'unarchive_doc',
        title: 'Unarchive Doc',
        description: 'Restore an archived doc',
        schema: archiveDocSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'unarchiving doc',
        successMessage: 'Doc unarchived successfully:',
        handler: ({ doc_id }) => client.docs.updateDoc(doc_id, { is_archived: 0 }),
      });

      registerTool(server, {
        name: 'create_personal_doc',
        title: 'Create Personal Doc',
        description: 'Create a new personal doc (visible only to you)',
        schema: createPersonalDocSchema,
        annotations: WRITE,
        errorContext: 'creating personal doc',
        successMessage: 'Personal doc created successfully:',
        handler: (params) => client.docs.createPersonalDoc(params),
      });

      registerTool(server, {
        name: 'update_personal_doc',
        title: 'Update Personal Doc',
        description: 'Update the title, content, or position of an existing personal doc',
        schema: updatePersonalDocSchema,
        annotations: WRITE_IDEMPOTENT,
        errorContext: 'updating personal doc',
        successMessage: 'Personal doc updated successfully:',
        handler: ({ doc_id, ...params }) => client.docs.updatePersonalDoc(doc_id, params),
      });
    }
  }

  /**
   * Fetch the content of up to `limit` docs (most recently updated first) and record
   * snippet matches for `query` into `matches`. Returns scan attempt statistics.
   */
  private async scanDocContents(
    client: BusinessMapClient,
    candidates: DocListItem[],
    query: string,
    limit: number,
    matches: Map<number, DocSearchMatch>
  ): Promise<DocScanStats> {
    const toScan = [...candidates]
      .sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
      .slice(0, limit);
    const docsById = new Map(toScan.map((doc) => [doc.doc_id, doc]));
    const chunkSize = 5;
    let succeeded = 0;
    for (let i = 0; i < toScan.length; i += chunkSize) {
      const chunk = toScan.slice(i, i + chunkSize);
      const details = await Promise.all(
        chunk.map((d) => client.docs.getDoc(d.doc_id).catch(() => null))
      );
      succeeded += this.recordDocMatches(details, docsById, query, matches);
    }
    return {
      attempted: toScan.length,
      succeeded,
      failed: toScan.length - succeeded,
    };
  }

  private recordDocMatches(
    details: Array<Doc | null>,
    docsById: Map<number, DocListItem>,
    query: string,
    matches: Map<number, DocSearchMatch>
  ): number {
    let succeeded = 0;
    for (const detail of details) {
      if (!detail) continue;
      succeeded++;
      if (!detail.content) continue;
      const snippet = extractSnippet(detail.content, query);
      const doc = docsById.get(detail.doc_id);
      if (snippet !== null && doc) {
        matches.set(detail.doc_id, { doc, snippet });
      }
    }
    return succeeded;
  }

  /** Build the parent/child tree from a flat doc list, sorted by position */
  private buildDocTree(docs: DocListItem[]): {
    roots: DocTreeNode[];
    nodes: Map<number, DocTreeNode>;
  } {
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
    return { roots, nodes };
  }
}
