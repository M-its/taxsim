"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/formatters"
import type { Sale, SaleStatus } from "@/lib/sale.types"

interface RecentOperationsTableProps {
  operations: Sale[]
}

function StatusBadge({ status }: { status: SaleStatus }) {
  if (status === "CONFIRMED") {
    return (
      <Badge
        variant="emerald"
        className="rounded-none border-[#34d399]/20 bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399]/20"
      >
        Autorizada
      </Badge>
    )
  }

  if (status === "CANCELLED") {
    return (
      <Badge
        variant="outline"
        className="rounded-none border-[#71717a]/20 bg-[#71717a]/10 text-[#71717a] hover:bg-[#71717a]/20"
      >
        Cancelada
      </Badge>
    )
  }

  return (
    <Badge
      variant="amber"
      className="rounded-none border-[#facc15]/20 bg-[#facc15]/10 text-[#facc15] hover:bg-[#facc15]/20"
    >
      Rascunho
    </Badge>
  )
}

function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export function RecentOperationsTable({ operations }: RecentOperationsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay: 0.6 }}
      style={{ willChange: "transform, opacity" }}
      className="rounded-none border border-[#27272a] bg-[#18181b]"
    >
      <div className="border-b border-[#27272a] p-5">
        <h3 className="text-sm font-medium text-[#fafafa]">Operações Recentes</h3>
        <p className="mt-1 text-xs text-[#a1a1aa]">
          Últimas vendas e simulações processadas
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[#27272a] hover:bg-transparent">
              <TableHead className="text-xs font-medium text-[#a1a1aa]">Operação</TableHead>
              <TableHead className="text-xs font-medium text-[#a1a1aa]">Cliente/Fornecedor</TableHead>
              <TableHead className="text-xs font-medium text-[#a1a1aa]">NF-e</TableHead>
              <TableHead className="text-xs font-medium text-[#a1a1aa]">Data</TableHead>
              <TableHead className="text-xs font-medium text-[#a1a1aa]">Status</TableHead>
              <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.length === 0 ? (
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-[#a1a1aa]"
                >
                  Nenhuma operação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              operations.map((operation, index) => (
                <motion.tr
                  key={operation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: 0.7 + index * 0.05 }}
                  style={{ willChange: "transform, opacity" }}
                  className="border-b border-[#27272a] transition-colors last:border-b-0 hover:bg-[#27272a]/30"
                >
                  <TableCell className="font-numbers text-sm text-[#fafafa]">
                    {operation.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                    {operation.clientId.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                    -
                  </TableCell>
                  <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                    {formatShortDate(operation.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={operation.status} />
                  </TableCell>
                  <TableCell className="text-right font-numbers text-sm text-[#fafafa]">
                    {formatCurrency(operation.totalAmount)}
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  )
}
