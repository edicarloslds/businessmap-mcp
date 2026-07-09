import { z } from 'zod/v3';

// Schema para obter colunas de cycle time do workflow
export const getWorkflowCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Schema para obter colunas efetivas de cycle time do workflow
export const getWorkflowEffectiveCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Schema para listar workflows de um board
export const listWorkflowsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
});

// Schema para obter detalhes de um workflow
export const getWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});

// Schema para criação de workflow
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

// Schema para atualização de workflow
export const updateWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow to update'),
  name: z.string().optional().describe('The new name of the workflow'),
  position: z.number().optional().describe('The new position of the workflow'),
  is_enabled: z.number().optional().describe('Whether the workflow is enabled (0 or 1)'),
  is_collapsible: z.number().optional().describe('Whether the workflow is collapsible (0 or 1)'),
});

// Schema para vincular workflow relacionado
export const linkRelatedWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the target board'),
  workflow_id: z.number().describe('The ID of the workflow (from another board) to link'),
  position: z.number().optional().describe('The position of the related workflow on the board'),
});

// Schema para desvincular workflow relacionado
export const unlinkRelatedWorkflowSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the related workflow to unlink'),
});
