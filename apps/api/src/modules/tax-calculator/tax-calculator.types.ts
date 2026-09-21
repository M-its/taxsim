export interface TaxCalculatorItemInput {
  numero: number
  ncm: string
  cst: string
  cClassTrib: string
  baseCalculo: number
  quantidade: number
}

export interface TaxCalculatorInput {
  id: string
  versao: string
  dhFatoGerador: string
  municipio: number
  uf: string
  itens: TaxCalculatorItemInput[]
}

export interface ReformTaxCalculatorItemResult {
  ncmCode: string
  quantity: number
  unitPrice: string
  totalPrice: string
  rates: {
    ibsRate: string
    cbsRate: string
    isRate: string
  }
  taxes: {
    ibs: string
    cbs: string
    is: string
    totalTax: string
  }
}

export interface ReformTaxCalculatorTotals {
  ibs: string
  cbs: string
  is: string
  totalTax: string
  effectiveRate: string
}

export interface ReformTaxCalculatorResult {
  items: ReformTaxCalculatorItemResult[]
  totals: ReformTaxCalculatorTotals
}

export interface TaxCalculatorLogger {
  error: (context: Record<string, unknown>, message: string) => void
}

export class TaxCalculatorUnavailableError extends Error {
  constructor(message = 'Tax calculator service unavailable') {
    super(message)
    this.name = 'TaxCalculatorUnavailableError'
  }
}

export class TaxCalculatorResponseValidationError extends Error {
  constructor(
    public readonly event:
      'tax_calculator_item_identity_mismatch' | 'tax_calculator_total_mismatch',
    public readonly safeContext: Record<string, unknown>,
  ) {
    super('Tax calculator response validation failed')
    this.name = 'TaxCalculatorResponseValidationError'
  }
}
