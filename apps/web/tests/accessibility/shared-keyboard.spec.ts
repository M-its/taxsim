import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate } from './helpers'

test('sidebar expandida e recolhida por teclado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'chromium-mobile', 'Coberto pelo cenário de drawer móvel')
  await authenticate(page)
  const collapse = page.getByRole('button', { name: 'Recolher menu' })
  await collapse.focus()
  await collapse.press('Enter')
  await expect(page.getByRole('button', { name: 'Expandir menu' })).toBeFocused()
  await expectNoBlockingAxeViolations(page, testInfo, 'sidebar-recolhida')
  await page.getByRole('button', { name: 'Expandir menu' }).press('Enter')
  await expect(page.getByRole('button', { name: 'Recolher menu' })).toBeVisible()
})

test('drawer móvel contém e restaura o foco', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'Específico do viewport móvel')
  await authenticate(page)
  const opener = page.getByRole('button', { name: 'Abrir menu', exact: true })
  await opener.focus()
  await opener.press('Enter')

  const drawer = page.getByRole('dialog', { name: 'Menu principal' })
  await expect(drawer).toBeVisible()
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(drawer.getByRole('link', { name: 'Configurações' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeFocused()
  await expectNoBlockingAxeViolations(page, testInfo, 'drawer-movel')

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(opener).toBeFocused()
})

test('dialog abre e fecha preservando a ordem de foco', async ({ page }) => {
  await authenticate(page, '/products')
  const opener = page.getByRole('button', { name: 'Novo Produto' })
  await opener.focus()
  await opener.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Novo Produto' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Nome')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})
