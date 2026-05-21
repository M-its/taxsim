import Fastify from 'fastify'

const app = Fastify({ logger: true })

app.get('/health', async () => {
  return { status: 'ok', service: 'taxsim-api' }
})

const start = async () => {
  try {
    await app.listen({
      port: Number(process.env.API_PORT) || 3333,
      host: process.env.API_HOST || '0.0.0.0',
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
