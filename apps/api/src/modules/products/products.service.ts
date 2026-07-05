import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import type {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from './products.types.js'

export async function listProducts(
  companyId: string,
  params: ListProductsQuery,
) {
  const { page, limit, search } = params
  const skip = (page - 1) * limit

  const where: Prisma.ProductWhereInput = {
    companyId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { ncmCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
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

export async function getProduct(companyId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, companyId },
  })

  if (!product) {
    throw AppError.notFound('Product not found')
  }

  return product
}

export async function createProduct(
  companyId: string,
  input: CreateProductInput,
) {
  try {
    return await prisma.product.create({
      data: {
        companyId,
        name: input.name,
        sku: input.sku,
        ncmCode: input.ncmCode,
        unitPrice: input.unitPrice,
      },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw AppError.conflict('SKU already exists')
    }
    throw err
  }
}

export async function updateProduct(
  companyId: string,
  id: string,
  input: UpdateProductInput,
) {
  const existing = await prisma.product.findFirst({
    where: { id, companyId },
  })
  if (!existing) {
    throw AppError.notFound('Product not found')
  }

  try {
    return await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        sku: input.sku,
        ncmCode: input.ncmCode,
        unitPrice: input.unitPrice,
      },
    })
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw AppError.conflict('SKU already exists')
    }
    throw err
  }
}

export async function deleteProduct(
  companyId: string,
  id: string,
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: { id, companyId },
  })
  if (!existing) {
    throw AppError.notFound('Product not found')
  }

  await prisma.product.delete({
    where: { id },
  })
}
