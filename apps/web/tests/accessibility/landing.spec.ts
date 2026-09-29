import { expect, test } from '@playwright/test'
import { expectNoBlockingAxeViolations } from './axe'
import { authenticate } from './helpers'

const disclaimer =
  'Projeto de demonstração técnica, sem vínculo com a Receita Federal. Não deve ser usado para cálculos fiscais reais.'

test.describe('landing pública', () => {
  test('visitante vê posicionamento, CTA e metadados públicos', async ({ page }, testInfo) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Engenharia fiscal para uma reforma em movimento.',
      }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: /Experimentar demonstração/ }).first()).toHaveAttribute(
      'href',
      '/register',
    )
    await expect(page.getByText(disclaimer)).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://taxsim-web.duckdns.org',
    )
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expectNoBlockingAxeViolations(page, testInfo, 'landing-visitante')
  })

  test('sessão autenticada mantém a landing e oferece o dashboard', async ({ page }, testInfo) => {
    await authenticate(page, '/')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: /Ir ao dashboard/ }).first()).toHaveAttribute(
      'href',
      '/dashboard',
    )
    await expect(page.getByRole('link', { name: /Experimentar demonstração/ })).toHaveCount(0)
    await expectNoBlockingAxeViolations(page, testInfo, 'landing-autenticada')
  })
})
