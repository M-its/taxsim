import { z } from 'zod'

export const registerSchema = z.object({
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    document: z.string().length(14, 'Document must be 14 characters'),
    taxRegime: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
    municipioCode: z.number().int().min(0).max(9999999, 'Municipio code must be a valid IBGE code'),
    uf: z.string().length(2, 'UF must be 2 characters'),
  }),
  user: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
