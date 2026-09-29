import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate, projectSuffix } from './helpers'

test('produtos: lista, busca, criação e edição em dialog', async ({ page }, testInfo) => {
  const suffix = projectSuffix(testInfo.project.name)
  const productName = `Produto acessível ${suffix}`
  await authenticate(page, '/products')
  await expect(page.getByText('Notebook de Teste', { exact: true })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'produtos-lista')

  const search = page.getByPlaceholder('Buscar por nome ou SKU...')
  await search.fill('Teclado')
  await expect(page.getByText('Teclado de Teste', { exact: true })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'produtos-busca')
  await search.clear()

  await page.getByRole('button', { name: 'Novo Produto' }).click()
  await expect(page.getByRole('dialog', { name: 'Novo Produto' })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'produtos-dialog-criacao')
  await page.getByLabel('Nome').fill(productName)
  await page.getByLabel('SKU').fill(`A11Y-${suffix.toUpperCase()}`)
  const ncm = page.getByRole('combobox', { name: 'NCM' })
  await ncm.fill('84713012')
  await page.getByRole('option').first().click()
  await page.getByLabel('Preço Unitário').fill('12345')
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByText(productName, { exact: true })).toBeVisible()

  const row = page.getByRole('row').filter({ hasText: productName })
  await row.getByRole('button', { name: 'Editar' }).click()
  await expect(page.getByRole('dialog', { name: 'Editar Produto' })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'produtos-dialog-edicao')
  await page.getByLabel('Nome').fill(`${productName} editado`)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText(`${productName} editado`, { exact: true })).toBeVisible()
})

test('clientes: lista, busca, criação e edição em dialog', async ({ page }, testInfo) => {
  const suffix = projectSuffix(testInfo.project.name)
  const clientName = `Cliente acessível ${suffix}`
  const document = suffix === 'mobile' ? '11144477735' : '00.000.000/e08g-12'
  await authenticate(page, '/customers')
  await expect(page.getByText('Cliente de Teste', { exact: true })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'clientes-lista')

  await page.getByPlaceholder('Buscar por nome ou documento...').fill('Cliente de Teste')
  await expect(page.getByText('Cliente de Teste', { exact: true })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'clientes-busca')
  await page.getByPlaceholder('Buscar por nome ou documento...').clear()

  await page.getByRole('button', { name: 'Novo Cliente' }).click()
  await expect(page.getByRole('dialog', { name: 'Novo Cliente' })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'clientes-dialog-criacao')
  await page.getByLabel('Nome').fill(clientName)
  await page.getByLabel('Documento').fill(document)
  await page.getByLabel('E-mail').fill(`${suffix}@taxsim.test`)
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page.getByText(clientName, { exact: true })).toBeVisible()

  const row = page.getByRole('row').filter({ hasText: clientName })
  await row.getByRole('button', { name: 'Editar' }).click()
  await expect(page.getByRole('dialog', { name: 'Editar Cliente' })).toBeVisible()
  await expectNoBlockingAxeViolations(page, testInfo, 'clientes-dialog-edicao')
  await page.getByLabel('Nome').fill(`${clientName} editado`)
  await page.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByText(`${clientName} editado`, { exact: true })).toBeVisible()
})
