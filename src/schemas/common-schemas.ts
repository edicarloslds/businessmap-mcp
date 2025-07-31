import { z } from 'zod';

// Common schemas that are reused across different modules

// Date and time filters
export const dateTimeFilterSchema = {
  from: z.string().optional(),
  from_date: z.string().optional(), 
  to: z.string().optional(),
  to_date: z.string().optional(),
};

// Pagination
export const paginationSchema = {
  page: z
    .number()
    .optional()
    .describe(
      'Results are always paginated and returned in pages. This parameter controls which page is returned'
    ),
  per_page: z
    .number()
    .optional()
    .describe(
      'Controls how many results are returned per page. The default value is 200 and the maximum is 1000'
    ),
};

// ID array filters
export const idArrayFilters = {
  board_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the board ids for which you want to get the results'),
  column_ids: z
    .array(z.number())
    .optional()
    .describe(
      'A list of the column ids for which you want to get the results. Applied only if state parameter is active'
    ),
  lane_ids: z
    .array(z.number())
    .optional()
    .describe(
      'A list of the lane ids for which you want to get the results. Applied only if state parameter is active'
    ),
  workflow_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the workflows ids for which you want to get the results'),
};

// File attachment schema
export const fileAttachmentSchema = z.object({
  file_name: z.string(),
  link: z.string(),
  position: z.number(),
});

// File attachment with ID schema
export const fileAttachmentWithIdSchema = z.object({
  id: z.number(),
  file_name: z.string(),
  link: z.string(),
  position: z.number(),
});