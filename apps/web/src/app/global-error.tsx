'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Algo deu errado</h2>
      <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
        {error.message || 'Ocorreu um erro inesperado.'}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{ backgroundColor: '#34d399', color: '#09090b', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}
      >
        Tentar novamente
      </button>
    </div>
  )
}
