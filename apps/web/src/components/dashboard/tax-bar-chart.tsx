"use client"

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
import { formatCurrency, formatCurrencyCompact } from "@/lib/formatters"
import type { TaxLoadMonth } from "@/lib/mock-data"

interface TaxBarChartProps {
  data: TaxLoadMonth[]
}

export function TaxBarChart({ data }: TaxBarChartProps) {
  return (
    <div className="h-full rounded-none border border-[#27272a] bg-[#18181b] p-5">
      <div className="mb-6">
        <h2 id="tax-load-title" className="text-sm font-medium text-[#fafafa]">
          Carga Tributária: Atual vs Reforma
        </h2>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          Valores acumulados em milhares de R$
        </p>
      </div>

      <div className="h-[300px] w-full" aria-hidden="true">
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
                formatCurrencyCompact(value),
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

      <details className="mt-4 border-t border-[#27272a] pt-4 text-xs text-[#a1a1aa]">
        <summary className="cursor-pointer font-medium text-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399]">
          Ver dados do gráfico em texto
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left" aria-labelledby="tax-load-title">
            <thead>
              <tr className="border-b border-[#27272a]">
                <th className="py-2 pr-3">Mês</th>
                <th className="py-2 pr-3">Sistema atual</th>
                <th className="py-2">IVA Dual</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.month} className="border-b border-[#27272a] last:border-0">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {item.month}
                  </th>
                  <td className="py-2 pr-3 font-numbers">{formatCurrency(item.current)}</td>
                  <td className="py-2 font-numbers">{formatCurrency(item.reform)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
