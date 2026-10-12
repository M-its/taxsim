import { describe, expect, it, vi } from 'vitest'
import fixture from '../../web/src/lib/landing-example.json'
import { calculateLandingExample } from './landing-example.js'

describe('versioned landing proof', () => {
  it('recalculates every displayed value with the real engine and response mapper, without fetch', () => {
    const fetch = vi.fn(() => {
      throw new Error('External requests forbidden')
    })
    vi.stubGlobal('fetch', fetch)
    try {
      expect(calculateLandingExample()).toEqual(fixture.display)
      expect(fetch).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
  it('rejects a nonexistent NCM using the same simulation eligibility guard', () => {
    const changed = structuredClone(fixture)
    changed.scenario.ncmCode = '99999999'
    expect(() => calculateLandingExample(changed)).toThrow(/NCM não elegível/)
  })
  it('rejects a current NCM with no active rule rather than inventing a landing exception', () => {
    const changed = structuredClone(fixture)
    changed.scenario.ncmCode = '01012100'
    expect(() => calculateLandingExample(changed)).toThrow(/NCM não elegível/)
  })
  it('rejects an inconsistent reform total through the product mapper', () => {
    const changed = structuredClone(fixture)
    changed.reformResponse.total.tribCalc.IBSCBSTot.gCBS.vCBS = '99.00'
    expect(() => calculateLandingExample(changed)).toThrow(/validation failed/)
  })
  it('does not silently change the approved scenario', () => {
    expect(fixture.scenario).toMatchObject({
      ncmCode: '84713012',
      quantity: 1,
      unitPrice: '1000.00',
      taxRegime: 'LUCRO_REAL',
    })
  })
})
