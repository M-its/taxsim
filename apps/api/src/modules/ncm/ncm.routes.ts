import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'
import { prisma } from '../../lib/prisma.js'

const searchQuerySchema = z.object({
  q: z.string().min(1).max(50),
})

async function searchHandler(
  request: FastifyRequest<{ Querystring: { q: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const parseResult = searchQuerySchema.safeParse(request.query)
  if (!parseResult.success) {
    return await reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameter "q" is required and must be between 1 and 50 characters.',
        details: parseResult.error.format(),
      },
    })
  }

  const { q } = parseResult.data
  const digits = q.replace(/\D/g, '')

  const results = await prisma.ncmCatalog.findMany({
    where: {
      OR: [
        ...(digits.length > 0 ? [{ code: { startsWith: digits } }] : []),
        {
          description: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ],
    },
    take: 10,
    orderBy: { code: 'asc' },
    select: {
      code: true,
      description: true,
    },
  })

  return reply.send(results)
}

export async function ncmRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)
  app.get('/search', searchHandler)
}
