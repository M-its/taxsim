'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncStatus } from '@/components/ui/async-status'
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
import { createClient, deleteClient, getClients, updateClient } from '@/lib/api'
import type { Client, ClientInput, ClientListResponse } from '@/lib/client.types'
import {
  formatDocument,
  publicDocumentErrorMessage,
  sanitizeDocumentInput,
  validateBrazilianDocument,
} from '@/lib/br-document'

const emptyForm: ClientInput = {
  name: '',
  document: '',
  email: '',
}

type FieldErrors = Partial<Record<keyof ClientInput, string>>

type ClientQuery = {
  search: string
  page: number
  immediate: boolean
}

function validateClient(values: ClientInput, existingDocument?: string): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Nome é obrigatório'
  }

  const document = sanitizeDocumentInput(values.document)
  if (!document) {
    errors.document = 'Documento é obrigatório'
  } else if (document !== existingDocument) {
    const validation = validateBrazilianDocument(document)
    if (!validation.valid) {
      errors.document = publicDocumentErrorMessage(validation.kind)
    }
  }

  if (values.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email.trim())) {
      errors.email = 'E-mail inválido'
    }
  }

  return errors
}

interface ClientModalProps {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function ClientModal({ client, open, onOpenChange, onSuccess }: ClientModalProps) {
  const isEditing = Boolean(client)
  const [values, setValues] = useState<ClientInput>(emptyForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setApiError(null)
      setErrors({})
      if (client) {
        setValues({
          name: client.name,
          document: client.document,
          email: client.email ?? '',
        })
      } else {
        setValues(emptyForm)
      }
    }
  }, [open, client])

  function updateField<K extends keyof ClientInput>(field: K, value: ClientInput[K]) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    const validationErrors = validateClient(values, client?.document)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstInvalid = (['name', 'document', 'email'] as const).find(
        (field) => validationErrors[field],
      )
      if (firstInvalid) {
        requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus())
      }
      return
    }

    const payload = {
      ...values,
      document: sanitizeDocumentInput(values.document),
      email: values.email.trim() || undefined,
    }

    setIsSubmitting(true)
    try {
      if (client) {
        await updateClient(client.id, payload as ClientInput)
      } else {
        await createClient(payload as ClientInput)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ocorreu um erro inesperado. Tente novamente.'
      if (/^(CNPJ|CPF) inválido$/i.test(message)) {
        setErrors((current) => ({ ...current, document: message }))
        requestAnimationFrame(() => document.getElementById('document')?.focus())
      } else {
        setApiError(message)
        requestAnimationFrame(() => errorSummaryRef.current?.focus())
      }
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
          <AsyncStatus message={isSubmitting ? 'Salvando cliente.' : ''} />
          <DialogHeader className="border-b border-[#27272a] p-4">
            <DialogTitle className="text-sm font-medium text-[#fafafa]">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#a1a1aa]">
              {isEditing
                ? 'Atualize os dados do cliente selecionado.'
                : 'Preencha os dados para cadastrar um novo cliente.'}
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
                <p className="font-medium">Revise os campos do cliente:</p>
                <ul className="mt-1 list-disc pl-5">
                  {apiError && <li>{apiError}</li>}
                  {(['name', 'document', 'email'] as const).map((field) =>
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
                placeholder="Ex: Cliente Exemplo"
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
              <Label htmlFor="document" className="text-xs text-[#a1a1aa]">
                Documento
              </Label>
              <Input
                id="document"
                value={formatDocument(values.document)}
                onChange={(event) =>
                  updateField('document', sanitizeDocumentInput(event.target.value))
                }
                placeholder="CPF ou CNPJ"
                inputMode="text"
                maxLength={18}
                autoCapitalize="characters"
                spellCheck={false}
                variant={errors.document ? 'error' : 'default'}
                aria-invalid={Boolean(errors.document) || undefined}
                aria-describedby={errors.document ? 'document-error' : undefined}
                className="font-numbers"
              />
              {errors.document && (
                <p id="document-error" className="text-xs text-[#f87171]">
                  {errors.document}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-[#a1a1aa]">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="cliente@email.com"
                variant={errors.email ? 'error' : 'default'}
                aria-invalid={Boolean(errors.email) || undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-[#f87171]">
                  {errors.email}
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

export default function CustomersPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [pagination, setPagination] = useState<ClientListResponse['pagination'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const afterLoadMessageRef = useRef<string | null>(null)

  const [query, setQuery] = useState<ClientQuery>({
    search: '',
    page: 1,
    immediate: false,
  })

  useEffect(() => {
    setIsLoading(true)
    setListError(null)

    const timer = setTimeout(
      () => {
        getClients(query.search.trim() || undefined, query.page)
          .then((response) => {
            setClients(response.data)
            setPagination(response.pagination)
            setStatusMessage(
              afterLoadMessageRef.current ??
                `${response.data.length} ${response.data.length === 1 ? 'cliente carregado' : 'clientes carregados'}.`,
            )
            afterLoadMessageRef.current = null
          })
          .catch((error) => {
            setClients([])
            setPagination(null)
            setListError(error instanceof Error ? error.message : 'Erro ao carregar clientes.')
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
      setStatusMessage('Exclusão de cliente cancelada.')
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

  function handleEdit(client: Client) {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  function handleOpenCreate() {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  function handleCloseModal(open: boolean) {
    if (!open) {
      setEditingClient(null)
    }
    setIsModalOpen(open)
  }

  function handleDeleteClick(client: Client) {
    if (confirmingDeleteId === client.id) {
      performDelete(client)
      return
    }

    setConfirmingDeleteId(client.id)
    setStatusMessage(`Confirme a exclusão do cliente ${client.name}.`)
  }

  async function performDelete(client: Client) {
    setConfirmingDeleteId(null)
    setIsDeletingId(client.id)
    try {
      await deleteClient(client.id)
      if (clients.length === 1 && pagination && pagination.page > 1) {
        afterLoadMessageRef.current = `Cliente ${client.name} excluído.`
        handlePageChange(pagination.page - 1)
      } else {
        refreshList(`Cliente ${client.name} excluído.`)
      }
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Erro ao excluir cliente.')
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
    <div className="space-y-4">
      <AsyncStatus message={isLoading ? 'Carregando clientes.' : statusMessage} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ willChange: 'transform, opacity' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-xl font-semibold text-[#fafafa]">Clientes</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">Cadastro de clientes e fornecedores.</p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="w-fit gap-2 rounded-none border border-transparent bg-[#1a1a1a] px-5 py-2 text-sm font-medium text-[#fafafa] transition-colors duration-150 hover:bg-[#1f2a1f]"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
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
            placeholder="Buscar por nome ou documento..."
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
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Documento</TableHead>
                <TableHead className="text-xs font-medium text-[#a1a1aa]">Email</TableHead>
                <TableHead className="text-right text-xs font-medium text-[#a1a1aa]">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-[#27272a]">
                    <TableCell colSpan={4} className="p-4">
                      <div className="h-6 animate-pulse bg-[#27272a]" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow className="border-[#27272a] hover:bg-transparent">
                  <TableCell colSpan={4} className="py-12 text-center">
                    <p className="text-sm text-[#a1a1aa]">Nenhum cliente encontrado.</p>
                    <p className="mt-1 text-xs text-[#a1a1aa]">
                      Cadastre um novo cliente ou ajuste os filtros de busca.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client, index) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                    style={{ willChange: 'transform, opacity' }}
                    className="border-b border-[#27272a] transition-colors last:border-b-0 hover:bg-[#27272a]/30"
                  >
                    <TableCell className="text-sm text-[#fafafa]">{client.name}</TableCell>
                    <TableCell className="font-numbers text-sm text-[#a1a1aa]">
                      {formatDocument(client.document)}
                    </TableCell>
                    <TableCell className="text-sm text-[#a1a1aa]">{client.email ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        data-delete-id={client.id}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(client)}
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
                          disabled={isDeletingId === client.id}
                          onClick={() => handleDeleteClick(client)}
                          title={
                            confirmingDeleteId === client.id || isDeletingId === client.id
                              ? undefined
                              : 'Excluir'
                          }
                          aria-label={
                            confirmingDeleteId === client.id
                              ? `Confirmar exclusão do cliente ${client.name}`
                              : `Excluir cliente ${client.name}`
                          }
                          className="rounded-none border border-transparent px-2 text-xs text-[#f87171] hover:border-[#f87171]/20 hover:bg-[#f87171]/10 hover:text-[#f87171] disabled:opacity-50"
                        >
                          {confirmingDeleteId === client.id ? (
                            'Confirmar?'
                          ) : isDeletingId === client.id ? (
                            'Excluindo...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
                            </>
                          )}
                        </Button>
                        {confirmingDeleteId === client.id && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setConfirmingDeleteId(null)
                              setStatusMessage('Exclusão de cliente cancelada.')
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

      <ClientModal
        client={editingClient}
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        onSuccess={() =>
          refreshList(
            editingClient ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.',
          )
        }
      />
    </div>
  )
}
