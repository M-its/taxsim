'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Plus, Search, Trash2, RotateCcw } from 'lucide-react'
import { NcmStatus } from '@/components/ncm/ncm-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AsyncStatus } from '@/components/ui/async-status'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useComboboxNavigation } from '@/hooks/use-combobox-navigation'
import { useNcmSearch } from '@/hooks/use-ncm-search'
import { diagnoseNcms, getProducts, type NcmDiagnosis } from '@/lib/api'
import type { TaxRegime } from '@/lib/auth.types'
import { formatCurrency } from '@/lib/formatters'
import {
  serverReasonToStatus,
  unavailableDiagnosis,
  type NcmServerIssue,
} from '@/lib/ncm-eligibility'
import {
  validateSimulationItems,
  type SimulationValidationError,
  type ValidatableSimulationItem,
} from '@/lib/simulation-form-validation'
import type { Product } from '@/lib/product.types'
import type { SimulationItem } from '@/lib/simulation.types'
import { cn } from '@/lib/utils'

export type SimulationFormItem = SimulationItem

interface SimulationFormProps {
  taxRegime: TaxRegime | null
  isLoadingCompany: boolean
  isSubmitting: boolean
  serverIssues?: NcmServerIssue[]
  onClearServerIssues?: () => void
  onSubmit: (items: SimulationFormItem[]) => void | Promise<void>
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
  diagnosis: NcmDiagnosis | null
}

type ManualItemDraft = {
  id: string
  mode: 'manual'
  ncmCode: string
  unitPrice: string
  quantity: string
  diagnosis: NcmDiagnosis | null
}

type ItemDraft = CatalogItemDraft | ManualItemDraft

function createEmptyItem(mode: ItemDraft['mode'] = 'catalog'): ItemDraft {
  const id = generateId()
  if (mode === 'catalog') {
    return {
      id,
      mode,
      productId: null,
      product: null,
      quantity: '1',
      diagnosis: null,
    }
  }
  return { id, mode, ncmCode: '', unitPrice: '', quantity: '1', diagnosis: null }
}

function itemNcmCode(item: ItemDraft): string {
  return item.mode === 'catalog' ? (item.product?.ncmCode ?? '') : item.ncmCode
}

function validatableItem(item: ItemDraft): ValidatableSimulationItem {
  return {
    id: item.id,
    mode: item.mode,
    ncmCode: itemNcmCode(item),
    hasProduct: item.mode === 'catalog' && Boolean(item.productId && item.product),
    quantity: item.quantity,
    unitPrice: item.mode === 'catalog' ? (item.product?.unitPrice ?? '') : item.unitPrice,
  }
}

interface ProductOption {
  product: Product
  diagnosis: NcmDiagnosis
}

interface ProductSearchProps {
  inputId: string
  taxRegime: TaxRegime | null
  selectedProduct: Product | null
  selectedDiagnosis: NcmDiagnosis | null
  invalid: boolean
  describedBy?: string
  onSelect: (product: Product | null, diagnosis: NcmDiagnosis | null) => void
}

