import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAccessToken,
  login,
  register,
  meForRestoration,
  refreshSession,
  setAccessToken,
} from './api'

afterEach(() => {
  vi.unstubAllGlobals()
  setAccessToken(null)
})

describe('restoration transport', () => {
  it('keeps a rejected login response instead of attempting refresh or repeating credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }),
          { status: 401 },
        ),
      )
    vi.stubGlobal('fetch', fetch)
    await expect(
      login({ email: 'wrong@taxsim.test', password: 'WrongPassword!' }),
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][0]).toContain('/auth/login')
  })

  it('does not refresh or replay a rejected registration', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
    vi.stubGlobal('fetch', fetch)
    await expect(
      register({
        company: {
          name: 'Test',
          document: '11222333000181',
          taxRegime: 'LUCRO_REAL',
          municipioCode: 3550308,
          uf: 'SP',
        },
        user: { name: 'Test', email: 'test@taxsim.test', password: 'WrongPassword!' },
      }),
    ).rejects.toMatchObject({ status: 401 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

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
