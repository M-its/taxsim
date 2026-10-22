import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

test('login refoca erros idênticos em envios consecutivos sem roubar foco na edição', async ({
  page,
}, testInfo) => {
  let submissions = 0
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 401, json: {} }))
  await page.route('**/auth/login', (route) => {
    submissions += 1
    return route.abort('failed')
  })
  await page.goto('/login')
  const email = page.getByLabel('E-mail', { exact: true })
  const password = page.getByLabel('Senha', { exact: true })
  const submit = page.getByRole('button', { name: 'Entrar', exact: true })
  const alert = page.locator('form').getByRole('alert')
  await email.fill('focus@taxsim.test')
  await password.fill('FocusTest!2026')
  await expect(submit).toBeEnabled()

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await password.press('Enter')
    await expect.poll(() => submissions).toBe(attempt)
    await expect(submit).toBeEnabled()
    await expect(alert).toContainText('Não foi possível conectar ao serviço.')
    await expect(alert).toBeFocused()
    await expect(email).toHaveValue('focus@taxsim.test')
    await expect(password).toHaveValue('FocusTest!2026')

    // Editing a field rerenders the form but is not a new failed submission.
    await email.fill('focus-edited@taxsim.test')
    await expect(email).toBeFocused()
    await email.fill('focus@taxsim.test')
    await expect(email).toBeFocused()
  }

  await expectNoBlockingAxeViolations(page, testInfo, 'login-repeated-error-focus')
})
