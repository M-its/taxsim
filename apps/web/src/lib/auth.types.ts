export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export type TaxRegime = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  companyId: string
}

export type Company = {
  id: string
  name: string
  document: string
  taxRegime: TaxRegime
  municipioCode: number | null
  uf: string | null
}

export type LoginInput = {
  email: string
  password: string
}

export type RegisterInput = {
  company: {
    name: string
    document: string
    taxRegime: TaxRegime
    municipioCode: number
    uf: string
  }
  user: {
    name: string
    email: string
    password: string
  }
}

export type AuthContextValue = {
  user: User | null
  company: Company | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}
