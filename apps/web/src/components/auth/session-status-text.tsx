export function SessionStatusText() {
  return (
    <>
      Verificando sessão
      <span className="session-loading-dots inline-flex w-[3ch]" aria-hidden="true">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
      <span className="sr-only">…</span>
    </>
  )
}
