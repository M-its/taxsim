'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './auth-provider'
import { AuthLoading } from './auth-loading'
import { safeRedirectPath } from '@/lib/safe-redirect'
import { SessionRecovery } from './session-recovery'

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      prefetch={false}
      onNavigate={(event) => {
        // Native fragment entries restored by back/forward can leave the SPA
        // cache stale. An explicit return starts a fresh document at the root.
        event.preventDefault()
        window.location.assign('/')
      }}
      className="mt-4 inline-flex min-h-11 items-center text-sm text-zinc-300 underline underline-offset-4 hover:text-white"
    >
      Voltar ao início
    </Link>
  )
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirectTo'))

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [isLoading, isAuthenticated, redirectTo, router])

  // These forms contain no private data. Keep their server-rendered content
  // available during hydration/restoration; submission is gated in each form.
  if (isAuthenticated) {
    return <AuthLoading />
  }

  return (
    <>
      {!isLoading && <SessionRecovery />}
      {children}
    </>
  )
}
