"use client"

import { KpiGrid } from "@/components/dashboard/kpi-card"
import { TaxBarChart } from "@/components/dashboard/tax-bar-chart"
import { TaxDonutChart } from "@/components/dashboard/tax-donut-chart"
import { RecentOperationsTable } from "@/components/dashboard/recent-operations-table"
import { useDashboardSummary } from "@/hooks/use-dashboard-summary"
import { useRecentSales } from "@/hooks/use-recent-sales"
import type {
  TaxLoadMonth as ApiTaxLoadMonth,
  TaxCompositionItem as ApiTaxCompositionItem,
} from "@/lib/dashboard.types"
import type {
  TaxLoadMonth as ChartTaxLoadMonth,
  TaxCompositionItem as ChartTaxCompositionItem,
} from "@/lib/mock-data"

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
]

const COMPOSITION_COLORS: Record<string, string> = {
  IBS: "#34d399",
  CBS: "#a1a1aa",
  IS: "#27272a",
}

function mapTaxLoadByMonth(
  data: ApiTaxLoadMonth[],
): ChartTaxLoadMonth[] {
  return data.map((item) => {
    const monthIndex = parseInt(item.month.slice(5, 7), 10) - 1
    return {
      month: MONTH_LABELS[monthIndex] ?? item.month,
      current: parseFloat(item.current),
      reform: parseFloat(item.reform),
    }
  })
}

function mapTaxComposition(
  data: ApiTaxCompositionItem[],
): ChartTaxCompositionItem[] {
  return data.map((item) => ({
    name: item.name,
    value: parseFloat(item.value),
    color: COMPOSITION_COLORS[item.name] ?? "#52525b",
  }))
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[118px] animate-pulse rounded-none border border-[#27272a] bg-[#18181b] p-5"
          >
            <div className="h-3 w-24 rounded bg-[#27272a]" />
            <div className="mt-6 h-8 w-40 rounded bg-[#27272a]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 items-stretch lg:grid-cols-[2fr_1fr]">
        <div className="h-[382px] animate-pulse rounded-none border border-[#27272a] bg-[#18181b] p-5">
          <div className="h-3 w-48 rounded bg-[#27272a]" />
          <div className="mt-4 h-3 w-32 rounded bg-[#27272a]" />
        </div>
        <div className="h-[382px] animate-pulse rounded-none border border-[#27272a] bg-[#18181b] p-5">
          <div className="h-3 w-40 rounded bg-[#27272a]" />
          <div className="mt-4 h-3 w-28 rounded bg-[#27272a]" />
        </div>
      </div>
    </div>
  )
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-none border border-[#27272a] bg-[#18181b] p-5">
        <p className="text-sm text-[#f87171]">
          Erro ao carregar os dados do dashboard.
        </p>
        <p className="mt-1 text-xs text-[#a1a1aa]">{message}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 items-stretch lg:grid-cols-[2fr_1fr] opacity-50 pointer-events-none">
        <div className="h-[382px] rounded-none border border-[#27272a] bg-[#18181b] p-5" />
        <div className="h-[382px] rounded-none border border-[#27272a] bg-[#18181b] p-5" />
      </div>
    </div>
  )
}

function RecentOperationsSkeleton() {
  return (
    <div className="rounded-none border border-[#27272a] bg-[#18181b]">
      <div className="border-b border-[#27272a] p-5">
        <div className="h-3 w-40 animate-pulse rounded bg-[#27272a]" />
        <div className="mt-2 h-2 w-56 animate-pulse rounded bg-[#27272a]" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-[#27272a]" />
        ))}
      </div>
    </div>
  )
}

function RecentOperationsError({ message }: { message: string }) {
  return (
    <div className="rounded-none border border-[#27272a] bg-[#18181b] p-5">
      <p className="text-sm text-[#f87171]">Erro ao carregar operações recentes.</p>
      <p className="mt-1 text-xs text-[#a1a1aa]">{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary()
  const {
    data: recentSales,
    isLoading: recentSalesLoading,
    error: recentSalesError,
  } = useRecentSales()

  let summaryContent

  if (isLoading) {
    summaryContent = <DashboardSkeleton />
  } else if (error || !data) {
    summaryContent = <DashboardError message={error?.message ?? "Não foi possível carregar o resumo."} />
  } else {
    summaryContent = (
      <>
        <KpiGrid data={data.kpis} />

        <div className="grid grid-cols-1 gap-4 items-stretch lg:grid-cols-[2fr_1fr]">
          <TaxBarChart data={mapTaxLoadByMonth(data.taxLoadByMonth)} />
          <TaxDonutChart data={mapTaxComposition(data.taxComposition)} />
        </div>
      </>
    )
  }

  let recentOperationsContent

  if (recentSalesLoading) {
    recentOperationsContent = <RecentOperationsSkeleton />
  } else if (recentSalesError) {
    recentOperationsContent = <RecentOperationsError message={recentSalesError.message} />
  } else {
    recentOperationsContent = <RecentOperationsTable operations={recentSales} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#fafafa]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          Visão geral da carga tributária e projeção de economia com a reforma.
        </p>
      </div>

      {summaryContent}

      {recentOperationsContent}
    </div>
  )
}
