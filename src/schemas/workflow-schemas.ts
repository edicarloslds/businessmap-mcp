import { z } from 'zod/v3';

// Schema for getting a workflow's cycle time columns
export const getWorkflowCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Schema for getting a workflow's effective cycle time columns
export const getWorkflowEffectiveCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Schema for listing a board's workflows
export const listWorkflowsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Schema for getting workflow details
export const getWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Workflow creation schema
export const createWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  type: z
    .number()
    .min(0)
    .max(2)
    .describe('The workflow type: 0=cards, 1=initiatives, 2=timeline'),
  name: z.string().optional().describe('The name of the workflow (default names apply by type)'),
  position: z.number().optional().describe('The position of the workflow on the board'),
  is_enabled: z.number().optional().describe('Whether the workflow is enabled (0 or 1)'),
  is_collapsible: z.number().optional().describe('Whether the workflow is collapsible (0 or 1)'),
});

// Workflow update schema
export const updateWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow to update'),
  name: z.string().optional().describe('The new name of the workflow'),
  position: z.number().optional().describe('The new position of the workflow'),
  is_enabled: z.number().optional().describe('Whether the workflow is enabled (0 or 1)'),
  is_collapsible: z.number().optional().describe('Whether the workflow is collapsible (0 or 1)'),
});

// Schema for linking a related workflow
export const linkRelatedWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the target board'),
  workflow_id: z.number().describe('The ID of the workflow (from another board) to link'),
  position: z.number().optional().describe('The position of the related workflow on the board'),
});

// Schema for unlinking a related workflow
export const unlinkRelatedWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the related workflow to unlink'),
});
