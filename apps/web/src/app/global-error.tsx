'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa]">
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="mb-2 text-2xl font-semibold">Algo deu errado</h2>
          <p className="mb-6 text-[#a1a1aa]">
            {error.message || 'Ocorreu um erro inesperado.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-none bg-[#34d399] px-4 py-2 text-sm font-medium text-[#09090b] hover:bg-[#34d399]/90"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
