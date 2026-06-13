import type { z } from 'zod'
import type {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from './products.schema.js'

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ListProductsQuery = z.infer<typeof listProductsSchema>
