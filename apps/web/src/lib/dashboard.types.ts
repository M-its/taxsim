export type DashboardKpis = {
  estimatedSavings: string
  estimatedSavingsPercent: string
  projectedIbs: string
  projectedCbs: string
  projectedIs: string
}

export type TaxLoadMonth = {
  month: string
  current: string
  reform: string
}

export type TaxCompositionName = 'IBS' | 'CBS' | 'IS'

export type TaxCompositionItem = {
  name: TaxCompositionName
  value: string
}

export type DashboardSummaryResponse = {
  kpis: DashboardKpis
  taxLoadByMonth: TaxLoadMonth[]
  taxComposition: TaxCompositionItem[]
}