function ProductSearch({
  inputId,
  taxRegime,
  selectedProduct,
  selectedDiagnosis,
  invalid,
  describedBy,
  onSelect,
}: ProductSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchWarning, setSearchWarning] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const listboxId = `${inputId}-options`

  function chooseProduct(option: ProductOption) {
    onSelect(option.product, option.diagnosis)
    setIsOpen(false)
  }

  const combobox = useComboboxNavigation({
    items: results,
    getOptionId: (_option, index) => `${listboxId}-${index}`,
    onSelect: chooseProduct,
    onEscape: () => setIsOpen(false),
  })
  const showResults = !selectedProduct && isOpen && results.length > 0

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      setIsLoading(true)
      setSearchWarning(null)
      getProducts(query.trim() || undefined)
        .then(async (response) => {
          if (response.data.length === 0) return []
          if (!taxRegime) {
            return response.data.map((product) => ({
              product,
              diagnosis: unavailableDiagnosis(product.ncmCode),
            }))
          }

          try {
            const diagnoses = await diagnoseNcms(
              response.data.map((product) => product.ncmCode),
              taxRegime,
            )
            return response.data.map((product, index) => ({
              product,
              diagnosis: diagnoses[index] ?? unavailableDiagnosis(product.ncmCode),
            }))
          } catch {
            if (active) {
              setSearchWarning(
                'Não foi possível verificar os NCMs agora. A validação será repetida ao simular.',
              )
            }
            return response.data.map((product) => ({
              product,
              diagnosis: unavailableDiagnosis(product.ncmCode),
            }))
          }
        })
        .then((options) => {
          if (active) setResults(options)
        })
        .catch(() => {
          if (active) setResults([])
        })
        .finally(() => {
          if (active) setIsLoading(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, taxRegime])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
        <Input
          id={inputId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onKeyDown={(event) => {
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) setIsOpen(true)
            combobox.onKeyDown(event)
          }}
          placeholder="Buscar por nome ou SKU..."
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showResults}
          aria-activedescendant={showResults ? combobox.activeOptionId : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="rounded-none border-[#27272a] bg-[#09090b] pl-9 text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
        />
        {isLoading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a1a1aa]">
            Buscando...
          </span>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {isLoading
          ? 'Buscando produtos.'
          : `${results.length} ${results.length === 1 ? 'produto encontrado' : 'produtos encontrados'}.`}
      </span>

      {selectedProduct && (
        <div className="flex items-start justify-between gap-3 border border-[#27272a] bg-[#09090b] p-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#fafafa]">{selectedProduct.name}</p>
            <p className="text-xs text-[#a1a1aa]">
              SKU {selectedProduct.sku} · NCM {selectedProduct.ncmCode} ·{' '}
              {formatCurrency(selectedProduct.unitPrice)}
            </p>
            {selectedDiagnosis && <NcmStatus status={selectedDiagnosis.status} />}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null, null)
              setIsOpen(true)
            }}
            className="h-auto rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            Trocar
          </Button>
        </div>
      )}

      {showResults && (
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-56 overflow-auto border border-[#27272a] bg-[#09090b]"
        >
          {results.map(({ product, diagnosis }, index) => (
            <li key={product.id} role="none">
              <button
                id={`${listboxId}-${index}`}
                type="button"
                role="option"
                aria-selected={combobox.activeIndex === index}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => combobox.setActiveIndex(index)}
                onClick={() => chooseProduct({ product, diagnosis })}
                className={cn(
                  'w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a]',
                  combobox.activeIndex === index && 'bg-[#27272a]',
                )}
              >
                <p className="text-sm text-[#fafafa]">{product.name}</p>
                <p className="text-xs text-[#a1a1aa]">
                  SKU {product.sku} · NCM {product.ncmCode} · {formatCurrency(product.unitPrice)}
                </p>
                <NcmStatus status={diagnosis.status} className="mt-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!selectedProduct && !isLoading && query.trim().length > 0 && results.length === 0 && (
        <p className="text-xs text-[#a1a1aa]">Nenhum produto encontrado.</p>
      )}
      {searchWarning && <p className="text-xs text-[#facc15]">{searchWarning}</p>}
    </div>
  )
}

function simulationFieldId(
  item: ItemDraft,
  field: SimulationValidationError['field'],
): string {
  if (field === 'product') return `product-${item.id}`
  if (field === 'ncm') return `ncm-${item.id}`
  if (field === 'unitPrice') return `price-${item.id}`
  return `qty-${item.id}`
}

function focusFirstSimulationError(
  items: ItemDraft[],
  errorsByItem: Record<string, SimulationValidationError[]>,
) {
  for (const item of items) {
    const errors = errorsByItem[item.id] ?? []
    const order: SimulationValidationError['field'][] =
      item.mode === 'catalog'
        ? ['product', 'quantity']
        : ['ncm', 'unitPrice', 'quantity']
    const firstField = order.find((field) => errors.some((error) => error.field === field))
    if (firstField) {
      requestAnimationFrame(() => document.getElementById(simulationFieldId(item, firstField))?.focus())
      return
    }
  }
}

interface ManualNcmSearchProps {
  item: ManualItemDraft
  taxRegime: TaxRegime | null
  invalid: boolean
  describedBy?: string
  onChange: (code: string, diagnosis: NcmDiagnosis | null) => void
  onValidate: (code: string) => void
}

function ManualNcmSearch({
  item,
  taxRegime,
  invalid,
  describedBy,
  onChange,
  onValidate,
}: ManualNcmSearchProps) {
  const { query, setQuery, results, isLoading, error, select } = useNcmSearch(
    taxRegime,
    item.ncmCode,
  )
  const [isOpen, setIsOpen] = useState(false)
  const listboxId = `ncm-${item.id}-options`

  function chooseNcm(ncm: NcmDiagnosis) {
    select(ncm.code)
    onChange(ncm.code, ncm)
    onValidate(ncm.code)
    setIsOpen(false)
  }

  const combobox = useComboboxNavigation({
    items: results,
    getOptionId: (_ncm, index) => `${listboxId}-${index}`,
    onSelect: chooseNcm,
    onEscape: () => setIsOpen(false),
  })
  const showResults = isOpen && results.length > 0

  function handleChange(value: string) {
    setQuery(value)
    setIsOpen(true)
    const code = value.replace(/\D/g, '').slice(0, 8)
    onChange(code, null)
    if (/^\d{8}$/.test(value.trim())) onValidate(code)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
        <Input
          id={`ncm-${item.id}`}
          data-tour="simulation-ncm"
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setIsOpen(false)
            onValidate(query.replace(/\D/g, '').slice(0, 8))
          }}
          onKeyDown={(event) => {
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) setIsOpen(true)
            combobox.onKeyDown(event)
          }}
          placeholder="Código ou descrição do NCM"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showResults}
          aria-activedescendant={showResults ? combobox.activeOptionId : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="rounded-none border-[#27272a] bg-[#18181b] pl-9 font-numbers text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
        />
        {isLoading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a1a1aa]">
            Buscando...
          </span>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {isLoading
          ? 'Buscando NCMs.'
          : error
            ? error
            : `${results.length} ${results.length === 1 ? 'NCM encontrado' : 'NCMs encontrados'}.`}
      </span>

      {showResults && (
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-56 overflow-auto border border-[#27272a] bg-[#18181b]"
        >
          {results.map((ncm, index) => (
            <li key={ncm.code} role="none">
              <button
                id={`${listboxId}-${index}`}
                type="button"
                role="option"
                aria-selected={combobox.activeIndex === index}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => combobox.setActiveIndex(index)}
                onClick={() => chooseNcm(ncm)}
                className={cn(
                  'w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a]',
                  combobox.activeIndex === index && 'bg-[#27272a]',
                )}
              >
                <p className="text-sm text-[#fafafa]">{ncm.code}</p>
                <p className="text-xs text-[#a1a1aa]">{ncm.description}</p>
                <NcmStatus status={ncm.status} className="mt-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && query.trim().length > 0 && results.length === 0 && !error && (
        <p className="text-xs text-[#a1a1aa]">Nenhum NCM vigente encontrado.</p>
      )}
      {error && <p className="text-xs text-[#facc15]">{error}</p>}
      {item.diagnosis && <NcmStatus status={item.diagnosis.status} />}
    </div>
  )
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
  serverIssues = [],
  onClearServerIssues,
  onSubmit,
}: SimulationFormProps) {
  const [items, setItems] = useState<ItemDraft[]>([createEmptyItem()])
  const [validationErrors, setValidationErrors] = useState<
    Record<string, SimulationValidationError[]>
  >({})
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false)

  useEffect(() => {
    if (serverIssues.length === 0) return

    setItems((currentItems) => {
      const diagnosesByItem: Record<string, NcmDiagnosis> = {}
      const nextItems = currentItems.map((item, index) => {
        const issue = serverIssues.find((candidate) => candidate.itemIndex === index)
        if (!issue) return item
        const diagnosis: NcmDiagnosis = {
          code: issue.ncmCode,
          description: item.diagnosis?.description ?? null,
          status: serverReasonToStatus(issue.reason),
        }
        diagnosesByItem[item.id] = diagnosis
        return { ...item, diagnosis } as ItemDraft
      })
      const nextErrors = validateSimulationItems(nextItems.map(validatableItem), diagnosesByItem)
      setValidationErrors(nextErrors)
      focusFirstSimulationError(nextItems, nextErrors)
      return nextItems
    })
  }, [serverIssues])

  function clearItemErrors(id: string) {
    setValidationErrors((current) => {
      if (!current[id]) return current
      const next = { ...current }
      delete next[id]
      return next
    })
    onClearServerIssues?.()
  }

  function updateItem(id: string, patch: Partial<ItemDraft>) {
    clearItemErrors(id)
    setItems((current) =>
      current.map((item) => (item.id === id ? ({ ...item, ...patch } as ItemDraft) : item)),
    )
  }

  async function validateSingleNcm(id: string, code: string) {
    if (!/^\d{8}$/.test(code)) {
      const diagnosis: NcmDiagnosis = {
        code,
        description: null,
        status: 'INVALID_FORMAT',
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? ({ ...item, diagnosis } as ItemDraft) : item)),
      )
      setValidationErrors((current) => ({
        ...current,
        [id]: [{ field: 'ncm', message: 'NCM deve conter exatamente 8 dígitos.' }],
      }))
      return
    }

    if (!taxRegime) return
    let diagnosis: NcmDiagnosis
    try {
      ;[diagnosis] = await diagnoseNcms([code], taxRegime)
    } catch {
      diagnosis = unavailableDiagnosis(code)
    }

    setItems((currentItems) => {
      const activeItem = currentItems.find((item) => item.id === id)
      if (!activeItem || itemNcmCode(activeItem) !== code) return currentItems

      const diagnosedItem = { ...activeItem, diagnosis } as ItemDraft
      const itemErrors = validateSimulationItems([validatableItem(diagnosedItem)], {
        [id]: diagnosis,
      })[id]
      setValidationErrors((currentErrors) => {
        const next = { ...currentErrors }
        if (itemErrors) next[id] = itemErrors
        else delete next[id]
        return next
      })

      return currentItems.map((item) => (item.id === id ? diagnosedItem : item))
    })
  }

  function changeMode(id: string, mode: ItemDraft['mode']) {
    clearItemErrors(id)
    setItems((currentItems) => {
      const current = currentItems.find((item) => item.id === id)
      const quantity = current?.quantity ?? '1'
      return currentItems.map((item) => {
        if (item.id !== id) return item
        if (mode === 'catalog') {
          return {
            id,
            mode,
            productId: null,
            product: null,
            quantity,
            diagnosis: null,
          }
        }
        return { id, mode, ncmCode: '', unitPrice: '', quantity, diagnosis: null }
      })
    })
  }

  function removeItem(id: string) {
    clearItemErrors(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function addItem() {
    const lastMode = items[items.length - 1]?.mode ?? 'catalog'
    setItems((current) => [...current, createEmptyItem(lastMode)])
  }

  function clearAll() {
    setItems([createEmptyItem()])
    setValidationErrors({})
    onClearServerIssues?.()
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCheckingEligibility(true)
    onClearServerIssues?.()

    const eligibleForDiagnosis = items.filter((item) => /^\d{8}$/.test(itemNcmCode(item)))
    const diagnosesByItem: Record<string, NcmDiagnosis> = {}

    if (eligibleForDiagnosis.length > 0 && taxRegime) {
      try {
        const diagnoses = await diagnoseNcms(eligibleForDiagnosis.map(itemNcmCode), taxRegime)
        eligibleForDiagnosis.forEach((item, index) => {
          diagnosesByItem[item.id] = diagnoses[index] ?? unavailableDiagnosis(itemNcmCode(item))
        })
      } catch {
        eligibleForDiagnosis.forEach((item) => {
          diagnosesByItem[item.id] = unavailableDiagnosis(itemNcmCode(item))
        })
      }
    }

    const nextItems = items.map((item) =>
      diagnosesByItem[item.id]
        ? ({ ...item, diagnosis: diagnosesByItem[item.id] } as ItemDraft)
        : item,
    )
    const nextErrors = validateSimulationItems(nextItems.map(validatableItem), diagnosesByItem)
    setItems(nextItems)
    setValidationErrors(nextErrors)
    setIsCheckingEligibility(false)

    if (Object.keys(nextErrors).length > 0 || nextItems.length === 0) {
      focusFirstSimulationError(nextItems, nextErrors)
      return
    }
    await onSubmit(nextItems.map(mapToSimulationItem))
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

  const invalidItemCount = Object.keys(validationErrors).length

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ willChange: 'transform, opacity' }}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting || isCheckingEligibility}
      className="rounded-none border border-[#27272a] bg-[#18181b] p-5"
    >
      <AsyncStatus
        message={
          isCheckingEligibility
            ? 'Verificando a elegibilidade dos NCMs.'
            : isSubmitting
              ? 'Enviando itens para a calculadora tributária.'
              : ''
        }
      />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#34d399]/10 text-[#34d399]">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[#fafafa]">Parâmetros de Simulação</h2>
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

      {invalidItemCount > 0 && (
        <div
          role="alert"
          tabIndex={-1}
          className="mb-4 border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-sm text-[#f87171]"
        >
          {invalidItemCount === 1
            ? '1 item precisa de correção antes da simulação.'
            : `${invalidItemCount} itens precisam de correção antes da simulação.`}
          <ul className="mt-1 list-disc pl-5">
            {items.flatMap((item, index) =>
              (validationErrors[item.id] ?? []).map((error) => (
                <li key={`${item.id}-${error.field}-${error.message}`}>
                  <a href={`#${simulationFieldId(item, error.field)}`}>
                    Item {index + 1}: {error.message}
                  </a>
                </li>
              )),
            )}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => {
          const errors = validationErrors[item.id] ?? []
          const hasError = (field: SimulationValidationError['field']) =>
            errors.some((error) => error.field === field)
          const errorsFor = (field: SimulationValidationError['field']) =>
            errors.filter((error) => error.field === field)
          const describedBy = (field: SimulationValidationError['field']) =>
            errorsFor(field).length > 0 ? `${simulationFieldId(item, field)}-error` : undefined

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className={cn(
                'rounded-none border bg-[#09090b] p-4',
                errors.length > 0 ? 'border-[#f87171]/60' : 'border-[#27272a]',
              )}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#a1a1aa]">Item {index + 1}</span>
                  <div
                    role="group"
                    aria-label={`Modo do item ${index + 1}`}
                    className="flex items-center border border-[#27272a]"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-pressed={item.mode === 'catalog'}
                      onClick={() => changeMode(item.id, 'catalog')}
                      className={cn(
                        'h-7 rounded-none px-3 text-xs',
                        item.mode === 'catalog'
                          ? 'bg-[#27272a] text-[#fafafa] hover:bg-[#27272a]'
                          : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]',
                      )}
                    >
                      Produto do catálogo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-tour="simulation-manual-mode"
                      aria-pressed={item.mode === 'manual'}
                      onClick={() => changeMode(item.id, 'manual')}
                      className={cn(
                        'h-7 rounded-none px-3 text-xs',
                        item.mode === 'manual'
                          ? 'bg-[#27272a] text-[#fafafa] hover:bg-[#27272a]'
                          : 'text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]',
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
                    <Label
                      htmlFor={`product-${item.id}`}
                      className="mb-2 block text-xs text-[#a1a1aa]"
                    >
                      Produto
                    </Label>
                    <ProductSearch
                      inputId={`product-${item.id}`}
                      taxRegime={taxRegime}
                      selectedProduct={item.product}
                      selectedDiagnosis={item.diagnosis}
                      invalid={hasError('product')}
                      describedBy={describedBy('product')}
                      onSelect={(product, diagnosis) => {
                        updateItem(item.id, {
                          product,
                          productId: product?.id ?? null,
                          diagnosis,
                        })
                        if (product) void validateSingleNcm(item.id, product.ncmCode)
                      }}
                    />
                    {errorsFor('product').map((error) => (
                      <p
                        key={error.message}
                        id={`product-${item.id}-error`}
                        className="mt-2 text-xs text-[#f87171]"
                      >
                        {error.message}
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`ncm-${item.id}`} className="text-xs text-[#a1a1aa]">
                        Código NCM
                      </Label>
                      <ManualNcmSearch
                        item={item}
                        taxRegime={taxRegime}
                        invalid={hasError('ncm')}
                        describedBy={describedBy('ncm')}
                        onChange={(ncmCode, diagnosis) =>
                          updateItem(item.id, { ncmCode, diagnosis })
                        }
                        onValidate={(code) => void validateSingleNcm(item.id, code)}
                      />
                      {errorsFor('ncm').map((error) => (
                        <p
                          key={error.message}
                          id={`ncm-${item.id}-error`}
                          className="text-xs text-[#f87171]"
                        >
                          {error.message}
                        </p>
                      ))}
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
                        aria-invalid={hasError('unitPrice') || undefined}
                        aria-describedby={describedBy('unitPrice')}
                        className="rounded-none border-[#27272a] bg-[#18181b] font-numbers text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                      />
                      {errorsFor('unitPrice').map((error) => (
                        <p
                          key={error.message}
                          id={`price-${item.id}-error`}
                          className="text-xs text-[#f87171]"
                        >
                          {error.message}
                        </p>
                      ))}
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
                    aria-invalid={hasError('quantity') || undefined}
                    aria-describedby={describedBy('quantity')}
                    className="rounded-none border-[#27272a] bg-[#18181b] font-numbers text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
                  />
                  {errorsFor('quantity').map((error) => (
                    <p
                      key={error.message}
                      id={`qty-${item.id}-error`}
                      className="text-xs text-[#f87171]"
                    >
                      {error.message}
                    </p>
                  ))}
                </div>

                {item.mode === 'catalog' && item.product && (
                  <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                    <span className="font-numbers text-[#a1a1aa]">
                      {formatCurrency(item.product.unitPrice)}
                    </span>
                    <span>por unidade</span>
                  </div>
                )}
              </div>

            </motion.div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
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
            type="button"
            variant="ghost"
            onClick={clearAll}
            className="w-fit gap-2 rounded-none px-4 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar tudo
          </Button>
        </div>

        <Button
          type="submit"
          data-tour="simulation-submit"
          disabled={isSubmitting || isCheckingEligibility}
          className={cn(
            'rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f]',
            (isSubmitting || isCheckingEligibility) &&
              'cursor-not-allowed opacity-60 hover:translate-y-0',
          )}
        >
          {isCheckingEligibility
            ? 'Validando itens...'
            : isSubmitting
              ? 'Calculando...'
              : 'Calcular simulação'}
        </Button>
      </div>
    </motion.form>
  )
}
