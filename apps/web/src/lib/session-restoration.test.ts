import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { restoreSession, SESSION_TIMEOUT_MS } from './session-restoration'

const denied = { status: 401 }
const unavailable = { status: 503 }
const pending = <T>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('session restoration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())
  const setup = () => ({
    refresh: vi.fn().mockResolvedValue('token'),
    profile: vi.fn().mockResolvedValue({ name: 'user' }),
    signal: new AbortController().signal,
    onSlow: vi.fn(),
  })

  it('confirms a valid session with one refresh', async () => {
    const input = setup()
    expect(await restoreSession(input)).toEqual({
      status: 'authenticated',
      profile: { name: 'user' },
    })
    expect(input.refresh).toHaveBeenCalledTimes(1)
    expect(input.onSlow).not.toHaveBeenCalled()
  })

  it('reports a slow session at 2.5 seconds and still accepts it before 8 seconds', async () => {
    const input = setup()
    const delayed = pending<string>()
    input.refresh.mockReturnValue(delayed.promise)
    const result = restoreSession(input)
    await vi.advanceTimersByTimeAsync(2500)
    expect(input.onSlow).toHaveBeenCalledTimes(1)
    delayed.resolve('token')
    expect((await result).status).toBe('authenticated')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('times out even when the transport ignores abort; late responses cannot authenticate', async () => {
    const input = setup()
    const delayed = pending<string>()
    input.refresh.mockReturnValue(delayed.promise)
    const result = restoreSession(input)
    await vi.advanceTimersByTimeAsync(SESSION_TIMEOUT_MS)
    expect(await result).toEqual({ status: 'unavailable' })
    delayed.resolve('late token')
    await Promise.resolve()
    expect(input.profile).not.toHaveBeenCalled()
  })

  it('never retries a refresh failure', async () => {
    const input = setup()
    input.refresh.mockRejectedValue(new TypeError('offline'))
    expect((await restoreSession(input)).status).toBe('unavailable')
    expect(input.refresh).toHaveBeenCalledTimes(1)
    expect(input.profile).not.toHaveBeenCalled()
  })

  it('an invalid refresh is anonymous rather than a technical failure', async () => {
    const input = setup()
    input.refresh.mockRejectedValue(denied)
    expect((await restoreSession(input)).status).toBe('anonymous')
  })

  it.each([401, 403])('does not retry profile status %s', async (status) => {
    const input = setup()
    input.profile.mockRejectedValue({ status })
    expect((await restoreSession(input)).status).toBe('anonymous')
    expect(input.profile).toHaveBeenCalledTimes(1)
    expect(input.refresh).toHaveBeenCalledTimes(1)
  })

  it.each([new TypeError('offline'), unavailable])(
    'retries only a transient profile failure once',
    async (error) => {
      const input = setup()
      input.profile.mockRejectedValueOnce(error)
      expect((await restoreSession(input)).status).toBe('authenticated')
      expect(input.profile).toHaveBeenCalledTimes(2)
      expect(input.refresh).toHaveBeenCalledTimes(1)
    },
  )

  it('does not retry malformed or other client responses', async () => {
    const input = setup()
    input.profile.mockRejectedValue({ status: 400 })
    expect((await restoreSession(input)).status).toBe('unavailable')
    expect(input.profile).toHaveBeenCalledTimes(1)
  })

  it('the profile retry does not restart the total deadline', async () => {
    const input = setup()
    input.profile
      .mockImplementationOnce(async () => {
        await new Promise((done) => setTimeout(done, 7000))
        throw unavailable
      })
      .mockReturnValueOnce(pending().promise)
    const result = restoreSession(input)
    await vi.advanceTimersByTimeAsync(8000)
    expect((await result).status).toBe('unavailable')
    expect(input.profile).toHaveBeenCalledTimes(2)
  })

  it('a superseded or unmounted attempt is cancelled, not an auth failure', async () => {
    const input = setup()
    const controller = new AbortController()
    input.signal = controller.signal
    input.profile.mockReturnValue(pending().promise)
    const result = restoreSession(input)
    controller.abort()
    expect((await result).status).toBe('cancelled')
  })
})
