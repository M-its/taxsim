import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  document: z.string().min(11).max(14, 'Document must be between 11 and 14 characters'),
  email: z.string().email('Invalid email').optional(),
})

export const updateClientSchema = createClientSchema

export const listClientsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 20))
    .pipe(z.number().int().positive().max(100)),
  search: z.string().optional(),
})
