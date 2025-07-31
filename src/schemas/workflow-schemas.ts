import { z } from 'zod';

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

// Schema para calcular cycle time de um card
export const calculateCardCycleTimeSchema = z.object({
  card_id: z.number().describe('The ID of the card to calculate cycle time for'),
  board_id: z
    .number()
    .optional()
    .describe('Optional board ID (will be retrieved from card if not provided)'),
  include_detailed_breakdown: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to include detailed breakdown by column'),
  compare_with_effective: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to compare with effective cycle time columns'),
  include_refinement_columns: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      'Whether to include refinement columns (PARA REFINAMENTO, EM REFINAMENTO, REFINADO) in cycle time calculation'
    ),
});

// Schema para teste de colunas efetivas de cycle time
export const testEffectiveCycleTimeColumnsSchema = z.object({
  board_id: z.number().describe('The ID of the board'),
  workflow_id: z.number().describe('The ID of the workflow'),
});