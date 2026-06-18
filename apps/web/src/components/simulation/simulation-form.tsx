"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calculator } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SimulationFormData {
  grossRevenue: string
  ibsRate: string
  cbsRate: string
}

interface SimulationFormProps {
  onSubmit: (data: SimulationFormData) => void
  defaultValues?: SimulationFormData
}

function currencyToRaw(value: string): string {
  const digits = value.replace(/\D/g, "")
  const numeric = Number(digits) / 100
  return numeric.toFixed(2)
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, "")
  const numeric = Number(digits) / 100
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numeric)
}

function formatPercentInput(value: string): string {
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".")
  const numeric = parseFloat(cleaned || "0")
  return `${numeric.toFixed(2).replace(".", ",")}%`
}

export function SimulationForm({ onSubmit, defaultValues }: SimulationFormProps) {
  const [grossRevenue, setGrossRevenue] = useState(
    defaultValues?.grossRevenue
      ? formatCurrencyInput(defaultValues.grossRevenue.replace(".", ""))
      : "R$ 1.000.000,00"
  )
  const [ibsRate, setIbsRate] = useState(
    defaultValues?.ibsRate ? formatPercentInput(defaultValues.ibsRate) : "7,00%"
  )
  const [cbsRate, setCbsRate] = useState(
    defaultValues?.cbsRate ? formatPercentInput(defaultValues.cbsRate) : "2,70%"
  )

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit({
      grossRevenue: currencyToRaw(grossRevenue),
      ibsRate: ibsRate.replace(/[^0-9.,]/g, "").replace(",", "."),
      cbsRate: cbsRate.replace(/[^0-9.,]/g, "").replace(",", "."),
    })
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ willChange: "transform, opacity" }}
      onSubmit={handleSubmit}
      className="rounded-none border border-[#27272a] bg-[#18181b] p-5"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
          <Calculator className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-[#fafafa]">Parâmetros de Simulação</h3>
          <p className="text-xs text-[#a1a1aa]">Ajuste os valores para refazer a projeção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="grossRevenue" className="text-xs text-[#a1a1aa]">
            Faturamento Bruto (R$)
          </Label>
          <Input
            id="grossRevenue"
            value={grossRevenue}
            onChange={(event) => setGrossRevenue(formatCurrencyInput(event.target.value))}
            className="rounded-none border-[#27272a] bg-[#09090b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ibsRate" className="text-xs text-[#a1a1aa]">
            Alíquota IBS Estimada (%)
          </Label>
          <Input
            id="ibsRate"
            value={ibsRate}
            onChange={(event) => setIbsRate(formatPercentInput(event.target.value))}
            className="rounded-none border-[#27272a] bg-[#09090b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cbsRate" className="text-xs text-[#a1a1aa]">
            Alíquota CBS Estimada (%)
          </Label>
          <Input
            id="cbsRate"
            value={cbsRate}
            onChange={(event) => setCbsRate(formatPercentInput(event.target.value))}
            className="rounded-none border-[#27272a] bg-[#09090b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="submit"
          className={cn(
            "rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f]"
          )}
        >
          Recalcular projeção
        </Button>
      </div>
    </motion.form>
  )
}
