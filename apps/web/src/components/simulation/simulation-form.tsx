'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Plus, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'
import { getProducts } from '@/lib/api'
import type { TaxRegime } from '@/lib/auth.types'
import type { Product } from '@/lib/product.types'
import type { SimulationItem } from '@/lib/simulation.types'

export type SimulationFormItem = SimulationItem

interface SimulationFormProps {
  taxRegime: TaxRegime | null
  isLoadingCompany: boolean
  isSubmitting: boolean
  onSubmit: (items: SimulationFormItem[]) => void
}

const REGIME_LABELS: Record<TaxRegime, string> = {
  SIMPLES_NACIONAL: 'Simples Nacional',
  LUCRO_PRESUMIDO: 'Lucro Presumido',
  LUCRO_REAL: 'Lucro Real',
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function currencyToRaw(value: string): string {
  const digits = value.replace(/\D/g, '')
  const numeric = Number(digits) / 100
  return numeric.toFixed(2)
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  const numeric = Number(digits) / 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeric)
}

type CatalogItemDraft = {
  id: string
  mode: 'catalog'
  productId: string | null
  product: Product | null
  quantity: string
}

type ManualItemDraft = {
  id: string
  mode: 'manual'
  ncmCode: string
  unitPrice: string
  quantity: string
}

type ItemDraft = CatalogItemDraft | ManualItemDraft

function createEmptyItem(mode: ItemDraft['mode'] = 'catalog'): ItemDraft {
  const id = generateId()
  if (mode === 'catalog') {
    return { id, mode, productId: null, product: null, quantity: '1' }
  }
  return { id, mode, ncmCode: '', unitPrice: '', quantity: '1' }
}

interface ProductSearchProps {
  selectedProduct: Product | null
  onSelect: (product: Product | null) => void
}

function ProductSearch({ selectedProduct, onSelect }: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(true)
      getProducts(query.trim() || undefined)
        .then((response) => setResults(response.data))
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="rounded-none border-[#27272a] bg-[#09090b] pl-9 text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
        />
        {isLoading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717a]">
            Buscando...
          </span>
        )}
      </div>

      {selectedProduct && (
        <div className="flex items-start justify-between gap-3 border border-[#27272a] bg-[#09090b] p-3">
          <div>
            <p className="text-sm font-medium text-[#fafafa]">{selectedProduct.name}</p>
            <p className="text-xs text-[#71717a]">
              SKU {selectedProduct.sku} · NCM {selectedProduct.ncmCode} ·{' '}
              {formatCurrency(selectedProduct.unitPrice)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect(null)}
            className="h-auto rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            Trocar
          </Button>
        </div>
      )}

      {!selectedProduct && results.length > 0 && (
        <ul className="max-h-48 overflow-auto border border-[#27272a] bg-[#09090b]">
          {results.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onSelect(product)}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a]"
              >
                <p className="text-sm text-[#fafafa]">{product.name}</p>
                <p className="text-xs text-[#71717a]">
                  SKU {product.sku} · NCM {product.ncmCode} · {formatCurrency(product.unitPrice)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selectedProduct && !isLoading && query.trim().length > 0 && results.length === 0 && (
        <p className="text-xs text-[#71717a]">Nenhum produto encontrado.</p>
      )}
    </div>
  )
}

function validateItem(draft: ItemDraft): string[] {
  const errors: string[] = []
  const quantity = parseInt(draft.quantity, 10)

  if (draft.quantity === '' || Number.isNaN(quantity) || quantity < 1) {
    errors.push('Quantidade inválida')
  }

  if (draft.mode === 'catalog') {
    if (!draft.productId || !draft.product) {
      errors.push('Selecione um produto')
    }
  } else {
    if (!/^\d{8}$/.test(draft.ncmCode)) {
      errors.push('NCM deve conter 8 dígitos')
    }
    const unitPriceRaw = currencyToRaw(draft.unitPrice)
    if (parseFloat(unitPriceRaw) <= 0) {
      errors.push('Preço unitário inválido')
    }
  }

  return errors
}

function mapToSimulationItem(draft: ItemDraft): SimulationFormItem {
  const quantity = parseInt(draft.quantity, 10)

  if (draft.mode === 'catalog') {
    return {
      ncmCode: draft.product!.ncmCode,
      quantity,
      unitPrice: draft.product!.unitPrice,
    }
  }

  return {
    ncmCode: draft.ncmCode,
    quantity,
    unitPrice: currencyToRaw(draft.unitPrice),
  }
}

