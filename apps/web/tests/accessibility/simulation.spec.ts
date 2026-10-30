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

  test('clique de calcular mantém o alvo entre pressionar e soltar com autocomplete aberto', async ({
    page,
  }, testInfo) => {
    const calculatorRequests: string[] = []
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/sales/simulate') {
        calculatorRequests.push(request.url())
      }
    })
    await authenticate(page, '/simulation')
    await page.getByRole('button', { name: 'Adicionar item' }).click()
    const product = page.getByRole('combobox', { name: 'Produto' }).nth(1)
    await expect(product).toBeFocused()
    await expect(product).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('option', { name: /Notebook de Teste/ })).toBeVisible()
    await expect(page.getByRole('option', { name: /Teclado de Teste/ })).toBeVisible()

    const submit = page.getByRole('button', { name: 'Calcular simulação' })
    await submit.scrollIntoViewIfNeeded()
    const before = await submit.boundingBox()
    expect(before).not.toBeNull()
    const point = { x: before!.x + before!.width / 2, y: before!.y + before!.height / 2 }
    await page.mouse.move(point.x, point.y)
    await page.mouse.down()
    try {
      // Closing an inline list on mousedown must not move the submit target
      // before mouseup. Use real pointer events, without force or retries.
      await expect(product).toBeFocused()
      const pressed = await submit.boundingBox()
      expect(pressed).not.toBeNull()
      expect(pressed!.x).toBeCloseTo(before!.x, 0)
      // The shared button deliberately moves 1px while :active. That existing
      // feedback is fine; collapsing the list must not displace the click.
      expect(Math.abs(pressed!.y - before!.y)).toBeLessThanOrEqual(1)
      expect(point.y).toBeGreaterThan(pressed!.y)
      expect(point.y).toBeLessThan(pressed!.y + pressed!.height)
    } finally {
      await page.mouse.up()
    }
    await expect(page.getByText('2 itens precisam de correção')).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Produto' }).first()).toBeFocused()
    await expect(page.getByRole('combobox', { name: 'Produto' }).first()).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    await expect(product).toHaveAttribute('aria-invalid', 'true')
    await expectNoBlockingAxeViolations(page, testInfo, 'simulacao-clique-com-autocomplete')
    expect(calculatorRequests).toEqual([])
  })

  test('calcular por teclado mantém validação e foco com autocomplete aberto', async ({ page }) => {
    await authenticate(page, '/simulation')
    await page.getByRole('button', { name: 'Adicionar item' }).click()
    const products = page.getByRole('combobox', { name: 'Produto' })
    await expect(products.nth(1)).toBeFocused()
    await expect(products.nth(1)).toHaveAttribute('aria-expanded', 'true')
    const submit = page.getByRole('button', { name: 'Calcular simulação' })
    await submit.focus()
    await expect(products.nth(1)).toHaveAttribute('aria-expanded', 'false')
    await submit.press('Enter')
    await expect(page.getByText('2 itens precisam de correção')).toBeVisible()
    await expect(products.first()).toBeFocused()
    await expect(products.first()).toHaveAttribute('aria-invalid', 'true')
    await expect(products.nth(1)).toHaveAttribute('aria-invalid', 'true')
  })
})
