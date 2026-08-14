import { z } from 'zod'

const MAX_ITEMS_PER_SALE = 100
const MAX_QUANTITY_PER_ITEM = 10_000

const monetaryStringSchema = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,2})?$/, 'unitPrice must be a plain decimal string (e.g. 1234.56)')
  .refine((val) => Number(val) > 0, { message: 'unitPrice must be greater than zero' })

export const createSaleSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY_PER_ITEM),
      }),
    )
    .min(1, 'At least one item is required')
    .max(MAX_ITEMS_PER_SALE, `A sale cannot exceed ${MAX_ITEMS_PER_SALE} items`),
})

export const simulateSchema = z.object({
  taxRegime: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
  items: z
    .array(
      z.object({
        ncmCode: z.string().length(8, 'NCM code must be exactly 8 characters'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QUANTITY_PER_ITEM),
        unitPrice: monetaryStringSchema,
      }),
    )
    .min(1, 'At least one item is required')
    .max(MAX_ITEMS_PER_SALE, `A simulation cannot exceed ${MAX_ITEMS_PER_SALE} items`),
})

export const listSalesSchema = z.object({
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
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export const saleIdParamSchema = z.object({
  id: z.string().uuid('Invalid sale ID'),
})
