import { z } from 'zod/v3';

// Schema for searching docs by title
export const searchDocsSchema = z.object({
  query: z.string().min(1).describe('Text to search for in doc titles (case-insensitive)'),
  include_archived: z
    .boolean()
    .optional()
    .describe('Set to true to also include archived docs (default false)'),
  include_personal: z
    .boolean()
    .optional()
    .describe('Set to true to also search your personal docs (default false)'),
});

// Schema for searching docs by title and content
export const getDocsTextTitleSearchSchema = z.object({
  query: z.string().min(1).describe('Text to search for in doc titles and content (case-insensitive)'),
  include_archived: z
    .boolean()
    .optional()
    .describe('Set to true to also include archived docs (default false)'),
  max_docs_to_scan: z
    .number()
    .min(1)
    .max(500)
    .optional()
    .describe(
      'Maximum number of docs whose content will be fetched and scanned (default 100). Title matches are always returned.'
    ),
});

// Schema for getting the doc hierarchy tree
export const getDocHierarchySchema = z.object({
  parent_doc_id: z
    .number()
    .optional()
    .describe('Optional root doc ID: when provided, returns only the subtree under this doc'),
  include_archived: z
    .boolean()
    .optional()
    .describe('Set to true to also include archived docs (default false)'),
});

// Schema for listing docs with filters
export const listDocsSchema = z.object({
  doc_ids: z.array(z.number()).optional().describe('A list of doc ids that you want to get'),
  title: z.string().optional().describe('Filter results to docs matching the specified title'),
  is_archived: z
    .number()
    .optional()
    .describe('Set to 0 for non-archived docs only, 1 for archived docs only'),
  show_in_main_doc_list: z
    .number()
    .optional()
    .describe('Set to 1 for docs shown in the main doc list only (0 or 1)'),
  is_important: z
    .number()
    .optional()
    .describe('Set to 1 for docs marked as important only (0 or 1)'),
  for_welcome: z
    .number()
    .optional()
    .describe('Set to 1 for docs shown on the welcome screen only (0 or 1)'),
  parent_doc_ids: z
    .array(z.number())
    .optional()
    .describe('Return docs that have any of the specified parent doc ids'),
});

// Schema for listing personal docs
export const listPersonalDocsSchema = z.object({
  doc_ids: z
    .array(z.number())
    .optional()
    .describe('A list of personal doc ids that you want to get'),
  title: z.string().optional().describe('Filter results to docs matching the specified title'),
});

// Schema for getting the full content of multiple docs at once
export const getDocContentBatchSchema = z.object({
  doc_ids: z
    .array(z.number())
    .min(1)
    .max(20)
    .describe('The IDs of the docs to fetch with full content (max 20 per call)'),
  personal: z
    .boolean()
    .optional()
    .describe('Set to true to fetch personal docs instead of shared docs (default false)'),
});

// Schema for getting the docs pinned to multiple boards at once
export const getDocsForBoardsBatchSchema = z.object({
  board_ids: z
    .array(z.number())
    .min(1)
    .max(10)
    .describe('The IDs of the boards whose docs you want to get (max 10 per call)'),
});

// Doc creation schema
export const createDocSchema = z.object({
  title: z.string().min(1).describe('The title of the doc'),
  content: z.string().optional().describe('The content of the doc (HTML)'),
  is_important: z.number().optional().describe('Set to 1 to mark the doc as important (0 or 1)'),
  for_welcome: z
    .number()
    .optional()
    .describe('Set to 1 to show the doc on the welcome screen (0 or 1)'),
  parent_doc_id: z
    .number()
    .optional()
    .describe('The ID of the parent doc, if this doc should be a child of another doc'),
  position: z.number().optional().describe('The position of the doc in its parent\'s list'),
  show_in_main_doc_list: z
    .number()
    .optional()
    .describe('Set to 1 to show the doc in the main doc list, 0 to hide it'),
});

// Doc update schema
export const updateDocSchema = z.object({
  doc_id: z.number().describe('The ID of the doc to update'),
  title: z.string().optional().describe('The new title of the doc'),
  content: z.string().optional().describe('The new content of the doc (HTML)'),
  is_important: z.number().optional().describe('Set to 1 to mark the doc as important (0 or 1)'),
  for_welcome: z
    .number()
    .optional()
    .describe('Set to 1 to show the doc on the welcome screen (0 or 1)'),
  parent_doc_id: z.number().optional().describe('The new parent doc ID'),
  position: z.number().optional().describe('The new position of the doc in its parent\'s list'),
});

// Doc archive/unarchive schema
export const archiveDocSchema = z.object({
  doc_id: z.number().describe('The ID of the doc'),
});

// Personal doc creation schema
export const createPersonalDocSchema = z.object({
  title: z.string().min(1).describe('The title of the personal doc'),
  content: z.string().optional().describe('The content of the doc (HTML)'),
  position: z.number().optional().describe('The position of the doc in the list'),
});

// Personal doc update schema
export const updatePersonalDocSchema = z.object({
  doc_id: z.number().describe('The ID of the personal doc to update'),
  title: z.string().optional().describe('The new title of the personal doc'),
  content: z.string().optional().describe('The new content of the doc (HTML)'),
  position: z.number().optional().describe('The new position of the doc in the list'),
});
