'use client'

import { motion } from 'framer-motion'
import { TrendingDown } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/formatters'

interface ProjectedImpactProps {
  savings: string
  savingsPercent: string
}

export function ProjectedImpact({ savings, savingsPercent }: ProjectedImpactProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
      style={{ willChange: 'transform, opacity' }}
      className="min-w-0 rounded-none border border-[#34d399]/30 bg-gradient-to-r from-[#34d399]/10 to-[#18181b] p-6"
    >
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#a1a1aa]">
            Impacto Projetado
          </p>
          <h2 className="mt-2 text-lg font-medium text-[#fafafa]">
            Economia projetada com a reforma
          </h2>
        </div>

        <div className="flex min-w-0 max-w-full items-center gap-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="break-all font-numbers text-2xl sm:text-3xl font-semibold text-[#34d399]">
                {formatCurrency(savings)}
              </p>
              <p className="mt-0.5 text-sm text-[#a1a1aa]">
                Redução de {formatPercent(savingsPercent)} na carga tributária
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
