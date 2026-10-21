import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import {
  LANDING_FRAGMENT_CAPTURE,
  LANDING_FRAGMENTS,
  landingFragmentHref,
  takeLandingFragment,
  type LandingFragmentState,
} from './landing-fragments'

const origin = 'https://taxsim.example'

function bootstrap(href = `${origin}/`) {
  const window: { __taxsimLandingFragment?: LandingFragmentState } = {}
  const listeners: ((event: { newURL: string }) => void)[] = []
  const context = {
    window,
    location: new URL(href),
    URL,
    addEventListener: (name: string, listener: (event: { newURL: string }) => void) => {
      expect(name).toBe('hashchange')
      listeners.push(listener)
    },
  }
  runInNewContext(LANDING_FRAGMENT_CAPTURE, context)
  return { window, context, listeners, change: (newURL: string) => listeners[0]({ newURL }) }
}

describe('landing fragment preservation', () => {
  it('accepts only known landing fragments', () => {
    for (const fragment of LANDING_FRAGMENTS) {
      expect(landingFragmentHref(`${origin}/${fragment}`, origin)).toBe(`/${fragment}`)
    }
  })

  it('captures an initial deep link before hydration', () => {
    const { window } = bootstrap(`${origin}/#arquitetura`)
    expect(window.__taxsimLandingFragment?.pending).toBe('/#arquitetura')
    expect(bootstrap().window.__taxsimLandingFragment?.pending).toBeNull()
  })

  it('uses the native event destination even after location lost its fragment', () => {
    const { window, context, change } = bootstrap()
    change(`${origin}/#produto`)
    expect(context.location.href).toBe(`${origin}/`)
    expect(window.__taxsimLandingFragment?.pending).toBe('/#produto')
  })

  it('consumes a pending fragment exactly once', () => {
    const { window, change } = bootstrap()
    change(`${origin}/#qualidade`)
    expect(takeLandingFragment(window.__taxsimLandingFragment, origin)).toBe('/#qualidade')
    expect(takeLandingFragment(window.__taxsimLandingFragment, origin)).toBeNull()
  })

  it('rejects private, unknown and external destinations', () => {
    const { window, change } = bootstrap()
    for (const value of [
      '/dashboard#produto',
      '/#unknown',
      '//other.example/#produto',
      'javascript:alert(1)',
      'http://[',
    ]) {
      expect(landingFragmentHref(value, origin)).toBeNull()
      change(value)
      expect(window.__taxsimLandingFragment?.pending).toBeNull()
    }
  })

  it('preserves queries and an explicit return to the root without a fragment', () => {
    const { window, change } = bootstrap()
    change(`${origin}/?example=1#produto`)
    expect(takeLandingFragment(window.__taxsimLandingFragment, origin)).toBe('/?example=1#produto')
    change(`${origin}/`)
    expect(takeLandingFragment(window.__taxsimLandingFragment, origin)).toBe('/')
  })

  it('installs once without history patches, timers or persistent storage', () => {
    // None of these browser APIs is supplied to the VM; any access would fail.
    const { context, listeners } = bootstrap()
    runInNewContext(LANDING_FRAGMENT_CAPTURE, context)
    expect(listeners).toHaveLength(1)
  })
})
