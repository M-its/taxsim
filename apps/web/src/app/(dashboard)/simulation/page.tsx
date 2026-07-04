"use client"

import { useState } from "react"
import { SimulationForm, type SimulationFormItem } from "@/components/simulation/simulation-form"
import { TaxComparison } from "@/components/simulation/tax-comparison"
import { ProjectedImpact } from "@/components/simulation/projected-impact"
import { useAuth } from "@/components/auth/auth-provider"
import { simulateSales, ApiError } from "@/lib/api"
import type { SimulationResponse } from "@/lib/simulation.types"

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={"animate-pulse bg-[#27272a] " + (className ?? "")} />
}

function getSimulationErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 503) {
      return "Calculadora tributária indisponível. Tente novamente."
    }

    if (err.status === 422) {
      const backendMessage = err.message.toLowerCase()
      if (
        backendMessage.includes("calculator") ||
        backendMessage.includes("calculadora")
      ) {
        return "Calculadora tributária indisponível. Tente novamente."
      }
      return "NCM não encontrado nas regras fiscais. Verifique o código NCM."
    }

    return err.message || "Erro ao calcular simulação. Tente novamente."
  }

  return "Erro ao calcular simulação. Tente novamente."
}

export default function SimulationPage() {
  const { company, isLoading } = useAuth()
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSimulate(items: SimulationFormItem[]) {
    if (!company) return

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await simulateSales({
        taxRegime: company.taxRegime,
        items,
      })
      setSimulation(result)
    } catch (err) {
      setSimulation(null)
      setError(getSimulationErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !company) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="mt-2 h-4 w-72" />
        </div>
        <div className="space-y-5 rounded-none border border-[#27272a] bg-[#18181b] p-5">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-8 w-8" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
          </div>
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-10 w-40" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#fafafa]">Simulação</h1>
        <p className="mt-1 text-sm text-[#a1a1aa]">
          Compare o regime atual com o IVA Dual e meça o impacto da reforma.
        </p>
      </div>

      <SimulationForm
        taxRegime={company.taxRegime}
        isLoadingCompany={isLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSimulate}
      />

      {error && (
        <div className="rounded-none border border-red-900/50 bg-red-900/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {simulation && (
        <div className="space-y-4">
          <TaxComparison data={simulation} taxRegime={company.taxRegime} />
          <ProjectedImpact
            savings={simulation.delta.absolute.replace("-", "")}
            savingsPercent={simulation.delta.percentual}
          />
        </div>
      )}
    </div>
  )
}
