import { describe, expect, it } from 'vitest'
import { ncmValidityDate } from './ncm-validity-date'

describe('ncmValidityDate', () => {
  it('uses the new São Paulo date immediately after local midnight', () => {
    const justAfterLocalMidnight = new Date('2026-09-24T03:00:01.000Z')

    expect(ncmValidityDate(justAfterLocalMidnight).toISOString()).toBe(
      '2026-09-24T00:00:00.000Z',
    )
  })

  it('keeps the previous São Paulo date immediately before local midnight', () => {
    const justBeforeLocalMidnight = new Date('2026-09-24T02:59:59.999Z')

    expect(ncmValidityDate(justBeforeLocalMidnight).toISOString()).toBe(
      '2026-09-23T00:00:00.000Z',
    )
  })

  it('uses the IANA time zone rules instead of assuming a fixed UTC-3 offset', () => {
    const historicalSummerTime = new Date('2019-01-15T02:30:00.000Z')

    expect(ncmValidityDate(historicalSummerTime).toISOString()).toBe(
      '2019-01-15T00:00:00.000Z',
    )
  })
})
