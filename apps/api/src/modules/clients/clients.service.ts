import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import {
  normalizeDocumentSearch,
  publicDocumentErrorMessage,
  validateBrazilianDocument,
} from '../../shared/documents/br-document.js'
import type { CreateClientInput, UpdateClientInput, ListClientsQuery } from './clients.types.js'

export async function listClients(companyId: string, params: ListClientsQuery) {
  const { page, limit, search } = params
  const skip = (page - 1) * limit
  const normalizedDocumentSearch = search ? normalizeDocumentSearch(search) : undefined

  const where: Prisma.ClientWhereInput = {
    companyId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            ...(normalizedDocumentSearch
              ? [{ document: { contains: normalizedDocumentSearch, mode: 'insensitive' as const } }]
              : []),
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ])

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getClient(companyId: string, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, companyId },
  })

  if (!client) {
    throw AppError.notFound('Client not found')
  }

  return client
}

export async function createClient(companyId: string, input: CreateClientInput) {
  const documentValidation = validateBrazilianDocument(input.document)
  if (!documentValidation.valid) {
    throw AppError.unprocessable(publicDocumentErrorMessage(documentValidation.kind))
  }

  try {
    return await prisma.client.create({
      data: {
        companyId,
        name: input.name,
        document: documentValidation.normalized,
        email: input.email,
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict(publicDocumentErrorMessage(documentValidation.kind))
    }
    throw err
  }
}

export async function updateClient(companyId: string, id: string, input: UpdateClientInput) {
  const existing = await prisma.client.findFirst({
    where: { id, companyId },
  })
  if (!existing) {
    throw AppError.notFound('Client not found')
  }

  const documentValidation = validateBrazilianDocument(input.document)
  const keepsLegacyDocument = input.document === existing.document
  if (!documentValidation.valid && !keepsLegacyDocument) {
    throw AppError.unprocessable(publicDocumentErrorMessage(documentValidation.kind))
  }

  const normalizedDocument = documentValidation.valid
    ? documentValidation.normalized
    : existing.document

  try {
    return await prisma.client.update({
      where: { id },
      data: {
        name: input.name,
        document: normalizedDocument,
        email: input.email,
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict(publicDocumentErrorMessage(documentValidation.kind))
    }
    throw err
  }
}

export async function deleteClient(companyId: string, id: string): Promise<void> {
  const existing = await prisma.client.findFirst({
    where: { id, companyId },
  })
  if (!existing) {
    throw AppError.notFound('Client not found')
  }

  await prisma.client.delete({
    where: { id },
  })
}
