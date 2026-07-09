import { z } from 'zod/v3';

// Basic schema for listing users (no parameters)
export const listUsersSchema = z.object({});

// Schema for getting details of a specific user
export const getUserSchema = z.object({
  user_id: z.number().describe('The ID of the user'),
});

// Schema for getting the current user (no parameters)
export const getCurrentUserSchema = z.object({});

// Schema for inviting a new user
export const inviteUserSchema = z.object({
  email: z.string().email().describe('The email address of the user to invite'),
  do_not_send_confirmation_email: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe(
      'When set to 1, no invitation email is sent and an admin must manually send it later (0 or 1, default 0)'
    ),
});
