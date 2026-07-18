export type SimulationItem = {
  ncmCode: string
  quantity: number
  unitPrice: string
}

export type SimulationRequest = {
  taxRegime: 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL'
  items: SimulationItem[]
}

export interface CurrentModelSnapshot {
  totalPis: string
  totalCofins: string
  totalIcms: string
  totalIss: string
  total: string
  effectiveRate: string
}

export interface ReformModelSnapshot {
  totalIbs: string
  totalCbs: string
  totalIs: string
  total: string
  effectiveRate: string
}

export interface SimulationBreakdownItemCurrentModel {
  pisRate: string
  cofinsRate: string
  icmsRate: string
  issRate: string
  totalTax: string
}

export interface SimulationBreakdownItemReformModel {
  ibsRate: string
  cbsRate: string
  isRate: string
  totalTax: string
}

export interface SimulationBreakdownItem {
  ncmCode: string
  quantity: number
  unitPrice: string
  totalPrice: string
  currentModel: SimulationBreakdownItemCurrentModel
  reformModel: SimulationBreakdownItemReformModel
}

export interface SimulationResponse {
  totalAmount: string
  currentModel: CurrentModelSnapshot
  reformModel: ReformModelSnapshot
  delta: {
    absolute: string
    percentual: string
  }
  breakdown: SimulationBreakdownItem[]
  splitPayment?: {
    ibsAmount: string
    cbsAmount: string
    netMerchantAmount: string
    note: string
  }
}
