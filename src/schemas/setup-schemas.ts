import { z } from 'zod/v3';

// Extra column to create during structure setup
export const setupColumnSchema = z.object({
  name: z.string().describe('The name of the column to create'),
  section: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .describe('The section for the column: 1=Backlog, 2=Requested, 3=In Progress, 4=Done (default 3)'),
  position: z.number().optional().describe('The position of the column within its section (default 0)'),
  limit: z.number().optional().describe('The WIP limit for the column'),
  description: z.string().optional().describe('Optional description for the column'),
  parent_column_name: z
    .string()
    .optional()
    .describe(
      'Name of an existing (or previously created) column to nest this column under as a sub-column'
    ),
});

// Extra lane to create during structure setup
export const setupLaneSchema = z.object({
  name: z.string().describe('The name of the lane to create'),
  color: z.string().optional().describe('The color for the lane (hex without #)'),
  position: z.number().optional().describe('The position of the lane (default 0)'),
});

// Workflow configuration applied during structure setup
export const setupWorkflowSchema = z.object({
  workflow_id: z
    .number()
    .optional()
    .describe('The ID of an existing workflow to configure (omit with type to create a new one)'),
  type: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe('When creating a new workflow: 0=cards, 1=initiatives, 2=timeline'),
  name: z
    .string()
    .optional()
    .describe('New name for the workflow (renames existing or names the created one)'),
  default_columns: z
    .array(
      z.object({
        section: z
          .number()
          .min(2)
          .max(4)
          .describe('The built-in column to rename: 2=Requested, 3=In Progress, 4=Done'),
        name: z.string().describe('The new name for the built-in column'),
      })
    )
    .max(10)
    .optional()
    .describe('Rename the built-in Requested/In Progress/Done columns of the workflow'),
  columns: z
    .array(setupColumnSchema)
    .max(10)
    .optional()
    .describe('Additional columns to create in the workflow (max 10)'),
  lanes: z
    .array(setupLaneSchema)
    .max(10)
    .optional()
    .describe('Additional lanes to create in the workflow (max 10)'),
});

// Board to create with optional structure during batch setup
export const setupBoardSchema = z.object({
  name: z.string().describe('The name of the board'),
  description: z.string().optional().describe('Optional description for the board'),
  workflows: z
    .array(setupWorkflowSchema)
    .max(5)
    .optional()
    .describe('Optional workflow configurations to apply after creating the board'),
});

// Schema for configuring the structure of an existing board
export const configureBoardStructureSchema = z.object({
  board_id: z.number().describe('The ID of the board to configure'),
  workflows: z
    .array(setupWorkflowSchema)
    .min(1)
    .max(5)
    .describe('Workflow configurations to apply (max 5)'),
});

// Schema for creating boards with structure in an existing workspace
export const createBoardsInWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace where the boards will be created'),
  boards: z
    .array(setupBoardSchema)
    .min(1)
    .max(3)
    .describe('Boards to create with their structure (max 3 per call)'),
});

// Schema for creating workspaces together with their boards and full structure
export const createWorkspacesAndBoardsSchema = z.object({
  workspaces: z
    .array(
      z.object({
        name: z.string().min(1).max(100).describe('The name of the workspace (1-100 chars)'),
        type: z
          .number()
          .min(1)
          .max(2)
          .optional()
          .describe('The workspace type: 1=team (default), 2=management'),
        boards: z
          .array(setupBoardSchema)
          .max(10)
          .optional()
          .describe('Boards to create in the workspace with their structure (max 10)'),
      })
    )
    .min(1)
    .max(3)
    .describe('Workspaces to create with their boards (max 3 per call)'),
});
