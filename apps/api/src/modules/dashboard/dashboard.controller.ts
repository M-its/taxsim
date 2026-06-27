import type { FastifyRequest, FastifyReply } from 'fastify'
import { getDashboardSummary } from './dashboard.service.js'

export const getDashboardSummaryHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { companyId } = request.user

  const summary = await getDashboardSummary(companyId)

  return reply.send(summary)
}
