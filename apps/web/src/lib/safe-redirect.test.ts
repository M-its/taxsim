import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from './safe-redirect'

describe('safeRedirectPath (Finding 2 - open redirect / DOM XSS protection)', () => {
  it('returns the default path when value is null', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard')
  })

  it('accepts a normal relative path', () => {
    expect(safeRedirectPath('/products')).toBe('/products')
  })

  it('rejects protocol-relative URLs (//host)', () => {
    expect(safeRedirectPath('//attacker.com')).toBe('/dashboard')
  })

  it('rejects javascript: scheme', () => {
    expect(safeRedirectPath('/javascript:alert(1)')).toBe('/dashboard')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/dashboard')
  })

  it('rejects data: scheme', () => {
    expect(safeRedirectPath('/data:text/html,<script>alert(1)</script>')).toBe('/dashboard')
  })

  it('rejects absolute URLs to another origin', () => {
    expect(safeRedirectPath('https://attacker.com')).toBe('/dashboard')
  })

  it('rejects backslash paths that browsers may normalize as forward slashes', () => {
    expect(safeRedirectPath('/\\attacker.com')).toBe('/dashboard')
  })

  it('rejects empty string', () => {
    expect(safeRedirectPath('')).toBe('/dashboard')
  })

  it('rejects a path without a leading slash', () => {
    expect(safeRedirectPath('dashboard')).toBe('/dashboard')
  })
})
