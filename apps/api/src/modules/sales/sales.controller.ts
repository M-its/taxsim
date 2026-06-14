import type { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../../shared/errors/AppError.js'
import {
  createSaleSchema,
  simulateSchema,
  listSalesSchema,
  saleIdParamSchema,
} from './sales.schema.js'
import {
  createSale,
  simulateTax,
  listSales,
  getSale,
  confirmSale,
  cancelSale,
} from './sales.service.js'
import type { CreateSaleInput, SimulateInput, ListSalesQuery, SaleIdParam } from './sales.types.js'

export const createSaleHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const body = createSaleSchema.parse(request.body)
  const companyId = (request.user as { companyId: string }).companyId

  const sale = await createSale(companyId, body as CreateSaleInput)

  reply.status(201)
  return sale
}

export const listSalesHandler = async (request: FastifyRequest) => {
  const query = listSalesSchema.parse(request.query)
  const companyId = (request.user as { companyId: string }).companyId

  return listSales(
    companyId,
    query.page,
    query.limit,
    query.status,
    query.from ? new Date(query.from) : undefined,
    query.to ? new Date(query.to) : undefined,
  )
}

export const getSaleHandler = async (request: FastifyRequest) => {
  const params = saleIdParamSchema.parse(request.params)
  const companyId = (request.user as { companyId: string }).companyId

  return getSale(companyId, params.id)
}

export const simulateHandler = async (request: FastifyRequest) => {
  const body = simulateSchema.parse(request.body)

  return simulateTax(body as SimulateInput)
}

export const confirmSaleHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const params = saleIdParamSchema.parse(request.params)
  const companyId = (request.user as { companyId: string }).companyId

  const result = await confirmSale(companyId, params.id)
  reply.status(200)
  return result
}

export const cancelSaleHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const params = saleIdParamSchema.parse(request.params)
  const companyId = (request.user as { companyId: string }).companyId

  const result = await cancelSale(companyId, params.id)
  reply.status(200)
  return result
}
