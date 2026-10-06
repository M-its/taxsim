'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncStatus } from '@/components/ui/async-status'
import { NcmStatus } from '@/components/ncm/ncm-status'
import { useAuth } from '@/components/auth/auth-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createProduct, deleteProduct, getProducts, updateProduct } from '@/lib/api'
import type { NcmDiagnosis, NcmResult } from '@/lib/api'
import type { TaxRegime } from '@/lib/auth.types'
import { useComboboxNavigation } from '@/hooks/use-combobox-navigation'
import { useNcmSearch } from '@/hooks/use-ncm-search'
import { formatCurrency } from '@/lib/formatters'
import type { Product, ProductInput, ProductListResponse } from '@/lib/product.types'

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

const emptyForm: ProductInput = {
  name: '',
  sku: '',
  ncmCode: '',
  unitPrice: '0.00',
}

type FieldErrors = Partial<Record<keyof ProductInput, string>>

type ProductQuery = {
  search: string
  page: number
  immediate: boolean
}

interface NcmSearchProps {
  taxRegime: TaxRegime | null
  selectedNcm: NcmDiagnosis | null
  invalid?: boolean
  describedBy?: string
  onSelect: (ncm: NcmDiagnosis | null) => void
  onSuggestName?: (ncm: NcmResult) => void
}

function NcmSearch({
  taxRegime,
  selectedNcm,
  invalid,
  describedBy,
  onSelect,
  onSuggestName,
}: NcmSearchProps) {
  const { query, setQuery, results, isLoading, error, clear } = useNcmSearch(taxRegime)
  const [isOpen, setIsOpen] = useState(false)
  const listboxId = 'product-ncm-options'

  function chooseNcm(ncm: NcmResult) {
    onSelect(ncm)
    onSuggestName?.(ncm)
    clear()
    setIsOpen(false)
  }

  const combobox = useComboboxNavigation({
    items: results,
    getOptionId: (_ncm, index) => `${listboxId}-${index}`,
    onSelect: chooseNcm,
    onEscape: () => setIsOpen(false),
  })
  const showResults = isOpen && results.length > 0

  if (selectedNcm) {
    return (
      <div className="space-y-1 border border-[#27272a] bg-[#09090b] p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[#fafafa]">{selectedNcm.code}</p>
          <Button
            id="ncmCode"
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null)
              clear()
              setIsOpen(true)
            }}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className="h-auto rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            Trocar
          </Button>
        </div>
        {selectedNcm.description && (
          <p className="text-xs text-[#a1a1aa]">{selectedNcm.description}</p>
        )}
        <NcmStatus status={selectedNcm.status} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
        <Input
          id="ncmCode"
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
          placeholder="Buscar por código ou descrição do NCM..."
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
          ? 'Buscando NCMs.'
          : error
            ? error
            : `${results.length} ${results.length === 1 ? 'NCM encontrado' : 'NCMs encontrados'}.`}
      </span>

      {showResults && (
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-48 overflow-auto border border-[#27272a] bg-[#09090b]"
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
                className={`w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a] ${
                  combobox.activeIndex === index ? 'bg-[#27272a]' : ''
                }`}
              >
                <p className="text-sm text-[#fafafa]">{ncm.code}</p>
                <p className="text-xs text-[#a1a1aa]">{ncm.description}</p>
                <NcmStatus status={ncm.status} className="mt-1" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && query.trim().length > 0 && results.length === 0 && (
        <p className="text-xs text-[#a1a1aa]">Nenhum NCM encontrado.</p>
      )}
      {error && <p className="text-xs text-[#facc15]">{error}</p>}
    </div>
  )
}

function validateProduct(values: ProductInput): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Nome é obrigatório'
  }

  if (!values.sku.trim()) {
    errors.sku = 'SKU é obrigatório'
  }

  if (!values.ncmCode.trim()) {
    errors.ncmCode = 'NCM é obrigatório'
  } else if (!/^\d{8}$/.test(values.ncmCode)) {
    errors.ncmCode = 'NCM deve conter exatamente 8 dígitos'
  }

  if (!values.unitPrice || parseFloat(values.unitPrice) <= 0) {
    errors.unitPrice = 'Preço unitário deve ser maior que zero'
  }

  return errors
}

