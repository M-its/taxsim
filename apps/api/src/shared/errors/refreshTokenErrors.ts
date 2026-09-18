export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token')
    this.name = 'InvalidRefreshTokenError'
  }
}

export class RefreshTokenReuseDetectedError extends Error {
  constructor() {
    super('Invalid or expired refresh token')
    this.name = 'RefreshTokenReuseDetectedError'
  }
}
