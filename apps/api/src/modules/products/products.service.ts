import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { AppError } from '../../shared/errors/AppError.js'
import {
  diagnoseNcmCodes,
  NCM_CATALOG_VERSION,
  type NcmDiagnosis,
} from '../ncm/ncm.service.js'
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

  const [data, total, company] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { taxRegime: true },
    }),
  ])

  if (!company) {
    throw AppError.notFound('Company not found')
  }

  const diagnoses = await diagnoseNcmCodes(
    data.map((product) => product.ncmCode),
    company.taxRegime,
  )

  return {
    data: data.map((product, index) => ({
      ...product,
      ncmStatus: diagnoses[index]?.status ?? 'NOT_FOUND',
      ncmDescription: diagnoses[index]?.description ?? null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    metadata: {
      ncmCatalogVersion: NCM_CATALOG_VERSION,
    },
  }
}

const rejectedNcmMessages: Partial<Record<NcmDiagnosis['status'], string>> = {
  INVALID_FORMAT: 'NCM deve conter exatamente 8 dígitos',
  NOT_FOUND: 'NCM não encontrado no catálogo vigente',
  NOT_CURRENT: 'NCM não está vigente na data atual',
}

async function assertCurrentProductNcm(
  companyId: string,
  ncmCode: string,
): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { taxRegime: true },
  })

  if (!company) {
    throw AppError.notFound('Company not found')
  }

  const [diagnosis] = await diagnoseNcmCodes([ncmCode], company.taxRegime)
  const message = diagnosis
    ? rejectedNcmMessages[diagnosis.status]
    : rejectedNcmMessages.NOT_FOUND

  if (message) {
    throw new AppError('INVALID_NCM', message, 422, {
      ncmCode,
      status: diagnosis?.status ?? 'NOT_FOUND',
    })
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
  await assertCurrentProductNcm(companyId, input.ncmCode)

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

  if (input.ncmCode !== existing.ncmCode) {
    await assertCurrentProductNcm(companyId, input.ncmCode)
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
