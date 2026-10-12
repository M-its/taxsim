import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAccessToken, meForRestoration, refreshSession, setAccessToken } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
  setAccessToken(null)
})

describe('restoration transport', () => {
  it.each([401, 403, 503])('profile status %s never invokes refresh', async (status) => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status }))
    vi.stubGlobal('fetch', fetch)
    await expect(meForRestoration(new AbortController().signal)).rejects.toMatchObject({ status })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('/auth/me')
  })

  it('does not publish a late token after cancellation', async () => {
    const controller = new AbortController()
    let deliver!: (value: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            deliver = done
          }),
      ),
    )
    const result = refreshSession(controller.signal)
    controller.abort()
    setAccessToken('newer-session')
    deliver(new Response(JSON.stringify({ accessToken: 'late-token' })))
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
    expect(getAccessToken()).toBe('newer-session')
  })
})