export function SimulationForm({
  taxRegime,
  isLoadingCompany,
  isSubmitting,
  onSubmit,
}: SimulationFormProps) {
  const [items, setItems] = useState<ItemDraft[]>([createEmptyItem()])
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

  function updateItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, ...patch } as ItemDraft
      }),
    )
  }

  function changeMode(id: string, mode: ItemDraft['mode']) {
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    const current = items.find((item) => item.id === id)
    const quantity = current?.quantity ?? '1'
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        if (mode === 'catalog') {
          return { id, mode, productId: null, product: null, quantity }
        }
        return { id, mode, ncmCode: '', unitPrice: '', quantity }
      }),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  function addItem() {
    const lastMode = items[items.length - 1]?.mode ?? 'catalog'
    setItems((prev) => [...prev, createEmptyItem(lastMode)])
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const newErrors: Record<string, string[]> = {}
    items.forEach((item) => {
      const errs = validateItem(item)
      if (errs.length > 0) newErrors[item.id] = errs
    })
    setValidationErrors(newErrors)
    if (Object.keys(newErrors).length > 0 || items.length === 0) return
    onSubmit(items.map(mapToSimulationItem))
  }

  if (isLoadingCompany) {
    return (
      <div className="space-y-5 rounded-none border border-[#27272a] bg-[#18181b] p-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse bg-[#27272a]" />
          <div className="space-y-2">
            <div className="h-4 w-48 animate-pulse bg-[#27272a]" />
            <div className="h-3 w-32 animate-pulse bg-[#27272a]" />
          </div>
        </div>
        <div className="h-24 animate-pulse bg-[#27272a]" />
        <div className="h-10 w-40 animate-pulse bg-[#27272a]" />
      </div>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ willChange: 'transform, opacity' }}
      onSubmit={handleSubmit}
      className="rounded-none border border-[#27272a] bg-[#18181b] p-5"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#fafafa]">Parâmetros de Simulação</h3>
            <p className="text-xs text-[#a1a1aa]">
              Monte a cesta de produtos e calcule o comparativo tributário.
            </p>
          </div>
        </div>
        {taxRegime && (
          <Badge
            variant="secondary"
            className="w-fit rounded-none bg-[#27272a] text-xs text-[#a1a1aa]"
          >
            Regime: {REGIME_LABELS[taxRegime]}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const errors = validationErrors[item.id] ?? []

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="rounded-none border border-[#27272a] bg-[#09090b] p-4"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#a1a1aa]">Item {index + 1}</span>
                  <div className="flex items-center border border-[#27272a]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => changeMode(item.id, 'catalog')}
                      className={cn(
                        'h-7 rounded-none px-3 text-xs',
                        item.mode === 'catalog'
                          ? 'bg-[#27272a] text-[#fafafa] hover:bg-[#27272a]'
                          : 'text-[#71717a] hover:bg-[#27272a] hover:text-[#fafafa]',
                      )}
                    >
                      Produto do catálogo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-tour="simulation-manual-mode"
                      onClick={() => changeMode(item.id, 'manual')}
                      className={cn(
                        'h-7 rounded-none px-3 text-xs',
                        item.mode === 'manual'
                          ? 'bg-[#27272a] text-[#fafafa] hover:bg-[#27272a]'
                          : 'text-[#71717a] hover:bg-[#27272a] hover:text-[#fafafa]',
                      )}
                    >
                      NCM manual
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  className="h-auto w-fit gap-2 rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {item.mode === 'catalog' ? (
                  <div className="md:col-span-2">
                    <Label className="mb-2 block text-xs text-[#a1a1aa]">Produto</Label>
                    <ProductSearch
                      selectedProduct={item.product}
                      onSelect={(product) =>
                        updateItem(item.id, {
                          product,
                          productId: product?.id ?? null,
                        })
                      }
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`ncm-${item.id}`} className="text-xs text-[#a1a1aa]">
                        Código NCM
                      </Label>
                      <Input
                        id={`ncm-${item.id}`}
                        data-tour="simulation-ncm"
                        value={item.ncmCode}
                        onChange={(event) =>
                          updateItem(item.id, {
                            ncmCode: event.target.value.replace(/\D/g, '').slice(0, 8),
                          })
                        }
                        placeholder="8 dígitos"
                        inputMode="numeric"
                        className="rounded-none border-[#27272a] bg-[#18181b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`price-${item.id}`} className="text-xs text-[#a1a1aa]">
                        Preço Unitário (R$)
                      </Label>
                      <Input
                        id={`price-${item.id}`}
                        value={formatCurrencyInput(item.unitPrice)}
                        onChange={(event) =>
                          updateItem(item.id, { unitPrice: currencyToRaw(event.target.value) })
                        }
                        inputMode="decimal"
                        className="rounded-none border-[#27272a] bg-[#18181b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`qty-${item.id}`} className="text-xs text-[#a1a1aa]">
                    Quantidade
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(item.id, {
                        quantity: event.target.value.replace(/\D/g, ''),
                      })
                    }
                    inputMode="numeric"
                    className="rounded-none border-[#27272a] bg-[#18181b] font-numbers text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                  />
                </div>

                {item.mode === 'catalog' && item.product && (
                  <div className="flex items-center gap-2 text-xs text-[#71717a]">
                    <span className="font-numbers text-[#a1a1aa]">
                      {formatCurrency(item.product.unitPrice)}
                    </span>
                    <span>por unidade</span>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errors.map((error) => (
                    <p key={error} className="text-xs text-red-400">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={addItem}
          className="w-fit gap-2 rounded-none border border-[#27272a] bg-transparent px-4 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
        >
          <Plus className="h-4 w-4" />
          Adicionar item
        </Button>

        <Button
          type="submit"
          data-tour="simulation-submit"
          disabled={isSubmitting}
          className={cn(
            'rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f]',
            isSubmitting && 'cursor-not-allowed opacity-60 hover:translate-y-0',
          )}
        >
          {isSubmitting ? 'Calculando...' : 'Calcular simulação'}
        </Button>
      </div>
    </motion.form>
  )
}
