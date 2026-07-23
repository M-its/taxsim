import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../../shared/middlewares/authenticate.js'

interface Municipality {
  code: number
  name: string
}

const querySchema = z.object({
  uf: z.string().length(2).toUpperCase(),
})

const cache = new Map<string, Municipality[]>()

async function fetchMunicipalities(uf: string): Promise<Municipality[]> {
  const cached = cache.get(uf)
  if (cached) {
    return cached
  }

  const url = new URL('http://tax-calculator:80/api/calculadora/dados-abertos/ufs/municipios')
  url.searchParams.set('siglaUf', uf)
  url.searchParams.set('data', '2027-01-01')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Tax calculator returned ${response.status}`)
  }

  const raw = (await response.json()) as Array<{ codigo: number; nome: string }>
  const municipalities = raw
    .map((item) => ({ code: item.codigo, name: item.nome }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  cache.set(uf, municipalities)
  return municipalities
}

async function listHandler(
  request: FastifyRequest<{ Querystring: { uf: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const parseResult = querySchema.safeParse(request.query)
  if (!parseResult.success) {
    return await reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query parameter "uf" is required and must be a 2-letter code.',
        details: parseResult.error.format(),
      },
    })
  }

  const { uf } = parseResult.data

  try {
    const municipalities = await fetchMunicipalities(uf)
    return reply.send(municipalities)
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch municipalities from tax calculator')
    return reply.status(502).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch municipalities.',
      },
    })
  }
}

export async function municipalitiesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)
  app.get('/', listHandler)
}
