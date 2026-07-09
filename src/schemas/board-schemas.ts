import { z } from 'zod/v3';

// Board listing schema
export const listBoardsSchema = z.object({
  // ID filters (arrays)
  board_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the board ids that you want to get'),
  workspace_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the workspace ids holding the boards that you want to get'),

  // Expansion options
  expand: z
    .array(z.enum(['workflows', 'settings', 'structure']))
    .optional()
    .describe(
      'A list of properties for which you want to get additional details. Allowed: workflows, settings, structure'
    ),

  // Field selection
  fields: z
    .array(z.enum(['board_id', 'workspace_id', 'is_archived', 'name', 'description', 'revision']))
    .optional()
    .describe(
      'A list of fields that you want in the response. Allowed: board_id, workspace_id, is_archived, name, description, revision'
    ),

  // Assignment filter
  if_assigned: z
    .number()
    .optional()
    .describe('When set to 1 you will only get boards to which you are assigned (0 or 1)'),

  // Archive status
  is_archived: z
    .number()
    .optional()
    .describe(
      'When set to 0 you will only get non-archived boards. When set to 1 you will only get archived boards (0 or 1)'
    ),

  // Legacy compatibility
  workspace_id: z
    .number()
    .optional()
    .describe('Optional workspace ID to filter boards (legacy parameter)'),
});

// Board search schema
export const searchBoardSchema = z.object({
  board_id: z.number().optional().describe('The ID of the board to search for'),
  board_name: z.string().optional().describe('The name of the board to search for'),
  workspace_id: z.number().optional().describe('Optional workspace ID to limit search scope'),
});

// Schema for getting details of a specific board
export const getBoardSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Schema for getting a board's columns
export const getColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Schema for getting a board's lanes
export const getLanesSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Schema for getting details of a specific lane
export const getLaneSchema = z.object({
  board_id: z.number().describe('The ID of the board the lane belongs to'),
  lane_id: z.number().describe('The ID of the lane'),
});

// Board creation schema
export const createBoardSchema = z.object({
  name: z.string().describe('The name of the board'),
  description: z.string().optional().describe('Optional description for the board'),
  project_id: z.number().optional().describe('Optional project ID for the board'),
  workspace_id: z.number().optional().describe('The ID of the workspace'),
});

// Lane creation schema
export const createLaneSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  name: z.string().describe('The name of the lane'),
  description: z.string().optional().describe('Optional description for the lane'),
  workflow_id: z.number().describe('The workflow ID'),
  position: z.number().describe('The position of the lane'),
  color: z.string().optional().describe('The color for the lane (hex without #, e.g. F0F0F0)'),
  parent_lane_id: z
    .number()
    .optional()
    .describe('The ID of the parent lane (to create a sub-lane)'),
});

// Lane update schema
export const updateLaneSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  lane_id: z.number().describe('The ID of the lane to update'),
  name: z.string().optional().describe('The new name of the lane'),
  description: z.string().optional().describe('The new description for the lane'),
  color: z.string().optional().describe('The new color for the lane (hex without #)'),
  position: z.number().optional().describe('The new position of the lane'),
  parent_lane_id: z.number().optional().describe('The new parent lane ID (to nest the lane)'),
});

// Board update schema
export const updateBoardSchema = z.object({
  board_id: z.number().describe('The ID of the board to update'),
  name: z.string().optional().describe('The new name of the board'),
  description: z.string().optional().describe('The new description for the board'),
});

// Schema for getting the current board structure
export const getCurrentBoardStructureSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Column creation schema
export const createColumnInputSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  // Main column fields
  workflow_id: z
    .number()
    .optional()
    .describe('The workflow ID (required for main columns, omit for sub-columns)'),
  section: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .describe(
      'The section where the column is located: 1=Backlog, 2=Requested, 3=Progress, 4=Done (required for main columns)'
    ),
  // Sub-column field
  parent_column_id: z
    .number()
    .optional()
    .describe(
      'The ID of the parent column (required for sub-columns; when set, creates a sub-column instead of a main column)'
    ),
  // Shared fields
  position: z.number().describe('The position of the column within the section'),
  name: z.string().describe('The name of the column'),
  limit: z.number().optional().describe('The WIP limit for the column'),
  description: z.string().optional().describe('Optional description for the column'),
});

export const createColumnSchema = createColumnInputSchema.superRefine((data, ctx) => {
  const hasParent = data.parent_column_id !== undefined;
  const hasMainColumnData = data.workflow_id !== undefined || data.section !== undefined;

  if (hasParent) {
    if (data.workflow_id !== undefined || data.section !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'When parent_column_id is provided (sub-column), do not provide workflow_id or section.',
      });
    }
    return;
  }

  if (!hasMainColumnData || data.workflow_id === undefined || data.section === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'For main columns, workflow_id and section are required when parent_column_id is not provided.',
    });
  }
});

// Column update schema
export const updateColumnSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  column_id: z.number().describe('The ID of the column to update'),
  name: z.string().optional().describe('The new name of the column'),
  limit: z.number().optional().describe('The new WIP limit for the column'),
  section: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .describe('The new section: 1=Backlog, 2=Requested, 3=Progress, 4=Done'),
  position: z.number().optional().describe('The new position of the column within its section'),
  description: z.string().optional().describe('The new description for the column'),
});

// Column deletion schema
export const deleteColumnSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  column_id: z.number().describe('The ID of the column to delete'),
});
