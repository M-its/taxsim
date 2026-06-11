import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { errorHandlerPlugin } from './shared/errors/errorHandler.js'
import { authRoutes } from './modules/auth/auth.routes.js'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
})

await app.register(cookie)

await app.register(errorHandlerPlugin)

await app.register(authRoutes, { prefix: '/auth' })

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'taxsim-api',
    timestamp: new Date().toISOString(),
  }
})

const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.API_PORT) || 3333
    const host = process.env.API_HOST || '0.0.0.0'

    await app.listen({ port, host })
    app.log.info(`Server listening on ${host}:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

const shutdown = async (signal: string): Promise<void> => {
  app.log.info(`Received ${signal}. Starting graceful shutdown...`)
  await app.close()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

void start()

export { app }
