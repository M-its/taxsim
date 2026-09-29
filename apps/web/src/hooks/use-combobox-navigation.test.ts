import { describe, expect, it } from 'vitest'
import { nextComboboxIndex } from './use-combobox-navigation'

describe('combobox keyboard navigation', () => {
  it('wraps arrow navigation through every option', () => {
    expect(nextComboboxIndex(-1, 3, 'ArrowDown')).toBe(0)
    expect(nextComboboxIndex(0, 3, 'ArrowDown')).toBe(1)
    expect(nextComboboxIndex(2, 3, 'ArrowDown')).toBe(0)
    expect(nextComboboxIndex(0, 3, 'ArrowUp')).toBe(2)
  })

  it('supports Home and End and handles an empty list', () => {
    expect(nextComboboxIndex(1, 4, 'Home')).toBe(0)
    expect(nextComboboxIndex(1, 4, 'End')).toBe(3)
    expect(nextComboboxIndex(0, 0, 'ArrowDown')).toBe(-1)
  })
})
