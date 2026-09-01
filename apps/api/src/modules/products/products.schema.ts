import { z } from 'zod'

const monetaryStringSchema = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, 'unitPrice must be a plain decimal string (e.g. 1234.56)')
  .refine((val) => Number(val) > 0, { message: 'unitPrice must be greater than zero' })

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  ncmCode: z.string().length(8, 'NCM code must be exactly 8 characters'),
  unitPrice: monetaryStringSchema,
})

export const updateProductSchema = createProductSchema

export const listProductsSchema = z.object({
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
