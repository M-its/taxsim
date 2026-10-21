import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

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
