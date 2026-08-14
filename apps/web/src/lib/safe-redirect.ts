const DEFAULT_REDIRECT = '/dashboard'

/**
 * Validates a redirectTo value coming from a query string, ensuring only
 * safe relative paths within the app itself are accepted.
 * Rejects: absolute URLs, protocol-relative URLs (//host), dangerous
 * schemes (javascript:, data:), and backslashes that some browsers
 * normalize as forward slashes.
 */
export function safeRedirectPath(value: string | null): string {
  if (!value) return DEFAULT_REDIRECT

  // Must start with exactly one slash (not two, not zero)
  if (!value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_REDIRECT
  }

  // Backslashes can be normalized as forward slashes by some browsers
  if (value.includes('\\')) {
    return DEFAULT_REDIRECT
  }

  // Any scheme (javascript:, data:, etc) before valid path characters
  // is rejected
  if (/^\/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    return DEFAULT_REDIRECT
  }

  return value
}
