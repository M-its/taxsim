"use client"

import { motion } from "framer-motion"
import { ArrowDownRight, ArrowUpRight, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, formatPercent } from "@/lib/formatters"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  variant?: "default" | "emerald" | "neutral"
  delta?: {
    value: string
    positive: boolean
  }
  index?: number
}

export function KpiCard({
  title,
  value,
  subtitle,
  variant = "default",
  delta,
  index = 0,
}: KpiCardProps) {
  const isCurrency = value.startsWith("R$") || !Number.isNaN(parseFloat(value.replace(/[^0-9,-]/g, "")))
  const formattedValue = isCurrency ? formatCurrency(value) : value

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.1 }}
      whileHover={{ y: -2, borderColor: "#3f3f46" }}
      style={{ willChange: "transform, opacity" }}
      layout={false}
      className={cn(
        "rounded-none border bg-[#18181b] p-5 transition-colors duration-300",
        variant === "emerald"
          ? "border-[#34d399]/30 bg-gradient-to-br from-[#34d399]/10 to-[#18181b]"
          : "border-[#27272a]"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">
            {title}
          </p>
          <p className="mt-3 font-numbers text-2xl font-semibold text-[#fafafa]">
            {formattedValue}
          </p>
        </div>
        {variant === "emerald" && (
          <div className="flex h-8 w-8 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
            <TrendingDown className="h-4 w-4" />
          </div>
        )}
      </div>

      {(delta || subtitle) && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          {delta && (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
                delta.positive ? "text-[#34d399]" : "text-[#f87171]"
              )}
            >
              {delta.positive ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              {formatPercent(delta.value)}
            </span>
          )}
          {subtitle && <span className="text-[#a1a1aa]">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  )
}

interface KpiGridProps {
  data: {
    estimatedSavings: string
    estimatedSavingsPercent: string
    projectedIbs: string
    projectedCbs: string
    projectedIs: string
  }
}

export function KpiGrid({ data }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Economia Estimada (YTD)"
        value={data.estimatedSavings}
        delta={{ value: data.estimatedSavingsPercent, positive: true }}
        subtitle="vs. regime atual"
        variant="emerald"
        index={0}
      />
      <KpiCard
        title="Projeção IBS"
        value={data.projectedIbs}
        subtitle="Imposto sobre Bens e Serviços"
        variant="neutral"
        index={1}
      />
      <KpiCard
        title="Projeção CBS"
        value={data.projectedCbs}
        subtitle="Contribuição sobre Bens e Serviços"
        variant="neutral"
        index={2}
      />
      <KpiCard
        title="Projeção IS"
        value={data.projectedIs}
        subtitle="Imposto Seletivo"
        variant="neutral"
        index={3}
      />
    </div>
  )
}
