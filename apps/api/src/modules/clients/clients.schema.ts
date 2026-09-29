import { z } from 'zod'
import {
  identifyDocumentKind,
  normalizeCnpj,
  normalizeCpf,
} from '../../shared/documents/br-document.js'

const documentSchema = z
  .string()
  .min(1, 'Documento é obrigatório')
  .transform((value) =>
    identifyDocumentKind(value) === 'CNPJ' ? normalizeCnpj(value) : normalizeCpf(value),
  )

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  document: documentSchema,
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
  search: z.string().trim().optional(),
})
