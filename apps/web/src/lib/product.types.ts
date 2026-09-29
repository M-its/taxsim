export type Product = {
  id: string
  name: string
  sku: string
  ncmCode: string
  ncmStatus: import('./api').NcmEligibilityStatus
  ncmDescription: string | null
  unitPrice: string
  createdAt: string
}

export type ProductInput = {
  name: string
  sku: string
  ncmCode: string
  unitPrice: string
}

export type ProductListResponse = {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  metadata: {
    ncmCatalogVersion: string
  }
}
