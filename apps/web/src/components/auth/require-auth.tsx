'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { AuthLoading } from './auth-loading'
import { SessionRecovery } from './session-recovery'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, sessionStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (sessionStatus === 'anonymous' && !isAuthenticated) {
      router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`)
    }
  }, [sessionStatus, isAuthenticated, pathname, router])

  if (isAuthenticated) {
    return (
      <>
        <SessionRecovery protectedRoute />
        {children}
      </>
    )
  }
  if (sessionStatus === 'unavailable') {
    return (
      <main className="mx-auto w-full max-w-xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Verificação da sessão</h1>
        <SessionRecovery protectedRoute />
      </main>
    )
  }
  if (isLoading || !isAuthenticated) {
    return <AuthLoading />
  }

  return null
}
