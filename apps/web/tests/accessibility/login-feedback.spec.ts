import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

for (const failure of ['network', 'unavailable', 'credentials'] as const) {
  test(`login distingue falha ${failure} de campos inválidos e preserva os dados`, async ({
    page,
  }, testInfo) => {
    let refreshes = 0
    let submissions = 0
    await page.route('**/auth/refresh', (route) => {
      refreshes += 1
      return route.fulfill({ status: 401, json: {} })
    })
    await page.route('**/auth/login', (route) => {
      submissions += 1
      if (failure === 'network') return route.abort('failed')
      return route.fulfill({
        status: failure === 'unavailable' ? 503 : 401,
        json: { error: { code: 'TEST_FAILURE', message: 'Detalhe interno não deve aparecer' } },
      })
    })
    await page.goto('/login')
    await page.getByLabel('E-mail', { exact: true }).fill('feedback@taxsim.test')
    await page.getByLabel('Senha', { exact: true }).fill('FeedbackTest!2026')
    const submit = page.getByRole('button', { name: 'Entrar', exact: true })
    await expect(submit).toBeEnabled()
    await submit.click()
    const alert = page.locator('form').getByRole('alert')
    await expect(alert).toContainText('Não foi possível entrar.')
    await expect(alert).not.toContainText('Revise os dados')
    await expect(alert).not.toContainText('Detalhe interno')
    await expect(alert).not.toContainText('refresh')
    await expect(alert).toContainText(
      failure === 'network'
        ? 'Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.'
        : failure === 'unavailable'
          ? 'O serviço está indisponível no momento. Tente novamente em instantes.'
          : 'E-mail ou senha inválidos.',
    )
    await expect(alert).toBeFocused()
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0)
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('feedback@taxsim.test')
    await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('FeedbackTest!2026')
    await expect(submit).toBeEnabled()
    expect(submissions).toBe(1)
    expect(refreshes).toBe(1)
    if (failure === 'network' && process.env.TAXSIM_CAPTURE_DIR)
      await page.screenshot({
        path: join(process.env.TAXSIM_CAPTURE_DIR, `login-network-${testInfo.project.name}.png`),
        fullPage: true,
      })
    await page.getByLabel('Senha', { exact: true }).press('Enter')
    await expect.poll(() => submissions).toBe(2)
    await expect(submit).toBeEnabled()
    await expect(alert).toBeFocused()
    expect(refreshes).toBe(1)
    await expectNoBlockingAxeViolations(page, testInfo, `login-${failure}`)
  })
}

test('login mantém validação inline e foco sem chamar a API para campos vazios', async ({
  page,
}) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  let submissions = 0
  await page.route('**/auth/login', (route) => {
    submissions += 1
    return route.fulfill({ status: 500, json: {} })
  })
  await page.goto('/login')
  const submit = page.getByRole('button', { name: 'Entrar', exact: true })
  await expect(submit).toBeEnabled()
  await submit.click()
  const alert = page.locator('form').getByRole('alert')
  await expect(alert).toContainText('Revise os dados para entrar:')
  await expect(alert).toContainText('Informe um e-mail válido.')
  await expect(alert).toContainText('Informe sua senha.')
  await expect(alert).not.toContainText('Não foi possível entrar.')
  await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused()
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  expect(submissions).toBe(0)
})
