export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number

  constructor(code: string, message: string, statusCode: number) {
    super(message)
    this.code = code
    this.statusCode = statusCode
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

  static unprocessable(message = 'Unprocessable Entity'): AppError {
    return new AppError('UNPROCESSABLE_ENTITY', message, 422)
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError('INTERNAL_ERROR', message, 500)
  }
}
