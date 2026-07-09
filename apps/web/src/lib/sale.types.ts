export type SaleStatus = "DRAFT" | "CONFIRMED" | "CANCELLED"

export type SaleListItemCurrentModel = {
  totalPis: string
  totalCofins: string
  totalIcms: string
  totalIss: string
  total: string
}

export type SaleListItemReformModel = {
  totalIbs: string
  totalCbs: string
  totalIs: string
  total: string
}

export type SaleListItem = {
  id: string
  clientId: string
  clientName: string
  status: SaleStatus
  totalAmount: string
  currentModel: SaleListItemCurrentModel
  reformModel: SaleListItemReformModel
  delta: {
    absolute: string
    percentual: string
  }
  createdAt: string
}

export type SaleItemSnapshot = {
  pisRate: string
  cofinsRate: string
  icmsRate: string
  issRate: string
  ibsRate: string
  cbsRate: string
  isRate: string
}

export type SaleItem = {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: string
  totalPrice: string
  ncmCode: string
  snapshot: SaleItemSnapshot
}

export type Sale = SaleListItem & {
  items: SaleItem[]
}

export type SaleListResponse = {
  data: SaleListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type SaleStatusResponse = {
  id: string
  status: SaleStatus
}
