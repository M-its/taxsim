"use client"

import { motion } from "framer-motion"
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import type { TaxRegime } from "@/lib/auth.types"
import type { SimulationResponse } from "@/lib/simulation.types"

interface TaxComparisonProps {
  data: SimulationResponse
  taxRegime: TaxRegime
}

const REGIME_LABELS: Record<TaxRegime, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  LUCRO_PRESUMIDO: "Lucro Presumido",
  LUCRO_REAL: "Lucro Real",
}

interface LineItemProps {
  label: string
  value: string
  isTotal?: boolean
}

function LineItem({ label, value, isTotal }: LineItemProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isTotal ? "border-t border-[#27272a] pt-3" : ""
      }`}
    >
      <span
        className={
          isTotal ? "text-sm font-medium text-[#fafafa]" : "text-sm text-[#a1a1aa]"
        }
      >
        {label}
      </span>
      <span
        className={`font-numbers ${
          isTotal ? "text-base font-semibold text-[#fafafa]" : "text-sm text-[#fafafa]"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  )
}

export function TaxComparison({ data, taxRegime }: TaxComparisonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        style={{ willChange: "transform, opacity" }}
      >
        <Card className="rounded-none border-[#27272a] bg-[#18181b]">
          <CardHeader className="border-b border-[#27272a] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#fafafa]">Regime Atual</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-none bg-[#27272a] text-xs text-[#a1a1aa]"
                >
                  {REGIME_LABELS[taxRegime]}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-none border-[#27272a] bg-transparent text-xs text-[#71717a]"
                >
                  {formatPercent(data.currentModel.effectiveRate)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <LineItem label="PIS" value={data.currentModel.totalPis} />
            <LineItem label="COFINS" value={data.currentModel.totalCofins} />
            <LineItem label="ICMS" value={data.currentModel.totalIcms} />
            <LineItem label="ISS" value={data.currentModel.totalIss} />
            <Separator className="my-2 bg-[#27272a]" />
            <LineItem label="Total estimado" value={data.currentModel.total} isTotal />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        style={{ willChange: "transform, opacity" }}
      >
        <Card className="rounded-none border-[#34d399]/30 bg-gradient-to-br from-[#34d399]/5 to-[#18181b]">
          <CardHeader className="border-b border-[#27272a] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#fafafa]">IVA Dual (Reforma)</CardTitle>
              <div className="flex items-center gap-2">
                <Badge
                  variant="emerald"
                  className="rounded-none border-[#34d399]/20 bg-[#34d399]/10 text-xs text-[#34d399]"
                >
                  Novo Modelo
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-none border-[#34d399]/30 bg-transparent text-xs text-[#34d399]"
                >
                  {formatPercent(data.reformModel.effectiveRate)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <LineItem label="IBS" value={data.reformModel.totalIbs} />
            <LineItem label="CBS" value={data.reformModel.totalCbs} />
            <LineItem label="IS" value={data.reformModel.totalIs} />
            <Separator className="my-2 bg-[#27272a]" />
            <LineItem label="Total estimado" value={data.reformModel.total} isTotal />
          </CardContent>
        </Card>
      </motion.div>

      {data.splitPayment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
          style={{ willChange: "transform, opacity" }}
          className="lg:col-span-2"
        >
          <Card className="rounded-none border-[#27272a] bg-[#09090b]">
            <CardHeader className="border-b border-[#27272a] pb-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#71717a]" />
                <CardTitle className="text-sm font-medium text-[#fafafa]">
                  Split Payment (NT 2025.002)
                </CardTitle>
              </div>
              <p className="mt-1 text-xs text-[#71717a]">
                Com a Reforma, IBS e CBS serão retidos automaticamente pelo PSP
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[#71717a]">IBS Retido</p>
                  <p className="mt-1 font-numbers text-sm text-[#fafafa]">
                    {formatCurrency(data.splitPayment.ibsAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#71717a]">CBS Retido</p>
                  <p className="mt-1 font-numbers text-sm text-[#fafafa]">
                    {formatCurrency(data.splitPayment.cbsAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#71717a]">Líquido ao Vendedor</p>
                  <p className="mt-1 font-numbers text-sm font-medium text-[#34d399]">
                    {formatCurrency(data.splitPayment.netMerchantAmount)}
                  </p>
                </div>
              </div>
              <Separator className="my-3 bg-[#27272a]" />
              <p className="text-xs text-[#71717a]">
                Valores estimados. Sujeito a regulamentação do Banco Central.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
