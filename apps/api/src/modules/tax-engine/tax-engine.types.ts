export interface TaxEngineInput {
  taxRegime: string
  items: Array<{
    ncmCode: string
    quantity: number
    unitPrice: string
  }>
  taxRules: Record<string, {
    pisRate: string
    cofinsRate: string
    icmsRate: string
    issRate: string
  }>
}

export interface TaxEngineItemResult {
  ncmCode: string
  quantity: number
  unitPrice: string
  totalPrice: string
  taxes: {
    pisRate: string
    cofinsRate: string
    icmsRate: string
    issRate: string
    pis: string
    cofins: string
    icms: string
    iss: string
    totalTax: string
  }
}

export interface TaxEngineTotals {
  pis: string
  cofins: string
  icms: string
  iss: string
  totalTax: string
  effectiveRate: string
}

export interface TaxEngineResult {
  items: TaxEngineItemResult[]
  totals: TaxEngineTotals
}

export class TaxRuleNotFoundError extends Error {
  constructor(public readonly ncmCode: string) {
    super(`No tax rule found for NCM ${ncmCode}`)
    this.name = 'TaxRuleNotFoundError'
  }
}
