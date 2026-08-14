import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import { errorHandlerPlugin } from './shared/errors/errorHandler.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { productsRoutes } from './modules/products/products.routes.js'
import { clientsRoutes } from './modules/clients/clients.routes.js'
import { salesRoutes } from './modules/sales/sales.routes.js'
import { companiesRoutes } from './modules/companies/companies.routes.js'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js'
import { ncmRoutes } from './modules/ncm/ncm.routes.js'
import { municipalitiesRoutes } from './modules/municipalities/municipalities.routes.js'

const app = Fastify({ logger: true })

// Fail fast if JWT_SECRET is missing in production — never silently fall
// back to a publicly known development secret in a real deployment.
// This must be enforced here (not only in docker-compose.prod.yml) because
// the standalone Dockerfile.prod entry point has no other safeguard.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  app.log.fatal('JWT_SECRET must be set in production. Refusing to start.')
  process.exit(1)
}

const jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-change-me'
if (jwtSecret === 'dev-secret-change-me') {
  app.log.warn('Using default development JWT secret. Never use this in production.')
}

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true,
})
await app.register(jwt, {
  secret: jwtSecret,
})
await app.register(cookie)
await app.register(errorHandlerPlugin)
await app.register(authRoutes, { prefix: '/auth' })
await app.register(productsRoutes, { prefix: '/products' })
await app.register(clientsRoutes, { prefix: '/clients' })
await app.register(salesRoutes, { prefix: '/sales' })
await app.register(companiesRoutes, { prefix: '/companies' })
await app.register(dashboardRoutes, { prefix: '/dashboard' })
await app.register(ncmRoutes, { prefix: '/ncm' })
await app.register(municipalitiesRoutes, { prefix: '/municipalities' })

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
