import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { diagnoseNcmCodes, searchCurrentNcms } from './ncm.service.js'

const taxRegimeSchema = z.enum(['SIMPLES_NACIONAL', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'])

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(50),
  taxRegime: taxRegimeSchema,
})

async function searchHandler(
  request: FastifyRequest<{ Querystring: z.infer<typeof searchQuerySchema> }>,
) {
  const { q, taxRegime } = searchQuerySchema.parse(request.query)
  return searchCurrentNcms(q, taxRegime)
}

const diagnoseBodySchema = z.object({
  codes: z.array(z.string().max(50)).min(1).max(100),
  taxRegime: taxRegimeSchema,
})

async function diagnoseHandler(
  request: FastifyRequest<{ Body: z.infer<typeof diagnoseBodySchema> }>,
) {
  const { codes, taxRegime } = diagnoseBodySchema.parse(request.body)
  return diagnoseNcmCodes(codes, taxRegime)
}

export async function ncmRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)
  app.get('/search', searchHandler)
  app.post('/diagnose', diagnoseHandler)
}
