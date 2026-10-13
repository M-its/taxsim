'use client'

import { useAuth } from './auth-provider'
import { SessionStatusText } from './session-status-text'

export function AuthLoading() {
  const { isSlowRestoration } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#09090b] p-6">
      <p role="status" className="text-sm text-zinc-300">
        <SessionStatusText />
      </p>
      {isSlowRestoration && (
        <div aria-hidden="true" className="w-full max-w-sm space-y-4">
          <div className="h-8 w-2/3 bg-zinc-800" />
          <div className="h-24 bg-zinc-900" />
          <div className="h-12 bg-zinc-800" />
        </div>
      )}
    </div>
  )
}
