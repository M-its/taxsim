'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  setAccessToken,
  onAuthFailure,
  refreshSession,
  meForRestoration,
  me,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from '@/lib/api'
import type { AuthContextValue, LoginInput, RegisterInput, User, Company } from '@/lib/auth.types'
import { isInvalidSession, restoreSession, type SessionStatus } from '@/lib/session-restoration'

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function isPublicPath(path: string): boolean {
  return path === '/' || path === '/login' || path === '/register'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('restoring')
  const [isSlowRestoration, setIsSlowRestoration] = useState(false)
  const [hasStartedRestoration, setHasStartedRestoration] = useState(false)
  const restorationRef = useRef<AbortController | null>(null)
  const attemptRef = useRef(0)
  const isLoading = sessionStatus === 'restoring'

  const cancelRestoration = useCallback(() => {
    attemptRef.current += 1
    restorationRef.current?.abort()
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setCompany(null)
    setAccessToken(null)
  }, [])

  useEffect(() => {
    return onAuthFailure((error) => {
      cancelRestoration()
      if (!isInvalidSession(error)) {
        setSessionStatus('unavailable')
        return
      }
      clearSession()
      setSessionStatus('anonymous')
      if (typeof window !== 'undefined') {
        const path = window.location.pathname
        if (!isPublicPath(path)) {
          window.location.replace(`/login?redirectTo=${encodeURIComponent(path)}`)
        }
      }
    })
  }, [clearSession, cancelRestoration])

  const retrySession = useCallback(() => {
    cancelRestoration()
    const attempt = attemptRef.current
    const controller = new AbortController()
    restorationRef.current = controller
    setSessionStatus('restoring')
    setIsSlowRestoration(false)
    void restoreSession({
      refresh: refreshSession,
      profile: meForRestoration,
      signal: controller.signal,
      onSlow: () => {
        if (attemptRef.current === attempt) setIsSlowRestoration(true)
      },
    }).then((result) => {
      if (attemptRef.current !== attempt || result.status === 'cancelled') return
      if (result.status === 'authenticated') {
        setUser(result.profile.user)
        setCompany(result.profile.company)
      } else if (result.status === 'anonymous') {
        clearSession()
      }
      setSessionStatus(result.status)
    })
    // Server-rendered public inputs become interactive only once hydration has
    // installed their handlers and initiated the first session check.
    setHasStartedRestoration(true)
  }, [cancelRestoration, clearSession])

  useEffect(() => {
    // StrictMode's discarded setup must not send a second rotating refresh.
    let active = true
    queueMicrotask(() => {
      if (active) retrySession()
    })
    return () => {
      active = false
      cancelRestoration()
    }
  }, [retrySession, cancelRestoration])

  const login = useCallback(
    async (input: LoginInput) => {
      cancelRestoration()
      const response = await apiLogin(input)
      setAccessToken(response.accessToken)
      const profile = await me()
      setUser(profile.user)
      setCompany(profile.company)
      setSessionStatus('authenticated')
    },
    [cancelRestoration],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      cancelRestoration()
      const response = await apiRegister(input)
      setAccessToken(response.accessToken)
      const profile = await me()
      setUser(profile.user)
      setCompany(profile.company)
      setSessionStatus('authenticated')
    },
    [cancelRestoration],
  )

  const logout = useCallback(async () => {
    cancelRestoration()
    try {
      await apiLogout()
    } catch {
      // Ignore logout errors — local session is cleared regardless.
    }
    clearSession()
    setSessionStatus('anonymous')
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  }, [clearSession, cancelRestoration])

  const refreshCompany = useCallback(async () => {
    const profile = await me()
    setCompany(profile.company)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      company,
      isLoading,
      isAuthenticated: user !== null,
      sessionStatus,
      isSlowRestoration,
      hasStartedRestoration,
      retrySession,
      login,
      register,
      logout,
      refreshCompany,
    }),
    [
      user,
      company,
      isLoading,
      sessionStatus,
      isSlowRestoration,
      hasStartedRestoration,
      retrySession,
      login,
      register,
      logout,
      refreshCompany,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
