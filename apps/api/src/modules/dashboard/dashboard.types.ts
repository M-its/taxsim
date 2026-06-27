export interface DashboardKpis {
  estimatedSavings: string
  estimatedSavingsPercent: string
  projectedIbs: string
  projectedCbs: string
  projectedIs: string
}

export interface TaxLoadMonth {
  month: string
  current: string
  reform: string
}

export interface TaxCompositionItem {
  name: string
  value: string
}

export interface DashboardSummaryResponse {
  kpis: DashboardKpis
  taxLoadByMonth: TaxLoadMonth[]
  taxComposition: TaxCompositionItem[]
}
