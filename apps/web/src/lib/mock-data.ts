// Mock data mirrors API_CONTRACTS.md response shapes exactly.
// All monetary values are strings with 2 decimal places.
// All tax rates are strings with 4 decimal places.

import type {
  CurrentModelSnapshot,
  ReformModelSnapshot,
} from './simulation.types'

export type TaxRegime = "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL"

export interface SaleSummary {
  id: string
  clientId: string
  clientName: string
  status: "DRAFT" | "CONFIRMED" | "CANCELLED"
  totalAmount: string
  currentModel: CurrentModelSnapshot
  reformModel: ReformModelSnapshot
  delta: {
    absolute: string
    percentual: string
  }
  createdAt: string
}

export const mockRecentSales: SaleSummary[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    clientId: "b2c3d4e5-0001-0000-0000-000000000001",
    clientName: "Indústria São Paulo Ltda",
    status: "CONFIRMED",
    totalAmount: "3750.00",
    currentModel: {
      totalPis: "30.75",
      totalCofins: "141.75",
      totalIcms: "675.00",
      totalIss: "0.00",
      total: "847.50",
      effectiveRate: "0.2260",
    },
    reformModel: {
      totalIbs: "262.50",
      totalCbs: "101.25",
      totalIs: "0.00",
      total: "363.75",
      effectiveRate: "0.0970",
    },
    delta: {
      absolute: "-483.75",
      percentual: "-57.07",
    },
    createdAt: "2026-06-14T10:30:00.000Z",
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    clientId: "b2c3d4e5-0002-0000-0000-000000000002",
    clientName: "Comércio Minas ME",
    status: "DRAFT",
    totalAmount: "5200.00",
    currentModel: {
      totalPis: "42.64",
      totalCofins: "196.56",
      totalIcms: "936.00",
      totalIss: "0.00",
      total: "1175.20",
      effectiveRate: "0.2260",
    },
    reformModel: {
      totalIbs: "364.00",
      totalCbs: "140.40",
      totalIs: "0.00",
      total: "504.40",
      effectiveRate: "0.0970",
    },
    delta: {
      absolute: "-670.80",
      percentual: "-57.08",
    },
    createdAt: "2026-06-13T16:45:00.000Z",
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    clientId: "b2c3d4e5-0003-0000-0000-000000000003",
    clientName: "Serviços Rio S/A",
    status: "CANCELLED",
    totalAmount: "12500.00",
    currentModel: {
      totalPis: "0.00",
      totalCofins: "0.00",
      totalIcms: "0.00",
      totalIss: "625.00",
      total: "625.00",
      effectiveRate: "0.0500",
    },
    reformModel: {
      totalIbs: "500.00",
      totalCbs: "250.00",
      totalIs: "0.00",
      total: "750.00",
      effectiveRate: "0.0600",
    },
    delta: {
      absolute: "125.00",
      percentual: "20.00",
    },
    createdAt: "2026-06-12T09:15:00.000Z",
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    clientId: "b2c3d4e5-0004-0000-0000-000000000004",
    clientName: "Distribuidora Sul LTDA",
    status: "CONFIRMED",
    totalAmount: "18900.00",
    currentModel: {
      totalPis: "154.98",
      totalCofins: "714.42",
      totalIcms: "3402.00",
      totalIss: "0.00",
      total: "4271.40",
      effectiveRate: "0.2260",
    },
    reformModel: {
      totalIbs: "1323.00",
      totalCbs: "510.30",
      totalIs: "0.00",
      total: "1833.30",
      effectiveRate: "0.0970",
    },
    delta: {
      absolute: "-2438.10",
      percentual: "-57.08",
    },
    createdAt: "2026-06-10T14:20:00.000Z",
  },
  {
    id: "a1b2c3d4-0005-0000-0000-000000000005",
    clientId: "b2c3d4e5-0005-0000-0000-000000000005",
    clientName: "Tech Imports EIRELI",
    status: "DRAFT",
    totalAmount: "8400.00",
    currentModel: {
      totalPis: "68.88",
      totalCofins: "317.52",
      totalIcms: "1512.00",
      totalIss: "0.00",
      total: "1898.40",
      effectiveRate: "0.2260",
    },
    reformModel: {
      totalIbs: "588.00",
      totalCbs: "226.80",
      totalIs: "0.00",
      total: "814.80",
      effectiveRate: "0.0970",
    },
    delta: {
      absolute: "-1083.60",
      percentual: "-57.08",
    },
    createdAt: "2026-06-09T11:00:00.000Z",
  },
]

export interface TaxLoadMonth {
  month: string
  current: number
  reform: number
}

export const mockTaxLoadByMonth: TaxLoadMonth[] = [
  { month: "Jan", current: 4200, reform: 1890 },
  { month: "Fev", current: 3800, reform: 1710 },
  { month: "Mar", current: 5100, reform: 2295 },
  { month: "Abr", current: 4700, reform: 2115 },
  { month: "Mai", current: 5600, reform: 2520 },
  { month: "Jun", current: 4900, reform: 2205 },
]

export interface TaxCompositionItem {
  name: string
  value: number
  color: string
}

export const mockTaxComposition: TaxCompositionItem[] = [
  { name: "IBS", value: 72, color: "#34d399" },
  { name: "CBS", value: 28, color: "#a1a1aa" },
  { name: "IS", value: 0, color: "#27272a" },
]

export interface KpiData {
  estimatedSavings: string
  estimatedSavingsPercent: string
  projectedIbs: string
  projectedCbs: string
  projectedIs: string
}

export const mockKpiData: KpiData = {
  estimatedSavings: "387000.00",
  estimatedSavingsPercent: "-57.08",
  projectedIbs: "210000.00",
  projectedCbs: "81000.00",
  projectedIs: "0.00",
}
