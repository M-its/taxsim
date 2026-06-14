import type { z } from 'zod'
import type {
  createSaleSchema,
  simulateSchema,
  listSalesSchema,
  saleIdParamSchema,
} from './sales.schema.js'

export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type SimulateInput = z.infer<typeof simulateSchema>
export type ListSalesQuery = z.infer<typeof listSalesSchema>
export type SaleIdParam = z.infer<typeof saleIdParamSchema>

export interface SaleItemResponse {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: string
  totalPrice: string
  ncmCode: string
  snapshot: {
    pisRate: string
    cofinsRate: string
    icmsRate: string
    issRate: string
    ibsRate: string
    cbsRate: string
    isRate: string
  }
}

export interface CurrentModelResponse {
  totalPis: string
  totalCofins: string
  totalIcms: string
  totalIss: string
  total: string
}

export interface ReformModelResponse {
  totalIbs: string
  totalCbs: string
  totalIs: string
  total: string
}

export interface DeltaResponse {
  absolute: string
  percentual: string
}

export interface SaleResponse {
  id: string
  status: string
  clientId: string
  totalAmount: string
  currentModel: CurrentModelResponse
  reformModel: ReformModelResponse
  delta: DeltaResponse
  items: SaleItemResponse[]
  createdAt: string
}

export interface BreakdownItemResponse {
  ncmCode: string
  quantity: number
  unitPrice: string
  totalPrice: string
  currentModel: {
    pisRate: string
    cofinsRate: string
    icmsRate: string
    issRate: string
    totalTax: string
  }
  reformModel: {
    ibsRate: string
    cbsRate: string
    isRate: string
    totalTax: string
  }
}

export interface SimulationResponse {
  totalAmount: string
  currentModel: CurrentModelResponse & { effectiveRate: string }
  reformModel: ReformModelResponse & { effectiveRate: string }
  delta: DeltaResponse
  breakdown: BreakdownItemResponse[]
}
