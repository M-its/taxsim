'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { createProduct, deleteProduct, getProducts, updateProduct, searchNcm } from '@/lib/api'
import type { NcmResult } from '@/lib/api'
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
  selectedNcm: NcmResult | null
  onSelect: (ncm: NcmResult | null) => void
  onSuggestName?: (ncm: NcmResult) => void
}

function NcmSearch({ selectedNcm, onSelect, onSuggestName }: NcmSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NcmResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = query.trim()
      if (!q) {
        setResults([])
        return
      }
      setIsLoading(true)
      searchNcm(q)
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  if (selectedNcm) {
    return (
      <div className="space-y-1 border border-[#27272a] bg-[#09090b] p-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-[#fafafa]">{selectedNcm.code}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(null)
              setQuery('')
            }}
            className="h-auto rounded-none px-2 py-1 text-xs text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa]"
          >
            Trocar
          </Button>
        </div>
        {selectedNcm.description && (
          <p className="text-xs text-[#71717a]">{selectedNcm.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71717a]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por código ou descrição do NCM..."
          className="rounded-none border-[#27272a] bg-[#09090b] pl-9 text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
        />
        {isLoading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717a]">
            Buscando...
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul className="max-h-48 overflow-auto border border-[#27272a] bg-[#09090b]">
          {results.map((ncm) => (
            <li key={ncm.code}>
              <button
                type="button"
                onClick={() => {
                  onSelect(ncm)
                  onSuggestName?.(ncm)
                  setQuery('')
                  setResults([])
                }}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-[#27272a]"
              >
                <p className="text-sm text-[#fafafa]">{ncm.code}</p>
                <p className="text-xs text-[#71717a]">{ncm.description}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && query.trim().length > 0 && results.length === 0 && (
        <p className="text-xs text-[#71717a]">Nenhum NCM encontrado.</p>
      )}
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
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function ProductModal({ product, open, onOpenChange, onSuccess }: ProductModalProps) {
  const isEditing = Boolean(product)
  const [values, setValues] = useState<ProductInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedNcm, setSelectedNcm] = useState<NcmResult | null>(null)
  const [isNcmLoading, setIsNcmLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setApiError(null)
      setErrors({})
      setSelectedNcm(null)
      setIsNcmLoading(false)
      if (product) {
        setValues({
          name: product.name,
          sku: product.sku,
          ncmCode: product.ncmCode,
          unitPrice: product.unitPrice,
        })
        setSelectedNcm({ code: product.ncmCode, description: '' })

        if (product.ncmCode) {
          setIsNcmLoading(true)
          searchNcm(product.ncmCode)
            .then((results) => {
              const match = results.find((n) => n.code === product.ncmCode)
              setSelectedNcm((current) =>
                current?.code === product.ncmCode
                  ? { code: product.ncmCode, description: match?.description ?? '' }
                  : current,
              )
            })
            .catch(() => {
              setSelectedNcm((current) =>
                current?.code === product.ncmCode
                  ? { code: product.ncmCode, description: '' }
                  : current,
              )
            })
            .finally(() => setIsNcmLoading(false))
        }
      } else {
        setValues(emptyForm)
      }
    }
  }, [open, product])

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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="rounded-none border border-[#27272a] bg-[#18181b] p-0 text-[#fafafa] sm:max-w-md"
      >
        <form onSubmit={handleSubmit}>
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
            {apiError && (
              <p className="rounded-none border border-[#f87171]/30 bg-[#f87171]/10 p-2 text-xs text-[#f87171]">
                {apiError}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs text-[#a1a1aa]">
                Nome
              </Label>
              <Input
                id="name"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Ex: Notebook Dell"
                variant={errors.name ? 'error' : 'default'}
              />
              {errors.name && <p className="text-xs text-[#f87171]">{errors.name}</p>}
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
              />
              {errors.sku && <p className="text-xs text-[#f87171]">{errors.sku}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncmCode" className="text-xs text-[#a1a1aa]">
                Código NCM
              </Label>
              {isNcmLoading && <p className="text-xs text-[#71717a]">Carregando NCM...</p>}
              <NcmSearch
                selectedNcm={selectedNcm}
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
              {errors.ncmCode && <p className="text-xs text-[#f87171]">{errors.ncmCode}</p>}
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
                className="font-numbers"
              />
              {errors.unitPrice && <p className="text-xs text-[#f87171]">{errors.unitPrice}</p>}
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
              className="rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f] disabled:translate-y-0"
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
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<ProductListResponse['pagination'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
          })
          .catch((error) => {
            setProducts([])
            setPagination(null)
            setListError(error instanceof Error ? error.message : 'Erro ao carregar produtos.')
          })
          .finally(() => setIsLoading(false))
      },
      query.immediate ? 0 : 300,
    )

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current) {
        clearTimeout(confirmationTimerRef.current)
      }
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearchInput(value)
    setQuery({ search: value, page: 1, immediate: false })
  }

  function handlePageChange(nextPage: number) {
    setQuery((current) => ({ ...current, page: nextPage, immediate: true }))
  }

  function refreshList() {
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
      performDelete(product.id)
      return
    }

    setConfirmingDeleteId(product.id)

    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current)
    }

    confirmationTimerRef.current = setTimeout(() => {
      setConfirmingDeleteId((current) => (current === product.id ? null : current))
    }, 2000)
  }

  async function performDelete(id: string) {
    if (confirmationTimerRef.current) {
      clearTimeout(confirmationTimerRef.current)
    }
    setConfirmingDeleteId(null)
    setIsDeletingId(id)
    try {
      await deleteProduct(id)
      if (products.length === 1 && pagination && pagination.page > 1) {
        handlePageChange(pagination.page - 1)
      } else {
        refreshList()
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
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-fit gap-2 rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1f2a1f]"
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
      >
        <div className="mb-4">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Buscar por nome ou SKU..."
            startIcon={<Search className="h-4 w-4 text-[#71717a]" />}
            className="rounded-none border-[#27272a] bg-[#09090b] text-[#fafafa] placeholder:text-[#71717a] focus-visible:border-[#34d399] focus-visible:ring-[#34d399]/20"
          />
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
                    <p className="mt-1 text-xs text-[#71717a]">
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
                      <span
                        className={
                          /^\d{8}$/.test(product.ncmCode) ? 'text-[#a1a1aa]' : 'text-[#facc15]'
                        }
                      >
                        {product.ncmCode}
                      </span>
                      {!/^\d{8}$/.test(product.ncmCode) && (
                        <span className="ml-1 text-xs text-[#facc15]">⚠ inválido</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-numbers text-sm text-[#fafafa]">
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(product)}
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
        product={editingProduct}
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        onSuccess={refreshList}
      />
    </div>
  )
}
