import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { AppError } from './AppError.js'

interface ErrorPayload {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export async function errorHandlerPlugin(app: FastifyInstance): Promise<void> {
  app.setErrorHandler(
    (
      error: unknown,
      _request: FastifyRequest,
      reply: FastifyReply,
    ): void | Promise<void> => {
      if (error instanceof AppError) {
        void reply.status(error.statusCode).send({
          error: { code: error.code, message: error.message },
        } satisfies ErrorPayload)
        return
      }

      if (error instanceof ZodError) {
        void reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        } satisfies ErrorPayload)
        return
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          void reply.status(409).send({
            error: {
              code: 'CONFLICT',
              message: 'Resource already exists',
            },
          } satisfies ErrorPayload)
          return
        }

        if (error.code === 'P2025') {
          void reply.status(404).send({
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          } satisfies ErrorPayload)
          return
        }
      }

      app.log.error(error)

      void reply.status(500).send({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      } satisfies ErrorPayload)
    },
  )
}
