import { z } from 'zod/v3';

// Common schemas that are reused across different modules

// Date and time filters
export const dateTimeFilterSchema = {
  from: z.string().optional(),
  from_date: z.string().optional(),
  to: z.string().optional(),
  to_date: z.string().optional(),
};

/**
 * Generate the standard `<prefix>_from`, `<prefix>_from_date`, `<prefix>_to`,
 * `<prefix>_to_date` quartet of optional date filters used by card listing endpoints.
 * `label` is the human wording used in the descriptions (e.g. 'archived', 'first end').
 */
export function dateRangeFilters<P extends string>(
  prefix: P,
  label: string
): Record<`${P}_from` | `${P}_from_date` | `${P}_to` | `${P}_to_date`, z.ZodOptional<z.ZodString>> {
  return {
    [`${prefix}_from`]: z
      .string()
      .optional()
      .describe(`The first date and time of ${label} cards for which you want results`),
    [`${prefix}_from_date`]: z
      .string()
      .optional()
      .describe(`The first date of ${label} cards for which you want results`),
    [`${prefix}_to`]: z
      .string()
      .optional()
      .describe(`The last date and time of ${label} cards for which you want results`),
    [`${prefix}_to_date`]: z
      .string()
      .optional()
      .describe(`The last date of ${label} cards for which you want results`),
  } as Record<
    `${P}_from` | `${P}_from_date` | `${P}_to` | `${P}_to_date`,
    z.ZodOptional<z.ZodString>
  >;
}

// Pagination
export const paginationSchema = {
  page: z
    .number()
    .min(1)
    .optional()
    .describe(
      'Results are always paginated and returned in pages. This parameter controls which page is returned'
    ),
  per_page: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe(
      'Controls how many results are returned per page. The default value is 200 and the maximum is 1000'
    ),
};

// ID array filters
export const idArrayFilters = {
  board_ids: z
    .array(z.number().min(1))
    .optional()
    .describe('A list of the board ids for which you want to get the results'),
  column_ids: z
    .array(z.number().min(1))
    .optional()
    .describe(
      'A list of the column ids for which you want to get the results. Applied only if state parameter is active'
    ),
  lane_ids: z
    .array(z.number().min(1))
    .optional()
    .describe(
      'A list of the lane ids for which you want to get the results. Applied only if state parameter is active'
    ),
  workflow_ids: z
    .array(z.number().min(1))
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
