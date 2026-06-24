'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  setAccessToken,
  onAuthFailure,
  refreshSession,
  me,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from '@/lib/api'
import type {
  AuthContextValue,
  LoginInput,
  RegisterInput,
  User,
  Company,
} from '@/lib/auth.types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function isPublicPath(path: string): boolean {
  return path === '/login' || path === '/register'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    setCompany(null)
    setAccessToken(null)
  }, [])

  useEffect(() => {
    onAuthFailure(() => {
      clearSession()
      if (typeof window !== 'undefined') {
        const path = window.location.pathname
        if (!isPublicPath(path)) {
          window.location.replace(
            `/login?redirectTo=${encodeURIComponent(path)}`,
          )
        }
      }
    })
  }, [clearSession])

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        await refreshSession()
        const profile = await me()
        if (!cancelled) {
          setUser(profile.user)
          setCompany(profile.company)
        }
      } catch {
        if (!cancelled) {
          clearSession()
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [clearSession])

  const login = useCallback(async (input: LoginInput) => {
    const response = await apiLogin(input)
    setAccessToken(response.accessToken)
    const profile = await me()
    setUser(profile.user)
    setCompany(profile.company)
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const response = await apiRegister(input)
    setAccessToken(response.accessToken)
    const profile = await me()
    setUser(profile.user)
    setCompany(profile.company)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore logout errors — local session is cleared regardless.
    }
    clearSession()
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      company,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, company, isLoading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
