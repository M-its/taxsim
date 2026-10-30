import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

const forms = [
  {
    path: '/login',
    title: 'Entrar no TaxSim',
    field: 'E-mail',
    value: 'preservar@taxsim.test',
    submit: 'Entrar',
  },
  {
    path: '/register',
    title: 'Criar conta no TaxSim',
    field: 'Nome da empresa',
    value: 'Empresa preservada',
    submit: 'Criar conta',
  },
]

for (const form of forms) {
  test(`${form.path}: formulário disponível durante restauração sem envio prematuro`, async ({
    page,
  }, testInfo) => {
    let release = () => {}
    let refreshes = 0
    let submissions = 0
    await page.route('**/auth/refresh', async (route) => {
      refreshes += 1
      await new Promise<void>((resolve) => {
        release = resolve
      })
      await route.fulfill({ status: 401, json: {} })
    })
    for (const path of ['/auth/login', '/auth/register']) {
      await page.route(`**${path}`, (route) => {
        submissions += 1
        return route.fulfill({ status: 500, json: {} })
      })
    }
    try {
      await page.goto(form.path)
      await expect(page.getByRole('heading', { name: form.title, exact: true })).toBeVisible()
      await expect.poll(() => refreshes).toBe(1)
      const checking = page.getByRole('button', { name: 'Verificando sessão...', exact: true })
      await expect(checking).toBeDisabled()
      await page.getByLabel(form.field, { exact: true }).fill(form.value)
      await page.keyboard.press('Enter')
      await page
        .locator('form')
        .evaluate((element) =>
          element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
        )
      await expect(page.locator('form').getByRole('alert')).toHaveCount(0)
      expect(submissions).toBe(0)
      release()
      await expect(page.getByRole('button', { name: form.submit, exact: true })).toBeEnabled()
      await expect(page.getByLabel(form.field, { exact: true })).toHaveValue(form.value)
      expect(refreshes).toBe(1)
      expect(submissions).toBe(0)
      await expectNoBlockingAxeViolations(page, testInfo, `public-session-${form.path.slice(1)}`)
    } finally {
      release()
    }
  })
}

test('HTML público mostra formulários antes da hidratação, com envio desabilitado', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
    viewport: { width: 320, height: 844 },
  })
  try {
    const page = await context.newPage()
    for (const form of forms) {
      await page.goto(form.path)
      await expect(page.getByRole('heading', { name: form.title, exact: true })).toBeVisible()
      await expect(
        page.getByRole('button', { name: 'Verificando sessão...', exact: true }),
      ).toBeDisabled()
      await expect(page.locator('form')).toHaveAttribute('method', 'post')
      await expect(page.getByLabel(form.field, { exact: true })).toBeDisabled()
    }
  } finally {
    await context.close()
  }
})

test('cadastro aguarda sessão válida sem enviar credenciais e redireciona ao dashboard', async ({
  page,
}) => {
  let release = () => {}
  let refreshes = 0
  await page.route('**/auth/refresh', async (route) => {
    refreshes += 1
    if (refreshes === 1)
      await new Promise<void>((resolve) => {
        release = resolve
      })
    await route.fulfill({ json: { accessToken: 'public-session-fixture' } })
  })
  await page.route('**/auth/me', (route) =>
    route.fulfill({
      json: {
        user: {
          id: 'public-session',
          companyId: 'public-company',
          name: 'Usuário de teste',
          email: 'public@taxsim.test',
          role: 'OWNER',
        },
        company: {
          id: 'public-company',
          name: 'Empresa de teste',
          document: '11222333000181',
          taxRegime: 'LUCRO_REAL',
          municipioCode: 3550308,
          uf: 'SP',
        },
      },
    }),
  )
  try {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: 'Criar conta no TaxSim' })).toBeVisible()
    await expect.poll(() => refreshes).toBe(1)
    await expect(
      page.getByRole('button', { name: 'Verificando sessão...', exact: true }),
    ).toBeDisabled()
    release()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Criar conta no TaxSim' })).toHaveCount(0)
  } finally {
    release()
  }
})
