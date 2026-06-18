import { KpiGrid } from "@/components/dashboard/kpi-card"
import { TaxBarChart } from "@/components/dashboard/tax-bar-chart"
import { TaxDonutChart } from "@/components/dashboard/tax-donut-chart"
import { RecentOperationsTable } from "@/components/dashboard/recent-operations-table"
import {
  mockKpiData,
  mockTaxLoadByMonth,
  mockTaxComposition,
  mockRecentSales,
} from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#fafafa]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          Visão geral da carga tributária e projeção de economia com a reforma.
        </p>
      </div>

      <KpiGrid data={mockKpiData} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TaxBarChart data={mockTaxLoadByMonth} />
        </div>
        <div>
          <TaxDonutChart data={mockTaxComposition} />
        </div>
      </div>

      <RecentOperationsTable operations={mockRecentSales} />
    </div>
  )
}
