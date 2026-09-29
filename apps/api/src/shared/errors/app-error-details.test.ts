import Fastify from 'fastify'
import { describe, expect, it } from 'vitest'
import { AppError } from './AppError.js'
import { errorHandlerPlugin } from './errorHandler.js'

describe('errorHandlerPlugin - structured AppError details', () => {
  it('preserves the standard error envelope and serializes eligibility issues', async () => {
    const app = Fastify()
    await app.register(errorHandlerPlugin)
    await app.register(async (routeApp) => {
      routeApp.get('/eligibility-error', async () => {
        throw new AppError('NCM_NOT_ELIGIBLE', 'Um item possui NCM não elegível', 422, {
          issues: [
            {
              itemIndex: 2,
              ncmCode: '85171200',
              reason: 'NCM_NOT_CURRENT',
              details: 'NCM não é terminal vigente',
            },
          ],
        })
      })
    })
    await app.ready()

    const response = await app.inject({ method: 'GET', url: '/eligibility-error' })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toEqual({
      error: {
        code: 'NCM_NOT_ELIGIBLE',
        message: 'Um item possui NCM não elegível',
        details: {
          issues: [
            {
              itemIndex: 2,
              ncmCode: '85171200',
              reason: 'NCM_NOT_CURRENT',
              details: 'NCM não é terminal vigente',
            },
          ],
        },
      },
    })
  })
})
