import { z } from 'zod/v3';

// Basic schema for listing workspaces (no parameters)
export const listWorkspacesSchema = z.object({});

// Schema for getting details of a specific workspace
export const getWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace'),
});

// Workspace creation schema
export const createWorkspaceSchema = z.object({
  name: z.string().describe('The name of the workspace'),
  description: z.string().optional().describe('Optional description for the workspace'),
  type: z
    .number()
    .min(1)
    .max(2)
    .optional()
    .describe('The workspace type: 1=team (default), 2=management'),
});

// Workspace update schema
export const updateWorkspaceSchema = z.object({
  workspace_id: z.number().describe('The ID of the workspace to update'),
  name: z.string().describe('The new name of the workspace'),
});
