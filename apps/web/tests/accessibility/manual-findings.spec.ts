import { expect, test, type Page } from '@playwright/test'
import { authenticate } from './helpers'
import { expectNoBlockingAxeViolations } from './axe'

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(1)
}

test('adicionar item move o foco no catálogo e no modo manual', async ({ page }) => {
  await authenticate(page, '/simulation')
  const add = page.getByRole('button', { name: 'Adicionar item' })
  await add.focus()
  await add.press('Enter')
  await expect(page.getByRole('combobox', { name: 'Produto' }).last()).toBeFocused()
  await page.getByRole('button', { name: 'NCM manual', exact: true }).last().click()
  await add.focus()
  await add.press('Enter')
  await expect(page.getByRole('combobox', { name: 'Código NCM' }).last()).toBeFocused()
})

for (const route of ['/simulation', '/products']) {
  test(`${route}: setas mantêm a opção NCM ativa dentro da lista`, async ({ page }) => {
    await authenticate(page, route)
    await page.route('**/ncm/search?**', async (request) =>
      request.fulfill({
        json: Array.from({ length: 10 }, (_, index) => ({
          code: `847130${String(index).padStart(2, '0')}`,
          description: `Opção ${index + 1}: descrição longa para testar a navegação na lista de NCM`,
          status: 'ELIGIBLE',
        })),
      }),
    )
    if (route === '/products') {
      await page.getByRole('button', { name: 'Novo Produto' }).click()
    } else {
      await page.getByRole('button', { name: 'NCM manual', exact: true }).click()
    }
    const ncm = page.getByRole('combobox', { name: 'Código NCM', exact: true })
    await ncm.fill('847130')
    await expect(page.getByRole('option')).toHaveCount(10)
    for (let index = 0; index < 10; index++) await ncm.press('ArrowDown')
    const last = page.getByRole('option').last()
    await expect(last).toHaveAttribute('aria-selected', 'true')
    await expect(ncm).toBeFocused()
    await expect
      .poll(() =>
        last.evaluate((option) => {
          const list = option.closest('[role="listbox"]')!.getBoundingClientRect()
          const rect = option.getBoundingClientRect()
          return rect.top >= list.top && rect.bottom <= list.bottom
        }),
      )
      .toBe(true)
    for (let index = 0; index < 9; index++) await ncm.press('ArrowUp')
    await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
    await expect.poll(() => page.getByRole('listbox').evaluate((list) => list.scrollTop)).toBe(0)
  })
}

test('simulação com reflow em 320 CSS px, incluindo resultado', async ({ page }, testInfo) => {
  // 1280 / 400% = 320 CSS px; deviceScaleFactor não simula reflow de zoom.
  await page.setViewportSize({ width: 320, height: 800 })
  await authenticate(page, '/simulation')
  await expectNoHorizontalOverflow(page)
  const product = page.getByRole('combobox', { name: 'Produto', exact: true })
  await product.fill('Notebook')
  await page.getByRole('option').first().click()
  await expectNoHorizontalOverflow(page)
  await page.getByRole('button', { name: 'Calcular simulação' }).click()
  await expect(page.getByRole('heading', { name: 'IVA Dual (Reforma)' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
  await expect(
    page.locator('[data-tour="simulation-results"] [data-slot="card"]').last().locator('..'),
  ).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-tour="simulation-results"] > div > div').last()).toHaveCSS(
    'opacity',
    '1',
  )
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await page.screenshot({ path: testInfo.outputPath('simulation-reflow-320.png'), fullPage: true })
  await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-reflow-320')
  await page.getByRole('button', { name: 'NCM manual', exact: true }).click()
  await page.getByRole('combobox', { name: 'Código NCM' }).fill('123')
  await page.getByRole('button', { name: 'Calcular simulação' }).click()
  await expect(page.getByText('1 item precisa de correção antes da simulação.')).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test('botões de ação não se deslocam ao passar o ponteiro', async ({ page }) => {
  await authenticate(page, '/simulation')
  const button = page.getByRole('button', { name: 'Calcular simulação' })
  await button.scrollIntoViewIfNeeded()
  await expect(page.locator('form')).toHaveCSS('transform', 'none')
  const before = await button.boundingBox()
  await button.hover()
  await expect.poll(() => button.boundingBox()).toEqual(before)
  await expect(button).toHaveCSS('translate', 'none')
})

for (const [route, name] of [
  ['/products', 'Novo Produto'],
  ['/customers', 'Novo Cliente'],
]) {
  test(`${name}: foco inicial explícito e retorno ao abrir com mouse`, async ({ page }) => {
    await authenticate(page, route)
    const opener = page.getByRole('button', { name, exact: true })
    await opener.click()
    const dialog = page.getByRole('dialog', { name, exact: true })
    await expect(dialog.getByLabel('Nome', { exact: true })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })
}
