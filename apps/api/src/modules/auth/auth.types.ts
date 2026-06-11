import type { UserRole } from '@prisma/client'
import type { z } from 'zod'
import type { registerSchema, loginSchema } from './auth.schema.js'

export type JwtPayload = {
  sub: string
  companyId: string
  role: UserRole
}

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type AuthResponse = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    companyId: string
  }
  accessToken: string
}

export type RegisterResponse = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  company: {
    id: string
    name: string
    document: string
    taxRegime: string
  }
  accessToken: string
}
