import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

const longName = 'Nome de demonstração '.repeat(8)
const longEmail = `${'muito-longo-'.repeat(12)}@taxsim.test`
const profile = {
  user: {
    id: 'polish',
    companyId: 'polish-company',
    name: longName,
    email: longEmail,
    role: 'OWNER',
  },
  company: {
    id: 'polish-company',
    name: longName,
    document: '11222333000181',
    taxRegime: 'LUCRO_REAL',
    municipioCode: 3550308,
    uf: 'SP',
  },
}
const captureDir = process.env.TAXSIM_CAPTURE_DIR

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('taxsim:onboarding:polish:completed:v1', 'true'),
  )
  // Mock every API URL. This suite must never read or mutate real tenant data.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (!['3333', '3339'].includes(url.port)) return route.continue()
    if (url.pathname === '/auth/refresh')
      return route.fulfill({ json: { accessToken: 'fixture-token' } })
    if (url.pathname === '/auth/me') return route.fulfill({ json: profile })
    if (['/products', '/clients', '/sales'].includes(url.pathname))
      return route.fulfill({
        json: {
          data: [],
          pagination: {
            page: Number(url.searchParams.get('page') ?? 1),
            limit: 20,
            total: 40,
            totalPages: 2,
          },
          metadata: { ncmCatalogVersion: '2026-10-12' },
        },
      })
    return route.fulfill({ status: 404, json: {} })
  })
})

test('topbar e menu suportam toque e textos longos sem cortar informações', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/products')
  const menuButton = page.getByRole('button', { name: 'Abrir menu', exact: true })
  const userButton = page.getByRole('button', { name: 'Abrir menu do usuário' })
  for (const button of [menuButton, userButton]) {
    await expect(button).toBeVisible()
    const box = (await button.boundingBox())!
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
  await userButton.focus()
  await page.keyboard.press('Enter')
  const popup = page.locator('[data-slot="dropdown-menu-content"]')
  await expect(popup).toBeVisible()
  await expect(popup).toContainText(longEmail)
  expect(await popup.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
  const box = (await popup.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(320)
  await expectNoBlockingAxeViolations(page, testInfo, 'menu-textos-longos')
  if (captureDir)
    await page.screenshot({ path: join(captureDir, `app-menu-${testInfo.project.name}.png`) })
  await page.keyboard.press('Escape')
  await expect(userButton).toBeFocused()
})

test('buscas persistentes, ações distinguíveis e paginação móvel nos três cadastros', async ({
  page,
}, testInfo) => {
  for (const [path, searchName, createName] of [
    ['/products', 'Buscar produtos', 'Novo Produto'],
    ['/customers', 'Buscar clientes', 'Novo Cliente'],
    ['/sales', '', ''],
  ]) {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto(path)
    await expect(page.getByRole('button', { name: 'Próxima' })).toBeEnabled()
    if (searchName) {
      const search = page.getByLabel(searchName)
      await expect(search).toBeVisible()
      await search.fill('Exemplo')
      await expect(page.getByText(searchName, { exact: true })).toBeVisible()
      const create = page.getByRole('button', { name: createName, exact: true })
      expect(await create.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        'rgb(52, 211, 153)',
      )
      await create.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const save = page.getByRole('dialog').getByRole('button', { name: 'Cadastrar', exact: true })
      expect(await save.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        'rgb(52, 211, 153)',
      )
      await expectNoBlockingAxeViolations(page, testInfo, `${path.slice(1)}-criacao-polida`)
      await page.keyboard.press('Escape')
      await expect(create).toBeFocused()
    }
    await expectNoBlockingAxeViolations(page, testInfo, `${path.slice(1)}-paginacao-polida`)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    const next = (await page.getByRole('button', { name: 'Próxima' }).boundingBox())!
    expect(next.x + next.width).toBeLessThanOrEqual(320)
    if (captureDir)
      await page.screenshot({
        path: join(captureDir, `app-${path.slice(1)}-${testInfo.project.name}.png`),
        fullPage: true,
      })
    await page.getByRole('button', { name: 'Próxima' }).click()
    await expect(page.getByText('Página 2 de 2')).toBeVisible()
    await page.getByRole('button', { name: 'Anterior' }).click()
    await expect(page.getByText('Página 1 de 2')).toBeVisible()
  }
})
