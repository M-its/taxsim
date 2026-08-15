import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import { z, ZodError } from 'zod'
import { errorHandlerPlugin } from './errorHandler.js'

describe('errorHandlerPlugin - propagation across sibling route plugins', () => {
  it('converts a ZodError thrown in a route registered as a sibling into a 400 response', async () => {
    const app = Fastify()
    await app.register(jwt, { secret: 'test-secret' })

    // Mirrors server.ts: error handler is registered first, then route
    // plugins are registered as siblings (not children) of it.
    await app.register(errorHandlerPlugin)
    await app.register(async (routeApp) => {
      routeApp.post('/simulate', async (request) => {
        const schema = z.object({ value: z.string().regex(/^\d+$/) })
        // .parse() throws a ZodError on invalid input, exactly like the
        // real sales.controller.ts handlers do
        return schema.parse(request.body)
      })
    })

    await app.ready()

    const response = await app.inject({
      method: 'POST',
      url: '/simulate',
      payload: { value: 'not-a-number' },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns a valid response for well-formed input (sanity check)', async () => {
    const app = Fastify()
    await app.register(errorHandlerPlugin)
    await app.register(async (routeApp) => {
      routeApp.post('/simulate', async (request) => {
        const schema = z.object({ value: z.string().regex(/^\d+$/) })
        return schema.parse(request.body)
      })
    })
    await app.ready()

    const response = await app.inject({
      method: 'POST',
      url: '/simulate',
      payload: { value: '123' },
    })

    expect(response.statusCode).toBe(200)
  })
})
