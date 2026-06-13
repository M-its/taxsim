import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import type {
  CreateClientInput,
  UpdateClientInput,
  ListClientsQuery,
} from './clients.types.js'

export async function listClients(
  companyId: string,
  params: ListClientsQuery,
) {
  const { page, limit, search } = params
  const skip = (page - 1) * limit

  const where: Prisma.ClientWhereInput = {
    companyId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { document: { contains: search, mode: 'insensitive' } },
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

export async function createClient(
  companyId: string,
  input: CreateClientInput,
) {
  try {
    return await prisma.client.create({
      data: {
        companyId,
        name: input.name,
        document: input.document,
        email: input.email,
      },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw AppError.conflict('Document already exists')
    }
    throw err
  }
}

export async function updateClient(
  companyId: string,
  id: string,
  input: UpdateClientInput,
) {
  const existing = await prisma.client.findFirst({
    where: { id, companyId },
  })
  if (!existing) {
    throw AppError.notFound('Client not found')
  }

  try {
    return await prisma.client.update({
      where: { id },
      data: {
        name: input.name,
        document: input.document,
        email: input.email,
      },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw AppError.conflict('Document already exists')
    }
    throw err
  }
}

export async function deleteClient(
  companyId: string,
  id: string,
): Promise<void> {
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
