"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Check, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cancelSale, confirmSale, getSaleById, getSales } from "@/lib/api"
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters"
import type { Sale, SaleListItem, SaleListResponse, SaleStatus } from "@/lib/sale.types"

const statusOptions: { value: SaleStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "CONFIRMED", label: "Confirmada" },
  { value: "CANCELLED", label: "Cancelada" },
]

const statusBadgeMap: Record<
  SaleStatus,
  { label: string; className: string }
> = {
  CONFIRMED: {
    label: "Confirmada",
    className: "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20",
  },
  DRAFT: {
    label: "Rascunho",
    className: "bg-[#facc15]/10 text-[#facc15] border-[#facc15]/20",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-[#71717a]/10 text-[#71717a] border-[#71717a]/20",
  },
}

const emptyFilterMessages: Record<SaleStatus | "ALL", { title: string; description: string }> = {
  ALL: {
    title: "Nenhuma venda encontrada.",
    description: "As vendas criadas aparecerão aqui automaticamente.",
  },
  DRAFT: {
    title: "Nenhuma venda em rascunho.",
    description: "Vendas criadas e ainda não confirmadas aparecerão aqui.",
  },
  CONFIRMED: {
    title: "Nenhuma venda confirmada.",
    description: "Vendas confirmadas aparecerão aqui.",
  },
  CANCELLED: {
    title: "Nenhuma venda cancelada.",
    description: "Vendas canceladas aparecerão aqui.",
  },
}

function truncateId(id: string): string {
  return id.slice(0, 8)
}

function StatusBadge({ status }: { status: SaleStatus }) {
  const config = statusBadgeMap[status]
  return (
    <Badge
      variant="outline"
      className={`rounded-none border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  )
}

interface SaleDetailModalProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SaleDetailModal({ sale, open, onOpenChange }: SaleDetailModalProps) {
  if (!sale) return null

  const currentTotal = sale.currentModel.total
  const reformTotal = sale.reformModel.total
  const currentEffectiveRate = (parseFloat(currentTotal) / parseFloat(sale.totalAmount || "1")).toFixed(4)
  const reformEffectiveRate = (parseFloat(reformTotal) / parseFloat(sale.totalAmount || "1")).toFixed(4)
  const savings = parseFloat(sale.delta.absolute)
  const savingsClass = savings < 0 ? "text-[#34d399]" : savings > 0 ? "text-[#f87171]" : "text-[#a1a1aa]"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-none border border-[#27272a] bg-[#18181b] p-0 text-[#fafafa]"
      >
        <DialogHeader className="border-b border-[#27272a] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-sm font-medium text-[#fafafa]">
                Operação {truncateId(sale.id)}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-[#a1a1aa]">
                Detalhamento completo da venda e cálculo tributário.
              </DialogDescription>
            </div>
            <StatusBadge status={sale.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-[#71717a]">Data</p>
              <p className="font-numbers text-sm text-[#fafafa]">{formatDate(sale.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#71717a]">Cliente</p>
              <p className="font-numbers text-sm text-[#fafafa]">{truncateId(sale.clientId)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#71717a]">Valor Total</p>
              <p className="font-numbers text-sm text-[#fafafa]">{formatCurrency(sale.totalAmount)}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 border border-[#27272a] p-4">
              <p className="text-xs font-medium text-[#a1a1aa]">Modelo Atual</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">PIS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.currentModel.totalPis)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">COFINS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.currentModel.totalCofins)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">ICMS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.currentModel.totalIcms)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">ISS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.currentModel.totalIss)}</span>
                </div>
                <div className="border-t border-[#27272a] pt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[#fafafa]">Total</span>
                    <span className="font-numbers text-[#fafafa]">{formatCurrency(currentTotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-[#71717a]">Alíquota efetiva</span>
                    <span className="font-numbers text-[#a1a1aa]">{formatPercent(currentEffectiveRate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 border border-[#27272a] p-4">
              <p className="text-xs font-medium text-[#a1a1aa]">Modelo Reforma</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">IBS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.reformModel.totalIbs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">CBS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.reformModel.totalCbs)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#a1a1aa]">IS</span>
                  <span className="font-numbers text-[#fafafa]">{formatCurrency(sale.reformModel.totalIs)}</span>
                </div>
                <div className="border-t border-[#27272a] pt-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-[#fafafa]">Total</span>
                    <span className="font-numbers text-[#fafafa]">{formatCurrency(reformTotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-[#71717a]">Alíquota efetiva</span>
                    <span className="font-numbers text-[#a1a1aa]">{formatPercent(reformEffectiveRate)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#27272a] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#71717a]">Economia estimada</p>
                <p className={`font-numbers text-lg font-semibold ${savingsClass}`}>
                  {formatCurrency(sale.delta.absolute)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#71717a]">Variação percentual</p>
                <p className={`font-numbers text-sm font-medium ${savingsClass}`}>
                  {formatPercent(sale.delta.percentual)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-[#a1a1aa]">Itens da venda</p>
            <div className="overflow-x-auto border border-[#27272a]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#27272a] hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-[#a1a1aa]">Produto</TableHead>
                    <TableHead className="text-center text-xs font-medium text-[#a1a1aa]">Qtd</TableHead>
                    <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">Unitário</TableHead>
                    <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">Total</TableHead>
                    <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">NCM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item) => (
                    <TableRow
                      key={item.id}
                      className="border-b border-[#27272a] last:border-b-0 hover:bg-[#27272a]/30"
                    >
                      <TableCell className="text-sm text-[#fafafa]">{item.productName}</TableCell>
                      <TableCell className="text-center font-numbers text-sm text-[#a1a1aa]">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right font-numbers text-sm text-[#a1a1aa]">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-numbers text-sm text-[#fafafa]">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right font-numbers text-sm text-[#a1a1aa]">
                        {item.ncmCode}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="border-t border-[#27272a] p-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-none border border-[#27272a] bg-transparent px-4 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function SalesPage() {
  const [sales, setSales] = useState<SaleListItem[]>([])
  const [pagination, setPagination] = useState<SaleListResponse["pagination"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [detailSale, setDetailSale] = useState<Sale | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null)
  const [isActionId, setIsActionId] = useState<string | null>(null)
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadSales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current)
      }
    }
  }, [])

  function loadSales() {
    setIsLoading(true)
    setListError(null)

    const status = statusFilter === "ALL" ? undefined : statusFilter
    getSales(status, page)
      .then((response) => {
        setSales(response.data)
        setPagination(response.pagination)
      })
      .catch((error) => {
        setSales([])
        setPagination(null)
        setListError(error instanceof Error ? error.message : "Erro ao carregar vendas.")
      })
      .finally(() => setIsLoading(false))
  }

  function handleStatusChange(value: SaleStatus | "ALL" | null) {
    if (value) {
      setStatusFilter(value)
      setPage(1)
    }
  }

  function handlePageChange(nextPage: number) {
    setPage(nextPage)
  }

  function handlePreviousPage() {
    handlePageChange(Math.max(1, page - 1))
  }

  function handleNextPage() {
    if (pagination && page < pagination.totalPages) {
      handlePageChange(page + 1)
    }
  }

  async function handleViewDetails(saleId: string) {
    setIsDetailLoading(true)
    setIsDetailOpen(true)
    try {
      const sale = await getSaleById(saleId)
      setDetailSale(sale)
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao carregar detalhes da venda.")
      setIsDetailOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  async function handleConfirm(saleId: string) {
    setIsActionId(saleId)
    try {
      await confirmSale(saleId)
      loadSales()
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao confirmar venda.")
    } finally {
      setIsActionId(null)
    }
  }

  function handleCancelClick(saleId: string) {
    if (confirmingCancelId === saleId) {
      performCancel(saleId)
      return
    }

    setConfirmingCancelId(saleId)

    if (cancelTimerRef.current) {
      clearTimeout(cancelTimerRef.current)
    }

    cancelTimerRef.current = setTimeout(() => {
      setConfirmingCancelId((current) => (current === saleId ? null : current))
    }, 2000)
  }

  async function performCancel(saleId: string) {
    if (cancelTimerRef.current) {
      clearTimeout(cancelTimerRef.current)
    }
    setConfirmingCancelId(null)
    setIsActionId(saleId)
    try {
      await cancelSale(saleId)
      loadSales()
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Erro ao cancelar venda.")
    } finally {
      setIsActionId(null)
    }
  }

  const emptyMessage = emptyFilterMessages[statusFilter]

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ willChange: "transform, opacity" }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-[#fafafa]">Vendas</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">Histórico de operações fiscais.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        style={{ willChange: "transform, opacity" }}
        className="rounded-none border border-[#27272a] bg-[#18181b] p-5"
      >
        <div className="mb-4 sm:w-64">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] focus:ring-[#34d399]/20">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-[#27272a] bg-[#18181b] text-[#fafafa]">
              {statusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-sm text-[#fafafa] focus:bg-[#27272a] focus:text-[#fafafa]"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {listError && (
          <div className="mb-4 rounded-none border border-[#f87171]/30 bg-[#f87171]/10 p-3 text-xs text-[#f87171]">
            {listError}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] hover:bg-transparent">
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Operação</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Cliente</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Data</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Status</TableHead>
                <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">
                  Valor Total
                </TableHead>
                <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-[#27272a]">
                    <TableCell colSpan={6} className="p-4">
                      <div className="h-6 animate-pulse bg-[#27272a]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow className="border-[#27272a] hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center">
                    <p className="text-sm text-[#a1a1aa]">{emptyMessage.title}</p>
                    <p className="mt-1 text-xs text-[#71717a]">{emptyMessage.description}</p>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale, index) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
                    style={{ willChange: "transform, opacity" }}
                    className="border-b border-[#27272a] transition-colors last:border-b-0 hover:bg-[#27272a]/30"
                  >
                    <TableCell className="font-numbers text-sm text-[#fafafa]">
                      {truncateId(sale.id)}
                    </TableCell>
                    <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                      {truncateId(sale.clientId)}
                    </TableCell>
                    <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                      {formatDate(sale.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="text-right font-numbers text-sm text-[#fafafa]">
                      {formatCurrency(sale.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(sale.id)}
                          className="rounded-none border border-transparent px-2 text-xs text-[#a1a1aa] hover:border-[#27272a] hover:bg-[#27272a]/50 hover:text-[#fafafa]"
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Ver detalhes
                        </Button>
                        {sale.status === "DRAFT" && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isActionId === sale.id}
                              onClick={() => handleConfirm(sale.id)}
                              className="rounded-none border border-transparent px-2 text-xs text-[#34d399] hover:border-[#34d399]/20 hover:bg-[#34d399]/10 hover:text-[#34d399] disabled:opacity-50"
                            >
                              {isActionId === sale.id ? (
                                "Processando..."
                              ) : (
                                <>
                                  <Check className="mr-1 h-3.5 w-3.5" />
                                  Confirmar
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={isActionId === sale.id}
                              onClick={() => handleCancelClick(sale.id)}
                              className="rounded-none border border-transparent px-2 text-xs text-[#f87171] hover:border-[#f87171]/20 hover:bg-[#f87171]/10 hover:text-[#f87171] disabled:opacity-50"
                            >
                              {confirmingCancelId === sale.id ? (
                                "Confirmar?"
                              ) : isActionId === sale.id ? (
                                "Processando..."
                              ) : (
                                <>
                                  <X className="mr-1 h-3.5 w-3.5" />
                                  Cancelar
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-[#27272a] pt-4">
            <p className="text-xs text-[#71717a]">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePreviousPage}
                disabled={page === 1}
                className="rounded-none border border-[#27272a] bg-transparent px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] disabled:opacity-50"
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleNextPage}
                disabled={page === pagination.totalPages}
                className="rounded-none border border-[#27272a] bg-transparent px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] disabled:opacity-50"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {isDetailOpen && (isDetailLoading || detailSale) && (
        <div className={isDetailLoading ? "opacity-50" : ""}>
          <SaleDetailModal
            sale={detailSale}
            open={isDetailOpen}
            onOpenChange={(open) => {
              setIsDetailOpen(open)
              if (!open) {
                setDetailSale(null)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}
