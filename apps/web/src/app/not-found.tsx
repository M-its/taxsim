export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#34d399', marginBottom: '0.5rem' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Página não encontrada</h2>
      <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>A página que você está procurando não existe.</p>
      <a href="/dashboard" style={{ backgroundColor: '#34d399', color: '#09090b', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: '500', textDecoration: 'none' }}>
        Voltar ao Dashboard
      </a>
    </div>
  )
}
