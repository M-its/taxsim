import { describe, expect, it } from 'vitest'
import { markTourCompleted, shouldStartTour, type TourStorage } from './onboarding-tour'

function createMemoryStorage(): TourStorage {
  const values = new Map<string, string>()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('onboarding tour persistence', () => {
  it('starts automatically on the first authenticated access', () => {
    const storage = createMemoryStorage()

    expect(shouldStartTour(storage, 'user-1', 'automatic')).toBe(true)
  })

  it('does not start automatically again after being completed or dismissed', () => {
    const storage = createMemoryStorage()
    markTourCompleted(storage, 'user-1')

    expect(shouldStartTour(storage, 'user-1', 'automatic')).toBe(false)
  })

  it('allows the always-visible help button to reopen a completed tour', () => {
    const storage = createMemoryStorage()
    markTourCompleted(storage, 'user-1')

    expect(shouldStartTour(storage, 'user-1', 'manual')).toBe(true)
  })
})
