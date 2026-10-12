export const SESSION_TIMEOUT_MS = 8_000
export const SESSION_SKELETON_MS = 2_500

export type SessionStatus = 'restoring' | 'authenticated' | 'anonymous' | 'unavailable'
export type RestorationResult<T> =
  { status: 'authenticated'; profile: T } | { status: 'anonymous' | 'unavailable' | 'cancelled' }

export function isInvalidSession(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error.status === 401 || error.status === 403)
  )
}

function isTransientReadFailure(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number' &&
      error.status >= 500 &&
      error.status <= 599)
  )
}

/** One refresh; at most two profile reads, all within one deadline. */
export async function restoreSession<T>({
  refresh,
  profile,
  signal,
  onSlow,
}: {
  refresh: (signal: AbortSignal) => Promise<unknown>
  profile: (signal: AbortSignal) => Promise<T>
  signal: AbortSignal
  onSlow: () => void
}): Promise<RestorationResult<T>> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal.addEventListener('abort', cancel, { once: true })
  if (signal.aborted) cancel()
  const timeout = setTimeout(cancel, SESSION_TIMEOUT_MS)
  const slow = setTimeout(() => {
    if (!controller.signal.aborted) onSlow()
  }, SESSION_SKELETON_MS)
  let rejectAbort: () => void = () => undefined
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(new DOMException('Session check aborted', 'AbortError'))
    controller.signal.addEventListener('abort', rejectAbort, { once: true })
    if (controller.signal.aborted) rejectAbort()
  })
  const operation = async () => {
    controller.signal.throwIfAborted()
    await refresh(controller.signal)
    controller.signal.throwIfAborted()
    try {
      return await profile(controller.signal)
    } catch (error) {
      controller.signal.throwIfAborted()
      if (!isTransientReadFailure(error)) throw error
      return profile(controller.signal)
    }
  }
  try {
    const value = await Promise.race([operation(), aborted])
    controller.signal.throwIfAborted()
    return { status: 'authenticated', profile: value }
  } catch (error) {
    if (signal.aborted) return { status: 'cancelled' }
    return { status: isInvalidSession(error) ? 'anonymous' : 'unavailable' }
  } finally {
    clearTimeout(timeout)
    clearTimeout(slow)
    signal.removeEventListener('abort', cancel)
    controller.signal.removeEventListener('abort', rejectAbort)
  }
}
