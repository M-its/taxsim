import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate } from './helpers'

test('vendas: filtro, detalhes e ações', async ({ page }, testInfo) => {
  await authenticate(page, '/sales')
  await expect(page.getByRole('table')).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'vendas-lista')

  await page.getByLabel('Filtrar por status').click()
  await page.getByRole('option', { name: 'Confirmada' }).click()
  await expect(
    page.getByRole('table').getByText('Confirmada', { exact: true }).first(),
  ).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'vendas-filtro')

  await page.getByLabel('Filtrar por status').click()
  await page.getByRole('option', { name: 'Rascunho' }).click()
  const details = page.getByRole('button', { name: /Ver detalhes da venda/ }).first()
  await details.click()
  await expect(page.getByRole('dialog')).toContainText('Detalhamento completo da venda')
  await expectNoBlockingAxeViolations(page, testInfo, 'vendas-detalhes')
  await page.getByRole('button', { name: 'Fechar' }).click()

  const confirm = page.getByRole('button', { name: /Confirmar venda/ }).first()
  await confirm.click()
  await expect(page.getByText(/Venda .* confirmada/)).toBeVisible()

  const cancel = page.getByRole('button', { name: /Cancelar venda/ }).first()
  await cancel.click()
  const finalCancel = page.getByRole('button', { name: /Confirmar cancelamento da venda/ })
  await expect(finalCancel).toBeVisible()
  await finalCancel.click()
  await expect(page.getByText(/Venda .* cancelada/)).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'vendas-acoes')
})
