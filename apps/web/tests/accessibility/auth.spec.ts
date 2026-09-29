import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate } from './helpers'

test.describe('login', () => {
  test('estado inicial', async ({ page }, testInfo) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar no TaxSim' })).toBeVisible()
    await expectNoBlockingAxeViolations(page, testInfo, 'login-inicial')
  })

  test('erros do formulário', async ({ page }, testInfo) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByText('Revise os dados para entrar')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Senha')).toHaveAttribute('aria-invalid', 'true')
    await expectNoBlockingAxeViolations(page, testInfo, 'login-erros')
  })

  test('sessão autenticada redireciona para o dashboard', async ({ page }, testInfo) => {
    await authenticate(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 })
    await expectNoBlockingAxeViolations(page, testInfo, 'login-sessao-autenticada')
  })
})

test.describe('cadastro', () => {
  test('formulário inicial e erros', async ({ page }, testInfo) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { level: 1, name: 'Criar conta no TaxSim' })).toBeVisible()
    await expectNoBlockingAxeViolations(page, testInfo, 'cadastro-inicial')

    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page.getByText('Revise os campos indicados')).toBeVisible()
    await expect(page.getByLabel('Nome da empresa')).toHaveAttribute('aria-invalid', 'true')
    await expectNoBlockingAxeViolations(page, testInfo, 'cadastro-erros')
  })
})
