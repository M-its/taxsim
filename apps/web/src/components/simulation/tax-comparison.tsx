"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import type { SimulationResponse } from "@/lib/mock-data"

interface TaxComparisonProps {
  data: SimulationResponse
}

interface LineItemProps {
  label: string
  rate?: string
  value: string
  isTotal?: boolean
}

function LineItem({ label, rate, value, isTotal }: LineItemProps) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        isTotal ? "border-t border-[#27272a] pt-3" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={isTotal ? "text-sm font-medium text-[#fafafa]" : "text-sm text-[#a1a1aa]"}>
          {label}
        </span>
        {rate && (
          <span className="font-numbers text-xs text-[#71717a]">({formatPercent(rate)})</span>
        )}
      </div>
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

export function TaxComparison({ data }: TaxComparisonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        style={{ willChange: "transform, opacity" }}
        layout={false}
      >
        <Card className="rounded-none border-[#27272a] bg-[#18181b]">
          <CardHeader className="border-b border-[#27272a] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#fafafa]">Regime Atual</CardTitle>
              <Badge
                variant="secondary"
                className="rounded-none bg-[#27272a] text-xs text-[#a1a1aa]"
              >
                Lucro Presumido
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <LineItem
              label="PIS"
              rate="0.0082"
              value={data.currentModel.totalPis}
            />
            <LineItem
              label="COFINS"
              rate="0.0378"
              value={data.currentModel.totalCofins}
            />
            <LineItem
              label="ICMS"
              rate="0.1800"
              value={data.currentModel.totalIcms}
            />
            <LineItem
              label="ISS"
              rate="0.0000"
              value={data.currentModel.totalIss}
            />
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
        layout={false}
      >
        <Card className="rounded-none border-[#34d399]/30 bg-gradient-to-br from-[#34d399]/5 to-[#18181b]">
          <CardHeader className="border-b border-[#27272a] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#fafafa]">IVA Dual (Reforma)</CardTitle>
              <Badge
                variant="emerald"
                className="rounded-none border-[#34d399]/20 bg-[#34d399]/10 text-xs text-[#34d399]"
              >
                Novo Modelo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <LineItem
              label="IBS"
              rate="0.0700"
              value={data.reformModel.totalIbs}
            />
            <LineItem
              label="CBS"
              rate="0.0270"
              value={data.reformModel.totalCbs}
            />
            <LineItem
              label="IS"
              rate="0.0000"
              value={data.reformModel.totalIs}
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#a1a1aa]">Créditos Presumidos da Cadeia</span>
              <span className="font-numbers text-sm text-[#34d399]">-{formatCurrency("29000.00")}</span>
            </div>
            <Separator className="my-2 bg-[#27272a]" />
            <LineItem label="Total estimado" value={data.reformModel.total} isTotal />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
