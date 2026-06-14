import { z } from 'zod'

export const createSaleSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      }),
    )
    .min(1, 'At least one item is required'),
})

export const simulateSchema = z.object({
  taxRegime: z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
  items: z
    .array(
      z.object({
        ncmCode: z.string().length(8, 'NCM code must be exactly 8 characters'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.string().refine(
          (val) => {
            const num = Number(val)
            return !Number.isNaN(num) && num > 0
          },
          { message: 'unitPrice must be a positive number' },
        ),
      }),
    )
    .min(1, 'At least one item is required'),
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
