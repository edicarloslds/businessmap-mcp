import { z } from 'zod';

// Schema básico para listar usuários (sem parâmetros)
export const listUsersSchema = z.object({});

// Schema para obter detalhes de um usuário específico
export const getUserSchema = z.object({
  user_id: z.number().describe('The ID of the user'),
});

// Schema para obter usuário atual (sem parâmetros)
export const getCurrentUserSchema = z.object({});
