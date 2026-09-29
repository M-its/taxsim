import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, type TestInfo } from '@playwright/test'
import { axeAllowlist } from './allowlist'

const blockingImpacts = new Set(['serious', 'critical'])

function targetKey(target: unknown[]): string {
  return target.map(String).join(' > ')
}

function isAllowed(
  ruleId: string,
  route: string,
  project: string,
  target: unknown[],
): boolean {
  return axeAllowlist.some(
    (entry) =>
      entry.ruleId === ruleId &&
      entry.route === route &&
      entry.project === project &&
      entry.target === targetKey(target) &&
      Date.parse(entry.expiresOn) >= Date.now(),
  )
}

export async function expectNoBlockingAxeViolations(
  page: Page,
  testInfo: TestInfo,
  state: string,
): Promise<void> {
  // Axe must inspect loaded, settled UI rather than a transient opacity frame.
  await page
    .locator('[aria-busy="true"]')
    .first()
    .waitFor({ state: 'detached', timeout: 10_000 })
    .catch(() => {})
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll<HTMLElement>('[style*="will-change"]'))
        .filter((element) => element.getClientRects().length > 0)
        .every((element) => Number.parseFloat(getComputedStyle(element).opacity) >= 0.99),
    undefined,
    { timeout: 10_000 },
  )
  const results = await new AxeBuilder({ page }).analyze()
  const route = new URL(page.url()).pathname
  const blocking = results.violations
    .filter((violation) => violation.impact && blockingImpacts.has(violation.impact))
    .map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter(
        (node) => !isAllowed(violation.id, route, testInfo.project.name, node.target),
      ),
    }))
    .filter((violation) => violation.nodes.length > 0)

  await testInfo.attach(`axe-${state.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`, {
    body: JSON.stringify(
      {
        url: page.url(),
        state,
        project: testInfo.project.name,
        violations: results.violations,
      },
      null,
      2,
    ),
    contentType: 'application/json',
  })

  const details = blocking
    .flatMap((violation) =>
      violation.nodes.map(
        (node) =>
          `${violation.impact}: ${violation.id} — ${violation.help}\n` +
          `  alvo: ${targetKey(node.target)}\n  correção: ${node.failureSummary ?? 'não informada'}`,
      ),
    )
    .join('\n\n')

  expect(blocking, details || 'Nenhuma violação séria/crítica encontrada.').toEqual([])
}
