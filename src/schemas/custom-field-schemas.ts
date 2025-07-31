import { z } from 'zod';

// Schema para obter detalhes de um custom field específico
export const getCustomFieldSchema = z.object({
  custom_field_id: z.number().describe('The ID of the custom field'),
});
