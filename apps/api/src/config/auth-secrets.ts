export function assertProductionJwtSecret(
  env: { NODE_ENV?: string; JWT_SECRET?: string },
): void {
  if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production. Refusing to start.')
  }
}
