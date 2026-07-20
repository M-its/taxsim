import { z } from 'zod'

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  taxRegime: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
  municipioCode: z.number().int().positive(),
  uf: z.string().length(2, 'UF must be 2 characters'),
})
