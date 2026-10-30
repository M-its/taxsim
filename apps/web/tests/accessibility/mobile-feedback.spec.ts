import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import fixture from '../../src/lib/landing-example.json'

test('comparativo mantém valores dentro de cada caixa nas larguras intermediárias', async ({
  page,
}) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const comparison = page.getByRole('region', { name: fixture.scenario.product })
  for (const width of [320, 379, 380, 390, 400, 480, 520, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 })
    for (const amount of ['R$ 272,50', 'R$ 10,00']) {
      const total = comparison.getByText(amount, { exact: true })
      await expect(total).toBeVisible()
      const bounds = await total.evaluate((element) => {
        const range = document.createRange()
        range.selectNodeContents(element)
        const text = range.getBoundingClientRect()
        const parent = element.parentElement!
        const box = parent.getBoundingClientRect()
        const style = getComputedStyle(parent)
        return {
          textLeft: text.left,
          textRight: text.right,
          contentLeft: box.left + parseFloat(style.paddingLeft),
          contentRight: box.right - parseFloat(style.paddingRight),
          scrollWidth: parent.scrollWidth,
          clientWidth: parent.clientWidth,
        }
      })
      expect(
        bounds.textLeft,
        `${width}px: ${amount} começa dentro da caixa`,
      ).toBeGreaterThanOrEqual(bounds.contentLeft - 1)
      expect(bounds.textRight, `${width}px: ${amount} termina dentro da caixa`).toBeLessThanOrEqual(
        bounds.contentRight + 1,
      )
      expect(bounds.scrollWidth, `${width}px: sem overflow interno`).toBeLessThanOrEqual(
        bounds.clientWidth,
      )
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    )
  }
})

for (const failure of ['network', 'unavailable'] as const) {
  test(`cadastro distingue falha ${failure} de validação e permite reenvio manual`, async ({
    page,
  }, testInfo) => {
    await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
    let submissions = 0
    await page.route('**/auth/register', (route) => {
      submissions += 1
      if (failure === 'network') return route.abort('failed')
      return route.fulfill({
        status: 503,
        json: { error: { code: 'UNAVAILABLE', message: 'Detalhe interno não deve aparecer' } },
      })
    })
    await page.goto('/register')
    const values = {
      companyName: 'Empresa preservada',
      document: '11222333000181',
      municipioCode: '3550308',
      uf: 'SP',
      userName: 'Pessoa de teste',
      email: 'feedback@taxsim.test',
      password: 'FeedbackTest!2026',
    }
    for (const [field, value] of Object.entries(values)) await page.locator(`#${field}`).fill(value)
    const submit = page.getByRole('button', { name: 'Criar conta', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    const alert = page.locator('form').getByRole('alert')
    await expect(alert).toContainText('Não foi possível criar a conta.')
    await expect(alert).not.toContainText('Revise os campos')
    await expect(alert).not.toContainText('Detalhe interno')
    await expect(alert).toContainText(
      failure === 'network'
        ? 'Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.'
        : 'O serviço está indisponível no momento. Tente novamente em instantes.',
    )
    await expect(alert).toBeFocused()
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0)
    for (const field of [
      'companyName',
      'municipioCode',
      'uf',
      'userName',
      'email',
      'password',
    ] as const)
      await expect(page.locator(`#${field}`)).toHaveValue(values[field])
    await expect(submit).toBeEnabled()
    expect(submissions).toBe(1)
    await page.locator('#password').press('Enter')
    await expect.poll(() => submissions).toBe(2)
    await expect(alert).toBeVisible()
    await expect(submit).toBeEnabled()
    await expectNoBlockingAxeViolations(page, testInfo, `register-${failure}`)
  })
}

test('cadastro mantém resumo e foco para erros reais de preenchimento', async ({ page }) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  let submissions = 0
  await page.route('**/auth/register', (route) => {
    submissions += 1
    return route.fulfill({ status: 500, json: {} })
  })
  await page.goto('/register')
  const submit = page.getByRole('button', { name: 'Criar conta', exact: true })
  await expect(submit).toBeEnabled()
  await submit.click()
  const alert = page.locator('form').getByRole('alert')
  await expect(alert).toContainText('Revise os campos indicados:')
  await expect(alert).toContainText('Nome da empresa é obrigatório.')
  await expect(alert).not.toContainText('Não foi possível criar a conta.')
  await expect(page.locator('#companyName')).toBeFocused()
  await expect(page.locator('#companyName')).toHaveAttribute('aria-invalid', 'true')
  expect(submissions).toBe(0)
})
