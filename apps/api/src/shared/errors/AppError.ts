export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError('NOT_FOUND', message, 404)
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403)
  }

  static conflict(message = 'Conflict'): AppError {
    return new AppError('CONFLICT', message, 409)
  }

  static unprocessable(message = 'Unprocessable Entity', details?: unknown): AppError {
    return new AppError('UNPROCESSABLE_ENTITY', message, 422, details)
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500)
  }
}
