"use client"

import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatCurrencyCompact } from "@/lib/formatters"
import type { TaxLoadMonth } from "@/lib/mock-data"

interface TaxBarChartProps {
  data: TaxLoadMonth[]
}

export function TaxBarChart({ data }: TaxBarChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
      style={{ willChange: "transform, opacity" }}
      className="h-full rounded-none border border-[#27272a] bg-[#18181b] p-5"
    >
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#fafafa]">
          Carga Tributária: Atual vs Reforma
        </h3>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          Valores acumulados em milhares de R$
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `R$ ${value}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 0,
              }}
              labelStyle={{ color: "#fafafa", fontSize: 12 }}
              itemStyle={{ color: "#fafafa", fontSize: 12 }}
              formatter={(value: number, name: string) => [
                formatCurrencyCompact(value * 1000),
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: 16 }}
              formatter={(value: string) => (
                <span className="text-xs text-[#a1a1aa]">{value}</span>
              )}
            />
            <Bar
              dataKey="current"
              name="Sistema Atual"
              fill="#52525b"
              radius={[0, 0, 0, 0]}
              barSize={24}
            />
            <Bar
              dataKey="reform"
              name="IVA Dual"
              fill="#e4e4e7"
              radius={[0, 0, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
