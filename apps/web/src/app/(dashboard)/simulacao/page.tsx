"use client"

import { useState } from "react"
import { SimulationForm, type SimulationFormData } from "@/components/simulation/simulation-form"
import { TaxComparison } from "@/components/simulation/tax-comparison"
import { ProjectedImpact } from "@/components/simulation/projected-impact"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockSimulationResponse } from "@/lib/mock-data"

export default function SimulacaoPage() {
  const [simulation, setSimulation] = useState(mockSimulationResponse)
  const [formData, setFormData] = useState<SimulationFormData>({
    grossRevenue: "1000000.00",
    ibsRate: "0.0700",
    cbsRate: "0.0270",
  })

  function handleRecalculate(data: SimulationFormData) {
    setFormData(data)
    // In a real implementation this would call POST /sales/simulate.
    // For now we keep the mock response aligned with the API contract shape.
    const grossRevenue = parseFloat(data.grossRevenue)
    const ibsRate = parseFloat(data.ibsRate)
    const cbsRate = parseFloat(data.cbsRate)

    const totalIbs = grossRevenue * ibsRate
    const totalCbs = grossRevenue * cbsRate
    const totalIs = 0
    const reformTotal = totalIbs + totalCbs + totalIs

    const currentTotal = grossRevenue * 0.226
    const absolute = reformTotal - currentTotal
    const percentual = absolute / currentTotal

    setSimulation({
      totalAmount: grossRevenue.toFixed(2),
      currentModel: {
        totalPis: (grossRevenue * 0.0082).toFixed(2),
        totalCofins: (grossRevenue * 0.0378).toFixed(2),
        totalIcms: (grossRevenue * 0.18).toFixed(2),
        totalIss: "0.00",
        total: currentTotal.toFixed(2),
        effectiveRate: "0.2260",
      },
      reformModel: {
        totalIbs: totalIbs.toFixed(2),
        totalCbs: totalCbs.toFixed(2),
        totalIs: totalIs.toFixed(2),
        total: reformTotal.toFixed(2),
        effectiveRate: ((ibsRate + cbsRate)).toFixed(4),
      },
      delta: {
        absolute: absolute.toFixed(2),
        percentual: percentual.toFixed(2),
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#fafafa]">Simulação</h1>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          Compare o regime atual com o IVA Dual e meça o impacto da reforma.
        </p>
      </div>

      <SimulationForm onSubmit={handleRecalculate} defaultValues={formData} />

      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="rounded-none border border-[#27272a] bg-[#18181b] p-1">
          <TabsTrigger
            value="comparison"
            className="rounded-none text-sm text-[#a1a1aa] data-[state=active]:bg-[#27272a] data-[state=active]:text-[#fafafa]"
          >
            Comparativo Lado-a-Lado
          </TabsTrigger>
          <TabsTrigger
            value="credits"
            className="rounded-none text-sm text-[#a1a1aa] data-[state=active]:bg-[#27272a] data-[state=active]:text-[#fafafa]"
          >
            Análise de Créditos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-4 space-y-4">
          <TaxComparison data={simulation} />
          <ProjectedImpact
            savings={simulation.delta.absolute.replace("-", "")}
            savingsPercent={simulation.delta.percentual}
          />
        </TabsContent>

        <TabsContent value="credits" className="mt-4">
          <div className="rounded-none border border-[#27272a] bg-[#18181b] p-6">
            <h3 className="text-sm font-medium text-[#fafafa]">Análise de Créditos Presumidos</h3>
            <p className="mt-2 text-sm text-[#a1a1aa]">
              Esta visão detalhada será alimentada pelo endpoint{" "}
              <code className="font-numbers text-xs text-[#34d399]">POST /sales/simulate</code>{" "}
              e mostrará os créditos acumulados por NCM ao longo da cadeia produtiva.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#27272a] pt-4">
              <div>
                <p className="text-xs text-[#a1a1aa]">Créditos de IBS</p>
                <p className="font-numbers text-lg text-[#fafafa]">R$ 21.000,00</p>
              </div>
              <div>
                <p className="text-xs text-[#a1a1aa]">Créditos de CBS</p>
                <p className="font-numbers text-lg text-[#fafafa]">R$ 8.100,00</p>
              </div>
              <div>
                <p className="text-xs text-[#a1a1aa]">Créditos Totais</p>
                <p className="font-numbers text-lg text-[#34d399]">R$ 29.100,00</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
