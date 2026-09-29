export interface AxeException {
  ruleId: string
  route: string
  project: 'chromium-desktop' | 'chromium-mobile'
  target: string
  justification: string
  expiresOn: string
}

/**
 * Intentionally empty. Every exception must identify one rule, route, project
 * and exact axe target, plus a justification and ISO expiry date.
 */
export const axeAllowlist: AxeException[] = []
