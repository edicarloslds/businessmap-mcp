import { z } from 'zod/v3';

// Schema for getting details of a specific custom field
export const getCustomFieldSchema = z.object({
  custom_field_id: z.number().describe('The ID of the custom field'),
});
