import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateCompanySchema } from './companies.schema.js'
import { updateCompany } from './companies.service.js'
import { AppError } from '../../shared/errors/AppError.js'

export const updateHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const companyId = request.user.companyId
  const body = updateCompanySchema.parse(request.body)
  const company = await updateCompany(companyId, body)
  return reply.send(company)
}
