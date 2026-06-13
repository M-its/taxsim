import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from './products.schema.js'
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.service.js'

import type { Product } from '@prisma/client'
import { formatDecimal } from '../../shared/formatters/decimal.js'

const formatProductResponse = (product: Product) => ({
  ...product,
  unitPrice: formatDecimal(product.unitPrice),
})

export const listHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const query = listProductsSchema.parse(request.query)
  const result = await listProducts(companyId, query)
  return reply.send({
    ...result,
    data: result.data.map(formatProductResponse),
  })
}

export const getHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  const product = await getProduct(companyId, id)
  return reply.send(formatProductResponse(product))
}

export const createHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const body = createProductSchema.parse(request.body)
  const product = await createProduct(companyId, body)
  return reply.status(201).send(formatProductResponse(product))
}

export const updateHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  const body = updateProductSchema.parse(request.body)
  const product = await updateProduct(companyId, id, body)
  return reply.send(formatProductResponse(product))
}

export const deleteHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const { id } = request.params
  await deleteProduct(companyId, id)
  return reply.status(204).send()
}
