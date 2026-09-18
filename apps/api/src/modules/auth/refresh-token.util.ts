import { createHmac, randomBytes } from 'node:crypto'

export const generateRawRefreshToken = (): string => {
  return randomBytes(32).toString('hex')
}

export const hashRefreshToken = (token: string): string => {
  const pepper = process.env.REFRESH_TOKEN_PEPPER
  if (!pepper) {
    throw new Error('REFRESH_TOKEN_PEPPER must be set')
  }

  return createHmac('sha256', pepper).update(token).digest('hex')
}
