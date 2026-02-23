import { z } from 'zod';

// Schema básico para listar usuários (sem parâmetros)
export const listUsersSchema = z.object({});

// Schema para obter detalhes de um usuário específico
export const getUserSchema = z.object({
  user_id: z.number().describe('The ID of the user'),
});

// Schema para obter usuário atual (sem parâmetros)
export const getCurrentUserSchema = z.object({});

// Schema para convidar um novo usuário
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
