"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { formatPercent } from "@/lib/formatters"
import type { TaxCompositionItem } from "@/lib/mock-data"

interface TaxDonutChartProps {
  data: TaxCompositionItem[]
}

function LabelListContent({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}) {
  if (percent < 0.05) return null

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180)
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180)

  return (
    <text
      x={x}
      y={y}
      fill="#09090b"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] font-semibold"
    >
      {name}
    </text>
  )
}

export function TaxDonutChart({ data }: TaxDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="h-full rounded-none border border-[#27272a] bg-[#18181b] p-5">
      <div className="mb-6">
        <h2 id="tax-composition-title" className="text-sm font-medium text-[#fafafa]">
          Composição Tributária
        </h2>
        <p className="mt-1 text-xs text-[#a1a1aa]">Distribuição IBS / CBS / IS</p>
      </div>

      <div className="h-[220px] w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              rootTabIndex={-1}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
              labelLine={false}
              label={LabelListContent}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: 0,
              }}
              itemStyle={{ color: "#fafafa", fontSize: 12 }}
              formatter={(value: number, name: string) => {
                const percentage = total > 0 ? value / total : 0
                return [formatPercent(percentage), name]
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#27272a] pt-4">
        {data.map((item) => {
          const percentage = total > 0 ? item.value / total : 0
          return (
            <div key={item.name} className="text-center">
              <p className="text-xs text-[#a1a1aa]">{item.name}</p>
              <p className="font-numbers text-sm font-medium text-[#fafafa]">
                {formatPercent(percentage)}
              </p>
            </div>
          )
        })}
      </div>

      <details className="mt-4 border-t border-[#27272a] pt-4 text-xs text-[#a1a1aa]">
        <summary className="cursor-pointer font-medium text-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399]">
          Ver dados do gráfico em texto
        </summary>
        <ul className="mt-3 space-y-2" aria-labelledby="tax-composition-title">
          {data.map((item) => {
            const percentage = total > 0 ? item.value / total : 0
            return (
              <li key={item.name} className="flex justify-between gap-4">
                <span>{item.name}</span>
                <span className="font-numbers text-[#fafafa]">{formatPercent(percentage)}</span>
              </li>
            )
          })}
        </ul>
      </details>
    </div>
  )
}
