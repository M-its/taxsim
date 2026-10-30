'use client'

import Link from 'next/link'
import { useAuth } from './auth-provider'
import { SessionStatusText } from './session-status-text'

export function SessionRecovery({ protectedRoute = false }: { protectedRoute?: boolean }) {
  const { sessionStatus, retrySession } = useAuth()
  if (sessionStatus === 'restoring')
    return (
      <p role="status" className="text-sm text-zinc-400">
        <SessionStatusText />
      </p>
    )
  if (sessionStatus !== 'unavailable') return null
  return (
    <section
      aria-label="Verificação da sessão"
      className="border border-zinc-700 bg-zinc-950 p-4 text-sm text-zinc-200"
    >
      <p role="status">
        Não foi possível verificar sua sessão. Tente novamente ou entre na sua conta.
      </p>
      <div className="mt-3 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={retrySession}
          className="min-h-11 px-2 font-semibold text-emerald-400 underline underline-offset-4"
        >
          Tentar novamente
        </button>
        {protectedRoute && (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center px-2 underline underline-offset-4"
          >
            Ir para o login
          </Link>
        )}
      </div>
    </section>
  )
}
