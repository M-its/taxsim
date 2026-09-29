import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate } from './helpers'

test.describe('simulação', () => {
  test('catálogo, teclado e resultado determinístico', async ({ page }, testInfo) => {
    await authenticate(page, '/simulation')
    const product = page.getByRole('combobox', { name: 'Produto' })
    await product.fill('Notebook')
    await expect(page.getByRole('option')).toContainText('Notebook de Teste')
    await product.press('ArrowDown')
    await product.press('Enter')
    await expect(page.getByText('Notebook de Teste', { exact: true })).toBeVisible()
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-catalogo')

    await page.getByRole('button', { name: 'Calcular simulação' }).click()
    await expect(page.getByRole('heading', { name: 'Regime Atual' })).toBeVisible()
    await expect(
      page.getByText('Simulação concluída. O comparativo tributário está disponível.'),
    ).toBeVisible()
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-resultado')
  })

  test('NCM manual operado por teclado', async ({ page }, testInfo) => {
    await authenticate(page, '/simulation')
    const manualMode = page.getByRole('button', { name: 'NCM manual' })
    await manualMode.focus()
    await manualMode.press('Space')
    await expect(manualMode).toHaveAttribute('aria-pressed', 'true')

    const ncm = page.getByRole('combobox', { name: 'Código NCM' })
    await ncm.fill('84716052')
    await expect(page.getByRole('option')).toContainText('84716052')
    await ncm.press('ArrowDown')
    await ncm.press('Enter')
    await page.getByLabel('Preço Unitário (R$)').fill('15000')
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-ncm-manual')

    await page.getByRole('button', { name: 'Calcular simulação' }).click()
    await expect(page.getByRole('heading', { name: 'IVA Dual (Reforma)' })).toBeVisible()
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-manual-resultado')
  })

  test('múltiplos itens inválidos', async ({ page }, testInfo) => {
    await authenticate(page, '/simulation')
    await page.getByRole('button', { name: 'Adicionar item' }).click()
    await page.getByRole('button', { name: 'Calcular simulação' }).click()
    await expect(page.getByText('2 itens precisam de correção')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Produto' }).first()).toBeFocused()
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-multiplos-erros')
  })
})
