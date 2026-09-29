import { z } from 'zod'
import { normalizeCnpj, validateCnpj } from '../../shared/documents/br-document.js'

const cnpjSchema = z
  .string()
  .transform(normalizeCnpj)
  .superRefine((value, context) => {
    if (!validateCnpj(value).valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNPJ inválido',
      })
    }
  })

export const registerSchema = z.object({
  company: z.object({
    name: z.string().min(1, 'Company name is required'),
    document: cnpjSchema,
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
