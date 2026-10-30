import { expect, test, type Page } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'

const profile = {
  user: {
    id: 'session-test',
    companyId: 'session-company',
    name: 'Usuário de teste',
    email: 'session@taxsim.test',
    role: 'OWNER',
  },
  company: {
    id: 'session-company',
    name: 'Empresa de teste',
    document: '11222333000181',
    taxRegime: 'LUCRO_REAL',
    municipioCode: 3550308,
    uf: 'SP',
  },
}

test('credenciais inválidas não renovam sessão nem substituem o erro ou apagam campos', async ({
  page,
}) => {
  let refreshes = 0
  let logins = 0
  await page.route('**/auth/refresh', (route) => {
    refreshes += 1
    return route.fulfill({ status: 401, json: { error: { message: 'Missing refresh token' } } })
  })
  await page.route('**/auth/login', (route) => {
    logins += 1
    return route.fulfill({
      status: 401,
      json: { error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } },
    })
  })
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('wrong@taxsim.test')
  await page.getByLabel('Senha', { exact: true }).fill('WrongPassword!')
  const initialRefreshes = refreshes
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('form').getByRole('alert')).toContainText('E-mail ou senha inválidos.')
  await expect(page.locator('form').getByRole('alert')).not.toContainText('refresh token')
  await expect(page.getByLabel('E-mail')).toHaveValue('wrong@taxsim.test')
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('WrongPassword!')
  expect(logins).toBe(1)
  expect(refreshes).toBe(initialRefreshes)
  await expect(page).toHaveURL(/\/login$/)
})

async function mockProfile(page: Page, status = 200) {
  await page.route('**/auth/me', (route) =>
    route.fulfill({
      status,
      json:
        status === 200 ? profile : { error: { code: 'UNAUTHORIZED', message: 'Sessão inválida' } },
    }),
  )
}

test('CTAs independem de refresh lento; confirmação acrescenta dashboard', async ({
  page,
}, testInfo) => {
  await page.clock.install()
  let release!: () => void
  let calls = 0
  await page.route('**/auth/refresh', async (route) => {
    calls += 1
    await new Promise<void>((resolve) => {
      release = resolve
    })
    await route.fulfill({ json: { accessToken: 'fixture-token' } })
  })
  await mockProfile(page)
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Experimentar demonstração' }).first()).toBeVisible()
  await expect.poll(() => calls).toBe(1)
  await page.clock.fastForward(3000)
  await expect(page.getByRole('link', { name: 'Ir ao dashboard' }).first()).not.toBeVisible()
  release()
  await expect(page.getByRole('link', { name: 'Ir ao dashboard' }).first()).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Experimentar demonstração' }).first(),
  ).toHaveAttribute('href', '/register')
  await expect(page).toHaveURL(/\/$/)
  await expectNoBlockingAxeViolations(page, testInfo, 'sessao-lenta-confirmada')
})

test('timeout protegido mostra recuperação, esqueleto sem dados e nenhum refresh automático', async ({
  page,
}, testInfo) => {
  await page.clock.install()
  let calls = 0
  await page.route('**/auth/refresh', () => {
    calls += 1
  })
  await page.goto('/simulation')
  await expect.poll(() => calls).toBe(1)
  await page.clock.fastForward(2600)
  await expect(page.getByRole('status', { name: '' })).toContainText('Verificando sessão')
  await expect(page.getByRole('button', { name: 'Simular' })).toHaveCount(0)
  await page.clock.fastForward(5500)
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ir para o login' })).toBeVisible()
  expect(calls).toBe(1)
  await expect(page).toHaveURL(/\/simulation$/)
  await expectNoBlockingAxeViolations(page, testInfo, 'sessao-timeout-protegido')
})

test('sessão inválida no me não provoca outro refresh nem redireciona a landing', async ({
  page,
}) => {
  let calls = 0
  await page.route('**/auth/refresh', (route) => {
    calls += 1
    return route.fulfill({ json: { accessToken: 'fixture-token' } })
  })
  await mockProfile(page, 401)
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
  expect(calls).toBe(1)
  await expect(page).toHaveURL(/\/$/)
})

test('falha transitória do me repete só a leitura uma vez', async ({ page }) => {
  let refreshes = 0
  let reads = 0
  await page.route('**/auth/refresh', (route) => {
    refreshes += 1
    return route.fulfill({ json: { accessToken: 'fixture-token' } })
  })
  await page.route('**/auth/me', (route) => {
    reads += 1
    return route.fulfill({ status: reads === 1 ? 503 : 200, json: reads === 1 ? {} : profile })
  })
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Ir ao dashboard' }).first()).toBeVisible()
  expect(refreshes).toBe(1)
  expect(reads).toBe(2)
})

test('login mantém os campos durante retry manual e outro timeout', async ({ page }, testInfo) => {
  await page.clock.install()
  let calls = 0
  await page.route('**/auth/refresh', (route) => {
    calls += 1
    if (calls === 1) return route.fulfill({ status: 503, json: {} })
  })
  await page.goto('/login')
  await page.getByLabel('E-mail').fill('preservar@taxsim.test')
  await page.getByLabel('Senha', { exact: true }).fill('TextoDeTeste!')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect.poll(() => calls).toBe(2)
  await expect(page.getByLabel('E-mail')).toHaveValue('preservar@taxsim.test')
  await page.clock.fastForward(8100)
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByLabel('E-mail')).toHaveValue('preservar@taxsim.test')
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('TextoDeTeste!')
  await expectNoBlockingAxeViolations(page, testInfo, 'login-preservado')
})

test('cadastro mantém dados quando a verificação manual falha', async ({ page }) => {
  await page.route('**/auth/refresh', (route) => route.fulfill({ status: 503, json: {} }))
  await page.goto('/register')
  await page.getByLabel('Nome da empresa').fill('Empresa preservada')
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByLabel('Nome da empresa')).toHaveValue('Empresa preservada')
})

test('simulação preserva linhas preenchidas quando a renovação falha tecnicamente', async ({
  page,
}) => {
  let refreshes = 0
  let denyReads = false
  await page.addInitScript(() =>
    localStorage.setItem('taxsim:onboarding:session-test:completed:v1', 'true'),
  )
  await page.route('**/auth/refresh', (route) => {
    refreshes += 1
    return route.fulfill({
      status: refreshes === 1 ? 200 : 503,
      json: refreshes === 1 ? { accessToken: 'fixture-token' } : {},
    })
  })
  await mockProfile(page)
  await page.route('**/products?**', (route) =>
    route.fulfill({ json: { data: [], total: 0, page: 1, limit: 20 } }),
  )
  await page.route('**/ncm/**', (route) =>
    route.fulfill({ status: denyReads ? 401 : 200, json: [] }),
  )
  await page.goto('/simulation')
  await page.getByRole('button', { name: 'NCM manual' }).click()
  await page.getByLabel('Preço Unitário (R$)').fill('100000')
  await page.getByLabel('Quantidade', { exact: true }).fill('2')
  denyReads = true
  await page.getByRole('combobox', { name: 'Código NCM' }).fill('84713012')
  await page.getByLabel('Quantidade', { exact: true }).focus()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Código NCM' })).toHaveValue('84713012')
  await expect(page.getByLabel('Quantidade', { exact: true })).toHaveValue('2')
  await expect(page.getByLabel('Preço Unitário (R$)')).toHaveValue(/1\.000,00/)
  await expect(page).toHaveURL(/\/simulation$/)
})
