import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import fixture from '../../src/lib/landing-example.json'

const captureDir = process.env.TAXSIM_CAPTURE_DIR

test('comparativo acessível, CTA móvel e reflow a 320px sem dependência fiscal externa', async ({
  page,
}, testInfo) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  const fiscalRequests: string[] = []
  page.on('request', (request) => {
    if (/\/sales\/simulate|\/calculadora\//.test(request.url())) fiscalRequests.push(request.url())
  })
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Do NCM à comparação tributária.' }),
  ).toBeVisible()
  const comparison = page.getByRole('region', { name: fixture.scenario.product })
  await expect(comparison).toBeVisible()
  await expect(comparison.getByText('R$ 272,50', { exact: true })).toBeVisible()
  await expect(comparison.getByText('R$ 10,00', { exact: true })).toBeVisible()
  await expect(
    comparison.getByText(
      'Exemplo didático com valores demonstrativos, sem validade fiscal e sem vínculo com a Receita Federal.',
    ),
  ).toBeVisible()
  await expect(comparison).toContainText(fixture.scenario.ncmCode)
  await expect(comparison).toContainText('Lucro Real')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://taxsim-web.duckdns.org',
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expectNoBlockingAxeViolations(page, testInfo, 'landing-prova')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.scrollTo(0, 0))
  if (captureDir) {
    await page.screenshot({
      path: join(captureDir, `landing-${testInfo.project.name}.png`),
      fullPage: true,
    })
    await page.screenshot({ path: join(captureDir, `hero-${testInfo.project.name}.png`) })
  }
  await page.setViewportSize({ width: 320, height: 844 })
  await expect(
    page.locator('header').getByRole('link', { name: 'Experimentar', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('header').getByRole('link', { name: 'Experimentar', exact: true }),
  ).toHaveAttribute('href', '/register')
  await expect(page.getByRole('link', { name: 'Entrar', exact: true }).first()).toHaveAttribute(
    'href',
    '/login',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  const proofTop = await comparison.evaluate(
    (element) => element.getBoundingClientRect().top + window.scrollY,
  )
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  expect(proofTop).toBeLessThan(pageHeight / 3)
  console.log(
    `Landing a 320px: ${pageHeight}px de altura; prova começa em ${Math.round(proofTop)}px.`,
  )
  await expectNoBlockingAxeViolations(page, testInfo, 'landing-320px')
  if (captureDir && testInfo.project.name === 'chromium-mobile')
    await page.screenshot({ path: join(captureDir, 'landing-320px.png'), fullPage: true })
  expect(fiscalRequests).toEqual([])
})

test('header e CTA permanecem estáveis ao confirmar a sessão', async ({ page }) => {
  let release!: () => void
  let refreshes = 0
  await page.route('**/auth/refresh', async (route) => {
    refreshes += 1
    await new Promise<void>((resolve) => {
      release = resolve
    })
    await route.fulfill({ json: { accessToken: 'landing-token' } })
  })
  await page.route('**/auth/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'landing-user',
          companyId: 'landing-company',
          name: 'Usuário demonstrativo',
          email: 'landing@taxsim.test',
          role: 'OWNER',
        },
        company: {
          id: 'landing-company',
          name: 'Empresa demonstrativa',
          document: '11222333000181',
          taxRegime: 'LUCRO_REAL',
          municipioCode: 3550308,
          uf: 'SP',
        },
      },
    }),
  )
  await page.goto('/')
  const primary = page.locator('header').getByRole('link', { name: /Experimentar/ })
  await expect(primary).toBeVisible()
  await expect.poll(() => refreshes).toBe(1)
  await page.evaluate(() => document.fonts.ready)
  const before = await primary.boundingBox()
  const headerBefore = await page.locator('header').boundingBox()
  const brand = await page.getByRole('link', { name: 'TaxSim — página inicial' }).boundingBox()
  expect(before).not.toBeNull()
  expect(brand).not.toBeNull()
  expect(Math.abs(before!.y + before!.height / 2 - brand!.y - brand!.height / 2)).toBeLessThan(1)
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  if (await navigation.isVisible()) {
    const nav = (await navigation.boundingBox())!
    expect(Math.abs(before!.y + before!.height / 2 - nav.y - nav.height / 2)).toBeLessThan(1)
  }
  release()
  await expect(page.locator('header').getByRole('link', { name: 'Ir ao dashboard' })).toBeVisible()
  expect(await primary.boundingBox()).toEqual(before)
  expect(await page.locator('header').boundingBox()).toEqual(headerBefore)
  await expect(primary).toHaveAttribute('href', '/register')
  await expect(page).toHaveURL(/\/$/)
})