interface ProductModalProps {
  taxRegime: TaxRegime | null
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function ProductModal({ taxRegime, product, open, onOpenChange, onSuccess }: ProductModalProps) {
  const isEditing = Boolean(product)
  const [values, setValues] = useState<ProductInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedNcm, setSelectedNcm] = useState<NcmDiagnosis | null>(null)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setApiError(null)
      setErrors({})
      setSelectedNcm(null)
      if (product) {
        setValues({
          name: product.name,
          sku: product.sku,
          ncmCode: product.ncmCode,
          unitPrice: product.unitPrice,
        })
        setSelectedNcm({
          code: product.ncmCode,
          description: product.ncmDescription,
          status: product.ncmStatus,
        })
      } else {
        setValues(emptyForm)
      }
    }
  }, [open, product, taxRegime])

  function updateField<K extends keyof ProductInput>(field: K, value: ProductInput[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    const validationErrors = validateProduct(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstInvalid = (['name', 'sku', 'ncmCode', 'unitPrice'] as const).find(
        (field) => validationErrors[field],
      )
      if (firstInvalid) {
        requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus())
      }
      return
    }

    setIsSubmitting(true)
    try {
      if (product) {
        await updateProduct(product.id, values)
      } else {
        await createProduct(values)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error) {
        setApiError(error.message)
      } else {
        setApiError('Ocorreu um erro inesperado. Tente novamente.')
      }
      requestAnimationFrame(() => errorSummaryRef.current?.focus())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={nameInputRef}
        showCloseButton={false}
        className="rounded-none border border-[#27272a] bg-[#18181b] p-0 text-[#fafafa] sm:max-w-md"
      >
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <AsyncStatus message={isSubmitting ? 'Salvando produto.' : ''} />
          <DialogHeader className="border-b border-[#27272a] p-4">
            <DialogTitle className="text-sm font-medium text-[#fafafa]">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a1a1aa]">
              {isEditing
                ? 'Atualize os dados do produto selecionado.'
                : 'Preencha os dados para cadastrar um novo produto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-4">
            {(apiError || Object.keys(errors).length > 0) && (
              <div
                ref={errorSummaryRef}
                tabIndex={-1}
                role="alert"
                className="rounded-none border border-[#f87171]/30 bg-[#f87171]/10 p-3 text-xs text-[#f87171] outline-none focus:ring-2 focus:ring-[#fca5a5]"
              >
                <p className="font-medium">Revise os campos do produto:</p>
                <ul className="mt-1 list-disc pl-5">
                  {apiError && <li>{apiError}</li>}
                  {(['name', 'sku', 'ncmCode', 'unitPrice'] as const).map((field) =>
                    errors[field] ? (
                      <li key={field}>
                        <a href={`#${field}`}>{errors[field]}</a>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-[#a1a1aa]">
                Nome
              </Label>
              <Input
                id="name"
                ref={nameInputRef}
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Ex: Notebook Dell"
                variant={errors.name ? 'error' : 'default'}
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-xs text-[#f87171]">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-xs text-[#a1a1aa]">
                SKU
              </Label>
              <Input
                id="sku"
                value={values.sku}
                onChange={(event) => updateField('sku', event.target.value)}
                placeholder="Ex: NB-DELL-001"
                variant={errors.sku ? 'error' : 'default'}
                aria-invalid={Boolean(errors.sku) || undefined}
                aria-describedby={errors.sku ? 'sku-error' : undefined}
              />
              {errors.sku && (
                <p id="sku-error" className="text-xs text-[#f87171]">
                  {errors.sku}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncmCode" className="text-xs text-[#a1a1aa]">
                Código NCM
              </Label>
              <NcmSearch
                taxRegime={taxRegime}
                selectedNcm={selectedNcm}
                invalid={Boolean(errors.ncmCode)}
                describedBy={errors.ncmCode ? 'ncmCode-error' : undefined}
                onSelect={(ncm) => {
                  setSelectedNcm(ncm)
                  updateField('ncmCode', ncm?.code ?? '')
                }}
                onSuggestName={(ncm) => {
                  if (!values.name.trim()) {
                    const suggestion = ncm.description.slice(0, 80).trim()
                    updateField('name', suggestion)
                  }
                }}
              />
              {errors.ncmCode && (
                <p id="ncmCode-error" className="text-xs text-[#f87171]">
                  {errors.ncmCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice" className="text-xs text-[#a1a1aa]">
                Preço Unitário
              </Label>
              <Input
                id="unitPrice"
                value={formatCurrencyInput(values.unitPrice)}
                onChange={(event) => updateField('unitPrice', currencyToRaw(event.target.value))}
                inputMode="decimal"
                variant={errors.unitPrice ? 'error' : 'default'}
                aria-invalid={Boolean(errors.unitPrice) || undefined}
                aria-describedby={errors.unitPrice ? 'unitPrice-error' : undefined}
                className="font-numbers"
              />
              {errors.unitPrice && (
                <p id="unitPrice-error" className="text-xs text-[#f87171]">
                  {errors.unitPrice}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-[#27272a] bg-[#18181b] p-4 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-none border border-[#27272a] bg-transparent px-4 py-2 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-colors duration-150 hover:bg-[#1f2a1f]"
            >
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const { company } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<ProductListResponse['pagination'] | null>(null)
  const [ncmCatalogVersion, setNcmCatalogVersion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const afterLoadMessageRef = useRef<string | null>(null)

  const [query, setQuery] = useState<ProductQuery>({
    search: '',
    page: 1,
    immediate: false,
  })

  useEffect(() => {
    setIsLoading(true)
    setListError(null)

    const timer = setTimeout(
      () => {
        getProducts(query.search.trim() || undefined, query.page)
          .then((response) => {
            setProducts(response.data)
            setPagination(response.pagination)
            setNcmCatalogVersion(response.metadata.ncmCatalogVersion)
            setStatusMessage(
              afterLoadMessageRef.current ??
                `${response.data.length} ${response.data.length === 1 ? 'produto carregado' : 'produtos carregados'}.`,
            )
            afterLoadMessageRef.current = null
          })
          .catch((error) => {
            setProducts([])
            setPagination(null)
            setNcmCatalogVersion(null)
            setListError(error instanceof Error ? error.message : 'Erro ao carregar produtos.')
          })
          .finally(() => setIsLoading(false))
      },
      query.immediate ? 0 : 300,
    )

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!confirmingDeleteId) return

    function cancelOnOutsideClick(event: PointerEvent) {
      const target = event.target
      if (target instanceof Element && target.closest(`[data-delete-id="${confirmingDeleteId}"]`)) {
        return
      }
      setConfirmingDeleteId(null)
      setStatusMessage('Exclusão de produto cancelada.')
    }

    document.addEventListener('pointerdown', cancelOnOutsideClick)
    return () => document.removeEventListener('pointerdown', cancelOnOutsideClick)
  }, [confirmingDeleteId])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setQuery({ search: value, page: 1, immediate: false })
  }

  function handlePageChange(nextPage: number) {
    setQuery((current) => ({ ...current, page: nextPage, immediate: true }))
  }

  function refreshList(completionMessage?: string) {
    afterLoadMessageRef.current = completionMessage ?? null
    setQuery((current) => ({ ...current, immediate: true }))
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  function handleOpenCreate() {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  function handleCloseModal(open: boolean) {
    if (!open) {
      setEditingProduct(null)
    }
    setIsModalOpen(open)
  }

  function handleDeleteClick(product: Product) {
    if (confirmingDeleteId === product.id) {
      performDelete(product)
      return
    }

    setConfirmingDeleteId(product.id)
    setStatusMessage(`Confirme a exclusão do produto ${product.name}.`)
  }

  async function performDelete(product: Product) {
    setConfirmingDeleteId(null)
    setIsDeletingId(product.id)
    try {
      await deleteProduct(product.id)
      if (products.length === 1 && pagination && pagination.page > 1) {
        afterLoadMessageRef.current = `Produto ${product.name} excluído.`
        handlePageChange(pagination.page - 1)
      } else {
        refreshList(`Produto ${product.name} excluído.`)
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Erro ao excluir produto.')
    } finally {
      setIsDeletingId(null)
    }
  }

  function handlePreviousPage() {
    handlePageChange(Math.max(1, query.page - 1))
  }

  function handleNextPage() {
    if (pagination && query.page < pagination.totalPages) {
      handlePageChange(query.page + 1)
    }
  }

  return (
    <div data-tour="products" className="space-y-4">
      <AsyncStatus message={isLoading ? 'Carregando produtos.' : statusMessage} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ willChange: 'transform, opacity' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-[#fafafa]">Produtos</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">
            Gerencie o catálogo de produtos e suas informações tributárias.
          </p>
          {ncmCatalogVersion && (
            <p className="mt-1 text-xs text-[#a1a1aa]">
              Catálogo NCM: versão {ncmCatalogVersion.split('-').reverse().join('/')}
            </p>
          )}
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-fit gap-2 rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-colors duration-150 hover:bg-[#1f2a1f]"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        style={{ willChange: 'transform, opacity' }}
        className="rounded-none border border-[#27272a] bg-[#18181b] p-5"
        aria-busy={isLoading}
      >
        <div className="mb-4">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar por nome ou SKU..."
            startIcon={<Search className="h-4 w-4 text-[#a1a1aa]" />}
            className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#a1a1aa] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
        </div>

        {listError && (
          <div
            role="alert"
            className="mb-4 rounded-none border border-[#f87171]/30 bg-[#f87171]/10 p-3 text-xs text-[#f87171]"
          >
            {listError}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] hover:bg-transparent">
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Nome</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">SKU</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">NCM</TableHead>
                <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">
                  Preço Unitário
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
                    <TableCell colSpan={5} className="p-4">
                      <div className="h-6 animate-pulse bg-[#27272a]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow className="border-[#27272a] hover:bg-transparent">
                  <TableCell colSpan={5} className="py-12 text-center">
                    <p className="text-sm text-[#a1a1aa]">Nenhum produto encontrado.</p>
                    <p className="mt-1 text-xs text-[#a1a1aa]">
                      Cadastre um novo produto ou ajuste os filtros de busca.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                    style={{ willChange: 'transform, opacity' }}
                    className="border-b border-[#27272a] transition-colors last:border-b-0 hover:bg-[#27272a]/30"
                  >
                    <TableCell className="text-sm text-[#fafafa]">{product.name}</TableCell>
                    <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-numbers text-sm">
                      <span className="text-[#a1a1aa]">{product.ncmCode}</span>
                      <NcmStatus status={product.ncmStatus} className="mt-1 font-sans" />
                    </TableCell>
                    <TableCell className="text-right font-numbers text-sm text-[#fafafa]">
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        data-delete-id={product.id}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(product)}
                          title="Editar"
                          className="h-7 w-7 rounded-none text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isDeletingId === product.id}
                          onClick={() => handleDeleteClick(product)}
                          title={
                            confirmingDeleteId === product.id || isDeletingId === product.id
                              ? undefined
                              : 'Excluir'
                          }
                          aria-label={
                            confirmingDeleteId === product.id
                              ? `Confirmar exclusão do produto ${product.name}`
                              : `Excluir produto ${product.name}`
                          }
                          className="rounded-none border border-transparent px-2 text-xs text-[#f87171] hover:border-[#f87171]/20 hover:bg-[#f87171]/10 hover:text-[#f87171] disabled:opacity-50"
                        >
                          {confirmingDeleteId === product.id ? (
                            'Confirmar?'
                          ) : isDeletingId === product.id ? (
                            'Excluindo...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </>
                          )}
                        </Button>
                        {confirmingDeleteId === product.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmingDeleteId(null)
                              setStatusMessage('Exclusão de produto cancelada.')
                            }}
                            className="rounded-none px-2 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
                          >
                            Cancelar
                          </Button>
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
            <p className="text-xs text-[#a1a1aa]">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePreviousPage}
                disabled={query.page === 1}
                className="rounded-none border border-[#27272a] bg-transparent px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] disabled:opacity-50"
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleNextPage}
                disabled={query.page === pagination.totalPages}
                className="rounded-none border border-[#27272a] bg-transparent px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] disabled:opacity-50"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      <ProductModal
        taxRegime={company?.taxRegime ?? null}
        product={editingProduct}
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        onSuccess={() =>
          refreshList(
            editingProduct ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.',
          )
        }
      />
    </div>
  )
}
